import axiosClient from '@/configs/axiosClient'
import { APIResponse } from '@/types/api'
import { Sprint, SprintMeeting, SprintMeetingDetail, SprintMeetingUpdateRequest, TaskUpdate } from '@/types/sprint'
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
    sprint: { name: string; description: string; startDate: string; endDate: string; status?: string }
  ): Promise<boolean> => {
    // Chỉ gửi các field cần thiết, không gửi status
    const { status, ...sprintData } = sprint
    console.log(`🔄 [sprintApi] Creating sprint in project ${projectId}:`, sprintData)
    const response = await axiosClient.post(`/projects/${projectId}/sprints`, sprintData)
    console.log(`✅ [sprintApi] Sprint created successfully`)
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

  // Cập nhật status của sprint
  updateSprintStatus: async (projectId: string, sprintId: string, status: string): Promise<boolean> => {
    console.log(`🔄 [sprintApi] Updating sprint ${sprintId} status to ${status} in project ${projectId}`)
    const response = await axiosClient.post(`/projects/${projectId}/sprints/${sprintId}/status?status=${status}`)
    console.log(`✅ [sprintApi] Successfully updated sprint status`)
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
  },

  // Sprint Meeting APIs
  // Lấy tất cả sprint meetings của project
  getSprintMeetings: async (projectId: string): Promise<SprintMeeting[]> => {
    const response = await axiosClient.get(`/projects/${projectId}/sprint-meetings`)
    return response.data.data
  },

  // Lấy danh sách task updates
  getTaskUpdates: async (projectId: string): Promise<TaskUpdate[]> => {
    const response = await axiosClient.get(`/projects/${projectId}/sprint-meetings/list-task-update`)
    return response.data.data
  },

  // Lấy chi tiết sprint meeting
  getSprintMeetingDetail: async (projectId: string, sprintMeetingId: string): Promise<SprintMeetingDetail> => {
    const response = await axiosClient.get(`/projects/${projectId}/sprint-meetings/${sprintMeetingId}`)
    return response.data.data
  },

  // Cập nhật task trong sprint meeting
  updateSprintMeetingTask: async (
    projectId: string,
    sprintMeetingId: string,
    taskId: string,
    itemVersion: number,
    reason: string
  ): Promise<string> => {
    const response = await axiosClient.patch(
      `/projects/${projectId}/sprint-meetings/${sprintMeetingId}?taskId=${taskId}&itemVersion=${itemVersion}&reason=${encodeURIComponent(reason)}`
    )
    return response.data.data
  },

  // Cập nhật sprint meeting
  updateSprintMeeting: async (
    projectId: string,
    sprintMeetingId: string,
    data: SprintMeetingUpdateRequest
  ): Promise<string> => {
    const response = await axiosClient.put(`/projects/${projectId}/sprint-meetings/${sprintMeetingId}`, data)
    return response.data.data
  },

  // Cập nhật next plan
  updateNextPlan: async (projectId: string, sprintMeetingId: string, nextPlan: string): Promise<boolean> => {
    const response = await axiosClient.patch(
      `/projects/${projectId}/sprint-meetings/${sprintMeetingId}/next-plan`,
      nextPlan
    )
    return response.data.data
  }
}
