import { projectApi } from '@/api/projects'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/hooks/useAuth'
import { useEffect, useState } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'

export default function ProjectMemberVerify() {
  const { projectId } = useParams<{ projectId: string }>()
  const [searchParams] = useSearchParams()
  const [status, setStatus] = useState<'pending' | 'success' | 'error'>('pending')
  const [message, setMessage] = useState('Verifying...')
  const navigate = useNavigate()
  const { user } = useAuth()

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
          setTimeout(() => {
            if (!user) {
              navigate('/login', { replace: true })
            } else {
              navigate(`/projects/${projectId}`, { replace: true })
            }
          }, 1200)
        } else {
          setStatus('error')
          setMessage('Verification failed or link expired!')
        }
      })
      .catch(() => {
        setStatus('error')
        setMessage('An error occurred during verification!')
      })
  }, [projectId, searchParams, user, navigate])

  if (!user) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-white p-4">
        <div className="max-w-md w-full text-center space-y-6">
          <h2 className="text-2xl font-bold text-gray-900">You need to log in to verify your membership.</h2>
          <button
            onClick={() => navigate('/login')}
            className="px-6 py-3 bg-blue-600 text-white rounded font-semibold hover:bg-blue-700 transition"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

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
