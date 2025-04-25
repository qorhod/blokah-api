// const express = require('express');
// const mongoose = require('mongoose');
// const dotenv = require('dotenv');
// const cors = require('cors');
// const bodyParser = require('body-parser');
// const swaggerUi = require('swagger-ui-express');
// const swaggerJsdoc = require('swagger-jsdoc');
// const session = require('express-session');
// require('express-async-errors');

// dotenv.config();

// const app = express();

// // إعداد الجلسات
// app.use(session({
//   secret: 'your-secret-key',
//   resave: false,
//   saveUninitialized: true,
//   cookie: {
//     secure: false,  // اجعلها true إذا كنت تستخدم HTTPS
//     maxAge: 24 * 60 * 60 * 1000
//   }
// }));

// // إعداد Swagger
// const swaggerOptions = {
//   swaggerDefinition: {
//     openapi: '3.0.0',
//     info: {
//       title: 'API Documentation',
//       version: '1.0.0',
//       description: 'API Documentation using Swagger'
//     },
//     servers: [
//       {
//         url: process.env.SWAGGER_SERVER_URL
//       }
//     ],
//     components: {
//       securitySchemes: {
//         bearerAuth: {
//           type: 'http',
//           scheme: 'bearer',
//           bearerFormat: 'JWT'
//         }
//       }
//     },
//     security: [
//       {
//         bearerAuth: []
//       }
//     ]
//   },
//   apis: ['./routes/**/*.js']
// };

// const swaggerDocs = swaggerJsdoc(swaggerOptions);
// app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocs));

// // Middleware
// // app.use(cors({
// //   origin: process.env.FRONTEND_URL,
// //   credentials: true
// // }));

// // لسماح لجميع المواقع من الوصلو إلا api 
// // app.use(cors({
// //   origin: '*', // السماح لجميع النطاقات
// //   credentials: true
// // }));



// // لحصل النطاقات التي يسمح لها بل وصول إلا api
//  const allowedOrigins = [
//   process.env.FRONTEND_URL,
//   'http://localhost:3001', // إضافة نطاقات أخرى مسموح بها
//   'http://localhost:3030',
//   'http://localhost:3031',

  
//   'http://172.20.10.13:3001',
//   'http://172.20.10.13:3030',
//   'http://172.20.10.13:3031',
//   'http://my.test:3001',
//   'http://qorhod.sa:3008',
// ];

// app.use(cors({
//   origin: (origin, callback) => {
//     if (!origin || allowedOrigins.includes(origin)) {
//       callback(null, true);
//     } else {
//       callback(new Error('Not allowed by CORS'));
//     }
//   },
//   credentials: true
// }));




// app.use(bodyParser.json());

// // مسارات أخرى
// const userRoutes = require('./routes/user/index');
// const adminRoutes = require('./routes/admin/index');
// const authRoutes = require('./routes/auth/index');
// const websiteRoutes = require('./routes/website/index');


// const websiteUrlAds = require('./routes/website/websiteUrlAdsRoutes');
// const websiteUrlContentPages = require('./routes/website/websiteUrlContentPagesRoutes');
// const domainNameAds = require('./routes/website/domainNameAdsRoutes');
// const domainNameContentPages = require('./routes/website/domainNameContentPagesRoutes');


// app.use('/api/user', userRoutes);
// app.use('/api/admin', adminRoutes);
// app.use('/api/auth', authRoutes);
// app.use('/api/website', websiteRoutes);



// app.use('/api/website/website-url/ads', websiteUrlAds);
// app.use('/api/website/website-url/content-pages', websiteUrlContentPages);


// app.use('/api/website/domain-name/ads', domainNameAds);
// app.use('/api/website/domain-name/content-pages', domainNameContentPages);



// // Global error handler
// app.use((err, req, res, next) => {
//   console.error(err.message);
//   res.status(500).send('Server error');
// });

// // Database connection
// mongoose.connect(process.env.MONGO_URI)
//   .then(() => console.log('MongoDB connected'))
//   .catch(err => console.log(err));

// // Server listening
// const port = process.env.PORT || 3000;
// app.listen(port, () => {
//   console.log(`Server running on port ${port}`);
// });




// server/app.js  (أو الاسم الذي تستخدمه)
const express          = require('express');
const mongoose         = require('mongoose');
const dotenv           = require('dotenv');
const cors             = require('cors');
const bodyParser       = require('body-parser');
const swaggerUi        = require('swagger-ui-express');
const swaggerJsdoc     = require('swagger-jsdoc');
const session          = require('express-session');
require('express-async-errors');

dotenv.config();

const app = express();

/* ─────────────────────────── جلسات ─────────────────────────── */
app.use(
  session({
    secret: 'your-secret-key',
    resave: false,
    saveUninitialized: true,
    cookie: {
      secure: false,          // اجعلها true إذا كنت تستخدم HTTPS
      maxAge: 24 * 60 * 60 * 1000,
    },
  })
);

/* ─────────────────────────── Swagger ─────────────────────────── */
const swaggerOptions = {
  swaggerDefinition: {
    openapi: '3.0.0',
    info: {
      title: 'API Documentation',
      version: '1.0.0',
      description: 'API Documentation using Swagger',
    },
    servers: [{ url: process.env.SWAGGER_SERVER_URL }],
    components: {
      securitySchemes: {
        bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
      },
    },
    security: [{ bearerAuth: [] }],
  },
  apis: ['./routes/**/*.js'],
};
const swaggerDocs = swaggerJsdoc(swaggerOptions);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocs));

/* ─────────────────────────── CORS ─────────────────────────── */
/*
 * يسمح لأي Origin بالوصول مع دعم إرسال الكوكيز/الهيدر Authorization.
 * إذا كنت لا تحتاج credentials، يمكنك إزالة السطر credentials: true
 * واستخدام app.use(cors()) فقط.
 */
app.use(
  cors({
    origin: true,      // يعيد نفس Origin المرسل في الطلب
    credentials: true, // يسمح بالكوكيز و Authorization header
  })
);

/* ─────────────────────────── Middlewares ─────────────────────────── */
app.use(bodyParser.json());

/* ─────────────────────────── Routes ─────────────────────────── */
const userRoutes                 = require('./routes/user/index');
const adminRoutes                = require('./routes/admin/index');
const authRoutes                 = require('./routes/auth/index');
const websiteRoutes              = require('./routes/website/index');

app.use('/api/user',                       userRoutes);
app.use('/api/admin',                      adminRoutes);
app.use('/api/auth',                       authRoutes);
app.use('/api/website',                    websiteRoutes);

/* ─────────────────────────── Error Handler ─────────────────────────── */
app.use((err, req, res, next) => {
  console.error(err.message);
  res.status(500).send('Server error');
});

/* ─────────────────────────── DB & Server ─────────────────────────── */
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log('MongoDB connected'))
  .catch((err) => console.log(err));

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
