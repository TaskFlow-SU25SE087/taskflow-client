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
    console.log('🎯 [useIssues] createIssue called with:', {
      projectId,
      taskId,
      issueData
    })

    setIsLoading(true)
    console.log('⏳ [useIssues] Setting loading to true')

    try {
      console.log('📞 [useIssues] Calling issueApi.createIssue...')
      const success = await issueApi.createIssue(projectId, taskId, issueData)

      console.log('📊 [useIssues] API call result:', success)

      if (success) {
        console.log('✅ [useIssues] Issue created successfully, showing success toast')
        showToast({
          title: 'Success',
          description: 'Issue created successfully',
          variant: 'default'
        })
        return true
      } else {
        console.log('❌ [useIssues] API returned false, showing error toast')
        showToast({
          title: 'Error',
          description: 'Failed to create issue',
          variant: 'destructive'
        })
        return false
      }
    } catch (error) {
      console.error('💥 [useIssues] Exception caught:', error)
      showToast({
        title: 'Error',
        description: 'An error occurred while creating the issue',
        variant: 'destructive'
      })
      return false
    } finally {
      console.log('🏁 [useIssues] Setting loading to false')
      setIsLoading(false)
    }
  }

  const createProjectIssue = async (projectId: string, issueData: CreateIssueRequest): Promise<boolean> => {
    console.log('🎯 [useIssues] createProjectIssue called with:', {
      projectId,
      issueData
    })

    setIsLoading(true)
    console.log('⏳ [useIssues] Setting loading to true')

    try {
      console.log('📞 [useIssues] Calling issueApi.createProjectIssue...')
      const response = await issueApi.createProjectIssue(projectId, issueData)

      console.log('📊 [useIssues] API call result:', response)

      // Check if the response indicates success (code 200 or 0)
      if (response && (response.code === 200 || response.code === 0)) {
        console.log('✅ [useIssues] Project issue created successfully, showing success toast')
        showToast({
          title: 'Success',
          description: response.message || 'Issue created successfully',
          variant: 'default'
        })
        return true
      } else {
        console.log('❌ [useIssues] API returned error, showing error toast')
        showToast({
          title: 'Error',
          description: response?.message || 'Failed to create issue',
          variant: 'destructive'
        })
        return false
      }
    } catch (error) {
      console.error('💥 [useIssues] Exception caught:', error)
      showToast({
        title: 'Error',
        description: 'An error occurred while creating the issue',
        variant: 'destructive'
      })
      return false
    } finally {
      console.log('🏁 [useIssues] Setting loading to false')
      setIsLoading(false)
    }
  }

  const getTaskIssues = async (projectId: string, taskId: string) => {
    console.log('🔍 [useIssues] getTaskIssues called with:', { projectId, taskId })
    try {
      const result = await issueApi.getTaskIssues(projectId, taskId)
      console.log('✅ [useIssues] getTaskIssues result:', result)
      return result
    } catch (error) {
      console.error('❌ [useIssues] getTaskIssues error:', error)
      showToast({
        title: 'Error',
        description: 'Failed to fetch task issues',
        variant: 'destructive'
      })
      return []
    }
  }

  const getProjectIssues = async (projectId: string, forceRefresh = false) => {
    console.log('🔍 [useIssues] getProjectIssues called with:', { projectId, forceRefresh })
    
    const startTime = Date.now()
    
    // Check cache first
    const cacheKey = `project-issues-${projectId}`
    const cached = cache[cacheKey]
    const now = Date.now()
    
    if (!forceRefresh && cached && (now - cached.timestamp) < CACHE_DURATION) {
      console.log('📦 [useIssues] Returning cached data')
      setLastLoadTime(0) // Cache hit
      return cached.data
    }
    
    setIsLoading(true)
    try {
      const result = await issueApi.getProjectIssues(projectId)
      const endTime = Date.now()
      const loadTime = endTime - startTime
      
      console.log(`✅ [useIssues] getProjectIssues result in ${loadTime}ms:`, result)
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
      console.error(`❌ [useIssues] getProjectIssues error after ${loadTime}ms:`, error)
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
