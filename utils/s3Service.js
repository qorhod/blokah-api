const { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');  // استيراد getSignedUrl
const crypto = require('crypto');  // لاستيراد مكتبة لتوليد سلاسل عشوائية
require('dotenv').config();

// إعداد AWS S3
const s3 = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY,
    secretAccessKey: process.env.AWS_SECRET_KEY
  }
});

// دالة لرفع الملفات إلى S3 مع أرشفة الاسم
const uploadFileToS3 = async (file, userID, folder) => {
  // توليد سلسلة عشوائية
  const randomString = crypto.randomBytes(6).toString('hex');

  // استخراج امتداد الملف الأصلي
  const fileExtension = file.originalname.split('.').pop();

  // تكوين الاسم الجديد للملف
  const fileName = `${userID}-${Date.now()}-${randomString}.${fileExtension}`;

  const params = {
    Bucket: process.env.BUCKET_NAME,
    Key: `${folder}/${fileName}`,  // استخدام الاسم الجديد
    Body: file.buffer,
    ContentType: file.mimetype,
  };

  try {
    const command = new PutObjectCommand(params);
    await s3.send(command);

    // تكوين رابط الملف
    const fileUrl = `https://${process.env.BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${folder}/${fileName}`;
    
    // طباعة الرابط في الـ Console
    console.log(`تم رفع الملف بنجاح: ${fileUrl}`);

    return fileUrl;  // إرجاع الرابط
  } catch (error) {
    console.error('فشل رفع الملف:', error);
    throw error;
  }
};

// دالة لتوليد Signed URL للوصول إلى الملفات الخاصة
const generateSignedUrl = async (fileName) => {
  try {
    const params = {
      Bucket: process.env.BUCKET_NAME,
      Key: `private-posts/${fileName}`,
    };

    const command = new GetObjectCommand(params);

    // توليد الرابط الموقّع
    const url = await getSignedUrl(s3, command, { expiresIn: 3600 });

    // التحقق من وجود المعاملات المطلوبة
    console.log('Generating signed URL with params:', params);
    console.log('Generated signed URL:', url);

    return url;
  } catch (error) {
    console.error('Error generating signed URL:', error);
    throw error;
  }
};

// دالة لحذف الملفات من S3
const deleteFileFromS3 = async (fileName, folder) => {
  const params = {
    Bucket: process.env.BUCKET_NAME,
    Key: `${folder}/${fileName}`
  };

  const command = new DeleteObjectCommand(params);
  return await s3.send(command);
};

// تصدير الدوال لاستخدامها في مكان آخر
module.exports = {
  uploadFileToS3,
  generateSignedUrl,
  deleteFileFromS3
};
