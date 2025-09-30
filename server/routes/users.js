const express = require('express');
const { query, validationResult } = require('express-validator');
const mongoose = require('mongoose');
const { User } = require('../models');
const { authenticate, requireAdmin } = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/users
// @desc    Get all users (for task assignment dropdown)
// @access  Private
router.get('/', [
  authenticate,
  query('active').optional().isBoolean().withMessage('Active must be a boolean')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Validation failed', 
        errors: errors.array() 
      });
    }

    const query = {};
    
    // Filter by active status if provided
    if (req.query.active !== undefined) {
      query.isActive = req.query.active === 'true';
    } else {
      // Default to active users only
      query.isActive = true;
    }

    const users = await User.find(query)
      .select('firstName lastName email role createdAt isActive')
      .sort({ firstName: 1, lastName: 1 });

    // Transform users to include id field for frontend compatibility
    const transformedUsers = users.map(user => ({
      ...user.toObject(),
      id: user._id
    }));

    res.json({ users: transformedUsers });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ message: 'Server error while fetching users' });
  }
});

// @route   GET /api/users/:id
// @desc    Get user by ID
// @access  Private (Admin only)
router.get('/:id', [authenticate, requireAdmin], async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: 'Invalid user ID' });
    }

    const user = await User.findById(req.params.id)
      .select('firstName lastName email role isActive createdAt updatedAt');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Transform user to include id field for frontend compatibility
    const transformedUser = {
      ...user.toObject(),
      id: user._id
    };

    res.json({ user: transformedUser });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ message: 'Server error while fetching user' });
  }
});

// @route   PATCH /api/users/:id/status
// @desc    Activate/deactivate user
// @access  Private (Admin only)
router.patch('/:id/status', [authenticate, requireAdmin], async (req, res) => {
  try {
    const { isActive } = req.body;

    if (typeof isActive !== 'boolean') {
      return res.status(400).json({ message: 'isActive must be a boolean' });
    }

    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: 'Invalid user ID' });
    }

    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Prevent admin from deactivating themselves
    if (user._id.toString() === req.user._id.toString() && !isActive) {
      return res.status(400).json({ message: 'You cannot deactivate your own account' });
    }

    user.isActive = isActive;
    await user.save();

    res.json({
      message: `User ${isActive ? 'activated' : 'deactivated'} successfully`,
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        isActive: user.isActive
      }
    });
  } catch (error) {
    console.error('Update user status error:', error);
    res.status(500).json({ message: 'Server error while updating user status' });
  }
});

module.exports = router;