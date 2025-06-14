import axiosClient from '@/configs/axiosClient'
import { Sprint } from '@/types/sprint'

const ENDPOINT = '/api/Sprint'

export const sprintApi = {
  getAllSprints: async (): Promise<Sprint[]> => {
    const response = await axiosClient.get<Sprint[]>(ENDPOINT)
    return response.data
  },

  getAllSprintByProjectId: async (projectId: string): Promise<Sprint[]> => {
    const response = await axiosClient.get<Sprint[]>(`${ENDPOINT}/${projectId}/getAllSprintByProjectId`)
    return response.data
  },

  getSprintById: async (sprintId: string): Promise<Sprint> => {
    const response = await axiosClient.get<Sprint>(`${ENDPOINT}/${sprintId}`)
    return response.data
  },

  createSprint: async (projectId: string, name: string): Promise<Sprint> => {
    const response = await axiosClient.post<Sprint>(`${ENDPOINT}/${projectId}`, { name })
    return response.data
  },

  addTaskToSprint: async (sprintId: string, taskId: string): Promise<void> => {
    await axiosClient.put(`${ENDPOINT}/sprintId=${sprintId}/taskId=${taskId}/AddTaskToSprint`)
  },

  removeTaskFromSprint: async (taskId: string): Promise<void> => {
    await axiosClient.put(`${ENDPOINT}/RemoveTask/taskId=${taskId}`)
  },

  deleteSprintById: async (sprintId: string): Promise<void> => {
    await axiosClient.delete(`${ENDPOINT}/${sprintId}/DeleteById`)
  },

  startSprint: async (sprintId: string, startDate: string, endDate: string): Promise<void> => {
    await axiosClient.put(`${ENDPOINT}/StartSprint/${sprintId}/${startDate}/${endDate}`)
  },

  endSprint: async (sprintId: string): Promise<void> => {
    await axiosClient.put(`${ENDPOINT}/EndSprint/${sprintId}`)
  }
}
