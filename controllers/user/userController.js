// const bcrypt = require('bcryptjs');
// const jwt = require('jsonwebtoken');
// const Joi = require('joi');
// const User = require('../../models/user');
// const Ad = require('../../models/AdSchema');
// const axios = require('axios');

// // استيراد الدوال المتعلقة بـ S3
// const multer = require('multer');
// const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');

// // إعداد S3
// const s3 = new S3Client({
//   region: process.env.AWS_REGION,
//   credentials: {
//     accessKeyId: process.env.AWS_ACCESS_KEY,
//     secretAccessKey: process.env.AWS_SECRET_KEY,
//   },
// });

// // إعداد Multer
// const storage = multer.memoryStorage();
// const upload = multer({
//   storage: storage,
//   limits: { fileSize: 20 * 1024 * 1024 }, // حجم الملف الأقصى 20 ميجابايت
// }).fields([
//   { name: 'image', maxCount: 1 }, // صورة رئيسية واحدة
//   { name: 'images', maxCount: 10 }, // 10 صور إضافية
//   { name: 'videos', maxCount: 3 }, // 3 فيديوهات كحد أقصى
// ]);

// // دالة رفع الملفات إلى S3
// const uploadFileToS3 = async (file, fileName, folder) => {
//   if (!process.env.BUCKET_NAME) {
//     console.error('Bucket name is not defined in the environment variables.');
//     throw new Error('Bucket name is missing.');
//   }

//   const params = {
//     Bucket: process.env.BUCKET_NAME,
//     Key: `${folder}/${fileName}`,
//     Body: file.buffer,
//     ContentType: file.mimetype,
//   };

//   try {
//     console.log('Uploading file to S3 with params:', params);
//     await s3.send(new PutObjectCommand(params));
//     const fileLocation = `https://${process.env.BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${folder}/${fileName}`;
//     console.log('Generated file location:', fileLocation);
//     return { Location: fileLocation };
//   } catch (error) {
//     console.error('Error uploading to S3:', error.message);
//     throw new Error('فشل رفع الملف إلى S3.');
//   }
// };

// // دالة إضافة إعلان جديد
// exports.createAd = async (req, res) => {
//   console.log('Starting to process the request...');
//   console.log('Request body:', req.body);

//   const { title, adType, city, features, price, originalPrice, isFeatured, statusText, category } = req.body;
//   const userId = req.user.id;

//   try {
//     // 1. تحقق من وجود الملفات
//     const files = req.files || {};
//     const mainImage = files.image?.[0];
//     const additionalImages = files.images || [];
//     const videos = files.videos || [];

//     if (!mainImage && additionalImages.length === 0 && videos.length === 0) {
//       console.error('No files received in the request.');
//       return res.status(400).json({ error: 'لم يتم تحميل أي ملفات.' });
//     }

//     console.log('Files received:');
//     console.log('Main Image:', mainImage?.originalname);
//     console.log('Additional Images:', additionalImages.map(file => file.originalname));
//     console.log('Videos:', videos.map(file => file.originalname));

//     const folder = 'public-posts';
//     let mainImageLink = null;
//     const imageLinks = [];
//     const videoLinks = [];

//     // 2. رفع الصورة الرئيسية
//     if (mainImage) {
//       const fileName = `${Date.now()}_${Math.random().toString(36).substring(2, 15)}.jpg`;
//       const uploadedFile = await uploadFileToS3(mainImage, fileName, folder);
//       mainImageLink = uploadedFile.Location;
//       console.log('Main image uploaded:', mainImageLink);
//     }

//     // 3. رفع الصور الإضافية
//     for (const file of additionalImages) {
//       const fileName = `${Date.now()}_${Math.random().toString(36).substring(2, 15)}.jpg`;
//       const uploadedFile = await uploadFileToS3(file, fileName, folder);
//       imageLinks.push(uploadedFile.Location);
//       console.log('Additional image uploaded:', uploadedFile.Location);
//     }

//     // 4. رفع الفيديوهات
//     for (const file of videos) {
//       const fileName = `${Date.now()}_${Math.random().toString(36).substring(2, 15)}.mp4`; // إعادة تسمية الفيديو
//       const uploadedFile = await uploadFileToS3(file, fileName, folder);
//       videoLinks.push(uploadedFile.Location);
//       console.log('Video uploaded:', uploadedFile.Location);
//     }

//     // 5. إنشاء الإعلان
//     const newAd = new Ad({
//       title,
//       adType,
//       city,
//       features,
//       price,
//       originalPrice,
//       image: mainImageLink, // الصورة الرئيسية
//       images: imageLinks, // الصور الإضافية
//       videos: videoLinks, // الفيديوهات
//       isFeatured,
//       statusText,
//       category,
//       user: userId,
//     });

//     await newAd.save();
//     console.log('Ad successfully created:', newAd);

//     // 6. إضافة الإعلان إلى قائمة الإعلانات الخاصة بالمستخدم
//     const user = await User.findById(userId);
//     if (!user) {
//       console.error('User not found:', userId);
//       return res.status(404).json({ error: 'المستخدم غير موجود.' });
//     }
//     user.ads.push(newAd._id);
//     await user.save();

//     console.log('Ad added to user\'s ad list.');
//     res.status(201).json({ message: 'تم إضافة الإعلان بنجاح', ad: newAd });
//   } catch (error) {
//     console.error('Error creating ad:', error);
//     res.status(500).json({
//       error: 'حدث خطأ أثناء إضافة الإعلان.',
//       details: error.message,
//     });
//   }
// };



/////////////////الكود السليم الاساسي فوق /////////////

const mongoose = require('mongoose');

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Joi = require('joi');
const User = require('../../models/user');
const Ad = require('../../models/AdSchema');
const axios = require('axios');
const multer = require('multer');
const { S3Client, PutObjectCommand, DeleteObjectCommand } = require('@aws-sdk/client-s3');
//<<<<<<<<<<<<<<
// controllers/adController.js (مثال)
const {
  uploadFileToS3p,
  deleteFileFromS3p,
  uploadMultipleFilesToS3p
} = require('../../utils/s3Service');

const uploadp = require('../../utils/multerConfig'); // Multer لضبط عدد الملفات وحجمها
const { convertMovToMp4 } = require('../../utils/videoConvert'); // تحويل صيغ الفيديو إلى mp4
const { updateAdFields } = require('./service/adServices'); // داله فيها الاشا النصينه حق ركوست انشا العلان لانه الركوس بيصير طويل فقررنا انحن نقسمها 

// إعداد S3
const s3 = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY,
    secretAccessKey: process.env.AWS_SECRET_KEY,
  },
});


// لتعدل على الاعلان ورفع الصور والفيديوها 

/**
 * تعديل ملفات (صور/فيديوهات) إعلان معيّن.
 * - يقوم برفع الصور والفيديوهات الجديدة.
 * - يحذف الصور والفيديوهات القديمة إذا طلب المستخدم ذلك.
 */
// مثال: adController.js

const MAX_IMAGES = 10;
const MAX_VIDEOS = 3;

exports.updateAdMedia = (req, res) => {
  // ميدل وير Multer
  uploadp(req, res, async (err) => {
    if (err) {
      return res.status(400).json({ error: err.message });
    }

    try {
      const adId = req.params.adId;
      const userId = req.user?.id;

      // 1) العثور على الإعلان في DB
      const ad = await Ad.findById(adId);
      if (!ad) {
        return res.status(404).json({ error: 'الإعلان غير موجود.' });
      }

      // =========== [A] جلب بيانات الحقول من jsonData إن وُجد ===========
      let parsedData = req.body; // fallback
      if (req.body.jsonData) {
        // إذا وجدنا حقلاً اسمه jsonData سنعتمده
        try {
          parsedData = JSON.parse(req.body.jsonData);
        } catch (parseErr) {
          console.error('خطأ أثناء JSON.parse:', parseErr);
          // يمكنك إعادة خطأ أو تجاهل الخطأ أو التعامل معه كما يناسبك
        }
      }

      // 2) تحديث الحقول النصية/الرقمية عبر الدالة adServices.js
      updateAdFields(ad, parsedData);

      // ======== [منطق تغيير الحالة] =========
      // إذا كانت حالة الإعلان حاليًا "مسودة"، نقوم بتحويلها إلى "منشور".
      // إذا كانت الحالة "غير مكتمل" أو "منشور"، نبقيها كما هي.
      if (ad.status === 'مسودة') {
        ad.status = 'منشور';
      }

      // 2.5) حذف الصور/الفيديوهات القديمة
      let { deletedImages, deletedVideos } = req.body;
      // حذف الصور القديمة
      if (deletedImages) {
        if (typeof deletedImages === 'string') {
          try {
            deletedImages = JSON.parse(deletedImages);
          } catch (e) {
            // لو فشل parse، نعاملها كقيمة واحدة
          }
        }
        const imagesToDelete = Array.isArray(deletedImages)
          ? deletedImages
          : [deletedImages];

        for (const imgUrl of imagesToDelete) {
          ad.images = ad.images.filter(link => link !== imgUrl);

          const splitted = imgUrl.split('.com/');
          if (splitted.length < 2) continue;

          let fileKey = splitted[1].split('?')[0];
          await deleteFileFromS3p(fileKey);
        }
      }

      // حذف الفيديوهات القديمة
      if (deletedVideos) {
        if (typeof deletedVideos === 'string') {
          try {
            deletedVideos = JSON.parse(deletedVideos);
          } catch (e) {
            // قيمة مفردة
          }
        }
        const videosToDelete = Array.isArray(deletedVideos)
          ? deletedVideos
          : [deletedVideos];

        for (const vidUrl of videosToDelete) {
          ad.videos = ad.videos.filter(link => link !== vidUrl);

          const splitted = vidUrl.split('.com/');
          if (splitted.length < 2) continue;

          let fileKey = splitted[1].split('?')[0];
          await deleteFileFromS3p(fileKey);
        }
      }

      // 3) حفظ الإعلان بعد تحديث الحقول وحذف القديم
      await ad.save();

      // 4) تحقق من الحد الأقصى قبل إضافة ملفات جديدة
      const images = req.files.images || [];
      const videos = req.files.videos || [];

      const currentImagesCount = ad.images.length;
      const currentVideosCount = ad.videos.length;

      // هل نتجاوز الحد الأقصى للصور؟
      if (currentImagesCount + images.length > MAX_IMAGES) {
        return res.status(400).json({
          error: `تجاوزت الحد الأقصى للصور. لديك حاليًا ${currentImagesCount} صورة، وحاولت إضافة ${images.length} ليصبح المجموع ${
            currentImagesCount + images.length
          }، والحد الأقصى هو ${MAX_IMAGES}.`
        });
      }

      // هل نتجاوز الحد الأقصى للفيديوهات؟
      if (currentVideosCount + videos.length > MAX_VIDEOS) {
        return res.status(400).json({
          error: `تجاوزت الحد الأقصى للفيديوهات. لديك حاليًا ${currentVideosCount} فيديو، وحاولت إضافة ${videos.length} ليصبح المجموع ${
            currentVideosCount + videos.length
          }، والحد الأقصى هو ${MAX_VIDEOS}.`
        });
      }

      // 5) تحويل أي فيديو MOV أو WebM إلى MP4 قبل الرفع
      for (const file of videos) {
        if (
          file.mimetype === 'video/quicktime' ||
          file.mimetype === 'video/webm'
        ) {
          const mp4Buffer = await convertMovToMp4(file.buffer);
          file.buffer = mp4Buffer;
          file.mimetype = 'video/mp4';
        }
      }

      // 6) رفع الملفات (صور + فيديوهات) إلى S3
      const imageLinks = await uploadMultipleFilesToS3p(images, 'public-posts', userId, adId);
      const videoLinks = await uploadMultipleFilesToS3p(videos, 'public-posts', userId, adId);

      // 7) إضافة الروابط
      ad.images.push(...imageLinks);
      ad.videos.push(...videoLinks);

      // 8) حفظ التعديلات النهائية
      await ad.save();
console.log(ad)
      return res.status(200).json({
        message: 'تم تحديث ملفات الإعلان بنجاح (مع تحويل MOV/WebM إلى MP4).',
        ad: ad,   // عرض كامل معلومات الإعلان
        images: ad.images,
        videos: ad.videos
      }
    );

    } catch (error) {
      console.error('Error updating ad media:', error);
      return res.status(500).json({
        error: 'حدث خطأ أثناء تحديث ملفات الإعلان.',
        details: error.message
      });
    }
  });
};

// GET اعطا بيانات الاعلان 

/**
 * جلب إعلان واحد بالاعتماد على adId
 * GET /api/ads/:adId
 */

exports.getAdByIdd = async (req, res) => {
  try {
    const { adId } = req.params;   // تأكد أنه adId

    // البحث عن الإعلان في قاعدة البيانات
    const ad = await Ad.findById(adId);

    if (!ad) {
      return res.status(404).json({
        error: 'الإعلان غير موجود.'
      });
    }

    return res.status(200).json({
      message: 'تم العثور على الإعلان بنجاح.',
      ad
    });
  } catch (error) {
    console.error('Error fetching ad by ID:', error);
    return res.status(500).json({
      error: 'حدث خطأ أثناء جلب بيانات الإعلان.',
      details: error.message
    });
  }
};

// الي تحت بدون تغير الحاله 


// حذف اعلان الحذف في s3 

exports.deleteAd = async (req, res) => {
  try {
    const adId = req.params.adId;
    const userId = req.user?.id; // معرّف المستخدم من التوكن

    // 1) ابحث عن الإعلان
    const ad = await Ad.findById(adId);
    if (!ad) {
      return res.status(404).json({ error: 'الإعلان غير موجود.' });
    }

    // 2) (اختياري) تحقق من أنّ المستخدم الحالي مالك للإعلان
    // إذا كنت ترغب في منع مستخدم آخر من حذف إعلان ليس ملكه:
    if (ad.user.toString() !== userId) {
      return res.status(403).json({ error: 'لا تملك الصلاحية لحذف هذا الإعلان.' });
    }

    // 3) حذف الصور من S3
    for (const imgUrl of ad.images) {
      // نحصل على جزء المفتاح (Key) من رابط الـ S3
      const splitted = imgUrl.split('.com/');
      if (splitted.length < 2) continue;
      const fileKey = splitted[1].split('?')[0]; // في حال كان هناك بارامترات، نتخلص منها
      await deleteFileFromS3p(fileKey);
    }

    // 4) حذف الفيديوهات من S3
    for (const vidUrl of ad.videos) {
      const splitted = vidUrl.split('.com/');
      if (splitted.length < 2) continue;
      const fileKey = splitted[1].split('?')[0];
      await deleteFileFromS3p(fileKey);
    }

    // 5) حذف سجل الإعلان من قاعدة البيانات
    await ad.deleteOne();

    // 6) إعادة استجابة بالنجاح
    return res.status(200).json({ message: 'تم حذف الإعلان وجميع ملفاته بنجاح.' });
    
  } catch (error) {
    console.error('خطأ أثناء حذف الإعلان:', error);
    return res.status(500).json({
      error: 'حدث خطأ أثناء حذف الإعلان.',
      details: error.message
    });
  }
};



// التحكم في حالات الاعلان 
/**
 * تحديث حالات (status, statusText, isFeatured) لإعلان معيّن
 * - يمكن إرسال أي مجموعة من الحقول التالية في الـ Body:
 *    { status, statusText, isFeatured }
 * - لا يشترط إرسالها جميعًا؛ لو أرسلت `isFeatured` فقط سيُحدَّث وحده.
 * - يشترط أن يكون المستخدم (req.user.id) هو مالك الإعلان (ad.user).
 */
exports.updateAdState = async (req, res) => {
  try {
    const adId = req.params.adId;

    // 1) ابحث عن الإعلان
    const ad = await Ad.findById(adId);
    if (!ad) {
      return res.status(404).json({ error: 'الإعلان غير موجود.' });
    }

    // 2) التحقّق من الملكيّة
    // نفترض أنّ حقل user في الإعلان هو ObjectId يشير للمستخدم
    if (ad.user.toString() !== req.user.id) {
      return res.status(403).json({
        error: 'لا تملك الصلاحية لتعديل هذا الإعلان.',
      });
    }

    // 3) تعديل الحقول (إذا وُجدت في الـ Body)
    // لا نجبر المستخدم على إرسال كل الحقول
    const { status, statusText, isFeatured } = req.body;

    // مثال على تحقق من قيم مسموح بها (اختياري)
    // if (status && !['مسودة', 'غير منشور', 'منشور'].includes(status)) {
    //   return res.status(400).json({ error: 'قيمة status غير صالحة.' });
    // }

    // لو جاءت 'status'
    if (status !== undefined) {
      ad.status = status;
    }

    // لو جاءت 'statusText'
    if (statusText !== undefined) {
      ad.statusText = statusText;
    }

    // لو جاءت 'isFeatured'
    if (isFeatured !== undefined) {
      ad.isFeatured = (isFeatured === true || isFeatured === 'true');
    }

    // 4) احفظ التعديلات
    await ad.save();

    // 5) أعد الردّ مع تفاصيل الإعلان
    return res.status(200).json({
      message: 'تم تحديث حالة الإعلان بنجاح.',
      ad,
    });
  } catch (error) {
    console.error('Error updating ad state:', error);
    return res.status(500).json({
      error: 'حدث خطأ أثناء تحديث حالة الإعلان.',
      details: error.message,
    });
  }
};



// const MAX_IMAGES = 10;
// const MAX_VIDEOS = 3;

// exports.updateAdMedia = (req, res) => {
//   // ميدل وير Multer
//   uploadp(req, res, async (err) => {
//     if (err) {
//       return res.status(400).json({ error: err.message });
//     }

//     try {
//       const adId = req.params.adId;
//       const userId = req.user?.id;

//       // 1) العثور على الإعلان في DB
//       const ad = await Ad.findById(adId);
//       if (!ad) {
//         return res.status(404).json({ error: 'الإعلان غير موجود.' });
//       }

//       // =========== [A] جلب بيانات الحقول من jsonData إن وُجد ===========
//       let parsedData = req.body; // fallback
//       if (req.body.jsonData) {
//         // إذا وجدنا حقلاً اسمه jsonData سنعتمده
//         try {
//           parsedData = JSON.parse(req.body.jsonData);
//         } catch (parseErr) {
//           console.error('خطأ أثناء JSON.parse:', parseErr);
//           // يمكنك إعادة خطأ أو تجاهل
//         }
//       }

//       // 2) تحديث الحقول النصية/الرقمية عبر الدالة adServices.js
//       updateAdFields(ad, parsedData);

//       // 2.5) حذف الصور/الفيديوهات القديمة
//       let { deletedImages, deletedVideos } = req.body;
//       // إذا كنت تريد السماح بحذفها أيضًا عبر jsonData، يمكن دمج نفس المنطق
//       // لكن هنا أبقينا كالسابق

//       // ---- حذف الصور القديمة
//       if (deletedImages) {
//         if (typeof deletedImages === 'string') {
//           try {
//             deletedImages = JSON.parse(deletedImages);
//           } catch (e) {
//             // لو فشل parse، نعاملها كقيمة واحدة
//           }
//         }
//         const imagesToDelete = Array.isArray(deletedImages)
//           ? deletedImages
//           : [deletedImages];

//         for (const imgUrl of imagesToDelete) {
//           ad.images = ad.images.filter(link => link !== imgUrl);

//           const splitted = imgUrl.split('.com/');
//           if (splitted.length < 2) continue;

//           let fileKey = splitted[1].split('?')[0];
//           await deleteFileFromS3p(fileKey);
//         }
//       }

//       // ---- حذف الفيديوهات القديمة
//       if (deletedVideos) {
//         if (typeof deletedVideos === 'string') {
//           try {
//             deletedVideos = JSON.parse(deletedVideos);
//           } catch (e) {
//             // قيمة مفردة
//           }
//         }
//         const videosToDelete = Array.isArray(deletedVideos)
//           ? deletedVideos
//           : [deletedVideos];

//         for (const vidUrl of videosToDelete) {
//           ad.videos = ad.videos.filter(link => link !== vidUrl);

//           const splitted = vidUrl.split('.com/');
//           if (splitted.length < 2) continue;

//           let fileKey = splitted[1].split('?')[0];
//           await deleteFileFromS3p(fileKey);
//         }
//       }

//       // 3) حفظ الإعلان بعد تحديث الحقول وحذف القديم
//       await ad.save();

//       // 4) تحقق من الحد الأقصى قبل إضافة ملفات جديدة
//       const images = req.files.images || [];
//       const videos = req.files.videos || [];

//       const currentImagesCount = ad.images.length;
//       const currentVideosCount = ad.videos.length;

//       // هل نتجاوز الحد الأقصى للصور؟
//       if (currentImagesCount + images.length > MAX_IMAGES) {
//         return res.status(400).json({
//           error: `تجاوزت الحد الأقصى للصور. لديك حاليًا ${currentImagesCount} صورة، وحاولت إضافة ${images.length} ليصبح المجموع ${
//             currentImagesCount + images.length
//           }, والحد الأقصى هو ${MAX_IMAGES}.`
//         });
//       }

//       // هل نتجاوز الحد الأقصى للفيديوهات؟
//       if (currentVideosCount + videos.length > MAX_VIDEOS) {
//         return res.status(400).json({
//           error: `تجاوزت الحد الأقصى للفيديوهات. لديك حاليًا ${currentVideosCount} فيديو، وحاولت إضافة ${videos.length} ليصبح المجموع ${
//             currentVideosCount + videos.length
//           }, والحد الأقصى هو ${MAX_VIDEOS}.`
//         });
//       }

//       // 5) تحويل أي فيديو MOV أو WebM إلى MP4 قبل الرفع
//       for (const file of videos) {
//         if (
//           file.mimetype === 'video/quicktime' ||
//           file.mimetype === 'video/webm'
//         ) {
//           const mp4Buffer = await convertMovToMp4(file.buffer);
//           file.buffer = mp4Buffer;
//           file.mimetype = 'video/mp4';
//         }
//       }

//       // 6) رفع الملفات (صور + فيديوهات) إلى S3
//       const imageLinks = await uploadMultipleFilesToS3p(images, 'public-posts', userId, adId);
//       const videoLinks = await uploadMultipleFilesToS3p(videos, 'public-posts', userId, adId);

//       // 7) إضافة الروابط
//       ad.images.push(...imageLinks);
//       ad.videos.push(...videoLinks);

//       // 8) حفظ التعديلات النهائية
//       await ad.save();

//       return res.status(200).json({
//         message: 'تم تحديث ملفات الإعلان بنجاح (مع تحويل MOV/WebM إلى MP4).',
//         ad: ad,          // عرض كامل معلومات الإعلان 

//         images: ad.images,
//         videos: ad.videos
//       });

//     } catch (error) {
//       console.error('Error updating ad media:', error);
//       return res.status(500).json({
//         error: 'حدث خطأ أثناء تحديث ملفات الإعلان.',
//         details: error.message
//       });
//     }
//   });
// };

// <><><><><><><><><><><>


//  the is summary for imges and vides 
// const MAX_IMAGES = 10;
// const MAX_VIDEOS = 3;

// exports.updateAdMedia = (req, res) => {
//   // ميدل وير Multer
//   uploadp(req, res, async (err) => {
//     if (err) {
//       return res.status(400).json({ error: err.message });
//     }

//     try {
//       const adId = req.params.adId;
//       const userId = req.user?.id;

//       // 1) العثور على الإعلان في DB
//       const ad = await Ad.findById(adId);
//       if (!ad) {
//         return res.status(404).json({ error: 'الإعلان غير موجود.' });
//       }

//       // 2) حذف الصور/الفيديوهات القديمة
//       let { deletedImages, deletedVideos } = req.body;

//       // ---- حذف الصور القديمة
//       if (deletedImages) {
//         if (typeof deletedImages === 'string') {
//           try {
//             deletedImages = JSON.parse(deletedImages);
//           } catch (e) {
//             // لو فشل parse، نعاملها كقيمة واحدة
//           }
//         }
//         const imagesToDelete = Array.isArray(deletedImages)
//           ? deletedImages
//           : [deletedImages];

//         for (const imgUrl of imagesToDelete) {
//           ad.images = ad.images.filter(link => link !== imgUrl);

//           const splitted = imgUrl.split('.com/');
//           if (splitted.length < 2) continue;

//           let fileKey = splitted[1].split('?')[0]; 
//           await deleteFileFromS3p(fileKey);
//         }
//       }

//       // ---- حذف الفيديوهات القديمة
//       if (deletedVideos) {
//         if (typeof deletedVideos === 'string') {
//           try {
//             deletedVideos = JSON.parse(deletedVideos);
//           } catch (e) {
//             // قيمة مفردة
//           }
//         }
//         const videosToDelete = Array.isArray(deletedVideos)
//           ? deletedVideos
//           : [deletedVideos];

//         for (const vidUrl of videosToDelete) {
//           ad.videos = ad.videos.filter(link => link !== vidUrl);

//           const splitted = vidUrl.split('.com/');
//           if (splitted.length < 2) continue;

//           let fileKey = splitted[1].split('?')[0];
//           await deleteFileFromS3p(fileKey);
//         }
//       }

//       // 3) حفظ الإعلان بعد الحذف
//       await ad.save();

//       // 4) تحقق من الحد الأقصى قبل الإضافة
//       const images = req.files.images || [];
//       const videos = req.files.videos || [];

//       const currentImagesCount = ad.images.length;
//       const currentVideosCount = ad.videos.length;

//       // هل نتجاوز الحد الأقصى للصور؟
//       if (currentImagesCount + images.length > MAX_IMAGES) {
//         return res.status(400).json({
//           error: `تجاوزت الحد الأقصى للصور. لديك حاليًا ${currentImagesCount} صورة، وحاولت إضافة ${images.length} ليصبح المجموع ${
//             currentImagesCount + images.length
//           }, والحد الأقصى هو ${MAX_IMAGES}.`
//         });
//       }

//       // هل نتجاوز الحد الأقصى للفيديوهات؟
//       if (currentVideosCount + videos.length > MAX_VIDEOS) {
//         return res.status(400).json({
//           error: `تجاوزت الحد الأقصى للفيديوهات. لديك حاليًا ${currentVideosCount} فيديو، وحاولت إضافة ${videos.length} ليصبح المجموع ${
//             currentVideosCount + videos.length
//           }, والحد الأقصى هو ${MAX_VIDEOS}.`
//         });
//       }

//       // 5) تحويل أي فيديو MOV أو WebM إلى MP4 قبل الرفع
//       for (const file of videos) {
//         // نفترض أننا نريد تحويل MOV و WebM إلى MP4
//         if (
//           file.mimetype === 'video/quicktime' || 
//           file.mimetype === 'video/webm'
//         ) {
//           // إذا كانت دالتك اسمها convertMovToMp4، 
//           //يفضّل إعادة تسميتها في الموديل إلى convertVideoToMp4 
//           // لتحويل أي صيغة مدعومة من ffmpeg إلى MP4
//           const mp4Buffer = await convertMovToMp4(file.buffer);
//           file.buffer = mp4Buffer;
//           file.mimetype = 'video/mp4';
//         }
//       }

//       // 6) رفع الملفات (صور + فيديوهات) إلى S3
//       const imageLinks = await uploadMultipleFilesToS3p(images, 'public-posts', userId, adId);
//       const videoLinks = await uploadMultipleFilesToS3p(videos, 'public-posts', userId, adId);

//       // 7) إضافة الروابط
//       ad.images.push(...imageLinks);
//       ad.videos.push(...videoLinks);

//       // 8) حفظ التعديلات النهائية
//       await ad.save();

//       return res.status(200).json({
//         message: 'تم تحديث ملفات الإعلان بنجاح (مع تحويل MOV/WebM إلى MP4).',
//         images: ad.images,
//         videos: ad.videos
//       });

//     } catch (error) {
//       console.error('Error updating ad media:', error);
//       return res.status(500).json({
//         error: 'حدث خطأ أثناء تحديث ملفات الإعلان.',
//         details: error.message
//       });
//     }
//   });
// };
// <:<:<:<:<:<:<:<:<:>



// إعداد Multer
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: { fileSize: 20 * 1024 * 1024 }, // حجم الملف الأقصى 20 ميجابايت
}).fields([
  { name: 'image', maxCount: 1 }, // صورة رئيسية واحدة
  { name: 'images', maxCount: 10 }, // 10 صور إضافية
  { name: 'videos', maxCount: 3 }, // 3 فيديوهات كحد أقصى
]);

// دالة رفع الملفات إلى S3
const uploadFileToS3 = async (file, fileName, folder) => {
  if (!process.env.BUCKET_NAME) {
    console.error('Bucket name is not defined in the environment variables.');
    throw new Error('Bucket name is missing.');
  }

  const params = {
    Bucket: process.env.BUCKET_NAME,
    Key: `${folder}/${fileName}`,
    Body: file.buffer,
    ContentType: file.mimetype,
  };

  try {
    console.log('Uploading file to S3 with params:', params);
    await s3.send(new PutObjectCommand(params));
    const fileLocation = `https://${process.env.BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${folder}/${fileName}`;
    console.log('Generated file location:', fileLocation);
    return { Location: fileLocation };
  } catch (error) {
    console.error('Error uploading to S3:', error.message);
    throw new Error('فشل رفع الملف إلى S3.');
  }
};

// دالة حذف الملفات من S3
const deleteFileFromS3 = async (fileKey) => {
  if (!fileKey) return;

  const params = {
    Bucket: process.env.BUCKET_NAME,
    Key: fileKey,
  };

  try {
    await s3.send(new DeleteObjectCommand(params));
    console.log(`File deleted from S3: ${fileKey}`);
  } catch (error) {
    console.error(`Error deleting file from S3 (${fileKey}):`, error.message);
  }
};

// دالة إضافة إعلان جديد
exports.createAd = async (req, res) => {
  console.log('Starting to process the request...');
  const { title, adType, city, features, price, originalPrice, isFeatured, statusText, category } = req.body;
  const userId = req.user.id;

  try {
    const files = req.files || {};
    const mainImage = files.image?.[0];
    const additionalImages = files.images || [];
    const videos = files.videos || [];

    if (!mainImage && additionalImages.length === 0 && videos.length === 0) {
      return res.status(400).json({ error: 'لم يتم تحميل أي ملفات.' });
    }

    const folder = 'public-posts';
    let mainImageLink = null;
    const imageLinks = [];
    const videoLinks = [];

    if (mainImage) {
      const fileName = `${Date.now()}_${Math.random().toString(36).substring(2, 15)}.jpg`;
      const uploadedFile = await uploadFileToS3(mainImage, fileName, folder);
      mainImageLink = uploadedFile.Location;
    }

    for (const file of additionalImages) {
      const fileName = `${Date.now()}_${Math.random().toString(36).substring(2, 15)}.jpg`;
      const uploadedFile = await uploadFileToS3(file, fileName, folder);
      imageLinks.push(uploadedFile.Location);
    }

    for (const file of videos) {
      const fileName = `${Date.now()}_${Math.random().toString(36).substring(2, 15)}.mp4`;
      const uploadedFile = await uploadFileToS3(file, fileName, folder);
      videoLinks.push(uploadedFile.Location);
    }

    const newAd = new Ad({
      title,
      adType,
      city,
      features,
      price,
      originalPrice,
      image: mainImageLink,
      images: imageLinks,
      videos: videoLinks,
      isFeatured,
      statusText,
      category,
      user: userId,
    });

    await newAd.save();

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'المستخدم غير موجود.' });
    }
    user.ads.push(newAd._id);
    await user.save();

    res.status(201).json({ message: 'تم إضافة الإعلان بنجاح', ad: newAd });
  } catch (error) {
    console.error('Error creating ad:', error);
    res.status(500).json({
      error: 'حدث خطأ أثناء إضافة الإعلان.',
      details: error.message,
    });
  }
};



// لاستبدال الصوره 
exports.updateAdImage = async (req, res) => {
  try {
    const adId = req.params.id; // معرف الإعلان
    const file = req.files?.image?.[0]; // استلام الصورة الجديدة

    if (!file) {
      return res.status(400).json({ error: 'يجب إرسال صورة جديدة.' });
    }

    // 1. جلب الإعلان من قاعدة البيانات
    const ad = await Ad.findById(adId);
    if (!ad) {
      return res.status(404).json({ error: 'الإعلان غير موجود.' });
    }

    // 2. حذف الصورة القديمة من S3
    const oldImageKey = ad.image.split('.com/')[1]; // استخراج المفتاح القديم من الرابط
    if (oldImageKey) {
      await deleteFileFromS3(oldImageKey);
    }

    // 3. رفع الصورة الجديدة إلى S3
    const folder = 'public-posts';
    const fileName = `${Date.now()}_${Math.random().toString(36).substring(2, 15)}.jpg`;
    const uploadedFile = await uploadFileToS3(file, fileName, folder);
    const newImageLink = uploadedFile.Location;

    // 4. تحديث الإعلان في قاعدة البيانات بالرابط الجديد
    ad.image = newImageLink;
    await ad.save();

    res.status(200).json({ message: 'تم تحديث الصورة بنجاح.', ad });
  } catch (error) {
    console.error('Error updating ad image:', error);
    res.status(500).json({
      error: 'حدث خطأ أثناء تحديث الصورة.',
      details: error.message,
    });
  }
};






// دالة تعديل الإعلان

// دالة تعديل الإعلان
// const { PutObjectCommand, DeleteObjectCommand } = require('@aws-sdk/client-s3');
// const Ad = require('../../models/AdSchema');
// const { deleteFileFromS3, uploadFileToS3 } = require('./s3Utils'); // استيراد دوال الحذف والرفع

exports.updateAd = async (req, res) => {
  try {
    const { adId } = req.params; // ID الإعلان
    const {
      title,
      adType,
      city,
      features,
      price,
      originalPrice,
      description,
      isFeatured,
      statusText,
      deletedImages, // أسماء الصور التي سيتم حذفها
      deletedVideos, // أسماء الفيديوهات التي سيتم حذفها
    } = req.body;

    // جلب الإعلان من قاعدة البيانات
    const ad = await Ad.findById(adId);
    if (!ad) {
      return res.status(404).json({ success: false, error: 'الإعلان غير موجود.' });
    }

    // ** تحديث الحقول النصية **
    if (title) ad.title = title;
    if (adType) ad.adType = adType;
    if (city) ad.city = city;
    if (features) ad.features = features;
    if (price) ad.price = price;
    if (originalPrice) ad.originalPrice = originalPrice;
    if (description) ad.description = description;
    if (isFeatured !== undefined) ad.isFeatured = isFeatured;
    if (statusText) ad.statusText = statusText;

    // ** حذف الصور المحددة **
    if (deletedImages && Array.isArray(deletedImages)) {
      for (const imageUrl of deletedImages) {
        const fileKey = imageUrl.split(`${process.env.BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/`)[1];
        await deleteFileFromS3(fileKey); // حذف من S3
        ad.images = ad.images.filter((img) => img !== imageUrl); // حذف من قاعدة البيانات
      }
    }

    // ** حذف الفيديوهات المحددة **
    if (deletedVideos && Array.isArray(deletedVideos)) {
      for (const videoUrl of deletedVideos) {
        const fileKey = videoUrl.split(`${process.env.BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/`)[1];
        await deleteFileFromS3(fileKey); // حذف من S3
        ad.videos = ad.videos.filter((vid) => vid !== videoUrl); // حذف من قاعدة البيانات
      }
    }

    // ** تحديث الصورة الرئيسية **
    if (req.files?.image?.[0]) {
      // حذف الصورة القديمة إذا كانت موجودة
      if (ad.image) {
        const fileKey = ad.image.split(`${process.env.BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/`)[1];
        await deleteFileFromS3(fileKey);
      }

      // رفع الصورة الجديدة
      const file = req.files.image[0];
      const fileName = `${Date.now()}_${Math.random().toString(36).substring(2, 15)}.jpg`;
      const uploadedFile = await uploadFileToS3(file, fileName, 'public-posts');
      ad.image = uploadedFile.Location; // تحديث الصورة الجديدة في قاعدة البيانات
    }

    // ** إضافة الصور الجديدة إلى المصفوفة **
    if (req.files?.images) {
      for (const file of req.files.images) {
        const fileName = `${Date.now()}_${Math.random().toString(36).substring(2, 15)}.jpg`;
        const uploadedFile = await uploadFileToS3(file, fileName, 'public-posts');
        ad.images.push(uploadedFile.Location); // إضافة الرابط إلى المصفوفة
      }
    }

    // ** إضافة الفيديوهات الجديدة إلى المصفوفة **
    if (req.files?.videos) {
      for (const file of req.files.videos) {
        const fileName = `${Date.now()}_${Math.random().toString(36).substring(2, 15)}.mp4`;
        const uploadedFile = await uploadFileToS3(file, fileName, 'public-posts');
        ad.videos.push(uploadedFile.Location); // إضافة الرابط إلى المصفوفة
      }
    }

    // تحديث تاريخ التعديل
    ad.updatedAt = new Date();

    // حفظ الإعلان
    await ad.save();

    // استجابة النجاح
    res.status(200).json({ success: true, message: 'تم تحديث الإعلان بنجاح.', ad });
  } catch (error) {
    console.error('Error updating ad:', error.message);
    res.status(500).json({ success: false, error: 'حدث خطأ أثناء تحديث الإعلان.', details: error.message });
  }
};









// حذف صورة من المصفوفة
exports.deleteImageFromAd = async (req, res) => {
  const { adId } = req.params;
  const { imageUrl } = req.body;

  try {
    const ad = await Ad.findById(adId);
    if (!ad) {
      return res.status(404).json({ error: 'الإعلان غير موجود.' });
    }

    // حذف الصورة من المصفوفة
    ad.images = ad.images.filter((img) => img !== imageUrl);

    // حذف الصورة من S3
    const imageKey = imageUrl.split(`${process.env.BUCKET_NAME}/`)[1];
    await deleteFileFromS3(imageKey);

    await ad.save();
    res.status(200).json({ message: 'تم حذف الصورة بنجاح.', ad });
  } catch (error) {
    console.error('Error deleting image:', error.message);
    res.status(500).json({ error: 'حدث خطأ أثناء حذف الصورة.' });
  }
};

// حذف فيديو من المصفوفة
exports.deleteVideoFromAd = async (req, res) => {
  const { adId } = req.params;
  const { videoUrl } = req.body;

  try {
    const ad = await Ad.findById(adId);
    if (!ad) {
      return res.status(404).json({ error: 'الإعلان غير موجود.' });
    }

    // حذف الفيديو من المصفوفة
    ad.videos = ad.videos.filter((vid) => vid !== videoUrl);

    // حذف الفيديو من S3
    const videoKey = videoUrl.split(`${process.env.BUCKET_NAME}/`)[1];
    await deleteFileFromS3(videoKey);

    await ad.save();
    res.status(200).json({ message: 'تم حذف الفيديو بنجاح.', ad });
  } catch (error) {
    console.error('Error deleting video:', error.message);
    res.status(500).json({ error: 'حدث خطأ أثناء حذف الفيديو.' });
  }
};

// دالة حذف إعلان
exports.deleteAd = async (req, res) => {
  const { id } = req.params;

  try {
    const ad = await Ad.findById(id);
    if (!ad) {
      return res.status(404).json({ error: 'الإعلان غير موجود.' });
    }

    // حذف الملفات من S3
    const fileKeys = [
      ad.image?.split(`${process.env.BUCKET_NAME}/`)[1],
      ...ad.images.map(img => img.split(`${process.env.BUCKET_NAME}/`)[1]),
      ...ad.videos.map(vid => vid.split(`${process.env.BUCKET_NAME}/`)[1]),
    ].filter(Boolean); // تجاهل القيم الفارغة

    await Promise.all(fileKeys.map(async (key) => {
      const params = { Bucket: process.env.BUCKET_NAME, Key: key };
      console.log('Deleting from S3:', params);
      await s3.send(new DeleteObjectCommand(params));
    }));

    // حذف الإعلان من قاعدة البيانات
    await ad.remove();
    res.status(200).json({ message: 'تم حذف الإعلان بنجاح.' });
  } catch (error) {
    console.error('Error deleting ad:', error.message);
    res.status(500).json({ error: 'حدث خطأ أثناء حذف الإعلان.' });
  }
};



exports.deleteFile2 = async (req, res) => {
  try {
    // الخطوة 1: التحقق من وجود الرابط في الطلب
    const { fileUrl } = req.body;

    if (!fileUrl) {
      return res.status(400).json({ success: false, error: 'يرجى توفير رابط الملف للحذف.' });
    }

    // الخطوة 2: استخراج bucketName و fileKey من الرابط
    const bucketName = process.env.BUCKET_NAME;
    const region = process.env.AWS_REGION;

    const prefix = `https://${bucketName}.s3.${region}.amazonaws.com/`;

    if (!fileUrl.startsWith(prefix)) {
      return res.status(400).json({ success: false, error: 'الرابط غير متطابق مع الـ Bucket المحدد.' });
    }

    const fileKey = fileUrl.replace(prefix, '');

    // الخطوة 3: إعداد معلمات الحذف
    const params = {
      Bucket: bucketName,
      Key: fileKey,
    };

    // الخطوة 4: حذف الملف من S3
    await s3.send(new DeleteObjectCommand(params));

    // الخطوة 5: إرسال استجابة النجاح
    return res.status(200).json({ success: true, message: `تم حذف الملف بنجاح: ${fileUrl}` });
  } catch (error) {
    console.error('Error deleting file:', error.message);

    // إرسال استجابة الفشل
    return res.status(500).json({ success: false, error: 'حدث خطأ أثناء حذف الملف.', details: error.message });
  }
};













































// إعداد AWS S3
// const s3 = new S3Client({
//   region: process.env.AWS_REGION,
//   credentials: {
//     accessKeyId: process.env.AWS_ACCESS_KEY,
//     secretAccessKey: process.env.AWS_SECRET_KEY
//   }
// });

// // إعداد multer للتعامل مع الملفات مع التحكم في الصيغة والحجم
// const storage = multer.memoryStorage();
// const upload = multer({
//   storage: storage,
//   limits: { fileSize: 5 * 1024 * 1024 }, // حجم الملف المسموح به: 5 ميجابايت
//   fileFilter: (req, file, cb) => {
//     // السماح فقط بأنواع الصور JPEG و PNG
//     const allowedFileTypes = ['image/jpeg', 'image/png'];

//     // رفض أي ملف لا يتطابق مع الصيغ المدعومة
//     if (!allowedFileTypes.includes(file.mimetype)) {
//       return cb(new Error('نوع الملف غير مسموح. الصيغ المسموحة: JPEG, PNG.'), false);
//     }

//     cb(null, true); // قبول الملف إذا كانت الصيغة صحيحة
//   }
// });



/////




// إعداد S3










// إضافة إعلان جديد
// exports.createAd = async (req, res) => {
//   const { title, adType, city, features, price, originalPrice, isFeatured, statusText } = req.body;
//   const userId = req.user.id; // نفترض أن لديك مصادقة وتستخدم user.id

//   try {
//     // تحقق مما إذا كانت الملفات مرفقة
//     if (!req.files || req.files.length === 0) {
//       return res.status(400).json({ error: 'لم يتم تحميل أي صور.' });
//     }

//     // مصفوفة لتخزين الروابط التي سيتم إرجاعها من S3
//     const imageLinks = [];

//     // رفع الملفات إلى S3
//     for (const file of req.files) {
//       const fileName = `${Date.now()}_${file.originalname}`;
//       const folder = 'ads-images'; // يمكنك تغيير المجلد حسب الحاجة
//       const data = await uploadFileToS3(file, fileName, folder);
//       imageLinks.push(data.Location); // تخزين رابط الصورة في المصفوفة
//     }

//     // إنشاء الإعلان الجديد
//     const newAd = new Ad({
//       title,
//       adType,
//       city,
//       features,
//       image,
//       price,
//       originalPrice,
//       images: imageLinks, // تخزين روابط الصور
//       isFeatured,
//       statusText,
//       user: userId, // ربط الإعلان بالمستخدم
//     });

//     await newAd.save();

//     // إضافة الإعلان لقائمة الإعلانات الخاصة بالمستخدم
//     const user = await User.findById(userId);
//     user.ads.push(newAd._id);
//     await user.save();

//     res.status(201).json({ message: 'تم إضافة الإعلان بنجاح', ad: newAd });
//   } catch (error) {
//     console.error('Error creating ad:', error);
//     res.status(500).json({ error: 'حدث خطأ أثناء إضافة الإعلان.' });
//   }
// };


//////









// دالة لرفع الملفات إلى S3
exports.uploadPostFile = async (req, res) => {
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
exports.uploadProfileOrPostFile = async (req, res) => {
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





/* *********** كنترول إضافة الإعلانات وتعديل والحذف ******** */




// إضافة إعلان جديد
// exports.createAd = async (req, res) => {
//   const { title, adType, city, features, price, originalPrice, image, isFeatured, statusText } = req.body;
//   const userId = req.user.id; // نفترض أن لديك مصادقة وتستخدم user.id

//   try {
//     const newAd = new Ad({
//       title,
//       adType,
//       city,
//       features,
//       price,
//       originalPrice,
//       image,
//       isFeatured,
//       statusText,
//       user: userId, // ربط الإعلان بالمستخدم
//     });

//     await newAd.save();

//     // إضافة الإعلان لقائمة الإعلانات الخاصة بالمستخدم
//     const user = await User.findById(userId);
//     user.ads.push(newAd._id);
//     await user.save();

//     res.status(201).json({ message: 'تم إضافة الإعلان بنجاح', ad: newAd });
//   } catch (error) {
//     console.error('Error creating ad:', error);
//     res.status(500).json({ error: 'حدث خطأ أثناء إضافة الإعلان.' });
//   }
// };

// تعديل إعلان موجود
exports.updateAd = async (req, res) => {
  const { adId } = req.params;
  const { title, adType, city, features, price, originalPrice, image, isFeatured, statusText } = req.body;

  try {
    const ad = await Ad.findById(adId);

    if (!ad) {
      return res.status(404).json({ error: 'الإعلان غير موجود.' });
    }

    // التأكد من أن المستخدم هو صاحب الإعلان
    if (ad.user.toString() !== req.user.id) {
      return res.status(403).json({ error: 'لا تملك الصلاحية لتعديل هذا الإعلان.' });
    }

    // تحديث الحقول المطلوبة فقط
    ad.title = title || ad.title;
    ad.adType = adType || ad.adType;
    ad.city = city || ad.city;
    ad.features = features || ad.features;
    ad.price = price || ad.price;
    ad.originalPrice = originalPrice || ad.originalPrice;
    ad.image = image || ad.image;
    ad.isFeatured = isFeatured !== undefined ? isFeatured : ad.isFeatured;
    ad.statusText = statusText || ad.statusText;

    await ad.save();

    res.json({ message: 'تم تحديث الإعلان بنجاح', ad });
  } catch (error) {
    console.error('Error updating ad:', error);
    res.status(500).json({ error: 'حدث خطأ أثناء تحديث الإعلان.' });
  }
};

// حذف إعلان
exports.deleteAdd = async (req, res) => {
  const { adId } = req.params;

  try {
    const ad = await Ad.findById(adId);

    if (!ad) {
      return res.status(404).json({ error: 'الإعلان غير موجود.' });
    }

    // التأكد من أن المستخدم هو صاحب الإعلان
    if (ad.user.toString() !== req.user.id) {
      return res.status(403).json({ error: 'لا تملك الصلاحية لحذف هذا الإعلان.' });
    }

    // حذف الإعلان
    await Ad.deleteOne({ _id: adId });

    // حذف الإعلان من قائمة إعلانات المستخدم
    const user = await User.findById(req.user.id);
    user.ads = user.ads.filter(ad => ad.toString() !== adId);
    await user.save();

    res.json({ message: 'تم حذف الإعلان بنجاح' });
  } catch (error) {
    console.error('Error deleting ad:', error);
    res.status(500).json({ error: 'حدث خطأ أثناء حذف الإعلان.' });
  }
};




// جلب إعلانات مستخدم معين
exports.getUserAds = async (req, res) => {
  const { userId } = req.params; // استلام userId من الـ URL

  try {
    const ads = await Ad.find({ user: userId }).populate('user', 'firstName lastName email');

    if (!ads.length) {
      return res.status(404).json({ error: 'لا توجد إعلانات لهذا المستخدم.' });
    }

    res.json({ ads });
  } catch (error) {
    console.error('Error fetching user ads:', error);
    res.status(500).json({ error: 'حدث خطأ أثناء جلب إعلانات المستخدم.' });
  }
};



/* ***********/// كنترول إضافة الإعلانات وتعديل والحذف ///******** */







// إضافة معلومات الموقع الأساسية للمستخدم

exports.getBasicWebsiteInformation = async (req, res) => {
  try {
    const userId = req.user.id; // نفترض أن المستخدم مسجل الدخول

    // نستدعي المستخدم ونحدد الحقول المطلوبة:
    //  - companyName
    //  - domainName
    //  - entityType
    //  - socialMedia.phoneNumber
    //  - socialMedia.whatsappNumber
    // أو ببساطة socialMedia إذا كنت تريد جلب الكائن كاملاً
    const user = await User.findById(
      userId,
      'companyName domainName entityType socialMedia'
    );

    if (!user) {
      return res.status(404).json({ error: 'المستخدم غير موجود' });
    }

    // جهّز الاستجابة
    res.json({
      basicInformation: {
        companyName: user.companyName,
        domainName: user.domainName,
        entityType: user.entityType,
        socialMedia: {
          phoneNumber: user.socialMedia?.phoneNumber || '',
          whatsappNumber: user.socialMedia?.whatsappNumber || '',
        },
      },
    });
  } catch (error) {
    console.error('Error fetching basic website information:', error);
    res
      .status(500)
      .json({ error: 'حدث خطأ أثناء جلب معلومات الموقع الإلكتروني' });
  }
};


// إنشاء أو تحديث المعلومات الأساسية للموقع الإلكتروني
// إنشاء أو تحديث المعلومات الأساسية للموقع الإلكتروني
exports.postBasicWebsiteInformation = async (req, res) => {
  const { companyName, domainName, entityType, logoUrl } = req.body; // أضف logoUrl
  try {
    const userId = req.user.id; // نفترض أن المستخدم مسجل الدخول

    // التحقق من أن اسم النطاق غير مستخدم
    const existingDomain = await User.findOne({ domainName, _id: { $ne: userId } });
    if (existingDomain) {
      return res.status(400).json({ error: 'اسم النطاق مستخدم بالفعل' });
    }

    // التحقق من أن logoUrl صالح (اختياري)
    if (logoUrl && !isValidUrl(logoUrl)) { // تأكد من وجود دالة isValidUrl إذا لزم الأمر
      return res.status(400).json({ error: 'رابط الشعار غير صالح' });
    }

    // تحديث بيانات المستخدم
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { companyName, domainName, entityType, logoUrl }, // أضف logoUrl
      { new: true, runValidators: true } // إعادة المستند بعد التحديث مع التحقق من القيم
    );

    if (!updatedUser) {
      return res.status(404).json({ error: 'المستخدم غير موجود' });
    }

    res.json({ message: 'تم تحديث المعلومات بنجاح' });
  } catch (error) {
    console.error('Error updating basic website information:', error);
    res.status(500).json({ error: 'حدث خطأ أثناء تحديث معلومات الموقع الإلكتروني' });
  }
};

// دالة مساعدة للتحقق من الرابط (اختياري)
function isValidUrl(url) {
  try {
    new URL(url);
    return true;
  } catch (_) {
    return false;
  }
}


// حذف معلومات الموقع الإلكتروني الأساسية
exports.deleteBasicWebsiteInformation = async (req, res) => {
  try {
    const userId = req.user.id; // نفترض أن المستخدم مسجل الدخول

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { companyName: null, domainName: null, entityType: null },
      { new: true }
    );

    if (!updatedUser) {
      return res.status(404).json({ error: 'المستخدم غير موجود' });
    }

    res.json({ message: 'تم حذف معلومات الموقع الإلكتروني بنجاح' });
  } catch (error) {
    console.error('Error deleting basic website information:', error);
    res.status(500).json({ error: 'حدث خطأ أثناء حذف معلومات الموقع الإلكتروني' });
  }
};





//**  جلب بيانات المستخدم من خلال رابط موقعه 

// جلب بيانات المستخدم باستخدام domainName
// exports.getUserByDomain = async (req, res) => {
//   const { domainName } = req.params;
//   const { limit = 10, page = 1 } = req.query; // القيم الافتراضية: الحد 10، الصفحة الأولى

//   try {
//     const user = await User.findOne({ domainName })
//       .select('firstName lastName email phone accountType companyName domainName entityType logoUrl') // الحقول المطلوبة فقط
//       .populate({
//         path: 'ads',
//         select: 'title adType city features price originalPrice image isFeatured statusText', // الحقول المحدثة
//         options: {
//           limit: parseInt(limit), // تحويل limit إلى رقم
//           skip: (parseInt(page) - 1) * parseInt(limit) // تخطي العناصر بناءً على الصفحة
//         }
//       });

//     if (!user) {
//       return res.status(404).json({ error: 'المستخدم غير موجود أو اسم النطاق غير صحيح.' });
//     }

//     res.json({
//       profile: {
//         fullName: `${user.firstName} ${user.lastName}`,
//         logoUrl: user.logoUrl,
//         email: user.email,
//         phone: user.phone,
//         accountType: user.accountType,
//         companyName: user.companyName,
//         domainName: user.domainName,
//         entityType: user.entityType,
//         ads: user.ads // الإعلانات مع الحقول الجديدة
//       }
//     });
//   } catch (error) {
//     console.error('Error fetching user by domainName:', error);
//     res.status(500).json({ error: 'حدث خطأ أثناء جلب بيانات المستخدم.' });
//   }
// };



exports.getUserByDomain = async (req, res) => {
  const { domainName } = req.params;
  const { limit = 10, page = 1 } = req.query; // قيم افتراضية للحد والصفحة

  try {
    // 1) البحث عن المستخدم بناءً على domainName
    const user = await User.findOne({ domainName })
      .select('firstName lastName email phone accountType companyName domainName entityType logoUrl');

    if (!user) {
      return res
        .status(404)
        .json({ error: 'المستخدم غير موجود أو اسم النطاق غير صحيح.' });
    }

    // 2) جلب الإعلانات المرتبطة بالمستخدم والتي حالتها "منشور"
    const ads = await Ad.find({
      user: user._id,
      status: 'منشور'  // عرض الإعلانات ذات الحالة "منشور" فقط
    })
  
      .select('title adType city bedrooms bathrooms landSize discountPrice district subCategory propertyType features price originalPrice image images isFeatured statusText')
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit));

    // 3) بناء استجابة JSON تحتوي بيانات المستخدم + الإعلانات
    return res.json({
      profile: {
        fullName: `${user.firstName} ${user.lastName}`,
        logoUrl: user.logoUrl,
        email: user.email,
        phone: user.phone,
        accountType: user.accountType,
        companyName: user.companyName,
        domainName: user.domainName,
        entityType: user.entityType,
        ads // المصفوفة الناتجة عن الاستعلام
      }
    });
  } catch (error) {
    console.error('Error fetching user by domainName:', error);
    return res
      .status(500)
      .json({ error: 'حدث خطأ أثناء جلب بيانات المستخدم.' });
  }
};


//// جلب بيانات المستخدم من خلال رابط موقعه //




// جلب بيانات العلان بستخدام id الاعلان من الرابظ 

// exports.getAdById = async (req, res) => {
//   const { domainName, id } = req.params;

//   // التحقق من صحة ID الإعلان
//   if (!mongoose.Types.ObjectId.isValid(id)) {
//     return res.status(400).json({ error: 'الرقم التعريفي للإعلان غير صالح' });
//   }

//   try {
//     // البحث عن المستخدم باستخدام domainName
//     const user = await User.findOne({ domainName }).populate('ads');

//     // إذا لم يتم العثور على المستخدم
//     if (!user) {
//       return res.status(404).json({ error: 'المستخدم غير موجود' });
//     }

//     // التحقق مما إذا كان الإعلان ينتمي إلى المستخدم
//     const adExists = user.ads.some(ad => ad._id.toString() === id);

//     if (!adExists) {
//       return res.status(403).json({ error: 'لا تملك الإذن للوصول إلى هذا الإعلان' });
//     }

//     // جلب الإعلان إذا كان ينتمي إلى المستخدم
//     const ad = await Ad.findById(id);

//     // إذا لم يتم العثور على الإعلان
//     if (!ad) {
//       return res.status(404).json({ error: 'الإعلان غير موجود' });
//     }

//     // إرجاع الإعلان
//     res.status(200).json(ad);
//   } catch (error) {
//     console.error('خطأ في جلب الإعلان:', error.message);
//     res.status(500).json({ error: 'خطأ في الخادم' });
//   }
// };





exports.getAdById = async (req, res) => {
  const { domainName, id } = req.params;

  // 1) التحقق من صحة ID الإعلان
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ error: 'الرقم التعريفي للإعلان غير صالح' });
  }

  try {
    // 2) البحث عن المستخدم باستخدام domainName
    const user = await User.findOne({ domainName });
    if (!user) {
      return res.status(404).json({ error: 'المستخدم غير موجود' });
    }

    // 3) البحث عن الإعلان المرتبط بالمستخدم والحالة "منشور"
    const ad = await Ad.findOne({
      _id: id,
      user: user._id,
      status: 'منشور' // نعرض الإعلانات ذات الحالة "منشور" فقط
    });

    if (!ad) {
      // لم يتم العثور على إعلان بهذا المعرف أو أنّه ليس في حالة "منشور"
      return res.status(403).json({
        error: 'لا تملك الإذن للوصول إلى هذا الإعلان أو الإعلان غير موجود'
      });
    }

    // 4) إذا تم العثور على الإعلان بحالة "منشور"، قم بإرجاعه
    return res.status(200).json(ad);

  } catch (error) {
    console.error('خطأ في جلب الإعلان:', error.message);
    return res.status(500).json({ error: 'خطأ في الخادم' });
  }
};


// جلب بيانات العلان بستخدام id الاعلان من الرابظ ///







// اعطا العلانات للداش بود ويتعف علا المستخدم من التوكن 

// دالة لجلب جميع إعلانات المستخدم الحالي
exports.getUserAdss = async (req, res) => {
  try {
    // الحصول على معرف المستخدم من الكائن req.user الذي تم إضافته بواسطة Middleware المصادقة
    const userId = req.user.id; // استخدام 'id' بدلاً من '_id' بناءً على بيانات التوكن
    
    console.log('معرف المستخدم المستخرج من التوكن:', userId); // سجل للتحقق

    // جلب جميع الإعلانات المرتبطة بالمستخدم، باستثناء الإعلانات التي حالتها "مسودة" (status = "مسودة")
    // مع ترتيبها تنازليًا بالأحدث أولاً
    const ads = await Ad.find({
      user: userId,
      status: { $ne: 'مسودة' } // شرط لاستبعاد الإعلانات ذات الحالة "مسودة"
    })
    .populate('user', 'firstName lastName email')
    .sort({ createdAt: -1 });

    console.log('عدد الإعلانات المسترجعة:', ads.length); // سجل للتحقق

    res.status(200).json({
      success: true,
      count: ads.length,
      data: ads,
    });
  } catch (error) {
    console.error('خطأ في جلب الإعلانات:', error);
    res.status(500).json({ error: 'حدث خطأ في الخادم' });
  }
};






// الحصول على تفاصيل إعلان معين

exports.getAdDetails = async (req, res) => {
  try {
    const { adId } = req.params;

    // التحقق من وجود معرف الإعلان
    if (!adId) {
      return res.status(400).json({ error: 'معرف الإعلان مطلوب' });
    }

    // جلب الإعلان بناءً على المعرف
    const ad = await Ad.findById(adId).populate('user', 'firstName lastName email');

    if (!ad) {
      return res.status(404).json({ error: 'الإعلان غير موجود' });
    }

    res.status(200).json({
      success: true,
      data: ad,
    });
  } catch (error) {
    console.error('خطأ في جلب تفاصيل الإعلان:', error);
    res.status(500).json({ error: 'حدث خطأ في الخادم' });
  }
};





// الحصول على أحدث الإعلانات

exports.getLatestAds = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit, 10) || 10; // عدد الإعلانات الأحدث المراد جلبها

    const ads = await Ad.find({ user: req.user.id })
      .sort({ createdAt: -1 }) // ترتيب الإعلانات من الأحدث إلى الأقدم
      .limit(limit)
      .populate('user', 'firstName lastName email');

    res.status(200).json({
      success: true,
      count: ads.length,
      data: ads,
    });
  } catch (error) {
    console.error('خطأ في جلب أحدث الإعلانات:', error);
    res.status(500).json({ error: 'حدث خطأ في الخادم' });
  }
};

// البحث في الإعلانات

exports.searchAds = async (req, res) => {
  try {
    const { query } = req.query;

    if (!query) {
      return res.status(400).json({ error: 'استعلام البحث مطلوب' });
    }

    // استخدام البحث النصي في العنوان أو الوصف (بافتراض وجود حقول title و description في نموذج الإعلان)
    const ads = await Ad.find({
      user: req.user.id,
      $or: [
        { title: { $regex: query, $options: 'i' } },
        { description: { $regex: query, $options: 'i' } },
      ],
    }).populate('user', 'firstName lastName email');

    res.status(200).json({
      success: true,
      count: ads.length,
      data: ads,
    });
  } catch (error) {
    console.error('خطأ في البحث عن الإعلانات:', error);
    res.status(500).json({ error: 'حدث خطأ في الخادم' });
  }
};





// فتح مسوده لأعلان جديد 

// دالة لإنشاء إعلان بحالة "مسودة" فقط
exports.createDraftAd = async (req, res) => {
  try {
    const userId = req.user.id; // مُعرف المستخدم من التوكن

    // 1) البحث عن أي إعلان حالته 'مسودة' للمستخدم الحالي (سواء كان يحوي بيانات أم لا)
    const existingDraft = await Ad.findOne({
      user: userId,
      status: 'مسودة',
    });

    // 2) إن وُجدت مسودة، نحذفها
    if (existingDraft) {
      await Ad.deleteOne({ _id: existingDraft._id });
    }

    // 3) إنشاء إعلان جديد بحالة "مسودة"
    const draftAd = new Ad({
      user: userId,
      status: 'مسودة',
    });

    // 4) حفظ الإعلان الجديد
    await draftAd.save();

    // 5) إعادة الاستجابة
    return res.status(201).json({
      success: true,
      message: 'تم إنشاء الإعلان كمسودة بنجاح',
      ad: draftAd,
    });
  } catch (error) {
    console.error('Error creating draft ad:', error);
    return res.status(500).json({
      success: false,
      error: 'حدث خطأ أثناء إنشاء مسودة الإعلان.',
      details: error.message,
    });
  }
};
