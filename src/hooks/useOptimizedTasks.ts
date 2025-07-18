import { taskApi } from '@/api/tasks'
import { TaskP } from '@/types/task'
import { useCallback, useEffect, useState } from 'react'
import { useCurrentProject } from './useCurrentProject'

interface OptimizedTaskP {
  id: string
  title: string
  description: string
  status: string
  updated: string
  assignee: any | null
  tags: any[]
  commnets?: any[]
  attachmentUrlsList?: string[]
  boardId: string | null
  projectId: string
}

export const useOptimizedTasks = () => {
  const [tasks, setTasks] = useState<OptimizedTaskP[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const { currentProject, isLoading: isProjectLoading } = useCurrentProject()

  const fetchTasks = useCallback(async () => {
    if (!currentProject || isProjectLoading) return
    setIsLoading(true)
    try {
      const fetchedTasks = await taskApi.getTasksFromProject(currentProject.id)
      const optimizedTasks: OptimizedTaskP[] = fetchedTasks
        .filter((task: TaskP) =>
          !task.sprintId ||
          task.sprintId === '' ||
          task.sprintId === null ||
          task.sprintId === undefined ||
          task.sprintId === '00000000-0000-0000-0000-000000000000' ||
          (task.sprintName && task.sprintName.toLowerCase() === 'no sprint')
        ) // chỉ lấy backlog
        .map((task: TaskP) => ({
          id: task.id,
          title: task.title,
          description: task.description,
          status: task.status,
          updated: task.updated,
          assignee: task.assignee,
          tags: task.tags || [],
          commnets: task.commnets,
          attachmentUrlsList: task.attachmentUrlsList,
          boardId: typeof task.boardId === 'undefined' ? null : task.boardId,
          projectId: typeof task.projectId === 'undefined' ? '' : task.projectId
        }))
      setTasks(optimizedTasks)
      setError(null)
    } catch (err) {
      setError(err as Error)
      console.error('Failed to fetch tasks:', err)
    } finally {
      setIsLoading(false)
    }
  }, [currentProject, isProjectLoading])

  useEffect(() => {
    fetchTasks()
  }, [fetchTasks])

  return {
    tasks,
    isLoading,
    error,
    refreshTasks: fetchTasks
  }
}
