const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Joi = require('joi');
const User = require('../../models/user');
const axios = require('axios'); // استيراد axios لإرسال طلب إلى Google reCAPTCHA API

// استيراد الدوال المتعلقة بـ S3
const { uploadFileToS3, generateSignedUrl, deleteFileFromS3 } = require('../../utils/s3Service');
const multer = require('multer');
const { S3Client, CopyObjectCommand, DeleteObjectCommand } = require('@aws-sdk/client-s3');

// إعداد AWS S3
const s3 = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY,
    secretAccessKey: process.env.AWS_SECRET_KEY
  }
});

// إعداد multer للتعامل مع الملفات مع التحكم في الصيغة والحجم
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // حجم الملف المسموح به: 5 ميجابايت
  fileFilter: (req, file, cb) => {
    // السماح فقط بأنواع الصور JPEG و PNG
    const allowedFileTypes = ['image/jpeg', 'image/png'];

    // رفض أي ملف لا يتطابق مع الصيغ المدعومة
    if (!allowedFileTypes.includes(file.mimetype)) {
      return cb(new Error('نوع الملف غير مسموح. الصيغ المسموحة: JPEG, PNG.'), false);
    }

    cb(null, true); // قبول الملف إذا كانت الصيغة صحيحة
  }
});

// دالة لرفع الملفات إلى S3
exports.uploadFile = async (req, res) => {
  const { isPublic } = req.body;
  const file = req.file;

  // التحقق من أن الملف تم تحميله بنجاح
  if (!file) {
    return res.status(400).json({ error: 'لم يتم تحميل أي ملف.' });
  }

  // التحقق من نوع الملف مرة أخرى على مستوى الخادم
  const allowedFileTypes = ['image/jpeg', 'image/png'];
  if (!allowedFileTypes.includes(file.mimetype)) {
    return res.status(400).json({ error: 'نوع الملف غير مسموح. الصيغ المسموحة: JPEG, PNG.' });
  }

  const folder = isPublic === 'true' ? 'public-posts' : 'private-posts';

  try {
    const fileName = `${Date.now()}_${file.originalname}`;
    const data = await uploadFileToS3(file, fileName, folder);
    res.json({ message: 'تم رفع الملف بنجاح', url: data.Location });
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ error: 'فشل في رفع الملف. تحقق من الصيغة أو الحجم.' });
  }
};

exports.getPrivateFileUrl = async (req, res) => {
  const { fileName } = req.params;
  try {
    const url = await generateSignedUrl(fileName);  // توليد الرابط الموقّع

    if (url) {
      res.json({ url });  // تأكد من إرسال الرابط في الرد
    } else {
      res.status(404).json({ error: 'Failed to generate signed URL' });
    }
  } catch (error) {
    console.error('Error generating signed URL:', error);
    res.status(500).json({ error: 'Failed to generate signed URL' });
  }
};

// دالة لحذف الملفات من S3
exports.deleteFile = async (req, res) => {
  const { fileName, isPublic, isProfilePicture } = req.body;
  let folder;

  // إذا كان الملف مخصص للملف الشخصي يتم حذفه من profile-pictures
  if (isProfilePicture === 'true') {
    folder = 'profile-pictures';
  } else {
    folder = isPublic === 'true' ? 'public-posts' : 'private-posts';
  }

  try {
    await deleteFileFromS3(fileName, folder);
    res.json({ message: 'تم حذف الملف بنجاح' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'فشل في حذف الملف' });
  }
};

// دالة لنقل الملف بين المجلدات
exports.moveFile = async (req, res) => {
  const { fileName, currentLocation } = req.body;
  let fromFolder, toFolder;

  // تحديد الاتجاه: من الخاص إلى العام أو العكس
  if (currentLocation === 'private') {
    fromFolder = 'private-posts';
    toFolder = 'public-posts';
  } else if (currentLocation === 'public') {
    fromFolder = 'public-posts';
    toFolder = 'private-posts';
  } else {
    return res.status(400).json({ error: 'الموقع الحالي غير صحيح، يجب أن يكون private أو public' });
  }

  try {
    // نسخ الملف إلى المجلد الجديد
    const copyParams = {
      Bucket: process.env.BUCKET_NAME,
      CopySource: `${process.env.BUCKET_NAME}/${fromFolder}/${encodeURIComponent(fileName)}`,  // ترميز اسم الملف
      Key: `${toFolder}/${fileName}`
    };
    const copyResult = await s3.send(new CopyObjectCommand(copyParams));

    if (!copyResult) {
      return res.status(404).json({ error: 'فشل في نسخ الملف. تأكد من أن الملف موجود.' });
    }

    // حذف الملف من المجلد الأصلي بعد التأكد من نجاح النسخ
    const deleteParams = {
      Bucket: process.env.BUCKET_NAME,
      Key: `${fromFolder}/${fileName}`
    };
    await s3.send(new DeleteObjectCommand(deleteParams));

    res.json({ message: `تم نقل الملف بنجاح من ${fromFolder} إلى ${toFolder}` });
  } catch (error) {
    if (error.Code === 'NoSuchKey') {
      return res.status(404).json({ error: 'الملف الذي تحاول نقله غير موجود في الموقع المحدد.' });
    }
    console.error('Error moving file:', error);
    res.status(500).json({ error: 'فشل في نقل الملف' });
  }
};

// دالة لرفع الملفات إلى S3 (تدعم profile-pictures)
exports.uploadFile = async (req, res) => {
  const { isPublic, isProfilePicture } = req.body;
  let folder;

  // إذا كان الملف مخصص للملف الشخصي يتم وضعه في مجلد profile-pictures
  if (isProfilePicture === 'true') {
    folder = 'profile-pictures';
  } else {
    folder = isPublic === 'true' ? 'public-posts' : 'private-posts';
  }

  const file = req.file;

  // التحقق من أن الملف تم تحميله بنجاح
  if (!file) {
    return res.status(400).json({ error: 'لم يتم تحميل أي ملف.' });
  }

  // التحقق من نوع الملف مرة أخرى على مستوى الخادم
  const allowedFileTypes = ['image/jpeg', 'image/png'];
  if (!allowedFileTypes.includes(file.mimetype)) {
    return res.status(400).json({ error: 'نوع الملف غير مسموح. الصيغ المسموحة: JPEG, PNG.' });
  }

  try {
    const fileName = `${Date.now()}_${file.originalname}`;
    const data = await uploadFileToS3(file, fileName, folder);
    res.json({ message: 'تم رفع الملف بنجاح', url: data.Location });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'فشل في رفع الملف' });
  }
};
