import axiosClient from '@/configs/axiosClient'
import { AuthResponse } from '@/types/auth'

const ENDPOINT = '/api/Auth'

export const authApi = {
  login: async (email: string, password: string): Promise<AuthResponse> => {
    try {
      const response = await axiosClient.post<AuthResponse>(`${ENDPOINT}/login`, {
        email,
        password
      })

      const { id, token, name, email: userEmail, role } = response.data

      axiosClient.defaults.headers.common['Authorization'] = `Bearer ${token}`

      return {
        id,
        token,
        name,
        email: userEmail,
        role
      }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      if (error.response?.data?.message) {
        throw new Error(error.response.data.message)
      }
      throw error
    }
  },

  register: async (name: string, email: string, password: string): Promise<AuthResponse> => {
    try {
      const response = await axiosClient.post<AuthResponse>(`${ENDPOINT}/register`, {
        name,
        email,
        password
      })

      const { id, token, name: username, email: userEmail, role } = response.data
      return {
        id,
        token,
        name: username,
        email: userEmail,
        role
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      if (error.response?.data?.message) {
        throw new Error(error.response.data.message)
      }
      throw error
    }
  },

  logout: () => {
    delete axiosClient.defaults.headers.common['Authorization']
    sessionStorage.removeItem('auth_user')
  }
}
