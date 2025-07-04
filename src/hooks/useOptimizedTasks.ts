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
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const { currentProject, isLoading: isProjectLoading } = useCurrentProject()

  const PAGE_SIZE = 50 // Load 50 tasks at a time

  const fetchTasks = useCallback(async (pageNum: number = 1, append: boolean = false) => {
    if (!currentProject || isProjectLoading) return
    
    setIsLoading(true)
    try {
      // For now, we'll fetch all tasks but in a real implementation,
      // you'd want to add pagination parameters to the API
      const fetchedTasks = await taskApi.getTasksFromProject(currentProject.id)
      
      // Transform to optimized format with only needed fields
      const optimizedTasks: OptimizedTaskP[] = fetchedTasks.map((task: TaskP) => ({
        id: task.id,
        title: task.title,
        description: task.description,
        status: task.status,
        updated: task.updated,
        assignee: task.assignee,
        tags: task.tags || [],
        commnets: task.commnets,
        attachmentUrlsList: task.attachmentUrlsList,
        boardId: task.boardId,
        projectId: task.projectId
      }))

      if (append) {
        setTasks(prev => [...prev, ...optimizedTasks])
      } else {
        setTasks(optimizedTasks)
      }
      
      setHasMore(optimizedTasks.length === PAGE_SIZE)
      setError(null)
    } catch (err) {
      setError(err as Error)
      console.error('Failed to fetch tasks:', err)
    } finally {
      setIsLoading(false)
    }
  }, [currentProject, isProjectLoading])

  const loadMore = useCallback(() => {
    if (!isLoading && hasMore) {
      setPage(prev => prev + 1)
      fetchTasks(page + 1, true)
    }
  }, [isLoading, hasMore, page, fetchTasks])

  const refreshTasks = useCallback(async () => {
    setPage(1)
    setHasMore(true)
    await fetchTasks(1, false)
  }, [fetchTasks])

  useEffect(() => {
    fetchTasks(1, false)
  }, [fetchTasks])

  return {
    tasks,
    isLoading,
    error,
    hasMore,
    loadMore,
    refreshTasks
  }
} 