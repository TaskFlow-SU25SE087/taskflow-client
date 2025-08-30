import { issueApi } from '@/api/issues'
import { useToastContext } from '@/components/ui/ToastContext'
import { CreateIssueRequest } from '@/types/issue'
import { useState } from 'react'

export const useIssues = () => {
  const [isLoading, setIsLoading] = useState(false)
  const [cache, setCache] = useState<{ [key: string]: { data: any; timestamp: number } }>({})
  const [lastLoadTime, setLastLoadTime] = useState<number>()
  const { showToast } = useToastContext()

  // Cache duration: 2 minutes (increased to reduce API calls)
  const CACHE_DURATION = 2 * 60 * 1000

  const createIssue = async (projectId: string, taskId: string, issueData: CreateIssueRequest): Promise<boolean> => {
    setIsLoading(true)

    try {
      const success = await issueApi.createIssue(projectId, taskId, issueData)

      if (success) {
        showToast({
          title: '✅ Issue Created Successfully!',
          description: `Issue has been created and will appear in the task details.`,
          variant: 'success'
        })
        return true
      } else {
        showToast({
          title: 'Error',
          description: 'Failed to create issue',
          variant: 'destructive'
        })
        return false
      }
    } catch (error) {
      showToast({
        title: 'Error',
        description: 'An error occurred while creating the issue',
        variant: 'destructive'
      })
      return false
    } finally {
      setIsLoading(false)
    }
  }

  const createProjectIssue = async (projectId: string, issueData: CreateIssueRequest): Promise<boolean> => {
    setIsLoading(true)

    try {
      const response = await issueApi.createProjectIssue(projectId, issueData)

      // Check if the response indicates success (code 200 or 0)
      if (response && (response.code === 200 || response.code === 0)) {
        showToast({
          title: 'Success',
          description: response.message || 'Issue created successfully',
          variant: 'success'
        })
        return true
      } else {
        showToast({
          title: 'Error',
          description: response?.message || 'Failed to create issue',
          variant: 'destructive'
        })
        return false
      }
    } catch (error) {
      showToast({
        title: 'Error',
        description: 'An error occurred while creating the issue',
        variant: 'destructive'
      })
      return false
    } finally {
      setIsLoading(false)
    }
  }

  const getTaskIssues = async (projectId: string, taskId: string) => {
    try {
      const result = await issueApi.getTaskIssues(projectId, taskId)
      return result
    } catch (error) {
      showToast({
        title: 'Error',
        description: 'Failed to fetch task issues',
        variant: 'destructive'
      })
      return []
    }
  }

  const getProjectIssues = async (projectId: string, forceRefresh = false) => {
    const startTime = Date.now()
    
    // Check cache first
    const cacheKey = `project-issues-${projectId}`
    const cached = cache[cacheKey]
    const now = Date.now()
    
    if (!forceRefresh && cached && (now - cached.timestamp) < CACHE_DURATION) {
      setLastLoadTime(0) // Cache hit
      return cached.data
    }
    
    setIsLoading(true)
    try {
      const result = await issueApi.getProjectIssues(projectId)
      const endTime = Date.now()
      const loadTime = endTime - startTime
      
      setLastLoadTime(loadTime)
      
      // Update cache
      setCache(prev => ({
        ...prev,
        [cacheKey]: { data: result, timestamp: now }
      }))
      
      return result
    } catch (error) {
      const endTime = Date.now()
      const loadTime = endTime - startTime
      setLastLoadTime(loadTime)
      
      showToast({
        title: 'Error',
        description: 'Failed to fetch project issues',
        variant: 'destructive'
      })
      return []
    } finally {
      setIsLoading(false)
    }
  }

  const getFilteredProjectIssues = async (projectId: string, filters: { status?: string; type?: string; priority?: string }) => {
    setIsLoading(true)
    try {
      const result = await issueApi.getFilteredProjectIssues(projectId, filters)
      return result
    } catch (error) {
      console.error('❌ [useIssues] getFilteredProjectIssues error:', error)
      showToast({
        title: 'Error',
        description: 'Failed to fetch filtered project issues',
        variant: 'destructive'
      })
      return []
    } finally {
      setIsLoading(false)
    }
  }

  return {
    createIssue,
    createProjectIssue,
    getTaskIssues,
    getProjectIssues,
    getFilteredProjectIssues,
    isLoading,
    lastLoadTime
  }
}
