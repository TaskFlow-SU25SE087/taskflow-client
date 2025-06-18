import axiosClient from '@/configs/axiosClient'
import { AdminUsersParams, AdminUsersResponse } from '@/types/admin'

const ENDPOINT = '/admin'

export const adminApi = {
  getUsers: async (params?: AdminUsersParams): Promise<AdminUsersResponse> => {
    const queryParams = new URLSearchParams()
    if (params?.page) {
      queryParams.append('page', params.page.toString())
    }
    
    const url = `${ENDPOINT}/users${queryParams.toString() ? `?${queryParams.toString()}` : ''}`
    const response = await axiosClient.get<AdminUsersResponse>(url)
    return response.data
  },

  addFileAccount: async (file: File): Promise<boolean> => {
    const formData = new FormData()
    formData.append('file', file)
    
    const response = await axiosClient.post<{
      code: number
      message: string
      data: boolean
    }>(`${ENDPOINT}/users/add-file-account`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })
    
    if (response.data.code !== 0) {
      throw new Error(response.data.message)
    }
    
    return response.data.data
  }
} 