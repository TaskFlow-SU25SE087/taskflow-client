import { authApi } from '@/api/auth'
import axiosClient from '@/configs/axiosClient'
import { User } from '@/types/auth'
import { createContext, ReactNode, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'

interface AuthContextType {
  user: User | null
  isOtpVerified: boolean
  isAuthenticated: boolean
  login: (username: string, password: string) => Promise<void>
  register: (email: string, fullName: string, password: string, confirmPassword: string) => Promise<void>
  logout: () => void
  error: string | null
  resendVerificationEmail: () => Promise<void>
  verifyEmail: (token: string) => Promise<void>
  verifyOtp: (otp: string) => Promise<void>
  addUsername: (username: string, avatar: File | null, phoneNumber: string) => Promise<void>
}

export const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isOtpVerified, setIsOtpVerified] = useState(false)
  const navigate = useNavigate()

  // Initialize auth state from session storage
  useEffect(() => {
    const storedUser = sessionStorage.getItem('auth_user')
    const storedOtpStatus = sessionStorage.getItem('otp_verified')
    
    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser)
        setUser(parsedUser)
        setIsOtpVerified(storedOtpStatus === 'true')
      } catch (error) {
        console.error('Error parsing stored user:', error)
        sessionStorage.removeItem('auth_user')
        sessionStorage.removeItem('otp_verified')
      }
    }
  }, []) // Empty dependency array to run only once on mount

  const login = async (username: string, password: string) => {
    try {
      console.log('Starting login process...')
      const response = await authApi.login(username, password)
      console.log('Login response:', response)
      const { accessToken, refreshToken } = response

      // Store tokens
      axiosClient.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`
      localStorage.setItem('refreshToken', refreshToken)

      // Store user info
      sessionStorage.setItem('auth_user', JSON.stringify({ username })) // Only store username in session storage for simplification
      sessionStorage.setItem('otp_verified', 'true')
      setUser({ email: '', fullName: '', id: '', role: '', phoneNumber: '', username: username }) // Simplified User object for initial state, added username
      setIsOtpVerified(true)

      console.log('Login successful, redirecting to OTP page...')
      setTimeout(() => {
        navigate('/projects', { replace: true })
      }, 200) // Add a small delay for toast to appear
    } catch (error: any) {
      console.error('Login error:', error)
      setError(error.message || 'Failed to login')
      throw error
    }
  }

  const register = async (email: string, fullName: string, password: string, confirmPassword: string) => {
    try {
      console.log('Starting registration process...')
      setError(null)
      const response = await authApi.register(email, fullName, password, confirmPassword)
      console.log('Registration response:', response)
      const { accessToken, refreshToken } = response

      // Store tokens
      axiosClient.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`
      localStorage.setItem('refreshToken', refreshToken)

      // Store user info
      sessionStorage.setItem('auth_user', JSON.stringify({ email })) // Only store email in session storage for simplification
      sessionStorage.setItem('otp_verified', 'false')
      setUser({ email: email, fullName: '', id: '', role: '', phoneNumber: '' }) // Simplified User object for initial state, removed avatar as it's not in User interface
      setIsOtpVerified(false)

      console.log('Registration successful, redirecting to OTP page...')
      setTimeout(() => {
        navigate('/verify-otp', { replace: true })
      }, 200) // Add a small delay for toast to appear
    } catch (error: any) {
      console.error('Registration error:', error)
      setError(error.message || 'Failed to register')
      throw error
    }
  }

  const logout = () => {
    authApi.logout()
    setUser(null)
    setIsOtpVerified(false)
    sessionStorage.removeItem('auth_user')
    sessionStorage.removeItem('otp_verified')
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
      setError(null)
      const updatedUser = await authApi.addUsername(username, avatar, phoneNumber)
      console.log('Add username response:', updatedUser)
      setUser(updatedUser)
      sessionStorage.setItem('auth_user', JSON.stringify(updatedUser))
      setIsOtpVerified(true)
      sessionStorage.setItem('otp_verified', 'true')
      console.log('Add username successful, redirecting to /projects/new...')
      setTimeout(() => {
        navigate('/projects/new', { replace: true })
      }, 200)
    } catch (error: any) {
      console.error('Add username error:', error)
      setError(error.message || 'Failed to add username')
      throw error
    }
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        isOtpVerified,
        isAuthenticated: !!user,
        login,
        register,
        logout,
        error,
        resendVerificationEmail,
        verifyEmail,
        verifyOtp,
        addUsername
      }}
    >
      {children}
    </AuthContext.Provider>
  )
} 