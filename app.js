const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const cors = require('cors');
const bodyParser = require('body-parser');
const swaggerUi = require('swagger-ui-express');
const swaggerJsdoc = require('swagger-jsdoc');
const session = require('express-session');  // استيراد express-session
require('express-async-errors');

dotenv.config();

const app = express();

// إعداد الجلسات
app.use(session({
  secret: 'your-secret-key',  // استخدم مفتاح سري قوي في بيئة الإنتاج
  resave: false,
  saveUninitialized: true,
  cookie: {
    secure: false,  // اجعلها true إذا كنت تستخدم HTTPS
    maxAge: 24 * 60 * 60 * 1000  // مدة صلاحية الجلسة (اختياري: 24 ساعة)
  }
}));

// إعداد Swagger
const swaggerOptions = {
  swaggerDefinition: {
    openapi: '3.0.0',
    info: {
      title: 'API Documentation',
      version: '1.0.0',
      description: 'API Documentation using Swagger'
    },
    servers: [
      {
        url: process.env.SWAGGER_SERVER_URL  // استخدام المتغير من .env
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT'
        }
      }
    },
    security: [
      {
        bearerAuth: []
      }
    ]
  },
  apis: ['./routes/**/*.js']
};

const swaggerDocs = swaggerJsdoc(swaggerOptions);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocs));

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL,  // استخدام المتغير من .env // ضع هنا رابط الواجهة الأمامية الفعلي
  credentials: true  // السماح بتمرير ملفات تعريف الارتباط (الجلسات)
}));
app.use(bodyParser.json());

// Routes
const userRoutes = require('./routes/user/index');
const adminRoutes = require('./routes/admin/index');
const authRoutes = require('./routes/auth/index');


app.use('/api/user', userRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/auth', authRoutes);


// Global error handler
app.use((err, req, res, next) => {
  console.error(err.message);
  res.status(500).send('Server error');
});

// Database connection
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.log(err));

// Server listening
const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
