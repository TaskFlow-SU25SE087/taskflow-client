import axiosClient from '@/configs/axiosClient'
import { CreateIssueRequest, IssueResponse, IssueStatus } from '@/types/issue'

export const issueApi = {
  // Create an issue for a specific task
  createIssue: async (projectId: string, taskId: string, issueData: CreateIssueRequest): Promise<IssueResponse> => {
    console.log('🚀 [issueApi] createIssue called with:', {
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
    console.log('📋 [issueApi] FormData contents:')
    for (const [key, value] of formData.entries()) {
      console.log(`  ${key}:`, value)
    }

    const url = `/projects/${projectId}/tasks/${taskId}/issues/create`
    console.log('🌐 [issueApi] Making request to:', url)
    console.log('🔗 [issueApi] Full URL:', `${axiosClient.defaults.baseURL}${url}`)

    try {
      console.log('⏳ [issueApi] Sending request...')
      const response = await axiosClient.post<IssueResponse>(url, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })

      console.log('✅ [issueApi] Response received:', response)
      console.log('📊 [issueApi] Response data:', response.data)

      return response.data
    } catch (error) {
      const err = error as any
      if (err.response && err.response.data && typeof err.response.data.code === 'number') {
        return err.response.data as IssueResponse
      }
      return { code: 500, message: 'Unknown error', data: false }
    }
  },

  // Get all issues for a task (if the backend supports this endpoint)
  getTaskIssues: async (projectId: string, taskId: string) => {
    console.log('🔍 [issueApi] getTaskIssues called with:', { projectId, taskId })
    try {
      const response = await axiosClient.get(`/projects/${projectId}/tasks/${taskId}/issues`)
      console.log('✅ [issueApi] getTaskIssues response:', response.data)
      return response.data.data
    } catch (error) {
      console.error('❌ [issueApi] getTaskIssues error:', error)
      throw error
    }
  },

  // Get all issues for a project (if the backend supports this endpoint)
  getProjectIssues: async (projectId: string) => {
    console.log('🔍 [issueApi] getProjectIssues called with:', { projectId })
    try {
      const response = await axiosClient.get(`/projects/${projectId}/issues`)
      console.log('✅ [issueApi] getProjectIssues response:', response.data)
      return response.data.data
    } catch (error) {
      console.error('❌ [issueApi] getProjectIssues error:', error)
      throw error
    }
  },

  // Get filtered issues for a project
  getFilteredProjectIssues: async (projectId: string, filters: { status?: string; type?: string; priority?: string }) => {
    console.log('🔍 [issueApi] getFilteredProjectIssues called with:', { projectId, ...filters })
    try {
      const params: any = {}
      if (filters.status) params.status = filters.status
      if (filters.type) params.type = filters.type
      if (filters.priority) params.priority = filters.priority
      const response = await axiosClient.get(`/projects/${projectId}/issues/filter`, { params })
      console.log('✅ [issueApi] getFilteredProjectIssues response:', response.data)
      return response.data.data
    } catch (error) {
      console.error('❌ [issueApi] getFilteredProjectIssues error:', error)
      throw error
    }
  }
}
