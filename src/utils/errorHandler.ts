import { AxiosError } from 'axios'

// Interface for backend error response structure
export interface BackendErrorResponse {
  code?: number | string
  message?: string
  data?: any
  errors?: any
}

// Function to extract backend error message from axios error
export const extractBackendErrorMessage = (error: unknown): string => {
  if (error instanceof Error) {
    // Check if it's an Axios error with response data
    if ('response' in error && error.response) {
      const axiosError = error as AxiosError
      if (axiosError.response) {
        const responseData = axiosError.response.data as BackendErrorResponse
      
      // Log the full error response for debugging
      console.log('[ErrorHandler] Full error response:', responseData)
      
      // Extract message from backend response
      if (responseData?.message) {
        return responseData.message
      }
      
      // Check for nested errors object
      if (responseData?.errors && typeof responseData.errors === 'object') {
        const errorMessages = Object.values(responseData.errors)
          .filter(msg => typeof msg === 'string')
          .join(', ')
        if (errorMessages) {
          return errorMessages
        }
      }
      
      // Fallback to status text or default message
      if (axiosError.response?.statusText) {
        return axiosError.response.statusText
      }
      }
    }
    
    // Return the error message if available
    return error.message
  }
  
  // Fallback for unknown error types
  if (typeof error === 'string') {
    return error
  }
  
  return 'An unexpected error occurred'
}

// Function to get error title based on error code or type
export const getErrorTitle = (error: unknown): string => {
  if (error instanceof Error && 'response' in error) {
    const axiosError = error as AxiosError
    const responseData = axiosError.response?.data as BackendErrorResponse
    
    if (responseData?.code) {
      // Map common error codes to user-friendly titles
      const errorCode = responseData.code.toString()
      switch (errorCode) {
        case '6003':
          return 'Access Denied'
        case '400':
          return 'Bad Request'
        case '401':
          return 'Unauthorized'
        case '403':
          return 'Forbidden'
        case '404':
          return 'Not Found'
        case '409':
          return 'Conflict'
        case '422':
          return 'Validation Error'
        case '500':
          return 'Server Error'
        default:
          return 'Error'
      }
    }
    
    // Map HTTP status codes to titles
    if (axiosError.response?.status) {
      const status = axiosError.response.status
      switch (status) {
        case 400:
          return 'Bad Request'
        case 401:
          return 'Unauthorized'
        case 403:
          return 'Forbidden'
        case 404:
          return 'Not Found'
        case 409:
          return 'Conflict'
        case 422:
          return 'Validation Error'
        case 500:
          return 'Server Error'
        default:
          return 'Error'
      }
    }
  }
  
  return 'Error'
}

// Function to determine if error should show as destructive (red) or warning (yellow)
export const getErrorVariant = (error: unknown): 'destructive' | 'warning' | 'default' => {
  if (error instanceof Error && 'response' in error) {
    const axiosError = error as AxiosError
    const responseData = axiosError.response?.data as BackendErrorResponse
    
    // Check error code first
    if (responseData?.code) {
      const errorCode = responseData.code.toString()
      switch (errorCode) {
        case '6003': // Access denied
        case '401': // Unauthorized
        case '403': // Forbidden
          return 'warning'
        case '500': // Server error
          return 'destructive'
        default:
          return 'destructive'
      }
    }
    
    // Check HTTP status
    if (axiosError.response?.status) {
      const status = axiosError.response.status
      switch (status) {
        case 400:
        case 422:
          return 'warning'
        case 401:
        case 403:
          return 'warning'
        case 500:
          return 'destructive'
        default:
          return 'destructive'
      }
    }
  }
  
  return 'destructive'
}
