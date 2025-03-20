// const mongoose = require('mongoose');

// const userSchema = new mongoose.Schema({
//   firstName: {
//     type: String,
//     required: true
//   },
//   lastName: {
//     type: String,
//     required: true
//   },
//   email: {
//     type: String,
//     required: true,
//     unique: true
//   },
//   phone: {
//     type: String,
//     required: true,
//     unique: true
//   },
//   password: {
//     type: String,
//     required: true
//   },
//   accountType: {
//     type: String,
//     enum: ['admin', 'user', 'manager'],
//     default: 'user'
//   },
//   phoneVerificationCode: {
//     type: String, 
//     default: null
//   },
//   isPhoneVerified: {
//     type: Boolean,  
//     default: false
//   },

//   codeCreatedAt: {  // أضف هذا الحقل لتتبع وقت إنشاء رمز التحقق
//     type: Date,
//     default: null
//   },
//   createdAt: {
//     type: Date,
//     default: Date.now
//   },
//   ads: [
//     {
//       type: mongoose.Schema.Types.ObjectId,
//       ref: 'Ad' 
//     }
//   ],
  
//   // الحقول الجديدة للمعلومات الأساسية للموقع
//   companyName: {
//     type: String,
//     required: false
//   },
//   domainName: {
//     type: String,
//     required: false,
//     unique: true
//   },
//   entityType: {
//     type: String,
//     enum: ['فرد', 'مؤسسة', 'شركة'], 
//     required: false
//   },


//   // الحقل الجديد لإضافة رابط الشعار
//   logoUrl: {
//     type: String,
//     required: false, // ليس إجباريًا
//     default: null    // القيمة الافتراضية
//   },




//                 // حقل بيانات موقع الويب
//                 // websiteData: {
//                   homepage: {
//                     header: {
//                       type: String, // مثل عنوان رئيسي
//                       required: false
//                     },
//                     subHeader: {
//                       type: String, // وصف إضافي للصفحة
//                       required: false
//                     }
//                   },

                  
//                   socialMedia: {
//                     phoneNumber: {
//                       type: String,
//                       required: false
//                     },
//                     whatsappNumber: {
//                       type: String,
//                       required: false
//                     },
//                     Facebook: {
//                       type: String,
//                       required: false
//                     },
//                     Twitter: {
//                       type: String,
//                       required: false
//                     },
//                     Instagram: {
//                       type: String,
//                       required: false
//                     },
//                     LinkedIn: {
//                       type: String,
//                       required: false
//                     },
//                     YouTube: {
//                       type: String,
//                       required: false
//                     },
//                     Snapchat: {
//                       type: String,
//                       required: false
//                     },
//                     Pinterest: {
//                       type: String,
//                       required: false
//                     },
//                     TikTok: {
//                       type: String,
//                       required: false
//                     },
//                     Telegram: {
//                       type: String,
//                       required: false
//                     }
//                   },
//                   aboutUs: {
//                     description: {
//                       type: String, // نص الوصف الخاص بـ"نبذة عنا"
//                       required: false
//                     },
//                     mission: {
//                       type: String, // الرسالة
//                       required: false
//                     },
//                     vision: {
//                       type: String, // الرؤية
//                       required: false
//                     }
//                   }
//                 // }





// });

// const User = mongoose.model('User', userSchema);

// module.exports = User;












const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  // الحقول الأساسية للمستخدم
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

  // حقول خاصة بالتحقق عبر الهاتف
  phoneVerificationCode: {
    type: String,
    default: null
  },
  isPhoneVerified: {
    type: Boolean,
    default: false
  },
  codeCreatedAt: {
    type: Date,
    default: null
  },

  // تاريخ إنشاء المستخدم
  createdAt: {
    type: Date,
    default: Date.now
  },

  // قائمة الإعلانات التي يملكها المستخدم
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

  // حقل الرابط الخاص بالشعار
  logoUrl: {
    type: String,
    required: false,
    default: null
  },

  // بيانات الصفحة الرئيسية (مثال مبسّط)
  homepage: {
// الحقول الجديدة في كائن homepage:
marketingTitle: {
  type: String,
  required: false // عنوان العبارة التسويقية
},
marketingPhrase: {
  type: String,
  required: false // نص العبارة التسويقية
},
companyDescription: {
  type: String,
  required: false // النبذة التعريفية عن الشركة
},
images: [
  {
    type: String,
    required: false // روابط الصور
  }
],
foundedDate: {
  type: String,
  required: false // تاريخ تأسيس الشركة
},
shortDescriptionTitle: {
  type: String,
  required: false // عنوان النبذة المختصرة
},
adFilterType: {
  type: String,
  enum: ['featured', 'new', 'discounted'],
  required: false // نوع الفلتر للإعلانات
}

  },

  // بيانات وسائل التواصل الاجتماعي
  socialMedia: {

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
    },

      // الحقل الجديد الخاص بالبريد الإلكتروني
  email: {
    type: String,
    required: false
  }
  },

// مثال على الجزء الإضافي الخاص بقسم About
// أضفه في نفس الـschema الذي لديك

about: {
  // تعريف عن الشركة
  companyIntroduction: {
    type: String,
    required: false
  },

  // مجالات الشركة (مصفوفة من المجالات)
  businessAreas: {
    type: [String], // يمكنك وضعها كسلسلة نصية فقط لو أردت "String" بدلًا من مصفوفة
    required: false
  },

  // الرسالة
  mission: {
    type: String,
    required: false
  },

  // الرؤية
  vision: {
    type: String,
    required: false
  },

  // القيم
  values: {
    type: [String], // أو يمكنك وضعها كسلسلة واحدة إذا أردت
    required: false
  },

  // المزايا التنافسية
  competitiveAdvantages: {
    type: [String],
    required: false
  },

  // الهيكل التنظيمي (قائمة بأفراد الفريق وأدوارهم وصورهم)
  organizationalStructure: [
    {
      jobTitle: { // المسمى الوظيفي
        type: String,
        required: false
      },
      name: { // اسم الشخص
        type: String,
        required: false
      },
      personalPhotoUrl: { // رابط الصورة الشخصية (يمكن رفعها على Amazon S3 أو أي خدمة أخرى)
        type: String,
        required: false
      }
    }
  ],

  // الشهادات والرخص (اسم الشهادة أو الرخصة + رابطها)
  certificationsAndLicenses: [
    {
      certificateName: {
        type: String,
        required: false
      },
      certificateUrl: { // هنا يمكنك تخزين رابط الشهادة المرفوعة على S3
        type: String,
        required: false
      }
    }
  ]
},


  // حقل الفروع
  branches: [
    {
      branchName: {
        type: String,
        required: true
      },
      locationUrl: {
        type: String,   // يمكن أن يكون رابط خرائط جوجل أو أي رابط آخر
        required: false
      },
      phoneNumber: {
        type: String,   // رقم الاتصال لهذا الفرع
        required: false
      },
      whatsappNumber: {
        type: String,   // رقم/رابط واتساب لهذا الفرع
        required: false
      }
    }
  ]
});

const User = mongoose.model('User', userSchema);

module.exports = User;
