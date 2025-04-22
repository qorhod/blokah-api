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
const SubscriptionPackage = require('../../models/subscriptionPackage');

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
// exports.getUserAdss = async (req, res) => {
//   try {
//     // الحصول على معرف المستخدم من الكائن req.user الذي تم إضافته بواسطة Middleware المصادقة
//     const userId = req.user.id; // استخدام 'id' بدلاً من '_id' بناءً على بيانات التوكن
    
//     console.log('معرف المستخدم المستخرج من التوكن:', userId); // سجل للتحقق

//     // جلب جميع الإعلانات المرتبطة بالمستخدم، باستثناء الإعلانات التي حالتها "مسودة" (status = "مسودة")
//     // مع ترتيبها تنازليًا بالأحدث أولاً
//     const ads = await Ad.find({
//       user: userId,
//       status: { $ne: 'مسودة' } // شرط لاستبعاد الإعلانات ذات الحالة "مسودة"
//     })
//     .populate('user', 'firstName lastName email')
//     .sort({ createdAt: -1 });

//     console.log('عدد الإعلانات المسترجعة:', ads.length); // سجل للتحقق

//     res.status(200).json({
//       success: true,
//       count: ads.length,
//       data: ads,
//     });
//   } catch (error) {
//     console.error('خطأ في جلب الإعلانات:', error);
//     res.status(500).json({ error: 'حدث خطأ في الخادم' });
//   }
// };

exports.getUserAdss = async (req, res) => {
  try {
    const userId = req.user.id;
    // page=2 => skip= (2-1)*limit= limit
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const totalAds = await Ad.countDocuments({
      user: userId,
      status: { $ne: 'مسودة' }
    });

    // مثلاً: console.log(`نحن في الصفحة ${page}, skip=${skip}, limit=${limit}`);

    const ads = await Ad.find({
      user: userId,
      status: { $ne: 'مسودة' }
    })
      .populate('user', 'firstName lastName email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    res.status(200).json({
      success: true,
      totalAds,  
      page,      
      limit,     
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


// عرض اعلان بستخدام الرابط 

// exports.getAdByIdForWebsiteUrl = async (req, res) => {
//   const { websiteUrl, id } = req.params;

//   // 1) التحقق من صحة ID الإعلان
//   if (!mongoose.Types.ObjectId.isValid(id)) {
//     return res.status(400).json({ error: 'الرقم التعريفي للإعلان غير صالح' });
//   }

//   try {
//     // 2) البحث عن المستخدم باستخدام websiteUrl
//     const user = await User.findOne({ websiteUrl });
//     if (!user) {
//       return res.status(404).json({ error: 'المستخدم غير موجود' });
//     }

//     // 3) البحث عن الإعلان المرتبط بالمستخدم والحالة "منشور"
//     const ad = await Ad.findOne({
//       _id: id,
//       user: user._id,
//       status: 'منشور' // نعرض الإعلانات ذات الحالة "منشور" فقط
//     });

//     if (!ad) {
//       // لم يتم العثور على إعلان بهذا المعرف أو أنّه ليس في حالة "منشور"
//       return res.status(403).json({
//         error: 'لا تملك الإذن للوصول إلى هذا الإعلان أو الإعلان غير موجود'
//       });
//     }

//     // 4) إذا تم العثور على الإعلان بحالة "منشور"، قم بإرجاعه
//     return res.status(200).json(ad);

//   } catch (error) {
//     console.error('خطأ في جلب الإعلان:', error.message);
//     return res.status(500).json({ error: 'خطأ في الخادم' });
//   }
// };

// جلب إعلان واحد (مع إخفاء الإحداثيات إذا كان الموقع تقريبي)
// exports.getAdByIdForWebsiteUrl = async (req, res) => {
//   const { websiteUrl, id } = req.params;

//   // 1) التحقق من صحة رقم هوية الإعلان
//   if (!mongoose.Types.ObjectId.isValid(id)) {
//     return res.status(400).json({ error: 'الرقم التعريفي للإعلان غير صالح' });
//   }

//   try {
//     // 2) البحث عن المستخدم بالـ websiteUrl
//     const user = await User.findOne({ websiteUrl });
//     if (!user) {
//       return res.status(404).json({ error: 'المستخدم غير موجود' });
//     }

//     // 3) البحث عن إعلان «منشور» يخص هذا المستخدم
//     const ad = await Ad.findOne({
//       _id: id,
//       user: user._id,
//       status: 'منشور',
//     }).lean();           // ← نحوله إلى كائن عادي

//     if (!ad) {
//       return res.status(403).json({
//         error: 'لا تملك الإذن للوصول إلى هذا الإعلان أو الإعلان غير موجود',
//       });
//     }

//     // 4) إخفاء الإحداثيات إذا كان الموقع «تقريبي»
//     if (ad.locationType === 'approximate') {
//       delete ad.lat;
//       delete ad.lng;
//     }

//     // 5) إرجاع الإعلان
//     return res.status(200).json(ad);
//   } catch (error) {
//     console.error('خطأ في جلب الإعلان:', error.message);
//     return res.status(500).json({ error: 'خطأ في الخادم' });
//   }
// };


/**
 * GET /api/website/:websiteUrl/ads/:id
 * يجلب إعلاناً واحداً «منشوراً» يخص المستخدم المرتبط بالـ websiteUrl
 */
exports.getAdByIdForWebsiteUrl = async (req, res) => {
  const { websiteUrl, id } = req.params;

  /*────────── 1) التحقق من صحة الـObjectId ──────────*/
  if (!mongoose.Types.ObjectId.isValid(id))
    return res.status(400).json({ error: 'الرقم التعريفي للإعلان غير صالح' });

  try {
    /*────────── 2) إيجاد الباقة ثم المستخدم ──────────*/
    const pkg = await SubscriptionPackage.findOne({
      'domainInfo.websiteUrl': websiteUrl,
    });
    if (!pkg)
      return res.status(404).json({ error: 'لا يوجد اشتراك بهذا الدومين' });

    const user = await User.findById(pkg.user);
    if (!user)
      return res.status(404).json({ error: 'المستخدم المرتبط بالدومين غير موجود' });

    /*────────── 3) البحث عن الإعلان «المنشور» لهذا المستخدم ──────────*/
    const ad = await Ad.findOne({
      _id: id,
      user: user._id,
      status: 'منشور',
    }).lean();

    if (!ad)
      return res.status(403).json({
        error: 'لا تملك الإذن للوصول إلى هذا الإعلان أو الإعلان غير موجود',
      });

    /*────────── 4) إخفاء الإحداثيات إذا كان الموقع تقريبي ──────────*/
    if (ad.locationType === 'approximate') {
      delete ad.lat;
      delete ad.lng;
    }

    /*────────── 5) الرد الناجح ───────────────────────*/
    return res.status(200).json(ad);
  } catch (error) {
    console.error('خطأ في جلب الإعلان:', error);
    return res.status(500).json({ error: 'خطأ في الخادم' });
  }
};


// خاص في عرض الخريطه بستخدام رابط الموقع 

// exports.getAdsWithinBoundsForWebsiteUrl = async (req, res) => {
//   try {
//     // بدلاً من req.query، نستخدم req.body
//     const {
//       minLat,
//       maxLat,
//       minLng,
//       maxLng,
//       websiteUrl,
//       propertyType,
//       city,
//       district,
//       subCategoryLabel,
//     } = req.body; // ← تعديل مهم

//     // سجل أي معلومات إضافية تريد رؤيتها في الكونسل
//     console.log('Received body params (FormData):', {
//       minLat,
//       maxLat,
//       minLng,
//       maxLng,
//       websiteUrl,
//       propertyType,
//       city,
//       district,
//       subCategoryLabel,
//     });

//     // 1) تحقق من وجود websiteUrl
//     if (!websiteUrl) {
//       return res
//         .status(400)
//         .json({ error: 'يجب تمرير (websiteUrl) للحصول على الإعلانات.' });
//     }

//     // 2) إيجاد المستخدم عبر websiteUrl
//     const user = await User.findOne({ websiteUrl }).select('_id');
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

//     // 4.1) إضافة الفلاتر الاختيارية إذا كانت متوفرة وصالحة
//     // إذا كان propertyType غير فارغ ولا يساوي "الكل"
//     if (propertyType && propertyType !== '' && propertyType !== 'الكل') {
//       filter.propertyType = propertyType;
//     }

//     // إذا كان city موجود
//     if (city) {
//       filter.city = city;
//     }

//     // إذا كان district موجود
//     if (district) {
//       filter.district = district;
//     }

//     // إذا كان subCategoryLabel غير فارغ ولا يساوي "الكل"
//     if (subCategoryLabel && subCategoryLabel !== '' && subCategoryLabel !== 'الكل') {
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


// خاص في الخيطه ولاكنه يقوم  بعد ارسل إلا التي موقع دقيق فقط 
// exports.getAdsWithinBoundsForWebsiteUrl = async (req, res) => {
//   try {
//     // نعتمد القيم المرسَلة في body (مثلاً عبر FormData)
//     const {
//       minLat,
//       maxLat,
//       minLng,
//       maxLng,
//       websiteUrl,
//       propertyType,
//       city,
//       district,
//       subCategoryLabel,
//     } = req.body;

//     console.log('Received body params (FormData):', {
//       minLat,
//       maxLat,
//       minLng,
//       maxLng,
//       websiteUrl,
//       propertyType,
//       city,
//       district,
//       subCategoryLabel,
//     });

//     /* 1) التحقق من وجود websiteUrl */
//     if (!websiteUrl) {
//       return res
//         .status(400)
//         .json({ error: 'يجب تمرير (websiteUrl) للحصول على الإعلانات.' });
//     }

//     /* 2) العثور على المستخدم */
//     const user = await User.findOne({ websiteUrl }).select('_id');
//     if (!user) {
//       return res
//         .status(404)
//         .json({ error: 'المستخدم غير موجود أو اسم النطاق غير صحيح.' });
//     }

//     /* 3) التحقق من إحداثيات حدود الخريطة */
//     if (!minLat || !maxLat || !minLng || !maxLng) {
//       return res.status(400).json({
//         error: 'يجب تمرير الإحداثيات (minLat, maxLat, minLng, maxLng)',
//       });
//     }

//     /* 4) بناء فلتر الاستعلام */
//     const filter = {
//       user: user._id,
//       status: 'منشور',
//       locationType: 'precise',                   // ← الشرط الجديد
//       lat: { $gte: parseFloat(minLat), $lte: parseFloat(maxLat) },
//       lng: { $gte: parseFloat(minLng), $lte: parseFloat(maxLng) },
//     };

//     /* 4.1) فلاتر اختيارية */
//     if (propertyType && propertyType !== '' && propertyType !== 'الكل') {
//       filter.propertyType = propertyType;
//     }
//     if (city) filter.city = city;
//     if (district) filter.district = district;
//     if (subCategoryLabel && subCategoryLabel !== '' && subCategoryLabel !== 'الكل') {
//       filter['subCategory.label'] = subCategoryLabel;
//     }

//     /* 5) جلب الإعلانات */
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

//     /* 6) إرسال النتائج */
//     return res.json(ads);
//   } catch (error) {
//     console.error('Error in getAdsWithinBounds:', error);
//     return res
//       .status(500)
//       .json({ error: 'حدث خطأ أثناء جلب الإعلانات ضمن نطاق الخريطة.' });
//   }
// };


/**
 * POST /api/website/ads-within-bounds
 * body (FormData أو JSON):
 * {
 *   minLat, maxLat, minLng, maxLng,
 *   websiteUrl, propertyType, city, district, subCategoryLabel
 * }
 */
exports.getAdsWithinBoundsForWebsiteUrl = async (req, res) => {
  try {
    /*────────── 1) تفريغ القيم من الـBody ──────────*/
    const {
      minLat,
      maxLat,
      minLng,
      maxLng,
      websiteUrl,
      propertyType,
      city,
      district,
      subCategoryLabel,
    } = req.body;

    console.log('Received body params:', {
      minLat,
      maxLat,
      minLng,
      maxLng,
      websiteUrl,
      propertyType,
      city,
      district,
      subCategoryLabel,
    });

    /*────────── 2) تحقق من websiteUrl ──────────*/
    if (!websiteUrl)
      return res.status(400).json({ error: 'يجب تمرير websiteUrl.' });

    /*────────── 3) إيجاد الباقة ثم المعرّف المستخدم ──────────*/
    const pkg = await SubscriptionPackage.findOne(
      { 'domainInfo.websiteUrl': websiteUrl },
      'user'
    );
    if (!pkg)
      return res.status(404).json({ error: 'لا يوجد اشتراك بهذا الرابط.' });

    const userId = pkg.user;

    // (اختياري) تأكد أن المستخدم موجود فعلاً
    const userExists = await User.exists({ _id: userId });
    if (!userExists)
      return res.status(404).json({ error: 'المستخدم غير موجود.' });

    /*────────── 4) التحقّق من الإحداثيات ──────────*/
    if (
      minLat === undefined || maxLat === undefined ||
      minLng === undefined || maxLng === undefined
    ) {
      return res.status(400).json({
        error: 'يجب تمرير الإحداثيات (minLat, maxLat, minLng, maxLng).',
      });
    }

    /*────────── 5) بناء فلتر البحث ──────────*/
    const filter = {
      user: userId,
      status: 'منشور',
      locationType: 'precise',
      lat: { $gte: parseFloat(minLat), $lte: parseFloat(maxLat) },
      lng: { $gte: parseFloat(minLng), $lte: parseFloat(maxLng) },
    };

    if (propertyType && propertyType !== '' && propertyType !== 'الكل')
      filter.propertyType = propertyType;

    if (city)     filter.city     = city;
    if (district) filter.district = district;

    if (subCategoryLabel && subCategoryLabel !== '' && subCategoryLabel !== 'الكل')
      filter['subCategory.label'] = subCategoryLabel;

    /*────────── 6) جلب الإعلانات ──────────*/
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

    /*────────── 7) الرد ────────────────────*/
    return res.json(ads);
  } catch (error) {
    console.error('Error in getAdsWithinBoundsForWebsiteUrl:', error);
    return res.status(500).json({
      error: 'حدث خطأ أثناء جلب الإعلانات ضمن نطاق الخريطة.',
    });
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

// exports.getBasicWebsiteInformation = async (req, res) => {
//   try {
//     const userId = req.user.id; // نفترض أن المستخدم مسجل الدخول

//     // نستدعي المستخدم ونحدد الحقول المطلوبة
//     // يمكنك كتابة 'socialMedia branches' لجلب الكائنين كاملين:
//     const user = await User.findById(
//       userId,
//       'logoUrl companyName domainName entityType socialMedia branches homepage about email websiteUrl'
//     );

//     if (!user) {
//       return res.status(404).json({ error: 'المستخدم غير موجود' });
//     }

//     // مثال: إرسال كامل الكائن socialMedia + branches
//     // (بما فيها email وجميع المنصات من Facebook إلى Telegram ...)
//     res.json({
//       basicInformation: {
//         companyName: user.companyName,
//         domainName: user.domainName,
//         entityType: user.entityType,
//         socialMedia: user.socialMedia, 
//         branches: user.branches,
//         homepage:user.homepage,
//         about:user.about,
//         logoUrl:user.logoUrl,
//         email:user.email,
//         websiteUrl:user.websiteUrl
//       },
//     });
//   } catch (error) {
//     console.error('Error fetching basic website information:', error);
//     res.status(500).json({ error: 'حدث خطأ أثناء جلب معلومات الموقع الإلكتروني' });
//   }
// };


/**
 * GET /api/website/me/basic-info
 * يعتمد على وجود req.user.id (مستخدم مُسجَّل الدخول بواسطة middleware Auth)
 */
exports.getBasicWebsiteInformation = async (req, res) => {
  try {
    const userId = req.user.id;

    /*────────── 1) جلب بيانات المستخدم الأساسية ──────────*/
    // حذف websiteUrl من الإسقاط لأنه لم يعد في User
    const user = await User.findById(
      userId,
      'logoUrl companyName domainName entityType socialMedia branches homepage about email'
    ).lean();

    if (!user)
      return res.status(404).json({ error: 'المستخدم غير موجود' });

    /*────────── 2) جلب websiteUrl من SubscriptionPackage ──────────*/
    const pkg = await SubscriptionPackage
      .findOne({ user: userId })
      .sort({ createdAt: -1 })           // آخر باقة
      .select('domainInfo.websiteUrl')
      .lean();

    const websiteUrl = pkg?.domainInfo?.websiteUrl ?? null;

    /*────────── 3) تجهيز الرد ──────────────────────────────*/
    return res.json({
      basicInformation: {
        companyName: user.companyName,
        domainName:  user.domainName,
        entityType:  user.entityType,
        socialMedia: user.socialMedia,
        branches:    user.branches,
        homepage:    user.homepage,
        about:       user.about,
        logoUrl:     user.logoUrl,
        email:       user.email,
        websiteUrl,                       // مصدره الباقة
      },
    });
  } catch (error) {
    console.error('Error fetching basic website information:', error);
    return res.status(500).json({
      error: 'حدث خطأ أثناء جلب معلومات الموقع الإلكتروني',
    });
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


// فيلت ارسخاج المرن والحيا للمستخدم 


// exports.getCitiesAndOptionalDistricts = async (req, res) => {
//   try {
//     // الخطوة 1: جلب قائمة جميع المدن (distinct)
//     const cities = await Ad.distinct("city");  
//     // مثال: ["الرياض","جدة","أبها", ...]

//     // الخطوة 2: التحقق إن كان العميل أرسل city في الاستعلام
//     const { city } = req.query;
//     let districts = [];

//     if (city) {
//       // إذا وصل اسم مدينة، نجلب أحيائها دون تكرار
//       districts = await Ad.distinct("district", { city: city });
//       // مثال: ["حي الملز","حي العليا","حي النسيم"]
//     }

//     // الخطوة 3: إعادة استجابة موحّدة
//     // نعيد المدينة المختارة (إن وجدت) + قائمة المدن + قائمة الأحياء (إن وجدت)
//     return res.json({
//       selectedCity: city || null,
//       cities,         // جميع المدن
//       districts       // أحياء المدينة المختارة (فارغة إذا لم يُرسل city)
//     });

//   } catch (error) {
//     console.error("Error in getCitiesAndOptionalDistricts:", error);
//     return res.status(500).json({ message: "Server Error" });
//   }
// };


/**
 * GET /ads/by-website?websiteUrl=XXXX
 * يجلب الإعلانات الخاصة بالمستخدم ذي websiteUrl المرسل
 */
// exports.getCitiesAndDistrictsByWebsiteUrl = async (req, res) => {
//   try {
//     const { websiteUrl, city: selectedCity } = req.query;
//     if (!websiteUrl) {
//       return res.status(400).json({ message: "Website URL is required" });
//     }

//     // 1) العثور على المستخدم
//     const user = await User.findOne({ websiteUrl });
//     if (!user) {
//       return res.status(404).json({ message: "No user found with this websiteUrl" });
//     }

//     // 2) جلب كل الإعلانات الخاصة بهذا المستخدم
//     const ads = await Ad.find({
//       user: user._id,
//       status: 'منشور' // افتراضًا جلب المنشورة فقط
//     });

//     // 3) استخراج جميع قيم المدن (city) دون تكرار
//     const allCities = [...new Set(ads.map(ad => ad.city).filter(Boolean))];  
//     // filter(Boolean) لإزالة القيم الفارغة أو undefined.

//     // 4) إذا هناك بارام city، سنجلب فقط الأحياء الخاصة بها
//     let districts = [];
//     if (selectedCity) {
//       // رشّح فقط الإعلانات لنفس المدينة
//       const adsInCity = ads.filter(ad => ad.city === selectedCity);
//       // استخرج الأحياء
//       districts = [...new Set(adsInCity.map(ad => ad.district).filter(Boolean))];
//     }

//     // 5) إعادة الاستجابة
//     return res.json({
//       cities: allCities,
//       selectedCity: selectedCity || null,
//       districts
//     });
//   } catch (error) {
//     console.error("Error in getCitiesAndDistrictsByWebsiteUrl:", error);
//     return res.status(500).json({ message: "Server Error" });
//   }
// };




/**
 * GET /api/website/locations?websiteUrl=example.sa&city=الرياض
 * يعيد قائمة المدن ثم الأحياء (districts) إذا أُرسل بارام city
 */
exports.getCitiesAndDistrictsByWebsiteUrl = async (req, res) => {
  try {
    const { websiteUrl, city: selectedCity } = req.query;

    /*────────── 1) التحقق من websiteUrl ──────────*/
    if (!websiteUrl)
      return res.status(400).json({ message: 'Website URL is required' });

    /*────────── 2) إيجاد الباقة ثم المعرّف المستخدم ──────────*/
    const pkg = await SubscriptionPackage.findOne({
      'domainInfo.websiteUrl': websiteUrl,
    }).select('user');

    if (!pkg)
      return res.status(404).json({
        message: 'No subscription found with this websiteUrl',
      });

    const userId = pkg.user;
    // (اختياري) تأكد أن المستخدم موجود
    const userExists = await User.exists({ _id: userId });
    if (!userExists)
      return res.status(404).json({
        message: 'User linked to this websiteUrl not found',
      });

    /*────────── 3) جلب الإعلانات المنشورة لهذا المستخدم ──────────*/
    const ads = await Ad.find({
      user: userId,
      status: 'منشور',
    }).lean();

    /*────────── 4) استخراج قائمة المدن بدون تكرار ──────────*/
    const cities = [
      ...new Set(ads.map((ad) => ad.city).filter(Boolean)),
    ];

    /*────────── 5) استخراج الأحياء إذا تم تحديد مدينة ──────────*/
    let districts = [];
    if (selectedCity) {
      districts = [
        ...new Set(
          ads
            .filter((ad) => ad.city === selectedCity)
            .map((ad) => ad.district)
            .filter(Boolean)
        ),
      ];
    }

    /*────────── 6) الرد ────────────────────────────────*/
    return res.json({
      cities,
      selectedCity: selectedCity || null,
      districts,
    });
  } catch (error) {
    console.error('Error in getCitiesAndDistrictsByWebsiteUrl:', error);
    return res.status(500).json({ message: 'Server Error' });
  }
};


/**************************************** قسم رئيسي ***********************************
 *                                           البحث 
 **************************************************************************************/
/* نهاية القسم  */
















/* بداية القسم  */
/**************************************** قسم رئيسي ***********************************
 *             تغذية السكرتات المدفوعه بابيانات مع طريق الأستفسار بارابط 
 **************************************************************************************/



// دالة واحدة لإضافة أو تعديل حقل websiteUrl فقط.
// exports.createOrUpdateWebsiteUrl = async (req, res) => {
//   try {
//     // استخرجنا هنا scriptNamePaidDomain من req.body مع websiteUrl
//     const { userId, websiteUrl, scriptNamePaidDomain } = req.body;

//     // في حالة وصول userId => تعديل الحقول
//     if (userId) {
//       const updatedUser = await User.findByIdAndUpdate(
//         userId,
//         {
//           websiteUrl,
//           scriptNamePaidDomain  // إضافة الحقل الجديد
//         },
//         { new: true } // لإعادة المستند بعد التحديث
//       );

//       if (!updatedUser) {
//         return res.status(404).json({ message: 'المستخدم غير موجود.' });
//       }

//       return res.status(200).json({
//         message: 'تم تحديث البيانات بنجاح',
//         user: updatedUser
//       });
//     } 
//     // في حالة عدم وجود userId => إنشاء مستخدم جديد
//     else {
//       const newUser = new User({
//         websiteUrl,
//         scriptNamePaidDomain  // إضافة الحقل الجديد
//       });

//       await newUser.save();

//       return res.status(201).json({
//         message: 'تم إنشاء مستخدم جديد بالبيانات بنجاح',
//         user: newUser
//       });
//     }
//   } catch (error) {
//     console.error(error);
//     return res.status(500).json({ message: 'حدث خطأ في السيرفر', error });
//   }
// };



// هذا للستعلام باستحدام websiteUrl واعداه websiteUrl و scriptNamePaidDomain 
// exports.getScriptInfoByWebsiteUrl = async (req, res) => {
//   try {
//     const { websiteUrl } = req.body;

//     // ابحث عن المستخدم بناءً على websiteUrl
//     // لاحظ أننا استخدمنا findOne لأنه من المفترض أن يكون لكل مستخدم رابط خاص
//     // استخدمنا في الحقل الثاني السلاسل المطلوبة فقط لاسترجاعها (Projection)
//     const user = await User.findOne({ websiteUrl }, 'websiteUrl scriptNamePaidDomain');

//     if (!user) {
//       return res.status(404).json({
//         message: 'لم يتم العثور على مستخدم بهذا الرابط.',
//       });
//     }

//     // أعِد الحقول المطلوبة
//     return res.status(200).json({
//       message: 'تم العثور على المستخدم.',
//       user,
//     });
//   } catch (error) {
//     console.error(error);
//     return res.status(500).json({
//       message: 'حدث خطأ في السيرفر.',
//       error,
//     });
//   }
// };

/**
 * POST /api/website/script-info
 * body: { "websiteUrl": "example.sa" }
 * يعيد scriptNamePaidDomain للمستخدم المرتبط بالـ websiteUrl
 */
exports.getScriptInfoByWebsiteUrl = async (req, res) => {
  try {
    const { websiteUrl } = req.body;
    if (!websiteUrl)
      return res.status(400).json({ message: 'websiteUrl is required.' });

    /*────────── 1) إيجاد الباقة ──────────*/
    const pkg = await SubscriptionPackage.findOne(
      { 'domainInfo.websiteUrl': websiteUrl },
      'user'                             // نريد فقط حقل user
    );

    if (!pkg)
      return res.status(404).json({
        message: 'لا يوجد اشتراك بهذا الرابط.',
      });

    /*────────── 2) جلب المستخدم المطلوب ──────────*/
    const user = await User.findById(
      pkg.user,
      'scriptNamePaidDomain domainName'  // الحقول المطلوبة فقط
    ).lean();

    if (!user)
      return res.status(404).json({
        message: 'المستخدم المرتبط بهذا الرابط غير موجود.',
      });

    /*────────── 3) الرد ───────────────────────────*/
    return res.status(200).json({
      message: 'تم العثور على البيانات.',
      websiteUrl,
      scriptNamePaidDomain: user.scriptNamePaidDomain,
      domainName: user.domainName,
    });
  } catch (error) {
    console.error('getScriptInfoByWebsiteUrl error:', error);
    return res.status(500).json({
      message: 'حدث خطأ في السيرفر.',
      error: error.message,
    });
  }
};



// هذا من اجلع الستعلام عن البيانات الساسه باستخدام  الرابط 

// exports.getUserByWebsiteUrl = async (req, res) => {
//   const { websiteUrl } = req.params;       // هنا نقرأ من بارامز => /api/users/:websiteUrl
//   const { limit = 10, page = 1 } = req.query; // قيم افتراضية للحد والصفحة

//   try {
//     // 1) البحث عن المستخدم بناءً على websiteUrl
//     const user = await User.findOne({ websiteUrl })
//       .select('firstName lastName email phone accountType companyName websiteUrl entityType logoUrl homepage');

//     if (!user) {
//       return res.status(404).json({
//         error: 'المستخدم غير موجود أو رابط الدومين غير صحيح.'
//       });
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
//         websiteUrl: user.websiteUrl,
//         entityType: user.entityType,
//         homepage: user.homepage,
//         ads, // الإعلانات التي جلبناها
//       }
//     });
//   } catch (error) {
//     console.error('Error fetching user by websiteUrl:', error);
//     return res
//       .status(500)
//       .json({ error: 'حدث خطأ أثناء جلب بيانات المستخدم.' });
//   }
// };

// exports.getUserByWebsiteUrl = async (req, res) => {
//   const { websiteUrl } = req.params; // قراءة رابط الدومين من الـ params
//   const {
//     limit = 3,
//     page = 1,
//     // الفلاتر الإضافية
//     subCategoryLabel,
//     propertyType,
//     city,
//     district,
//     isFeatured,
//     // الفرز بواسطة createdAt: "newest" أو "oldest"
//     sort,
//   } = req.query;

//   try {
//     // 1) البحث عن المستخدم بناءً على websiteUrl
//     const user = await User.findOne({ websiteUrl })
//       .select('firstName lastName email phone accountType companyName websiteUrl entityType logoUrl homepage');

//     if (!user) {
//       return res.status(404).json({
//         error: 'المستخدم غير موجود أو رابط الدومين غير صحيح.'
//       });
//     }

//     // 2) تكوين فلتر الإعلانات
//     const filter = {
//       user: user._id,
//       status: 'منشور', // عرض الإعلانات ذات الحالة "منشور" فقط
//     };

//     // في حال توفرت قيم لفلاتر معيّنة في الـ query، نضيفها للفلتر
//     if (subCategoryLabel) {
//       filter['subCategory.label'] = subCategoryLabel;
//     }

//     if (propertyType) {
//       filter.propertyType = propertyType;
//     }

//     if (city) {
//       filter.city = city;
//     }

//     if (district) {
//       filter.district = district;
//     }

//     // isFeatured يمكن أن يكون true أو false أو غير موجود
//     // بالتالي نتحقق إذا تم إرساله، ثم نحوله لـ Boolean
//     if (isFeatured !== undefined) {
//       if (isFeatured === 'true') {
//         filter.isFeatured = true;
//       } else if (isFeatured === 'false') {
//         filter.isFeatured = false;
//       }
//     }

//     // 3) إعداد خيارات الفرز بناءً على createdAt
//     // إذا sort = 'newest' -> الأحدث أولاً (تنازلي)
//     // إذا sort = 'oldest' -> الأقدم أولاً (تصاعدي)
//     let sortOptions = {};
//     if (sort === 'newest') {
//       sortOptions.createdAt = -1;
//     } else if (sort === 'oldest') {
//       sortOptions.createdAt = 1;
//     }

//     // 4) جلب الإعلانات المرتبطة بالمستخدم والتي حالتها "منشور" مع تطبيق الفلاتر والفرز
//     const ads = await Ad.find(filter)
//       .sort(sortOptions)
//       .select('title adType city bedrooms bathrooms landSize discountPrice district subCategory propertyType features price originalPrice image images isFeatured statusText createdAt')
//       .limit(parseInt(limit))
//       .skip((parseInt(page) - 1) * parseInt(limit));

//     // 5) بناء استجابة JSON تحتوي بيانات المستخدم + الإعلانات
//     return res.json({
//       profile: {
//         fullName: `${user.firstName} ${user.lastName}`,
//         logoUrl: user.logoUrl,
//         email: user.email,
//         phone: user.phone,
//         accountType: user.accountType,
//         companyName: user.companyName,
//         websiteUrl: user.websiteUrl,
//         entityType: user.entityType,
//         homepage: user.homepage,
//         ads, // الإعلانات التي جلبناها بعد تطبيق الفلاتر
//       }
//     });
//   } catch (error) {
//     console.error('Error fetching user by websiteUrl:', error);
//     return res.status(500).json({
//       error: 'حدث خطأ أثناء جلب بيانات المستخدم.'
//     });
//   }
// };

// exports.getUserByWebsiteUrl = async (req, res) => {
//   const { websiteUrl } = req.params; // قراءة رابط الدومين من الـ params
//   const {
//     limit = 3,
//     page = 1,
//     // الفلاتر الإضافية
//     subCategoryLabel,
//     propertyType,
//     city,
//     district,
//     isFeatured,
//     // الفرز بواسطة createdAt: "newest" أو "oldest"
//     sort,
//   } = req.query;

//   try {
//     // 1) البحث عن المستخدم بناءً على websiteUrl
//     const user = await User.findOne({ websiteUrl })
//       .select('firstName lastName email phone accountType companyName websiteUrl entityType logoUrl homepage');

//     if (!user) {
//       return res.status(404).json({
//         error: 'المستخدم غير موجود أو رابط الدومين غير صحيح.'
//       });
//     }

//     // 2) تكوين فلتر الإعلانات
//     const filter = {
//       user: user._id,
//       status: 'منشور', // عرض الإعلانات ذات الحالة "منشور" فقط
//     };

//     // في حال توفرت قيم لفلاتر معيّنة في الـ query، نضيفها للفلتر
//     if (subCategoryLabel) {
//       filter['subCategory.label'] = subCategoryLabel;
//     }

//     if (propertyType) {
//       filter.propertyType = propertyType;
//     }

//     if (city) {
//       filter.city = city;
//     }

//     if (district) {
//       filter.district = district;
//     }

//     // isFeatured يمكن أن يكون true أو false أو غير موجود
//     // بالتالي نتحقق إذا تم إرساله، ثم نحوله لـ Boolean
//     if (isFeatured !== undefined) {
//       if (isFeatured === 'true') {
//         filter.isFeatured = true;
//       } else if (isFeatured === 'false') {
//         filter.isFeatured = false;
//       }
//     }

//     // 3) إعداد خيارات الفرز بناءً على createdAt
//     let sortOptions = {};
//     if (sort === 'newest') {
//       sortOptions.createdAt = -1;
//     } else if (sort === 'oldest') {
//       sortOptions.createdAt = 1;
//     }

//     // 4) الحصول على العدد الإجمالي للإعلانات المطابقة للفلتر
//     const totalCount = await Ad.countDocuments(filter);

//     // 5) جلب الإعلانات المرتبطة بالمستخدم والتي حالتها "منشور" مع تطبيق الفلاتر والفرز
//     const ads = await Ad.find(filter)
//       .sort(sortOptions)
//       .select('title adType city bedrooms bathrooms landSize discountPrice district subCategory propertyType features price originalPrice image images isFeatured statusText createdAt')
//       .limit(parseInt(limit))
//       .skip((parseInt(page) - 1) * parseInt(limit));

//     // 6) بناء استجابة JSON تحتوي بيانات المستخدم + الإعلانات والعدد الإجمالي
//     return res.json({
//       profile: {
//         fullName: `${user.firstName} ${user.lastName}`,
//         logoUrl: user.logoUrl,
//         email: user.email,
//         phone: user.phone,
//         accountType: user.accountType,
//         companyName: user.companyName,
//         websiteUrl: user.websiteUrl,
//         entityType: user.entityType,
//         homepage: user.homepage,
//         ads,       // الإعلانات التي جلبناها بعد تطبيق الفلاتر
//         totalCount // العدد الإجمالي للإعلانات المطابقة للفلتر
//       }
//     });
//   } catch (error) {
//     console.error('Error fetching user by websiteUrl:', error);
//     return res.status(500).json({
//       error: 'حدث خطأ أثناء جلب بيانات المستخدم.'
//     });
//   }
// };


/**
 * GET /api/website/:websiteUrl
 * يعيد بيانات ملف المستخدم + الإعلانات مع فلاتر وفرز
 */
exports.getUserByWebsiteUrl = async (req, res) => {
  const { websiteUrl } = req.params;          // example.sa
  const {
    limit               = 3,
    page                = 1,
    subCategoryLabel,
    propertyType,
    city,
    district,
    isFeatured,
    sort,                                     // newest | oldest
  } = req.query;

  try {
    /*────────── 1) إيجاد الباقة للحصول على userId ──────────*/
    const pkg = await SubscriptionPackage.findOne(
      { 'domainInfo.websiteUrl': websiteUrl },
      'user'                                  // projection
    );
    if (!pkg)
      return res.status(404).json({
        error: 'لا يوجد اشتراك مرتبط بهذا الرابط.',
      });

    const user = await User.findById(
      pkg.user,
      'firstName lastName email phone accountType companyName domainName entityType logoUrl homepage'
    ).lean();

    if (!user)
      return res.status(404).json({
        error: 'المستخدم المرتبط بهذا الرابط غير موجود.',
      });

    /*────────── 2) تكوين فلتر الإعلانات ──────────*/
    const filter = {
      user: user._id,
      status: 'منشور',
    };

    if (subCategoryLabel) filter['subCategory.label'] = subCategoryLabel;
    if (propertyType)     filter.propertyType         = propertyType;
    if (city)             filter.city                 = city;
    if (district)         filter.district             = district;

    if (isFeatured !== undefined) {
      filter.isFeatured = isFeatured === 'true';
    }

    /*────────── 3) إعداد الفرز ──────────*/
    const sortOptions =
      sort === 'newest' ? { createdAt: -1 } :
      sort === 'oldest' ? { createdAt:  1 } : {};

    /*────────── 4) إحصاء وجلب الإعلانات ──────────*/
    const totalCount = await Ad.countDocuments(filter);

    const ads = await Ad.find(filter)
      .sort(sortOptions)
      .select(
        'title adType city bedrooms bathrooms landSize discountPrice ' +
        'district subCategory propertyType features price originalPrice ' +
        'image images isFeatured statusText createdAt'
      )
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit))
      .lean();

    /*────────── 5) بناء الاستجابة ──────────*/
    return res.json({
      profile: {
        fullName:    `${user.firstName} ${user.lastName}`,
        logoUrl:     user.logoUrl,
        email:       user.email,
        phone:       user.phone,
        accountType: user.accountType,
        companyName: user.companyName,
        domainName:  user.domainName,
        entityType:  user.entityType,
        homepage:    user.homepage,
        websiteUrl,              // من البارام نفسه
        ads,
        totalCount,
      },
    });
  } catch (error) {
    console.error('Error fetching user by websiteUrl:', error);
    return res.status(500).json({
      error: 'حدث خطأ أثناء جلب بيانات المستخدم.',
    });
  }
};



/**************************************** قسم رئيسي ***********************************
 *              تغذية السكرتات المدفوعه بابيانات مع طريق الأستفسار بارابط 
 **************************************************************************************/
/* نهاية القسم  */






/// التحكم في الشعار 


// ----------------------------------------------------------------------------
// دالة مساعدة لاستخراج مفتاح (Key) الملف من رابط كامل في S3
// أمثلة:
//   https://my-bucket.s3.my-region.amazonaws.com/folder/file.png
// النتيجة: folder/file.png
// ----------------------------------------------------------------------------


// // ----------------------------------------------------------------------------
// // [POST] رفع أو تحديث الشعار (logoUrl) داخل الكنترولر مباشرةً
// // ----------------------------------------------------------------------------




// دالة مساعدة لاستخراج الـ Key من رابط S3
function extractKeyFromUrl(url) {
  if (!url) return null;
  const baseUrl = `https://${process.env.BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/`;
  return url.replace(baseUrl, '');
}

// ----------------------------------------------------------------------------
// [POST] رفع أو تحديث الشعار (logoUrl)
// ----------------------------------------------------------------------------
exports.uploadOrUpdateLogo = (req, res) => {
  // استدعاء ميدل وير Multer
  uploadp(req, res, async (err) => {
    // 1) إن حصل خطأ في الرفع (نوع الملف ممنوع، حجم زائد، إلخ)
    if (err) {
      return res.status(400).json({ error: err.message });
    }

    try {
      // 2) الحصول على userId من التوكن (ميدل وير المصادقة)
      const userId = req.user.id;

      // 3) البحث عن المستخدم في قاعدة البيانات
      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({ error: 'المستخدم غير موجود' });
      }

      // 4) التأكد من وجود الملف المرفوع في حقل logo
      const file = req.files?.logo?.[0];
      if (!file) {
        return res.status(400).json({
          error: 'لم يتم إرسال ملف الشعار في حقل logo'
        });
      }

      // 5) حذف الشعار القديم إذا كان موجودًا
      if (user.logoUrl) {
        const oldKey = extractKeyFromUrl(user.logoUrl);
        if (oldKey) {
          await deleteFileFromS3p(oldKey);
        }
      }

      // 6) رفع الشعار الجديد إلى S3:
      //    folder = "public-posts"
      //    adId   = "companyLogo"
      const logoUrl = await uploadFileToS3p(
        file,                // الملف القادم من Multer
        'public-posts',      // اسم المجلد في S3
        userId,              // userId
        'companyLogo'        // قيمة adId (مجرد قيمة لتعريف اسم الملف)
      );

      // 7) حفظ الرابط الجديد في قاعدة البيانات
      user.logoUrl = logoUrl;
      await user.save();

      return res.json({
        message: 'تم رفع/تحديث الشعار بنجاح',
        logoUrl: logoUrl,
      });
    } catch (error) {
      console.error('Error uploading/updating logo:', error);
      return res.status(500).json({
        error: 'حدث خطأ أثناء رفع أو تحديث الشعار',
        details: error.message,
      });
    }
  });
};




// ----------------------------------------------------------------------------
// [DELETE] حذف الشعار (logoUrl)
// ----------------------------------------------------------------------------

/**
 * [DELETE] حذف شعار المستخدم (logoUrl) من الـS3 ومن قاعدة البيانات
 */
exports.deleteLogo = async (req, res) => {
  try {
    // 1) الحصول على userId من التوكن (بافتراض ميدل وير مصادقة)
    const userId = req.user.id;

    // 2) ابحث عن المستخدم
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        error: 'المستخدم غير موجود'
      });
    }

    // 3) التحقق من وجود شعار سابق
    if (!user.logoUrl) {
      return res.status(400).json({
        error: 'لا يوجد شعار مخزّن لدى هذا المستخدم'
      });
    }

    // 4) استخراج الـKey من رابط الشعار
    const fileKey = extractKeyFromUrl(user.logoUrl);
    if (!fileKey) {
      // إذا الرابط غير صالح أو لم يمكن استخلاصه بشكل صحيح
      return res.status(400).json({
        error: 'رابط الشعار غير صالح، لا يمكن استخلاص مفتاح الملف'
      });
    }

    // 5) حذف الملف من الـS3
    await deleteFileFromS3p(fileKey);

    // 6) إزالة رابط الشعار من قاعدة البيانات
    user.logoUrl = null;
    await user.save();

    // 7) إعادة استجابة نجاح
    return res.json({
      message: 'تم حذف الشعار بنجاح',
    });
  } catch (error) {
    console.error('Error deleting logo:', error);

    return res.status(500).json({
      error: 'حدث خطأ أثناء حذف الشعار',
      details: error.message,
    });
  }
};

// ----------------------------------------------------------------------------
// يمكنك إضافة دوال أخرى خاصة بالمستخدم هنا إذا احتجتها.
// على سبيل المثال، دوال تسجيل الدخول أو غيرها.
// ----------------------------------------------------------------------------