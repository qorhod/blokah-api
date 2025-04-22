// const express = require('express');
// const router = express.Router();
// const websiteController = require('../../controllers/website/websiteController');
// const { authenticateToken } = require('../../middleware/auth'); // استيراد authenticateToken
// const upload = multer({ storage: storage });

// routes/website/index.js

const express = require('express');
const router = express.Router();

// 1) استيراد multer وتعريف التخزين
const multer = require('multer');
const storage = multer.memoryStorage();
const upload = require('../../utils/multerConfig');

// 2) استيراد بقية المتطلبات
const websiteController = require('../../controllers/website/websiteController');
const { authenticateToken } = require('../../middleware/auth');








// إنشاء بيانات صفحة الهوم
router.post('/homepage', authenticateToken, websiteController.createHomepage);

// جلب بيانات صفحة الهوم
router.get('/homepage', authenticateToken, websiteController.getHomepage);




// 



// تحديث بيانات صفحة الهوم
// router.put('/homepage', authenticateToken, websiteController.updateHomepage);


// router.post('/about', authenticateToken, websiteController.createOrUpdateAbout);


// 1) تحديث المعلومات العامة للشركة
//    (companyIntroduction, businessAreas, mission, vision, values, competitiveAdvantages)
router.post('/about/company-info', authenticateToken, websiteController.updateCompanyInfo);




// مسارات رفع وحذف صور صفحة "about"
router.post('/about/upload-about-images',authenticateToken,websiteController.uploadAboutImages);
// حذف ضور من نحن 
router.delete('/about/remove-about-image', authenticateToken,websiteController.removeAboutImage);

// مسارات رفع وحذف شعارات شركاء النجاح
router.post('/about/upload-company-logos', authenticateToken, websiteController.uploadCompanyLogos);
router.delete('/about/remove-company-logo', authenticateToken, websiteController.removeCompanyLogo);



// مسارات رفع وحذف صور صفحة "about"



// التحكم في معلوامات الموظف في صفحة من نحن 

// التحكم في معلومات الموظف في صفحة "من نحن"

// 1) إضافة موظّف جديد
router.post(
    '/about/organizational-structure',
    authenticateToken,
    websiteController.addOrganizationalMember
  );
  
  
  // 2) تعديل موظّف
router.put(
    '/about/organizational-structure/:memberId', 
    authenticateToken, 
    websiteController.updateOrganizationalMember
  );
  
  // 3) حذف موظّف
  router.delete(
    '/about/organization/member/:memberId',
    authenticateToken,
    websiteController.deleteOrganizationalMember
  );
  
  





  //********** ايضافه او تعدل رخصه او شهاده  */
  // أمثلة... غيّر المسميات بما يناسبك

  // انشا رخصه 
router.post(
    '/about/certification',
    authenticateToken,
    websiteController.addCertification
  );
  // تعدل رخصه 
  router.put(
    '/about/certification/:certId',
    authenticateToken,
    websiteController.updateCertification
  );
//   حذف الرخصه 
  router.delete(
    '/about/certification/:certId',
    authenticateToken,
    websiteController.deleteCertification
  );
  


// // 2) إضافة/تعديل/حذف في الهيكل التنظيمي + رفع صورهم
// router.put('/about/organizational-structure', authenticateToken, websiteController.updateOrganizationalStructure);

// // 3) إضافة/تعديل/حذف في الشهادات + رفع ملفات PDF
// router.put('/about/certifications', authenticateToken, websiteController.updateCertifications);










// حذف بيانات صفحة الهوم
router.delete('/homepage', authenticateToken, websiteController.deleteHomepage);




// router.post('/socialMedia', authenticateToken, websiteController.createOrUpdateSocialMedia);
router.post('/socialMedia', authenticateToken, websiteController.createOrUpdateSocialMediaAndBranches);

// جلب بيانات السوشل ميديا بستخدام رابط الموقع
router.get('/socialMediaForWebsiteUrl/:websiteUrl', websiteController.getAllSocialMediaForWebsiteUrl);



router.get('/socialMedia/:domainName', websiteController.getAllSocialMedia);

router.delete('/socialMedia', authenticateToken, websiteController.deleteSocialMediaItem);


// >>> إضافة المسار الخاص بالتحديث (يشمل رفع صور) <<<
router.post('/homepage/update', authenticateToken, websiteController.updateHomepage);

// جلب بيانات المسخدم بما في ذالك بيانات الصفحات باستخدام اسم الدومين 

router.get('/domain/:domainName', websiteController.getAllUserDataByDomain);
// جلب بيانات الصفة بساتخدام الرابط 
router.get('/websiteUrl/:websiteUrl', websiteController.getAllUserDataByDomainForWebsiteUrl);


module.exports = router;
