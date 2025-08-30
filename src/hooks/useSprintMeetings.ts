import { sprintApi } from '@/api/sprints'
import { useToastContext } from '@/components/ui/ToastContext'
import { SprintMeeting, SprintMeetingDetail, SprintMeetingUpdateRequest, TaskUpdate } from '@/types/sprint'
import { useCallback, useEffect, useState } from 'react'

export const useSprintMeetings = (projectId: string) => {
  const [sprintMeetings, setSprintMeetings] = useState<SprintMeeting[]>([])
  const [taskUpdates, setTaskUpdates] = useState<TaskUpdate[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { showToast } = useToastContext()

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
      showToast({
        title: 'Error',
        description: err.message || 'Failed to fetch sprint meetings',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }, [projectId, showToast])

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
      showToast({
        title: 'Error',
        description: err.message || 'Failed to fetch task updates',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }, [projectId, showToast])

  // Get sprint meeting detail
  const getSprintMeetingDetail = useCallback(async (sprintMeetingId: string): Promise<SprintMeetingDetail | null> => {
    if (!projectId || !sprintMeetingId) return null
    
    try {
      const data = await sprintApi.getSprintMeetingDetail(projectId, sprintMeetingId)
      return data
    } catch (err: any) {
      showToast({
        title: 'Error',
        description: err.message || 'Failed to fetch sprint meeting detail',
        variant: 'destructive'
      })
      return null
    }
  }, [projectId, showToast])

  // Update sprint meeting task
  const updateSprintMeetingTask = useCallback(async (
    sprintMeetingId: string,
    taskId: string,
    itemVersion: number,
    taskData: {
      title: string
      description: string
      priority: string
      reason: string
    }
  ): Promise<boolean> => {
    if (!projectId) return false
    try {
      const result = await sprintApi.updateSprintMeetingTask(projectId, sprintMeetingId, taskId, itemVersion, taskData)
      
      if (result.success) {
        showToast({
          title: 'Success',
          description: 'Task reason updated successfully. Note: Title, description, and priority changes are saved locally only.',
          variant: 'success'
        })
        return true
      } else {
        // Handle version conflict
        if (result.message && result.message.includes('Someone has updated')) {
          showToast({
            title: 'Version Conflict',
            description: result.message,
            variant: 'warning'
          })
          
          // If we have new item version, we could potentially retry with the new version
          if (result.newItemVersion) {
            showToast({
              title: 'Info',
              description: `New version available: ${result.newItemVersion}. Please refresh and try again.`,
              variant: 'info'
            })
          }
        } else {
          showToast({
            title: 'Warning',
            description: result.message || 'Task update failed',
            variant: 'warning'
          })
        }
        return false
      }
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to update task'
      showToast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive'
      })
      return false
    }
  }, [projectId, showToast])

  // Update sprint meeting
  const updateSprintMeeting = useCallback(async (
    sprintMeetingId: string,
    data: SprintMeetingUpdateRequest
  ): Promise<boolean> => {
    if (!projectId) return false
    
    try {
      await sprintApi.updateSprintMeeting(projectId, sprintMeetingId, data)
      // Success toast will be handled by caller page to avoid duplicates
      return true
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to update sprint meeting'
      showToast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive'
      })
      return false
    }
  }, [projectId, showToast])

  // Update next plan
  const updateNextPlan = useCallback(async (
    sprintMeetingId: string,
    nextPlan: string
  ): Promise<boolean> => {
    if (!projectId) return false
    
    try {
      await sprintApi.updateNextPlan(projectId, sprintMeetingId, nextPlan)
      // Success toast will be handled by caller page to avoid duplicates
      return true
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to update next plan'
      showToast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive'
      })
      return false
    }
  }, [projectId, showToast])

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