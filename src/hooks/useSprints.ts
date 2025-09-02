import { sprintApi } from '@/api/sprints'
import { Sprint } from '@/types/sprint'
import { useCallback, useEffect, useRef, useState } from 'react'
import { useCurrentProject } from './useCurrentProject'

export const useSprints = () => {
  const [sprints, setSprints] = useState<Sprint[]>([])
  const [isLoading, setIsLoading] = useState(false) // initial page-level loading
  const [isRefreshing, setIsRefreshing] = useState(false)
  // Tracks whether we've completed the very first load attempt for the current project
  const [didInitialLoad, setDidInitialLoad] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  const { currentProject } = useCurrentProject()
  const lastProjectIdRef = useRef<string | undefined>(undefined)
  const inFlightRef = useRef<boolean>(false)

  const fetchSprints = async () => {
    if (!currentProject || !currentProject.id) return
    if (!didInitialLoad) {
      setIsLoading(true)
    } else {
      setIsRefreshing(true)
    }
    try {
      const data = await sprintApi.getAllSprintsByProjectId(currentProject.id)
      setSprints(data)
      setError(null)
    } catch (err) {
      setError(err as Error)
      setSprints([])
    } finally {
      setIsLoading(false)
      setIsRefreshing(false)
      setDidInitialLoad(true)
    }
  }

  useEffect(() => {
    const projectId = currentProject?.id
    if (!projectId) return
    if (lastProjectIdRef.current === projectId || inFlightRef.current) return
    lastProjectIdRef.current = projectId
    fetchSprints()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentProject?.id])

  const refreshSprints = async () => {
    if (!currentProject?.id) return
    if (inFlightRef.current) return
    inFlightRef.current = true
    try {
      await fetchSprints()
    } finally {
      inFlightRef.current = false
    }
  }

  const createSprint = async (sprint: {
    name: string
    description: string
    startDate: string
    endDate: string
    status: string | number
  }) => {
    if (!currentProject || !currentProject.id) return { ok: false, message: 'No project selected' }
    setIsLoading(true)
    try {
      const ok = await sprintApi.createSprint(currentProject.id, {
        name: sprint.name,
        description: sprint.description,
        startDate: sprint.startDate,
        endDate: sprint.endDate,
        status: String(sprint.status)
      })
      if (ok) await fetchSprints()
      return { ok: true }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      setError(err as Error)
      const message = err?.response?.data?.message || 'Failed to create sprint. Please try again.'
      return { ok: false, message }
    } finally {
      setIsLoading(false)
    }
  }

  const updateSprint = async (
    sprintId: string,
    sprint: { name: string; description: string; startDate: string; endDate: string; status: string }
  ) => {
    if (!currentProject || !currentProject.id) return false
    setIsLoading(true)
    try {
      // Map canonical textual statuses to backend compatible codes if backend still expects numeric or same string.
      const mapStatus = (val: string): string => {
        const v = String(val)
        const map: Record<string, string> = {
          NotStarted: '0',
          InProgress: '10000',
          Completed: '20000'
        }
        return map[v] || v
      }
      const payload = { ...sprint, status: mapStatus(sprint.status) }
      const ok = await sprintApi.updateSprint(currentProject.id, sprintId, payload)
      if (ok) {
        await fetchSprints()
        return ok
      } else {
        throw new Error('Failed to update sprint')
      }
    } catch (err) {
      setError(err as Error)
      throw err // Re-throw to allow component to handle with toast
    } finally {
      setIsLoading(false)
    }
  }

  const updateSprintStatus = async (sprintId: string, status: string) => {
    if (!currentProject || !currentProject.id) return false
    setIsLoading(true)
    try {
      const ok = await sprintApi.updateSprintStatus(currentProject.id, sprintId, status)
      if (ok) await fetchSprints()
      return ok
    } catch (err) {
      setError(err as Error)
      return false
    } finally {
      setIsLoading(false)
    }
  }

  // Lấy tasks của 1 sprint (cần cả projectId và sprintId)
  const getSprintTasks = useCallback(
    async (sprintId: string, projectId?: string) => {
      const pid = projectId || currentProject?.id
      if (!pid) return []
      // Đảm bảo truyền đúng thứ tự projectId, sprintId cho API
      return sprintApi.getSprintTasks(pid, sprintId)
    },
    [currentProject?.id]
  )

  // Gán 1 task vào sprint
  const addTaskToSprint = async (sprintId: string, taskId: string) => {
    if (!currentProject || !currentProject.id) return false
    // API nhận mảng taskIds
    return sprintApi.assignTasksToSprint(currentProject.id, sprintId, [taskId])
  }

  const deleteSprint = async (sprintId: string) => {
    if (!currentProject || !currentProject.id) return false
    setIsLoading(true)
    try {
      const ok = await sprintApi.deleteSprint(currentProject.id, sprintId)
      if (ok) await fetchSprints()
      return ok
    } catch (err) {
      setError(err as Error)
      return false
    } finally {
      setIsLoading(false)
    }
  }

  // Alias fetchSprints cho bên ngoài sử dụng (có thể truyền projectId nếu cần)
  const fetchSprintsPublic = async (projectId?: string) => {
    const pid = projectId || currentProject?.id
    if (!pid) return
    if (!didInitialLoad) {
      setIsLoading(true)
    } else {
      setIsRefreshing(true)
    }
    try {
      const data = await sprintApi.getAllSprintsByProjectId(pid)
      setSprints(data)
      setError(null)
    } catch (err) {
      setError(err as Error)
      setSprints([])
    } finally {
      setIsLoading(false)
      setIsRefreshing(false)
      setDidInitialLoad(true)
    }
  }

  return {
    sprints,
    isLoading,
    isRefreshing,
    didInitialLoad,
    error,
    refreshSprints,
    createSprint,
    updateSprint,
    updateSprintStatus,
    getSprintTasks,
    addTaskToSprint,
    deleteSprint,
    fetchSprints: fetchSprintsPublic
  }
}
