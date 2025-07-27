import axiosClient from '@/configs/axiosClient'
import { APIResponse } from '@/types/api'
import { Sprint } from '@/types/sprint'
import { TaskP } from '@/types/task'

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

  // Lấy tasks của 1 sprint (cần cả projectId và sprintId)
  getSprintTasks: async (projectId: string, sprintId: string): Promise<TaskP[]> => {
    const response = await axiosClient.get(`/projects/${projectId}/sprints/${sprintId}/tasks`)
    return response.data.data
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

  // Lấy sprint hiện tại (active sprint)(inprogess) của project
  getCurrentSprint: async (projectId: string): Promise<Sprint> => {
    const response = await axiosClient.get(`/projects/${projectId}/sprints/current`)
    return response.data.data
  }
}
