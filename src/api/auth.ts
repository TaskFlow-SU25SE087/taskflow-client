import axiosClient from '@/configs/axiosClient'
import { AuthResponse, User } from '@/types/auth'

const ENDPOINT = '/auth'

export const authApi = {
  login: async (username: string, password: string): Promise<AuthResponse> => {
    try {
      const response = await axiosClient.post<{
        code: number
        message: string
        data: {
          accessToken: string
          refreshToken: string
        }
      }>(`${ENDPOINT}/login`, {
        username,
        password
      })

      const { accessToken, refreshToken } = response.data.data

      // Store tokens
      axiosClient.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`
      localStorage.setItem('refreshToken', refreshToken)

      return {
        accessToken,
        refreshToken
      }
    } catch (error: any) {
      if (error.response?.data?.message) {
        throw new Error(error.response.data.message)
      }
      throw error
    }
  },

  // register: async (
  //   email: string,
  //   fullName: string,
  //   password: string,
  //   confirmPassword: string
  // ): Promise<AuthResponse> => {
  //   try {
  //     const formData = new FormData()
  //     formData.append('Email', email)
  //     formData.append('FullName', fullName)
  //     formData.append('Password', password)
  //     formData.append('ConfirmPassword', confirmPassword)

  //     const response = await axiosClient.post<{
  //       code: number
  //       message: string
  //       data: {
  //         accessToken: string
  //         refreshToken: string
  //       }
  //     }>(`${ENDPOINT}/register`, formData, {
  //       headers: {
  //         'Content-Type': 'multipart/form-data'
  //       }
  //     })

  //     const { accessToken, refreshToken } = response.data.data

  //     // Store tokens
  //     axiosClient.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`
  //     localStorage.setItem('refreshToken', refreshToken)

  //     return {
  //       accessToken,
  //       refreshToken
  //     }
  //   } catch (error: any) {
  //     if (error.response?.data?.errors) {
  //       const errorMessages = Object.entries(error.response.data.errors)
  //         .map(([field, messages]) => `${field}: ${(messages as string[]).join(', ')}`)
  //         .join('\n')
  //       throw new Error(errorMessages)
  //     }
  //     if (error.response?.data?.message) {
  //       throw new Error(error.response.data.message)
  //     }
  //     throw new Error('Registration failed. Please try again.')
  //   }
  // },

  refreshToken: async (accessToken: string, refreshToken: string): Promise<AuthResponse> => {
    try {
      const response = await axiosClient.post<{
        code: number
        message: string
        data: {
          accessToken: string
          refreshToken: string
        }
      }>(`${ENDPOINT}/token/refresh`, {
        accessToken,
        refreshToken
      })

      const { accessToken: newAccessToken, refreshToken: newRefreshToken } = response.data.data

      // Update tokens
      axiosClient.defaults.headers.common['Authorization'] = `Bearer ${newAccessToken}`
      localStorage.setItem('refreshToken', newRefreshToken)

      return {
        accessToken: newAccessToken,
        refreshToken: newRefreshToken
      }
    } catch (error: any) {
      if (error.response?.data?.message) {
        throw new Error(error.response.data.message)
      }
      throw error
    }
  },

  verifyEmail: async (token: string): Promise<void> => {
    try {
      const response = await axiosClient.post<{
        code: number
        message: string
        data: boolean
      }>(`${ENDPOINT}/email/verify?token=${token}`)

      if (response.data.code !== 0 && response.data.code !== 200) {
        throw new Error(response.data.message)
      }
    } catch (error: any) {
      throw error
    }
  },

  resendVerificationEmail: async (): Promise<boolean> => {
    try {
      const response = await axiosClient.post<{
        code: number
        message: string
        data: boolean
      }>(`${ENDPOINT}/email/resend`)

      return response.data.data
    } catch (error: any) {
      if (error.response?.data?.message) {
        throw new Error(error.response.data.message)
      }
      throw error
    }
  },

  logout: () => {
    delete axiosClient.defaults.headers.common['Authorization']
    localStorage.removeItem('refreshToken')
  },

  verifyOtp: async (otp: string): Promise<void> => {
    try {
      const response = await axiosClient.post<{
        code: number
        message: string
      }>(`${ENDPOINT}/email/verify?token=${otp}`)

      if (response.data.code !== 0 && response.data.code !== 200) {
        throw new Error(response.data.message)
      }
    } catch (error: any) {
      throw error
    }
  },

  addUsername: async (username: string, avatar: File | null, phoneNumber: string): Promise<User> => {
    try {
      const formData = new FormData()
      formData.append('Username', username)
      if (avatar) {
        formData.append('Avatar', avatar)
      }
      if (phoneNumber) {
        formData.append('PhoneNumber', phoneNumber)
      }

      const response = await axiosClient.post<{
        code: number
        message: string
        data: {
          id: string
          avatar: string
          fullName: string
          role: string
          email: string
          phoneNumber: string
          username: string
        }
      }>(`${ENDPOINT}/username`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      })

      if (response.data.code !== 0 && response.data.code !== 200) {
        throw new Error(response.data.message)
      }
      return response.data.data
    } catch (error: any) {
      if (error.response?.data?.errors) {
        const errorMessages = Object.entries(error.response.data.errors)
          .map(([field, messages]) => `${field}: ${(messages as string[]).join(', ')}`)
          .join('\n')
        throw new Error(`Validation failed:\n${errorMessages}`)
      }
      if (error.response?.data?.message) {
        throw new Error(error.response.data.message)
      }
      throw error
    }
  },

  activate: async (
    email: string,
    username: string,
    newPassword: string,
    confirmPassword: string,
    tokenResetPassword: string
  ): Promise<string> => {
    try {
      const response = await axiosClient.post<{
        code: number
        message: string
        data: string
      }>(`${ENDPOINT}/account/activate`, {
        email,
        username,
        newPassword,
        confirmPassword,
        tokenResetPassword
      })

      if (response.data.code !== 0 && response.data.code !== 200) {
        throw new Error(response.data.message)
      }

      return response.data.data
    } catch (error: any) {
      if (error.response?.data?.errors) {
        const errorMessages = Object.entries(error.response.data.errors)
          .map(([field, messages]) => `${field}: ${(messages as string[]).join(', ')}`)
          .join('\n')
        throw new Error(errorMessages)
      }
      if (error.response?.data?.message) {
        throw new Error(error.response.data.message)
      }
      throw new Error('Account activation failed. Please try again.')
    }
  },

  resetPassword: async (
    email: string,
    newPassword: string,
    confirmPassword: string,
    tokenResetPassword: string
  ): Promise<string> => {
    try {
      const response = await axiosClient.post<{
        code: number
        message: string
        data: string
      }>(`${ENDPOINT}/account/reset-password`, {
        email,
        newPassword,
        confirmPassword,
        tokenResetPassword
      })

      if (response.data.code !== 0 && response.data.code !== 200) {
        throw new Error(response.data.message)
      }

      return response.data.data
    } catch (error: any) {
      if (error.response?.data?.errors) {
        const errorMessages = Object.entries(error.response.data.errors)
          .map(([field, messages]) => `${field}: ${(messages as string[]).join(', ')}`)
          .join('\n')
        throw new Error(errorMessages)
      }
      if (error.response?.data?.message) {
        throw new Error(error.response.data.message)
      }
      throw new Error('Reset password failed. Please try again.')
    }
  },

  getCurrentUser: async (): Promise<User> => {
    try {
      const response = await axiosClient.get<{
        code: number
        message: string
        data: {
          id: string
          avatar: string
          fullName: string
          role: string
          email: string
          phoneNumber: string
          username: string
        }
      }>(`${ENDPOINT}/me`)

      if (response.data.code !== 0 && response.data.code !== 200) {
        throw new Error(response.data.message)
      }

      return response.data.data
    } catch (error: any) {
      throw error
    }
  },

  getUserById: async (userId: string): Promise<User> => {
    try {
      const response = await axiosClient.get<{
        code: number
        message: string
        data: {
          id: string
          avatar: string
          fullName: string
          role: string
          email: string
          phoneNumber: string
          studentId?: string
          term?: string
        }
      }>(`/user/${userId}`)
      if (response.data.code !== 0 && response.data.code !== 200) {
        throw new Error(response.data.message)
      }
      const userData = response.data.data
      return {
        id: userData.id,
        avatar: userData.avatar,
        fullName: userData.fullName,
        role: userData.role,
        email: userData.email,
        phoneNumber: userData.phoneNumber,
        username: ''
      }
    } catch (error: any) {
      throw error
    }
  },

  sendResetPasswordMail: async (email: string): Promise<string> => {
    try {
      const response = await axiosClient.post<{
        code: number
        message: string
        data: string
      }>(`${ENDPOINT}/account/reset-password/send-mail`, email, {
        headers: { 'Content-Type': 'application/json' }
      })
      if (response.data.code !== 0 && response.data.code !== 200) {
        throw new Error(response.data.message)
      }
      return response.data.data
    } catch (error: any) {
      if (error.response?.data?.message) {
        throw new Error(error.response.data.message)
      }
      throw error
    }
  }
}
