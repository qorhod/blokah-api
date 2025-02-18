const User = require('../../models/user');
const jwt = require('jsonwebtoken');


exports.createOrUpdateSocialMedia = async (req, res) => {
    try {
      const token = req.headers.authorization?.split(' ')[1];
      if (!token) return res.status(401).json({ message: 'Authorization token is missing' });
  
      const decoded = jwt.verify(token, process.env.JWT_SECRET); // فك تشفير التوكن
      const userId = decoded.id; // استخراج userId
  
      const { platform, username } = req.body; // استلام اسم المنصة واسم المستخدم أو الرقم
      if (!platform || !username) {
        return res.status(400).json({ message: 'Platform and Username are required' });
      }
  
      const user = await User.findById(userId);
      if (!user) return res.status(404).json({ message: 'User not found' });
  
      // قائمة الروابط الأساسية لكل منصة
      const platformUrls = {
        Twitter: "https://twitter.com/",
        Facebook: "https://facebook.com/",
        Instagram: "https://instagram.com/",
        LinkedIn: "https://linkedin.com/in/",
        YouTube: "https://youtube.com/",
        Snapchat: "https://snapchat.com/add/",
        Pinterest: "https://pinterest.com/",
        TikTok: "https://tiktok.com/@",
        Telegram: "https://t.me/",
        whatsappNumber: "https://wa.me/", // رابط دردشة واتساب مباشر
        phoneNumber: ""    // لا يحتاج إلى رابط
      };
  
      // تحقق من أن المنصة المدخلة موجودة في القائمة
      if (!platformUrls.hasOwnProperty(platform)) {
        return res.status(400).json({ message: `Platform ${platform} is not supported.` });
      }
  
      // إنشاء الرابط إذا كانت المنصة تتطلب رابطًا
      const url = platform === "phoneNumber"
        ? username // احتفظ بالرقم كما هو بدون تعديل
        : platform === "whatsappNumber"
        ? `${platformUrls[platform]}${username.replace(/[^0-9]/g, '')}` // تحويل الرقم لرابط واتساب
        : `${platformUrls[platform]}${username}`;
  
      // تحديث أو إضافة العنصر
      user.socialMedia = {
        ...user.socialMedia, // الاحتفاظ بالبيانات الحالية
        [platform]: url      // تعديل إذا كان موجودًا أو إضافة إذا كان جديدًا
      };
  
      await user.save();
  
      res.status(200).json({
        message: `${platform} has been successfully added or updated.`,
        socialMedia: user.socialMedia
      });
    } catch (error) {
      res.status(500).json({ message: 'Error updating social media data', error });
    }
  };
  
  
  
  
// GET لسوشل لجميع حسابات التواصل الجتماعي الموجوه 
exports.getAllSocialMedia = async (req, res) => {
    try {
      const { domainName } = req.params; // استلام domainName من المسار
      if (!domainName) {
        return res.status(400).json({ message: 'domainName is required' });
      }
  
      // البحث عن المستخدم باستخدام domainName
      const user = await User.findOne({ domainName });
      if (!user) return res.status(404).json({ message: 'User not found with the provided domainName' });
  
      // التحقق إذا كان حقل socialMedia موجودًا ومليئًا بالبيانات
      const socialMedia = user.socialMedia || {};
      if (Object.keys(socialMedia).length === 0) {
        return res.status(404).json({ message: 'No social media accounts found.' });
      }
  
      res.status(200).json({
        message: 'Social media accounts retrieved successfully.',
        socialMedia
      });
    } catch (error) {
      res.status(500).json({ message: 'Error retrieving social media data', error });
    }
  };
  
  


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
exports.updateHomepage = async (req, res) => {
  try {
    // استلام التوكن من الهيدر واستخراج userId
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ message: 'Authorization token is missing' });

    const decoded = jwt.verify(token, process.env.JWT_SECRET); // فك تشفير التوكن
    const userId = decoded.userId; // استخراج userId

    const { header, subHeader } = req.body; // استلام البيانات من العميل

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    user.websiteData.homepage = { header, subHeader }; // تحديث بيانات الهوم
    await user.save();

    res.status(200).json({ message: 'Homepage updated successfully', homepage: user.websiteData.homepage });
  } catch (error) {
    res.status(500).json({ message: 'Error updating homepage data', error });
  }
};

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
