import { useEffect } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { projectApi } from '@/api/projects'

export default function LegacyProjectMemberVerify() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()

  useEffect(() => {
    const token = searchParams.get('token')
    if (!token) {
      navigate('/projects')
      return
    }
    // Gọi API để lấy projectId từ token (giả sử backend trả về projectId)
    projectApi
      .verifyJoinProjectLegacy(token)
      .then((result) => {
        if (result && result.projectId) {
          navigate(`/projects/${result.projectId}/members/verify-join?token=${token}`)
        } else {
          navigate('/projects')
        }
      })
      .catch(() => {
        navigate('/projects')
      })
  }, [navigate, searchParams])

  return (
    <div className='flex items-center justify-center min-h-screen'>
      <div className='text-lg'>Đang xác thực liên kết...</div>
    </div>
  )
}
