const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  firstName: {
    type: String,
    required: true
  },
  lastName: {
    type: String,
    required: true
  },
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
    type: String, 
    default: null
  },
  isPhoneVerified: {
    type: Boolean,  
    default: false
  },

  codeCreatedAt: {  // أضف هذا الحقل لتتبع وقت إنشاء رمز التحقق
    type: Date,
    default: null
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  ads: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Ad' 
    }
  ],
  
  // الحقول الجديدة للمعلومات الأساسية للموقع
  companyName: {
    type: String,
    required: false
  },
  domainName: {
    type: String,
    required: false,
    unique: true
  },
  entityType: {
    type: String,
    enum: ['فرد', 'مؤسسة', 'شركة'], 
    required: false
  },


  // الحقل الجديد لإضافة رابط الشعار
  logoUrl: {
    type: String,
    required: false, // ليس إجباريًا
    default: null    // القيمة الافتراضية
  },




                // حقل بيانات موقع الويب
                // websiteData: {
                  homepage: {
                    header: {
                      type: String, // مثل عنوان رئيسي
                      required: false
                    },
                    subHeader: {
                      type: String, // وصف إضافي للصفحة
                      required: false
                    }
                  },

                  
                  socialMedia: {
                    phoneNumber: {
                      type: String,
                      required: false
                    },
                    whatsappNumber: {
                      type: String,
                      required: false
                    },
                    Facebook: {
                      type: String,
                      required: false
                    },
                    Twitter: {
                      type: String,
                      required: false
                    },
                    Instagram: {
                      type: String,
                      required: false
                    },
                    LinkedIn: {
                      type: String,
                      required: false
                    },
                    YouTube: {
                      type: String,
                      required: false
                    },
                    Snapchat: {
                      type: String,
                      required: false
                    },
                    Pinterest: {
                      type: String,
                      required: false
                    },
                    TikTok: {
                      type: String,
                      required: false
                    },
                    Telegram: {
                      type: String,
                      required: false
                    }
                  },
                  aboutUs: {
                    description: {
                      type: String, // نص الوصف الخاص بـ"نبذة عنا"
                      required: false
                    },
                    mission: {
                      type: String, // الرسالة
                      required: false
                    },
                    vision: {
                      type: String, // الرؤية
                      required: false
                    }
                  }
                // }





});

const User = mongoose.model('User', userSchema);

module.exports = User;
