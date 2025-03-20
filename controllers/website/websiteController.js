const User = require('../../models/user');
const jwt = require('jsonwebtoken');
const Ad = require('../../models/AdSchema');



const uploadp = require('../../utils/multerConfig'); // نفس إعدادك للـ Multer
const {
  uploadFileToS3p,
  uploadMultipleFilesToS3p,
  deleteFileFromS3p
} = require('../../utils/s3Service');






// controllers/websiteController.js (على سبيل المثال)
exports.createOrUpdateSocialMediaAndBranches = async (req, res) => {
  try {
    // 1) التحقق من صحة الـ token
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ message: 'Authorization token is missing' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decoded.id;

    // 2) استلام الحقول من الـ body
    const {
      socialMediaData, // مصفوفة من { platform, username }
      branches,        // مصفوفة من الفروع
      email            // البريد الإلكتروني
    } = req.body;

    // 3) البحث عن المستخدم
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // ============== (أ) حذف القديم ==================
    // تهيئة socialMedia لتكون فارغة، وكذلك الفروع
    user.socialMedia = {};   // يعيد ضبط جميع المنصات السابقة (بما فيها email)
    user.branches = [];      // يمسح جميع الفروع السابقة

    // ============== (ب) المنصات =====================
    // إذا قدم المستخدم مصفوفة socialMediaData
    if (Array.isArray(socialMediaData) && socialMediaData.length > 0) {
      // المنصات المدعومة (قاعدة لبناء الروابط)
      const platformUrls = {
        Twitter: "",
        Facebook: "",
        Instagram: "",
        LinkedIn: "",
        YouTube: "",
        Snapchat:"",
        Pinterest:"",
        TikTok: "",
        Telegram:""

             // Twitter: "https://twitter.com/",
        // Facebook: "https://facebook.com/",
        // Instagram: "https://instagram.com/",
        // LinkedIn: "https://linkedin.com/in/",
        // YouTube: "https://youtube.com/",
        // Snapchat: "https://snapchat.com/add/",
        // Pinterest: "https://pinterest.com/",
        // TikTok: "https://tiktok.com/@",
        // Telegram: "https://t.me/"
      };

      // تعبئة user.socialMedia حسب المصفوفة الواردة
      for (const item of socialMediaData) {
        const { platform, username } = item;

        if (platform && username) {
          // تأكّد من أن المنصة مدعومة
          if (!platformUrls.hasOwnProperty(platform)) {
            return res.status(400).json({
              message: `Platform ${platform} is not supported.`
            });
          }
          // بناء الرابط الكامل
          const url = `${platformUrls[platform]}${username}`;

          // إضافة المفتاح للـ user.socialMedia
          user.socialMedia[platform] = url;
        }
      }
    }

    // (ج) إذا قدّم المستخدم email، أضفه (أو استبدله)
    if (email) {
      user.socialMedia.email = email;
    }

    // ============== (د) الفروع =====================
    // إذا قدم المستخدم مصفوفة branches
    if (Array.isArray(branches) && branches.length > 0) {
      for (const branch of branches) {
        if (branch.branchName) {
          user.branches.push({
            branchName: branch.branchName,
            locationUrl: branch.locationUrl || null,
            phoneNumber: branch.branchPhoneNumber || null,
            whatsappNumber: branch.branchWhatsappNumber || null
          });
        }
      }
    }

    // 4) حفظ التعديلات في قاعدة البيانات
    await user.save();

    // تحضير رسالة الاستجابة
    let messageParts = [];
    if (Array.isArray(socialMediaData) && socialMediaData.length > 0) {
      messageParts.push(`Replaced social media with ${socialMediaData.length} platform(s)`);
    }

    if (email) {
      messageParts.push(`Email set/updated`);
    }

    if (Array.isArray(branches) && branches.length > 0) {
      messageParts.push(`Replaced branches with ${branches.length} new one(s)`);
    }

    if (messageParts.length === 0) {
      messageParts.push('No data provided for social media or branches');
    }

    return res.status(200).json({
      message: messageParts.join(' & '),
      socialMedia: user.socialMedia,
      branches: user.branches
    });

  } catch (error) {
    console.error('Error updating user data:', error);
    return res.status(500).json({
      message: 'Error updating user data',
      error: error.message
    });
  }
};





exports.getAllSocialMedia = async (req, res) => {
  try {
    const { domainName } = req.params; // استلام domainName من المسار
    if (!domainName) {
      return res.status(400).json({ message: 'domainName is required' });
    }

    // البحث عن المستخدم باستخدام domainName
    const user = await User.findOne({ domainName });
    if (!user) {
      return res.status(404).json({ message: 'User not found with the provided domainName' });
    }

    // التحقق من وجود بيانات في حقل socialMedia
    const socialMedia = user.socialMedia || {};
    if (Object.keys(socialMedia).length === 0) {
      return res.status(404).json({ message: 'No social media accounts found.' });
    }

    // الحصول على الفروع
    const branches = user.branches || [];

    // إعادة الرد مع بيانات socialMedia و branches
    res.status(200).json({
      message: 'Social media accounts and branches retrieved successfully.',
      socialMedia,
      branches
    });
  } catch (error) {
    res.status(500).json({
      message: 'Error retrieving social media or branches data',
      error
    });
  }
};


// كنتول التحكم في بيانت الصفحة الريسيه 

// عدد الصور المسموح به في الصفحة الرئيسية (مثال)
const MAX_IMAGES_HOMEPAGE = 6;

/**
 * إنشاء/تحديث بيانات الصفحة الرئيسية (homepage) بما فيها الصور المرفوعة إلى S3.
 *  - يتم رفع الصور الجديدة إلى S3.
 *  - يتم حذف الصور القديمة في حال طلب المستخدم ذلك عبر حقل deletedImages.
 *  - يتم تحديث/إضافة باقي الحقول النصية (marketingTitle, marketingPhrase, ...).
 */
exports.updateHomepage = (req, res) => {
  // استخدام Multer لقراءة الملفات من الطلب
  uploadp(req, res, async (err) => {
    if (err) {
      return res.status(400).json({ error: err.message });
    }

    try {
      // 1) التحقق من صحة الـ token
      const token = req.headers.authorization?.split(' ')[1];
      if (!token) {
        return res.status(401).json({ message: 'Authorization token is missing' });
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const userId = decoded.id;

      // 2) جلب المستخدم
      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      // 3) قراءة البيانات النصية من الـ body (دعم حقل jsonData إذا أُرسل كنص JSON)
      let parsedData = req.body;
      if (req.body.jsonData) {
        try {
          parsedData = JSON.parse(req.body.jsonData);
        } catch (parseErr) {
          console.error('خطأ أثناء JSON.parse:', parseErr);
        }
      }

      // 4) في حال عدم وجود حقل homepage مسبقًا، ننشئه
      if (!user.homepage) {
        user.homepage = {};
      }

      // 5) تحديث الحقول النصية (إن وُجدت في الطلب)
      const {
        marketingTitle,
        marketingPhrase,
        companyDescription,
        foundedDate,
        shortDescriptionTitle,
        adFilterType,
        deletedImages // قائمة روابط الصور المطلوب حذفها
      } = parsedData;

      if (marketingTitle !== undefined) {
        user.homepage.marketingTitle = marketingTitle;
      }
      if (marketingPhrase !== undefined) {
        user.homepage.marketingPhrase = marketingPhrase;
      }
      if (companyDescription !== undefined) {
        user.homepage.companyDescription = companyDescription;
      }
      if (foundedDate !== undefined) {
        user.homepage.foundedDate = foundedDate;
      }
      if (shortDescriptionTitle !== undefined) {
        user.homepage.shortDescriptionTitle = shortDescriptionTitle;
      }
      if (adFilterType !== undefined) {
        user.homepage.adFilterType = adFilterType;
      }

      // 6) حذف الصور القديمة من S3 (إن طلب ذلك)
      //    وتحديث مصفوفة images في سكيمة homepage
      if (!Array.isArray(user.homepage.images)) {
        user.homepage.images = [];
      }

      if (deletedImages) {
        let imagesToDelete = deletedImages;
        // لو وصلتنا قيمة نصية مفردة أو JSON
        if (typeof imagesToDelete === 'string') {
          try {
            imagesToDelete = JSON.parse(imagesToDelete);
          } catch (e) {
            // تبقى قيمة نصية مفردة
          }
        }
        // نحولها لمصفوفة إن كانت مفردة
        imagesToDelete = Array.isArray(imagesToDelete)
          ? imagesToDelete
          : [imagesToDelete];

        for (const imgUrl of imagesToDelete) {
          // إزالة رابط الصورة من المصفوفة
          user.homepage.images = user.homepage.images.filter(link => link !== imgUrl);

          // استخراج الـ Key من رابط S3
          const splitted = imgUrl.split('.com/');
          if (splitted.length < 2) continue;
          const fileKey = splitted[1].split('?')[0];

          // حذف الملف من S3
          await deleteFileFromS3p(fileKey);
        }
      }

      // 7) حفظ أي تغييرات قبل رفع الصور الجديدة
      await user.save();

      // 8) التحقق من الحد الأقصى للصور قبل إضافة الجديد
      const currentImagesCount = user.homepage.images.length;
      const newImages = req.files.images || [];

      if (currentImagesCount + newImages.length > MAX_IMAGES_HOMEPAGE) {
        return res.status(400).json({
          error: `تجاوزت الحد الأقصى للصور في الصفحة الرئيسية. لديك حاليًا ${currentImagesCount} صورة، وستضيف ${newImages.length} صور ليصبح المجموع ${currentImagesCount + newImages.length}، والحد الأقصى هو ${MAX_IMAGES_HOMEPAGE}.`
        });
      }

      // 9) رفع الصور الجديدة إلى S3 (باستخدام نفس مجلد "public-posts")
      const imageLinks = await uploadMultipleFilesToS3p(
        newImages,
        'public-posts', // اسم المجلد داخل حاوية S3
        userId,
        'homepage'      // مجرد معرّف نصي يظهر في اسم الملف
      );

      // 10) إضافة الروابط الجديدة إلى مصفوفة الصور
      user.homepage.images.push(...imageLinks);

      // 11) حفظ التحديث النهائي
      await user.save();

      // 12) إعادة الرد مع البيانات
      return res.status(200).json({
        message: 'تم إنشاء/تحديث بيانات الصفحة الرئيسية بنجاح',
        homepage: user.homepage
      });
    } catch (error) {
      console.error('Error updating homepage:', error);
      return res.status(500).json({
        error: 'حدث خطأ أثناء إنشاء/تحديث بيانات الصفحة الرئيسية.',
        details: error.message
      });
    }
  });
};


// جلب جميع البيانت للمستخدم بما في ذالك بيانات الصفحات 


// exports.getAllUserDataByDomain = async (req, res) => {
//   try {
//     const { domainName } = req.params;

//     // 1) ابحث عن المستخدم بالاعتماد على domainName
//     //    لاحظ أننا نستبعد كلمة المرور باستخدام select('-password')
//     let user = await User.findOne({ domainName })
//       .select('-password') // نستبعد كلمة المرور
//       // .populate('ads');    // إذا أردت جلب بيانات الإعلانات المرتبطة

//     if (!user) {
//       return res.status(404).json({
//         error: 'المستخدم غير موجود أو اسم النطاق غير صحيح.'
//       });
//     }

//     // 2) أعد الاستجابة بجميع البيانات الموجودة في user
//     return res.status(200).json({
//       message: 'تم جلب بيانات المستخدم بنجاح',
//       user
//     });
//   } catch (error) {
//     console.error('Error fetching user by domainName:', error);
//     return res.status(500).json({
//       error: 'حدث خطأ أثناء جلب بيانات المستخدم.',
//       details: error.message
//     });
//   }
// };


exports.getAllUserDataByDomain = async (req, res) => {
  try {
    const { domainName } = req.params;

    // 1) ابحث عن المستخدم بالاعتماد على domainName
    let user = await User.findOne({ domainName })
      .select('-password'); // نستبعد كلمة المرور
    
    if (!user) {
      return res.status(404).json({
        error: 'المستخدم غير موجود أو اسم النطاق غير صحيح.'
      });
    }

    // 2) نقرأ نوع الفلتر من user.homepage.adFilterType
    const filterType = user.homepage?.adFilterType; 
    // قد تكون غير موجودة، لذا استخدمنا الاختيار الشرطي (?)

    // 3) تكوين فلترة الإعلانات حسب نوع الفلتر
    //    مع ملاحظة أن الإعلانات مرتبطة بالمستخدم عبر الحقل user (ref: 'User')
    //    لذلك يجب أن نشترط أن تكون الإعلانات تابعة لنفس المستخدم
    let query = Ad.find({ user: user._id });

    if (filterType === 'featured') {
      // الفلترة: فقط الإعلانات التي هي مميزة
      query = query.where({ isFeatured: true });
    } else if (filterType === 'discounted') {
      // الفلترة: فقط الإعلانات التي فيها خصم 
      // يمكنك اختيار الشرط المناسب لك (مثلاً discountPrice != '')
      query = query.where({ discountPrice: { $ne: '' } });
    } else if (filterType === 'new') {
      // الفلترة: آخر 20 إعلان (جديد)
      // نرتب حسب تاريخ الإنشاء تنازلياً
      query = query.sort({ createdAt: -1 }).limit(5);
    }
    // في حال لم يكن هناك فلتر أو كان نوع آخر، نجلب جميع إعلانات المستخدم

    // 4) نفذ الاستعلام لجلب الإعلانات بعد الفلترة
    const ads = await query.exec();

    // 5) بإمكانك إعادة حقول الإعلانات في ردّ منفصل أو تخزينها في user.ads مؤقتًا
    //    حتى تصل في الـ response. (لكن غالبًا من الأفضل إرجاعها في حقل مستقل)
    //    إذا أردت إرجاعها داخل user نفسه، بإمكانك فعل ذلك:
    // user = user.toObject();
    // user.ads = ads; 
    // أو ببساطة ترسلها في الـ JSON كما تريد

    return res.status(200).json({
      message: 'تم جلب بيانات المستخدم بنجاح',
      user: user,  // معلومات المستخدم
      ads: ads     // الإعلانات بعد الفلترة
    });
  } catch (error) {
    console.error('Error fetching user by domainName:', error);
    return res.status(500).json({
      error: 'حدث خطأ أثناء جلب بيانات المستخدم.',
      details: error.message
    });
  }
};






// التحكم في بيانات صفحة من نحن 


// exports.createOrUpdateAbout = (req, res) => {
//   // 1) استخدم Multer لرفع الملفات (صور شخصية + شهادات PDF)
//   uploadp(req, res, async (err) => {
//     if (err) {
//       return res.status(400).json({ error: err.message });
//     }

//     try {
//       // 2) تحقّق من التوكن
//       const token = req.headers.authorization?.split(' ')[1];
//       if (!token) {
//         return res.status(401).json({ message: 'Authorization token is missing' });
//       }
//       const decoded = jwt.verify(token, process.env.JWT_SECRET);
//       const userId = decoded.id;

//       // 3) البحث عن المستخدم
//       const user = await User.findById(userId);
//       if (!user) {
//         return res.status(404).json({ message: 'User not found' });
//       }

//       // 4) في حال عدم وجود حقل about لدى المستخدم، ننشئه (مرة واحدة)
//       if (!user.about) {
//         user.about = {};
//       }

//       // 5) قراءة البيانات النصية من req.body
//       //  (يمكنك استقبالها مباشرة أو عبر حقل معيّن مثل req.body.jsonData)
//       let parsedData = req.body;
//       if (req.body.jsonData) {
//         try {
//           parsedData = JSON.parse(req.body.jsonData);
//         } catch (parseErr) {
//           console.error('Error parsing JSON data:', parseErr);
//         }
//       }

//       // استخراج الحقول النصية:
//       const {
//         companyIntroduction,
//         businessAreas,
//         mission,
//         vision,
//         values,
//         competitiveAdvantages,
        
//         // مصفوفة من العناصر في organizationalStructure
//         // لاحظ أننا قد نريد استقبالهم هكذا: [{ jobTitle, name, personalPhotoUrl }]
//         // ولكن personalPhotoUrl سيتم إنشاؤه أو تعديله بعد الرفع
//         organizationalStructure,
        
//         // مصفوفة من الشهادات والرخص: [{ certificateName, certificateUrl }]
//         certificationsAndLicenses,

//         // مصفوفة بـ روابط الملفات التي يريد المستخدم حذفها (سواء صور شخصية أو شهادات)
//         deletedFiles
//       } = parsedData;


//       // 6) تحدد أي حقول تريد تحديثها (إن كانت موجودة في الطلب):
//       if (companyIntroduction !== undefined) {
//         user.about.companyIntroduction = companyIntroduction;
//       }
//       if (Array.isArray(businessAreas)) {
//         user.about.businessAreas = businessAreas;
//       }
//       if (mission !== undefined) {
//         user.about.mission = mission;
//       }
//       if (vision !== undefined) {
//         user.about.vision = vision;
//       }
//       if (Array.isArray(values)) {
//         user.about.values = values;
//       }
//       if (Array.isArray(competitiveAdvantages)) {
//         user.about.competitiveAdvantages = competitiveAdvantages;
//       }

//       // ======= (أ) التعامل مع الهيكل التنظيمي =======
//       //  - سنفترض أنك تريد استبدال المصفوفة كاملة بمصفوفة جديدة
//       //    (أو بإمكانك إضافة/تعديل العناصر جزئياً، حسب الحاجة).
//       if (Array.isArray(organizationalStructure)) {
//         user.about.organizationalStructure = organizationalStructure.map(member => {
//           return {
//             jobTitle: member.jobTitle || '',
//             name: member.name || '',
//             personalPhotoUrl: member.personalPhotoUrl || ''
//           };
//         });
//       }

//       // ======= (ب) التعامل مع الشهادات والرخص =======
//       //  - نفس الفكرة: قد تختار الاستبدال الكامل أو الإضافة الجزئية
//       if (Array.isArray(certificationsAndLicenses)) {
//         user.about.certificationsAndLicenses = certificationsAndLicenses.map(cert => {
//           return {
//             certificateName: cert.certificateName || '',
//             certificateUrl: cert.certificateUrl || ''
//           };
//         });
//       }

//       // 7) حذف الملفات السابقة من S3 إن وُجدت في مصفوفة deletedFiles
//       //    (تأكد أنها تحتوي على روابط S3)
//       if (deletedFiles) {
//         let filesToDelete = deletedFiles;
//         if (typeof filesToDelete === 'string') {
//           try {
//             filesToDelete = JSON.parse(filesToDelete);
//           } catch (parseErr) {
//             // تبقى قيمة نصية واحدة
//           }
//         }

//         filesToDelete = Array.isArray(filesToDelete) ? filesToDelete : [filesToDelete];
//         for (const fileUrl of filesToDelete) {
//           // حذف الرابط من أي مكان في مصفوفاتك (organizationalStructure أو certificationsAndLicenses)
//           // حيث يتطابق الملفURL
          
//           // إزالة من organizationalStructure
//           if (user.about.organizationalStructure && user.about.organizationalStructure.length) {
//             user.about.organizationalStructure = user.about.organizationalStructure.map(member => {
//               if (member.personalPhotoUrl === fileUrl) {
//                 member.personalPhotoUrl = '';
//               }
//               return member;
//             });
//           }

//           // إزالة من certificationsAndLicenses
//           if (user.about.certificationsAndLicenses && user.about.certificationsAndLicenses.length) {
//             user.about.certificationsAndLicenses = user.about.certificationsAndLicenses.map(cert => {
//               if (cert.certificateUrl === fileUrl) {
//                 cert.certificateUrl = '';
//               }
//               return cert;
//             });
//           }

//           // حذف الملف فعليًا من S3
//           const splitted = fileUrl.split('.com/');
//           if (splitted.length > 1) {
//             const fileKey = splitted[1].split('?')[0];
//             await deleteFileFromS3p(fileKey);
//           }
//         }
//       }

//       // 8) حفظ التغييرات قبل أن نعالج الملفات الجديدة
//       await user.save();

//       // 9) التعامل مع الملفات الجديدة المرفوعة (إن وجدت)
//       //    في req.files يمكن أن يكون لديك حقول متعددة لملفات صور الأفراد أو ملفات الشهادات.
//       //    مثلاً (req.files.personalPhotos) و (req.files.certificates)

//       const personalPhotos = req.files?.personalPhotos || [];
//       const certificates = req.files?.certificates || [];

//       // رفع صور الفريق (إن وجدت):
//       if (personalPhotos.length > 0) {
//         const uploadedPersonalPhotos = await uploadMultipleFilesToS3p(
//           personalPhotos,
//           // 'about-section', // اسم المجلد في S3
//           'public-posts',
//           userId,
//           'personalPhoto'
//         );

//         // يفترض أنك تستقبل مع كل ملف "metadata" تدل على لأي عضو ينتمي (مثلاً عبر حقل memberIndex)
//         // ستحتاج ربط الرابط بالعضو المناسب. في حال لم تضع هذه المعلومة،
//         // قد تضطر لترتيبها تسلسليًا.
//         uploadedPersonalPhotos.forEach((photoUrl, idx) => {
//           // مثال بسيط: نربط الصورة بالفرد رقم idx في المصفوفة
//           if (user.about.organizationalStructure[idx]) {
//             user.about.organizationalStructure[idx].personalPhotoUrl = photoUrl;
//           }
//         });
//       }

//       // رفع ملفات الشهادات (إن وجدت):
//       if (certificates.length > 0) {
//         const uploadedCertificates = await uploadMultipleFilesToS3p(
//           certificates,
//           // 'about-certificates',
//           'public-posts',
//           userId,
//           'certificate'
//         );

//         // نفس الفكرة: نربط الرابط بالشهادة المناسبة عن طريق الـ idx 
//         uploadedCertificates.forEach((certUrl, idx) => {
//           if (user.about.certificationsAndLicenses[idx]) {
//             user.about.certificationsAndLicenses[idx].certificateUrl = certUrl;
//           }
//         });
//       }

//       // 10) الحفظ النهائي
//       await user.save();

//       return res.status(200).json({
//         message: 'تم إنشاء/تحديث بيانات قسم About بنجاح',
//         about: user.about
//       });

//     } catch (error) {
//       console.error('Error updating about data:', error);
//       return res.status(500).json({
//         error: 'حدث خطأ أثناء إنشاء/تحديث بيانات قسم About',
//         details: error.message
//       });
//     }
//   });
// };


// اضافه وتعدل صفحة من نحن هذا البيانات النصه فقط 

// controllers/aboutController.js
exports.updateCompanyInfo = async (req, res) => {
  try {
    // 1) التحقق من التوكن
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ message: 'Authorization token is missing' });
    }
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decoded.id;

    // 2) جلب المستخدم
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // 3) إذا لا يوجد حقل about، ننشئه مرة
    if (!user.about) {
      user.about = {};
    }

    // 4) قراءة بيانات JSON
    let parsedData = req.body;
    if (req.body.jsonData) {
      try {
        parsedData = JSON.parse(req.body.jsonData);
      } catch (err) {
        console.error('Error parsing JSON data:', err);
      }
    }

    const {
      companyIntroduction,
      businessAreas,
      mission,
      vision,
      values,
      competitiveAdvantages
    } = parsedData;

    // 5) تحديث الحقول
    if (companyIntroduction !== undefined) {
      user.about.companyIntroduction = companyIntroduction;
    }
    if (Array.isArray(businessAreas)) {
      user.about.businessAreas = businessAreas;
    }
    if (mission !== undefined) {
      user.about.mission = mission;
    }
    if (vision !== undefined) {
      user.about.vision = vision;
    }
    if (Array.isArray(values)) {
      user.about.values = values;
    }
    if (Array.isArray(competitiveAdvantages)) {
      user.about.competitiveAdvantages = competitiveAdvantages;
    }

    // 6) الحفظ
    await user.save();

    return res.status(200).json({
      message: 'تم تحديث معلومات الشركة بنجاح',
      about: user.about
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'خطأ أثناء تحديث بيانات الشركة', details: error.message });
  }
};


// تعدل او اضافه من نحن  للبياناتت الموضفين في صفحة من نحن 





// ايضافه موظف 
// فرضًا أنك سمّيت الـ Multer المعدّل باسم uploadp (مثلما في updateHomepage)
// أو إن كنت تسميه uploadp في نفس الملف، تأكد من استيراده/تعريفه بالشكل الصحيح

exports.addOrganizationalMember = (req, res) => {
  // استدعاء uploadp (multerConfig) من داخل الدالة
  uploadp(req, res, async (err) => {
    if (err) {
      // خطأ صادر من Multer (حجم الملف، امتداد غير مسموح، إلخ)
      return res.status(400).json({ error: err.message });
    }

    try {
      // 1) التحقق من التوكن
      const token = req.headers.authorization?.split(' ')[1];
      if (!token) {
        return res.status(401).json({ message: 'Authorization token is missing' });
      }
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const userId = decoded.id;

      // 2) جلب المستخدم
      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({ message: 'المستخدم غير موجود' });
      }

      // 3) تأكد من وجود حقل about
      if (!user.about) {
        user.about = {};
      }
      if (!Array.isArray(user.about.organizationalStructure)) {
        user.about.organizationalStructure = [];
      }

      // 4) قراءة البيانات النصية من req.body
      const { jobTitle, name } = req.body;

      // 5) التعامل مع الملفات المرفوعة
      let personalPhotoUrl = null;
      const personalPhotoFiles = req.files?.personalPhotos || [];

      if (personalPhotoFiles.length > 0) {
        const personalPhotoFile = personalPhotoFiles[0];
        personalPhotoUrl = await uploadFileToS3p(
          personalPhotoFile,
          // 'personal-photos',
          'public-posts',
          userId,
          'organization'
        );
      }

      // 6) إضافة الموظف إلى المصفوفة
      user.about.organizationalStructure.push({
        jobTitle,
        name,
        personalPhotoUrl
      });

      // 7) حفظ
      await user.save();

      return res.status(200).json({
        message: 'تمت إضافة الموظف بنجاح',
        organizationalStructure: user.about.organizationalStructure
      });
    } catch (error) {
      return res.status(500).json({
        message: 'حدث خطأ أثناء إضافة الموظف',
        details: error.message
      });
    }
  });
};



// تعدل الموظف 
exports.updateOrganizationalMember = (req, res) => {
  uploadp(req, res, async (err) => {
    if (err) {
      return res.status(400).json({ error: err.message });
    }

    try {
      // 1) التحقق من التوكن
      const token = req.headers.authorization?.split(' ')[1];
      if (!token) {
        return res.status(401).json({ message: 'Authorization token is missing' });
      }
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const userId = decoded.id;

      // 2) جلب المستخدم
      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({ message: 'المستخدم غير موجود' });
      }

      // 3) التحقق من المصفوفة organizationalStructure
      if (!user.about || !Array.isArray(user.about.organizationalStructure)) {
        return res.status(400).json({
          message: 'لا يوجد هيكل تنظيمي مسجّل للقيام بالتعديل عليه.',
        });
      }

      // 4) جلب معرّف الموظف من الـ params (memberId)
      const { memberId } = req.params;

      // 5) البحث عن العنصر المطلوب تحديثه
      const member = user.about.organizationalStructure.id(memberId);
      if (!member) {
        return res.status(404).json({
          message: 'الموظف المطلوب غير موجود في الهيكل التنظيمي.'
        });
      }

      // 6) تعديل الحقول النصية
      const { jobTitle, name } = req.body;
      if (jobTitle !== undefined) member.jobTitle = jobTitle;
      if (name !== undefined) member.name = name;

      // 7) التعامل مع رفع صورة جديدة (إن وجدت)
      const personalPhotoFiles = req.files?.personalPhotos || [];
      if (personalPhotoFiles.length > 0) {
        // (1) حذف الصورة القديمة من S3 إذا كانت موجودة
        if (member.personalPhotoUrl) {
          const oldUrl = member.personalPhotoUrl;
          const splitted = oldUrl.split('.amazonaws.com/');
          if (splitted.length > 1) {
            let oldKey = splitted[1];
            oldKey = oldKey.split('?')[0];
            await deleteFileFromS3p(oldKey);
          }
        }

        // (2) رفع الصورة الجديدة
        const personalPhotoFile = personalPhotoFiles[0];
        const newPhotoUrl = await uploadFileToS3p(
          personalPhotoFile,
          // 'personal-photos',
          'public-posts',

          userId,
          'organization'
        );
        member.personalPhotoUrl = newPhotoUrl;
      }

      // 8) حفظ التحديثات
      await user.save();

      return res.status(200).json({
        message: 'تم تعديل بيانات الموظف بنجاح',
        organizationalStructure: user.about.organizationalStructure,
      });

    } catch (error) {
      return res.status(500).json({
        message: 'حدث خطأ أثناء تعديل بيانات الموظف',
        details: error.message,
      });
    }
  });
};






// حذف الموظف 

exports.deleteOrganizationalMember = async (req, res) => {
  try {
    // 1) التحقق من التوكن
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ message: 'Authorization token is missing' });
    }
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decoded.id;

    // 2) جلب المستخدم
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'المستخدم غير موجود' });
    }

    // 3) التحقق من المصفوفة organizationalStructure
    if (!user.about || !Array.isArray(user.about.organizationalStructure)) {
      return res.status(400).json({
        message: 'لا يوجد هيكل تنظيمي مسجّل للقيام بالحذف.',
      });
    }

    // 4) جلب معرّف الموظف من الـ params (memberId)
    const { memberId } = req.params;

    // 5) إيجاد العنصر المطلوب حذفه عبر findIndex
    const memberIndex = user.about.organizationalStructure.findIndex(
      (m) => m._id.toString() === memberId
    );
    if (memberIndex === -1) {
      return res.status(404).json({
        message: 'الموظف المطلوب غير موجود في الهيكل التنظيمي.'
      });
    }

    // سنحتاج الوصول إلى كائن الموظف لحذف الصورة من S3 (إن وُجدت)
    const member = user.about.organizationalStructure[memberIndex];

    // 6) إذا كان لدى الموظف رابط صورة، نحذفها من S3 أولاً
    if (member.personalPhotoUrl) {
      const oldUrl = member.personalPhotoUrl;
      const splitted = oldUrl.split('.amazonaws.com/');
      if (splitted.length > 1) {
        let oldKey = splitted[1].split('?')[0];
        await deleteFileFromS3p(oldKey);
      }
    }

    // 7) حذف الموظف من المصفوفة
    user.about.organizationalStructure.splice(memberIndex, 1);

    // 8) حفظ التغييرات
    await user.save();

    return res.status(200).json({
      message: 'تم حذف الموظف بنجاح',
      organizationalStructure: user.about.organizationalStructure
    });

  } catch (error) {
    return res.status(500).json({
      message: 'حدث خطأ أثناء حذف بيانات الموظف',
      details: error.message,
    });
  }
};


 
//***************************** */

// التحكم في الشهادات ولارخص للمستخدم 

// انشا رخصه او شهاده 

/**
 * إضافة عنصر جديد إلى مصفوفة certificationsAndLicenses
 */
// exports.addCertification = (req, res) => {
//   // استخدمنا نفس اسلوب Multer إذا كنت ترفع ملف الشهادة
//   uploadp(req, res, async (err) => {
//     if (err) {
//       return res.status(400).json({ error: err.message });
//     }

//     try {
//       // 1) التحقق من التوكن
//       const token = req.headers.authorization?.split(' ')[1];
//       if (!token) {
//         return res.status(401).json({ message: 'Authorization token is missing' });
//       }
//       const decoded = jwt.verify(token, process.env.JWT_SECRET);
//       const userId = decoded.id;

//       // 2) جلب المستخدم
//       const user = await User.findById(userId);
//       if (!user) {
//         return res.status(404).json({ message: 'المستخدم غير موجود' });
//       }

//       // 3) إذا لم يكن الحقل موجودًا بعد، أنشئه كمصفوفة فارغة
//       if (!user.about || !Array.isArray(user.about.certificationsAndLicenses)) {
//         if (!user.about) {
//           user.about = {};
//         }
//         if (!Array.isArray(user.about.certificationsAndLicenses)) {
//           user.about.certificationsAndLicenses = [];
//         }
//       }

//       // 4) استخرج البيانات النصية من req.body
//       const { certificateName } = req.body;

//       // 5) لو هناك ملف (certificateFile) مرفوع، ارفعه إلى S3
//       let certificateUrl = '';
//       const certificateFiles = req.files?.certificateFile || [];
//       if (certificateFiles.length > 0) {
//         const uploadedFile = certificateFiles[0];
//         // ارفع الملف إلى S3
//         certificateUrl = await uploadFileToS3p(
//           uploadedFile,
//           'certifications', // مجلد داخل S3
//           userId,
//           'certs'          // مجرد تسمية للتفريق
//         );
//       }

//       // 6) أنشئ العنصر الجديد وأضفه للمصفوفة
//       const newCertificate = {
//         certificateName: certificateName || '',
//         certificateUrl: certificateUrl || ''
//       };

//       user.about.certificationsAndLicenses.push(newCertificate);

//       // 7) احفظ التغييرات
//       await user.save();

//       // 8) أعد الرد
//       return res.status(200).json({
//         message: 'تمت إضافة الشهادة/الرخصة بنجاح',
//         certificationsAndLicenses: user.about.certificationsAndLicenses,
//       });

//     } catch (error) {
//       return res.status(500).json({
//         message: 'حدث خطأ أثناء إضافة الشهادة/الرخصة',
//         details: error.message,
//       });
//     }
//   });
// };



// تعديل الرخصه او الشهاده 
exports.addCertification = (req, res) => {
  uploadp(req, res, async (err) => {
    if (err) {
      return res.status(400).json({ error: err.message });
    }

    try {
      // 1) التحقق من التوكن
      const token = req.headers.authorization?.split(' ')[1];
      if (!token) {
        return res.status(401).json({ message: 'Authorization token is missing' });
      }
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const userId = decoded.id;

      // 2) جلب المستخدم
      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({ message: 'المستخدم غير موجود' });
      }

      // 3) تهيئة المصفوفة إن لم تكن موجودة
      if (!user.about) {
        user.about = {};
      }
      if (!Array.isArray(user.about.certificationsAndLicenses)) {
        user.about.certificationsAndLicenses = [];
      }

      // 4) البيانات النصية
      const { certificateName } = req.body;

      // 5) رفع الملف (إن وجد) باسم الحقل "certificateUrl"
      let newCertificateUrl = '';
      const certificateFiles = req.files?.certificateUrl || [];
      if (certificateFiles.length > 0) {
        const uploadedFile = certificateFiles[0];
        newCertificateUrl = await uploadFileToS3p(
          uploadedFile,
          // 'certifications',
          'public-posts',

          userId,
          'certs'
        );
      }

      // 6) إنشاء العنصر الجديد
      const newCertificate = {
        certificateName: certificateName || '',
        certificateUrl: newCertificateUrl
      };
      user.about.certificationsAndLicenses.push(newCertificate);

      // 7) الحفظ
      await user.save();

      // 8) الرد
      return res.status(200).json({
        message: 'تمت إضافة الشهادة/الرخصة بنجاح',
        certificationsAndLicenses: user.about.certificationsAndLicenses,
      });

    } catch (error) {
      return res.status(500).json({
        message: 'حدث خطأ أثناء إضافة الشهادة/الرخصة',
        details: error.message,
      });
    }
  });
};


/**
 * تعديل عنصر موجود في مصفوفة certificationsAndLicenses
 */
exports.updateCertification = (req, res) => {
  uploadp(req, res, async (err) => {
    if (err) {
      return res.status(400).json({ error: err.message });
    }

    try {
      // 1) التحقق من التوكن
      const token = req.headers.authorization?.split(' ')[1];
      if (!token) {
        return res.status(401).json({ message: 'Authorization token is missing' });
      }
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const userId = decoded.id;

      // 2) جلب المستخدم
      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({ message: 'المستخدم غير موجود' });
      }

      // 3) التأكد من وجود المصفوفة
      if (!user.about || !Array.isArray(user.about.certificationsAndLicenses)) {
        return res.status(400).json({
          message: 'لا يوجد بيانات الشهادات/الرخص المسجّلة للقيام بالتعديل.',
        });
      }

      // 4) معرّف الشهادة من الـ params
      const { certId } = req.params;

      // 5) إيجاد العنصر
      const certItem = user.about.certificationsAndLicenses.id(certId);
      if (!certItem) {
        return res.status(404).json({
          message: 'العنصر المطلوب غير موجود في القائمة.'
        });
      }

      // 6) تعديل الحقول النصية
      const { certificateName } = req.body;
      if (certificateName !== undefined) {
        certItem.certificateName = certificateName;
      }

      // 7) التعامل مع الملف الجديد (حقل "certificateUrl")
      const certificateFiles = req.files?.certificateUrl || [];
      if (certificateFiles.length > 0) {
        // أ) حذف القديم من S3 إن وجد
        if (certItem.certificateUrl) {
          const oldUrl = certItem.certificateUrl;
          const splitted = oldUrl.split('.amazonaws.com/');
          if (splitted.length > 1) {
            let oldKey = splitted[1].split('?')[0];
            await deleteFileFromS3p(oldKey);
          }
        }
        // ب) رفع الجديد
        const newFile = certificateFiles[0];
        const newCertUrl = await uploadFileToS3p(
          newFile,
          // 'certifications',
          'public-posts',

          userId,
          'certs'
        );
        certItem.certificateUrl = newCertUrl;
      }

      // 8) الحفظ
      await user.save();

      return res.status(200).json({
        message: 'تم تعديل بيانات الشهادة/الرخصة بنجاح',
        certificationsAndLicenses: user.about.certificationsAndLicenses,
      });

    } catch (error) {
      return res.status(500).json({
        message: 'حدث خطأ أثناء تعديل بيانات الشهادة/الرخصة',
        details: error.message,
      });
    }
  });
};




// حذف الرخصه او الشهاده 


/**
 * حذف عنصر من مصفوفة certificationsAndLicenses
 */
exports.deleteCertification = async (req, res) => {
  try {
    // 1) التحقق من التوكن
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ message: 'Authorization token is missing' });
    }
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decoded.id;

    // 2) جلب المستخدم
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'المستخدم غير موجود' });
    }

    // 3) التأكد من وجود المصفوفة
    if (!user.about || !Array.isArray(user.about.certificationsAndLicenses)) {
      return res.status(400).json({
        message: 'لا يوجد بيانات الشهادات/الرخص للقيام بالحذف.',
      });
    }

    // 4) جلب معرّف الشهادة من الـ params
    const { certId } = req.params;

    // 5) إيجاد الشهادة المطلوبة أولًا للتأكد من وجودها وحذف ملفها
    const certItem = user.about.certificationsAndLicenses.find(
      (c) => c._id.toString() === certId
    );
    if (!certItem) {
      return res.status(404).json({
        message: 'العنصر المطلوب غير موجود في القائمة.'
      });
    }

    // 6) إذا كانت هناك شهادة مرفوعة في S3، نحذفها
    if (certItem.certificateUrl) {
      const oldUrl = certItem.certificateUrl;
      const splitted = oldUrl.split('.amazonaws.com/');
      if (splitted.length > 1) {
        let oldKey = splitted[1].split('?')[0];
        await deleteFileFromS3p(oldKey);
      }
    }

    // 7) حذف العنصر من المصفوفة باستخدام filter
    user.about.certificationsAndLicenses = user.about.certificationsAndLicenses.filter(
      (c) => c._id.toString() !== certId
    );

    // 8) حفظ التغييرات
    await user.save();

    return res.status(200).json({
      message: 'تم حذف الشهادة/الرخصة بنجاح',
      certificationsAndLicenses: user.about.certificationsAndLicenses
    });

  } catch (error) {
    return res.status(500).json({
      message: 'حدث خطأ أثناء حذف بيانات الشهادة/الرخصة',
      details: error.message,
    });
  }
};




// اضفاه وتعديل وسحب لالبيانات حقت الشهدات والرخص في صفحة من نحن 

// exports.updateCertifications = (req, res) => {
//   console.log('=== [updateCertifications] Route Called ===');

//   uploadp(req, res, async (err) => {
//     // سجل خطأ Multer (إن وُجد)
//     console.log('--- Multer Stage ---');
//     console.log('Multer Error (err):', err);
//     console.log('req.body BEFORE parse:', req.body);
//     console.log('req.files:', req.files);

//     if (err) {
//       console.error('Multer error:', err);
//       return res.status(400).json({ error: err.message });
//     }

//     try {
//       console.log('--- JWT Stage ---');
//       const token = req.headers.authorization?.split(' ')[1];
//       console.log('Extracted token:', token);
//       if (!token) {
//         return res.status(401).json({ message: 'Missing Authorization token' });
//       }

//       const decoded = jwt.verify(token, process.env.JWT_SECRET);
//       console.log('Decoded JWT:', decoded);
//       const userId = decoded.id;
//       console.log('User ID from token:', userId);

//       // جلب المستخدم
//       console.log('--- Fetch User Stage ---');
//       const user = await User.findById(userId);
//       if (!user) {
//         console.warn('User not found with ID:', userId);
//         return res.status(404).json({ message: 'User not found' });
//       }
//       console.log('User found:', user._id);

//       if (!user.about) {
//         user.about = {};
//         console.log('Initialized user.about as an empty object');
//       }
//       if (!Array.isArray(user.about.certificationsAndLicenses)) {
//         user.about.certificationsAndLicenses = [];
//         console.log('Initialized user.about.certificationsAndLicenses as an empty array');
//       }

//       // قراءة jsonData
//       console.log('--- Parsing JSON Stage ---');
//       let parsedData = req.body;
//       if (req.body.jsonData) {
//         try {
//           parsedData = JSON.parse(req.body.jsonData);
//           console.log('Parsed JSON from req.body.jsonData:', parsedData);
//         } catch (parseErr) {
//           console.error('Error parsing JSON:', parseErr);
//           return res.status(400).json({ message: 'Invalid JSON format' });
//         }
//       } else {
//         console.log('No jsonData field, using req.body as is:', parsedData);
//       }

//       const { _id, certificateName, deleted } = parsedData;
//       console.log(`_id: ${_id}, certificateName: ${certificateName}, deleted: ${deleted}`);

//       console.log('--- Logic Stage ---');
//       if (deleted) {
//         // حذف الشهادة من المصفوفة
//         console.log('Deleting certification with _id:', _id);
//         user.about.certificationsAndLicenses = user.about.certificationsAndLicenses.filter(
//           (c) => c._id?.toString() !== _id
//         );
//       } else if (_id) {
//         // تعديل الشهادة
//         console.log('Updating certification with _id:', _id);
//         const cert = user.about.certificationsAndLicenses.find(
//           (c) => c._id?.toString() === _id
//         );
//         if (cert) {
//           console.log('Certification found:', cert);
//           cert.certificateName = certificateName || cert.certificateName;

//           // إذا هناك ملف جديد مرفوع
//           const certificateFiles = req.files?.certificateFile || [];
//           if (certificateFiles.length > 0) {
//             console.log('New certificateFile found, will upload to S3...');
//             // (اختياري) لو أردت حذف الملف القديم من S3:
//             if (cert.certificateUrl) {
//               const oldUrl = cert.certificateUrl;
//               console.log('Old certificateUrl:', oldUrl);
//               const splitted = oldUrl.split('.amazonaws.com/');
//               if (splitted.length > 1) {
//                 let oldKey = splitted[1].split('?')[0];
//                 console.log('Deleting old file from S3 with key:', oldKey);
//                 await deleteFileFromS3p(oldKey);
//               }
//             }

//             const uploadedCert = await uploadFileToS3p(
//               certificateFiles[0],
//               'about-certificates',
//               userId,
//               'certificates'
//             );
//             console.log('New certificate uploaded, URL:', uploadedCert);
//             cert.certificateUrl = uploadedCert;
//           } else {
//             console.log('No new file to upload, keeping old certificateUrl.');
//           }
//         } else {
//           console.warn('No certification found with _id:', _id);
//         }
//       } else {
//         // إضافة شهادة جديدة
//         console.log('No _id provided, adding a new certification...');
//         const newCert = { certificateName, certificateUrl: '' };

//         // إذا هناك ملف مرفوع
//         const certificateFiles = req.files?.certificateFile || [];
//         if (certificateFiles.length > 0) {
//           console.log('Uploading new certificateFile for new certification...');
//           const uploadedCert = await uploadFileToS3p(
//             certificateFiles[0],
//             'about-certificates',
//             userId,
//             'certificates'
//           );
//           console.log('New file uploaded, URL:', uploadedCert);
//           newCert.certificateUrl = uploadedCert;
//         } else {
//           console.log('No file uploaded for the new certification.');
//         }

//         user.about.certificationsAndLicenses.push(newCert);
//       }

//       console.log('--- Saving User Stage ---');
//       await user.save();
//       console.log('User saved successfully. Updated certifications:', user.about.certificationsAndLicenses);

//       return res.status(200).json({
//         message: 'تم تعديل الشهادات بنجاح',
//         about: user.about.certificationsAndLicenses
//       });

//     } catch (error) {
//       console.error('Error in updateCertifications:', error);
//       return res.status(500).json({
//         message: 'خطأ أثناء التعديل',
//         details: error.message
//       });
//     } finally {
//       console.log('=== [updateCertifications] END ===');
//     }
//   });
// };





// exports.createOrUpdateSocialMedia = async (req, res) => {
//     try {
//       const token = req.headers.authorization?.split(' ')[1];
//       if (!token) return res.status(401).json({ message: 'Authorization token is missing' });
  
//       const decoded = jwt.verify(token, process.env.JWT_SECRET); // فك تشفير التوكن
//       const userId = decoded.id; // استخراج userId
  
//       const { platform, username } = req.body; // استلام اسم المنصة واسم المستخدم أو الرقم
//       if (!platform || !username) {
//         return res.status(400).json({ message: 'Platform and Username are required' });
//       }
  
//       const user = await User.findById(userId);
//       if (!user) return res.status(404).json({ message: 'User not found' });
  
//       // قائمة الروابط الأساسية لكل منصة
//       const platformUrls = {
//         Twitter: "https://twitter.com/",
//         Facebook: "https://facebook.com/",
//         Instagram: "https://instagram.com/",
//         LinkedIn: "https://linkedin.com/in/",
//         YouTube: "https://youtube.com/",
//         Snapchat: "https://snapchat.com/add/",
//         Pinterest: "https://pinterest.com/",
//         TikTok: "https://tiktok.com/@",
//         Telegram: "https://t.me/",
//         whatsappNumber: "https://wa.me/", // رابط دردشة واتساب مباشر
//         phoneNumber: ""    // لا يحتاج إلى رابط
//       };
  
//       // تحقق من أن المنصة المدخلة موجودة في القائمة
//       if (!platformUrls.hasOwnProperty(platform)) {
//         return res.status(400).json({ message: `Platform ${platform} is not supported.` });
//       }
  
//       // إنشاء الرابط إذا كانت المنصة تتطلب رابطًا
//       const url = platform === "phoneNumber"
//         ? username // احتفظ بالرقم كما هو بدون تعديل
//         : platform === "whatsappNumber"
//         ? `${platformUrls[platform]}${username.replace(/[^0-9]/g, '')}` // تحويل الرقم لرابط واتساب
//         : `${platformUrls[platform]}${username}`;
  
//       // تحديث أو إضافة العنصر
//       user.socialMedia = {
//         ...user.socialMedia, // الاحتفاظ بالبيانات الحالية
//         [platform]: url      // تعديل إذا كان موجودًا أو إضافة إذا كان جديدًا
//       };
  
//       await user.save();
  
//       res.status(200).json({
//         message: `${platform} has been successfully added or updated.`,
//         socialMedia: user.socialMedia
//       });
//     } catch (error) {
//       res.status(500).json({ message: 'Error updating social media data', error });
//     }
//   };
  
  
  
  
// GET لسوشل لجميع حسابات التواصل الجتماعي الموجوه 
// exports.getAllSocialMedia = async (req, res) => {
//     try {
//       const { domainName } = req.params; // استلام domainName من المسار
//       if (!domainName) {
//         return res.status(400).json({ message: 'domainName is required' });
//       }
  
//       // البحث عن المستخدم باستخدام domainName
//       const user = await User.findOne({ domainName });
//       if (!user) return res.status(404).json({ message: 'User not found with the provided domainName' });
  
//       // التحقق إذا كان حقل socialMedia موجودًا ومليئًا بالبيانات
//       const socialMedia = user.socialMedia || {};
//       if (Object.keys(socialMedia).length === 0) {
//         return res.status(404).json({ message: 'No social media accounts found.' });
//       }
  
//       res.status(200).json({
//         message: 'Social media accounts retrieved successfully.',
//         socialMedia
//       });
//     } catch (error) {
//       res.status(500).json({ message: 'Error retrieving social media data', error });
//     }
//   };
  
  


// حذف عنصر التواصل الجتماعي 

exports.deleteSocialMediaItem = async (req, res) => {
    try {
      const token = req.headers.authorization?.split(' ')[1];
      if (!token) return res.status(401).json({ message: 'Authorization token is missing' });
  
      const decoded = jwt.verify(token, process.env.JWT_SECRET); // فك تشفير التوكن
      const userId = decoded.id; // استخراج userId
  
      const { platform } = req.body; // استلام اسم المنصة المطلوب حذفها
      if (!platform) {
        return res.status(400).json({ message: 'Platform is required' });
      }
  
      const user = await User.findById(userId);
      if (!user) return res.status(404).json({ message: 'User not found' });
  
      // التحقق إذا كانت المنصة موجودة
      if (!user.socialMedia || !user.socialMedia[platform]) {
        return res.status(404).json({ message: `${platform} does not exist in social media.` });
      }
  
      // حذف العنصر المحدد عن طريق تعيينه إلى undefined
      user.socialMedia[platform] = undefined;
  
      // تحديث قاعدة البيانات
      await user.updateOne({
        $unset: { [`socialMedia.${platform}`]: "" }
      });
  
      res.status(200).json({
        message: `${platform} has been successfully deleted.`,
        socialMedia: user.socialMedia
      });
    } catch (error) {
      res.status(500).json({ message: 'Error deleting social media data', error });
    }
  };
  
  
  










  

  exports.getSocialMedia = async (req, res) => {
    try {
      const token = req.headers.authorization?.split(' ')[1];
      if (!token) return res.status(401).json({ message: 'Authorization token is missing' });
  
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const userId = decoded.userId;
  
      const user = await User.findById(userId);
      if (!user || !user.socialMedia) {
        return res.status(404).json({ message: 'Social media data not found' });
      }
  
      res.status(200).json({ socialMedia: user.socialMedia });
    } catch (error) {
      res.status(500).json({ message: 'Error fetching social media data', error });
    }
  };

  


  exports.updateSocialMedia = async (req, res) => {
    try {
      const token = req.headers.authorization?.split(' ')[1];
      if (!token) return res.status(401).json({ message: 'Authorization token is missing' });
  
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const userId = decoded.userId;
  
      const { socialMedia } = req.body;
  
      const user = await User.findById(userId);
      if (!user) return res.status(404).json({ message: 'User not found' });
  
      user.socialMedia = { ...user.socialMedia, ...socialMedia }; // تحديث البيانات الحالية
      await user.save();
  
      res.status(200).json({ message: 'Social media data updated successfully', socialMedia: user.socialMedia });
    } catch (error) {
      res.status(500).json({ message: 'Error updating social media data', error });
    }
  };

  


  exports.deleteSocialMedia = async (req, res) => {
    try {
      const token = req.headers.authorization?.split(' ')[1];
      if (!token) return res.status(401).json({ message: 'Authorization token is missing' });
  
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const userId = decoded.userId;
  
      const user = await User.findById(userId);
      if (!user) return res.status(404).json({ message: 'User not found' });
  
      user.socialMedia = {}; // مسح جميع بيانات socialMedia
      await user.save();
  
      res.status(200).json({ message: 'Social media data deleted successfully' });
    } catch (error) {
      res.status(500).json({ message: 'Error deleting social media data', error });
    }
  };
  



























// إنشاء بيانات صفحة الهوم
// exports.createHomepage = async (req, res) => {
//     try {
//       // استلام التوكن من الهيدر واستخراج userId
//       const token = req.headers.authorization?.split(' ')[1];
//       if (!token) return res.status(401).json({ message: 'Authorization token is missing' });
  
//       const decoded = jwt.verify(token, process.env.JWT_SECRET); // فك تشفير التوكن
//       const userId = decoded.id; // استخراج userId
  
//       const { header, subHeader } = req.body; // استلام البيانات من العميل
  
//       const user = await User.findById(userId);
//       if (!user) return res.status(404).json({ message: 'User not found' });
  
//       // التحقق من وجود بيانات سابقة للهوم
//       if (user.websiteData?.homepage) {
//         return res.status(400).json({ message: 'Homepage data already exists. Use update instead.' });
//       }
  
//       // إنشاء بيانات الهوم
//       user.websiteData = {
//         ...user.websiteData,
//         homepage: { header, subHeader }
//       };
  
//       await user.save();
//       res.status(201).json({ message: 'Homepage created successfully', homepage: user.websiteData.homepage });
//     } catch (error) {
//       res.status(500).json({ message: 'Error creating homepage data', error });
//     }
//   };
  



  exports.createHomepage = async (req, res) => {
    try {
      // استلام التوكن من الهيدر
      const token = req.headers.authorization?.split(' ')[1];
      if (!token) return res.status(401).json({ message: 'Authorization token is missing' });
  
      let decoded;
      try {
        decoded = jwt.verify(token, process.env.JWT_SECRET);
      } catch (err) {
        return res.status(401).json({ message: 'Invalid token' });
      }
      const userId = decoded.id;
  
      const { header, subHeader } = req.body;
  
      // جلب المستخدم
      const user = await User.findById(userId);
      if (!user) return res.status(404).json({ message: 'User not found' });
  
      // تحديث أو إنشاء البيانات
      user.websiteData = {
        ...user.websiteData,
        homepage: { header, subHeader }
      };
  
      await user.save();
      res.status(200).json({ message: 'Homepage data saved successfully', homepage: user.websiteData.homepage });
    } catch (error) {
      res.status(500).json({ message: 'Error saving homepage data', error });
    }
  };
  

// جلب بيانات الهوم
exports.getHomepage = async (req, res) => {
  try {
    // استلام التوكن من الهيدر واستخراج userId
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ message: 'Authorization token is missing' });

    const decoded = jwt.verify(token, process.env.JWT_SECRET); // فك تشفير التوكن
    const userId = decoded.userId; // استخراج userId

    const user = await User.findById(userId);

    if (!user || !user.websiteData || !user.websiteData.homepage) {
      return res.status(404).json({ message: 'Homepage data not found' });
    }

    res.status(200).json({ homepage: user.websiteData.homepage });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching homepage data', error });
  }
};

// تحديث بيانات الهوم
// exports.updateHomepage = async (req, res) => {
//   try {
//     // استلام التوكن من الهيدر واستخراج userId
//     const token = req.headers.authorization?.split(' ')[1];
//     if (!token) return res.status(401).json({ message: 'Authorization token is missing' });

//     const decoded = jwt.verify(token, process.env.JWT_SECRET); // فك تشفير التوكن
//     const userId = decoded.userId; // استخراج userId

//     const { header, subHeader } = req.body; // استلام البيانات من العميل

//     const user = await User.findById(userId);
//     if (!user) return res.status(404).json({ message: 'User not found' });

//     user.websiteData.homepage = { header, subHeader }; // تحديث بيانات الهوم
//     await user.save();

//     res.status(200).json({ message: 'Homepage updated successfully', homepage: user.websiteData.homepage });
//   } catch (error) {
//     res.status(500).json({ message: 'Error updating homepage data', error });
//   }
// };

// حذف بيانات الهوم
exports.deleteHomepage = async (req, res) => {
  try {
    // استلام التوكن من الهيدر واستخراج userId
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ message: 'Authorization token is missing' });

    const decoded = jwt.verify(token, process.env.JWT_SECRET); // فك تشفير التوكن
    const userId = decoded.userId; // استخراج userId

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    user.websiteData.homepage = undefined; // حذف بيانات الهوم
    await user.save();

    res.status(200).json({ message: 'Homepage deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting homepage data', error });
  }
};
