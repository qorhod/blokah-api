const express = require('express');
const router = express.Router();
const authController = require('../../controllers/auth/authController');
const { authenticateToken } = require('../../middleware/auth'); // استيراد authenticateToken
 
// إنشاء حساب جديد
router.post('/register', authController.register);

// التحقق من رمز التحقق بعد التسجيل
router.post('/verify-register-otp', authController.verifyRegisterOtp);

// تسجيل الدخول باستخدام رقم الجوال وإرسال OTP
router.post('/login-phone', authController.loginWithPhone);

// التحقق من OTP لتسجيل الدخول باستخدام الجوال
router.post('/verify-login-otp', authController.verifyLoginOtp);

// تسجيل الدخول باستخدام البريد الإلكتروني وكلمة المرور
router.post('/login-email', authController.loginWithEmail);

// استعادة كلمة المرور عبر البريد الإلكتروني - إرسال رابط استعادة
router.post('/recover-password-email', authController.recoverPasswordByEmail); // إضافة هذا المسار

// إعادة تعيين كلمة المرور عبر البريد الإلكتروني بعد النقر على الرابط
router.post('/reset-password-email', authController.resetPasswordByEmail); // إضافة هذا المسار

// استعادة كلمة المرور - إرسال OTP (لرقم الجوال)
router.post('/recover-password', authController.recoverPassword);

// إعادة تعيين كلمة المرور بعد التحقق من OTP (لرقم الجوال)
router.post('/reset-password', authController.resetPassword);

// الحصول على ملف المستخدم الشخصي
router.get('/profile', authenticateToken, authController.getProfile); // إضافة هذا المسار

// تحديث ملف المستخدم الشخصي
router.put('/profile', authenticateToken, authController.updateProfile); // إضافة هذا المسار

// تغيير كلمة المرور
router.post('/change-password', authenticateToken, authController.changePassword); // إضافة مسار تغيير كلمة المرور

module.exports = router;
