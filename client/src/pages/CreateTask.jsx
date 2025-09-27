import React, { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import axios from 'axios'
import toast from 'react-hot-toast'
import { ArrowLeft, Save } from 'lucide-react'
import LoadingSpinner from '../components/LoadingSpinner'

const CreateTask = () => {
  const navigate = useNavigate()
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(false)
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm()

  useEffect(() => {
    fetchUsers()
  }, [])

  const fetchUsers = async () => {
    try {
      const response = await axios.get('/api/users')
      setUsers(response.data.users)
    } catch (error) {
      console.error('Error fetching users:', error)
      toast.error('Failed to fetch users')
    }
  }

  const onSubmit = async (data) => {
    try {
      setLoading(true)
      const taskData = {
        ...data,
        assignedUserId: data.assignedUserId || null,
        dueDate: data.dueDate || null
      }

      const response = await axios.post('/api/tasks', taskData)
      toast.success('Task created successfully!')
      navigate(`/tasks/${response.data.task.id}`)
    } catch (error) {
      console.error('Error creating task:', error)
      const message = error.response?.data?.message || 'Failed to create task'
      toast.error(message)
    } finally {
      setLoading(false)
    }
  }

  // Get tomorrow's date as minimum due date
  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)
  const minDate = tomorrow.toISOString().split('T')[0]

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex items-center space-x-4 mb-8">
        <Link
          to="/tasks"
          className="p-2 text-gray-400 hover:text-gray-600 transition-colors duration-200"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Create New Task</h1>
          <p className="text-gray-600">Add a new task to your workflow</p>
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

          {/* Priority and Due Date Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                <option value="medium" selected>Medium Priority</option>
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
                min={minDate}
                className="input"
              />
              <p className="mt-1 text-xs text-gray-500">
                Optional - Leave empty if no due date
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
              <option value="">Select a user (optional)</option>
              {users.map(user => (
                <option key={user.id} value={user.id}>
                  {user.firstName} {user.lastName} ({user.email})
                </option>
              ))}
            </select>
            <p className="mt-1 text-xs text-gray-500">
              Optional - Leave unassigned if not assigning to a specific user
            </p>
          </div>

          {/* Form Actions */}
          <div className="flex items-center justify-end space-x-4 pt-6 border-t border-gray-200">
            <Link
              to="/tasks"
              className="btn btn-secondary"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={isSubmitting || loading}
              className="btn btn-primary inline-flex items-center"
            >
              {(isSubmitting || loading) ? (
                <>
                  <LoadingSpinner size="small" />
                  <span className="ml-2">Creating...</span>
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Create Task
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default CreateTask