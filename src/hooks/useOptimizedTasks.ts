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
  commnets?: { // Note: This is intentionally misspelled to match TaskP interface
    commenter: string
    content: string
    avatar: string
    attachmentUrls: string[]
    lastUpdate: string
  }[]
  attachmentUrl?: string
  completionAttachmentUrls?: string[]
  boardId: string | null
  projectId: string
  sprint?: any | null // Added to check sprint status
  sprintId?: string | null
  sprintName?: string
}

export const useOptimizedTasks = () => {
  const [tasks, setTasks] = useState<OptimizedTaskP[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const [hasMore, setHasMore] = useState(false)
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
          !task.sprint
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
          attachmentUrl: task.attachmentUrl,
          completionAttachmentUrls: task.completionAttachmentUrls,
          boardId: typeof task.boardId === 'undefined' ? null : task.boardId,
          projectId: typeof task.projectId === 'undefined' ? '' : task.projectId,
          sprintId: task.sprintId,
          sprintName: task.sprint?.name,
          sprint: task.sprint
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

  // For now just return all tasks at once since the API doesn't support pagination
  const loadMore = useCallback(async () => {
    if (!currentProject || isLoading) return
    await fetchTasks()
    setHasMore(false) // No more tasks to load
  }, [currentProject, isLoading, fetchTasks])

  useEffect(() => {
    fetchTasks()
  }, [fetchTasks])

  return {
    tasks,
    isLoading,
    error,
    refreshTasks: fetchTasks,
    loadMore,
    hasMore
  }
}
