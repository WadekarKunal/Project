import React from 'react'
import { Link } from 'react-router-dom'
import { format } from 'date-fns'
import { Calendar, User, CreditCard as Edit, Trash2, Clock, CircleCheck as CheckCircle, Circle, CirclePlay as PlayCircle } from 'lucide-react'

const TaskCard = ({ task, onStatusChange, onDelete, showActions = true }) => {
  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return 'border-red-500 bg-red-50'
      case 'medium': return 'border-yellow-500 bg-yellow-50'
      case 'low': return 'border-green-500 bg-green-50'
      default: return 'border-gray-300 bg-white'
    }
  }

  const getPriorityBadgeColor = (priority) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800'
      case 'medium': return 'bg-yellow-100 text-yellow-800'
      case 'low': return 'bg-green-100 text-green-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-5 w-5 text-green-600" />
      case 'in-progress':
        return <PlayCircle className="h-5 w-5 text-blue-600" />
      default:
        return <Circle className="h-5 w-5 text-gray-400" />
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800'
      case 'in-progress': return 'bg-blue-100 text-blue-800'
      case 'pending': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && task.status !== 'completed'

  return (
    <div className={`card border-l-4 ${getPriorityColor(task.priority)} hover:shadow-md transition-shadow duration-200`}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center space-x-2 mb-2">
            {getStatusIcon(task.status)}
            <Link 
              to={`/tasks/${task.id}`}
              className="text-lg font-semibold text-gray-900 hover:text-primary-600 transition-colors duration-200"
            >
              {task.title}
            </Link>
          </div>
          
          {task.description && (
            <p className="text-gray-600 text-sm mb-3 line-clamp-2">
              {task.description}
            </p>
          )}

          <div className="flex flex-wrap items-center gap-2 mb-3">
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityBadgeColor(task.priority)}`}>
              {task.priority.charAt(0).toUpperCase() + task.priority.slice(1)} Priority
            </span>
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(task.status)}`}>
              {task.status.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
            {task.dueDate && (
              <div className={`flex items-center space-x-1 ${isOverdue ? 'text-red-600' : ''}`}>
                <Calendar className="h-4 w-4" />
                <span>
                  Due: {format(new Date(task.dueDate), 'MMM dd, yyyy')}
                  {isOverdue && <span className="ml-1 text-red-600 font-medium">(Overdue)</span>}
                </span>
              </div>
            )}
            
            {task.assignedUser && (
              <div className="flex items-center space-x-1">
                <User className="h-4 w-4" />
                <span>
                  {task.assignedUser.firstName} {task.assignedUser.lastName}
                </span>
              </div>
            )}
            
            <div className="flex items-center space-x-1">
              <Clock className="h-4 w-4" />
              <span>
                Created {format(new Date(task.createdAt), 'MMM dd, yyyy')}
              </span>
            </div>
          </div>
        </div>

        {showActions && (
          <div className="flex items-center space-x-2 ml-4">
            {/* Status Change Buttons */}
            {task.status !== 'completed' && (
              <button
                onClick={() => onStatusChange(task.id, task.status === 'pending' ? 'in-progress' : 'completed')}
                className="p-2 text-gray-400 hover:text-green-600 transition-colors duration-200"
                title={task.status === 'pending' ? 'Start Task' : 'Complete Task'}
              >
                {task.status === 'pending' ? (
                  <PlayCircle className="h-4 w-4" />
                ) : (
                  <CheckCircle className="h-4 w-4" />
                )}
              </button>
            )}
            
            <Link
              to={`/tasks/${task.id}/edit`}
              className="p-2 text-gray-400 hover:text-blue-600 transition-colors duration-200"
              title="Edit Task"
            >
              <Edit className="h-4 w-4" />
            </Link>
            
            <button
              onClick={() => onDelete(task.id)}
              className="p-2 text-gray-400 hover:text-red-600 transition-colors duration-200"
              title="Delete Task"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export default TaskCard