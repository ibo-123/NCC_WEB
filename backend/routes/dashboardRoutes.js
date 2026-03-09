const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/authMiddleware');
const {
  getAdminDashboard,
  getUserDashboard,
  getSystemOverview,
  getDashboardStats
} = require('../controllers/dashboard.controller');

// All routes are protected
router.use(protect);

// unified stats endpoint
// @route   GET /api/dashboard/stats
// @desc    Get dashboard statistics (admin or user based on role)
// @access  Private
router.get('/stats', getDashboardStats);

// @route   GET /api/dashboard/admin
// @desc    Get admin dashboard statistics
// @access  Private/Admin
router.get('/admin', authorize('admin'), getAdminDashboard);

// @route   GET /api/dashboard/user
// @desc    Get user dashboard statistics
// @access  Private
router.get('/user', getUserDashboard);

// @route   GET /api/dashboard/overview
// @desc    Get system overview
// @access  Private/Admin
router.get('/overview', authorize('admin'), getSystemOverview);

module.exports = router;