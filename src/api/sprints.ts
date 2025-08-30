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
      return await requestFn()
    } catch (error: any) {
      lastError = error
      
      // Check if it's a timeout error
      if (error.isTimeout || (error.code === 'ECONNABORTED' && error.message.includes('timeout'))) {
        if (attempt === maxRetries) {
          throw {
            ...lastError,
            message: `Request failed after ${maxRetries} attempts due to timeout. Please check your connection.`,
            isTimeout: true
          }
        }
        
        // Exponential backoff for timeout errors
        const delay = baseDelay * Math.pow(2, attempt - 1)
        await new Promise(resolve => setTimeout(resolve, delay))
        continue
      }
      
      // For other errors, don't retry
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
    const response = await axiosClient.post(`/projects/${projectId}/sprints`, sprintData)
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
    const response = await axiosClient.post(`/projects/${projectId}/sprints/${sprintId}/status?status=${status}`)
    return response.data.data
  },

  // Lấy tasks của 1 sprint (cần cả projectId và sprintId) - với retry logic cải thiện
  getSprintTasks: async (projectId: string, sprintId: string): Promise<TaskP[]> => {
    return retryRequest(async () => {
      const response = await axiosClient.get(`/projects/${projectId}/sprints/${sprintId}/tasks`)
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
      const response = await axiosClient.get(`/projects/${projectId}/sprints/current`)
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
  // Note: Backend currently only supports updating 'reason' field
  // Other fields (title, description, priority) are not updated
  updateSprintMeetingTask: async (
    projectId: string,
    sprintMeetingId: string,
    taskId: string,
    itemVersion: number,
    taskData: {
      title: string
      description: string
      priority: string
      reason: string
    }
  ): Promise<{ success: boolean; message?: string; newItemVersion?: number }> => {
    try {
      // Backend only supports updating reason field
      // Title, description, and priority updates are not supported
      const url = `/projects/${projectId}/sprint-meetings/${sprintMeetingId}?taskId=${taskId}&itemVersion=${itemVersion}&reason=${encodeURIComponent(taskData.reason)}`
      
      const response = await axiosClient.patch(url)
      
      // Check if response contains a version conflict message
      if (response.data.code === 200 && typeof response.data.data === 'string' && response.data.data.includes('Someone has updated')) {
        // Extract new item version from message
        const versionMatch = response.data.data.match(/New ItemVersion: (\d+)/)
        const newItemVersion = versionMatch ? parseInt(versionMatch[1]) : undefined
        
        return {
          success: false,
          message: response.data.data,
          newItemVersion
        }
      }
      
      // Check API response code - both 0 and 200 are considered success
      if (response.data.code === 0 || response.data.code === 200) {
        return {
          success: true,
          message: response.data.data || response.data.message || 'Task updated successfully'
        }
      }
      
      // If we reach here, it's an error
      throw new Error(response.data.message || 'Failed to update task')
      
    } catch (error: any) {
      // Prefer server-provided message when available
      const serverMessage: string | undefined = error?.response?.data?.message
      const serverCode: number | undefined = error?.response?.data?.code
      if (serverCode === 9012) {
        throw new Error('Sprint meeting cannot be updated. Please check if the meeting is still active.')
      }
      if (serverMessage) {
        throw new Error(serverMessage)
      }
      throw error
    }
  },

  // Cập nhật sprint meeting
  updateSprintMeeting: async (
    projectId: string,
    sprintMeetingId: string,
    data: SprintMeetingUpdateRequest
  ): Promise<string> => {
    try {
      const response = await axiosClient.put(`/projects/${projectId}/sprint-meetings/${sprintMeetingId}`, data)
      
      // Check API response code (treat 0 and 200 as success for backend variants)
      if (response.data.code !== 0 && response.data.code !== 200) {
        throw new Error(response.data.message || 'Failed to update sprint meeting')
      }
      
      return response.data.data
    } catch (error: any) {
      // Handle specific API error codes and surface server messages
      const serverMessage: string | undefined = error?.response?.data?.message
      const serverCode: number | undefined = error?.response?.data?.code
      if (serverCode === 9012) {
        throw new Error('Sprint meeting cannot be updated. Please check if the meeting is still active.')
      }
      if (serverMessage) {
        throw new Error(serverMessage)
      }
      throw error
    }
  },

  // Cập nhật next plan
  updateNextPlan: async (projectId: string, sprintMeetingId: string, nextPlan: string): Promise<boolean> => {
    try {
      const response = await axiosClient.patch(
        `/projects/${projectId}/sprint-meetings/${sprintMeetingId}/next-plan`,
        nextPlan
      )
      
      // Check API response code (treat 0 and 200 as success for backend variants)
      if (response.data.code !== 0 && response.data.code !== 200) {
        throw new Error(response.data.message || 'Failed to update next plan')
      }
      
      return response.data.data
    } catch (error: any) {
      // Handle specific API error codes and surface server messages
      const serverMessage: string | undefined = error?.response?.data?.message
      const serverCode: number | undefined = error?.response?.data?.code
      if (serverCode === 9012) {
        throw new Error('Sprint meeting cannot be updated. Please check if the meeting is still active.')
      }
      if (serverMessage) {
        throw new Error(serverMessage)
      }
      throw error
    }
  }
}
