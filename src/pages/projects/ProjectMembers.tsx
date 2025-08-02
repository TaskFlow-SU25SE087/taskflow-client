import { projectApi } from '@/api/projects'
import { Navbar } from '@/components/Navbar'
import { Sidebar } from '@/components/Sidebar'
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useToastContext } from '@/components/ui/ToastContext'
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
  const { currentProject } = useCurrentProject()
  const params = useParams()
  const projectId = currentProject?.id || params.projectId
  console.log('[ProjectMembers] projectId:', projectId)
  const navigate = useNavigate()
  const [members, setMembers] = useState<Member[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteLoading, setInviteLoading] = useState(false)
  const [selfId, setSelfId] = useState<string | null>(null)
  const [selfRole, setSelfRole] = useState<string | null>(null)
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const { user } = useAuth()
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null)
  const [pendingRemove, setPendingRemove] = useState<string | null>(null)
  const { showToast } = useToastContext()

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
    if (!projectId || !inviteEmail) return

    setInviteLoading(true)
    try {
      const success = await projectApi.addMemberToProject(projectId, inviteEmail)
      showToast({
        title: success ? 'Success' : 'Error',
        description: success ? 'Member invited!' : 'Failed to invite member',
        variant: success ? 'default' : 'destructive'
      })
      if (success) {
        await fetchMembers()
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to invite member'
      showToast({
        title: 'Error',
        description: msg,
        variant: 'destructive'
      })
    } finally {
      setInviteLoading(false)
    }
  }

  const handleRemove = async (userId: string) => {
    if (!projectId) return
    try {
      const success = await projectApi.removeProjectMember(projectId, userId)
      showToast({
        title: success ? 'Success' : 'Error',
        description: success ? 'Member removed' : 'Failed to remove member',
        variant: success ? 'default' : 'destructive'
      })
      await fetchMembers() // Reload after remove
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to remove member'
      showToast({
        title: 'Error',
        description: msg,
        variant: 'destructive'
      })
    }
  }

  const handleLeave = async () => {
    if (!projectId) return
    if (!window.confirm('Are you sure you want to leave this project?')) return

    try {
      await projectApi.leaveProject(projectId)
      navigate('/projects')
      showToast({
        title: 'Success',
        description: 'You have left the project',
        variant: 'default'
      })
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to leave project'
      showToast({
        title: 'Error',
        description: msg,
        variant: 'destructive'
      })
    }
  }

  const sortedMembers = [...members].sort((a, b) => {
    if (a.role.toLowerCase() === 'leader') return -1
    if (b.role.toLowerCase() === 'leader') return 1
    return 0
  })

  return (
    <>
      <div className='flex min-h-screen bg-gradient-to-br from-slate-50 via-white to-lavender-50'>
        <Sidebar isOpen={sidebarOpen} onToggle={() => setSidebarOpen((v) => !v)} currentProject={currentProject || { id: projectId } as any} />
        <div className='flex-1 flex flex-col'>
          <Navbar isSidebarOpen={sidebarOpen} toggleSidebar={() => setSidebarOpen((v) => !v)} />
          <main className='flex-1 max-w-3xl mx-auto p-4 sm:p-8'>
            <div className='bg-white/70 backdrop-blur-lg rounded-3xl shadow-xl p-6 sm:p-10'>
              <h1 className='text-3xl font-bold mb-6 text-gray-800 tracking-tight flex items-center gap-2'>
                <span>👥</span> Project Members
              </h1>
              <div className='flex flex-col sm:flex-row gap-3 mb-8'>
                <Input
                  placeholder='Invite by email...'
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  className='flex-1 px-4 py-2 rounded-lg border-2 border-gray-200 focus:border-lavender-500 transition font-sans'
                />
                <Button
                  onClick={handleInvite}
                  disabled={inviteLoading || !inviteEmail}
                  className='flex items-center gap-2 px-5 py-2 rounded-lg bg-violet-100 hover:bg-violet-200 text-violet-700 font-semibold shadow border border-violet-200 transition'
                >
                  {inviteLoading ? (
                    <span className='animate-spin w-4 h-4 border-2 border-violet-400 border-t-transparent rounded-full'></span>
                  ) : (
                    <svg
                      xmlns='http://www.w3.org/2000/svg'
                      className='w-5 h-5'
                      fill='none'
                      viewBox='0 0 24 24'
                      stroke='currentColor'
                    >
                      <path
                        strokeLinecap='round'
                        strokeLinejoin='round'
                        strokeWidth={2}
                        d='M18 9v3m0 0v3m0-3h3m-3 0h-3m-2 4a4 4 0 100-8 4 4 0 000 8zm6 4v-1a2 2 0 00-2-2H6a2 2 0 00-2 2v1'
                      />
                    </svg>
                  )}
                  Invite
                </Button>
                <Button
                  variant='outline'
                  className='flex items-center gap-2 px-5 py-2 rounded-lg border-red-200 text-red-500 hover:bg-red-50 font-semibold transition'
                  onClick={handleLeave}
                >
                  <svg
                    xmlns='http://www.w3.org/2000/svg'
                    className='w-5 h-5'
                    fill='none'
                    viewBox='0 0 24 24'
                    stroke='currentColor'
                  >
                    <path
                      strokeLinecap='round'
                      strokeLinejoin='round'
                      strokeWidth={2}
                      d='M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a2 2 0 01-2 2H7a2 2 0 01-2-2v-1'
                    />
                  </svg>
                  Leave
                </Button>
              </div>
              {loading && (
                <div className='flex justify-center items-center py-8'>
                  <span className='w-8 h-8 border-4 border-violet-400 border-t-transparent rounded-full animate-spin'></span>
                </div>
              )}
              {error && <div className='text-red-500 mb-4'>{error}</div>}
              <div className='grid grid-cols-1 sm:grid-cols-2 gap-5'>
                {sortedMembers.map((m) => (
                  <div
                    key={m.id}
                    className='group flex items-center gap-4 p-5 bg-white rounded-2xl shadow-md hover:shadow-xl transition cursor-pointer border border-gray-100 hover:border-violet-200 relative min-h-[90px]'
                    onClick={() => setSelectedUserId(m.userId)}
                  >
                    {m.avatar ? (
                      <img
                        src={m.avatar}
                        alt={m.fullName}
                        className='w-16 h-16 rounded-full object-cover border-2 border-violet-200 shadow-sm bg-white'
                      />
                    ) : (
                      <div className='w-16 h-16 rounded-full flex items-center justify-center bg-gray-200 text-gray-500 text-2xl font-bold border-2 border-violet-100'>
                        {m.fullName?.[0]?.toUpperCase() || '?'}
                      </div>
                    )}
                    <div className='flex-1 min-w-0'>
                      <div className='font-semibold text-lg truncate font-sans'>{m.fullName}</div>
                      <div className='text-sm text-gray-500 truncate font-sans'>{m.email}</div>
                      <div className='mt-1'>
                        <span
                          className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium font-sans ${
                            m.role.toLowerCase() === 'leader'
                              ? 'bg-violet-100 text-violet-700'
                              : m.role.toLowerCase() === 'member'
                                ? 'bg-blue-100 text-blue-700'
                                : 'bg-gray-100 text-gray-500'
                          }`}
                        >
                          {m.role}
                        </span>
                      </div>
                    </div>
                    {selfRole?.toLowerCase() === 'leader' && m.id !== selfId && (
                      <Button
                        variant='destructive'
                        size='icon'
                        className='absolute right-2.5 top-2.5 opacity-0 group-hover:opacity-100 transition bg-red-100 hover:bg-red-200 text-red-600 border-none shadow-none w-5 h-5 flex items-center justify-center p-0 rounded-full'
                        onClick={(e) => {
                          e.stopPropagation()
                          setPendingRemove(m.id)
                        }}
                        title='Remove member'
                      >
                        <svg
                          xmlns='http://www.w3.org/2000/svg'
                          className='w-3.5 h-3.5'
                          fill='none'
                          viewBox='0 0 24 24'
                          stroke='currentColor'
                        >
                          <path
                            strokeLinecap='round'
                            strokeLinejoin='round'
                            strokeWidth={2}
                            d='M15 12h.01M12 12h.01M9 12h.01M21 12c0 4.418-4.03 8-9 8s-9-3.582-9-8 4.03-8 9-8 9 3.582 9 8z'
                          />
                        </svg>
                      </Button>
                    )}
                  </div>
                ))}
              </div>
              {sortedMembers.length === 0 && !loading && (
                <div className='text-center text-gray-400 py-10'>No members yet.</div>
              )}
            </div>
            {selectedUserId && <UserProfileDialog userId={selectedUserId} onClose={() => setSelectedUserId(null)} />}
            {pendingRemove && (
              <AlertDialog open={!!pendingRemove} onOpenChange={(open) => !open && setPendingRemove(null)}>
                <AlertDialogContent className='rounded-2xl border border-violet-100 shadow-2xl'>
                  <AlertDialogHeader>
                    <AlertDialogTitle className='text-violet-700'>Confirm member removal</AlertDialogTitle>
                    <AlertDialogDescription className='text-gray-600'>
                      Are you sure you want to remove this member from the project?
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel className='border border-violet-200 text-violet-700 hover:bg-violet-50 font-semibold rounded-lg px-4 py-2 transition'>
                      Cancel
                    </AlertDialogCancel>
                    <AlertDialogAction
                      className='bg-red-100 hover:bg-red-200 text-red-700 font-semibold rounded-lg px-4 py-2 transition border-none shadow-none'
                      onClick={async () => {
                        if (pendingRemove) {
                          await handleRemove(pendingRemove)
                          setPendingRemove(null)
                        }
                      }}
                    >
                      Remove
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
          </main>
        </div>
      </div>
    </>
  )
}
