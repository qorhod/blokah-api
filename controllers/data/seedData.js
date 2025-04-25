/**
 * ملف بيانات أوّلي (seeder) متناسق مع الـ User و Ad Schemas
 * - تم نقل  socialMedia  و  about  إلى داخل كل User
 * - تمت إزالة التكرار في  homepage.companyDescription
 * - أُعيدت تسمية التكرار الثاني إلى  shortDescriptionTitle
 * - لا يزال حقل  emailOwner  للإعلانات كما هو؛ ستستبدله بـ user:ObjectId أثناء عملية الـ seed
 */

module.exports = {
  /*────────────────────── المستخدمون ──────────────────────*/
  users: [
    {
      /* يمكنك لاحقًا إضافة firstName / lastName / email … إلخ */
      // logoUrl: 'https://files.catbox.moe/jpmw71.png',

      logoUrl: 'https://blokah.s3.me-south-1.amazonaws.com/fake/%D8%B5%D9%88%D8%B1+%D8%B4%D8%B9%D8%A7%D8%B12.png',
// 
      
      /*──────── الصفحة الرئيسية (homepage) ────────*/
      homepage: {
        marketingTitle:  'حلول عقارية متكاملة',
        marketingPhrase: 'من البحث إلى التملّك، نحقق لك قيمة عقارك بثقة واحتراف',
        companyDescription:
          'نحن مكتب عقاري متخصص في تقديم مجموعة متكاملة من الخدمات العقارية تشمل التسويق، الوساطة، إدارة الأملاك، والتقييم المعتمد. نعتمد على فريق محترف يجمع بين الخبرة الميدانية وأحدث التقنيات الرقمية لتحليل السوق وتحديد الفرص الاستثمارية المُجدية. نضع احتياجات عملائنا في صلب عملنا، فنقدّم حلولًا مُصمَّمة خصيصًا لضمان تحقيق أعلى عائد وبناء علاقات طويلة الأمد تقوم على الثقة والشفافية.',
        shortDescriptionTitle: 'لمحة عن مكتبنا العقاري المتكامل',
        foundedDate: '1998',
        images: [
          // 'https://arjanarch.sa/wp-content/uploads/2024/11/Screenshot-2024-11-12-102636.png',
          // 'https://files.catbox.moe/i2wgji.avif',
          // 'https://files.catbox.moe/pzj9ch.jpg',
          // 'https://ackdconsult.com/uploads/PMCDesigns/source/31636.jpeg'

          'https://blokah.s3.me-south-1.amazonaws.com/fake/Screenshot-2024-11-12-102636.png',
          'https://blokah.s3.me-south-1.amazonaws.com/fake/w%3D540%2Cq%3D75.avif',
          'https://blokah.s3.me-south-1.amazonaws.com/fake/%D9%86%D8%B3%D8%AE%D8%A9+%D9%85%D9%86+aloula-alfozan-news.jpg',
          'https://blokah.s3.me-south-1.amazonaws.com/fake/31636.jpeg',

        ]
      },

      /*──────── وسائل التواصل الاجتماعي ────────*/
      socialMedia: {
        // Twitter:  'https://twitter.com',            // ضع @username إن وُجد
        Instagram:'https://instagram.com',
        YouTube:  'https://www.youtube.com',
        Snapchat: 'https://www.snapchat.com',
        TikTok:   'https://www.tiktok.com',
        email:    'info@gmail.com'
      },

      /*──────── قسم About ────────*/
      about: {
        companyIntroduction:
          'نحن شركة رائدة تقدّم حلولاً عقارية شاملة تشمل التطوير والإدارة والتسويق، مع خبرة تتجاوز عشر سنوات في السوق السعودي.',

        businessAreas: [
          'التطوير العقاري',
          'إدارة الأملاك',
          'التسويق العقاري',
          'التقييم والاستشارات'
        ],

        mission:
          'رسالتنا هي تمكين عملائنا من تحقيق أقصى عائد استثماري عبر تقديم خدمات عقارية مبتكرة وموثوقة مدعومة بالتقنيات الحديثة.',

        vision:
          'أن نكون الخيار الأول في قطاع الخدمات العقارية في الشرق الأوسط من حيث الجودة والابتكار والشفافية بحلول عام 2030.',

        values: ['الشفافية', 'الجودة', 'الابتكار', 'الالتزام بخدمة العميل'],

        competitiveAdvantages: [
          'فريق عمل معتمد بخبرات دولية',
          'شبكة واسعة من الشركاء المحليين والعالميين',
          'أنظمة إدارة عقارية رقمية متقدمة',
          'خدمة عملاء على مدار الساعة'
        ],

        organizationalStructure: [
          {
            jobTitle: 'الرئيس التنفيذي',
            name: 'عبدالعزيز',
            personalPhotoUrl: 'https://blokah.s3.me-south-1.amazonaws.com/fake/%D8%B5%D9%88%D8%B1%D8%A9+%D9%85%D9%88%D8%B8%D9%81+%D9%85%D8%AC%D8%AA%D9%87%D8%AF+.webp'
          },
          {
            jobTitle: 'مصمم جرافيك ',
            name: 'فاطمة ',
            // personalPhotoUrl: 'https://example.com/images/operations.jpg'
          },
          {
            jobTitle: ' العلاقات العامه',
            name: 'ياسر ',
            personalPhotoUrl: 'https://blokah.s3.me-south-1.amazonaws.com/fake/images.jpeg'

          },
          {
            jobTitle: 'كاتب محتوى',
            name: 'خالد ',
            personalPhotoUrl: 'https://blokah.s3.me-south-1.amazonaws.com/fake/a-saudi-arabian-gulf-employee-preview-100613.jpg'
          }
        ],

        certificationsAndLicenses: [
          {
            certificateName: 'رخصة فال',
            certificateUrl:
            'https://blokah.s3.me-south-1.amazonaws.com/fake/Fqjki9GWcAIyQFV.jpeg'
          },

        ],

        aboutImages: [
          'https://blokah.s3.me-south-1.amazonaws.com/fake/arabsstock_150872_large.jpg',
          'https://blokah.s3.me-south-1.amazonaws.com/fake/arabsstock_150908_large.jpg',
          'https://blokah.s3.me-south-1.amazonaws.com/fake/arabsstock_52953_large.jpg'
        ],

        companyLogos: [
          'https://blokah.s3.me-south-1.amazonaws.com/fake/65807.jpg',
          'https://blokah.s3.me-south-1.amazonaws.com/fake/4-Bank-AlJazira.jpg',
          'https://blokah.s3.me-south-1.amazonaws.com/fake/c4b98ed7-bfec-4d3e-9cfb-d084d6c7a752.webp',
          'https://blokah.s3.me-south-1.amazonaws.com/fake/images+(1).png',
          'https://blokah.s3.me-south-1.amazonaws.com/fake/images.png',
          'https://blokah.s3.me-south-1.amazonaws.com/fake/partners_image_migrate_84_1.png',

        ]
      },

      /*──────── الفروع (Branches) – فرعان افتراضيان ────────*/
      branches: [
        {
          branchName: 'الفرع الرئيسي – الرياض',
          locationUrl: 'https://goo.gl/maps/x123MainRiyadh',
          phoneNumber: '920053455',
          whatsappNumber: '0507206381'
        },
        {
          branchName: 'فرع جدة – حي الشاطئ',
          locationUrl: 'https://goo.gl/maps/x789Jeddah',
          phoneNumber: '0507206381',
          whatsappNumber: '0507206381'
        }
      ]


      
    }
  ],
/*────────────────────── إعلانات تجريبية (5 عناصر) ──────────────────────*/
ads: [
  {
    status: 'منشور',
    title: 'فيلا حديثة بواجهة حجرية – حطين',
    adNumber: 'AD-2001',
    adType: 'بيع',
    city: 'الرياض',

    address: 'حي حطين، شارع الأمير محمد بن سلمان',
    category: 'عقار',
    discountPrice: '',
    propertyType: 'villa',

    landArea: 450,
    streetWidth: 20,
    streetCount: 2,
    subCategory: { label: 'فيلا سكنية', id: 11, labelEn: 'Residential Villa' },
    frequentProperty: true,

    floorsCount: 2,
    bedrooms: 5,
    bathrooms: 6,
    maidRooms: 1,
    swimmingPool: 1,
    cameras: 1,
    elevator: 0,
    balcony: 2,
    garage: 2,

    services: ['قريبة من المدارس', 'إنترنت فايبر'],
    directions: ['شمال', 'شرق'],

    propertyDetails: 'تصميم مودرن، تأسيس مصعد، مسبح داخلي مُدفأ.',
    isPriceNegotiable: true,

    locationType: 'precise',
    lat: 24.773795,
    lng: 46.676894,
    district: 'حطين',
    region: 'منطقة الرياض',
    country: 'المملكة العربية السعودية',

    acceptMortgage: true,

    phoneNumber: '0511111111',
    whatsappNumber: '0511111111',

    features: { rooms: 5, bathrooms: 6, size: 650 },

    price: 3_200_000,
    originalPrice: '',

    image: null,
    images: [
      'https://blokah.s3.me-south-1.amazonaws.com/fake/Screenshot-2024-11-12-102636.png',
      'https://blokah.s3.me-south-1.amazonaws.com/fake/w%3D540%2Cq%3D75.avif',
      'https://blokah.s3.me-south-1.amazonaws.com/fake/%D9%86%D8%B3%D8%AE%D8%A9+%D9%85%D9%86+aloula-alfozan-news.jpg',
      'https://blokah.s3.me-south-1.amazonaws.com/fake/31636.jpeg',
    ],
    videos: [],

    description: 'فيلا مودرن واجهة حجرية مع مسبح داخلي وحديقة.',
    isFeatured: true,
    statusText: 'متاح'
  }
]

};










// ,

//   {
//     status: 'منشور',
//     title: 'شقة فاخرة للإيجار – برج طريق الملك',
//     adNumber: 'AD-2002',
//     adType: 'rent',
//     city: 'جدة',

//     address: 'طريق الملك، برج البحار، الدور 15',
//     category: 'عقار',
//     discountPrice: '5000',
//     propertyType: 'apartment',

//     landArea: 0,
//     streetWidth: 30,
//     streetCount: 1,
//     subCategory: { label: 'شقة فندقية', id: 22, labelEn: 'Serviced Apartment' },
//     frequentProperty: false,

//     floorsCount: 1,
//     bedrooms: 3,
//     bathrooms: 4,
//     laundryRooms: 1,
//     gym: 1,
//     elevator: 3,
//     balcony: 1,
//     garage: 1,

//     services: ['صالة رياضية', 'خدمة لوبي 24 ساعة'],
//     directions: ['غرب'],

//     propertyDetails: 'إطلالة بحرية بانورامية، مفروشة بالكامل.',
//     isPriceNegotiable: false,

//     locationType: 'precise',
//     lat: 21.543333,
//     lng: 39.172778,
//     district: 'الشاطئ',
//     region: 'منطقة مكة',
//     country: 'المملكة العربية السعودية',

//     acceptMortgage: false,

//     phoneNumber: '0522222222',
//     whatsappNumber: '0522222222',

//     features: { rooms: 3, bathrooms: 4, size: 230 },

//     price: 140_000,          // إيجار سنوي
//     originalPrice: '',

//     image: null,
//     images: ['https://via.placeholder.com/600x400?text=Flat1'],
//     videos: [],

//     description: 'شقة مفروشة بالكامل بإطلالة بحرية وصالة ألعاب.',
//     isFeatured: false,
//     statusText: 'متاح'
//   },

//   {
//     status: 'منشور',
//     title: 'أرض تجارية على طريق الملك فهد',
//     adNumber: 'AD-2003',
//     adType: 'sell',
//     city: 'الدمام',

//     address: 'حي الشعلة، طريق الملك فهد',
//     category: 'عقار',
//     discountPrice: '',
//     propertyType: 'land',

//     landArea: 1200,
//     streetWidth: 60,
//     streetCount: 1,
//     subCategory: { label: 'أرض تجارية', id: 33, labelEn: 'Commercial Land' },

//     services: [],
//     directions: ['جنوب'],

//     propertyDetails: 'قطعة أرض مميزة على محور تجاري حيوي.',
//     isPriceNegotiable: true,

//     locationType: 'approximate',
//     lat: 26.434444,
//     lng: 50.103889,
//     district: 'الشعلة',
//     region: 'المنطقة الشرقية',
//     country: 'المملكة العربية السعودية',

//     acceptMortgage: true,

//     phoneNumber: '0533333333',
//     whatsappNumber: '0533333333',

//     price: 4_500_000,

//     images: ['https://via.placeholder.com/600x400?text=Land'],
//     videos: [],

//     description: 'موقع استراتيجي يصلح لمجمع تجاري أو فندق.',
//     isFeatured: false,
//     statusText: 'متاح'
//   },

//   {
//     status: 'منشور',
//     title: 'مكتب إداري للإيجار – العليا بلازا',
//     adNumber: 'AD-2004',
//     adType: 'rent',
//     city: 'الرياض',

//     address: 'حي العليا، شارع التحلية، العليا بلازا',
//     category: 'مكاتب',
//     discountPrice: '2000',
//     propertyType: 'office',

//     buildingSize: 150,
//     floorsCount: 1,
//     bathrooms: 2,
//     elevator: 4,

//     services: ['إنترنت فايبر', 'تكييف مركزي'],
//     directions: ['شرق'],

//     propertyDetails: 'تشطيب راقٍ، نظام تحكم بالدخول، مواقف مخصصة.',
//     isPriceNegotiable: false,

//     locationType: 'precise',
//     lat: 24.711667,
//     lng: 46.675278,
//     district: 'العليا',
//     region: 'منطقة الرياض',
//     country: 'المملكة العربية السعودية',

//     phoneNumber: '0544444444',
//     whatsappNumber: '0544444444',

//     price: 95_000, // إيجار سنوي

//     images: ['https://via.placeholder.com/600x400?text=Office'],
//     videos: [],

//     description: 'مكتب فاخر جاهز للاستخدام الفوري في موقع حيوي.',
//     isFeatured: true,
//     statusText: 'متاح'
//   },

//   {
//     status: 'منشور',
//     title: 'مستودع للبيع – الصناعية الجديدة',
//     adNumber: 'AD-2005',
//     adType: 'sell',
//     city: 'بريدة',

//     address: 'المنطقة الصناعية الجديدة، طريق الملك عبدالعزيز',
//     category: 'مستودع',
//     propertyType: 'warehouse',

//     buildingSize: 1800,
//     landSize: 2200,
//     floorsCount: 1,
//     streetWidth: 32,

//     services: ['بوابات شحن', 'أنظمة إطفاء حريق'],

//     propertyDetails: 'مستودع جاهز مع رخصة دفاع مدني سارية.',
//     isPriceNegotiable: true,

//     locationType: 'precise',
//     lat: 26.359722,
//     lng: 43.972778,
//     district: 'الصناعية',
//     region: 'منطقة القصيم',
//     country: 'المملكة العربية السعودية',

//     phoneNumber: '0555555555',
//     whatsappNumber: '0555555555',

//     price: 2_100_000,

//     images: [
//       'https://via.placeholder.com/600x400?text=Warehouse1',
//       'https://via.placeholder.com/600x400?text=Warehouse2'
//     ],
//     videos: [],

//     description: 'مستودع واسع مع بوابات شحن عالية ومكاتب إدارية.',
//     isFeatured: false,
//     statusText: 'متاح'
//   }