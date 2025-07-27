import { useParams } from 'react-router-dom'
import GitHubProjectPartIntegration from '../../components/github/GitHubProjectPartIntegration'

export default function GitHubProjectPartIntegrationPage() {
  const { projectId, partId } = useParams<{ projectId: string; partId?: string }>()

  if (!projectId) {
    return (
      <div className='container mx-auto py-8'>
        <div className='text-center'>
          <h1 className='text-2xl font-bold text-red-600'>Error</h1>
          <p className='text-gray-600'>Project ID is required</p>
        </div>
      </div>
    )
  }

  return (
    <div className='container mx-auto py-8'>
      <GitHubProjectPartIntegration projectId={projectId} partId={partId} />
    </div>
  )
}
