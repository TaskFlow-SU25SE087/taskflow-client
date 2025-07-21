import axiosClient from '@/configs/axiosClient'
import { Board } from '@/types/board'

export const boardApi = {
  getAllBoardsByProjectId: async (projectId: string): Promise<Board[]> => {
    const response = await axiosClient.get(`/project/${projectId}`)
    if (response.data && response.data.data && response.data.data.boards) {
    } else {
      console.warn('[boardApi] boards not found in response:', response.data)
    }
    const boards = (response.data.data.boards || []).filter((b: Board) => b.isActive)
    // Sort by order ascending
    boards.sort((a: Board, b: Board) => a.order - b.order)
    return boards
  },

  createBoard: async (projectId: string, name: string, description: string): Promise<boolean> => {
    const response = await axiosClient.post(`/projects/${projectId}/boards`, { name, description })
    return response.data.data
  },

  editBoard: async (projectId: string, boardId: string, name: string, description: string): Promise<boolean> => {
    const response = await axiosClient.put(`/projects/${projectId}/boards/${boardId}`, { name, description })
    return response.data.data
  },

  deleteBoard: async (projectId: string, boardId: string): Promise<boolean> => {
    const response = await axiosClient.delete(`/projects/${projectId}/boards/${boardId}`)
    return response.data.data
  },

  updateBoardOrder: async (projectId: string, boards: { id: string; order: number }[]): Promise<boolean> => {
    const response = await axiosClient.put(`/projects/${projectId}/boards/order`, boards)
    return response.data.data
  }
}
