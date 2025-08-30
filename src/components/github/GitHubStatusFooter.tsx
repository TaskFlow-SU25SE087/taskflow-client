import { useGitHubStatus } from '@/contexts/GitHubStatusContext'
import { CheckCircle, Github, Loader2, XCircle } from 'lucide-react'

export default function GitHubStatusFooter() {
  const { connectionStatus, isLoading } = useGitHubStatus()

  const getStatusDisplay = () => {
    if (isLoading) {
      return (
        <div className='flex items-center gap-2 text-gray-500'>
          <Loader2 className='h-4 w-4 animate-spin' />
          <span className='text-sm'>Checking GitHub connection...</span>
        </div>
      )
    }

    if (connectionStatus === true) {
      return (
        <div className='flex items-center gap-2 text-green-600'>
          <Github className='h-4 w-4' />
          <CheckCircle className='h-4 w-4' />
          <span className='text-sm font-medium'>GitHub Connected</span>
        </div>
      )
    }

    if (connectionStatus === false) {
      return (
        <div className='flex items-center gap-2 text-orange-600'>
          <Github className='h-4 w-4' />
          <XCircle className='h-4 w-4' />
          <span className='text-sm font-medium'>GitHub Not Connected</span>
        </div>
      )
    }

    // connectionStatus === null
    return (
      <div className='flex items-center gap-2 text-gray-500'>
        <Github className='h-4 w-4' />
        <span className='text-sm font-medium'>GitHub Status Unknown</span>
      </div>
    )
  }

  return (
          <div className='fixed bottom-4 right-4 bg-white border border-gray-200 rounded-lg shadow-lg px-3 py-2 z-[9995]'>
      {getStatusDisplay()}
    </div>
  )
} 