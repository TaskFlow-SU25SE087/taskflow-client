import { issueApi } from '@/api/issues'
import { useToastContext } from '@/components/ui/ToastContext'
import { CreateIssueRequest } from '@/types/issue'
import { useState } from 'react'

export const useIssues = () => {
  const [isLoading, setIsLoading] = useState(false)
  const { showToast } = useToastContext()

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

  const getProjectIssues = async (projectId: string) => {
    console.log('🔍 [useIssues] getProjectIssues called with:', { projectId })
    try {
      const result = await issueApi.getProjectIssues(projectId)
      console.log('✅ [useIssues] getProjectIssues result:', result)
      return result
    } catch (error) {
      console.error('❌ [useIssues] getProjectIssues error:', error)
      showToast({
        title: 'Error',
        description: 'Failed to fetch project issues',
        variant: 'destructive'
      })
      return []
    }
  }

  return {
    createIssue,
    getTaskIssues,
    getProjectIssues,
    isLoading
  }
}
