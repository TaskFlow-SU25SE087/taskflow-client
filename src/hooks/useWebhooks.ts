import { useCallback, useState } from 'react'
import {
    connectGitHubRepository,
    connectRepositoryToPart,
    disconnectRepositoryFromPart,
    getProjectPartCommits,
    getProjectPartQuality,
    handleGitHubOAuthCallback,
    initiateGitHubOAuth
} from '../api/webhooks'
import {
    CodeQualityResponse,
    CommitsResponse,
    GitHubOAuthCallback,
    GitHubOAuthConnectRequest,
    GitHubOAuthRepositoryResponse,
    RepositoryConnectionResponse
} from '../types/webhook'

import { CommitStatus } from '../types/webhook'

export function useWebhooks() {
  // State
  const [commits, setCommits] = useState<CommitsResponse['data']>([])
  const [qualityResults, setQualityResults] = useState<CodeQualityResponse['data']>([])
  const [connectionStatus, setConnectionStatus] = useState<RepositoryConnectionResponse['data'] | null>(null)
  const [repositories, setRepositories] = useState<GitHubOAuthRepositoryResponse['data'] | null>(null)

  // Loading states
  const [commitsLoading, setCommitsLoading] = useState(false)
  const [qualityLoading, setQualityLoading] = useState(false)
  const [connectionLoading, setConnectionLoading] = useState(false)
  const [oauthLoading, setOauthLoading] = useState(false)

  // Error state
  const [error, setError] = useState<string | null>(null)

  // Fetch commits for a project part
  const fetchCommits = useCallback(
    async (projectId: string, partId: string) => {
      setCommitsLoading(true)
      setError(null)
      try {
        const response = await getProjectPartCommits(projectId, partId)
        if (response.code === 0) {
          setCommits(response.data)
          return response.data
        } else {
          throw new Error(response.message)
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to fetch commits'
        setError(errorMessage)
        // toast({
        //   title: 'Error',
        //   description: errorMessage,
        //   variant: 'destructive'
        // })
        throw err
      } finally {
        setCommitsLoading(false)
      }
    },
    []
  )

  // Fetch quality results for a project part
  const fetchQualityResults = useCallback(
    async (projectId: string, partId: string) => {
      setQualityLoading(true)
      setError(null)
      try {
        const response = await getProjectPartQuality(projectId, partId)
        if (response.code === 0) {
          setQualityResults(response.data)
          return response.data
        } else {
          throw new Error(response.message)
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to fetch quality results'
        setError(errorMessage)
        // toast({
        //   title: 'Error',
        //   description: errorMessage,
        //   variant: 'destructive'
        // })
        throw err
      } finally {
        setQualityLoading(false)
      }
    },
    []
  )

  // Connect repository to project part
  const connectRepository = useCallback(
    async (projectId: string, partId: string, repoUrl: string, accessToken: string) => {
      setConnectionLoading(true)
      setError(null)
      try {
        const response = await connectRepositoryToPart(projectId, partId, {
          projectId,
          partId,
          repoUrl,
          accessToken
        })
        if (response.code === 0) {
          setConnectionStatus(response.data)
          // toast({
          //   title: 'Success',
          //   description: 'Repository connected successfully!',
          //   variant: 'default'
          // })
          return response.data
        } else {
          throw new Error(response.message)
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to connect repository'
        setError(errorMessage)
        // toast({
        //   title: 'Error',
        //   description: errorMessage,
        //   variant: 'destructive'
        // })
        throw err
      } finally {
        setConnectionLoading(false)
      }
    },
    []
  )

  // Disconnect repository from project part
  const disconnectRepository = useCallback(
    async (projectId: string, partId: string) => {
      setConnectionLoading(true)
      setError(null)
      try {
        const response = await disconnectRepositoryFromPart(projectId, partId)
        if (response.code === 0) {
          setConnectionStatus(response.data)
          // toast({
          //   title: 'Success',
          //   description: 'Repository disconnected successfully!',
          //   variant: 'default'
          // })
          return response.data
        } else {
          throw new Error(response.message)
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to disconnect repository'
        setError(errorMessage)
        // toast({
        //   title: 'Error',
        //   description: errorMessage,
        //   variant: 'destructive'
        // })
        throw err
      } finally {
        setConnectionLoading(false)
      }
    },
    []
  )

  

  const startGitHubOAuth = useCallback(
    async (projectId: string, partId: string, returnUrl: string) => {
      setOauthLoading(true)
      setError(null)
      try {
        const response = await initiateGitHubOAuth(projectId, partId, returnUrl)
        if (response.code === 0) {
          // Redirect to GitHub OAuth
          window.location.href = response.data.authUrl
          return response.data.authUrl
        } else {
          throw new Error(response.message)
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to start GitHub OAuth'
        setError(errorMessage)
        // toast({
        //   title: 'Error',
        //   description: errorMessage,
        //   variant: 'destructive'
        // })
        throw err
      } finally {
        setOauthLoading(false)
      }
    },
    []
  )

  const handleOAuthCallback = useCallback(
    async (callback: GitHubOAuthCallback) => {
      setOauthLoading(true)
      setError(null)
      try {
        const response = await handleGitHubOAuthCallback(callback)
        if (response.code === 0) {
          setRepositories(response.data)
          return response.data
        } else {
          throw new Error(response.message)
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to handle OAuth callback'
        setError(errorMessage)
        // toast({
        //   title: 'Error',
        //   description: errorMessage,
        //   variant: 'destructive'
        // })
        throw err
      } finally {
        setOauthLoading(false)
      }
    },
    []
  )

  const connectOAuthRepository = useCallback(
    async (request: GitHubOAuthConnectRequest) => {
      setConnectionLoading(true)
      setError(null)
      try {
        const response = await connectGitHubRepository(request)
        if (response.code === 0) {
          setConnectionStatus(response.data)
          setRepositories(null) // Clear repositories after connection
          // toast({
          //   title: 'Success',
          //   description: 'Repository connected successfully via OAuth!',
          //   variant: 'default'
          // })
          return response.data
        } else {
          throw new Error(response.message)
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to connect repository'
        setError(errorMessage)
        // toast({
        //   title: 'Error',
        //   description: errorMessage,
        //   variant: 'destructive'
        // })
        throw err
      } finally {
        setConnectionLoading(false)
      }
    },
    []
  )

  // Note: fetchConnectionStatus function removed because /projects/{projectId}/parts/{partId}/repo-status endpoint doesn't exist

  // Get commits by status
  const getCommitsByStatus = useCallback(
    (status: CommitStatus) => {
      return commits.filter((commit) => commit.status === status)
    },
    [commits]
  )

  // Get latest commit
  const getLatestCommit = useCallback(() => {
    if (commits.length === 0) return null
    return commits.sort((a, b) => new Date(b.commitDate).getTime() - new Date(a.commitDate).getTime())[0]
  }, [commits])

  // Get latest quality result
  const getLatestQualityResult = useCallback(() => {
    if (qualityResults.length === 0) return null
    return qualityResults.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0]
  }, [qualityResults])

  

  

  return {
    // State
    commits,
    qualityResults,
    connectionStatus,
    loading: commitsLoading || qualityLoading || connectionLoading,
    error,

    // Actions
    fetchCommits,
    fetchQualityResults,
    connectRepository,
    disconnectRepository,

    // Utilities
    getCommitsByStatus,
    getLatestCommit,
    getLatestQualityResult,

    // Individual loading states
    commitsLoading,
    qualityLoading,
    connectionLoading,

    // OAuth returns
    oauthLoading,
    repositories,
    startGitHubOAuth,
    handleOAuthCallback,
    connectOAuthRepository
  }
}
