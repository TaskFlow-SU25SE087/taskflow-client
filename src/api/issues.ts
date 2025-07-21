import axiosClient from '@/configs/axiosClient'
import { CreateIssueRequest, IssueResponse, IssueStatus } from '@/types/issue'

export const issueApi = {
  // Create an issue for a specific task
  createIssue: async (projectId: string, taskId: string, issueData: CreateIssueRequest): Promise<boolean> => {
      projectId,
      taskId,
      issueData
    })

    const formData = new FormData()

    // Add all the required fields to FormData
    formData.append('Title', issueData.title)
    formData.append('Description', issueData.description)
    formData.append('Priority', issueData.priority.toString())
    formData.append('Type', issueData.type.toString())
    formData.append('Status', IssueStatus.Open.toString()) // Default status is Open

    // Add optional fields if provided
    if (issueData.explanation) {
      formData.append('Explanation', issueData.explanation)
    }
    if (issueData.example) {
      formData.append('Example', issueData.example)
    }

    // Add files if provided
    if (issueData.files && issueData.files.length > 0) {
      issueData.files.forEach((file) => {
        formData.append('Files', file)
      })
    }

    // Log FormData contents
    for (const [key, value] of formData.entries()) {
    }

    const url = `/projects/${projectId}/tasks/${taskId}/issues/create`

    try {
      const response = await axiosClient.post<IssueResponse>(url, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })


      const success = response.status === 200
      return success
    } catch (error) {
      console.error('❌ [issueApi] Error creating issue:', error)

      if (error.response) {
        console.error('📡 [issueApi] Error response:', error.response)
        console.error('📊 [issueApi] Error response data:', error.response.data)
        console.error('🔢 [issueApi] Error status:', error.response.status)
      } else if (error.request) {
        console.error('🌐 [issueApi] No response received:', error.request)
      } else {
        console.error('⚙️ [issueApi] Request setup error:', error.message)
      }

      throw error
    }
  },

  // Get all issues for a task (if the backend supports this endpoint)
  getTaskIssues: async (projectId: string, taskId: string) => {
    try {
      const response = await axiosClient.get(`/projects/${projectId}/tasks/${taskId}/issues`)
      return response.data.data
    } catch (error) {
      console.error('❌ [issueApi] getTaskIssues error:', error)
      throw error
    }
  },

  // Get all issues for a project (if the backend supports this endpoint)
  getProjectIssues: async (projectId: string) => {
    try {
      const response = await axiosClient.get(`/projects/${projectId}/issues`)
      return response.data.data
    } catch (error) {
      console.error('❌ [issueApi] getProjectIssues error:', error)
      throw error
    }
  }
}
