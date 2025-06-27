import axiosClient from '@/configs/axiosClient'
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

  // Lấy tasks của 1 sprint
  getSprintTasks: async (sprintId: string): Promise<TaskP[]> => {
    const response = await axiosClient.get(`/sprints/${sprintId}/tasks`)
    return response.data.data
  },

  // Thêm task vào sprint
  addTaskToSprint: async (sprintId: string, taskId: string): Promise<boolean> => {
    const response = await axiosClient.post(`/sprints/${sprintId}/tasks`, { taskId })
    return response.data.data
  },

  // Alias fetchSprints cho getAllSprintsByProjectId
  fetchSprints: async (projectId: string): Promise<Sprint[]> => {
    return sprintApi.getAllSprintsByProjectId(projectId)
  },

  // Lấy sprint theo ID
  getSprintById: async (sprintId: string): Promise<Sprint> => {
    const response = await axiosClient.get(`/sprints/${sprintId}`)
    return response.data.data
  }
}
