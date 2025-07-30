import axiosClient from '@/configs/axiosClient'
import { APIResponse } from '@/types/api'
import { Sprint } from '@/types/sprint'
import { TaskP } from '@/types/task'

// Helper function for retry logic with better timeout handling
const retryRequest = async <T>(
  requestFn: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000
): Promise<T> => {
  let lastError: any
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`🔄 [retryRequest] Attempt ${attempt}/${maxRetries}`)
      return await requestFn()
    } catch (error: any) {
      lastError = error
      
      // Check if it's a timeout error
      if (error.isTimeout || (error.code === 'ECONNABORTED' && error.message.includes('timeout'))) {
        console.warn(`⏰ [retryRequest] Timeout on attempt ${attempt}/${maxRetries}`)
        
        if (attempt === maxRetries) {
          console.error(`❌ [retryRequest] All ${maxRetries} attempts failed due to timeout`)
          throw {
            ...lastError,
            message: `Request failed after ${maxRetries} attempts due to timeout. Please check your connection.`,
            isTimeout: true
          }
        }
        
        // Exponential backoff for timeout errors
        const delay = baseDelay * Math.pow(2, attempt - 1)
        console.log(`⏳ [retryRequest] Waiting ${delay}ms before retry...`)
        await new Promise(resolve => setTimeout(resolve, delay))
        continue
      }
      
      // For other errors, don't retry
      console.error(`❌ [retryRequest] Non-timeout error on attempt ${attempt}:`, error.message)
      throw lastError
    }
  }
  
  throw lastError
}

export const sprintApi = {
  // Lấy tất cả sprint của 1 project
  getAllSprintsByProjectId: async (projectId: string): Promise<Sprint[]> => {
    const response = await axiosClient.get(`/projects/${projectId}/sprints`)
    return response.data.data
  },

  // Tương thích với tên cũ (fix lỗi không tìm thấy hàm)
  getAllSprintByProjectId: async (projectId: string): Promise<Sprint[]> => {
    return sprintApi.getAllSprintsByProjectId(projectId)
  },

  // Tạo sprint mới
  createSprint: async (
    projectId: string,
    sprint: { name: string; description: string; startDate: string; endDate: string; status: string }
  ): Promise<boolean> => {
    const response = await axiosClient.post(`/projects/${projectId}/sprints`, sprint)
    return response.data.data
  },

  // Cập nhật sprint
  updateSprint: async (
    projectId: string,
    sprintId: string,
    sprint: { name: string; description: string; startDate: string; endDate: string; status: string }
  ): Promise<boolean> => {
    const response = await axiosClient.put(`/projects/${projectId}/sprints/${sprintId}`, sprint)
    return response.data.data
  },

  // Lấy tasks của 1 sprint (cần cả projectId và sprintId) - với retry logic cải thiện
  getSprintTasks: async (projectId: string, sprintId: string): Promise<TaskP[]> => {
    return retryRequest(async () => {
      console.log(`🔄 [sprintApi] Fetching tasks for sprint ${sprintId} in project ${projectId}`)
      const response = await axiosClient.get(`/projects/${projectId}/sprints/${sprintId}/tasks`)
      console.log(`✅ [sprintApi] Successfully fetched ${response.data.data?.length || 0} tasks`)
      return response.data.data
    }, 3, 2000) // 3 retries, 2 second base delay
  },

  // Gán nhiều task vào sprint
  assignTasksToSprint: async (projectId: string, sprintId: string, taskIds: string[]): Promise<APIResponse<boolean>> => {
    const response = await axiosClient.post(`/projects/${projectId}/sprints/${sprintId}/tasks/assign`, taskIds)
    return response.data
  },

  // Alias fetchSprints cho getAllSprintsByProjectId
  fetchSprints: async (projectId: string): Promise<Sprint[]> => {
    return sprintApi.getAllSprintsByProjectId(projectId)
  },

  // Lấy sprint theo ID
  getSprintById: async (projectId: string, sprintId: string): Promise<Sprint> => {
    const response = await axiosClient.get(`/projects/${projectId}/sprints/${sprintId}`)
    return response.data.data
  },

  // Lấy sprint hiện tại (active sprint)(inprogess) của project - với retry logic cải thiện
  getCurrentSprint: async (projectId: string): Promise<Sprint> => {
    return retryRequest(async () => {
      console.log(`🔄 [sprintApi] Fetching current sprint for project ${projectId}`)
      const response = await axiosClient.get(`/projects/${projectId}/sprints/current`)
      console.log(`✅ [sprintApi] Successfully fetched current sprint:`, response.data.data?.name)
      return response.data.data
    }, 3, 2000) // 3 retries, 2 second base delay
  }
}
