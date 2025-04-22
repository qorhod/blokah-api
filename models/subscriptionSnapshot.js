

// تاريخ العميل 

// models/subscriptionSnapshot.js
const mongoose = require('mongoose');

const snapshotSchema = new mongoose.Schema(
  {
    /* صاحب اللقطة */
    user:    { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },

    /* المعرِّف الحالي للباقة (اختياري؛ يساعدك على ربط السجل بالباقة الحيّة) */
    package: { type: mongoose.Schema.Types.ObjectId, ref: 'SubscriptionPackage' },

    /* نوع الحدث الذي أنشأ هذه اللقطة */
    eventType: {                             // مثال: CREATED | RENEWED | UPGRADED
      type: String,
      enum: ['CREATED', 'RENEWED', 'UPGRADED'],
      required: true,
    },

    /* نسخة مجمَّدة من بيانات الاشتراك */
    subscription: {
      plan:            String,
      price:           Number,
      startDate:       Date,
      endDate:         Date,
      contractEndDate: Date,
      isActive:        Boolean,
    },

    /* نسخة مجمَّدة من بيانات الدومين */
    domainInfo: {
      websiteUrl:     String,
      registeredAt:   Date,
      expiresAt:      Date,
      durationMonths: Number,
      sslType:        String,
      autoRenew:      Boolean,
    },
  },
  { timestamps: true }   // createdAt = تاريخ أخذ اللقطة
);
const SubscriptionSnapshot = mongoose.model(
    'SubscriptionSnapshot',
    snapshotSchema
  );
  
  module.exports = SubscriptionSnapshot;