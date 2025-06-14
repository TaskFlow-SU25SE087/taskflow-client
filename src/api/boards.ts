import axiosClient from '@/configs/axiosClient'
import { Board } from '@/types/board'

const ENDPOINT = '/api/board'

export const boardApi = {
  getAllBoardsByProjectId: async (projectId: string): Promise<Board[]> => {
    const response = await axiosClient.get<Board[]>(`${ENDPOINT}/projectId=${projectId}/all`)
    return response.data
  },

  createBoard: async (projectId: string, status: string): Promise<Board> => {
    const response = await axiosClient.post<Board>(`${ENDPOINT}/projectId=${projectId}/new`, { status })
    return response.data
  },

  addTaskToBoard: async (boardId: string, taskId: string): Promise<void> => {
    await axiosClient.put(`${ENDPOINT}/board/${boardId}/task/${taskId}/AddTaskToBoard`)
  },

  editBoardStatus: async (boardId: string, updatedStatus: Partial<Board>): Promise<Board> => {
    const response = await axiosClient.put<Board>(`${ENDPOINT}/${boardId}`, updatedStatus)
    return response.data
  },

  deleteBoard: async (boardId: string): Promise<void> => {
    await axiosClient.delete(`${ENDPOINT}/${boardId}`)
  }
}
