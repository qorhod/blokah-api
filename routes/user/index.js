const express = require('express');
const router = express.Router();
const userController = require('../../controllers/user/userController');
const { authenticateToken } = require('../../middleware/auth'); // استيراد authenticateToken
 

module.exports = router;
