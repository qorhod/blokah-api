
// // utils/multerConfig.js
// const multer = require('multer');

// // الحدود القصوى للأحجام
// const MAX_IMAGE_SIZE = 2 * 1024 * 1024;    // 2MB للصور
// const MAX_VIDEO_SIZE = 50 * 1024 * 1024;     // 50MB للفيديو
// const MAX_PDF_SIZE   = 5 * 1024 * 1024;      // 5MB لملفات PDF

// // التخزين المؤقت في الذاكرة (لرفع الملفات إلى S3 لاحقًا)
// const storage = multer.memoryStorage();

// /**
//  * دالة الفلترة (fileFilter):
//  * - تقبل صور الحقول: images, personalPhotos, aboutImages
//  * - تقبل الفيديوهات لحقل videos
//  * - تقبل ملفات PDF لحقل certificates
//  * - تقبل صور الشهادات لحقل certificateUrl
//  */
// function fileFilter(req, file, cb) {
//   // الأنواع المسموحة للصور
//   const allowedImageTypes = [
//     'image/jpeg',
//     'image/png',
//     'image/webp'
//   ];

//   // الأنواع المسموحة للفيديو
//   const allowedVideoTypes = [
//     'video/mp4',
//     'video/quicktime',
//     'video/webm'
//   ];

//   // الأنواع المسموحة لـ PDF
//   const allowedPdfTypes = [
//     'application/pdf'
//   ];

//   // التحقق من اسم الحقل والأنواع والحجم المناسب

//   if (file.fieldname === 'images' ||
//       file.fieldname === 'personalPhotos' ||
//       file.fieldname === 'aboutImages'||
//       file.fieldname === 'companyLogos'

      
//     ) {
//     // هذه الحقول مخصصة للصور فقط
//     if (!allowedImageTypes.includes(file.mimetype)) {
//       return cb(
//         new Error(`لا يسمح إلا بصور JPG/PNG/WEBP في حقل "${file.fieldname}"`),
//         false
//       );
//     }
//     if (file.size > MAX_IMAGE_SIZE) {
//       return cb(
//         new Error(`حجم الصورة في حقل "${file.fieldname}" أكبر من ${MAX_IMAGE_SIZE / (1024 * 1024)}MB`),
//         false
//       );
//     }
//     return cb(null, true);
//   } else if (file.fieldname === 'videos') {
//     // حقل الفيديوهات
//     if (!allowedVideoTypes.includes(file.mimetype)) {
//       return cb(
//         new Error('لا يسمح إلا بفيديوهات MP4/MOV/WEBM في حقل "videos"'),
//         false
//       );
//     }
//     if (file.size > MAX_VIDEO_SIZE) {
//       return cb(
//         new Error(`حجم الفيديو أكبر من ${MAX_VIDEO_SIZE / (1024 * 1024)}MB`),
//         false
//       );
//     }
//     return cb(null, true);
//   } else if (file.fieldname === 'certificates') {
//     // حقل ملفات PDF
//     if (!allowedPdfTypes.includes(file.mimetype)) {
//       return cb(
//         new Error('لا يسمح إلا بملفات PDF في حقل "certificates"'),
//         false
//       );
//     }
//     if (file.size > MAX_PDF_SIZE) {
//       return cb(
//         new Error(`حجم ملف PDF أكبر من ${MAX_PDF_SIZE / (1024 * 1024)}MB`),
//         false
//       );
//     }
//     return cb(null, true);
//   } else if (file.fieldname === 'certificateUrl') {
//     // حقل صور الشهادات (يقبل فقط صور)
//     if (!allowedImageTypes.includes(file.mimetype)) {
//       return cb(
//         new Error('لا يسمح إلا بصور JPG/PNG/WEBP في حقل "certificateUrl"'),
//         false
//       );
//     }
//     if (file.size > MAX_IMAGE_SIZE) {
//       return cb(
//         new Error(`حجم الصورة في حقل "certificateUrl" أكبر من ${MAX_IMAGE_SIZE / (1024 * 1024)}MB`),
//         false
//       );
//     }
//     return cb(null, true);
//   } else {
//     // حقل غير متوقع
//     return cb(new Error(`اسم الحقل غير مسموح: ${file.fieldname}`), false);
//   }
// }

// // تهيئة Multer مع حدود عامة (50MB للملف الواحد)
// const upload = multer({
//   storage,
//   limits: { fileSize: 50 * 1024 * 1024 }, // 50MB حداً أقصى لكل ملف
//   fileFilter
// }).fields([
//   { name: 'images', maxCount: 10 },         // حقل images (حتى 10 صور)
//   { name: 'videos', maxCount: 3 },          // حقل videos (حتى 3 فيديوهات)
//   { name: 'personalPhotos', maxCount: 10 }, // حقل صور الموظفين (حتى 10)
//   { name: 'certificates', maxCount: 1 },    // حقل ملفات PDF (حتى 1 ملف)
//   { name: 'certificateUrl', maxCount: 1 },  // حقل صور الشهادات (حتى 1 صورة)
//   { name: 'aboutImages', maxCount: 10 },
//   { name: 'companyLogos', maxCount: 10 }

//        // حقل aboutImages (حتى 10 صور، يمكنك ضبط العدد حسب الحاجة)
// ]);

// module.exports = upload;

//
//  +ـ+ـ+ـ+ـ+


// // utils/multerConfig.js
// const multer = require('multer');

// // الحدود القصوى للأحجام
// const MAX_IMAGE_SIZE = 2 * 1024 * 1024;    // 2MB للصور
// const MAX_VIDEO_SIZE = 50 * 1024 * 1024;   // 50MB للفيديو
// const MAX_PDF_SIZE   = 5 * 1024 * 1024;    // 5MB لملفات PDF

// // التخزين المؤقت في الذاكرة (لرفع الملفات إلى S3 لاحقًا)
// const storage = multer.memoryStorage();

// /**
//  * دالة الفلترة (fileFilter):
//  * - تقبل صور الحقول: images, personalPhotos, aboutImages, companyLogos, logo
//  * - تقبل الفيديوهات لحقل videos
//  * - تقبل ملفات PDF لحقل certificates
//  * - تقبل صور الشهادات لحقل certificateUrl
//  */
// function fileFilter(req, file, cb) {
//   // الأنواع المسموحة للصور
//   const allowedImageTypes = [
//     'image/jpeg',
//     'image/png',
//     'image/webp'
//   ];

//   // الأنواع المسموحة للفيديو
//   const allowedVideoTypes = [
//     'video/mp4',
//     'video/quicktime',
//     'video/webm'
//   ];

//   // الأنواع المسموحة لـ PDF
//   const allowedPdfTypes = [
//     'application/pdf'
//   ];

//   // التحقق من اسم الحقل والأنواع والحجم المناسب
//   if (
//     file.fieldname === 'images' ||
//     file.fieldname === 'personalPhotos' ||
//     file.fieldname === 'aboutImages' ||
//     file.fieldname === 'companyLogos' ||
//     file.fieldname === 'logo'
//   ) {
//     // هذه الحقول مخصصة للصور فقط
//     if (!allowedImageTypes.includes(file.mimetype)) {
//       return cb(
//         new Error(`لا يسمح إلا بصور JPG/PNG/WEBP في حقل "${file.fieldname}"`),
//         false
//       );
//     }
//     if (file.size > MAX_IMAGE_SIZE) {
//       return cb(
//         new Error(`حجم الصورة في حقل "${file.fieldname}" أكبر من ${MAX_IMAGE_SIZE / (1024 * 1024)}MB`),
//         false
//       );
//     }
//     return cb(null, true);

//   } else if (file.fieldname === 'videos') {
//     // حقل الفيديوهات
//     if (!allowedVideoTypes.includes(file.mimetype)) {
//       return cb(
//         new Error('لا يسمح إلا بفيديوهات MP4/MOV/WEBM في حقل "videos"'),
//         false
//       );
//     }
//     if (file.size > MAX_VIDEO_SIZE) {
//       return cb(
//         new Error(`حجم الفيديو أكبر من ${MAX_VIDEO_SIZE / (1024 * 1024)}MB`),
//         false
//       );
//     }
//     return cb(null, true);

//   } else if (file.fieldname === 'certificates') {
//     // حقل ملفات PDF
//     if (!allowedPdfTypes.includes(file.mimetype)) {
//       return cb(
//         new Error('لا يسمح إلا بملفات PDF في حقل "certificates"'),
//         false
//       );
//     }
//     if (file.size > MAX_PDF_SIZE) {
//       return cb(
//         new Error(`حجم ملف PDF أكبر من ${MAX_PDF_SIZE / (1024 * 1024)}MB`),
//         false
//       );
//     }
//     return cb(null, true);

//   } else if (file.fieldname === 'certificateUrl') {
//     // حقل صور الشهادات (يقبل فقط صور)
//     if (!allowedImageTypes.includes(file.mimetype)) {
//       return cb(
//         new Error('لا يسمح إلا بصور JPG/PNG/WEBP في حقل "certificateUrl"'),
//         false
//       );
//     }
//     if (file.size > MAX_IMAGE_SIZE) {
//       return cb(
//         new Error(`حجم الصورة في حقل "certificateUrl" أكبر من ${MAX_IMAGE_SIZE / (1024 * 1024)}MB`),
//         false
//       );
//     }
//     return cb(null, true);

//   } else {
//     // حقل غير متوقع
//     return cb(new Error(`اسم الحقل غير مسموح: ${file.fieldname}`), false);
//   }
// }

// // تهيئة Multer مع حدود عامة (50MB للملف الواحد)
// const upload = multer({
//   storage,
//   limits: { fileSize: 50 * 1024 * 1024 }, // 50MB حداً أقصى لكل ملف
//   fileFilter
// }).fields([
//   { name: 'images', maxCount: 10 },         // حقل images (حتى 10 صور)
//   { name: 'videos', maxCount: 3 },          // حقل videos (حتى 3 فيديوهات)
//   { name: 'personalPhotos', maxCount: 10 }, // حقل صور الموظفين (حتى 10)
//   { name: 'certificates', maxCount: 1 },    // حقل ملفات PDF (حتى 1 ملف)
//   { name: 'certificateUrl', maxCount: 1 },  // حقل صور الشهادات (حتى 1 صورة)
//   { name: 'aboutImages', maxCount: 10 },    // حقل aboutImages (حتى 10 صور)
//   { name: 'companyLogos', maxCount: 10 },   // حقل companyLogos (حتى 10 صور)
//   { name: 'logo', maxCount: 1 }             // حقل logo (صورة واحدة)
// ]);

// module.exports = upload;


// ++++ـــ+++ـ+ـ++++

// const multer = require('multer');

// // الحدود القصوى للأحجام
// const MAX_IMAGE_SIZE = 2 * 1024 * 1024;    // 2MB للصور
// const MAX_VIDEO_SIZE = 50 * 1024 * 1024;   // 50MB للفيديو
// const MAX_PDF_SIZE   = 5 * 1024 * 1024;    // 5MB لملفات PDF

// // التخزين المؤقت في الذاكرة (لرفع الملفات إلى S3 لاحقًا)
// const storage = multer.memoryStorage();

// /**
//  * دالة الفلترة (fileFilter):
//  * - تقبل الصور لحقل file أو الحقول المعروفة
//  * - تقبل الفيديو لحقل file أو videos
//  * - تقبل ملفات PDF لحقل certificates
//  * - تقبل صور الشهادات لحقل certificateUrl
//  */
// function fileFilter(req, file, cb) {
//   const allowedImageTypes = ['image/jpeg', 'image/png', 'image/webp'];
//   const allowedVideoTypes = ['video/mp4', 'video/quicktime', 'video/webm'];
//   const allowedPdfTypes = ['application/pdf'];

//   // ✅ دعم الحقل الموحد "file" (يُستخدم في uploadSingle)
//   if (file.fieldname === 'file') {
//     if (allowedImageTypes.includes(file.mimetype)) {
//       if (file.size > MAX_IMAGE_SIZE) {
//         return cb(new Error(`حجم الصورة أكبر من ${MAX_IMAGE_SIZE / (1024 * 1024)}MB`), false);
//       }
//       return cb(null, true);
//     } else if (allowedVideoTypes.includes(file.mimetype)) {
//       if (file.size > MAX_VIDEO_SIZE) {
//         return cb(new Error(`حجم الفيديو أكبر من ${MAX_VIDEO_SIZE / (1024 * 1024)}MB`), false);
//       }
//       return cb(null, true);
//     } else {
//       return cb(new Error('الملف المرسل ليس صورة أو فيديو مسموح به.'), false);
//     }
//   }

//   // ✅ الحقول المخصصة للصور فقط
//   if (
//     file.fieldname === 'images' ||
//     file.fieldname === 'personalPhotos' ||
//     file.fieldname === 'aboutImages' ||
//     file.fieldname === 'companyLogos' ||
//     file.fieldname === 'logo'
//   ) {
//     if (!allowedImageTypes.includes(file.mimetype)) {
//       return cb(new Error(`لا يسمح إلا بصور JPG/PNG/WEBP في حقل "${file.fieldname}"`), false);
//     }
//     if (file.size > MAX_IMAGE_SIZE) {
//       return cb(new Error(`حجم الصورة في حقل "${file.fieldname}" أكبر من ${MAX_IMAGE_SIZE / (1024 * 1024)}MB`), false);
//     }
//     return cb(null, true);
//   }

//   // ✅ حقل الفيديوهات
//   if (file.fieldname === 'videos') {
//     if (!allowedVideoTypes.includes(file.mimetype)) {
//       return cb(new Error('لا يسمح إلا بفيديوهات MP4/MOV/WEBM في حقل "videos"'), false);
//     }
//     if (file.size > MAX_VIDEO_SIZE) {
//       return cb(new Error(`حجم الفيديو أكبر من ${MAX_VIDEO_SIZE / (1024 * 1024)}MB`), false);
//     }
//     return cb(null, true);
//   }

//   // ✅ حقل ملفات PDF
//   if (file.fieldname === 'certificates') {
//     if (!allowedPdfTypes.includes(file.mimetype)) {
//       return cb(new Error('لا يسمح إلا بملفات PDF في حقل "certificates"'), false);
//     }
//     if (file.size > MAX_PDF_SIZE) {
//       return cb(new Error(`حجم ملف PDF أكبر من ${MAX_PDF_SIZE / (1024 * 1024)}MB`), false);
//     }
//     return cb(null, true);
//   }

//   // ✅ حقل صورة الشهادة
//   if (file.fieldname === 'certificateUrl') {
//     if (!allowedImageTypes.includes(file.mimetype)) {
//       return cb(new Error('لا يسمح إلا بصور JPG/PNG/WEBP في حقل "certificateUrl"'), false);
//     }
//     if (file.size > MAX_IMAGE_SIZE) {
//       return cb(new Error(`حجم الصورة في حقل "certificateUrl" أكبر من ${MAX_IMAGE_SIZE / (1024 * 1024)}MB`), false);
//     }
//     return cb(null, true);
//   }

//   // ❌ أي حقل غير معروف
//   return cb(new Error(`اسم الحقل غير مسموح: ${file.fieldname}`), false);
// }

// // إعداد multer الخام
// const baseUpload = multer({
//   storage,
//   limits: { fileSize: 50 * 1024 * 1024 },
//   fileFilter
// });

// // تصدير ثلاث طرق:
// module.exports = {
//   uploadSingle: baseUpload.single('file'), // لرفع ملف واحد (صورة أو فيديو)
//   uploadMultiple: baseUpload.fields([      // لرفع حقول متعددة كما هو سابقاً
//     { name: 'images', maxCount: 10 },
//     { name: 'videos', maxCount: 3 },
//     { name: 'personalPhotos', maxCount: 10 },
//     { name: 'certificates', maxCount: 1 },
//     { name: 'certificateUrl', maxCount: 1 },
//     { name: 'aboutImages', maxCount: 10 },
//     { name: 'companyLogos', maxCount: 10 },
//     { name: 'logo', maxCount: 1 }
//   ]),
//   uploadp: baseUpload // نسخة خام تستخدمها بالطريقة اللي تبغاها
// };



/* ───────────────────────────────
   utils/multerConfig.js
   إعداد Multer مع فلاتر الحجم/النوع
───────────────────────────────── */

const multer = require('multer');

// الحدود القصوى للأحجام
const MAX_IMAGE_SIZE = 2 * 1024 * 1024;    // 2 MB للصور
const MAX_VIDEO_SIZE = 50 * 1024 * 1024;   // 50 MB للفيديو
const MAX_PDF_SIZE   = 5 * 1024 * 1024;    // 5 MB لملفات PDF

// التخزين المؤقت في الذاكرة (لرفع الملفات إلى S3 لاحقًا)
const storage = multer.memoryStorage();

/*───────────────────────────────
  دالة الفلترة للملفات المقبولة
────────────────────────────────*/
function fileFilter(req, file, cb) {
  const allowedImageTypes = ['image/jpeg', 'image/png', 'image/webp'];
  const allowedVideoTypes = ['video/mp4', 'video/quicktime', 'video/webm'];
  const allowedPdfTypes   = ['application/pdf'];

  // حقل موحّد file (يُستخدم في uploadSingle)
  if (file.fieldname === 'file') {
    if (allowedImageTypes.includes(file.mimetype)) {
      if (file.size > MAX_IMAGE_SIZE) {
        return cb(new Error(`حجم الصورة أكبر من ${MAX_IMAGE_SIZE / (1024 * 1024)}MB`), false);
      }
      return cb(null, true);
    }
    if (allowedVideoTypes.includes(file.mimetype)) {
      if (file.size > MAX_VIDEO_SIZE) {
        return cb(new Error(`حجم الفيديو أكبر من ${MAX_VIDEO_SIZE / (1024 * 1024)}MB`), false);
      }
      return cb(null, true);
    }
    return cb(new Error('الملف المرسل ليس صورة أو فيديو مسموح به.'), false);
  }

  // الحقول الخاصة بالصور
  if (
    ['images', 'personalPhotos', 'aboutImages', 'companyLogos', 'logo']
      .includes(file.fieldname)
  ) {
    if (!allowedImageTypes.includes(file.mimetype)) {
      return cb(new Error(`لا يسمح إلا بصور JPG/PNG/WEBP في حقل "${file.fieldname}"`), false);
    }
    if (file.size > MAX_IMAGE_SIZE) {
      return cb(new Error(`حجم الصورة في حقل "${file.fieldname}" أكبر من ${MAX_IMAGE_SIZE / (1024 * 1024)}MB`), false);
    }
    return cb(null, true);
  }

  // حقل الفيديوهات
  if (file.fieldname === 'videos') {
    if (!allowedVideoTypes.includes(file.mimetype)) {
      return cb(new Error('لا يسمح إلا بفيديوهات MP4/MOV/WEBM في حقل "videos"'), false);
    }
    if (file.size > MAX_VIDEO_SIZE) {
      return cb(new Error(`حجم الفيديو أكبر من ${MAX_VIDEO_SIZE / (1024 * 1024)}MB`), false);
    }
    return cb(null, true);
  }

  // حقل ملفات PDF
  if (file.fieldname === 'certificates') {
    if (!allowedPdfTypes.includes(file.mimetype)) {
      return cb(new Error('لا يسمح إلا بملفات PDF في حقل "certificates"'), false);
    }
    if (file.size > MAX_PDF_SIZE) {
      return cb(new Error(`حجم ملف PDF أكبر من ${MAX_PDF_SIZE / (1024 * 1024)}MB`), false);
    }
    return cb(null, true);
  }

  // حقل صورة الشهادة
  if (file.fieldname === 'certificateUrl') {
    if (!allowedImageTypes.includes(file.mimetype)) {
      return cb(new Error('لا يسمح إلا بصور JPG/PNG/WEBP في حقل "certificateUrl"'), false);
    }
    if (file.size > MAX_IMAGE_SIZE) {
      return cb(new Error(`حجم الصورة في حقل "certificateUrl" أكبر من ${MAX_IMAGE_SIZE / (1024 * 1024)}MB`), false);
    }
    return cb(null, true);
  }

  // أي حقل غير معروف
  return cb(new Error(`اسم الحقل غير مسموح: ${file.fieldname}`), false);
}

/*───────────────────────────────
  تهيئة Multer الأساسية
────────────────────────────────*/
const baseUpload = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024 }, // حد عام: 50 MB
  fileFilter
});

/*───────────────────────────────
  ميدل وير جاهز لكل الحقول (uploadp)
────────────────────────────────*/
const uploadp = baseUpload.fields([
  { name: 'images',         maxCount: 10 },
  { name: 'videos',         maxCount: 3  },
  { name: 'personalPhotos', maxCount: 10 },
  { name: 'certificates',   maxCount: 1  },
  { name: 'certificateUrl', maxCount: 1  },
  { name: 'aboutImages',    maxCount: 10 },
  { name: 'companyLogos',   maxCount: 10 },
  { name: 'logo',           maxCount: 1  }
]);

/*───────────────────────────────
  نقاط التصدير
────────────────────────────────*/
module.exports = {
  // لرفع ملف واحد (صورة أو فيديو) في حقل "file"
  uploadSingle: baseUpload.single('file'),

  // لرفع عدة حقول متعدّدة حسب ما هو مذكور أعلاه
  uploadMultiple: baseUpload.fields([
    { name: 'images',         maxCount: 10 },
    { name: 'videos',         maxCount: 3  },
    { name: 'personalPhotos', maxCount: 10 },
    { name: 'certificates',   maxCount: 1  },
    { name: 'certificateUrl', maxCount: 1  },
    { name: 'aboutImages',    maxCount: 10 },
    { name: 'companyLogos',   maxCount: 10 },
    { name: 'logo',           maxCount: 1  }
  ]),

  // النسخة الجاهزة التي تستدعيها مباشرة: uploadp(req, res, cb)
  uploadp
};
