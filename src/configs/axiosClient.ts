import axios, { AxiosError, AxiosResponse, InternalAxiosRequestConfig } from 'axios'

const axiosClient = axios.create({
  baseURL: 'http://localhost:5041',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  },
  withCredentials: false
})

// Request
axiosClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // Get access token from session storage
    const accessToken = sessionStorage.getItem('accessToken')
    
    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`
    }
    
    return config
  },
  (error: AxiosError) => {
    return Promise.reject(error)
  }
)

// Response
axiosClient.interceptors.response.use(
  (response: AxiosResponse) => response,
  (error: AxiosError) => {
    if (error.response) {
      const { status } = error.response
      if (status === 401) {
        localStorage.removeItem('token')
      } else if (status === 403) {
        console.error('You do not have permission to perform this action.')
      } else if (status === 500) {
        console.error('Internal server error. Please try again later.')
      }
    } else {
      console.error('Network error. Please check your connection.')
    }
    return Promise.reject(error)
  }
)

export default axiosClient
