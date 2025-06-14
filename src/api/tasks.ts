import axiosClient from '@/configs/axiosClient'
import { TaskP } from '@/types/task'

const ENDPOINT = '/api/Task'

export const taskApi = {
  getTasks: async (): Promise<TaskP[]> => {
    const response = await axiosClient.get<TaskP[]>(`${ENDPOINT}`)
    return response.data
  },

  getTaskById: async (taskId: string): Promise<TaskP> => {
    const response = await axiosClient.get<TaskP>(`${ENDPOINT}/${taskId}`)
    return response.data
  },

  getSprintIdFromTaskId: async (taskId: string): Promise<string> => {
    const response = await axiosClient.get<string>(`${ENDPOINT}/getSprintIdFromTaskId/taskId=${taskId}`)
    return response.data
  },

  getTasksFromProject: async (projectId: string): Promise<TaskP[]> => {
    const response = await axiosClient.get<TaskP[]>(`${ENDPOINT}/getTasksFromProject/projectId=${projectId}`)
    return response.data
  },

  createTask: async (projectId: string, title: string): Promise<{ id: string; message: string }> => {
    const response = await axiosClient.post(`${ENDPOINT}/${projectId}`, { title })
    return response.data
  },

  updateTaskStatus: async (taskId: string, newStatus: string): Promise<TaskP> => {
    const response = await axiosClient.put<TaskP>(`${ENDPOINT}/taskId=${taskId}/updateStatus`, newStatus, {
      headers: { 'Content-Type': 'application/json' }
    })
    return response.data
  },

  changeTaskBoard: async (taskId: string, boardId: string): Promise<TaskP> => {
    const response = await axiosClient.put<TaskP>(`${ENDPOINT}/taskId=${taskId}/changeBoard/brd=${boardId}`)
    return response.data
  },

  assignTask: async (taskId: string, email: string): Promise<TaskP> => {
    const response = await axiosClient.post<TaskP>(`${ENDPOINT}/assign/taskId=${taskId}`, {
      email
    })
    return response.data
  },

  deleteTask: async (taskId: string): Promise<void> => {
    await axiosClient.delete(`${ENDPOINT}/delete/taskid=${taskId}`)
  }
}
