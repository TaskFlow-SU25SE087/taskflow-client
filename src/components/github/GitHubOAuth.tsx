import { Github, Loader } from 'lucide-react'
import { useState } from 'react'
import { useWebhooks } from '../../hooks/useWebhooks'
import { GitHubRepository } from '../../types/webhook'
import { Button } from '../ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select'

interface GitHubOAuthProps {
  projectId: string
  partId: string
  onConnectionSuccess?: () => void
}

export default function GitHubOAuth({ projectId, partId, onConnectionSuccess }: GitHubOAuthProps) {
  const [selectedRepo, setSelectedRepo] = useState<string>('')
  const [isConnecting, setIsConnecting] = useState(false)

  const { repositories, oauthLoading, startGitHubOAuth, connectOAuthRepository } = useWebhooks()

  // Note: Removed fetchConnectionStatus because /projects/{projectId}/parts/{partId}/repo-status endpoint doesn't exist
  // Connection status will be managed through the OAuth flow

  const handleStartOAuth = async () => {
    try {
      const returnUrl = window.location.origin + window.location.pathname
      await startGitHubOAuth(projectId, partId, returnUrl)
    } catch (error) {
      console.error('Failed to start OAuth:', error)
    }
  }

  const handleConnectRepository = async () => {
    if (!selectedRepo) return

    setIsConnecting(true)
    try {
      await connectOAuthRepository({
        projectId,
        partId,
        repositoryId: parseInt(selectedRepo.split('/')[0]),
        repositoryName: selectedRepo.split('/')[1],
        repositoryFullName: selectedRepo
      })

      if (onConnectionSuccess) {
        onConnectionSuccess()
      }
    } catch (error) {
      console.error('Failed to connect repository:', error)
    } finally {
      setIsConnecting(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className='flex items-center gap-2'>
          <Github className='h-5 w-5' />
          GitHub OAuth Connection
        </CardTitle>
      </CardHeader>
      <CardContent className='space-y-4'>
        {!repositories ? (
          <div className='space-y-4'>
            <div className='text-center py-8'>
              <Github className='h-16 w-16 mx-auto mb-4 text-gray-300' />
              <h3 className='text-lg font-semibold mb-2'>Connect Your GitHub Account</h3>
              <p className='text-gray-600 mb-6'>
                Use GitHub OAuth to securely connect your repositories without manually entering tokens.
              </p>

              <Button onClick={handleStartOAuth} disabled={oauthLoading} size='lg' className='w-full max-w-md'>
                {oauthLoading ? (
                  <>
                    <Loader className='h-4 w-4 mr-2 animate-spin' />
                    Connecting to GitHub...
                  </>
                ) : (
                  <>
                    <Github className='h-4 w-4 mr-2' />
                    Connect with GitHub
                  </>
                )}
              </Button>
            </div>
          </div>
        ) : (
          <div className='space-y-4'>
            <div>
              <h4 className='font-medium mb-2'>Select Repository</h4>
              <Select value={selectedRepo} onValueChange={setSelectedRepo}>
                <SelectTrigger>
                  <SelectValue placeholder='Choose a repository' />
                </SelectTrigger>
                <SelectContent>
                  {repositories.repositories.map((repo: GitHubRepository) => (
                    <SelectItem key={repo.id} value={repo.html_url}>
                      {repo.full_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedRepo && (
              <Button onClick={handleConnectRepository} disabled={isConnecting} className='w-full'>
                {isConnecting ? (
                  <>
                    <Loader className='mr-2 h-4 w-4 animate-spin' />
                    Connecting Repository...
                  </>
                ) : (
                  'Connect Selected Repository'
                )}
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
