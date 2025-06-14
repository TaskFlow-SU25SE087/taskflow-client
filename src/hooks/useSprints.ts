import { useState, useCallback, useEffect } from 'react'
import { Sprint } from '@/types/sprint'
import { sprintApi } from '@/api/sprints'
import { TaskP } from '@/types/task'

interface UseSprintsHook {
  sprints: Sprint[]
  isLoading: boolean
  error: Error | null
  fetchSprints: (projectId?: string) => Promise<void>
  createSprint: (projectId: string, name: string) => Promise<Sprint>
  getSprint: (sprintId: string) => Promise<Sprint>
  getSprintTasks: (sprintId: string) => Promise<TaskP[]>
  addTaskToSprint: (sprintId: string, taskId: string) => Promise<void>
  startSprint: (sprintId: string, startDate: string, endDate: string) => Promise<void>
  completeSprint: (sprintId: string) => Promise<void>
}

export const useSprints = (initialProjectId?: string): UseSprintsHook => {
  const [sprints, setSprints] = useState<Sprint[]>([])
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [error, setError] = useState<Error | null>(null)

  const fetchSprints = useCallback(async (projectId?: string) => {
    setIsLoading(true)
    setError(null)
    try {
      const fetchedSprints = projectId
        ? await sprintApi.getAllSprintByProjectId(projectId)
        : await sprintApi.getAllSprints()
      setSprints(fetchedSprints)
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch sprints'))
    } finally {
      setIsLoading(false)
    }
  }, [])

  const createSprint = useCallback(async (projectId: string, name: string) => {
    try {
      const newSprint = await sprintApi.createSprint(projectId, name)
      setSprints((prevSprints) => [...prevSprints, newSprint])
      return newSprint
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to create sprint'))
      throw err
    }
  }, [])

  const getSprint = useCallback(async (sprintId: string) => {
    try {
      return await sprintApi.getSprintById(sprintId)
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to get sprint'))
      throw err
    }
  }, [])

  const getSprintTasks = useCallback(async (sprintId: string) => {
    try {
      const sprint = await sprintApi.getSprintById(sprintId)
      return sprint.taskPs
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to get sprint tasks'))
      throw err
    }
  }, [])

  const addTaskToSprint = useCallback(async (sprintId: string, taskId: string) => {
    try {
      await sprintApi.addTaskToSprint(sprintId, taskId)
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to add task to sprint'))
      throw err
    }
  }, [])

  const startSprint = useCallback(
    async (sprintId: string, startDate: string, endDate: string) => {
      try {
        await sprintApi.startSprint(sprintId, startDate, endDate)
        await fetchSprints(initialProjectId)
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to start sprint'))
        throw err
      }
    },
    [fetchSprints, initialProjectId]
  )

  const completeSprint = useCallback(
    async (sprintId: string) => {
      try {
        await sprintApi.endSprint(sprintId)
        await fetchSprints(initialProjectId)
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to complete sprint'))
        throw err
      }
    },
    [fetchSprints, initialProjectId]
  )

  useEffect(() => {
    if (initialProjectId) {
      fetchSprints(initialProjectId)
    }
  }, [initialProjectId, fetchSprints])

  return {
    sprints,
    isLoading,
    error,
    fetchSprints,
    createSprint,
    getSprint,
    getSprintTasks,
    addTaskToSprint,
    startSprint,
    completeSprint
  }
}
