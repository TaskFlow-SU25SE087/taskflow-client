import { CheckCircle, Github, Loader2, XCircle } from 'lucide-react'
import { Badge } from '../ui/badge'

interface GitHubSidebarItemProps {
  connectionStatus?: boolean | null
  isLoading?: boolean
}

export default function GitHubSidebarItem({ connectionStatus, isLoading = false }: GitHubSidebarItemProps) {
  const getStatusDisplay = () => {
    if (isLoading) {
      return (
        <div className='flex items-center gap-1'>
          <Loader2 className='h-3 w-3 animate-spin text-gray-500' />
          <span className='text-xs text-gray-500'>Checking...</span>
        </div>
      )
    }

    if (connectionStatus === true) {
      return (
        <Badge variant='default' className='text-xs bg-green-100 text-green-700 border-green-200'>
          <CheckCircle className='h-3 w-3 mr-1' />
          Connected
        </Badge>
      )
    }

    if (connectionStatus === false) {
      return (
        <Badge variant='secondary' className='text-xs bg-orange-100 text-orange-700 border-orange-200'>
          <XCircle className='h-3 w-3 mr-1' />
          Not Connected
        </Badge>
      )
    }

    // connectionStatus === null
    return (
      <Badge variant='outline' className='text-xs text-gray-500 border-gray-300'>
        Unknown
      </Badge>
    )
  }

  return (
    <div className='flex items-center gap-2 p-2 rounded-lg hover:bg-gray-100 transition-colors'>
      <Github className='h-4 w-4 text-gray-600' />
      <span className='text-sm font-medium text-gray-700'>GitHub</span>
      <div className='ml-auto'>
        {getStatusDisplay()}
      </div>
    </div>
  )
}
