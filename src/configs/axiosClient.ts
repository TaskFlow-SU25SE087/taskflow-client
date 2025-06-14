import axios, { AxiosResponse, AxiosError, InternalAxiosRequestConfig } from 'axios'

const axiosClient = axios.create({
  baseURL: 'http://localhost:5149',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  },
  withCredentials: true
})

// Request
axiosClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const authUserString = sessionStorage.getItem('auth_user')

    if (authUserString) {
      try {
        const authUser = JSON.parse(authUserString)
        if (authUser.token) {
          config.headers.Authorization = `Bearer ${authUser.token}`
        }
      } catch (error) {
        console.error('Error parsing auth_user from session storage:', error)
      }
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
