const express = require('express');
const { body, query, validationResult } = require('express-validator');
const mongoose = require('mongoose');
const { Task, User } = require('../models');
const { authenticate, requireAdmin } = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/tasks
// @desc    Get all tasks with pagination and filtering
// @access  Private
router.get('/', [
  authenticate,
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  query('status').optional().isIn(['pending', 'in-progress', 'completed']).withMessage('Invalid status'),
  query('priority').optional().isIn(['low', 'medium', 'high']).withMessage('Invalid priority'),
  query('assignedUserId').optional().isMongoId().withMessage('Invalid user ID'),
  query('search').optional().isLength({ min: 1, max: 100 }).withMessage('Search term must be 1-100 characters')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Validation failed', 
        errors: errors.array() 
      });
    }

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Build query object for filtering
    const query = {};
    
    if (req.query.status) {
      query.status = req.query.status;
    }
    
    if (req.query.priority) {
      query.priority = req.query.priority;
    }
    
    if (req.query.assignedUserId) {
      query.assignedUserId = req.query.assignedUserId;
    }

    // Search functionality
    if (req.query.search) {
      query.$or = [
        { title: { $regex: req.query.search, $options: 'i' } },
        { description: { $regex: req.query.search, $options: 'i' } }
      ];
    }

    // Non-admin users can only see their assigned tasks or tasks they created
    if (req.user.role !== 'admin') {
      query.$or = [
        { assignedUserId: req.user._id },
        { createdBy: req.user._id }
      ];
    }

    const [tasks, totalCount] = await Promise.all([
      Task.find(query)
        .populate('assignedUserId', 'firstName lastName email')
        .populate('createdBy', 'firstName lastName email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Task.countDocuments(query)
    ]);

    // Transform the populated data to match frontend expectations
    const transformedTasks = tasks.map(task => ({
      ...task.toObject(),
      assignedUser: task.assignedUserId,
      creator: task.createdBy,
      id: task._id
    }));

    const totalPages = Math.ceil(totalCount / limit);

    res.json({
      tasks: transformedTasks,
      pagination: {
        currentPage: page,
        totalPages,
        totalItems: totalCount,
        itemsPerPage: limit,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1
      }
    });
  } catch (error) {
    console.error('Get tasks error:', error);
    res.status(500).json({ message: 'Server error while fetching tasks' });
  }
});

// @route   GET /api/tasks/:id
// @desc    Get task by ID
// @access  Private
router.get('/:id', authenticate, async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: 'Invalid task ID' });
    }

    const task = await Task.findById(req.params.id)
      .populate('assignedUserId', 'firstName lastName email')
      .populate('createdBy', 'firstName lastName email');

    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    // Check if user has access to this task
    if (req.user.role !== 'admin' && 
        (!task.assignedUserId || task.assignedUserId._id.toString() !== req.user._id.toString()) && 
        task.createdBy._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Transform the populated data to match frontend expectations
    const transformedTask = {
      ...task.toObject(),
      assignedUser: task.assignedUserId,
      creator: task.createdBy,
      id: task._id
    };

    res.json({ task: transformedTask });
  } catch (error) {
    console.error('Get task error:', error);
    res.status(500).json({ message: 'Server error while fetching task' });
  }
});

// @route   POST /api/tasks
// @desc    Create a new task
// @access  Private
router.post('/', [
  authenticate,
  body('title').trim().isLength({ min: 3, max: 200 }).withMessage('Title must be 3-200 characters'),
  body('description').optional().trim().isLength({ max: 1000 }).withMessage('Description must be less than 1000 characters'),
  body('priority').optional().isIn(['low', 'medium', 'high']).withMessage('Invalid priority'),
  body('dueDate').optional().isISO8601().withMessage('Invalid due date format'),
  body('assignedUserId').optional().isMongoId().withMessage('Invalid assigned user ID')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Validation failed', 
        errors: errors.array() 
      });
    }

    const { title, description, priority = 'medium', dueDate, assignedUserId } = req.body;

    // Validate assigned user exists if provided
    if (assignedUserId) {
      const assignedUser = await User.findById(assignedUserId);
      if (!assignedUser) {
        return res.status(400).json({ message: 'Assigned user not found' });
      }
    }

    const task = new Task({
      title,
      description,
      priority,
      dueDate: dueDate ? new Date(dueDate) : null,
      assignedUserId: assignedUserId || null,
      createdBy: req.user._id
    });

    await task.save();

    // Populate the created task
    await task.populate('assignedUserId', 'firstName lastName email');
    await task.populate('createdBy', 'firstName lastName email');

    // Transform the populated data to match frontend expectations
    const transformedTask = {
      ...task.toObject(),
      assignedUser: task.assignedUserId,
      creator: task.createdBy,
      id: task._id
    };

    res.status(201).json({
      message: 'Task created successfully',
      task: transformedTask
    });
  } catch (error) {
    console.error('Create task error:', error);
    res.status(500).json({ message: 'Server error while creating task' });
  }
});

// @route   PUT /api/tasks/:id
// @desc    Update a task
// @access  Private
router.put('/:id', [
  authenticate,
  body('title').optional().trim().isLength({ min: 3, max: 200 }).withMessage('Title must be 3-200 characters'),
  body('description').optional().trim().isLength({ max: 1000 }).withMessage('Description must be less than 1000 characters'),
  body('status').optional().isIn(['pending', 'in-progress', 'completed']).withMessage('Invalid status'),
  body('priority').optional().isIn(['low', 'medium', 'high']).withMessage('Invalid priority'),
  body('dueDate').optional().isISO8601().withMessage('Invalid due date format'),
  body('assignedUserId').optional().isMongoId().withMessage('Invalid assigned user ID')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Validation failed', 
        errors: errors.array() 
      });
    }

    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: 'Invalid task ID' });
    }

    const task = await Task.findById(req.params.id);
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    // Check if user has permission to update this task
    if (req.user.role !== 'admin' && 
        (!task.assignedUserId || task.assignedUserId.toString() !== req.user._id.toString()) && 
        task.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const { title, description, status, priority, dueDate, assignedUserId } = req.body;

    // Validate assigned user exists if provided
    if (assignedUserId) {
      const assignedUser = await User.findById(assignedUserId);
      if (!assignedUser) {
        return res.status(400).json({ message: 'Assigned user not found' });
      }
    }

    // Update task fields
    if (title !== undefined) task.title = title;
    if (description !== undefined) task.description = description;
    if (status !== undefined) task.status = status;
    if (priority !== undefined) task.priority = priority;
    if (dueDate !== undefined) task.dueDate = dueDate ? new Date(dueDate) : null;
    if (assignedUserId !== undefined) task.assignedUserId = assignedUserId || null;

    await task.save();

    // Populate the updated task
    await task.populate('assignedUserId', 'firstName lastName email');
    await task.populate('createdBy', 'firstName lastName email');

    // Transform the populated data to match frontend expectations
    const transformedTask = {
      ...task.toObject(),
      assignedUser: task.assignedUserId,
      creator: task.createdBy,
      id: task._id
    };

    res.json({
      message: 'Task updated successfully',
      task: transformedTask
    });
  } catch (error) {
    console.error('Update task error:', error);
    res.status(500).json({ message: 'Server error while updating task' });
  }
});

// @route   DELETE /api/tasks/:id
// @desc    Delete a task
// @access  Private
router.delete('/:id', authenticate, async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: 'Invalid task ID' });
    }

    const task = await Task.findById(req.params.id);
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    // Check if user has permission to delete this task
    if (req.user.role !== 'admin' && task.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied. Only task creator or admin can delete tasks.' });
    }

    await Task.findByIdAndDelete(req.params.id);

    res.json({ message: 'Task deleted successfully' });
  } catch (error) {
    console.error('Delete task error:', error);
    res.status(500).json({ message: 'Server error while deleting task' });
  }
});

// @route   PATCH /api/tasks/:id/status
// @desc    Update task status
// @access  Private
router.patch('/:id/status', [
  authenticate,
  body('status').isIn(['pending', 'in-progress', 'completed']).withMessage('Invalid status')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Validation failed', 
        errors: errors.array() 
      });
    }

    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: 'Invalid task ID' });
    }

    const task = await Task.findById(req.params.id);
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    // Check if user has permission to update this task
    if (req.user.role !== 'admin' && 
        (!task.assignedUserId || task.assignedUserId.toString() !== req.user._id.toString()) && 
        task.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    task.status = req.body.status;
    await task.save();

    res.json({
      message: 'Task status updated successfully',
      task: { id: task._id, status: task.status }
    });
  } catch (error) {
    console.error('Update task status error:', error);
    res.status(500).json({ message: 'Server error while updating task status' });
  }
});

module.exports = router;