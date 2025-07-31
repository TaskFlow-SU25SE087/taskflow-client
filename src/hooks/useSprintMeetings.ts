import { sprintApi } from '@/api/sprints'
import { useToast } from '@/hooks/use-toast'
import { SprintMeeting, SprintMeetingDetail, SprintMeetingUpdateRequest, TaskUpdate } from '@/types/sprint'
import { useCallback, useEffect, useState } from 'react'

export const useSprintMeetings = (projectId: string) => {
  const [sprintMeetings, setSprintMeetings] = useState<SprintMeeting[]>([])
  const [taskUpdates, setTaskUpdates] = useState<TaskUpdate[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { toast } = useToast()

  // Fetch sprint meetings
  const fetchSprintMeetings = useCallback(async () => {
    if (!projectId) return
    
    setLoading(true)
    setError(null)
    
    try {
      const data = await sprintApi.getSprintMeetings(projectId)
      setSprintMeetings(data)
    } catch (err: any) {
      setError(err.message || 'Failed to fetch sprint meetings')
      toast({
        title: 'Error',
        description: err.message || 'Failed to fetch sprint meetings',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }, [projectId, toast])

  // Fetch task updates
  const fetchTaskUpdates = useCallback(async () => {
    if (!projectId) return
    
    setLoading(true)
    setError(null)
    
    try {
      const data = await sprintApi.getTaskUpdates(projectId)
      setTaskUpdates(data)
    } catch (err: any) {
      setError(err.message || 'Failed to fetch task updates')
      toast({
        title: 'Error',
        description: err.message || 'Failed to fetch task updates',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }, [projectId, toast])

  // Get sprint meeting detail
  const getSprintMeetingDetail = useCallback(async (sprintMeetingId: string): Promise<SprintMeetingDetail | null> => {
    if (!projectId || !sprintMeetingId) return null
    
    try {
      const data = await sprintApi.getSprintMeetingDetail(projectId, sprintMeetingId)
      return data
    } catch (err: any) {
      toast({
        title: 'Error',
        description: err.message || 'Failed to fetch sprint meeting detail',
        variant: 'destructive'
      })
      return null
    }
  }, [projectId, toast])

  // Update sprint meeting task
  const updateSprintMeetingTask = useCallback(async (
    sprintMeetingId: string,
    taskId: string,
    itemVersion: number,
    reason: string
  ): Promise<boolean> => {
    if (!projectId) return false
    
    try {
      await sprintApi.updateSprintMeetingTask(projectId, sprintMeetingId, taskId, itemVersion, reason)
      toast({
        title: 'Success',
        description: 'Task updated successfully',
      })
      return true
    } catch (err: any) {
      toast({
        title: 'Error',
        description: err.message || 'Failed to update task',
        variant: 'destructive'
      })
      return false
    }
  }, [projectId, toast])

  // Update sprint meeting
  const updateSprintMeeting = useCallback(async (
    sprintMeetingId: string,
    data: SprintMeetingUpdateRequest
  ): Promise<boolean> => {
    if (!projectId) return false
    
    try {
      await sprintApi.updateSprintMeeting(projectId, sprintMeetingId, data)
      toast({
        title: 'Success',
        description: 'Sprint meeting updated successfully',
      })
      return true
    } catch (err: any) {
      toast({
        title: 'Error',
        description: err.message || 'Failed to update sprint meeting',
        variant: 'destructive'
      })
      return false
    }
  }, [projectId, toast])

  // Update next plan
  const updateNextPlan = useCallback(async (
    sprintMeetingId: string,
    nextPlan: string
  ): Promise<boolean> => {
    if (!projectId) return false
    
    try {
      await sprintApi.updateNextPlan(projectId, sprintMeetingId, nextPlan)
      toast({
        title: 'Success',
        description: 'Next plan updated successfully',
      })
      return true
    } catch (err: any) {
      toast({
        title: 'Error',
        description: err.message || 'Failed to update next plan',
        variant: 'destructive'
      })
      return false
    }
  }, [projectId, toast])

  // Load data on mount
  useEffect(() => {
    fetchSprintMeetings()
    fetchTaskUpdates()
  }, [fetchSprintMeetings, fetchTaskUpdates])

  return {
    sprintMeetings,
    taskUpdates,
    loading,
    error,
    fetchSprintMeetings,
    fetchTaskUpdates,
    getSprintMeetingDetail,
    updateSprintMeetingTask,
    updateSprintMeeting,
    updateNextPlan
  }
} 