const express = require('express');
const router = express.Router();
const { authenticateToken, authorizeRole } = require('../../middleware/auth');
const adminController = require('../../controllers/admin/adminController');

// Route accessible only by admin
router.get('/dashboard', authenticateToken, authorizeRole(['admin']), adminController.getDashboard);



// view all users
/**
 * @swagger
 * /admin/user:
 *   get:
 *     summary: Get all users
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of users
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */


router.get('/user', authenticateToken, authorizeRole(['admin']), adminController.getUsers);



// Delete users
/**
 * @swagger
 * /admin/user/{id}:
 *   delete:
 *     summary: Delete a user by ID
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: The user ID
 *     responses:
 *       200:
 *         description: User deleted
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: User not found
 *       500:
 *         description: Internal server error
 */



router.delete('/user/:id', authenticateToken, authorizeRole(['admin']), adminController.deleteUser);





// Edit all users
/**
 * @swagger
 * /admin/user/{id}:
 *   put:
 *     summary: Update a user by ID
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: The user ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               username:
 *                 type: string
 *               accountType:
 *                 type: string
 *     responses:
 *       200:
 *         description: User updated
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: User not found
 *       500:
 *         description: Internal server error
 */

router.put('/user/:id', authenticateToken, authorizeRole(['admin']), adminController.updateUser);




module.exports = router;
