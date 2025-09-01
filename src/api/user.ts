import axiosClient from '@/configs/axiosClient'

const ENDPOINT = '/user'

export interface ChangePasswordRequest {
  currentPassword: string
  newPassword: string
  confirmNewPassword: string
}

export interface ChangePasswordResponse {
  code: number
  message: string
  data: boolean
}

export const userApi = {
  changePassword: async (passwordData: ChangePasswordRequest): Promise<ChangePasswordResponse> => {
    console.log('🔑 [USER API] Starting password change request:', passwordData)
    
    try {
      console.log('🔑 [USER API] Making axios request...')
      const response = await axiosClient.post<ChangePasswordResponse>(`${ENDPOINT}/change-password`, passwordData)
      console.log('✅ [USER API] Success response:', response.data)
      return response.data
    } catch (error: unknown) {
      console.log('🚨 [USER API] Catch block executed, error:', error)
      
      // Check if this is an axios error with response data
      if (error && typeof error === 'object' && 'response' in error) {
        const axiosError = error as { 
          response?: { 
            data?: ChangePasswordResponse
            status?: number 
          }
          message?: string
        }
        
        if (axiosError.response?.data) {
          console.log('🔄 [USER API] Found structured error response:', axiosError.response.data)
          // Return the structured error response instead of throwing
          return axiosError.response.data
        }
        
        // Check if this is an axios error with status but no structured data
        if (axiosError.response?.status) {
          console.log('🔄 [USER API] Creating generic error from status:', axiosError.response.status)
          const genericError: ChangePasswordResponse = {
            code: axiosError.response.status,
            message: axiosError?.message || 'An error occurred',
            data: false
          }
          return genericError
        }
      }
      
      // For any other error, create a generic response
      console.log('🔄 [USER API] Creating fallback error response')
      const fallbackError: ChangePasswordResponse = {
        code: -1,
        message: 'Network error or unexpected error occurred',
        data: false
      }
      return fallbackError
    }
  }
}
