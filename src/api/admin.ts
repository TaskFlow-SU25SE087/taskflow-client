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

    // Tăng timeout cho file upload (5 phút)
    const response = await axiosClient.post<{
      code: number
      message: string
      data: boolean
    }>(`${ENDPOINT}/users/import`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      },
      timeout: 300000, // 5 phút cho file upload
      // Thêm onUploadProgress để track progress
      onUploadProgress: (progressEvent) => {
        if (progressEvent.total) {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total)
          console.log(`Upload progress: ${percentCompleted}%`)
        }
      }
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

  getTermList: async (page: number = 1) => {
    try {
      console.log('Calling getTermList with page:', page)
      // Try different possible endpoints
      let response
      try {
        response = await axiosClient.get('/admin/term/list', { params: { page } })
        console.log('getTermList response (term/list):', response)
      } catch (error) {
        console.log('term/list failed, trying terms endpoint...')
        response = await axiosClient.get('/admin/terms', { params: { page } })
        console.log('getTermList response (terms):', response)
      }
      return response
    } catch (error) {
      console.error('getTermList error:', error)
      throw error
    }
  },

  createTerm: (data: { season: string; year: number; startDate: string; endDate: string }) =>
    axiosClient.post('/admin/term', data),

  updateTerm: (id: string, data: { season: string; year: number; startDate: string; endDate: string }) =>
    axiosClient.put(`/admin/term/${id}`, null, {
      params: {
        Season: data.season,
        Year: data.year,
        StartDate: data.startDate,
        EndDate: data.endDate
      }
    }),

  deleteTerm: (id: string) => axiosClient.delete(`/admin/term/${id}`),

  // Check if term can be safely deleted
  checkTermDeletion: async (id: string) => {
    try {
      // Check if term has any projects
      const projectsResponse = await axiosClient.get(`/project/admin/term/${id}`)
      const hasProjects = projectsResponse.data?.data?.length > 0
      
      // Check if term has any users assigned
      const usersResponse = await axiosClient.get(`/admin/users?termId=${id}`)
      const hasUsers = usersResponse.data?.data?.items?.length > 0
      
      return {
        canDelete: !hasProjects && !hasUsers,
        hasProjects,
        hasUsers,
        message: hasProjects || hasUsers 
          ? 'Term cannot be deleted because it has active references'
          : 'Term can be safely deleted'
      }
    } catch (error) {
      console.error('Error checking term deletion:', error)
      return {
        canDelete: false,
        hasProjects: false,
        hasUsers: false,
        message: 'Unable to verify if term can be deleted'
      }
    }
  },

  getTermDetail: (id: string) => axiosClient.get(`/admin/term/${id}`),

  lockTerm: (id: string) => axiosClient.delete(`/admin/term/lock/${id}`),

  // Unlock term (same endpoint, DELETE request)
  unlockTerm: (id: string) => axiosClient.delete(`/admin/term/lock/${id}`),

  // Admin Projects
  getAllProjects: async () => {
    const response = await axiosClient.get('/project/admin/all')
    return response.data
  },

  getProjectsByTerm: async (termId: string) => {
    const response = await axiosClient.get(`/project/admin/term/${termId}`)
    return response.data
  }
  ,
  // Admin Teams
  getTeams: async () => {
    const response = await axiosClient.get('/admin/teams')
    return response.data
  },

  getTeamById: async (projectId: string) => {
    const response = await axiosClient.get(`/admin/teams/${projectId}`)
    return response.data
  },

  // Transfer team leadership
  transferLeadership: async (newLeaderId: string) => {
    const response = await axiosClient.post(`/admin/users/change-leader/${newLeaderId}`)
    return response.data
  }
}
