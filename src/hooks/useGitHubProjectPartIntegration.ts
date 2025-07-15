import { useToastContext } from '@/components/ui/ToastContext'
import { useCallback, useState } from 'react'
import {
  connectRepositoryToPart,
  createProjectPart,
  getGitHubLoginUrl,
  getGitHubRepositories,
  handleGitHubOAuthCallback
} from '../api/github'

export interface GitHubConnectionStatus {
  isConnected: boolean
  username?: string
  avatarUrl?: string
}

export interface GitHubRepo {
  id: number
  name: string
  fullName: string
  description: string
  htmlUrl: string
  private: boolean
  language: string
  updatedAt: string
}

export interface ProjectPart {
  id: string
  name: string
  programmingLanguage: string
  framework: string
  repoUrl?: string
  isConnected?: boolean
}

export function useGitHubProjectPartIntegration() {
  const { showToast } = useToastContext()

  // States
  const [connectionStatus, setConnectionStatus] = useState<GitHubConnectionStatus | null>(null)
  const [repositories, setRepositories] = useState<GitHubRepo[]>([])
  const [projectParts, setProjectParts] = useState<ProjectPart[]>([])

  // Loading states
  const [loading, setLoading] = useState(false)
  const [oauthLoading, setOauthLoading] = useState(false)
  const [reposLoading, setReposLoading] = useState(false)
  const [connectingRepo, setConnectingRepo] = useState(false)
  const [creatingPart, setCreatingPart] = useState(false)

  // Note: getGitHubConnectionStatus endpoint doesn't exist on backend
  // For now, we'll use a simple mock connection status
  const checkConnectionStatus = useCallback(
    async (projectId: string, partId: string) => {
      setLoading(true)
      try {
        // Mock connection status since API doesn't exist
        const mockStatus: GitHubConnectionStatus = {
          isConnected: false,
          username: undefined,
          avatarUrl: undefined
        }
        setConnectionStatus(mockStatus)
        return mockStatus
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to check connection status'
        showToast({ title: 'Error', description: errorMessage, variant: 'destructive' })
        throw error
      } finally {
        setLoading(false)
      }
    },
    [showToast]
  )

  // Step 2.1: Get GitHub OAuth login URL
  const startGitHubOAuth = useCallback(async () => {
    setOauthLoading(true)
    try {
      const response = await getGitHubLoginUrl()
      if (response.code === 200) {
        // Sửa điều kiện ở đây
        window.location.href = response.data
        return response.data
      } else {
        throw new Error(response.message || 'Failed to get OAuth URL')
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to start GitHub OAuth'
      showToast({ title: 'Error', description: errorMessage, variant: 'destructive' })
      throw error
    } finally {
      setOauthLoading(false)
    }
  }, [showToast])

  // Step 3: Fetch GitHub repositories
  const fetchRepositories = useCallback(async () => {
    setReposLoading(true)
    try {
      const response = await getGitHubRepositories()
      if (response.code === 0) {
        setRepositories(response.data)
        return response.data
      } else {
        throw new Error(response.message || 'Failed to fetch repositories')
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch GitHub repositories'
      showToast({ title: 'Error', description: errorMessage, variant: 'destructive' })
      throw error
    } finally {
      setReposLoading(false)
    }
  }, [showToast])

  // Step 2.4: Handle OAuth callback
  const handleOAuthCallback = useCallback(
    async (code: string) => {
      setOauthLoading(true)
      try {
        const response = await handleGitHubOAuthCallback(code)
        if (response.code === 0) {
          // OAuth successful, now fetch repositories
          await fetchRepositories()
          return response.data
        } else {
          throw new Error(response.message || 'OAuth callback failed')
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to handle OAuth callback'
        showToast({ title: 'Error', description: errorMessage, variant: 'destructive' })
        throw error
      } finally {
        setOauthLoading(false)
      }
    },
    [showToast, fetchRepositories]
  )

  // Step 4: Create new project part
  const createNewProjectPart = useCallback(
    async (
      projectId: string,
      partData: {
        name: string
        programmingLanguage: string
        framework: string
      }
    ) => {
      setCreatingPart(true)
      try {
        const response = await createProjectPart(projectId, partData)
        if (response.code === 0) {
          showToast({ title: 'Success', description: 'Project part created successfully' })
          return response.data
        } else {
          throw new Error(response.message || 'Failed to create project part')
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to create project part'
        showToast({ title: 'Error', description: errorMessage, variant: 'destructive' })
        throw error
      } finally {
        setCreatingPart(false)
      }
    },
    [showToast]
  )

  // Step 5: Connect repository to project part
  const connectRepoToPart = useCallback(
    async (projectId: string, partId: string, repoUrl: string, accessToken: string) => {
      setConnectingRepo(true)
      try {
        const response = await connectRepositoryToPart(projectId, partId, { repoUrl, accessToken })
        if (response.code === 0) {
          showToast({ title: 'Success', description: 'Repository connected successfully' })
          return response.data
        } else {
          throw new Error(response.message || 'Failed to connect repository')
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to connect repository'
        showToast({ title: 'Error', description: errorMessage, variant: 'destructive' })
        throw error
      } finally {
        setConnectingRepo(false)
      }
    },
    [showToast]
  )

  // Note: Since getProjectParts endpoint doesn't exist, we'll manage project parts locally
  // or use a different approach. For now, we'll provide a way to set project parts manually
  const setProjectPartsData = useCallback((parts: ProjectPart[]) => {
    setProjectParts(parts)
  }, [])

  // Disconnect repository (placeholder - implement if backend supports it)
  const disconnectRepository = useCallback(
    async (projectId: string, partId: string) => {
      showToast({ title: 'Info', description: 'Disconnect functionality not yet implemented' })
    },
    [showToast]
  )

  return {
    // States
    connectionStatus,
    repositories,
    projectParts,

    // Loading states
    loading,
    oauthLoading,
    reposLoading,
    connectingRepo,
    creatingPart,

    // Functions
    checkConnectionStatus,
    startGitHubOAuth,
    handleOAuthCallback,
    fetchRepositories,
    createNewProjectPart,
    connectRepoToPart,
    setProjectPartsData,
    disconnectRepository
  }
}
