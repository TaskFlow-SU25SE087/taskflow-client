import axiosClient from '@/configs/axiosClient'
import { APIResponse } from '@/types/api'
import { TaskP } from '@/types/task'
import axios from 'axios'

export const taskApi = {
  // Get all tasks for a project
  getTasksFromProject: async (projectId: string): Promise<TaskP[]> => {
    const response = await axiosClient.get(`/projects/${projectId}/tasks`)
    return response.data.data
  },

  // Get a single task by ID (if needed, adjust endpoint as per backend)
  getTaskById: async (projectId: string, taskId: string): Promise<TaskP> => {
    const response = await axiosClient.get(`/projects/${projectId}/task/${taskId}`)
    return response.data.data
  },

  // Create a new task for a project
  createTask: async (projectId: string, formData: FormData): Promise<APIResponse<boolean>> => {
    const response = await axiosClient.post(`/projects/${projectId}/tasks`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
    return response.data
  },

  // Update a task
  updateTask: async (
    projectId: string,
    taskId: string,
    data: { title: string; description: string; priority: string }
  ): Promise<any> => {
    const response = await axiosClient.put(`/projects/${projectId}/tasks/update/${taskId}`, data)
    return response.data // Sửa lại trả về toàn bộ response.data
  },

  // Delete a task
  deleteTask: async (projectId: string, taskId: string): Promise<APIResponse<boolean>> => {
    const response = await axiosClient.delete(`/projects/${projectId}/tasks/${taskId}`)
    return response.data
  },

  // Get all tasks of a sprint
  getSprintTasks: async (projectId: string, sprintId: string): Promise<TaskP[]> => {
    const response = await axiosClient.get(`/projects/${projectId}/sprints/${sprintId}/tasks`)
    return response.data.data
  },

  // Add a tag to a task
  addTagToTask: async (projectId: string, taskId: string, tagId: string): Promise<boolean> => {
    const response = await axiosClient.post(`/projects/${projectId}/tasks/${taskId}/tags/${tagId}`)
    return response.data.data === true
  },

  

  // Mark a task as complete with optional files
  completeTask: async (projectId: string, taskId: string, files?: File[]): Promise<boolean> => {
    const formData = new FormData()
    if (files && files.length > 0) {
      files.forEach((file) => {
        formData.append('Files', file)
      })
    }
    const response = await axiosClient.post(`/projects/${projectId}/tasks/${taskId}/complete`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
    return response.data.data === true
  },

  // Accept a task assignment
  acceptTaskAssignment: async (projectId: string, taskId: string): Promise<boolean> => {
    const response = await axiosClient.post(`/projects/${projectId}/tasks/${taskId}/assignments/accept`)
    return response.data.data === true
  },

  // Assign a task to a user
  assignTask: async (projectId: string, taskId: string, implementerId: string): Promise<APIResponse<boolean>> => {
    console.log('Assign action:', { projectId, taskId, implementerId })
    const formData = new FormData()
    formData.append('implementerId', implementerId)
    const response = await axiosClient.post(`/projects/${projectId}/tasks/${taskId}/assignments/assign`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
    console.log('Assign response:', response)
    return response.data
  },

  // Remove an assignment from a task
  removeTaskAssignment: async (
    projectId: string,
    taskId: string,
    body: { implementId: string; reason: string }
  ): Promise<APIResponse<boolean>> => {
    const response = await axiosClient.delete(`/projects/${projectId}/tasks/${taskId}/assignments/remove`, {
      data: body
    })
    return response.data
  },

  // Leave an assignment from a task
  leaveTaskAssignment: async (projectId: string, taskId: string, body: { reason: string }): Promise<boolean> => {
    const response = await axiosClient.delete(`/projects/${projectId}/tasks/${taskId}/assignments/leave`, {
      data: body
    })
    return response.data.data === true
  },

  // Add a comment to a task
  addTaskComment: async (projectId: string, taskId: string, content: string, files?: File[]): Promise<boolean> => {
    const formData = new FormData()
    formData.append('Content', content)
    if (files && files.length > 0) {
      files.forEach((file) => {
        formData.append('Files', file)
      })
    }
    const response = await axiosClient.post(`/projects/${projectId}/tasks/${taskId}/comments/comment/add`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
    return response.data.data === true
  },

  // Get sprintId from a taskId (stub, needs backend support)
  getSprintIdFromTaskId: async (): Promise<string> => {
    // TODO: Replace with real API call if backend supports it
    // For now, return a dummy value or throw an error
    // throw new Error('getSprintIdFromTaskId not implemented')
    return ''
  },

  // Lấy tất cả task của project
  getAllTasks: async (projectId: string): Promise<TaskP[]> => {
    const response = await axiosClient.get(`/projects/${projectId}/tasks`)
    return response.data.data
  },

  // Lấy task chưa gán sprint
  getUnassignedSprintTasks: async (projectId: string): Promise<TaskP[]> => {
    const response = await axiosClient.get(`/projects/${projectId}/tasks/nounassigned-sprint`)
    return response.data.data
  },

  // Chuyển task sang board với retry logic, connection pooling và caching
  moveTaskToBoard: async (projectId: string, taskId: string, boardId: string): Promise<APIResponse<boolean>> => {
    const maxRetries = 2
    let lastError: any
    
    // Cache key cho board data
    const cacheKey = `board_${projectId}_${boardId}`
    const cachedBoard = sessionStorage.getItem(cacheKey)
    
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        // Tạo axios instance với timeout 1 giây và connection pooling
        const fastAxiosClient = axios.create({
          baseURL: axiosClient.defaults.baseURL,
          timeout: 1000, // 1 giây timeout
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${sessionStorage.getItem('accessToken')}`,
            'Connection': 'keep-alive',
            'Keep-Alive': 'timeout=5, max=1000',
            // Add cache headers if we have cached data
            ...(cachedBoard && { 'If-None-Match': cachedBoard })
          },
          // Connection pooling settings
          maxRedirects: 0,
          validateStatus: (status) => status < 500
        })
        
        console.log(`[moveTaskToBoard] Attempt ${attempt + 1}/${maxRetries + 1}`)
        const response = await fastAxiosClient.post(`/projects/${projectId}/tasks/${taskId}/status/board/${boardId}`)
        
        // Cache successful response
        if (response.data && response.data.success) {
          sessionStorage.setItem(cacheKey, JSON.stringify(response.data))
        }
        
        return response.data
      } catch (error: any) {
        lastError = error
        console.warn(`[moveTaskToBoard] Attempt ${attempt + 1} failed:`, error.message)
        
        if (attempt < maxRetries) {
          // Exponential backoff: wait 200ms, then 400ms
          const delay = 200 * Math.pow(2, attempt)
          console.log(`[moveTaskToBoard] Retrying in ${delay}ms...`)
          await new Promise(resolve => setTimeout(resolve, delay))
        }
      }
    }
    
    throw lastError
  },

  // Complete a task with file upload (custom endpoint)
  completeTaskWithUpload: async (projectId: string, taskId: string, files?: File[]): Promise<boolean> => {
    const formData = new FormData();
    if (files && files.length > 0) {
      files.forEach((file) => {
        formData.append('Files', file);
      });
    }
    const response = await axiosClient.post(`/projects/${projectId}/tasks/${taskId}/upflie`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data.data === true;
  },
}
