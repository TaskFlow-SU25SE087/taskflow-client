import { issueApi } from '@/api/issues'
import { useToastContext } from '@/components/ui/ToastContext'
import { CreateIssueRequest } from '@/types/issue'
import { useState } from 'react'

export const useIssues = () => {
  const [isLoading, setIsLoading] = useState(false)
  const { showToast } = useToastContext()

  const createIssue = async (projectId: string, taskId: string, issueData: CreateIssueRequest): Promise<boolean> => {
      projectId,
      taskId,
      issueData
    })

    setIsLoading(true)

    try {
      const success = await issueApi.createIssue(projectId, taskId, issueData)


      if (success) {
        showToast({
          title: 'Success',
          description: 'Issue created successfully',
          variant: 'default'
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
      console.error('💥 [useIssues] Exception caught:', error)
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
    try {
      const result = await issueApi.getProjectIssues(projectId)
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
