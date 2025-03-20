// ادات تصمايم الاقايم في الكود 

/* بداية القسم  */

/**************************************** قسم رئيسي ***********************************
 *                                     قسم إدارة الإعلان
 **************************************************************************************/

// ==========================================================================
//   قسم فرعي 
// ==========================================================================

// ────────────────────────────────────────────────────────────
//   قسم ثانوي
// ────────────────────────────────────────────────────────────


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











/* بداية القسم  */

/**************************************** قسم رئيسي ***********************************
 *                                     قسم إدارة الإعلان
 **************************************************************************************/


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



/* بداية القسم  */
// ===================================== قسم فرعي =====================================
//   قسم انشاء وتعديل إعلان   
// ====================================================================================


// لتعدل على الاعلان ورفع الصور والفيديوها 

/**
 * تعديل ملفات (صور/فيديوهات) إعلان معيّن.
 * - يقوم برفع الصور والفيديوهات الجديدة.
 * - يحذف الصور والفيديوهات القديمة إذا طلب المستخدم ذلك.
 */
// مثال: adController.js

const MAX_IMAGES = 10;
const MAX_VIDEOS = 3;
// اهم داله عندي وهي مسوله عن انشاء وتعديل الاعلان 
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




// ===================================== قسم فرعي =====================================
//   قسم انشاء وتعديل إعلان   
// ====================================================================================
/* نهاية القسم  */

// هذه عرض الاعلان في لست وتحتاج إلا توكن 
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

// جلب بيانات اعلان ميعن 


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



/**************************************** قسم رئيسي ***********************************
 *                                     قسم إدارة الإعلان
 **************************************************************************************/
/* نهاية القسم  */


// <:<:<:<:<:<:<:<:<:>





































/* بداية القسم  */

/**************************************** قسم رئيسي ***********************************
 *                             قسم عرض الأعلان في القالب لا يحتج توكن 
 **************************************************************************************/



 // هذا يتم استخدامه في  عرض الاعان في واجهات القالب 

//  exports.getUserByDomain = async (req, res) => {
//   const { domainName } = req.params;
//   const { limit = 10, page = 1 } = req.query; // قيم افتراضية للحد والصفحة

//   try {
//     // 1) البحث عن المستخدم بناءً على domainName
//     const user = await User.findOne({ domainName })
//       .select('firstName lastName email phone accountType companyName domainName entityType logoUrl homepage');

//     if (!user) {
//       return res
//         .status(404)
//         .json({ error: 'المستخدم غير موجود أو اسم النطاق غير صحيح.' });
//     }

//     // 2) جلب الإعلانات المرتبطة بالمستخدم والتي حالتها "منشور"
//     const ads = await Ad.find({
//       user: user._id,
//       status: 'منشور'  // عرض الإعلانات ذات الحالة "منشور" فقط
//     })
  
//       .select('title adType city bedrooms bathrooms landSize discountPrice district subCategory propertyType features price originalPrice image images isFeatured statusText')
//       .limit(parseInt(limit))
//       .skip((parseInt(page) - 1) * parseInt(limit));

//     // 3) بناء استجابة JSON تحتوي بيانات المستخدم + الإعلانات
//     return res.json({
//       profile: {
//         fullName: `${user.firstName} ${user.lastName}`,
//         logoUrl: user.logoUrl,
//         email: user.email,
//         phone: user.phone,
//         accountType: user.accountType,
//         companyName: user.companyName,
//         domainName: user.domainName,
//         entityType: user.entityType,
//         ads // المصفوفة الناتجة عن الاستعلام
        
//       }
//     });
//   } catch (error) {
//     console.error('Error fetching user by domainName:', error);
//     return res
//       .status(500)
//       .json({ error: 'حدث خطأ أثناء جلب بيانات المستخدم.' });
//   }
// };
// controllers/userController.js

exports.getUserByDomain = async (req, res) => {
  const { domainName } = req.params;
  const { limit = 10, page = 1 } = req.query; // قيم افتراضية للحد والصفحة

  try {
    // 1) البحث عن المستخدم بناءً على domainName
    const user = await User.findOne({ domainName })
      .select('firstName lastName email phone accountType companyName domainName entityType logoUrl homepage');

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

        // إضافة بيانات الـ homepage
        homepage: user.homepage,

        // المصفوفة الناتجة عن الاستعلام
        ads
      }
    });
  } catch (error) {
    console.error('Error fetching user by domainName:', error);
    return res
      .status(500)
      .json({ error: 'حدث خطأ أثناء جلب بيانات المستخدم.' });
  }
};





 // جلب اعلان باستخدام الايدي ودمين لعرضه في القالب 

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

// هذا خاص في تغذية الخريطة


// exports.getAdsWithinBounds = async (req, res) => {
//   try {
//     const { minLat, maxLat, minLng, maxLng, domainName } = req.query;

//     // 1) تحقق من وجود domainName
//     if (!domainName) {
//       return res
//         .status(400)
//         .json({ error: 'يجب تمرير (domainName) للحصول على الإعلانات.' });
//     }

//     // 2) إيجاد المستخدم عبر domainName
//     const user = await User.findOne({ domainName }).select('_id');
//     if (!user) {
//       return res
//         .status(404)
//         .json({ error: 'المستخدم غير موجود أو اسم النطاق غير صحيح.' });
//     }

//     // 3) تحقق من الإحداثيات الأساسية (حواف الخريطة)
//     if (!minLat || !maxLat || !minLng || !maxLng) {
//       return res.status(400).json({
//         error: 'يجب تمرير الإحداثيات (minLat, maxLat, minLng, maxLng)',
//       });
//     }

//     // 4) بناء كائن الاستعلام (filter)
//     const filter = {
//       user: user._id,
//       status: 'منشور',
//       lat: { $gte: parseFloat(minLat), $lte: parseFloat(maxLat) },
//       lng: { $gte: parseFloat(minLng), $lte: parseFloat(maxLng) },
//     };

//     // 5) استعلام قاعدة البيانات مع استخدام $slice للصور
//     const ads = await Ad.find(filter)
//       .select({
//         title: 1,
//         'subCategory.label': 1,
//         city: 1,
//         lat: 1,
//         lng: 1,
//         originalPrice: 1,
//         discountPrice: 1,
//         propertyType: 1,
//         isFeatured: 1,

//         region: 1,
//         district: 1,
//         images: { $slice: 3 } // أول 3 صور فقط
//       })
//       .limit(500)
//       .lean();

//     // 6) إعادة النتائج
//     return res.json(ads);

//   } catch (error) {
//     console.error('Error in getAdsWithinBounds:', error);
//     return res
//       .status(500)
//       .json({ error: 'حدث خطأ أثناء جلب الإعلانات ضمن نطاق الخريطة.' });
//   }
// };

// exports.getAdsWithinBounds = async (req, res) => {
//   try {
//     const {
//       minLat,
//       maxLat,
//       minLng,
//       maxLng,
//       domainName,
//       // إضافة الحقول المطلوبة من req.query
//       propertyType,
//       city,
//       district,
//       subCategoryLabel
//     } = req.query;

//     // 1) تحقق من وجود domainName
//     if (!domainName) {
//       return res
//         .status(400)
//         .json({ error: 'يجب تمرير (domainName) للحصول على الإعلانات.' });
//     }

//     // 2) إيجاد المستخدم عبر domainName
//     const user = await User.findOne({ domainName }).select('_id');
//     if (!user) {
//       return res
//         .status(404)
//         .json({ error: 'المستخدم غير موجود أو اسم النطاق غير صحيح.' });
//     }

//     // 3) تحقق من الإحداثيات الأساسية (حواف الخريطة)
//     if (!minLat || !maxLat || !minLng || !maxLng) {
//       return res.status(400).json({
//         error: 'يجب تمرير الإحداثيات (minLat, maxLat, minLng, maxLng)',
//       });
//     }

//     // 4) بناء كائن الاستعلام (filter)
//     const filter = {
//       user: user._id,
//       status: 'منشور',
//       lat: { $gte: parseFloat(minLat), $lte: parseFloat(maxLat) },
//       lng: { $gte: parseFloat(minLng), $lte: parseFloat(maxLng) },
//     };

//     // 4.1) إضافة الفلاتر الاختيارية إذا وجدت في req.query
//     if (propertyType) {
//       // في حال كانت القيم مطابقة تمامًا
//       filter.propertyType = propertyType;

//       // في حال أردت البحث الجزئي يمكن الاستعانة بـ $regex
//       // filter.propertyType = { $regex: propertyType, $options: 'i' };
//     }

//     if (city) {
//       filter.city = city;
//       // أو regex للبحث الجزئي
//       // filter.city = { $regex: city, $options: 'i' };
//     }

//     if (district) {
//       filter.district = district;
//       // أو regex
//       // filter.district = { $regex: district, $options: 'i' };
//     }

//     if (subCategoryLabel) {
//       // بما أن الحقل بداخل subCategory.label
//       filter['subCategory.label'] = subCategoryLabel;
//       // أو للبحث الجزئي
//       // filter['subCategory.label'] = { $regex: subCategoryLabel, $options: 'i' };
//     }

//     // 5) استعلام قاعدة البيانات مع استخدام $slice للصور
//     const ads = await Ad.find(filter)
//       .select({
//         title: 1,
//         'subCategory.label': 1,
//         city: 1,
//         lat: 1,
//         lng: 1,
//         originalPrice: 1,
//         discountPrice: 1,
//         propertyType: 1,
//         isFeatured: 1,
//         region: 1,
//         district: 1,
//         images: { $slice: 3 } // أول 3 صور فقط
//       })
//       .limit(500)
//       .lean();

//     // 6) إعادة النتائج
//     return res.json(ads);

//   } catch (error) {
//     console.error('Error in getAdsWithinBounds:', error);
//     return res
//       .status(500)
//       .json({ error: 'حدث خطأ أثناء جلب الإعلانات ضمن نطاق الخريطة.' });
//   }
// };

// exports.getAdsWithinBounds = async (req, res) => {
//   try {
//     // بدلاً من req.query، نستخدم req.body
//     const {
//       minLat,
//       maxLat,
//       minLng,
//       maxLng,
//       domainName,
//       propertyType,
//       city,
//       district,
//       subCategoryLabel
//     } = req.body; // ← تعديل مهم

//     // سجل أي معلومات إضافية تريد رؤيتها في الكونسل
//     console.log('Received body params (FormData):', {
//       minLat,
//       maxLat,
//       minLng,
//       maxLng,
//       domainName,
//       propertyType,
//       city,
//       district,
//       subCategoryLabel
//     });

//     // 1) تحقق من وجود domainName
//     if (!domainName) {
//       return res
//         .status(400)
//         .json({ error: 'يجب تمرير (domainName) للحصول على الإعلانات.' });
//     }

//     // 2) إيجاد المستخدم عبر domainName
//     const user = await User.findOne({ domainName }).select('_id');
//     if (!user) {
//       return res
//         .status(404)
//         .json({ error: 'المستخدم غير موجود أو اسم النطاق غير صحيح.' });
//     }

//     // 3) تحقق من الإحداثيات الأساسية (حواف الخريطة)
//     if (!minLat || !maxLat || !minLng || !maxLng) {
//       return res.status(400).json({
//         error: 'يجب تمرير الإحداثيات (minLat, maxLat, minLng, maxLng)',
//       });
//     }

//     // 4) بناء كائن الاستعلام (filter)
//     const filter = {
//       user: user._id,
//       status: 'منشور',
//       lat: { $gte: parseFloat(minLat), $lte: parseFloat(maxLat) },
//       lng: { $gte: parseFloat(minLng), $lte: parseFloat(maxLng) },
//     };

//     // 4.1) إضافة الفلاتر الاختيارية إذا وجدت في req.body
//     if (propertyType) {
//       filter.propertyType = propertyType;
//     }
//     if (city) {
//       filter.city = city;
//     }
//     if (district) {
//       filter.district = district;
//     }
//     if (subCategoryLabel) {
//       filter['subCategory.label'] = subCategoryLabel;
//     }

//     // 5) استعلام قاعدة البيانات مع استخدام $slice للصور
//     const ads = await Ad.find(filter)
//       .select({
//         title: 1,
//         'subCategory.label': 1,
//         city: 1,
//         lat: 1,
//         lng: 1,
//         originalPrice: 1,
//         discountPrice: 1,
//         propertyType: 1,
//         isFeatured: 1,
//         region: 1,
//         district: 1,
//         images: { $slice: 3 },
//       })
//       .limit(500)
//       .lean();

//     // 6) إعادة النتائج
//     return res.json(ads);
//   } catch (error) {
//     console.error('Error in getAdsWithinBounds:', error);
//     return res
//       .status(500)
//       .json({ error: 'حدث خطأ أثناء جلب الإعلانات ضمن نطاق الخريطة.' });
//   }
// };

exports.getAdsWithinBounds = async (req, res) => {
  try {
    // بدلاً من req.query، نستخدم req.body
    const {
      minLat,
      maxLat,
      minLng,
      maxLng,
      domainName,
      propertyType,
      city,
      district,
      subCategoryLabel,
    } = req.body; // ← تعديل مهم

    // سجل أي معلومات إضافية تريد رؤيتها في الكونسل
    console.log('Received body params (FormData):', {
      minLat,
      maxLat,
      minLng,
      maxLng,
      domainName,
      propertyType,
      city,
      district,
      subCategoryLabel,
    });

    // 1) تحقق من وجود domainName
    if (!domainName) {
      return res
        .status(400)
        .json({ error: 'يجب تمرير (domainName) للحصول على الإعلانات.' });
    }

    // 2) إيجاد المستخدم عبر domainName
    const user = await User.findOne({ domainName }).select('_id');
    if (!user) {
      return res
        .status(404)
        .json({ error: 'المستخدم غير موجود أو اسم النطاق غير صحيح.' });
    }

    // 3) تحقق من الإحداثيات الأساسية (حواف الخريطة)
    if (!minLat || !maxLat || !minLng || !maxLng) {
      return res.status(400).json({
        error: 'يجب تمرير الإحداثيات (minLat, maxLat, minLng, maxLng)',
      });
    }

    // 4) بناء كائن الاستعلام (filter)
    const filter = {
      user: user._id,
      status: 'منشور',
      lat: { $gte: parseFloat(minLat), $lte: parseFloat(maxLat) },
      lng: { $gte: parseFloat(minLng), $lte: parseFloat(maxLng) },
    };

    // 4.1) إضافة الفلاتر الاختيارية إذا كانت متوفرة وصالحة
    // إذا كان propertyType غير فارغ ولا يساوي "الكل"
    if (propertyType && propertyType !== '' && propertyType !== 'الكل') {
      filter.propertyType = propertyType;
    }

    // إذا كان city موجود
    if (city) {
      filter.city = city;
    }

    // إذا كان district موجود
    if (district) {
      filter.district = district;
    }

    // إذا كان subCategoryLabel غير فارغ ولا يساوي "الكل"
    if (subCategoryLabel && subCategoryLabel !== '' && subCategoryLabel !== 'الكل') {
      filter['subCategory.label'] = subCategoryLabel;
    }

    // 5) استعلام قاعدة البيانات مع استخدام $slice للصور
    const ads = await Ad.find(filter)
      .select({
        title: 1,
        'subCategory.label': 1,
        city: 1,
        lat: 1,
        lng: 1,
        originalPrice: 1,
        discountPrice: 1,
        propertyType: 1,
        isFeatured: 1,
        region: 1,
        district: 1,
        images: { $slice: 3 },
      })
      .limit(500)
      .lean();

    // 6) إعادة النتائج
    return res.json(ads);
  } catch (error) {
    console.error('Error in getAdsWithinBounds:', error);
    return res
      .status(500)
      .json({ error: 'حدث خطأ أثناء جلب الإعلانات ضمن نطاق الخريطة.' });
  }
};


/**************************************** قسم رئيسي ***********************************
 *                             قسم عرض الأعلان في القالب لا يحتج توكن 
 **************************************************************************************/
/* نهاية القسم  */



















/* بداية القسم  */
/**************************************** قسم رئيسي ***********************************
 *                                     البيانات الاساسيه للمستخدم 
 **************************************************************************************/


// إضافة معلومات الموقع الأساسية للمستخدم

exports.getBasicWebsiteInformation = async (req, res) => {
  try {
    const userId = req.user.id; // نفترض أن المستخدم مسجل الدخول

    // نستدعي المستخدم ونحدد الحقول المطلوبة
    // يمكنك كتابة 'socialMedia branches' لجلب الكائنين كاملين:
    const user = await User.findById(
      userId,
      'companyName domainName entityType socialMedia branches homepage about'
    );

    if (!user) {
      return res.status(404).json({ error: 'المستخدم غير موجود' });
    }

    // مثال: إرسال كامل الكائن socialMedia + branches
    // (بما فيها email وجميع المنصات من Facebook إلى Telegram ...)
    res.json({
      basicInformation: {
        companyName: user.companyName,
        domainName: user.domainName,
        entityType: user.entityType,
        socialMedia: user.socialMedia, 
        branches: user.branches,
        homepage:user.homepage,
        about:user.about,
      },
    });
  } catch (error) {
    console.error('Error fetching basic website information:', error);
    res.status(500).json({ error: 'حدث خطأ أثناء جلب معلومات الموقع الإلكتروني' });
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






/**************************************** قسم رئيسي ***********************************
 *                                     البيانات الاساسيه للمستخدم 
 **************************************************************************************/
/* نهاية القسم  */






















/* بداية القسم  */
/**************************************** قسم رئيسي ***********************************
 *                                           البحث 
 **************************************************************************************/


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





/**************************************** قسم رئيسي ***********************************
 *                                           البحث 
 **************************************************************************************/
/* نهاية القسم  */