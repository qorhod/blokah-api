const express = require('express');
const router = express.Router();
const { authenticateToken, authorizeRole } = require('../../middleware/auth');
const managerController = require('../../controllers/manager/managerController');

// Route accessible only by manager
router.get('/dashboard', authenticateToken, authorizeRole(['manager']), managerController.getDashboard);

module.exports = router;
