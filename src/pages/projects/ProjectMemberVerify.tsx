import { useEffect, useState } from 'react'
import { useParams, useSearchParams, useNavigate } from 'react-router-dom'
import { projectApi } from '@/api/projects'
import { Button } from '@/components/ui/button'

export default function ProjectMemberVerify() {
  const { projectId } = useParams<{ projectId: string }>()
  const [searchParams] = useSearchParams()
  const [status, setStatus] = useState<'pending' | 'success' | 'error'>('pending')
  const [message, setMessage] = useState('Verifying...')
  const navigate = useNavigate()

  useEffect(() => {
    const token = searchParams.get('token')
    if (!projectId || !token) {
      setStatus('error')
      setMessage('Missing verification information!')
      return
    }
    projectApi.verifyJoinProject(projectId, token)
      .then((ok) => {
        if (ok) {
          setStatus('success')
          setMessage('Project join verification successful!')
        } else {
          setStatus('error')
          setMessage('Verification failed or link expired!')
        }
      })
      .catch(() => {
        setStatus('error')
        setMessage('An error occurred during verification!')
      })
  }, [projectId, searchParams])

  return (
    <div className='flex flex-col items-center justify-center min-h-screen'>
      <div className='bg-white p-8 rounded shadow max-w-md w-full text-center'>
        <h1 className='text-2xl font-bold mb-4'>Project Join Verification</h1>
        <div className={`mb-4 ${status === 'success' ? 'text-green-600' : status === 'error' ? 'text-red-500' : ''}`}>
          {message}
        </div>
        <Button onClick={() => navigate('/projects')}>Back to Projects</Button>
      </div>
    </div>
  )
}
