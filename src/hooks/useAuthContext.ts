import { AuthResponse } from '@/types/auth'
import { createContext } from 'react'

export interface AuthContextType {
  user: AuthResponse | null
  error: string | null
  isLoading: boolean
  isAuthenticated: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => void
  register: (name: string, email: string, password: string) => Promise<void>
}

export const AuthContext = createContext<AuthContextType>({
  user: null,
  error: null,
  isLoading: true,
  isAuthenticated: false,
  login: async () => {},
  logout: () => {},
  register: async () => {}
})
