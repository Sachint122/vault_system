const express = require('express');
const router = express.Router();

const {
  register,
  login,
  logout,
  getMe,
  refreshToken,
  forgotPassword,
  resetPassword,
  changePassword,
  updateProfile,
} = require('../controllers/authController');

const { protect } = require('../middleware/authMiddleware');

// ======================
// Public Routes
// ======================
router.post('/register', register);
router.post('/login', login);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password/:token', resetPassword);
router.post('/refresh-token', refreshToken);

// ======================
// Protected Routes (Login Required)
// ======================
router.post('/logout', protect, logout);
router.get('/me', protect, getMe);
router.put('/change-password', protect, changePassword);
router.put('/update-profile', protect, updateProfile);

module.exports = router;
