import { Github, Loader } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useWebhooks } from '../../hooks/useWebhooks'
import { Badge } from '../ui/badge'

interface GitHubSidebarItemProps {
  projectId: string
  partId: string
}

export default function GitHubSidebarItem({ projectId, partId }: GitHubSidebarItemProps) {
  const [isChecking, setIsChecking] = useState(false)
  const { connectionStatus } = useWebhooks()

  // Note: Removed fetchConnectionStatus because /projects/{projectId}/parts/{partId}/repo-status endpoint doesn't exist
  // For now, we'll use a simple connection status check or mock data

  const checkConnection = async () => {
    setIsChecking(true)
    try {
      // Since the API endpoint doesn't exist, we'll simulate a connection check
      // In a real implementation, you would use a different approach
      await new Promise((resolve) => setTimeout(resolve, 1000))
    } catch (error) {
      console.error('Failed to check connection:', error)
    } finally {
      setIsChecking(false)
    }
  }

  useEffect(() => {
    checkConnection()
  }, [projectId, partId])

  return (
    <div className='flex items-center gap-2 p-2 rounded-lg hover:bg-gray-100 transition-colors'>
      <Github className='h-4 w-4 text-gray-600' />
      <span className='text-sm font-medium text-gray-700'>GitHub</span>

      <div className='ml-auto'>
        {isChecking ? (
          <Loader className='h-3 w-3 animate-spin text-gray-400' />
        ) : connectionStatus?.isConnected ? (
          <Badge variant='default' className='text-xs'>
            Connected
          </Badge>
        ) : (
          <Badge variant='secondary' className='text-xs'>
            Not Connected
          </Badge>
        )}
      </div>
    </div>
  )
}
