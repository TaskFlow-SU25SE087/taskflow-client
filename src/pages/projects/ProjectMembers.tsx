import { projectMemberApi } from '@/api/projectMembers'
import { Navbar } from '@/components/Navbar'
import { Sidebar } from '@/components/Sidebar'
import { ProjectInviteDialog } from '@/components/projects/ProjectInviteDialog'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
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
import { Skeleton } from '@/components/ui/skeleton'
import { useToastContext } from '@/components/ui/ToastContext'
import { useAuth } from '@/hooks/useAuth'
import { useCurrentProject } from '@/hooks/useCurrentProject'
import { useProjectMembers } from '@/hooks/useProjectMembers'
import { ProjectMember } from '@/types/project'
import { Users, LogOut } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import UserProfileDialog from '../../components/UserProfileDialog'

export default function ProjectMembers() {
  const navigate = useNavigate()
  const { currentProject, isLoading: isProjectLoading } = useCurrentProject()
  const [isSidebarOpen, setIsSidebarOpen] = useState(true)
  const [members, setMembers] = useState<ProjectMember[]>([])
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null)
  const [pendingRemove, setPendingRemove] = useState<string | null>(null) // stores userId
  const [isInviteOpen, setIsInviteOpen] = useState<boolean>(false)
  const { user } = useAuth()
  const { showToast } = useToastContext()
  const { leaveProject, removeMember } = useProjectMembers()
  const fetchSeq = useRef(0)

  useEffect(() => {
    if (!isProjectLoading && !currentProject) {
      navigate('/projects')
    }
  }, [currentProject, isProjectLoading, navigate])

  const fetchMembers = async () => {
    if (!currentProject?.id) return
    const seq = ++fetchSeq.current
    setIsLoading(true)
    setError(null)
    try {
      const data = await projectMemberApi.getMembersByProjectId(currentProject.id)
      if (fetchSeq.current === seq) {
        setMembers(data || [])
      }
    } catch (err: any) {
      if (fetchSeq.current === seq) {
        setError(err?.response?.data?.message || err?.message || 'Failed to load members')
      }
    } finally {
      if (fetchSeq.current === seq) setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchMembers()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentProject?.id])

  const myMemberRecord = useMemo(() => {
    if (!user || !members.length) return null
    return members.find((m) => m.userId === user.id || m.email === user.email) || null
  }, [members, user])

  const isLeader = (myMemberRecord?.role || '').toLowerCase() === 'leader'

  const sortedMembers = useMemo(() => {
    return [...members].sort((a, b) => {
      if ((a.role || '').toLowerCase() === 'leader') return -1
      if ((b.role || '').toLowerCase() === 'leader') return 1
      return 0
    })
  }, [members])

  const handleRemove = async (memberUserId: string) => {
    if (!currentProject?.id) return
    try {
      await removeMember(currentProject.id, memberUserId)
      await fetchMembers()
    } catch {}
  }

  const handleLeave = async () => {
    if (!currentProject?.id) return
    const ok = window.confirm('Are you sure you want to leave this project?')
    if (!ok) return
    try {
      await leaveProject(currentProject.id)
      navigate('/projects')
    } catch (err: any) {
      showToast({ title: 'Error', description: 'Failed to leave project', variant: 'destructive' })
    }
  }

  const isPageLoading = isProjectLoading || !currentProject || isLoading

  if (isPageLoading) {
    return (
      <div className='flex h-screen bg-gray-50'>
        <Sidebar isOpen={isSidebarOpen} onToggle={() => setIsSidebarOpen((v) => !v)} />
        <div className='flex-1 overflow-hidden'>
          <Navbar isSidebarOpen={isSidebarOpen} toggleSidebar={() => setIsSidebarOpen((v) => !v)} />
          <div className='p-6 overflow-auto h-[calc(100vh-64px)]'>
            <div className='space-y-6'>
              <Skeleton className='h-8 w-48' />
              <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4'>
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className='rounded-xl bg-white border border-gray-200 p-4 shadow-sm'>
                    <div className='flex items-center gap-4'>
                      <Skeleton className='h-16 w-16 rounded-full' />
                      <div className='flex-1 space-y-2'>
                        <Skeleton className='h-5 w-40' />
                        <Skeleton className='h-4 w-56' />
                        <Skeleton className='h-4 w-24' />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className='flex h-screen bg-gray-50'>
      <Sidebar isOpen={isSidebarOpen} onToggle={() => setIsSidebarOpen((v) => !v)} currentProject={currentProject} />
      <div className='flex-1 overflow-hidden flex flex-col'>
        <Navbar isSidebarOpen={isSidebarOpen} toggleSidebar={() => setIsSidebarOpen((v) => !v)} />

        <div className='p-6 overflow-auto h-[calc(100vh-64px)] flex flex-col gap-4'>
          {/* Header */}
          <div className='flex-none w-full flex flex-col lg:flex-row lg:items-center justify-between gap-3'>
            <div className='flex items-center gap-3'>
              <div className='p-2 bg-lavender-100 rounded-lg'>
                <Users className='h-6 w-6 text-lavender-600' />
              </div>
              <div>
                <h1 className='text-3xl font-bold text-gray-900'>Members</h1>
                <p className='text-sm text-gray-600'>Project: {currentProject.title}</p>
              </div>
              <div className='ml-2 text-sm font-medium text-gray-600 bg-gray-100 rounded-full px-3 py-1 border border-gray-200'>
                {members.length} {members.length === 1 ? 'member' : 'members'}
              </div>
            </div>

            <div className='flex items-center gap-2 lg:gap-3'>
              <Button
                variant='ghost'
                className='flex items-center gap-2 px-3 py-2 rounded-lg bg-[#ece8fd] hover:bg-[#e0dbfa] text-[#7c3aed]'
                onClick={() => setIsInviteOpen(true)}
              >
                Invite
              </Button>
              <Button variant='outline' className='text-red-600 border-red-200 hover:bg-red-50' onClick={handleLeave}>
                <LogOut className='h-4 w-4 mr-2' /> Leave Project
              </Button>
            </div>
          </div>

          {/* Content */}
          <div className='flex-1'>
            {error && (
              <div className='mb-4 p-3 rounded-md bg-red-50 border border-red-200 text-red-700 text-sm'>{error}</div>
            )}

            <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4'>
              {sortedMembers.map((m) => {
                const name = m.fullName || m.email || m.userId
                const isSelf = user?.id && m.userId === user.id
                const roleBadgeClass =
                  (m.role || '').toLowerCase() === 'leader'
                    ? 'bg-violet-100 text-violet-700'
                    : 'bg-blue-100 text-blue-700'
                return (
                  <div
                    key={m.userId || m.id}
                    className='group flex items-center gap-4 p-4 bg-white rounded-xl shadow-sm hover:shadow-md transition cursor-pointer border border-gray-200 relative'
                    onClick={() => setSelectedUserId(m.userId)}
                  >
                    <Avatar className='h-16 w-16'>
                      {m.avatar ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={m.avatar} alt={name} className='h-16 w-16 rounded-full object-cover' />
                      ) : (
                        <AvatarFallback className='text-lg font-semibold'>
                          {name?.[0]?.toUpperCase() || '?'}
                        </AvatarFallback>
                      )}
                    </Avatar>
                    <div className='flex-1 min-w-0'>
                      <div className='font-semibold text-lg truncate'>{name}</div>
                      <div className='text-sm text-gray-500 truncate'>{m.email}</div>
                      <div className='mt-1'>
                        <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${roleBadgeClass}`}>
                          {m.role || 'Member'}
                          {isSelf ? ' • You' : ''}
                        </span>
                      </div>
                    </div>
                    {isLeader && !isSelf && (
                      <Button
                        variant='destructive'
                        size='icon'
                        className='absolute right-2.5 top-2.5 opacity-0 group-hover:opacity-100 transition bg-red-100 hover:bg-red-200 text-red-600 border-none shadow-none w-6 h-6 flex items-center justify-center p-0 rounded-full'
                        onClick={(e) => {
                          e.stopPropagation()
                          setPendingRemove(m.userId)
                        }}
                        title='Remove member'
                      >
                        <svg
                          xmlns='http://www.w3.org/2000/svg'
                          className='w-4 h-4'
                          fill='none'
                          viewBox='0 0 24 24'
                          stroke='currentColor'
                        >
                          <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M6 18L18 6M6 6l12 12' />
                        </svg>
                      </Button>
                    )}
                  </div>
                )
              })}
            </div>

            {!isLoading && sortedMembers.length === 0 && (
              <div className='text-center text-gray-500 py-10'>No members yet.</div>
            )}
          </div>
        </div>

        {selectedUserId && (
          <UserProfileDialog userId={selectedUserId} open={!!selectedUserId} onClose={() => setSelectedUserId(null)} />
        )}

        <ProjectInviteDialog
          isOpen={isInviteOpen}
          onClose={() => setIsInviteOpen(false)}
          projectId={currentProject.id}
          onMemberAdded={fetchMembers}
        />

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
      </div>
    </div>
  )
}
