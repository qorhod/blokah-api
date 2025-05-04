// const User = require('../../models/user');




// exports.getDashboard = (req, res) => {
//     res.json({ message: 'Welcome to admin dashboard' });
//   };



//   // تعديل بينات المستخدمين


//   exports.updateUser = async (req, res) => {
//     console.log('Received request to update user');
//     const { id } = req.params;
//     const { username, accountType } = req.body;
  
//     try {
//       const user = await User.findById(id);
//       if (!user) {
//         console.log('User not found');
//         return res.status(404).json({ msg: 'User not found' });
//       }
  
//       user.username = username || user.username;
//       user.accountType = accountType || user.accountType;
  
//       await user.save();
//       console.log('User updated successfully');
//       res.json(user);
//     } catch (err) {
//       console.error('Error in updateUser:', err.message);
//       res.status(500).send('Server error');
//     }
//   };
  
  


//   exports.getUsers = async (req, res) => {
//     try {
//       const users = await User.find();
//       res.json(users);
//     } catch (err) {
//       console.error(err.message);
//       res.status(500).send('Server error');
//     }
//   };







//   exports.deleteUser = async (req, res) => {
//     const { id } = req.params;
  
//     try {
//       console.log(`Attempting to delete user with id: ${id}`);
//       const user = await User.findById(id);
//       if (!user) {
//         console.log('User not found');
//         return res.status(404).json({ msg: 'User not found' });
//       }
  
//       await User.findByIdAndDelete(id);
//       console.log('User removed successfully');
//       res.json({ msg: 'User removed' });
//     } catch (err) {
//       console.error(`Error occurred while deleting user: ${err.message}`);
//       res.status(500).send('Server error');
//     }
//   };

// ـ+ـ+ـ

// const bcrypt = require('bcryptjs');
// const User   = require('../../models/user');       // تأكد من المسار

// // POST  /api/admin/users
// exports.createUserSimple = async (req, res) => {
//   try {
//     const {
//       firstName,
//       lastName,
//       email,
//       phone,
//       password,
//       accountType = 'user',
//       websiteUrl = '',
//       domainName = '',
//       companyName = '',   // اسم الشركة الجديد
//     } = req.body;

//     // تحقُّق أساسي من الحقول المطلوبة
//     if (!firstName || !lastName || !email || !phone || !password)
//       return res.status(400).json({ error: 'يرجى تعبئة جميع الحقول الأساسية.' });

//     // منع التكرار في أي من هذه الحقول
//     const duplicate = await User.findOne({
//       $or: [{ email }, { phone }, { websiteUrl }, { domainName }],
//     });
//     if (duplicate)
//       return res.status(400).json({ error: 'المستخدم أو الدومين موجود مسبقًا.' });

//     // تشفير كلمة المرور
//     const hashed = await bcrypt.hash(password, 10);

//     // إنشاء المستخدم
//     const newUser = await User.create({
//       firstName,
//       lastName,
//       email,
//       phone,
//       password: hashed,
//       accountType,
//       websiteUrl,
//       domainName,
//       companyName,
//     });

//     // إزالة كلمة المرور من الاستجابة
//     const { password: _p, ...userWithoutPass } = newUser.toObject();
//     res.status(201).json(userWithoutPass);
//   } catch (err) {
//     console.error('createUserSimple error:', err);
//     res.status(500).json({ error: 'خطأ في السيرفر' });
//   }
// };

// +ـ+ـ+ـ

// controllers/admin/createUserWithPackage.js
const bcrypt                 = require('bcryptjs');
const User                   = require('../../models/user');
const Ad = require('../../models/AdSchema');
const mongoose = require('mongoose');

const SubscriptionPackage    = require('../../models/subscriptionPackage');
const SubscriptionSnapshot   = require('../../models/subscriptionSnapshot'); // 🆕
// const { users, ads } = require('../data/seedData'); // داتا البيانات الفتراضيه 
const seedData = require('../data/seedData');   // ✔️ المسار الصحيح
/*
  POST /api/admin/users-with-package
  body:
  {
    /* ==== بيانات المستخدم ==== * /
    firstName, lastName, email, phone, password,
    accountType?, companyName?,

    /* ==== بيانات الباقة ==== * /
    plan?, price?, startDate?, endDate?, contractEndDate?,
    isActive?,                 // true/false

    /* ==== بيانات الدومين ==== * /
    websiteUrl, sslType?, autoRenew?, durationMonths?,
  }
*/


/**
 *  POST /api/admin/users-with-package
 *  ينشئ مستخدم + باقة اشتراك + لقطة (Snapshot) محفوظة
 */
// exports.createUserWithPackage = async (req, res) => {
//   try {
//     /*────────── 1) تفريغ قيم الـBody ──────────*/
//     const {
//       /* بيانات المستخدم */
//       firstName,
//       lastName,
//       email,
//       phone,
//       password,
//       domainName,                               // يجب أن يكون فريداً
//       accountType   = 'user',
//       companyName   = '',

//       /* بيانات الاشتراك */
//       plan          = 'year',                   // 'half_year' | 'year'
//       price,                                    // إن لم يُرسل نحسبه آلياً
//       startDate:    startBody,
//       endDate:      endBody,
//       contractEndDate,
//       isActive      = true,

//       /* بيانات الدومين */
//       websiteUrl,                               // الدومين الفعلي
//       sslType       = 'Cloudflare Universal',
//       autoRenew     = true,
//       durationMonths,
//     } = req.body;

//     /*────────── 2) تحقّق الحقول الأساسية ──────────*/
//     if (
//       !firstName || !lastName || !email || !phone ||
//       !password  || !domainName || !websiteUrl
//     ) {
//       return res.status(400).json({ error: 'يرجى تعبئة جميع الحقول الأساسية.' });
//     }

//     /*────────── 3) منع التكرار ──────────*/
//     // في users
//     const dupUser = await User.findOne({ $or: [{ email }, { phone }, { domainName }] });
//     if (dupUser) return res.status(400).json({ error: 'المستخدم أو domainName موجود مسبقًا.' });

//     // في الباقات
//     const dupSite = await SubscriptionPackage.findOne({ 'domainInfo.websiteUrl': websiteUrl });
//     if (dupSite) return res.status(400).json({ error: 'هذا الـ websiteUrl مستخدم بالفعل.' });

//     /*────────── 4) إنشاء المستخدم ──────────*/
//     const user = await User.create({
//       firstName,
//       lastName,
//       email,
//       phone,
//       password: await bcrypt.hash(password, 10),
//       accountType,
//       companyName,
//       domainName,
//     });

//     /*────────── 5) حساب التواريخ والقيم الافتراضية ──────────*/
//     const start = startBody ? new Date(startBody) : new Date();

//     const months = durationMonths
//       ? Number(durationMonths)
//       : plan === 'half_year'
//         ? 6
//         : 12;

//     const end = endBody ? new Date(endBody) : new Date(start);
//     if (!endBody) end.setMonth(end.getMonth() + months);

//     const contractEnd = contractEndDate ? new Date(contractEndDate) : end;
//     const finalPrice  = price ?? (plan === 'half_year' ? 600 : 850);

//     /*────────── 6) إنشاء باقة الاشتراك ──────────*/
//     const pkg = await SubscriptionPackage.create({
//       user: user._id,

//       subscription: {
//         plan,
//         price: finalPrice,
//         startDate: start,
//         endDate:   end,
//         contractEndDate: contractEnd,
//         isActive,
//       },

//       domainInfo: {
//         websiteUrl,
//         registeredAt: start,
//         expiresAt:    end,
//         durationMonths: months,
//         sslType,
//         autoRenew,
//       },
//     });

//     /*────────── 7) حفظ لقطة (Snapshot) ──────────*/
//     await SubscriptionSnapshot.create({
//       user:    user._id,
//       package: pkg._id,
//       eventType: 'CREATED',
//       subscription: pkg.subscription.toObject(),
//       domainInfo:   pkg.domainInfo.toObject(),
//     });

//     /*────────── 8) تحضير الرد ──────────*/
//     const { password: _p, ...safeUser } = user.toObject();

//     res.status(201).json({
//       user: safeUser,
//       subscription: {
//         plan,
//         price: finalPrice,
//         startDate: start,
//         endDate: end,
//         contractEndDate: contractEnd,
//         isActive,
//       },
//       domainInfo: {
//         websiteUrl,
//         sslType,
//         expiresAt: end,
//         durationMonths: months,
//         autoRenew,
//       },
//       snapshotSaved: true,
//     });
//   } catch (err) {
//     console.error('createUserWithPackage error:', err);
//     res.status(500).json({ error: 'خطأ في السيرفر' });
//   }
// };





// exports.createUserWithPackage = async (req, res) => {
//   try {
//     /*────────── 1) تفريغ قيم الـBody ──────────*/
//     const {
//       /* بيانات المستخدم */
//       firstName,
//       lastName,
//       email,
//       phone,
//       password,
//       domainName,                               // يجب أن يكون فريداً
//       accountType          = 'user',
//       companyName          = '',

//       /* بيانات الاشتراك */
//       plan                 = 'year',           // 'half_year' | 'year'
//       price,
//       startDate: startBody,
//       endDate:   endBody,
//       contractEndDate,
//       isActive             = true,

//       /* بيانات الدومين */
//       websiteUrl,                               // الدومين الفعلي
//       sslType             = 'Cloudflare Universal',
//       autoRenew           = true,
//       durationMonths,

//       /* الحقل الجديد */
//       scriptNamePaidDomain = '',                // NEW
//     } = req.body;

//     /*────────── 2) تحقّق الحقول الأساسية ──────────*/
//     if (
//       !firstName || !lastName || !email || !phone ||
//       !password  || !domainName || !websiteUrl
//     ) {
//       return res.status(400).json({ error: 'يرجى تعبئة جميع الحقول الأساسية.' });
//     }

//     /*────────── 3) منع التكرار ──────────*/
//     // في users
//     const dupUser = await User.findOne({ $or: [{ email }, { phone }, { domainName }] });
//     if (dupUser) {
//       return res.status(400).json({ error: 'المستخدم أو domainName موجود مسبقًا.' });
//     }

//     // في الباقات
//     const dupSite = await SubscriptionPackage.findOne({ 'domainInfo.websiteUrl': websiteUrl });
//     if (dupSite) {
//       return res.status(400).json({ error: 'هذا الـ websiteUrl مستخدم بالفعل.' });
//     }

//     /*────────── 4) إنشاء المستخدم ──────────*/
//     const user = await User.create({
//       firstName,
//       lastName,
//       email,
//       phone,
//       password: await bcrypt.hash(password, 10),
//       accountType,
//       companyName,
//       domainName,
//       websiteUrl,               // موجود في الـschema
//       scriptNamePaidDomain,     // NEW
//     });

//     /*────────── 5) حساب التواريخ والقيم الافتراضية ──────────*/
//     const start = startBody ? new Date(startBody) : new Date();

//     const months = durationMonths
//       ? Number(durationMonths)
//       : plan === 'half_year'
//         ? 6
//         : 12;

//     const end = endBody ? new Date(endBody) : new Date(start);
//     if (!endBody) end.setMonth(end.getMonth() + months);

//     const contractEnd = contractEndDate ? new Date(contractEndDate) : end;
//     const finalPrice  = price ?? (plan === 'half_year' ? 600 : 850);

//     /*────────── 6) إنشاء باقة الاشتراك ──────────*/
//     const pkg = await SubscriptionPackage.create({
//       user: user._id,

//       subscription: {
//         plan,
//         price: finalPrice,
//         startDate:        start,
//         endDate:          end,
//         contractEndDate:  contractEnd,
//         isActive,
//       },

//       domainInfo: {
//         websiteUrl,
//         registeredAt:     start,
//         expiresAt:        end,
//         durationMonths:   months,
//         sslType,
//         autoRenew,
//         scriptNamePaidDomain,   // NEW (إذا أردت تخزينه داخل domainInfo أيضاً)
//       },
//     });

//     /*────────── 7) حفظ لقطة (Snapshot) ──────────*/
//     await SubscriptionSnapshot.create({
//       user:       user._id,
//       package:    pkg._id,
//       eventType:  'CREATED',
//       subscription: pkg.subscription.toObject(),
//       domainInfo:   pkg.domainInfo.toObject(),
//     });

//     /*────────── 8) تحضير الرد ──────────*/
//     const { password: _p, ...safeUser } = user.toObject();

//     res.status(201).json({
//       user: safeUser,              // يتضمّن scriptNamePaidDomain
//       subscription: pkg.subscription,
//       domainInfo:   pkg.domainInfo,
//       snapshotSaved: true,
//     });
//   } catch (err) {
//     console.error('createUserWithPackage error:', err);
//     res.status(500).json({ error: 'خطأ في السيرفر' });
//   }
// };




// ===========  إنشاء مستخدم + باقة اشتراك  ===========
// exports.createUserWithPackage = async (req, res) => {
//   try {
//     /*────────── 1) تفريغ قيم الـBody ──────────*/
//     const {
//       /* بيانات المستخدم */
//       firstName,
//       lastName,
//       email,
//       phone,
//       password,
//       domainName,                               // يجب أن يكون فريداً
//       accountType          = 'user',
//       companyName          = '',
//       entityType           = '',                // NEW  ←  'فرد' | 'مؤسسة' | 'شركة'

//       /* بيانات الاشتراك */
//       plan                 = 'year',            // 'half_year' | 'year'
//       price,
//       startDate: startBody,
//       endDate:   endBody,
//       contractEndDate,
//       isActive             = true,

//       /* بيانات الدومين */
//       websiteUrl,                               // الدومين الفعلي
//       sslType             = 'Cloudflare Universal',
//       autoRenew           = true,
//       durationMonths,

//       /* الحقل الجديد */
//       scriptNamePaidDomain = '',                // NEW
//     } = req.body;

//     /*────────── 2) تحقّق الحقول الأساسية ──────────*/
//     if (
//       !firstName || !lastName || !email || !phone ||
//       !password  || !domainName || !websiteUrl
//     ) {
//       return res.status(400).json({ error: 'يرجى تعبئة جميع الحقول الأساسية.' });
//     }

//     /*────────── 3) منع التكرار ──────────*/
//     // في users
//     const dupUser = await User.findOne({ $or: [{ email }, { phone }, { domainName }] });
//     if (dupUser) {
//       return res.status(400).json({ error: 'المستخدم أو domainName موجود مسبقًا.' });
//     }

//     // في الباقات
//     const dupSite = await SubscriptionPackage.findOne({ 'domainInfo.websiteUrl': websiteUrl });
//     if (dupSite) {
//       return res.status(400).json({ error: 'هذا الـ websiteUrl مستخدم بالفعل.' });
//     }

//     /*────────── 4) إنشاء المستخدم ──────────*/
//     const user = await User.create({
//       firstName,
//       lastName,
//       email,
//       phone,
//       password: await bcrypt.hash(password, 10),
//       accountType,
//       companyName,
//       entityType,           // NEW
//       domainName,
//       websiteUrl,           // موجود في الـschema
//       scriptNamePaidDomain, // NEW
//     });

//     /*────────── 5) حساب التواريخ والقيم الافتراضية ──────────*/
//     const start = startBody ? new Date(startBody) : new Date();

//     const months = durationMonths
//       ? Number(durationMonths)
//       : plan === 'half_year'
//         ? 6
//         : 12;

//     const end = endBody ? new Date(endBody) : new Date(start);
//     if (!endBody) end.setMonth(end.getMonth() + months);

//     const contractEnd = contractEndDate ? new Date(contractEndDate) : end;
//     const finalPrice  = price ?? (plan === 'half_year' ? 600 : 850);

//     /*────────── 6) إنشاء باقة الاشتراك ──────────*/
//     const pkg = await SubscriptionPackage.create({
//       user: user._id,

//       subscription: {
//         plan,
//         price: finalPrice,
//         startDate:        start,
//         endDate:          end,
//         contractEndDate:  contractEnd,
//         isActive,
//       },

//       domainInfo: {
//         websiteUrl,
//         registeredAt:     start,
//         expiresAt:        end,
//         durationMonths:   months,
//         sslType,
//         autoRenew,
//         scriptNamePaidDomain,   // NEW (إذا أردت تخزينه داخل domainInfo أيضاً)
//       },
//     });

//     /*────────── 7) حفظ لقطة (Snapshot) ──────────*/
//     await SubscriptionSnapshot.create({
//       user:       user._id,
//       package:    pkg._id,
//       eventType:  'CREATED',
//       subscription: pkg.subscription.toObject(),
//       domainInfo:   pkg.domainInfo.toObject(),
//     });

//     /*────────── 8) تحضير الرد ──────────*/
//     const { password: _p, ...safeUser } = user.toObject();

//     res.status(201).json({
//       user: safeUser,              // يتضمّن entityType + scriptNamePaidDomain
//       subscription: pkg.subscription,
//       domainInfo:   pkg.domainInfo,
//       snapshotSaved: true,
//     });
//   } catch (err) {
//     console.error('createUserWithPackage error:', err);
//     res.status(500).json({ error: 'خطأ في السيرفر' });
//   }
// };
exports.createUserWithPackage = async (req, res) => {
  try {
    /*────────── 1) تفريغ قيم الـBody ──────────*/
    const {
      /* بيانات المستخدم */
      firstName,
      lastName,
      email,
      phone,
      password,
      domainName,                               // يجب أن يكون فريداً
      accountType          = 'user',
      companyName          = '',
      entityType           = '',                // NEW  ←  'فرد' | 'مؤسسة' | 'شركة'

      /* بيانات الاشتراك */
      plan                 = 'year',            // 'half_year' | 'year'
      price,
      startDate: startBody,
      endDate:   endBody,
      contractEndDate,
      isActive             = true,

      /* بيانات الدومين */
      websiteUrl,                               // الدومين الفعلي
      sslType             = 'Cloudflare Universal',
      autoRenew           = true,
      durationMonths,

      /* الحقل الجديد */
      scriptNamePaidDomain = '',                // NEW
    } = req.body;

    /*────────── 2) تحقّق الحقول الأساسية ──────────*/
    if (
      !firstName || !lastName || !email || !phone ||
      !password  || !domainName || !websiteUrl
    ) {
      return res.status(400).json({ error: 'يرجى تعبئة جميع الحقول الأساسية.' });
    }

    /*────────── 3) منع التكرار ──────────*/
    // التحقق من البريد أو الدومين أو الهاتف
    const dupUser = await User.findOne({ $or: [{ email }, { phone }, { domainName }] });
    if (dupUser) {
      if (dupUser.email === email)      return res.status(400).json({ error: 'البريد الإلكتروني مستخدم مسبقًا.' });
      if (dupUser.phone === phone)      return res.status(400).json({ error: 'رقم الجوال مستخدم مسبقًا.' });
      if (dupUser.domainName === domainName)
        return res.status(400).json({ error: 'اسم الدومين مستخدم مسبقًا.' });
    }

    // التحقق من websiteUrl في الباقات
    const dupSite = await SubscriptionPackage.findOne({ 'domainInfo.websiteUrl': websiteUrl });
    if (dupSite) {
      return res.status(400).json({ error: 'هذا الـ websiteUrl مستخدم بالفعل.' });
    }

    /*────────── 4) إنشاء المستخدم ──────────*/
    const user = await User.create({
      firstName,
      lastName,
      email,
      phone,
      password: await bcrypt.hash(password, 10),
      accountType,
      companyName,
      entityType,           // NEW
      domainName,
      websiteUrl,           // موجود في الـschema
      scriptNamePaidDomain, // NEW
    });

    /*────────── 5) حساب التواريخ والقيم الافتراضية ──────────*/
    const start = startBody ? new Date(startBody) : new Date();

    const months = durationMonths
      ? Number(durationMonths)
      : plan === 'half_year'
        ? 6
        : 12;

    const end = endBody ? new Date(endBody) : new Date(start);
    if (!endBody) end.setMonth(end.getMonth() + months);

    const contractEnd = contractEndDate ? new Date(contractEndDate) : end;
    const finalPrice  = price ?? (plan === 'half_year' ? 600 : 850);

    /*────────── 6) إنشاء باقة الاشتراك ──────────*/
    const pkg = await SubscriptionPackage.create({
      user: user._id,

      subscription: {
        plan,
        price: finalPrice,
        startDate:        start,
        endDate:          end,
        contractEndDate:  contractEnd,
        isActive,
      },

      domainInfo: {
        websiteUrl,
        registeredAt:     start,
        expiresAt:        end,
        durationMonths:   months,
        sslType,
        autoRenew,
        scriptNamePaidDomain,   // NEW (إذا أردت تخزينه داخل domainInfo أيضاً)
      },
    });

    /*────────── 7) حفظ لقطة (Snapshot) ──────────*/
    await SubscriptionSnapshot.create({
      user:       user._id,
      package:    pkg._id,
      eventType:  'CREATED',
      subscription: pkg.subscription.toObject(),
      domainInfo:   pkg.domainInfo.toObject(),
    });

    /*────────── 8) تحضير الرد ──────────*/
    const { password: _p, ...safeUser } = user.toObject();

    res.status(201).json({
      user: safeUser,              // يتضمّن entityType + scriptNamePaidDomain
      subscription: pkg.subscription,
      domainInfo:   pkg.domainInfo,
      snapshotSaved: true,
    });
  } catch (err) {
    console.error('createUserWithPackage error:', err);

    // معالجة خطأ فهرس فريد (MongoError code 11000)
    if (err.code === 11000) {
      const field = Object.keys(err.keyPattern || {})[0];
      const msg   = field === 'phone'
        ? 'رقم الجوال مستخدم مسبقًا.'
        : field === 'email'
          ? 'البريد الإلكتروني مستخدم مسبقًا.'
          : 'قيمة مكرّرة غير مسموح بها.';
      return res.status(400).json({ error: msg });
    }

    res.status(500).json({ error: 'خطأ في السيرفر' });
  }
};




// انشا البيانات الافتراضيه 




// POST /api/seed/run

// ───── POST /api/seed/run ────────────────────────────────
/**
 * • يتوقّع وجود المستخدم مسبقًا (لا ينشئ مستخدمين جُدد مطلقًا)
 * • يحدِّث بياناته إن وُجدت في seedData
 * • يربط جميع الإعلانات في seedData بالمستخدم المرسَل في Body
 */


  
/**
 * POST /api/seed/:userId
 * يدمج البيانات الافتراضية في مستخدم قائم ثم يزرع الإعلانات ويربطها به
 */

  // exports.runSeed = async (req, res, next) => {
  //   const { userId } = req.params;
  //   if (!mongoose.Types.ObjectId.isValid(userId)) {
  //     return res.status(400).json({ ok: false, message: 'معرّف المستخدم غير صالح' });
  //   }
  
  //   const session = await mongoose.startSession();
  //   session.startTransaction();
  //   try {
  //     /*────────────────── جلب المستخدم ──────────────────*/
  //     const user = await User.findById(userId).session(session);
  //     if (!user) {
  //       return res.status(404).json({ ok: false, message: 'المستخدم غير موجود' });
  //     }
  
  //     /*────────────── دالة دمج بدون lodash ──────────────*/
  //     const deepMergeIfEmpty = (target, source) => {
  //       for (const key of Object.keys(source)) {
  //         const val = source[key];
  
  //         // كائن متداخل
  //         if (val && typeof val === 'object' && !Array.isArray(val)) {
  //           if (!target[key]) target[key] = {};
  //           deepMergeIfEmpty(target[key], val);
  //           continue;
  //         }
  
  //         // مصفوفة
  //         if (Array.isArray(val)) {
  //           if (!target[key] || target[key].length === 0) target[key] = val;
  //           continue;
  //         }
  
  //         // قيمة بدائية
  //         if (
  //           target[key] === undefined ||
  //           target[key] === null ||
  //           target[key] === ''
  //         ) {
  //           target[key] = val;
  //         }
  //       }
  //     };
  
  //     /*────────────────── دمج الحقول ───────────────────*/
  //     const defaultUser = seedData.users[0];
  //     deepMergeIfEmpty(user, defaultUser);
  //     await user.save({ session });
  
  //     /*────────────────── إنشاء الإعلانات ──────────────*/
  //     const adsTemplate = seedData.ads;
  //     const bulkOps = adsTemplate.map((a) => ({
  //       updateOne: {
  //         filter: { adNumber: a.adNumber },
  //         update: { $setOnInsert: { ...a, user: user._id } },
  //         upsert: true
  //       }
  //     }));
  //     await Ad.bulkWrite(bulkOps, { session });
  
  //     /*────────────────── إنهاء المعاملة ───────────────*/
  //     await session.commitTransaction();
  //     res.status(200).json({
  //       ok: true,
  //       message: 'تم تحديث المستخدم وإضافة الإعلانات بنجاح',
  //       userId: user._id,
  //       adsInsertedOrIgnored: bulkOps.length
  //     });
  //   } catch (err) {
  //     await session.abortTransaction();
  //     next(err);
  //   } finally {
  //     session.endSession();
  //   }
  // };
  




  exports.runSeed = async (req, res, next) => {
    const { userId } = req.params;
  
    // 1) تحقُّق من صحة المعرّف
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ ok: false, message: 'معرّف المستخدم غير صالح' });
    }
  
    const session = await mongoose.startSession();
    session.startTransaction();
  
    try {
      /*────────────────── جلب المستخدم ──────────────────*/
      const user = await User.findById(userId).session(session);
      if (!user) {
        return res.status(404).json({ ok: false, message: 'المستخدم غير موجود' });
      }
  
      /*────────────── دالة دمج بدون lodash ──────────────*/
      const deepMergeIfEmpty = (target, source) => {
        for (const key of Object.keys(source)) {
          const val = source[key];
  
          // كائن متداخل
          if (val && typeof val === 'object' && !Array.isArray(val)) {
            if (!target[key]) target[key] = {};
            deepMergeIfEmpty(target[key], val);
            continue;
          }
  
          // مصفوفة
          if (Array.isArray(val)) {
            if (!target[key] || target[key].length === 0) target[key] = val;
            continue;
          }
  
          // قيمة بدائية
          if (target[key] === undefined || target[key] === null || target[key] === '') {
            target[key] = val;
          }
        }
      };
  
      /*────────────────── دمج الحقول ───────────────────*/
      const defaultUser = seedData.users[0];
      deepMergeIfEmpty(user, defaultUser);
      await user.save({ session });
  
      /*────────────────── إنهاء المعاملة ───────────────*/
      await session.commitTransaction();
      res.status(200).json({
        ok: true,
        message: 'تم تحديث بيانات المستخدم بنجاح',
        userId: user._id
      });
    } catch (err) {
      await session.abortTransaction();
      next(err);
    } finally {
      session.endSession();
    }
  };
  