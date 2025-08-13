import axiosClient from '@/configs/axiosClient'
import { Board } from '@/types/board'

export const boardApi = {
  getAllBoardsByProjectId: async (projectId: string): Promise<Board[]> => {
    try {
      console.log(`[boardApi] Trying new endpoint: /projects/${projectId}/boards`)
      const response = await axiosClient.get(`/projects/${projectId}/boards`)
      console.log('[boardApi] New endpoint response:', response.data)

      if (response.data && response.data.data) {
        console.log('[boardApi] boards from new endpoint:', response.data.data)
        const boards = response.data.data || []
        // Sort by order ascending
        boards.sort((a: Board, b: Board) => a.order - b.order)
        return boards
      } else if (response.data && Array.isArray(response.data)) {
        // Handle case where response.data is directly an array
        console.log('[boardApi] boards from new endpoint (direct array):', response.data)
        const boards = response.data
        boards.sort((a: Board, b: Board) => a.order - b.order)
        return boards
      } else {
        throw new Error('Invalid response structure from new endpoint')
      }
    } catch (error) {
      console.warn('[boardApi] New endpoint failed, trying old endpoint:', error)

      // Fallback to old endpoint
      try {
        const response = await axiosClient.get(`/project/${projectId}`)
        console.log('[boardApi] Old endpoint response:', response.data)
        if (response.data && response.data.data && response.data.data.boards) {
          console.log('[boardApi] boards from old endpoint:', response.data.data.boards)
          const boards = (response.data.data.boards || []).filter((b: Board) => b.isActive)
          // Sort by order ascending
          boards.sort((a: Board, b: Board) => a.order - b.order)
          return boards
        } else {
          console.warn('[boardApi] boards not found in old endpoint response:', response.data)
          return []
        }
      } catch (fallbackError) {
        console.error('[boardApi] Both endpoints failed:', fallbackError)
        throw fallbackError
      }
    }
  },

  createBoard: async (
    projectId: string,
    name: string,
    description: string,
    type: string = 'Todo'
  ): Promise<boolean> => {
    const response = await axiosClient.post(`/projects/${projectId}/boards`, { name, description, type })
    return response.data.data
  },

  editBoard: async (
    projectId: string,
    boardId: string,
    name: string,
    description: string,
    type: string = 'Todo'
  ): Promise<boolean> => {
    const response = await axiosClient.put(`/projects/${projectId}/boards/${boardId}`, { name, description, type })
    return response.data.data
  },

  getBoardTypes: async (projectId: string): Promise<string[]> => {
    try {
      const response = await axiosClient.get(`/projects/${projectId}/boards/types`)
      if (response?.data?.data && Array.isArray(response.data.data)) {
        return response.data.data as string[]
      }
      // Fallback shape handling
      if (Array.isArray(response?.data)) return response.data as string[]
      return ['Todo', 'InProgress', 'Done', 'Custom']
    } catch (error) {
      console.warn('[boardApi] Failed to fetch board types, using defaults:', error)
      return ['Todo', 'InProgress', 'Done', 'Custom']
    }
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
