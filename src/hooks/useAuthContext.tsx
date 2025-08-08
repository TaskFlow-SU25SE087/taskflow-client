import { authApi } from '@/api/auth'
import axiosClient from '@/configs/axiosClient'
import { User } from '@/types/auth'
import { createContext, ReactNode, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'

interface AuthContextType {
  user: User | null
  isOtpVerified: boolean
  isAuthenticated: boolean
  authLoading: boolean
  login: (username: string, password: string) => Promise<void>
  // register: (email: string, fullName: string, password: string, confirmPassword: string) => Promise<void>
  logout: () => void
  error: string | null
  resendVerificationEmail: () => Promise<void>
  verifyEmail: (token: string) => Promise<void>
  verifyOtp: (otp: string) => Promise<void>
  addUsername: (username: string, avatar: File | null, phoneNumber: string) => Promise<void>
  activate: (
    email: string,
    username: string,
    newPassword: string,
    confirmPassword: string,
    tokenResetPassword: string
  ) => Promise<void>
  getCurrentUser: () => Promise<void>
  resetPassword: (
    email: string,
    newPassword: string,
    confirmPassword: string,
    tokenResetPassword: string
  ) => Promise<void>
}

export const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isOtpVerified, setIsOtpVerified] = useState(false)
  const [authLoading, setAuthLoading] = useState(true)
  const navigate = useNavigate()

  // Initialize auth state from session storage
  useEffect(() => {
    const storedUser = sessionStorage.getItem('auth_user')
    const storedOtpStatus = sessionStorage.getItem('otp_verified')
    // Ưu tiên lấy accessToken từ localStorage nếu có rememberMe
    const rememberMe = localStorage.getItem('rememberMe') === 'true'
    const storedAccessToken = rememberMe ? localStorage.getItem('accessToken') : sessionStorage.getItem('accessToken')
    console.log('[AuthProvider] useEffect mount:')
    console.log('  storedUser:', storedUser)
    console.log('  storedOtpStatus:', storedOtpStatus)
    console.log('  storedAccessToken:', storedAccessToken)
    if (storedAccessToken) {
      axiosClient.defaults.headers.common['Authorization'] = `Bearer ${storedAccessToken}`
      // Decode accessToken để lấy lại user info
      try {
        const tokenPayload = JSON.parse(atob(storedAccessToken.split('.')[1]))
        const currentUser = {
          id: tokenPayload.ID || '',
          email: tokenPayload.Email || '',
          fullName: tokenPayload.FullName || '',
          role: tokenPayload['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'] || '',
          phoneNumber: '',
          username: tokenPayload.Username || ''
        }
        setUser(currentUser)
        sessionStorage.setItem('auth_user', JSON.stringify(currentUser))
        setIsOtpVerified(true)
      } catch (e) {
        setUser(null)
        setIsOtpVerified(false)
        sessionStorage.removeItem('auth_user')
        if (rememberMe) {
          localStorage.removeItem('accessToken')
        } else {
          sessionStorage.removeItem('accessToken')
        }
      }
    }
    setAuthLoading(false)

    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser)
        setUser(parsedUser)
        setIsOtpVerified(storedOtpStatus === 'true')
        // Nếu user thiếu fullName, tự động lấy lại từ API /user/{userId}
        if (storedOtpStatus === 'true' && (!parsedUser.fullName || parsedUser.fullName === '')) {
          // Lấy userId từ token
          let userId = ''
          if (storedAccessToken) {
            try {
              const tokenPayload = JSON.parse(atob(storedAccessToken.split('.')[1]))
              userId = tokenPayload.ID
            } catch (e) {
              userId = ''
            }
          }
          if (userId) {
            authApi
              .getUserById(userId)
              .then((currentUser) => {
                setUser({ ...parsedUser, ...currentUser })
                sessionStorage.setItem('auth_user', JSON.stringify({ ...parsedUser, ...currentUser }))
                console.log('Auto-fetched user info from /user/{userId}:', currentUser)
              })
              .catch((error) => {
                console.warn('Could not auto-fetch user info from /user/{userId}:', error)
              })
          }
        }
      } catch (error) {
        console.error('Error parsing stored user:', error)
        sessionStorage.removeItem('auth_user')
        sessionStorage.removeItem('otp_verified')
      }
    }
  }, []) // Empty dependency array to run only once on mount

  useEffect(() => {
    console.log('[AuthProvider] user:', user)
    console.log('[AuthProvider] authLoading:', authLoading)
  }, [user, authLoading])

  const login = async (username: string, password: string) => {
    try {
      setError(null) // Clear any previous errors
      console.log('Starting login process...')
      const response = await authApi.login(username, password)
      console.log('Login response:', response)
      const { accessToken, refreshToken } = response

      // Store tokens
      axiosClient.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`
      localStorage.setItem('refreshToken', refreshToken)
      // Lưu accessToken vào localStorage nếu rememberMe, ngược lại dùng sessionStorage
      const rememberMe = localStorage.getItem('rememberMe') === 'true'
      if (rememberMe) {
        localStorage.setItem('accessToken', accessToken)
      } else {
        sessionStorage.setItem('accessToken', accessToken)
      }

      // Get current user information including role from JWT token
      let currentUser: User | null = null
      try {
        // Decode JWT token to get user info
        const tokenPayload = JSON.parse(atob(accessToken.split('.')[1]))

        currentUser = {
          id: tokenPayload.ID || '',
          email: tokenPayload.Email || '',
          fullName: tokenPayload.FullName || '',
          role: tokenPayload['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'] || '',
          phoneNumber: '',
          username: username
        }

        setUser(currentUser)
        sessionStorage.setItem('auth_user', JSON.stringify(currentUser))
        sessionStorage.setItem('otp_verified', 'true')
        setIsOtpVerified(true)
      } catch (userError) {
        console.warn('Could not decode JWT token, using basic user info:', userError)
        // Fallback to basic user info
        currentUser = { email: '', fullName: '', id: '', role: '', phoneNumber: '', username: username }
        setUser(currentUser)
        sessionStorage.setItem('auth_user', JSON.stringify(currentUser))
        sessionStorage.setItem('otp_verified', 'true')
        setIsOtpVerified(true)
      }

      console.log('Login successful, redirecting...')
      setTimeout(() => {
        // Check if user is admin and redirect accordingly
        if (
          currentUser &&
          (currentUser.role === 0 ||
            currentUser.role === '0' ||
            currentUser.role === 'Admin' ||
            currentUser.role === 'admin')
        ) {
          navigate('/admin/users', { replace: true })
        } else {
          navigate('/projects', { replace: true })
        }
      }, 200) // Add a small delay for toast to appear
    } catch (error: any) {
      console.error('Login error:', error)
      // Set a user-friendly error message
      const errorMessage =
        error.response?.data?.message || error.message || 'Login failed. Please check your credentials and try again.'
      setError(errorMessage)
      // Don't throw the error - this prevents any unhandled promise rejection
    }
  }

  // const register = async (email: string, fullName: string, password: string, confirmPassword: string) => {
  //   try {
  //     console.log('Starting registration process...')
  //     setError(null)
  //     const response = await authApi.register(email, fullName, password, confirmPassword)
  //     console.log('Registration response:', response)
  //     const { accessToken, refreshToken } = response

  //     // Store tokens
  //     axiosClient.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`
  //     localStorage.setItem('refreshToken', refreshToken)
  //     sessionStorage.setItem('accessToken', accessToken)

  //     // Store user info
  //     sessionStorage.setItem('auth_user', JSON.stringify({ email })) // Only store email in session storage for simplification
  //     sessionStorage.setItem('otp_verified', 'false')
  //     setUser({ email: email, fullName: '', id: '', role: '', phoneNumber: '', username: '' }) // Simplified User object for initial state, removed avatar as it's not in User interface
  //     setIsOtpVerified(false)

  //     console.log('Registration successful, redirecting to OTP page...')
  //     setTimeout(() => {
  //       navigate('/verify-otp', { replace: true })
  //     }, 200) // Add a small delay for toast to appear
  //   } catch (error: any) {
  //     console.error('Registration error:', error)
  //     setError(error.message || 'Failed to register')
  //     throw error
  //   }
  // }

  const logout = () => {
    authApi.logout()
    setUser(null)
    setIsOtpVerified(false)
    sessionStorage.removeItem('auth_user')
    sessionStorage.removeItem('otp_verified')
    sessionStorage.removeItem('accessToken')
    localStorage.removeItem('accessToken')
    localStorage.removeItem('rememberMe')
    navigate('/login', { replace: true })
  }

  const resendVerificationEmail = async () => {
    try {
      setError(null)
      await authApi.resendVerificationEmail()
    } catch (error: any) {
      setError(error.message || 'Failed to resend verification email')
      throw error
    }
  }

  const verifyEmail = async (token: string) => {
    try {
      await authApi.verifyEmail(token)
      setTimeout(() => {
        navigate('/add-info', { replace: true })
      }, 200) // Add a small delay for toast to appear
    } catch (error: any) {
      setError(error.message || 'Failed to verify email')
      throw error
    }
  }

  const verifyOtp = async (otp: string) => {
    try {
      setError(null)
      await authApi.verifyOtp(otp)
      setIsOtpVerified(true)
      sessionStorage.setItem('otp_verified', 'true')
      setTimeout(() => {
        navigate('/add-info', { replace: true })
      }, 200) // Add a small delay for toast to appear
    } catch (error: any) {
      setError(error.message || 'Failed to verify OTP')
      throw error
    }
  }

  const addUsername = async (username: string, avatar: File | null, phoneNumber: string) => {
    try {
      console.log('Starting addUsername process...')
      console.log('Current authorization header:', axiosClient.defaults.headers.common['Authorization'])
      console.log('Access token from session storage:', sessionStorage.getItem('accessToken'))

      setError(null)
      const updatedUser = await authApi.addUsername(username, avatar, phoneNumber)
      console.log('Add username response:', updatedUser)
      setUser(updatedUser)
      sessionStorage.setItem('auth_user', JSON.stringify(updatedUser))
      setIsOtpVerified(true)
      sessionStorage.setItem('otp_verified', 'true')
      console.log('Add username successful, redirecting...')
      setTimeout(() => {
        // Check if user is admin and redirect accordingly
        if (
          updatedUser &&
          (updatedUser.role === 0 ||
            updatedUser.role === '0' ||
            updatedUser.role === 'Admin' ||
            updatedUser.role === 'admin')
        ) {
          navigate('/admin/users', { replace: true })
        } else {
          navigate('/projects/new', { replace: true })
        }
      }, 200)
    } catch (error: any) {
      console.error('Add username error:', error)
      setError(error.message || 'Failed to add username')
      throw error
    }
  }

  const activate = async (
    email: string,
    username: string,
    newPassword: string,
    confirmPassword: string,
    tokenResetPassword: string
  ) => {
    try {
      await authApi.activate(email, username, newPassword, confirmPassword, tokenResetPassword)
    } catch (error: any) {
      setError(error.message || 'Failed to activate account')
      throw error
    }
  }

  const getCurrentUser = async () => {
    try {
      const currentUser = await authApi.getCurrentUser()
      console.log('🔍 API getCurrentUser response:', currentUser)
      console.log('🔍 API response role:', currentUser?.role)
      console.log('🔍 API response role type:', typeof currentUser?.role)
      setUser(currentUser)
      sessionStorage.setItem('auth_user', JSON.stringify(currentUser))
      sessionStorage.setItem('otp_verified', 'true')
      setIsOtpVerified(true)
    } catch (error: any) {
      console.error('Error getting current user:', error)
      setError(error.message || 'Failed to get current user')
      throw error
    }
  }

  const resetPassword = async (
    email: string,
    newPassword: string,
    confirmPassword: string,
    tokenResetPassword: string
  ) => {
    try {
      await authApi.resetPassword(email, newPassword, confirmPassword, tokenResetPassword)
    } catch (error: any) {
      setError(error.message || 'Failed to reset password')
      throw error
    }
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        isOtpVerified,
        isAuthenticated: !!user,
        authLoading,
        login,
        // register,
        logout,
        error,
        resendVerificationEmail,
        verifyEmail,
        verifyOtp,
        addUsername,
        activate,
        getCurrentUser,
        resetPassword
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}
