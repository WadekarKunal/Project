const sequelize = require('../config/database');
const User = require('./User');
const Task = require('./Task');

// Define associations
User.hasMany(Task, { 
  foreignKey: 'assignedUserId', 
  as: 'assignedTasks' 
});

User.hasMany(Task, { 
  foreignKey: 'createdBy', 
  as: 'createdTasks' 
});

Task.belongsTo(User, { 
  foreignKey: 'assignedUserId', 
  as: 'assignedUser' 
});

Task.belongsTo(User, { 
  foreignKey: 'createdBy', 
  as: 'creator' 
});

module.exports = {
  sequelize,
  User,
  Task
};