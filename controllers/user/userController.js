const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Joi = require('joi');
const User = require('../../models/user');

const axios = require('axios'); // استيراد axios لإرسال طلب إلى Google reCAPTCHA API

