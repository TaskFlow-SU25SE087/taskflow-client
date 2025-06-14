import { FC, ReactNode, useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { AuthContext } from '@/hooks/useAuthContext'
import { useAuthService } from '@/hooks/useAuthService'
import { AuthResponse } from '@/types/auth'

interface AuthProviderProps {
  children: ReactNode
}

export const AuthProvider: FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<AuthResponse | null>(() => {
    const storedUser = sessionStorage.getItem('auth_user')
    return storedUser ? JSON.parse(storedUser) : null
  })
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isAuthenticated, setIsAuthenticated] = useState(() => !!sessionStorage.getItem('auth_user'))

  const authService = useAuthService()
  const navigate = useNavigate()

  useEffect(() => {
    if (user) {
      sessionStorage.setItem('auth_user', JSON.stringify(user))
    } else {
      sessionStorage.removeItem('auth_user')
    }
  }, [user])

  const value = {
    user,
    error,
    isLoading,
    isAuthenticated,
    login: async (email: string, password: string) => {
      setIsLoading(true)
      setError(null)
      try {
        const userData = await authService.login(email, password)
        setUser(userData)
        setIsAuthenticated(true)
        navigate('/projects')
      } catch (err) {
        setIsAuthenticated(false)
        setError(err instanceof Error ? err.message : 'An unexpected error occurred')
      } finally {
        setIsLoading(false)
      }
    },
    logout: () => {
      authService.logout()
      setUser(null)
      setIsAuthenticated(false)
      navigate('/login')
    },
    register: async (name: string, email: string, password: string) => {
      setIsLoading(true)
      setError(null)
      try {
        const userData = await authService.register(name, email, password)
        setUser(userData)
        setIsAuthenticated(true)
        navigate('/projects/new')
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An unexpected error occurred')
      } finally {
        setIsLoading(false)
      }
    }
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
