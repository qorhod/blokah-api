const express = require('express');
const router = express.Router();
const websiteController = require('../../controllers/website/websiteController');
const { authenticateToken } = require('../../middleware/auth'); // استيراد authenticateToken

// إنشاء بيانات صفحة الهوم
router.post('/homepage', authenticateToken, websiteController.createHomepage);

// جلب بيانات صفحة الهوم
router.get('/homepage', authenticateToken, websiteController.getHomepage);

// تحديث بيانات صفحة الهوم
router.put('/homepage', authenticateToken, websiteController.updateHomepage);

// حذف بيانات صفحة الهوم
router.delete('/homepage', authenticateToken, websiteController.deleteHomepage);




router.post('/socialMedia', authenticateToken, websiteController.createOrUpdateSocialMedia);
router.get('/socialMedia/:domainName', websiteController.getAllSocialMedia);
router.delete('/socialMedia', authenticateToken, websiteController.deleteSocialMediaItem);





module.exports = router;
