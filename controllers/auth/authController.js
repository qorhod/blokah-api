const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Joi = require('joi');
const User = require('../../models/user');

const axios = require('axios'); // استيراد axios لإرسال طلب إلى Google reCAPTCHA API

// const bcrypt = require('bcrypt');
// const User = require('../models/User'); // تأكد من مسار الموديل

// توليد رمز تحقق عشوائي من 4 أرقام
const generateVerificationCode = () => Math.floor(1000 + Math.random() * 9000).toString();

// مخطط التسجيل مع تعقيد كلمة المرور
// مخطط التسجيل مع تعقيد كلمة المرور وإضافة reCAPTCHA token
const registerSchema = Joi.object({
  firstName: Joi.string().min(2).max(30).required(),
  lastName: Joi.string().min(2).max(30).required(),
  email: Joi.string().email().required(),
  phone: Joi.string().pattern(/^05\d{8}$/).required(),  // يجب أن يبدأ بـ 05 ويحتوي على 10 أرقام
  password: Joi.string()
    .min(8).messages({ 'string.min': 'كلمة المرور يجب أن تحتوي على 8 أحرف على الأقل' })
    .max(30).messages({ 'string.max': 'كلمة المرور يجب ألا تتجاوز 30 حرفًا' })
    .pattern(/[a-z]/, { name: 'lowercase' }).messages({ 'string.pattern.name': 'كلمة المرور يجب أن تحتوي على حرف صغير واحد على الأقل' })
    .pattern(/[A-Z]/, { name: 'uppercase' }).messages({ 'string.pattern.name': 'كلمة المرور يجب أن تحتوي على حرف كبير واحد على الأقل' })
    .pattern(/[0-9]/, { name: 'numeric' }).messages({ 'string.pattern.name': 'كلمة المرور يجب أن تحتوي على رقم واحد على الأقل' })
    .pattern(/[@$!%*?&#]/, { name: 'symbol' }).messages({ 'string.pattern.name': 'كلمة المرور يجب أن تحتوي على رمز خاص واحد على الأقل' })
    .required().messages({ 'any.required': 'حقل كلمة المرور مطلوب' }),
  accountType: Joi.string().valid('admin', 'user', 'manager').default('user'),
  recaptchaToken: Joi.string().required().messages({ 'any.required': 'رمز reCAPTCHA مطلوب' }) // إضافة recaptchaToken
});



 // التحقق من رقم الجوال والرمز معًا باستخدام Joi
 const otpVerifySchema = Joi.object({
  phone: Joi.string().pattern(/^05\d{8}$/).required(),  // التحقق من أن رقم الجوال يبدأ بـ 05 ويكون طوله 10 أرقام
  verificationCode: Joi.string().length(4).pattern(/^\d{4}$/).required()  // التحقق من أن رمز التحقق مكون من 4 أرقام
});


const loginEmailSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required(),
  recaptchaToken: Joi.string().required() // إضافة recaptchaToken
});

const loginPhoneSchema = Joi.object({
  phone: Joi.string().min(10).regex(/^05\d{8}$/).required(), // تأكد من أن رقم الهاتف يبدأ بـ 05 ويتكون من 10 أرقام
  recaptchaToken: Joi.string().required() // إضافة recaptchaToken
});



// استيراد مكتبة للتحقق من تعقيد كلمة المرور
const passwordComplexity = require('joi-password-complexity');

// تحديد تعقيد كلمة المرور المطلوبة
const complexityOptions = {
  min: 8,           // الحد الأدنى للطول
  max: 30,          // الحد الأقصى للطول
  lowerCase: 1,     // يجب أن تحتوي على حرف صغير واحد على الأقل
  upperCase: 1,     // يجب أن تحتوي على حرف كبير واحد على الأقل
  numeric: 1,       // يجب أن تحتوي على رقم واحد على الأقل
  symbol: 1,        // يجب أن تحتوي على رمز خاص واحد على الأقل
  requirementCount: 4, // يجب أن تتوافق مع جميع الشروط الأربعة السابقة
};





// تحديث مخطط التحقق الحالي ليشمل التحقق من تعقيد كلمة المرور
const passwordResetSchema = Joi.object({
  phone: Joi.string().min(10).required().regex(/^05\d+$/, 'رقم الجوال يجب أن يبدأ بـ "05" ويتكون من 10 أرقام').messages({
    'string.pattern.base': 'رقم الجوال يجب أن يبدأ بـ "05" ويتكون من 10 أرقام',
  }),
  verificationCode: Joi.string().length(4).required(),
  newPassword: Joi.string()
    .min(8).message('كلمة المرور يجب أن تحتوي على 8 أحرف على الأقل')
    .max(30).message('كلمة المرور يجب ألا تتجاوز 30 حرفًا')
    .pattern(/[a-z]/, 'lowercase').message('كلمة المرور يجب أن تحتوي على حرف صغير واحد على الأقل')
    .pattern(/[A-Z]/, 'uppercase').message('كلمة المرور يجب أن تحتوي على حرف كبير واحد على الأقل')
    .pattern(/[0-9]/, 'numeric').message('كلمة المرور يجب أن تحتوي على رقم واحد على الأقل')
    .pattern(/[@$!%*?&#]/, 'symbol').message('كلمة المرور يجب أن تحتوي على رمز خاص واحد على الأقل')
    .required(),
});

// اداه لتامين ارسال الكود وتقيده بعدد معين من المحاولات 




const { RateLimiterMemory } = require('rate-limiter-flexible');

// إعدادات مكتبة rate-limiter لتحديد عدد المحاولات
const maxWrongAttemptsByIP = 20; // الحد الأقصى للمحاولات الفاشلة من نفس الـ IP
const limiter = new RateLimiterMemory({
  points: maxWrongAttemptsByIP, // عدد المحاولات المسموحة
  duration: 15 * 60, // مدة 15 دقيقة قبل إعادة المحاولة
});
// إنشاء حساب جديد
exports.register = async (req, res) => {
  const { error } = registerSchema.validate(req.body);
  if (error) {
    return res.status(400).json({ message: error.details[0].message });
  }

  const { firstName, lastName, email, phone, password, accountType, recaptchaToken } = req.body;

  try {
    // التحقق من reCAPTCHA token
    const secretKey = process.env.RECAPTCHA_SECRET_KEY; 
    const verificationUrl = `https://www.google.com/recaptcha/api/siteverify?secret=${secretKey}&response=${recaptchaToken}`;
    const recaptchaResponse = await axios.post(verificationUrl);

    // إضافة تتبع للتأكد من الاستجابة
    console.log('reCAPTCHA response:', recaptchaResponse.data);

    if (!recaptchaResponse.data.success || recaptchaResponse.data.score < 0.5) {
      return res.status(400).json({ message: 'فشل التحقق من reCAPTCHA. يرجى المحاولة مرة أخرى.' });
    }

    let user = await User.findOne({ $or: [{ email }, { phone }] });
    if (user) {
      return res.status(400).json({ message: 'المستخدم موجود بالفعل' });
    }

    // إنشاء رمز التحقق وطباعته في console
    const verificationCode = generateVerificationCode();
    console.log(`رمز التحقق لإنشاء الحساب هو: ${verificationCode}`);

    // تخزين جميع بيانات المستخدم في الجلسة، بما في ذلك رمز التحقق
    req.session.userData = {
      firstName,
      lastName,
      email,
      phone,
      password,
      accountType,
      verificationCode,
      createdAt: Date.now() 
    };

    // ضبط مؤقت لحذف رمز التحقق بعد 5 دقائق
    setTimeout(() => {
      if (req.session.userData && (Date.now() - req.session.userData.createdAt >= 5 * 60 * 1000)) {
        req.session.userData.verificationCode = null; 
        console.log('تم حذف رمز التحقق بعد مرور 5 دقائق.');
      }
    }, 5 * 60 * 1000); 

    res.status(200).json({ message: 'تم إرسال رمز التحقق إلى الجوال (تحقق من الـ console.log).' });
  } catch (err) {
    console.error('Error in register:', err.message);
    res.status(500).send('خطأ في الخادم');
  }
};


// التحقق من OTP وإكمال إنشاء الحساب
exports.verifyRegisterOtp = async (req, res) => {
  const { error } = otpVerifySchema.validate(req.body);
  if (error) {
    return res.status(400).json({ message: error.details[0].message });
  }

  const { phone, verificationCode } = req.body; // تم إزالة recaptchaToken
  const ipAddr = req.ip; // عنوان IP الخاص بالمستخدم

  try {
    // تم إزالة عملية التحقق من reCAPTCHA

    // التحقق من الجلسة
    if (!req.session.userData) {
      return res.status(400).json({ message: 'انتهت صلاحية الجلسة. حاول مرة أخرى.' });
    }

    // التحقق من انتهاء صلاحية رمز التحقق
    if (Date.now() - req.session.userData.createdAt >= 5 * 60 * 1000) {
      req.session.userData.verificationCode = null;
      return res.status(400).json({ message: 'رمز التحقق منتهي الصلاحية. حاول مرة أخرى.' });
    }

    // التحقق من عدد المحاولات الفاشلة
    const rateLimiterRes = await limiter.get(ipAddr);
    if (rateLimiterRes !== null && rateLimiterRes.consumedPoints >= maxWrongAttemptsByIP) {
      const retrySecs = Math.round(rateLimiterRes.msBeforeNext / 1000) || 1;
      return res.status(429).json({ message: `تم تجاوز الحد الأقصى للمحاولات. حاول مرة أخرى بعد ${retrySecs} ثانية.` });
    }

    // التحقق من أن رقم الجوال والرمز متطابقان مع ما هو مخزن في الجلسة
    if (req.session.userData.phone !== phone || req.session.userData.verificationCode !== verificationCode) {
      await limiter.consume(ipAddr); // تسجيل المحاولة الفاشلة
      return res.status(400).json({ message: 'رمز التحقق أو رقم الجوال غير صحيح' });
    }

    // تشفير كلمة المرور
    const hashedPassword = await bcrypt.hash(req.session.userData.password, 10);

    // إنشاء حساب المستخدم الجديد
    const newUser = new User({
      firstName: req.session.userData.firstName,
      lastName: req.session.userData.lastName,
      email: req.session.userData.email,
      phone: req.session.userData.phone,
      password: hashedPassword,
      accountType: req.session.userData.accountType,
    });

    await newUser.save();

    // إنشاء توكن JWT للمستخدم الجديد
    const payload = {
      id: newUser.id,
      accountType: newUser.accountType,
    };

    jwt.sign(
      payload,
      process.env.JWT_SECRET,
      { expiresIn: 3600 }, // صلاحية التوكن لمدة ساعة واحدة
      (err, accessToken) => {
        if (err) throw err;
        res.json({ accessToken });
      }
    );

    // مسح بيانات الجلسة بعد نجاح التسجيل
    req.session.destroy();
    await limiter.delete(ipAddr); // إعادة تعيين حد المحاولات بعد النجاح
  } catch (err) {
    console.error('Error in verifyRegisterOtp:', err.message);
    res.status(500).send('خطأ في الخادم');
  }
};



  
// تسجيل الدخول باستخدام رقم الجوال وإرسال رمز التحقق
exports.loginWithPhone = async (req, res) => {
  const { error } = loginPhoneSchema.validate(req.body);
  if (error) {
    return res.status(400).json({ message: error.details[0].message });
  }

  const { phone, recaptchaToken } = req.body; // إضافة recaptchaToken

  try {
    // التحقق من reCAPTCHA token
    const secretKey = process.env.RECAPTCHA_SECRET_KEY;
    const verificationUrl = `https://www.google.com/recaptcha/api/siteverify?secret=${secretKey}&response=${recaptchaToken}`;
    const recaptchaResponse = await axios.post(verificationUrl);

    // إضافة تتبع للتأكد من الاستجابة
    console.log('reCAPTCHA response:', recaptchaResponse.data);

    if (!recaptchaResponse.data.success || recaptchaResponse.data.score < 0.5) {
      return res.status(400).json({ message: 'فشل التحقق من reCAPTCHA. يرجى المحاولة مرة أخرى.' });
    }

    let user = await User.findOne({ phone });
    if (!user) {
      return res.status(400).json({ message: 'الحساب غير موجود' });
    }

    // إرسال رمز التحقق وطباعته في الـ console.log
    const verificationCode = generateVerificationCode();
    user.phoneVerificationCode = verificationCode;
    user.codeCreatedAt = Date.now(); // حفظ وقت إنشاء رمز التحقق
    await user.save();

    console.log(`رمز التحقق لتسجيل الدخول هو: ${verificationCode}`);
    res.status(200).json({ message: 'تم إرسال رمز التحقق إلى الجوال.' });

    // حذف رمز التحقق بعد مرور 5 دقائق
    setTimeout(async () => {
      if (user.phoneVerificationCode === verificationCode) {
        user.phoneVerificationCode = null;
        await user.save();
        console.log('تم حذف رمز التحقق بعد مرور 5 دقائق.');
      }
    }, 5 * 60 * 1000); // 5 دقائق
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
};


exports.verifyLoginOtp = async (req, res) => {
  const { error } = otpVerifySchema.validate(req.body);
  if (error) {
    return res.status(400).json({ message: error.details[0].message });
  }

  const { phone, verificationCode } = req.body;
  const ipAddr = req.ip; // الحصول على عنوان IP الخاص بالمستخدم لتحديد المحاولات الفاشلة

  try {
    // التحقق من عدد المحاولات الفاشلة من نفس IP
    const rateLimiterRes = await limiter.get(ipAddr);
    if (rateLimiterRes !== null && rateLimiterRes.consumedPoints >= maxWrongAttemptsByIP) {
      const retrySecs = Math.round(rateLimiterRes.msBeforeNext / 1000) || 1;
      return res.status(429).json({ message: `تم تجاوز الحد الأقصى للمحاولات. حاول مرة أخرى بعد ${retrySecs} ثانية.` });
    }

    // البحث عن المستخدم باستخدام رقم الجوال
    const user = await User.findOne({ phone });
    if (!user) {
      return res.status(400).json({ message: 'User not found' });
    }

    // التحقق من انتهاء صلاحية رمز التحقق (بعد مرور 5 دقائق)
    const timePassed = Date.now() - user.codeCreatedAt;
    if (timePassed > 5 * 60 * 1000) {
      return res.status(400).json({ message: 'رمز التحقق منتهي الصلاحية. يرجى إعادة الإرسال.' });
    }

    // التحقق من أن رمز التحقق صحيح
    if (user.phoneVerificationCode !== verificationCode) {
      // إذا كان رمز التحقق غير صحيح، نسجل المحاولة الفاشلة
      await limiter.consume(ipAddr); // تسجيل المحاولة الفاشلة
      return res.status(400).json({ message: 'رمز التحقق أو رقم الجوال غير صحيح.' });
    }

    // مسح رمز التحقق بعد التحقق بنجاح
    user.phoneVerificationCode = null;
    await user.save();

    // إعداد بيانات الـ JWT
    const payload = {
      id: user.id,
      accountType: user.accountType
    };

    // توقيع التوكن JWT وإرساله
    jwt.sign(
      payload,
      process.env.JWT_SECRET,
      { expiresIn: 3600 }, // صلاحية التوكن لمدة ساعة واحدة
      (err, accessToken) => {
        if (err) throw err;
        res.json({ accessToken });
      }
    );

    // إعادة تعيين حد المحاولات بعد النجاح
    await limiter.delete(ipAddr); // مسح الحد بعد النجاح
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

  const { email, password, recaptchaToken } = req.body; // إضافة recaptchaToken

  try {
    // التحقق من reCAPTCHA token
    const secretKey = process.env.RECAPTCHA_SECRET_KEY;
    const verificationUrl = `https://www.google.com/recaptcha/api/siteverify?secret=${secretKey}&response=${recaptchaToken}`;
    const recaptchaResponse = await axios.post(verificationUrl);

    // إضافة تتبع للتأكد من الاستجابة
    console.log('reCAPTCHA response:', recaptchaResponse.data);

    if (!recaptchaResponse.data.success || recaptchaResponse.data.score < 0.5) {
      return res.status(400).json({ message: 'فشل التحقق من reCAPTCHA. يرجى المحاولة مرة أخرى.' });
    }

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
    const { phone, recaptchaToken } = req.body; // إضافة recaptchaToken
  
    try {
      // التحقق من reCAPTCHA token
      const secretKey = process.env.RECAPTCHA_SECRET_KEY;
      const verificationUrl = `https://www.google.com/recaptcha/api/siteverify?secret=${secretKey}&response=${recaptchaToken}`;
      const recaptchaResponse = await axios.post(verificationUrl);
  
      // إضافة تتبع للتأكد من الاستجابة
      console.log('reCAPTCHA response:', recaptchaResponse.data);
  
      // تحقق من نجاح التحقق ودرجة score (في حالة reCAPTCHA v3)
      if (!recaptchaResponse.data.success || recaptchaResponse.data.score < 0.5) {
        return res.status(400).json({ message: 'فشل التحقق من reCAPTCHA. يرجى المحاولة مرة أخرى.' });
      }
  
      // البحث عن المستخدم باستخدام الهاتف
      let user = await User.findOne({ phone });
      if (!user) {
        return res.status(404).json({ message: 'User not found...' });
      }
  
      // إنشاء رمز التحقق وتخزينه
      const verificationCode = generateVerificationCode();
      user.phoneVerificationCode = verificationCode;
      user.codeCreatedAt = Date.now(); // تخزين وقت إنشاء الكود
  
      await user.save();
      console.log(`رمز التحقق لاستعادة كلمة المرور هو: ${verificationCode}`);
  
      res.status(200).json({ message: 'تم إرسال رمز التحقق.' });
  
      // حذف رمز التحقق بعد مرور 5 دقائق
      setTimeout(async () => {
        if (user.phoneVerificationCode === verificationCode) {
          user.phoneVerificationCode = null;
          await user.save();
          console.log('تم حذف رمز التحقق بعد مرور 5 دقائق.');
        }
      }, 5 * 60 * 1000); // 5 دقائق
  
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
  const ipAddr = req.ip; // استخدام عنوان الـ IP للمستخدم لتحديد المحاولات الفاشلة

  try {
    // التحقق من عدد المحاولات الفاشلة من نفس IP
    const rateLimiterRes = await limiter.get(ipAddr);
    if (rateLimiterRes !== null && rateLimiterRes.consumedPoints >= maxWrongAttemptsByIP) {
      const retrySecs = Math.round(rateLimiterRes.msBeforeNext / 1000) || 1;
      return res.status(429).json({ message: `تم تجاوز الحد الأقصى للمحاولات. حاول مرة أخرى بعد ${retrySecs} ثانية.` });
    }

    // البحث عن المستخدم بناءً على رقم الهاتف
    let user = await User.findOne({ phone });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // التحقق من انتهاء صلاحية رمز التحقق (5 دقائق)
    const timePassed = Date.now() - user.codeCreatedAt;
    if (timePassed > 5 * 60 * 1000) {
      return res.status(400).json({ message: 'رمز التحقق منتهي الصلاحية. يرجى إعادة الإرسال.' });
    }

    // التحقق من صحة رمز التحقق
    if (user.phoneVerificationCode !== verificationCode) {
      await limiter.consume(ipAddr); // تسجيل المحاولة الفاشلة
      return res.status(400).json({ message: 'رمز التحقق غير صحيح.' });
    }

    // تشفير كلمة المرور الجديدة
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;
    user.phoneVerificationCode = null; // مسح رمز التحقق بعد استخدامه

    // حفظ المستخدم
    await user.save();

    res.status(200).json({ message: 'تم إعادة تعيين كلمة المرور بنجاح.' });

    // إعادة تعيين حد المحاولات بعد النجاح
    await limiter.delete(ipAddr);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('خطاء في الخادم');
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
  



  // تغير كلمة المرور 

  // تحديث كلمة المرور
exports.changePassword = async (req, res) => {
  // التحقق من صحة البيانات المدخلة باستخدام Joi
// مخطط التحقق من كلمة المرور القديمة والجديدة
const schema = Joi.object({
  oldPassword: Joi.string()
    .min(1).messages({ 'string.min': 'كلمة المرور القديمة يجب أن تحتوي على حرف واحد على الأقل' })
    .max(50).messages({ 'string.max': 'كلمة المرور القديمة يجب ألا تتجاوز 50 حرفًا' })
    .required().messages({ 'any.required': 'حقل كلمة المرور القديمة مطلوب' }),

  newPassword: Joi.string()
    .min(8).messages({ 'string.min': 'كلمة المرور الجديدة يجب أن تحتوي على 8 أحرف على الأقل' })
    .max(30).messages({ 'string.max': 'كلمة المرور الجديدة يجب ألا تتجاوز 30 حرفًا' })
    .pattern(/[a-z]/, { name: 'lowercase' }).messages({ 'string.pattern.name': 'كلمة المرور الجديدة يجب أن تحتوي على حرف صغير واحد على الأقل' })
    .pattern(/[A-Z]/, { name: 'uppercase' }).messages({ 'string.pattern.name': 'كلمة المرور الجديدة يجب أن تحتوي على حرف كبير واحد على الأقل' })
    .pattern(/[0-9]/, { name: 'numeric' }).messages({ 'string.pattern.name': 'كلمة المرور الجديدة يجب أن تحتوي على رقم واحد على الأقل' })
    .pattern(/[@$!%*?&#]/, { name: 'symbol' }).messages({ 'string.pattern.name': 'كلمة المرور الجديدة يجب أن تحتوي على رمز خاص واحد على الأقل' })
    .required().messages({ 'any.required': 'حقل كلمة المرور الجديدة مطلوب' })
});

  const { error } = schema.validate(req.body);
  if (error) {
    return res.status(400).json({ message: error.details[0].message });
  }

  const { oldPassword, newPassword } = req.body;

  try {
    // الحصول على معرف المستخدم من التوكن
    const userId = req.user.id;

    // البحث عن المستخدم في قاعدة البيانات
    let user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // التحقق من أن كلمة المرور القديمة صحيحة
    const isMatch = await bcrypt.compare(oldPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'كلمة المرور القديمة غير صحيحة' });
    }

    // تشفير كلمة المرور الجديدة
    const salt = await bcrypt.genSalt(10);
    const hashedNewPassword = await bcrypt.hash(newPassword, salt);

    // تحديث كلمة المرور في قاعدة البيانات
    user.password = hashedNewPassword;
    await user.save();

    res.status(200).json({ message: 'تم تغيير كلمة المرور بنجاح' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('خطاء في الخادم');
  }
};





// اده لارسال رسايل استعادة كلمة المرور لايميل المستخدم 

const nodemailer = require('nodemailer');

// إعداد nodemailer لإرسال البريد الإلكتروني باستخدام معلومات الاستضافة
const transporter = nodemailer.createTransport({
  host: 'mail.qorhod.com', // استبدل بـ SMTP host الخاص بالاستضافة
  port: 465, // المنفذ المخصص لـ SSL
  secure: true, // true للاتصال عبر SSL
  auth: {
    user: 'info@qorhod.com', // البريد الإلكتروني الذي أنشأته
    pass: 'Abdulaziz123' // كلمة المرور الخاصة بالبريد الإلكتروني
  }
});
// وظيفة لإرسال البريد الإلكتروني لاستعادة كلمة المرور
// وظيفة لإرسال البريد الإلكتروني لاستعادة كلمة المرور مع تصميم HTML
function sendResetEmail(userEmail, resetToken) {
    const resetLink = `http://localhost:3030/reset-password-email/${resetToken}`;
  
    const mailOptions = {
      from: 'info@qorhod.com', // البريد الإلكتروني الخاص بك من الاستضافة
      to: userEmail,
      subject: 'استعادة كلمة المرور',
      // استخدام HTML لتخصيص التصميم
      html: `
        <div style="font-family: Arial, sans-serif; text-align: center; color: #333;">
          <h1 style="color: #4CAF50;">استعادة كلمة المرور</h1>
          <p>لإعادة تعيين كلمة المرور الخاصة بك، انقر على الزر أدناه:</p>
          <a href="${resetLink}" style="background-color: #4CAF50; color: white; padding: 10px 20px; text-decoration: none; font-size: 16px; border-radius: 5px;">إعادة تعيين كلمة المرور</a>
          <p style="margin-top: 20px;">إذا لم تطلب إعادة تعيين كلمة المرور، يمكنك تجاهل هذا البريد.</p>
        </div>
      `,
    };
  
    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        return console.log(error);
      }
      console.log('Email sent: ' + info.response);
    });
  }
  

// //اده لارسال رسايل استعادة كلمة المرور لايميل المستخدم ////
// إرسال رسائل استعادة كلمة المرور إلى إيميل المستخدم
exports.recoverPasswordByEmail = async (req, res) => {
    const { email, recaptchaToken } = req.body; // إضافة recaptchaToken
  
    try {
      // التحقق من reCAPTCHA token
      const secretKey = process.env.RECAPTCHA_SECRET_KEY;
      const verificationUrl = `https://www.google.com/recaptcha/api/siteverify?secret=${secretKey}&response=${recaptchaToken}`;
      const recaptchaResponse = await axios.post(verificationUrl);
  
      // إضافة تتبع للتأكد من الاستجابة
      console.log('reCAPTCHA response:', recaptchaResponse.data);
  
      // تحقق من نجاح التحقق ودرجة score (في حالة reCAPTCHA v3)
      if (!recaptchaResponse.data.success || recaptchaResponse.data.score < 0.5) {
        return res.status(400).json({ message: 'فشل التحقق من reCAPTCHA. يرجى المحاولة مرة أخرى.' });
      }
  
      // البحث عن المستخدم باستخدام البريد الإلكتروني
      let user = await User.findOne({ email });
      if (!user) {
        return res.status(404).json({ message: 'User not found..' });
      }
  
      // إنشاء رمز إعادة تعيين كلمة المرور
      const resetToken = jwt.sign({ id: user.id }, process.env.JWT_SECRET, { expiresIn: '15m' });
  
      // تخزين التوكن وتاريخ انتهاءه في قاعدة البيانات
      user.passwordResetToken = resetToken;
      user.passwordResetTokenExpires = Date.now() + 15 * 60 * 1000; // 15 دقيقة
      await user.save();
  
      // إرسال البريد الإلكتروني مع رابط إعادة تعيين كلمة المرور
      sendResetEmail(user.email, resetToken);
  
      res.status(200).json({ message: 'تم إرسال رابط استعادة كلمة المرور إلى البريد الإلكتروني.' });
    } catch (err) {
      console.error(err.message);
      res.status(500).send('خطأ في الخادم');
    }
  };
  

  
// إنشاء مخطط Joi للتحقق من كلمة المرور الجديدة
const passwordSchema = Joi.object({
    newPassword: Joi.string()
      .min(8).message('كلمة المرور يجب أن تحتوي على 8 أحرف على الأقل')
      .max(30).message('كلمة المرور يجب ألا تتجاوز 30 حرفًا')
      .pattern(/[a-z]/, 'lowercase').message('كلمة المرور يجب أن تحتوي على حرف صغير واحد على الأقل')
      .pattern(/[A-Z]/, 'uppercase').message('كلمة المرور يجب أن تحتوي على حرف كبير واحد على الأقل')
      .pattern(/[0-9]/, 'numeric').message('كلمة المرور يجب أن تحتوي على رقم واحد على الأقل')
      .pattern(/[@$!%*?&#]/, 'symbol').message('كلمة المرور يجب أن تحتوي على رمز خاص واحد على الأقل')
      .required(),
  });
  

  exports.resetPasswordByEmail = async (req, res) => {
    const { token, newPassword } = req.body;
  
    // التحقق من المدخلات باستخدام مخطط Joi
    const { error } = passwordSchema.validate({ newPassword });
    if (error) {
      return res.status(400).json({ message: error.details[0].message });
    }
  
    try {
      // التحقق من صلاحية التوكن
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
  
      // البحث عن المستخدم بناءً على معرف المستخدم المخزن في التوكن
      let user = await User.findById(decoded.id);
      if (!user) {
        return res.status(404).json({ message: 'User not found.' });
      }
  
      // تشفير كلمة المرور الجديدة
      const hashedPassword = await bcrypt.hash(newPassword, 10);
      user.password = hashedPassword;
  
      // حفظ كلمة المرور الجديدة
      await user.save();
  
      res.status(200).json({ message: 'تم إعادة تعيين كلمة المرور بنجاح.' });
    } catch (err) {
      console.error(err.message);
      res.status(500).send('خطأ في الخادم');
    }
  };