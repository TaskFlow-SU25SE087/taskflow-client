/* eslint-disable @typescript-eslint/no-explicit-any */
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

    // Convert numeric priority to string
    const priorityString =
      issueData.priority === 0
        ? 'Low'
        : issueData.priority === 10000
          ? 'Medium'
          : issueData.priority === 20000
            ? 'High'
            : issueData.priority === 30000
              ? 'Urgent'
              : 'Medium'
    formData.append('Priority', priorityString)

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

  // Create an issue for a project (using default task)
  createProjectIssue: async (projectId: string, issueData: CreateIssueRequest): Promise<IssueResponse> => {
    console.log('🚀 [issueApi] createProjectIssue called with:', {
      projectId,
      issueData
    })

    // Get the first task from the project to use for creating issue
    let taskId = '00000000-0000-0000-0000-000000000000' // Default placeholder
    try {
      const tasksResponse = await axiosClient.get(`/projects/${projectId}/tasks`)
      const tasks = tasksResponse.data?.data || []
      if (tasks.length > 0) {
        taskId = tasks[0].id
        console.log('✅ [issueApi] Found task to use:', taskId)
      } else {
        console.log('⚠️ [issueApi] No tasks found in project, using placeholder taskId')
      }
    } catch (error) {
      console.log('⚠️ [issueApi] Failed to get tasks from project, using placeholder taskId:', error)
    }

    const formData = new FormData()

    // Add all the required fields to FormData
    formData.append('Title', issueData.title)
    formData.append('Description', issueData.description)

    // Convert numeric priority to string
    const priorityString2 =
      issueData.priority === 0
        ? 'Low'
        : issueData.priority === 10000
          ? 'Medium'
          : issueData.priority === 20000
            ? 'High'
            : issueData.priority === 30000
              ? 'Urgent'
              : 'Medium'
    formData.append('Priority', priorityString2)

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
    const startTime = Date.now()

    try {
      const response = await axiosClient.get(`/projects/${projectId}/issues`, {
        timeout: 5000 // Reduced to 5 seconds for much faster feedback
      })
      const endTime = Date.now()
      const loadTime = endTime - startTime
      console.log(`✅ [issueApi] getProjectIssues response in ${loadTime}ms:`, response.data)

      // Log performance warning if too slow
      if (loadTime > 3000) {
        console.warn(`⚠️ [issueApi] Slow response: ${loadTime}ms. Consider optimizing backend.`)
      }

      return response.data.data
    } catch (error: any) {
      const endTime = Date.now()
      const loadTime = endTime - startTime
      console.error(`❌ [issueApi] getProjectIssues error after ${loadTime}ms:`, error)

      // Handle specific error types
      if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
        console.error('⏰ [issueApi] Request timeout after 5s. Server is very slow.')
      } else if (error.response?.status === 401) {
        console.error('🔐 [issueApi] Authentication failed. Check your access token.')
      } else if (error.response?.status === 404) {
        console.error('🔍 [issueApi] Endpoint not found. Check if the API endpoint exists.')
      } else if (error.response?.status >= 500) {
        console.error('🚨 [issueApi] Server error. Backend may be down.')
      }

      // Return empty array instead of throwing to prevent loading state issues
      return []
    }
  },

  // Get filtered issues for a project
  getFilteredProjectIssues: async (
    projectId: string,
    filters: { status?: string; type?: string; priority?: string }
  ) => {
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
