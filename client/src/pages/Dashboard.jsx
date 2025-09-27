import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import axios from 'axios'
import { useAuth } from '../contexts/AuthContext'
import { SquareCheck as CheckSquare, Clock, CircleAlert as AlertCircle, Users, Plus, TrendingUp, Calendar } from 'lucide-react'
import LoadingSpinner from '../components/LoadingSpinner'
import TaskCard from '../components/TaskCard'

const Dashboard = () => {
  const { user } = useAuth()
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    inProgress: 0,
    completed: 0,
    overdue: 0
  })
  const [recentTasks, setRecentTasks] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      setLoading(true)
      
      // Fetch recent tasks
      const tasksResponse = await axios.get('/api/tasks?limit=5')
      const tasks = tasksResponse.data.tasks
      
      setRecentTasks(tasks)
      
      // Calculate stats
      const now = new Date()
      const statsData = {
        total: tasks.length,
        pending: tasks.filter(task => task.status === 'pending').length,
        inProgress: tasks.filter(task => task.status === 'in-progress').length,
        completed: tasks.filter(task => task.status === 'completed').length,
        overdue: tasks.filter(task => 
          task.dueDate && 
          new Date(task.dueDate) < now && 
          task.status !== 'completed'
        ).length
      }
      
      setStats(statsData)
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  const statCards = [
    {
      title: 'Total Tasks',
      value: stats.total,
      icon: CheckSquare,
      color: 'bg-blue-500',
      bgColor: 'bg-blue-50',
      textColor: 'text-blue-600'
    },
    {
      title: 'Pending',
      value: stats.pending,
      icon: Clock,
      color: 'bg-yellow-500',
      bgColor: 'bg-yellow-50',
      textColor: 'text-yellow-600'
    },
    {
      title: 'In Progress',
      value: stats.inProgress,
      icon: TrendingUp,
      color: 'bg-blue-500',
      bgColor: 'bg-blue-50',
      textColor: 'text-blue-600'
    },
    {
      title: 'Completed',
      value: stats.completed,
      icon: CheckSquare,
      color: 'bg-green-500',
      bgColor: 'bg-green-50',
      textColor: 'text-green-600'
    },
    {
      title: 'Overdue',
      value: stats.overdue,
      icon: AlertCircle,
      color: 'bg-red-500',
      bgColor: 'bg-red-50',
      textColor: 'text-red-600'
    }
  ]

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="large" text="Loading dashboard..." />
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Welcome Section */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">
          Welcome back, {user?.firstName}!
        </h1>
        <p className="mt-2 text-gray-600">
          Here's what's happening with your tasks today.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
        {statCards.map((stat, index) => {
          const Icon = stat.icon
          return (
            <div key={index} className={`card ${stat.bgColor} border-l-4 border-l-${stat.color.split('-')[1]}-500`}>
              <div className="flex items-center">
                <div className={`p-3 rounded-lg ${stat.color}`}>
                  <Icon className="h-6 w-6 text-white" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                  <p className={`text-2xl font-bold ${stat.textColor}`}>{stat.value}</p>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <Link
          to="/tasks/create"
          className="card hover:shadow-md transition-shadow duration-200 border-2 border-dashed border-gray-300 hover:border-primary-400"
        >
          <div className="text-center py-6">
            <Plus className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Create New Task</h3>
            <p className="text-gray-600">Add a new task to your workflow</p>
          </div>
        </Link>

        <Link
          to="/tasks"
          className="card hover:shadow-md transition-shadow duration-200 bg-primary-50 border-primary-200"
        >
          <div className="text-center py-6">
            <CheckSquare className="h-12 w-12 text-primary-600 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">View All Tasks</h3>
            <p className="text-gray-600">Manage and organize your tasks</p>
          </div>
        </Link>

        {user?.role === 'admin' && (
          <Link
            to="/users"
            className="card hover:shadow-md transition-shadow duration-200 bg-green-50 border-green-200"
          >
            <div className="text-center py-6">
              <Users className="h-12 w-12 text-green-600 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Manage Users</h3>
              <p className="text-gray-600">View and manage system users</p>
            </div>
          </Link>
        )}
      </div>

      {/* Recent Tasks */}
      <div className="card">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900">Recent Tasks</h2>
          <Link
            to="/tasks"
            className="text-primary-600 hover:text-primary-700 font-medium text-sm"
          >
            View all tasks →
          </Link>
        </div>

        {recentTasks.length > 0 ? (
          <div className="space-y-4">
            {recentTasks.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                showActions={false}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No tasks yet</h3>
            <p className="text-gray-600 mb-4">Get started by creating your first task</p>
            <Link
              to="/tasks/create"
              className="btn btn-primary"
            >
              Create Task
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}

export default Dashboard