import { useToastContext } from '@/components/ui/ToastContext'
import { Github, Loader } from 'lucide-react'
import { useState } from 'react'
import { useGitHubStatus } from '../../contexts/GitHubStatusContext'
import { useWebhooks } from '../../hooks/useWebhooks'
import { Badge } from '../ui/badge'
import { Button } from '../ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { Input } from '../ui/input'
import { Label } from '../ui/label'

interface RepositoryConnectionProps {
  projectId: string
  partId: string
}

export default function RepositoryConnection({ projectId, partId }: RepositoryConnectionProps) {
  const [repoUrl, setRepoUrl] = useState('')
  const [accessToken, setAccessToken] = useState('')
  const [isConnecting, setIsConnecting] = useState(false)

  const { connectionStatus, connectRepository, disconnectRepository } = useWebhooks()
  const { showToast } = useToastContext()
  const { updateConnectionStatus } = useGitHubStatus()

  // Note: Removed fetchConnectionStatus because /projects/{projectId}/parts/{partId}/repo-status endpoint doesn't exist
  // Connection status will be managed through the connect/disconnect operations

  const handleConnect = async () => {
    if (!repoUrl || !accessToken) {
      showToast({ title: 'Error', description: 'Please enter both repo URL and access token', variant: 'destructive' })
      return
    }

    setIsConnecting(true)
    try {
      await connectRepository(projectId, partId, repoUrl, accessToken)
      setRepoUrl('')
      setAccessToken('')
      showToast({ title: 'Success', description: 'Repository connected successfully' })
      // Cập nhật trạng thái toàn cục khi kết nối thành công
      updateConnectionStatus(true)
    } catch (error) {
      showToast({ title: 'Error', description: 'Failed to connect repository', variant: 'destructive' })
      updateConnectionStatus(false)
    } finally {
      setIsConnecting(false)
    }
  }

  const handleDisconnect = async () => {
    try {
      await disconnectRepository(projectId, partId)
      showToast({ title: 'Success', description: 'Repository disconnected successfully' })
      // Cập nhật trạng thái toàn cục khi ngắt kết nối
      updateConnectionStatus(false)
    } catch (error) {
      showToast({ title: 'Error', description: 'Failed to disconnect repository', variant: 'destructive' })
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className='flex items-center gap-2'>
          <Github className='h-5 w-5' />
          Repository Connection
        </CardTitle>
      </CardHeader>
      <CardContent className='space-y-4'>
        {connectionStatus?.isConnected ? (
          <div className='space-y-4'>
            <div className='flex items-center justify-between'>
              <div>
                <p className='font-medium'>Connected Repository</p>
                <p className='text-sm text-gray-600'>{connectionStatus.webhookUrl || ''}</p>
              </div>
              <Badge variant='default'>Connected</Badge>
            </div>

            <Button variant='outline' onClick={handleDisconnect} className='w-full'>
              Disconnect Repository
            </Button>
          </div>
        ) : (
          <div className='space-y-4'>
            <div>
              <Label htmlFor='repoUrl'>Repository URL</Label>
              <Input
                id='repoUrl'
                type='url'
                placeholder='https://github.com/username/repository'
                value={repoUrl}
                onChange={(e) => setRepoUrl(e.target.value)}
              />
            </div>

            <div>
              <Label htmlFor='accessToken'>Access Token</Label>
              <Input
                id='accessToken'
                type='password'
                placeholder='GitHub Personal Access Token'
                value={accessToken}
                onChange={(e) => setAccessToken(e.target.value)}
              />
            </div>

            <Button onClick={handleConnect} disabled={!repoUrl || !accessToken || isConnecting} className='w-full'>
              {isConnecting ? (
                <>
                  <Loader className='mr-2 h-4 w-4 animate-spin' />
                  Connecting...
                </>
              ) : (
                <>
                  <Github className='mr-2 h-4 w-4' />
                  Connect Repository
                </>
              )}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
