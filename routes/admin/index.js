const express = require('express');
const router = express.Router();
const { authenticateToken, authorizeRole } = require('../../middleware/auth');
const adminController = require('../../controllers/admin/adminController');

// Route accessible only by admin
router.get('/dashboard', authenticateToken, authorizeRole(['admin']), adminController.getDashboard);

module.exports = router;
