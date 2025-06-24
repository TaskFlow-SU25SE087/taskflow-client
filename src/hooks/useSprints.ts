import { useEffect, useState } from 'react'
import { sprintApi } from '@/api/sprints'
import { Sprint } from '@/types/sprint'
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

  const createSprint = async (sprint: { name: string; description: string; startDate: string; endDate: string }) => {
    if (!currentProject || !currentProject.id) return false
    setIsLoading(true)
    try {
      const ok = await sprintApi.createSprint(currentProject.id, sprint)
      if (ok) await fetchSprints()
      return ok
    } catch (err) {
      setError(err as Error)
      return false
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

  return {
    sprints,
    isLoading,
    error,
    refreshSprints,
    createSprint,
    updateSprint
  }
}
