import { projectApi } from '@/api/projects'
import { Navbar } from '@/components/Navbar'
import { Sidebar } from '@/components/Sidebar'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { toast } from '@/hooks/use-toast'
import { useAuth } from '@/hooks/useAuth'
import { useCurrentProject } from '@/hooks/useCurrentProject'
import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import UserProfileDialog from '../../components/UserProfileDialog'

interface Member {
  id: string
  userId: string
  fullName: string
  avatar: string
  email: string
  role: string
}

export default function ProjectMembers() {
  const { currentProject } = useCurrentProject();
  const params = useParams();
  const projectId = currentProject?.id || params.projectId;
  console.log('[ProjectMembers] projectId:', projectId);
  const navigate = useNavigate()
  const [members, setMembers] = useState<Member[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteLoading, setInviteLoading] = useState(false)
  const [selfId, setSelfId] = useState<string | null>(null)
  const [selfRole, setSelfRole] = useState<string | null>(null)
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const { user } = useAuth();
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);

  const fetchMembers = async () => {
    if (!projectId) return
    setLoading(true)
    setError(null)
    try {
      const data: Member[] = await projectApi.getProjectMembers(projectId)
      console.log('[ProjectMembers] fetchMembers response:', data)
      setMembers(data)
    
      console.log('[ProjectMembers] user from context:', user)
      console.log('[ProjectMembers] members:', data)
      if (user && user.email) {
        const self = data.find((m) => m.email === user.email)
        if (self) {
          setSelfId(self.id)
          setSelfRole(self.role)
          console.log('[ProjectMembers] selfId:', self.id, 'selfRole:', self.role)
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
    console.log('handleInvite called', { projectId, inviteEmail });
    if (!projectId || !inviteEmail) {
      console.log('handleInvite return early', { projectId, inviteEmail });
      return;
    }
    setInviteLoading(true);
    try {
      console.log('Calling API addMemberToProject');
      const res = await projectApi.addMemberToProject(projectId, inviteEmail);
      console.log('[ProjectMembers] addMemberToProject response:', res);
      setInviteEmail('');
      fetchMembers();
      toast({ title: 'Success', description: 'Member invited!', variant: 'default' });
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to invite member');
      toast({ title: 'Error', description: 'Failed to invite member!', variant: 'destructive' });
    } finally {
      setInviteLoading(false);
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
    if (!window.confirm('Are you sure you want to leave this project?')) return
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
            <Button
              onClick={() => {
                console.log('Invite button clicked', inviteEmail)
                handleInvite()
              }}
              disabled={inviteLoading || !inviteEmail}
            >
              {inviteLoading ? 'Inviting...' : 'Invite'}
            </Button>
            <Button variant='outline' color='red' onClick={handleLeave}>
              Leave project
            </Button>
          </div>
          {loading && <div>Loading...</div>}
          {error && <div className='text-red-500'>{error}</div>}
          <ul className='divide-y'>
            {members.map((m) => {
              console.log('[ProjectMembers] render member:', m)
              return (
                <li key={m.id} className='flex items-center gap-4 py-3 cursor-pointer hover:bg-gray-100 rounded transition' onClick={() => { console.log('Clicked member:', m.userId); setSelectedUserId(m.userId); }}>
                  <img src={m.avatar} alt={m.fullName} className='w-10 h-10 rounded-full object-cover' />
                  <div className='flex-1'>
                    <div className='font-semibold'>{m.fullName}</div>
                    <div className='text-sm text-gray-500'>{m.email}</div>
                    <div className='text-xs text-gray-400'>{m.role}</div>
                  </div>
                  {selfRole?.toLowerCase() === 'leader' && m.id !== selfId && (
                    <Button variant='destructive' size='sm' onClick={e => { e.stopPropagation(); handleRemove(m.userId); }}>
                      Remove
                    </Button>
                  )}
                </li>
              )
            })}
          </ul>
          {selectedUserId && (
            <UserProfileDialog userId={selectedUserId} onClose={() => setSelectedUserId(null)} />
          )}
        </main>
      </div>
    </div>
  )
}
