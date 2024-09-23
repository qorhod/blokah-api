const express = require('express');
const router = express.Router();
const userController = require('../../controllers/user/userController');
const { authenticateToken } = require('../../middleware/auth'); // استيراد authenticateToken

// إنشاء حساب جديد
router.post('/register', userController.register);

// التحقق من رمز التحقق بعد التسجيل
router.post('/verify-register-otp', userController.verifyRegisterOtp);

// تسجيل الدخول باستخدام رقم الجوال وإرسال OTP
router.post('/login-phone', userController.loginWithPhone);

// التحقق من OTP لتسجيل الدخول باستخدام الجوال
router.post('/verify-login-otp', userController.verifyLoginOtp);

// تسجيل الدخول باستخدام البريد الإلكتروني وكلمة المرور
router.post('/login-email', userController.loginWithEmail);

// استعادة كلمة المرور - إرسال OTP
router.post('/recover-password', userController.recoverPassword);

// إعادة تعيين كلمة المرور بعد التحقق من OTP
router.post('/reset-password', userController.resetPassword);


// الحصول على ملف المستخدم الشخصي
router.get('/profile', authenticateToken, userController.getProfile); // إضافة هذا المسار



// تحديث ملف المستخدم الشخصي
router.put('/profile', authenticateToken, userController.updateProfile); // إضافة هذا المسار


// تغيير كلمة المرور
router.post('/change-password', authenticateToken, userController.changePassword); // إضافة مسار تغيير كلمة المرور



module.exports = router;
