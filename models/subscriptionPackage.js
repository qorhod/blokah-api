// models/subscriptionPackage.js
// سكيمة مستقلة تحفظ «الباقة + الدومين» وتربطها بالمستخدم

const mongoose = require('mongoose');

const subscriptionPackageSchema = new mongoose.Schema(
  {
    /*--------------------------------------------------
      🔗 user
      معرّف المستخدم (User._id) صاحب هذه الباقة.
      - ObjectId لأننا نربطه بموديل آخر.
      - ref:'User' يسمح لنا باستخدام populate().
    --------------------------------------------------*/
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },

    /*--------------------------------------------------
      📦 subscription
      كائن يصف تفاصيل الاشتراك المالي والزمني.
    --------------------------------------------------*/
    subscription: {
      /* الخطة: نصف سنوي أو سنوي */
      plan: { type: String, enum: ['half_year', 'year'], required: true },

      /* السعر الإجمالي للباقة (ريال) */
      price: { type: Number, required: true },

      /* تاريخ تفعيل الباقة فعليًا */
      startDate: { type: Date, default: Date.now },

      /* تاريخ نهاية الاشتراك المدفوع */
      endDate: { type: Date, required: true },

      /* نهاية العقد القانوني (قد يختلف عن endDate) */
      contractEndDate: { type: Date, required: true },

      /* حالة الاشتراك (نشط / موقَّف يدويًا) */
      isActive: { type: Boolean, default: true },
    },

    /*--------------------------------------------------
      🌐 domainInfo
      تفاصيل النطاق المُدار ضمن الباقة.
    --------------------------------------------------*/
    domainInfo: {
      /* رابط الموقع أو الدومين الرئيسي */
      websiteUrl: { type: String, required: true, unique: true },

      /* متى حُجز النطاق أول مرة */
      registeredAt: { type: Date, default: Date.now },

      /* متى تنتهي صلاحية الدومين الحالي */
      expiresAt: { type: Date, required: true },

      /* مدة التسجيل بالأشهر (٦ أو ١٢ عادةً) */
      durationMonths: { type: Number, required: true },

      /* نوع شهادة SSL المُستخدمة (افتراضي Cloudflare) */
      sslType: { type: String, default: 'Cloudflare Universal' },

      /* هل يُجدَّد الدومين تلقائيًا مع الاشتراك؟ */
      autoRenew: { type: Boolean, default: true },
    },
  },
  {
    /* timestamps يُضيف createdAt و updatedAt تلقائيًا */
    timestamps: true,
  }
);

const SubscriptionPackage = mongoose.model(
    'SubscriptionPackage',
    subscriptionPackageSchema
  );
  
  module.exports = SubscriptionPackage;
  
