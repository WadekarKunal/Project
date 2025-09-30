const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Task title is required'],
    trim: true,
    minlength: [3, 'Title must be at least 3 characters'],
    maxlength: [200, 'Title must be less than 200 characters']
  },
  description: {
    type: String,
    trim: true,
    maxlength: [1000, 'Description must be less than 1000 characters']
  },
  status: {
    type: String,
    enum: ['pending', 'in-progress', 'completed'],
    default: 'pending'
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high'],
    default: 'medium'
  },
  dueDate: {
    type: Date,
    validate: {
      validator: function(value) {
        if (!value) return true; // Allow null/undefined
        return value >= new Date().setHours(0, 0, 0, 0); // Must be today or future
      },
      message: 'Due date must be today or in the future'
    }
  },
  assignedUserId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  completedAt: {
    type: Date,
    default: null
  }
}, {
  timestamps: true
});

// Middleware to set completedAt when status changes to completed
taskSchema.pre('save', function(next) {
  if (this.isModified('status')) {
    if (this.status === 'completed' && !this.completedAt) {
      this.completedAt = new Date();
    } else if (this.status !== 'completed') {
      this.completedAt = null;
    }
  }
  next();
});

// Instance method to get priority color
taskSchema.methods.getPriorityColor = function() {
  const colors = {
    low: '#10B981',    // green
    medium: '#F59E0B', // yellow
    high: '#EF4444'    // red
  };
  return colors[this.priority] || colors.medium;
};

// Instance method to check if task is overdue
taskSchema.methods.isOverdue = function() {
  if (!this.dueDate) return false;
  return new Date() > new Date(this.dueDate) && this.status !== 'completed';
};

// Index for better query performance
taskSchema.index({ createdBy: 1, status: 1 });
taskSchema.index({ assignedUserId: 1, status: 1 });
taskSchema.index({ dueDate: 1, status: 1 });
taskSchema.index({ title: 'text', description: 'text' });

module.exports = mongoose.model('Task', taskSchema);