import { authApi } from '@/api/auth'
import { projectApi } from '@/api/projects'
import axiosClient from '@/configs/axiosClient'
import { clearLastProjectForAllUsersExcept, clearLastProjectForUser, getLastProjectIdForUser } from '@/lib/utils'
import { User } from '@/types/auth'
import Cookies from 'js-cookie'
import { createContext, ReactNode, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'


interface AuthContextType {
  user: User | null
  isOtpVerified: boolean
  isAuthenticated: boolean
  authLoading: boolean
  login: (username: string, password: string) => Promise<void>

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

  // Initialize auth state from storage; try refresh with refreshToken for new tabs
  useEffect(() => {
    let cancelled = false

    const hydrateAuth = async () => {
      const storedUser = sessionStorage.getItem('auth_user')
      const storedOtpStatus = sessionStorage.getItem('otp_verified')
      const rememberMe = localStorage.getItem('rememberMe') === 'true'
      let accessToken = localStorage.getItem('accessToken') || sessionStorage.getItem('accessToken') || ''
      const refreshToken = localStorage.getItem('refreshToken')

      console.log('[AuthProvider] boot:', {
        hasStoredUser: !!storedUser,
        storedOtpStatus,
        hasAccessToken: !!accessToken,
        hasRefreshToken: !!refreshToken
      })

      // If we don't have an access token but do have a refresh token, try to refresh
      if (!accessToken && refreshToken) {
        try {
          const refreshed = await authApi.refreshToken(accessToken, refreshToken)
          accessToken = refreshed.accessToken
          axiosClient.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`
          // Persist token according to rememberMe; fallback to session for current tab
          if (rememberMe) {
            localStorage.setItem('accessToken', accessToken)
          }
          sessionStorage.setItem('accessToken', accessToken)
        } catch (e) {
          console.warn('[AuthProvider] Failed to refresh access token on boot:', e)
        }
      }

      // If we have an access token (either from storage or refresh), decode and set user
      if (accessToken) {
        try {
          const tokenPayload = JSON.parse(atob(accessToken.split('.')[1]))
          const currentUser = {
            id: tokenPayload.ID || '',
            email: tokenPayload.Email || '',
            fullName: tokenPayload.FullName || '',
            role: tokenPayload['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'] || '',
            phoneNumber: '',
            username: tokenPayload.Username || ''
          }
          if (cancelled) return
          axiosClient.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`
          setUser(currentUser)
          sessionStorage.setItem('auth_user', JSON.stringify(currentUser))
          setIsOtpVerified(true)
          sessionStorage.setItem('otp_verified', 'true')
        } catch (e) {
          if (cancelled) return
          setUser(null)
          setIsOtpVerified(false)
          sessionStorage.removeItem('auth_user')
          // Don't aggressively remove refresh token here; keep for later manual login
          sessionStorage.removeItem('accessToken')
          localStorage.removeItem('accessToken')
        }
      } else if (storedUser) {
        // If there's a stored user but no access token, treat as logged out to avoid ghost sessions
        console.warn('[AuthProvider] Stored user found without access token. Clearing stale auth state.')
        sessionStorage.removeItem('auth_user')
        sessionStorage.removeItem('otp_verified')
        setUser(null)
        setIsOtpVerified(false)
      }

      if (!cancelled) setAuthLoading(false)
    }

    hydrateAuth()
    return () => {
      cancelled = true
    }
  }, [])

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
      // Persist accessToken to both storages to support new tabs; logout clears both
      localStorage.setItem('accessToken', accessToken)
      sessionStorage.setItem('accessToken', accessToken)

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
        
        // Clear last project data for all other users to prevent data leakage
        clearLastProjectForAllUsersExcept(currentUser?.id)
      } catch (userError) {
        console.warn('Could not decode JWT token, using basic user info:', userError)
        // Fallback to basic user info
        currentUser = { email: '', fullName: '', id: '', role: '', phoneNumber: '', username: username }
        setUser(currentUser)
        sessionStorage.setItem('auth_user', JSON.stringify(currentUser))
        sessionStorage.setItem('otp_verified', 'true')
        setIsOtpVerified(true)
        
        // Clear last project data for all other users to prevent data leakage
        clearLastProjectForAllUsersExcept(currentUser?.id)
      }

      console.log('Login successful, redirecting...')
      setTimeout(async () => {
        // Admins go to admin panel as before
        const isAdmin =
          currentUser &&
          (currentUser.role === 0 ||
            currentUser.role === '0' ||
            currentUser.role === 'Admin' ||
            currentUser.role === 'admin')

        if (isAdmin) {
          navigate('/admin/dashboard', { replace: true })
          return
        }

        // For regular users, prefer the per-user last project if present; fall back to cookie/local
        const savedProjectId =
          getLastProjectIdForUser(currentUser?.id) ||
          Cookies.get('current_project_id') ||
          localStorage.getItem('currentProjectId')
        if (savedProjectId) {
          try {
            // Verify access; if unauthorized or not found, this will throw
            await projectApi.getProjectById(savedProjectId)
            navigate(`/projects/${savedProjectId}/board`, { replace: true })
          } catch (e: any) {
            // Clear stale project selection and go to projects list
            Cookies.remove('current_project_id')
            localStorage.removeItem('currentProjectId')
            clearLastProjectForUser(currentUser?.id)
            navigate('/projects', { replace: true })
          }
        } else {
          navigate('/projects', { replace: true })
        }
      }, 200) // Small delay for any UI effects
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
    localStorage.removeItem('refreshToken')
    localStorage.removeItem('rememberMe')
    
    // Clear current user's last project data on logout for security
    if (user?.id) {
      clearLastProjectForUser(user.id)
    }
    
    // Clear global fallback to avoid cross-account leakage
    Cookies.remove('current_project_id')
    localStorage.removeItem('currentProjectId')
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
          navigate('/admin/dashboard', { replace: true })
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
