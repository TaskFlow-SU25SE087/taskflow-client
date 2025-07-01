import axiosClient from '@/configs/axiosClient'
import { AdminUsersParams, AdminUsersResponse } from '@/types/admin'

const ENDPOINT = '/admin'

export const adminApi = {
  getUsers: async (params?: AdminUsersParams): Promise<AdminUsersResponse> => {
    const queryParams = new URLSearchParams()
    if (params?.page) {
      queryParams.append('page', params.page.toString())
    }
    if (params?.pageSize) {
      queryParams.append('pageSize', params.pageSize.toString())
    }
    
    const url = `${ENDPOINT}/users${queryParams.toString() ? `?${queryParams.toString()}` : ''}`
    const response = await axiosClient.get<AdminUsersResponse>(url)
    return response.data
  },

  importUsers: async (file: File): Promise<boolean> => {
    const formData = new FormData()
    formData.append('file', file)
    
    const response = await axiosClient.post<{
      code: number
      message: string
      data: boolean
    }>(`${ENDPOINT}/users/import`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })
    
    if (response.data.code !== 0) {
      throw new Error(response.data.message)
    }
    
    return response.data.data
  },

  banUser: async (userId: string) => {
    const response = await axiosClient.patch(`${ENDPOINT}/users/${userId}/ban`)
    return response.data
  },

  unbanUser: async (userId: string) => {
    const response = await axiosClient.patch(`${ENDPOINT}/users/${userId}/unban`)
    return response.data
  },

  getTermList: (page: number = 1) =>
    axiosClient.get('/admin/term/list', { params: { page } }),

  createTerm: (data: { season: string; year: number; startDate: string; endDate: string }) =>
    axiosClient.post('/admin/term', data),

  updateTerm: (id: string, data: { season: string; year: number; startDate: string; endDate: string }) =>
    axiosClient.put(`/${id}`, null, {
      params: {
        Season: data.season,
        Year: data.year,
        StartDate: data.startDate,
        EndDate: data.endDate,
      },
    }),

  deleteTerm: (id: string) =>
    axiosClient.delete(`/${id}`),

  getTermDetail: (id: string) =>
    axiosClient.get(`/${id}`),

  lockTerm: (id: string) =>
    axiosClient.delete(`/admin/term/lock/${id}`),
} 