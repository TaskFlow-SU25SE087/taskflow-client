import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { projectApi } from '@/api/projects'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Sidebar } from '@/components/Sidebar'
import { Navbar } from '@/components/Navbar'

interface Member {
  id: string
  fullName: string
  avatar: string
  email: string
  role: string
}

export default function ProjectMembers() {
  const { projectId } = useParams<{ projectId: string }>()
  const navigate = useNavigate()
  const [members, setMembers] = useState<Member[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteLoading, setInviteLoading] = useState(false)
  const [selfId, setSelfId] = useState<string | null>(null)
  const [selfRole, setSelfRole] = useState<string | null>(null)
  const [sidebarOpen, setSidebarOpen] = useState(true)

  const fetchMembers = async () => {
    if (!projectId) return
    setLoading(true)
    setError(null)
    try {
      const data: Member[] = await projectApi.getProjectMembers(projectId)
      setMembers(data)
      // Xác định user hiện tại (giả sử backend trả về selfId/selfRole hoặc lấy từ context)
      // Ví dụ: nếu backend trả về selfId/selfRole trong data, hãy lấy ra
      // setSelfId(...); setSelfRole(...)
      // Tạm thời, nếu có user hiện tại trong localStorage hoặc context, bạn có thể so sánh với email
      const userEmail = localStorage.getItem('userEmail')
      if (userEmail) {
        const self = data.find((m) => m.email === userEmail)
        if (self) {
          setSelfId(self.id)
          setSelfRole(self.role)
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load members')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchMembers()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId])

  const handleInvite = async () => {
    if (!projectId || !inviteEmail) return
    setInviteLoading(true)
    try {
      await projectApi.addMemberToProject(projectId, inviteEmail)
      setInviteEmail('')
      fetchMembers()
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to invite member')
    } finally {
      setInviteLoading(false)
    }
  }

  const handleRemove = async (userId: string) => {
    if (!projectId) return
    if (!window.confirm('Remove this member?')) return
    try {
      await projectApi.removeProjectMember(projectId, userId)
      fetchMembers()
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to remove member')
    }
  }

  const handleLeave = async () => {
    if (!projectId) return
    if (!window.confirm('Bạn chắc chắn muốn rời khỏi project này?')) return
    try {
      await projectApi.leaveProject(projectId)
      navigate('/projects')
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to leave project')
    }
  }

  return (
    <div className='flex min-h-screen bg-gray-50'>
      <Sidebar isOpen={sidebarOpen} onToggle={() => setSidebarOpen((v) => !v)} />
      <div className='flex-1 flex flex-col'>
        <Navbar isSidebarOpen={sidebarOpen} toggleSidebar={() => setSidebarOpen((v) => !v)} />
        <main className='flex-1 max-w-2xl mx-auto p-6'>
          <h1 className='text-2xl font-bold mb-4'>Project Members</h1>
          <div className='flex gap-2 mb-6'>
            <Input placeholder='Invite by email...' value={inviteEmail} onChange={(e) => setInviteEmail(e.target.value)} />
            <Button onClick={handleInvite} disabled={inviteLoading || !inviteEmail}>
              {inviteLoading ? 'Inviting...' : 'Invite'}
            </Button>
            <Button variant='outline' color='red' onClick={handleLeave}>
              Rời khỏi project
            </Button>
          </div>
          {loading && <div>Loading...</div>}
          {error && <div className='text-red-500'>{error}</div>}
          <ul className='divide-y'>
            {members.map((m) => (
              <li key={m.id} className='flex items-center gap-4 py-3'>
                <img src={m.avatar} alt={m.fullName} className='w-10 h-10 rounded-full object-cover' />
                <div className='flex-1'>
                  <div className='font-semibold'>{m.fullName}</div>
                  <div className='text-sm text-gray-500'>{m.email}</div>
                  <div className='text-xs text-gray-400'>{m.role}</div>
                </div>
                {selfRole === 'Leader' && m.id !== selfId && (
                  <Button variant='destructive' size='sm' onClick={() => handleRemove(m.id)}>
                    Remove
                  </Button>
                )}
              </li>
            ))}
          </ul>
        </main>
      </div>
    </div>
  )
}
