


// هذا لضبط احجام الصور والفيديوهات وعددها التي يتم رفعها إلا امزون 
// utils/multerConfig.js
const multer = require('multer');

// حد أقصى لكل نوع
const MAX_IMAGE_SIZE = 2 * 1024 * 1024;    // 2MB للصور
const MAX_VIDEO_SIZE = 50 * 1024 * 1024;   // 50MB للفيديو

// التخزين المؤقت في الذاكرة
const storage = multer.memoryStorage();

/**
 * الفلتر (fileFilter) يتحقق من:
 * 1) هل الحقل "images" أم "videos"؟
 * 2) هل نوع الملف (mimetype) مدعوم؟
 * 3) هل الحجم ضمن الحد المناسب (2MB للصور، 50MB للفيديو)؟
 */
function fileFilter(req, file, cb) {
  // الصيغ المسموحة للصور
  const allowedImageTypes = [
    'image/jpeg',
    'image/png',
    'image/webp'
  ];

  // الصيغ المسموحة للفيديو
  const allowedVideoTypes = [
    'video/mp4',
    'video/quicktime',
    'video/webm'
  ];

  if (file.fieldname === 'images') {
    // 1) تحقق من mimetype
    if (!allowedImageTypes.includes(file.mimetype)) {
      return cb(
        new Error('لا يسمح إلا بصور JPG/PNG/WEBP في حقل "images"'),
        false
      );
    }
    // 2) تحقق من الحجم
    if (file.size > MAX_IMAGE_SIZE) {
      return cb(
        new Error(`حجم الصورة أكبر من ${MAX_IMAGE_SIZE / (1024 * 1024)}MB`),
        false
      );
    }
    cb(null, true);

  } else if (file.fieldname === 'videos') {
    if (!allowedVideoTypes.includes(file.mimetype)) {
      return cb(
        new Error('لا يسمح إلا بفيديوهات MP4/MOV/WEBM في حقل "videos"'),
        false
      );
    }
    if (file.size > MAX_VIDEO_SIZE) {
      return cb(
        new Error(`حجم الفيديو أكبر من ${MAX_VIDEO_SIZE / (1024 * 1024)}MB`),
        false
      );
    }
    cb(null, true);

  } else {
    // أي حقل آخر غير متوقع
    return cb(new Error(`اسم الحقل غير مسموح: ${file.fieldname}`), false);
  }
}

// ضبط الحقول: 10 صور، 3 فيديوهات
// نضع limits.fileSize=50MB حتى يمكن لـMulter قراءة الملفات حتى 50MB.
// ولو كانت صورة فوق 2MB، سيرفضها fileFilter يدويًا.
const upload = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB حداً أقصى ليتمكن من قراءة الفيديوهات الكبيرة
  fileFilter
}).fields([
  { name: 'images', maxCount: 10 },  // حتى 10 صور
  { name: 'videos', maxCount: 3 }    // حتى 3 فيديوهات
]);

module.exports = upload;
