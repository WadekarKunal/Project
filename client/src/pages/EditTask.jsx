import React, { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import axios from 'axios'
import toast from 'react-hot-toast'
import { ArrowLeft, Save } from 'lucide-react'
import LoadingSpinner from '../components/LoadingSpinner'
import { useAuth } from '../contexts/AuthContext'

const EditTask = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const [task, setTask] = useState(null)
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const { register, handleSubmit, setValue, formState: { errors, isSubmitting } } = useForm()

  useEffect(() => {
    fetchTask()
    fetchUsers()
  }, [id])

  const fetchTask = async () => {
    try {
      const response = await axios.get(`/api/tasks/${id}`)
      const taskData = response.data.task
      setTask(taskData)

      // Set form values
      setValue('title', taskData.title)
      setValue('description', taskData.description || '')
      setValue('priority', taskData.priority)
      setValue('status', taskData.status)
      setValue('assignedUserId', taskData.assignedUserId || '')
      
      if (taskData.dueDate) {
        const dueDate = new Date(taskData.dueDate)
        setValue('dueDate', dueDate.toISOString().split('T')[0])
      }
    } catch (error) {
      console.error('Error fetching task:', error)
      if (error.response?.status === 404) {
        toast.error('Task not found')
        navigate('/tasks')
      } else if (error.response?.status === 403) {
        toast.error('You do not have permission to edit this task')
        navigate('/tasks')
      } else {
        toast.error('Failed to fetch task details')
      }
    } finally {
      setLoading(false)
    }
  }

  const fetchUsers = async () => {
    try {
      const response = await axios.get('/api/users')
      setUsers(response.data.users)
    } catch (error) {
      console.error('Error fetching users:', error)
    }
  }

  const onSubmit = async (data) => {
    try {
      setSaving(true)
      const taskData = {
        ...data,
        assignedUserId: data.assignedUserId || null,
        dueDate: data.dueDate || null
      }

      await axios.put(`/api/tasks/${id}`, taskData)
      toast.success('Task updated successfully!')
      navigate(`/tasks/${id}`)
    } catch (error) {
      console.error('Error updating task:', error)
      const message = error.response?.data?.message || 'Failed to update task'
      toast.error(message)
    } finally {
      setSaving(false)
    }
  }

  // Check permissions
  const canEdit = user?.role === 'admin' || task?.createdBy === user?.id || task?.assignedUserId === user?.id

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="large" text="Loading task..." />
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

  if (!canEdit) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h1>
          <p className="text-gray-600 mb-4">You do not have permission to edit this task.</p>
          <Link to="/tasks" className="btn btn-primary">
            Back to Tasks
          </Link>
        </div>
      </div>
    )
  }

  // Get today's date as minimum due date
  const today = new Date().toISOString().split('T')[0]

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex items-center space-x-4 mb-8">
        <Link
          to={`/tasks/${id}`}
          className="p-2 text-gray-400 hover:text-gray-600 transition-colors duration-200"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Edit Task</h1>
          <p className="text-gray-600">Update task information</p>
        </div>
      </div>

      {/* Form */}
      <div className="card">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Title */}
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
              Task Title *
            </label>
            <input
              {...register('title', {
                required: 'Task title is required',
                minLength: {
                  value: 3,
                  message: 'Title must be at least 3 characters'
                },
                maxLength: {
                  value: 200,
                  message: 'Title must be less than 200 characters'
                }
              })}
              type="text"
              className="input"
              placeholder="Enter task title"
            />
            {errors.title && (
              <p className="mt-1 text-sm text-red-600">{errors.title.message}</p>
            )}
          </div>

          {/* Description */}
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            <textarea
              {...register('description', {
                maxLength: {
                  value: 1000,
                  message: 'Description must be less than 1000 characters'
                }
              })}
              rows={4}
              className="input resize-none"
              placeholder="Enter task description (optional)"
            />
            {errors.description && (
              <p className="mt-1 text-sm text-red-600">{errors.description.message}</p>
            )}
          </div>

          {/* Status, Priority and Due Date Row */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Status */}
            <div>
              <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-2">
                Status
              </label>
              <select
                {...register('status')}
                className="input"
              >
                <option value="pending">Pending</option>
                <option value="in-progress">In Progress</option>
                <option value="completed">Completed</option>
              </select>
            </div>

            {/* Priority */}
            <div>
              <label htmlFor="priority" className="block text-sm font-medium text-gray-700 mb-2">
                Priority
              </label>
              <select
                {...register('priority')}
                className="input"
              >
                <option value="low">Low Priority</option>
                <option value="medium">Medium Priority</option>
                <option value="high">High Priority</option>
              </select>
            </div>

            {/* Due Date */}
            <div>
              <label htmlFor="dueDate" className="block text-sm font-medium text-gray-700 mb-2">
                Due Date
              </label>
              <input
                {...register('dueDate')}
                type="date"
                min={today}
                className="input"
              />
              <p className="mt-1 text-xs text-gray-500">
                Leave empty to remove due date
              </p>
            </div>
          </div>

          {/* Assigned User */}
          <div>
            <label htmlFor="assignedUserId" className="block text-sm font-medium text-gray-700 mb-2">
              Assign To
            </label>
            <select
              {...register('assignedUserId')}
              className="input"
            >
              <option value="">Unassigned</option>
              {users.map(user => (
                <option key={user.id} value={user.id}>
                  {user.firstName} {user.lastName} ({user.email})
                </option>
              ))}
            </select>
            <p className="mt-1 text-xs text-gray-500">
              Select a user to assign this task to
            </p>
          </div>

          {/* Form Actions */}
          <div className="flex items-center justify-end space-x-4 pt-6 border-t border-gray-200">
            <Link
              to={`/tasks/${id}`}
              className="btn btn-secondary"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={isSubmitting || saving}
              className="btn btn-primary inline-flex items-center"
            >
              {(isSubmitting || saving) ? (
                <>
                  <LoadingSpinner size="small" />
                  <span className="ml-2">Saving...</span>
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Save Changes
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default EditTask