const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true
  },
  phone: {
    type: String,
    required: true,
    unique: true
  },
  password: {
    type: String,
    required: true
  },
  accountType: {
    type: String,
    enum: ['admin', 'user', 'manager'],
    default: 'user'
  },
  phoneVerificationCode: {
    type: String,  // يتم تخزين رمز التحقق المؤقت هنا عند تسجيل الدخول أو استعادة كلمة المرور
    default: null
  },
  isPhoneVerified: {
    type: Boolean,  // للتحقق مما إذا كان رقم الجوال قد تم التحقق منه عند إنشاء الحساب
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// إنشاء الموديل
const User = mongoose.model('User', userSchema);

module.exports = User;
