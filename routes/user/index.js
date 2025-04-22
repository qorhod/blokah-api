const express = require('express');
const router = express.Router();
const userController = require('../../controllers/user/userController');
const { authenticateToken } = require('../../middleware/auth'); // استيراد authenticateToken
const multer = require('multer');

// إعداد multer للتعامل مع الملفات
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// // مسار لرفع الملفات إلى S3
// router.post('/upload', upload.single('file'),authenticateToken, userController.uploadPostFile);

// // مسار للوصول إلى البوستات الخاصة باستخدام Signed URLs
// router.get('/private-post/:fileName', authenticateToken, userController.getPrivateFileUrl);

// // مسار لحذف الملفات
// router.delete('/delete', authenticateToken, userController.deleteFile);


// // يحذف اي رابط في امزون هذا مجرد للختبار 
// router.post('/delete-file', userController.deleteFile2);




// // نقل الملف من إلى مجلد العام إلى مجلد الخاص والعكس 
// router.post('/move-file', authenticateToken, userController.moveFile);




// خاصة بشعارة مكاتب العقار 
// مسار لرفع الملفات إلى profile-pictures
// router.post('/upload-profile-picture', upload.single('file'),authenticateToken, userController.uploadProfileOrPostFile);

// مسار لحذف الملفات من profile-pictures
// router.delete('/delete-profile-picture',authenticateToken, userController.deleteFile);






// مسارات إدارة الإعلانات

// إنشاء إعلان جديد
// router.post('/ads', upload.array('images', 10), authenticateToken, userController.createAd); // استخدام upload.array للسماح بملفات متعددة
// router.post(
//   '/ads',
//   upload.fields([
//     { name: 'image', maxCount: 1 }, // صورة رئيسية واحدة
//     { name: 'images', maxCount: 10 }, // 10 صور إضافية كحد أقصى
//     { name: 'videos', maxCount: 3 }, // 3 فيديوهات كحد أقصى
//   ]),
//   authenticateToken,
//   userController.createAd
// );

// router.post('/ads', authenticateToken, userController.createAd);
// تعديل إعلان موجود
// router.put(
//     '/ads/:adId',
//     multer({
//       storage: multer.memoryStorage(),
//       limits: { fileSize: 20 * 1024 * 1024 }, // الحد الأقصى لحجم الملف 20 ميجابايت
//     }).fields([
//       { name: 'image', maxCount: 1 }, // صورة رئيسية واحدة
//       { name: 'images', maxCount: 10 }, // حتى 10 صور إضافية
//       { name: 'videos', maxCount: 3 }, // حتى 3 فيديوهات
//     ]),
//     authenticateToken, // ميدلوير التحقق من التوكن
//     userController.updateAd // استدعاء دالة التحديث
//   );
  
  //  حذف صورة من المصفوفه 
  // router.delete('/ads/:adId/image', authenticateToken, userController.deleteImageFromAd);
  // //حذف فيديو من المصفوفه 
  // router.delete('/ads/:adId/video', authenticateToken, userController.deleteVideoFromAd);
  
//   router.delete('/ads/:adId', authenticateToken, userController.deleteAd);
  
  
  // حذف إعلان
  // router.delete('/ads/:adId', authenticateToken, userController.deleteAd);
  
  
// تعديل إعلان موجود
// router.put('/ads/:adId', authenticateToken, userController.updateAd);

// حذف إعلان
// router.delete('/ads/:adId', authenticateToken, userController.deleteAd);


// مسارات إدارة الإعلانات//



// مسارات إدارة معلومات الموقع الإلكتروني
// إنشاء أو تحديث المعلومات الأساسية للموقع الإلكتروني
router.post('/website-information/basic', authenticateToken, userController.postBasicWebsiteInformation);

// جلب المعلومات الأساسية للموقع الإلكتروني
router.get('/website-information/basic', authenticateToken, userController.getBasicWebsiteInformation);

// حذف معلومات الموقع الإلكتروني الأساسية
router.delete('/website-information/basic', authenticateToken, userController.deleteBasicWebsiteInformation);







// // لحذف الصورة فقط 
// router.put(
//     '/ads/:id/image',
//     multer({
//       storage: multer.memoryStorage(),
//       limits: { fileSize: 20 * 1024 * 1024 }, // الحد الأقصى لحجم الملف 20 ميجابايت
//     }).fields([
//       { name: 'image', maxCount: 1 }, // صورة رئيسية واحدة
//     ]),
//     userController.updateAdImage // استدعاء دالة التحديث
//   );
  

// جلب اعلانات مستخدم معين
// router.get('/ads/user/:userId', userController.getUserAds);




// **المسار الجديد للوصول إلى بيانات المستخدم باستخدام domainName**
router.get('/profile/domain/:domainName', userController.getUserByDomain);


// جلب بيانات الاعلان بستخدام id الاعلان 

router.get('/ads/:domainName/:id', userController.getAdById);


// عرض الخريطة باسخدام الرابط 

router.get('/ads/websiteUrl/:websiteUrl/:id', userController.getAdByIdForWebsiteUrl);

// خاص في في تغذية الخريطه 

router.post('/ads/map',upload.none(), userController.getAdsWithinBounds);

// خاص في تغذيه الخريطه باستخدام الرابط 
router.post('/ads/mapForWebsiteUrl',upload.none(), userController.getAdsWithinBoundsForWebsiteUrl);



// جلب بيانات الاعلان بستخدام id الاعلان //

router.get('/ads/list', authenticateToken, userController.getUserAdss);

// مسار للحصول على تفاصيل إعلان معين
router.get('/ads/details/:adId', authenticateToken, userController.getAdDetails);

// مسار للحصول على أحدث الإعلانات
router.get('/ads/latest', authenticateToken, userController.getLatestAds);

// مسار للبحث في الإعلانات
router.get('/ads/search', authenticateToken, userController.searchAds);
// جلب جميع العلانات للميتخدم   باستخدام التوكن 



// مثلاً:
router.post('/ads/draft', authenticateToken, userController.createDraftAd);

router.put('/ads/1/:adId', authenticateToken, userController.updateAdMedia);
router.get('/ads/:adId', authenticateToken, userController.getAdByIdd);


// حذف اعلان بعد معالجة مع s3 
router.delete('/ads/1/:adId',authenticateToken, userController.deleteAdd);

// التحكم في حالات الاعلان 
router.post('/ads/state/:adId', authenticateToken, userController.updateAdState);


// إضافه وتعديل رابط الموقع هذا موقت لتطوير فق 
// router.post('/websiteUrl', userController.createOrUpdateWebsiteUrl);

// الاستعلام عن الملومات الاستلاسه باستخدام رابط الموقع 

router.get('/profile/websiteUrl/:websiteUrl', userController.getUserByWebsiteUrl);


// الاستعلام عن اسم السكربت باستخدام الرابط 
router.post('/getScriptInfo', userController.getScriptInfoByWebsiteUrl);



// فلتر احضار جميع المدن وعن الاخيار  مدينه يجلب الاحيا الخاصه فيها 

router.get('/cities-and-districts', userController.getCitiesAndDistrictsByWebsiteUrl);



// التحكم في اللوقو 

router.post('/logo', authenticateToken, userController.uploadOrUpdateLogo);

// مسار لحذف الشعار
router.delete('/logo', authenticateToken, userController.deleteLogo);




// فتح اعلان جديد 
module.exports = router;
