const express = require('express');
const router = express.Router();
const userController = require('../../controllers/user/userController');
const { authenticateToken } = require('../../middleware/auth'); // استيراد authenticateToken
const multer = require('multer');

// إعداد multer للتعامل مع الملفات
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// مسار لرفع الملفات إلى S3
router.post('/upload', upload.single('file'),authenticateToken, userController.uploadFile);

// مسار للوصول إلى البوستات الخاصة باستخدام Signed URLs
router.get('/private-post/:fileName', authenticateToken, userController.getPrivateFileUrl);

// مسار لحذف الملفات
router.delete('/delete', authenticateToken, userController.deleteFile);


// نقل الملف من إلى مجلد العام إلى مجلد الخاص والعكس 
router.post('/move-file', authenticateToken, userController.moveFile);




// خاصة بشعارة مكاتب العقار 
// مسار لرفع الملفات إلى profile-pictures
router.post('/upload-profile-picture', upload.single('file'),authenticateToken, userController.uploadFile);

// مسار لحذف الملفات من profile-pictures
router.delete('/delete-profile-picture',authenticateToken, userController.deleteFile);




module.exports = router;
