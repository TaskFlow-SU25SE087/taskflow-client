import { sprintApi } from '@/api/sprints'
import { Sprint } from '@/types/sprint'
import { useCallback, useEffect, useState } from 'react'
import { useCurrentProject } from './useCurrentProject'

export const useSprints = () => {
  const [sprints, setSprints] = useState<Sprint[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  const { currentProject } = useCurrentProject()

  const fetchSprints = async () => {
    if (!currentProject || !currentProject.id) return
    setIsLoading(true)
    try {
      const data = await sprintApi.getAllSprintsByProjectId(currentProject.id)
      setSprints(data)
      setError(null)
    } catch (err) {
      setError(err as Error)
      setSprints([])
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchSprints()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentProject])

  const refreshSprints = fetchSprints

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
      const ok = await sprintApi.updateSprint(currentProject.id, sprintId, sprint)
      if (ok) await fetchSprints()
      return ok
    } catch (err) {
      setError(err as Error)
      return false
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

  // Alias fetchSprints cho bên ngoài sử dụng (có thể truyền projectId nếu cần)
  const fetchSprintsPublic = async (projectId?: string) => {
    const pid = projectId || currentProject?.id
    if (!pid) return
    setIsLoading(true)
    try {
      const data = await sprintApi.getAllSprintsByProjectId(pid)
      setSprints(data)
      setError(null)
    } catch (err) {
      setError(err as Error)
      setSprints([])
    } finally {
      setIsLoading(false)
    }
  }

  return {
    sprints,
    isLoading,
    error,
    refreshSprints,
    createSprint,
    updateSprint,
    updateSprintStatus,
    getSprintTasks,
    addTaskToSprint,
    fetchSprints: fetchSprintsPublic
  }
}
