import { createContext, ReactNode, useContext, useEffect, useState } from 'react'

interface GitHubStatusContextType {
  connectionStatus: boolean | null
  isLoading: boolean
  updateConnectionStatus: (status: boolean | null) => void
  setLoading: (loading: boolean) => void
}

const GitHubStatusContext = createContext<GitHubStatusContextType | undefined>(undefined)

interface GitHubStatusProviderProps {
  children: ReactNode
}

export function GitHubStatusProvider({ children }: GitHubStatusProviderProps) {
  const [globalConnectionStatus, setGlobalConnectionStatus] = useState<boolean | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Khởi tạo trạng thái ban đầu
  useEffect(() => {
    // Có thể lấy trạng thái từ localStorage hoặc API
    const savedStatus = localStorage.getItem('github_connection_status')
    if (savedStatus) {
      setGlobalConnectionStatus(savedStatus === 'true')
    } else {
      setGlobalConnectionStatus(null)
    }
    setIsLoading(false)
  }, [])

  // Hàm để cập nhật trạng thái thủ công
  const updateConnectionStatus = (status: boolean | null) => {
    setGlobalConnectionStatus(status)
    setIsLoading(false)
    
    // Lưu vào localStorage để persist
    if (status !== null) {
      localStorage.setItem('github_connection_status', status.toString())
    } else {
      localStorage.removeItem('github_connection_status')
    }
  }

  // Hàm để set loading state
  const setLoading = (loading: boolean) => {
    setIsLoading(loading)
  }

  const value: GitHubStatusContextType = {
    connectionStatus: globalConnectionStatus,
    isLoading,
    updateConnectionStatus,
    setLoading
  }

  return (
    <GitHubStatusContext.Provider value={value}>
      {children}
    </GitHubStatusContext.Provider>
  )
}

export function useGitHubStatus() {
  const context = useContext(GitHubStatusContext)
  if (context === undefined) {
    throw new Error('useGitHubStatus must be used within a GitHubStatusProvider')
  }
  return context
} 