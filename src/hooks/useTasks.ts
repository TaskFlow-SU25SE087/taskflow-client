import { TaskP } from '@/types/task'
import { useState, useEffect } from 'react'
import { useCurrentProject } from './useCurrentProject'
import { taskApi } from '@/api/tasks'

export const useTasks = () => {
  const [tasks, setTasks] = useState<TaskP[]>([])
  const [isTaskLoading, setIsTaskLoading] = useState(true)
  const [taskError, setTaskError] = useState<Error | null>(null)
  const { currentProject, isLoading: isProjectLoading } = useCurrentProject()

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
      await taskApi.createTask(projectId, newTask.title)
      // Refresh tasks after adding a new one
      const updatedTasks = await taskApi.getTasksFromProject(projectId)
      setTasks(updatedTasks)
    } catch (error) {
      setTaskError(error as Error)
      console.error('Failed to add task:', error)
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
