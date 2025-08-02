import { useGitHubStatus } from '@/contexts/GitHubStatusContext'
import { CheckCircle, Github, Loader2, XCircle } from 'lucide-react'

export default function GitHubStatusIndicator() {
  const { connectionStatus, isLoading } = useGitHubStatus()

  const getStatusDisplay = () => {
    if (isLoading) {
      return (
        <div className='flex items-center gap-1 px-2 py-1 rounded-md bg-gray-50'>
          <Loader2 className='h-3 w-3 animate-spin text-gray-500' />
          <span className='text-xs text-gray-500'>GitHub...</span>
        </div>
      )
    }

    if (connectionStatus === true) {
      return (
        <div className='flex items-center gap-1 px-2 py-1 rounded-md bg-green-50 border border-green-200'>
          <Github className='h-3 w-3 text-green-600' />
          <CheckCircle className='h-3 w-3 text-green-600' />
          <span className='text-xs text-green-700 font-medium'>GitHub Connected</span>
        </div>
      )
    }

    if (connectionStatus === false) {
      return (
        <div className='flex items-center gap-1 px-2 py-1 rounded-md bg-orange-50 border border-orange-200'>
          <Github className='h-3 w-3 text-orange-600' />
          <XCircle className='h-3 w-3 text-orange-600' />
          <span className='text-xs text-orange-700 font-medium'>GitHub Not Connected</span>
        </div>
      )
    }

    // connectionStatus === null
    return (
      <div className='flex items-center gap-1 px-2 py-1 rounded-md bg-gray-50 border border-gray-200'>
        <Github className='h-3 w-3 text-gray-500' />
        <span className='text-xs text-gray-500 font-medium'>GitHub Unknown</span>
      </div>
    )
  }

  return (
    <div className='flex items-center'>
      {getStatusDisplay()}
    </div>
  )
} 