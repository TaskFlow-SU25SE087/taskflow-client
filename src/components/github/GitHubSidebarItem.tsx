import { Github } from 'lucide-react'
import { Badge } from '../ui/badge'

interface GitHubSidebarItemProps {
  connectionStatus?: boolean | null
}

export default function GitHubSidebarItem({ connectionStatus }: GitHubSidebarItemProps) {
  return (
    <div className='flex items-center gap-2 p-2 rounded-lg hover:bg-gray-100 transition-colors'>
      <Github className='h-4 w-4 text-gray-600' />
      <span className='text-sm font-medium text-gray-700'>GitHub</span>
      <div className='ml-auto'>
        {connectionStatus ? (
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
