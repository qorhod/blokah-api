// const { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } = require('@aws-sdk/client-s3');
// const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');  // استيراد getSignedUrl
// const crypto = require('crypto');  // لاستيراد مكتبة لتوليد سلاسل عشوائية
// require('dotenv').config();

// // إعداد AWS S3
// const s3 = new S3Client({
//   region: process.env.AWS_REGION,
//   credentials: {
//     accessKeyId: process.env.AWS_ACCESS_KEY,
//     secretAccessKey: process.env.AWS_SECRET_KEY
//   }
// });

// // دالة لرفع الملفات إلى S3 مع أرشفة الاسم
// const uploadFileToS3 = async (file, userID, folder) => {
//   // توليد سلسلة عشوائية
//   const randomString = crypto.randomBytes(6).toString('hex');

//   // استخراج امتداد الملف الأصلي
//   const fileExtension = file.originalname.split('.').pop();

//   // تكوين الاسم الجديد للملف
//   const fileName = `${userID}-${Date.now()}-${randomString}.${fileExtension}`;

//   const params = {
//     Bucket: process.env.BUCKET_NAME,
//     Key: `${folder}/${fileName}`,  // استخدام الاسم الجديد
//     Body: file.buffer,
//     ContentType: file.mimetype,
//   };

//   try {
//     const command = new PutObjectCommand(params);
//     await s3.send(command);

//     // تكوين رابط الملف
//     const fileUrl = `https://${process.env.BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${folder}/${fileName}`;
    
//     // طباعة الرابط في الـ Console
//     console.log(`تم رفع الملف بنجاح: ${fileUrl}`);

//     return fileUrl;  // إرجاع الرابط
//   } catch (error) {
//     console.error('فشل رفع الملف:', error);
//     throw error;
//   }
// };

// // دالة لتوليد Signed URL للوصول إلى الملفات الخاصة
// const generateSignedUrl = async (fileName) => {
//   try {
//     const params = {
//       Bucket: process.env.BUCKET_NAME,
//       Key: `private-posts/${fileName}`,
//     };

//     const command = new GetObjectCommand(params);

//     // توليد الرابط الموقّع
//     const url = await getSignedUrl(s3, command, { expiresIn: 3600 });

//     // التحقق من وجود المعاملات المطلوبة
//     console.log('Generating signed URL with params:', params);
//     console.log('Generated signed URL:', url);

//     return url;
//   } catch (error) {
//     console.error('Error generating signed URL:', error);
//     throw error;
//   }
// };

// // دالة لحذف الملفات من S3
// const deleteFileFromS3 = async (fileName, folder) => {
//   const params = {
//     Bucket: process.env.BUCKET_NAME,
//     Key: `${folder}/${fileName}`
//   };

//   const command = new DeleteObjectCommand(params);
//   return await s3.send(command);
// };

// // تصدير الدوال لاستخدامها في مكان آخر
// module.exports = {
//   uploadFileToS3,
//   generateSignedUrl,
//   deleteFileFromS3
// };





// utils/s3Service.js

const { S3Client, PutObjectCommand, DeleteObjectCommand } = require('@aws-sdk/client-s3');
const crypto = require('crypto');

// تهيئة عميل S3
const s3 = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY,
    secretAccessKey: process.env.AWS_SECRET_KEY,
  },
});

/**
 * دالة مساعدة لاستخراج الامتداد (extension) المناسب بناءً على mimetype
 * إذا أردت دعم تحويل حقيقي إلى MP4، ستحتاج لاستخدام FFmpeg أو AWS MediaConvert
 */
function getExtensionFromMimeType(mimetype) {
  switch (mimetype) {
    case 'image/jpeg':
      return '.jpg';
    case 'image/png':
      return '.png';
    
    // فيديوهات
    case 'video/mp4':
      return '.mp4';
    case 'video/quicktime':       // غالبًا صيغة .mov
      return '.mov';
    case 'video/x-msvideo':       // avi
      return '.avi';
    case 'video/x-matroska':      // mkv
      return '.mkv';
      
    default:
      // يمكنك إرجاع نص فارغ أو رمي خطأ 
      // إذا كنت لا تريد قبول أي صيغة أخرى
      return '';
  }
}

/**
 * دالة مساعدة لإنتاج اسم ملف فريد
 * تتضمن:
 *  - userId (مثلاً 125)
 *  - adId (مثلاً 343)
 *  - نوع الملف (image أو video) نحدده من mimetype
 *  - تاريخ اليوم بصيغة YYYYMMDD
 *  - وقت الساعة بصيغة HHMMSS
 *  - جزء عشوائي من 8 خانات
 *  - الامتداد (.jpg أو .png أو .mov أو ...)
 */
function generateFileName(file, userId, adId) {
  // استخرج الامتداد من نوع الملف
  const extension = getExtensionFromMimeType(file.mimetype);

  // حدّد هل الملف صورة أم فيديو
  let fileType = 'file';
  if (file.mimetype.startsWith('image/')) {
    fileType = 'image';
  } else if (file.mimetype.startsWith('video/')) {
    fileType = 'video';
  }

  // التاريخ والوقت
  const now = new Date();
  const datePart = now.toISOString().split('T')[0].replace(/-/g, ''); // مثل 20230909
  const timePart = now.toTimeString().split(' ')[0].replace(/:/g, ''); // مثل 124530

  // جزء عشوائي من 8 خانات
  const randomStr = crypto.randomBytes(4).toString('hex'); // مثال: a1b2c3d4

  // مثال نهائي:
  //  user-125_ad-343_image_20230909_124530_a1b2c3d4.jpg
  //  user-125_ad-343_video_20230909_124530_a1b2c3d4.mov
  return `user-${userId}_ad-${adId}_${fileType}_${datePart}_${timePart}_${randomStr}${extension}`;
}

/**
 * رفع ملف واحد إلى S3
 * - نولّد اسم الملف تلقائيًا (بدل استقباله من الخارج)
 * - نرفعه كما هو (لا يوجد تحويل للصيغة)
 * @param {Object} file  - كائن الملف من multer (يحوي buffer, mimetype, إلخ)
 * @param {String} folder - اسم المجلد (path) داخل الـBucket (مثلاً "public-posts")
 * @param {String|Number} userId - معرّف المستخدم
 * @param {String|Number} adId   - معرّف الإعلان
 * @returns {Promise<String>} - رابط (URL) الملف المرفوع
 */
async function uploadFileToS3p(file, folder, userId, adId) {
  if (!process.env.BUCKET_NAME) {
    throw new Error('لم يتم تحديد اسم الحاوية (BUCKET_NAME) في متغيرات البيئة.');
  }

  // بناء اسم الملف
  const fileName = generateFileName(file, userId, adId);

  // المسار الكامل للملف في S3
  const key = `${folder}/${fileName}`;

  const params = {
    Bucket: process.env.BUCKET_NAME,
    Key: key,
    Body: file.buffer,
    ContentType: file.mimetype,
  };

  // تنفيذ الرفع
  await s3.send(new PutObjectCommand(params));

  // تكوين رابط الوصول
  return `https://${process.env.BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`;
}

/**
 * رفع عدّة ملفات (صور/فيديوهات) وإرجاع روابطها
 * @param {Object[]} files - مصفوفة من ملفات multer
 * @param {String} folder  - اسم المجلد (path) داخل الـBucket
 * @param {String|Number} userId - معرّف المستخدم
 * @param {String|Number} adId   - معرّف الإعلان
 * @returns {Promise<String[]>} مصفوفة من روابط الملفات المرفوعة
 */
async function uploadMultipleFilesToS3p(files, folder, userId, adId) {
  const links = [];
  for (const file of files) {
    const link = await uploadFileToS3p(file, folder, userId, adId);
    links.push(link);
  }
  return links;
}

/**
 * حذف ملف من S3
 * @param {String} fileKey - المسار الكامل للملف داخل الـBucket
 */
async function deleteFileFromS3p(fileKey) {
  if (!process.env.BUCKET_NAME) {
    throw new Error('لم يتم تحديد اسم الحاوية (BUCKET_NAME) في متغيرات البيئة.');
  }

  const params = {
    Bucket: process.env.BUCKET_NAME,
    Key: fileKey,
  };

  await s3.send(new DeleteObjectCommand(params));
}

module.exports = {
  uploadFileToS3p,
  uploadMultipleFilesToS3p,
  deleteFileFromS3p,
};
