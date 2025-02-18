// const mongoose = require('mongoose');

// const adSchema = new mongoose.Schema({

//     // هنا نضيف حقل status لتحديد حالة الإعلان
//     status: {
//       type: String,
//       enum: ['مسودة', 'غير مكتمل', 'منشور'],
//       default: 'مسودة'
//     },

//   title: {
//     type: String,
//     required: true,
//     maxlength: 100
//   },
//   adType: {
//     type: String,
//     required: true
//   },
//   city: {
//     type: String,
//     required: true,
//     maxlength: 50
//   },
//   features: {
//     type: {
//       rooms: { type: Number, default: 0, min: 0 },
//       bathrooms: { type: Number, default: 0, min: 0 },
//       size: { type: Number, default: 0, min: 0 }
//     },
//     default: {}
//   },
//   price: {
//     type: Number,
//     required: true,
//     min: 0
//   },
//   originalPrice: {
//     type: Number,
//     default: null,
//     min: 0
//   },
//   image: {
//     type: String,
//     default: null
//   },
//   images: {
//     type: [String], // الحقل سيظل مصفوفة من النصوص
//     default: [], // القيمة الافتراضية مصفوفة فارغة
//   },
  
//   videos: {
//     type: [String],
//     validate: {
//       validator: function (value) {
//         const urlRegex = /^(https?:\/\/)[\w\-]+(\.[\w\-]+)+[/#?]?.*$/;
//         return value.every(url => urlRegex.test(url)) && value.length <= 3;
//       },
//       message: 'تأكد من إدخال روابط صالحة ولا يمكن رفع أكثر من 3 فيديوهات.'
//     },
//     default: []
//   },
//   description: {
//     type: String,
//     maxlength: 1000,
//     default: ''
//   },
//   // category: {
//   //   type: String,
//   //   enum: ['عقارات', 'سيارات', 'إلكترونيات', 'أثاث', 'أخرى'],
//   //   required: true
//   // },
//   isFeatured: {
//     type: Boolean,
//     default: false
//   },
//   statusText: {
//     type: String,
//     default: 'متاح',
//     maxlength: 20
//   },
//   user: {
//     type: mongoose.Schema.Types.ObjectId,
//     ref: 'User',
//     required: true
//   },
//   views: {
//     type: Number,
//     default: 0,
//     min: 0
//   }
// }, {
//   timestamps: true
// });

// const Ad = mongoose.model('Ad', adSchema);

// module.exports = Ad;



const mongoose = require('mongoose');

const adSchema = new mongoose.Schema({
  // الحالة (Required)
  status: {
    type: String,
    enum: ['مسودة', 'غير منشور', 'منشور'],
    default: 'مسودة',
    required: true
  },

  // الحقول الأساسية
  title: {
    type: String,
    maxlength: 100
  },
  // رقم المعلن 
  adNumber: {
    type: String,
    maxlength: 100
  },
  adType: {
    type: String
  },
  city: {
    type: String,
    maxlength: 50
  },

  // من بياناتك الأصلية
  address: { type: String },
  category: { type: String }, // مثلاً: عقار، أرض، شقة، ...
  discountPrice: {
    type: String,
    default: ''
  },

  propertyType: {
    type: String // مثل "rent" أو "villa" أو غيره
  },
  landArea: { type: Number, default: 0, min: 0 },
  streetWidth: { type: Number, default: 0, min: 0 },
  streetCount: { type: Number, default: 0, min: 0 },
  subCategory: {
    label: { type: String, default: '' },
    id: { type: Number, default: 0 },
    labelEn: { type: String, default: '' },
  },  frequentProperty: { type: Boolean, default: false },

  floorsCount: { type: Number, default: 0, min: 0 },
  bedrooms: { type: Number, default: 0, min: 0 },
  bathrooms: { type: Number, default: 0, min: 0 },
  laundryRooms: { type: Number, default: 0, min: 0 },
  cinemaHall: { type: Number, default: 0, min: 0 },
  gym: { type: Number, default: 0, min: 0 },
  surroundingStreetsCount: { type: Number, default: 0, min: 0 },
  maidRooms: { type: Number, default: 0, min: 0 },
  swimmingPool: { type: Number, default: 0, min: 0 },
  cameras: { type: Number, default: 0, min: 0 },
  balcony: { type: Number, default: 0, min: 0 },
  elevator: { type: Number, default: 0, min: 0 },
  storage: { type: Number, default: 0, min: 0 },
  propertyAge: { type: String, default: 0, min: 0 },
  garage: { type: Number, default: 0, min: 0 },
  buildingSize: { type: Number, default: 0, min: 0 },
  landSize: { type: Number, default: 0, min: 0 },

  services: {
    type: [String],
    default: []
  },
  directions: {
    type: [String],
    default: []
  },
  propertyDetails: {
    type: String,
    default: ''
  },
  isPriceNegotiable: {
    type: Boolean,
    default: false
  },

  // الموقع
  locationType: {
    type: String,
    enum: ['precise', 'approximate'],
    default: 'precise'
  },
  lat: { type: Number },
  lng: { type: Number },
  district: { type: String },
  region: { type: String },
  country: { type: String },

  // قبول التمويل والنزاعات
  acceptMortgage: {
    type: Boolean,
    default: false
  },
  disputes: {
    type: String,
    default: ''
  },
  obligations: {
    type: String,
    default: ''
  },
  canDispose: {
    type: Boolean,
    default: false
  },

  // الوسائط الإضافية
  youtubeLink: {
    type: String,
    default: ''
  },
  tiktokLink: {
    type: String,
    default: ''
  },
// ارقام التواصل للعلان 
phoneNumber: {
  type: String,
  // default: ''
},
whatsappNumber: {
  type: String,
  // default: ''
},
  // الحقول الموجودة سابقًا (يمكنك دمجها أو إزالتها حسب الحاجة)
  features: {
    type: {
      rooms: { type: Number, default: 0, min: 0 },
      bathrooms: { type: Number, default: 0, min: 0 },
      size: { type: Number, default: 0, min: 0 }
    },
    default: {}
  },

  price: {
    type: Number,
    min: 0
  },
  originalPrice: {
    type: String,
    default: ''
  },
  
  image: {
    type: String,
    default: null
  },
  images: {
    type: [String],
    default: []
  },
  videos: {
    type: [String],
    validate: {
      validator: function (value) {
        // تحقق من أن كل عنصر عبارة عن رابط صحيح
        const urlRegex = /^(https?:\/\/)[\w\-]+(\.[\w\-]+)+[/#?]?.*$/;
        return value.every(url => urlRegex.test(url)) && value.length <= 3;
      },
      message: 'تأكد من إدخال روابط صالحة ولا يمكن رفع أكثر من 3 فيديوهات.'
    },
    default: []
  },
  description: {
    type: String,
    maxlength: 1000,
    default: ''
  },
  isFeatured: {
    type: Boolean,
    default: false
  },
  statusText: {
    type: String,
    enum: ['متاح', 'مباع', 'مؤجر'], // القيم المسموح بها
    default: 'متاح',
    maxlength: 20
  },
  
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  views: {
    type: Number,
    default: 0,
    min: 0
  }

}, {
  timestamps: true
});

const Ad = mongoose.model('Ad', adSchema);

module.exports = Ad;
