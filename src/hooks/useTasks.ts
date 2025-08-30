import { taskApi } from '@/api/tasks'
import { useToastContext } from '@/components/ui/ToastContext'
import { APIError } from '@/types/api'
import { TaskP } from '@/types/task'
import { useEffect, useState } from 'react'
import { useCurrentProject } from './useCurrentProject'

export const useTasks = () => {
  const [tasks, setTasks] = useState<TaskP[]>([])
  const [isTaskLoading, setIsTaskLoading] = useState(true)
  const [taskError, setTaskError] = useState<Error | null>(null)
  const { currentProject, isLoading: isProjectLoading } = useCurrentProject()
  const { showToast } = useToastContext()

  useEffect(() => {
    const fetchTasks = async () => {
      if (!currentProject || isProjectLoading) return
      setIsTaskLoading(true)
      try {
        const fetchedTasks = await taskApi.getTasksFromProject(currentProject.id)
        setTasks(fetchedTasks)
        console.log(fetchedTasks)
        setTaskError(null)
      } catch (error) {
        setTaskError(error as Error)
        console.error('Failed to fetch tasks:', error)
      } finally {
        setIsTaskLoading(false)
      }
    }

    fetchTasks()
  }, [currentProject, isProjectLoading])

  const addTask = async (projectId: string, newTask: { type: string; title: string }) => {
    try {
      const formData = new FormData()
      formData.append('title', newTask.title)
      formData.append('type', newTask.type)
      
      const success = await taskApi.createTask(projectId, formData)
      showToast({
        title: success ? 'Success' : 'Error',
        description: success ? 'Task created successfully' : 'Failed to create task',
        variant: success ? 'success' : 'destructive'
      })
      
      // Refresh tasks after adding a new one
      if (success) {
        const updatedTasks = await taskApi.getTasksFromProject(projectId)
        setTasks(updatedTasks)
      }
    } catch (error) {
      const apiError = error as APIError
      setTaskError(new Error(apiError.response?.data?.message || apiError.message))
      showToast({
        title: 'Error',
        description: apiError.response?.data?.message || 'Failed to add task',
        variant: 'destructive'
      })
      throw error
    }
  }

  const refreshTasks = async () => {
    if (!currentProject) return
    setIsTaskLoading(true)
    try {
      const updatedTasks = await taskApi.getTasksFromProject(currentProject.id)
      setTasks(updatedTasks)
      setTaskError(null)
    } catch (error) {
      setTaskError(error as Error)
      console.error('Failed to refresh tasks:', error)
    } finally {
      setIsTaskLoading(false)
    }
  }

  const updateTaskStatusLocally = (taskId: string, newStatus: string) => {
    setTasks((prevTasks) => prevTasks.map((task) => (task.id === taskId ? { ...task, status: newStatus } : task)))
  }

  return {
    tasks,
    isTaskLoading,
    taskError,
    addTask,
    refreshTasks,
    updateTaskStatusLocally
  }
}
