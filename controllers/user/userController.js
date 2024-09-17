const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Joi = require('joi');
const User = require('../../models/user');

// توليد رمز تحقق عشوائي
const generateVerificationCode = () => Math.floor(100000 + Math.random() * 900000).toString();

// Schemas for validation
const registerSchema = Joi.object({
  email: Joi.string().email().required(),
  phone: Joi.string().min(10).required(),
  password: Joi.string().min(6).required(),
  accountType: Joi.string().valid('admin', 'user', 'manager').required()
});

const otpSchema = Joi.object({
  phone: Joi.string().min(10).required(),
  verificationCode: Joi.string().length(6).required()
});

const loginEmailSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required()
});

const loginPhoneSchema = Joi.object({
  phone: Joi.string().min(10).required()
});

const passwordResetSchema = Joi.object({
  phone: Joi.string().min(10).required(),
  verificationCode: Joi.string().length(6).required(),
  newPassword: Joi.string().min(6).required()
});

// إنشاء حساب جديد
exports.register = async (req, res) => {
    const { error } = registerSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ message: error.details[0].message });
    }
  
    const { email, phone, password, accountType } = req.body;
  
    try {
      let user = await User.findOne({ $or: [{ email }, { phone }] });
      if (user) {
        return res.status(400).json({ message: 'User already exists' });
      }
  
      // إرسال رمز التحقق وطباعته في الـ console.log
      const verificationCode = generateVerificationCode();
      console.log(`رمز التحقق لإنشاء الحساب هو: ${verificationCode}`);
  
      // تخزين رمز التحقق في الجلسة
      req.session.verificationCode = verificationCode;
      req.session.email = email;
      req.session.phone = phone;
      req.session.password = password;
      req.session.accountType = accountType;
  
      // ضبط مؤقت لحذف رمز التحقق بعد 5 دقائق (300,000 مللي ثانية)
      setTimeout(() => {
        req.session.verificationCode = null; // حذف رمز التحقق بعد انتهاء المهلة
      }, 5 * 60 * 1000); // 5 دقائق
  
      res.status(200).json({ message: 'تم إرسال رمز التحقق إلى الجوال (تحقق من الـ console.log).' });
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server error');
    }
  };

// التحقق من OTP وإكمال إنشاء الحساب
exports.verifyRegisterOtp = async (req, res) => {
  const { error } = otpSchema.validate(req.body);
  if (error) {
    return res.status(400).json({ message: error.details[0].message });
  }

  const { phone, verificationCode } = req.body;

  try {
    if (req.session.phone !== phone || req.session.verificationCode !== verificationCode) {
      return res.status(400).json({ message: 'رمز التحقق غير صحيح' });
    }

    const hashedPassword = await bcrypt.hash(req.session.password, 10);

    const newUser = new User({
      email: req.session.email,
      phone: req.session.phone,
      password: hashedPassword,
      accountType: req.session.accountType
    });

    await newUser.save();

    // إنشاء توكن JWT
    const payload = {
      id: newUser.id,
      accountType: newUser.accountType
    };

    jwt.sign(
      payload,
      process.env.JWT_SECRET,
      { expiresIn: 3600 },
      (err, accessToken) => {
        if (err) throw err;
        res.json({ accessToken });
      }
    );

    // مسح بيانات الجلسة
    req.session.destroy();
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
};

// تسجيل الدخول باستخدام رقم الجوال وإرسال رمز التحقق
exports.loginWithPhone = async (req, res) => {
  const { error } = loginPhoneSchema.validate(req.body);
  if (error) {
    return res.status(400).json({ message: error.details[0].message });
  }

  const { phone } = req.body;

  try {
    let user = await User.findOne({ phone });
    if (!user) {
      return res.status(400).json({ message: 'User not found' });
    }

    // إرسال رمز التحقق وطباعته في الـ console.log
    const verificationCode = generateVerificationCode();
    user.phoneVerificationCode = verificationCode;
    await user.save();

    console.log(`رمز التحقق لتسجيل الدخول هو: ${verificationCode}`);
    res.status(200).json({ message: 'تم إرسال رمز التحقق إلى الجوال (تحقق من الـ console.log).' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
};

// التحقق من OTP لتسجيل الدخول
exports.verifyLoginOtp = async (req, res) => {
  const { error } = otpSchema.validate(req.body);
  if (error) {
    return res.status(400).json({ message: error.details[0].message });
  }

  const { phone, verificationCode } = req.body;

  try {
    let user = await User.findOne({ phone, phoneVerificationCode: verificationCode });
    if (!user) {
      return res.status(400).json({ message: 'رمز التحقق غير صحيح' });
    }

    // مسح رمز التحقق بعد التحقق
    user.phoneVerificationCode = null;
    await user.save();

    const payload = {
      id: user.id,
      accountType: user.accountType
    };

    jwt.sign(
      payload,
      process.env.JWT_SECRET,
      { expiresIn: 3600 },
      (err, accessToken) => {
        if (err) throw err;
        res.json({ accessToken });
      }
    );
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
};

// تسجيل الدخول باستخدام البريد الإلكتروني وكلمة المرور
exports.loginWithEmail = async (req, res) => {
  const { error } = loginEmailSchema.validate(req.body);
  if (error) {
    return res.status(400).json({ message: error.details[0].message });
  }

  const { email, password } = req.body;

  try {
    let user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'الحساب غير موجود' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'بيانات غير صحيحة' });
    }

    const payload = {
      id: user.id,
      accountType: user.accountType
    };

    jwt.sign(
      payload,
      process.env.JWT_SECRET,
      { expiresIn: 3600 },
      (err, accessToken) => {
        if (err) throw err;
        res.json({ accessToken });
      }
    );
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
};

// استعادة كلمة المرور - إرسال رمز التحقق
exports.recoverPassword = async (req, res) => {
  const { phone } = req.body;

  try {
    let user = await User.findOne({ phone });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const verificationCode = generateVerificationCode();
    user.phoneVerificationCode = verificationCode;

    await user.save();
    console.log(`رمز التحقق لاستعادة كلمة المرور هو: ${verificationCode}`);

    res.status(200).json({ message: 'تم إرسال رمز التحقق (تحقق من الـ console.log).' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
};

// إعادة تعيين كلمة المرور
exports.resetPassword = async (req, res) => {
  const { error } = passwordResetSchema.validate(req.body);
  if (error) {
    return res.status(400).json({ message: error.details[0].message });
  }

  const { phone, verificationCode, newPassword } = req.body;

  try {
    let user = await User.findOne({ phone, phoneVerificationCode: verificationCode });
    if (!user) {
      return res.status(400).json({ message: 'رمز التحقق غير صحيح' });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;
    user.phoneVerificationCode = null;

    await user.save();
    res.status(200).json({ message: 'Password reset successfully.' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
};





// الحصول على ملف المستخدم الشخصي
exports.getProfile = async (req, res) => {
    try {
      // الحصول على معرف المستخدم من التوكن (تم تمريره من `authenticateToken` middleware)
      const userId = req.user.id;
  
      // البحث عن المستخدم في قاعدة البيانات بناءً على معرف المستخدم
      const user = await User.findById(userId).select('-password'); // استثناء حقل كلمة المرور
  
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
  
      // إرسال معلومات المستخدم
      res.status(200).json(user);
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server error');
    }
  };
  




  // تحديث ملف المستخدم الشخصي
exports.updateProfile = async (req, res) => {
    const { email, phone, password } = req.body;
  
    try {
      // الحصول على معرف المستخدم من التوكن
      const userId = req.user.id;
  
      // البحث عن المستخدم في قاعدة البيانات
      let user = await User.findById(userId);
  
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
  
      // تحديث الحقول فقط إذا تم إرسالها
      if (email) user.email = email;
      if (phone) user.phone = phone;
      
      // إذا تم إرسال كلمة مرور جديدة، نقوم بتشفيرها
      if (password) {
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(password, salt);
      }
  
      // حفظ التحديثات
      await user.save();
  
      res.status(200).json({ message: 'Profile updated successfully', user });
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server error');
    }
  };
  