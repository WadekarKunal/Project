import React, { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { format } from 'date-fns'
import axios from 'axios'
import toast from 'react-hot-toast'
import { ArrowLeft, CreditCard as Edit, Trash2, Calendar, User, Clock, CircleCheck as CheckCircle, Circle, CirclePlay as PlayCircle, CircleAlert as AlertCircle } from 'lucide-react'
import LoadingSpinner from '../components/LoadingSpinner'
import { useAuth } from '../contexts/AuthContext'

const TaskDetail = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const [task, setTask] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchTask()
  }, [id])

  const fetchTask = async () => {
    try {
      setLoading(true)
      const response = await axios.get(`/api/tasks/${id}`)
      setTask(response.data.task)
    } catch (error) {
      console.error('Error fetching task:', error)
      if (error.response?.status === 404) {
        toast.error('Task not found')
        navigate('/tasks')
      } else {
        toast.error('Failed to fetch task details')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleStatusChange = async (newStatus) => {
    try {
      await axios.patch(`/api/tasks/${id}/status`, { status: newStatus })
      toast.success('Task status updated successfully')
      setTask(prev => ({ ...prev, status: newStatus }))
    } catch (error) {
      console.error('Error updating task status:', error)
      toast.error('Failed to update task status')
    }
  }

  const handleDeleteTask = async () => {
    if (!window.confirm('Are you sure you want to delete this task? This action cannot be undone.')) {
      return
    }

    try {
      await axios.delete(`/api/tasks/${id}`)
      toast.success('Task deleted successfully')
      navigate('/tasks')
    } catch (error) {
      console.error('Error deleting task:', error)
      toast.error('Failed to delete task')
    }
  }

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800 border-red-200'
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'low': return 'bg-green-100 text-green-800 border-green-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800 border-green-200'
      case 'in-progress': return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'pending': return 'bg-gray-100 text-gray-800 border-gray-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-6 w-6 text-green-600" />
      case 'in-progress':
        return <PlayCircle className="h-6 w-6 text-blue-600" />
      default:
        return <Circle className="h-6 w-6 text-gray-400" />
    }
  }

  const canEdit = user?.role === 'admin' || task?.createdBy === user?.id || task?.assignedUserId === user?.id
  const canDelete = user?.role === 'admin' || task?.createdBy === user?.id

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="large" text="Loading task details..." />
      </div>
    )
  }

  if (!task) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Task not found</h1>
          <Link to="/tasks" className="btn btn-primary">
            Back to Tasks
          </Link>
        </div>
      </div>
    )
  }

  const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && task.status !== 'completed'

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center space-x-4">
          <Link
            to="/tasks"
            className="p-2 text-gray-400 hover:text-gray-600 transition-colors duration-200"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Task Details</h1>
            <p className="text-gray-600">View and manage task information</p>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          {canEdit && (
            <Link
              to={`/tasks/${id}/edit`}
              className="btn btn-secondary inline-flex items-center"
            >
              <Edit className="h-4 w-4 mr-2" />
              Edit
            </Link>
          )}
          {canDelete && (
            <button
              onClick={handleDeleteTask}
              className="btn btn-danger inline-flex items-center"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </button>
          )}
        </div>
      </div>

      {/* Task Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Title and Status */}
          <div className="card">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center space-x-3">
                {getStatusIcon(task.status)}
                <h2 className="text-2xl font-bold text-gray-900">{task.title}</h2>
              </div>
              
              <div className="flex items-center space-x-2">
                <span className={`px-3 py-1 rounded-full text-sm font-medium border ${getPriorityColor(task.priority)}`}>
                  {task.priority.charAt(0).toUpperCase() + task.priority.slice(1)} Priority
                </span>
                <span className={`px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(task.status)}`}>
                  {task.status.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                </span>
              </div>
            </div>

            {/* Status Change Buttons */}
            {canEdit && task.status !== 'completed' && (
              <div className="flex items-center space-x-2 mb-4">
                {task.status === 'pending' && (
                  <button
                    onClick={() => handleStatusChange('in-progress')}
                    className="btn btn-primary inline-flex items-center text-sm"
                  >
                    <PlayCircle className="h-4 w-4 mr-2" />
                    Start Task
                  </button>
                )}
                {task.status === 'in-progress' && (
                  <button
                    onClick={() => handleStatusChange('completed')}
                    className="btn btn-success inline-flex items-center text-sm"
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Mark Complete
                  </button>
                )}
                {task.status !== 'pending' && (
                  <button
                    onClick={() => handleStatusChange('pending')}
                    className="btn btn-secondary inline-flex items-center text-sm"
                  >
                    <Circle className="h-4 w-4 mr-2" />
                    Mark Pending
                  </button>
                )}
              </div>
            )}

            {/* Overdue Warning */}
            {isOverdue && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                <div className="flex items-center">
                  <AlertCircle className="h-5 w-5 text-red-600 mr-2" />
                  <span className="text-red-800 font-medium">This task is overdue</span>
                </div>
              </div>
            )}

            {/* Description */}
            {task.description && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Description</h3>
                <div className="prose max-w-none">
                  <p className="text-gray-700 whitespace-pre-wrap">{task.description}</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Task Information */}
          <div className="card">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Task Information</h3>
            
            <div className="space-y-4">
              {/* Due Date */}
              {task.dueDate && (
                <div className="flex items-center space-x-3">
                  <Calendar className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">Due Date</p>
                    <p className={`text-sm ${isOverdue ? 'text-red-600 font-medium' : 'text-gray-600'}`}>
                      {format(new Date(task.dueDate), 'MMMM dd, yyyy')}
                      {isOverdue && ' (Overdue)'}
                    </p>
                  </div>
                </div>
              )}

              {/* Assigned User */}
              {task.assignedUser && (
                <div className="flex items-center space-x-3">
                  <User className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">Assigned To</p>
                    <p className="text-sm text-gray-600">
                      {task.assignedUser.firstName} {task.assignedUser.lastName}
                    </p>
                    <p className="text-xs text-gray-500">{task.assignedUser.email}</p>
                  </div>
                </div>
              )}

              {/* Creator */}
              {task.creator && (
                <div className="flex items-center space-x-3">
                  <User className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">Created By</p>
                    <p className="text-sm text-gray-600">
                      {task.creator.firstName} {task.creator.lastName}
                    </p>
                    <p className="text-xs text-gray-500">{task.creator.email}</p>
                  </div>
                </div>
              )}

              {/* Created Date */}
              <div className="flex items-center space-x-3">
                <Clock className="h-5 w-5 text-gray-400" />
                <div>
                  <p className="text-sm font-medium text-gray-900">Created</p>
                  <p className="text-sm text-gray-600">
                    {format(new Date(task.createdAt), 'MMMM dd, yyyy \'at\' h:mm a')}
                  </p>
                </div>
              </div>

              {/* Last Updated */}
              {task.updatedAt !== task.createdAt && (
                <div className="flex items-center space-x-3">
                  <Clock className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">Last Updated</p>
                    <p className="text-sm text-gray-600">
                      {format(new Date(task.updatedAt), 'MMMM dd, yyyy \'at\' h:mm a')}
                    </p>
                  </div>
                </div>
              )}

              {/* Completed Date */}
              {task.completedAt && (
                <div className="flex items-center space-x-3">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">Completed</p>
                    <p className="text-sm text-gray-600">
                      {format(new Date(task.completedAt), 'MMMM dd, yyyy \'at\' h:mm a')}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default TaskDetail