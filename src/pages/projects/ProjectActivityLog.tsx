/* eslint-disable @typescript-eslint/no-explicit-any */
import { projectApi, ProjectLog } from '@/api/projects'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Navbar } from '@/components/Navbar'
import { Sidebar } from '@/components/Sidebar'
import { useToast } from '@/hooks/use-toast'
import { useCurrentProject } from '@/hooks/useCurrentProject'
import { format } from 'date-fns'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { FiClock, FiUser, FiEdit3, FiPlus, FiTrash2, FiSettings, FiActivity } from 'react-icons/fi'

// Uses ProjectLog type from api

const toHuman = (text: string | null | undefined) => {
  if (!text) return ''
  return text.replace(/([A-Z])/g, ' $1').trim()
}

const getEntityTextEn = (log: ProjectLog) => {
  if (log.task) return `task "${log.task.taskName}"`
  if (log.sprint) return `sprint "${log.sprint.sprintName}"`
  if (log.board) return `board "${log.board.boardName}"`
  return 'the project'
}

const getNaturalMessageEn = (log: ProjectLog) => {
  const field = toHuman(log.fieldChanged || '')
  const entity = getEntityTextEn(log)
  const oldV = log.oldValue
  const newV = log.newValue
  switch (log.actionType) {
    case 'CreateProject':
      return `${log.fullName} created the project.`
    case 'DeleteProject':
      return `${log.fullName} deleted the project.`
    case 'AddMember':
    case 'JoinMember':
      return `${log.fullName} joined the project.`
    case 'LeaveMember':
    case 'LeaveProject':
      return `${log.fullName} left the project.`
    case 'RemoveMember':
      return `${log.fullName} was removed from the project.`
    case 'CreateSprint':
      return `${log.fullName} created ${log.sprint ? 'sprint "' + log.sprint.sprintName + '"' : 'a sprint'}.`
    case 'UpdateSprint':
      if (field && oldV && newV) return `${log.fullName} updated ${field} of ${entity} from ${oldV} to ${newV}.`
      if (field && newV) return `${log.fullName} updated ${field} of ${entity} to ${newV}.`
      return `${log.fullName} updated ${entity}.`
    case 'UpdateProject':
      if (field && oldV && newV) return `${log.fullName} changed project ${field} from ${oldV} to ${newV}.`
      if (field && newV) return `${log.fullName} changed project ${field} to ${newV}.`
      return `${log.fullName} updated the project.`
    case 'UpdateMember':
      return `${log.fullName} updated a member.`
    default:
      if (field && oldV && newV) return `${log.fullName} updated ${field} of ${entity} from ${oldV} to ${newV}.`
      return `${log.fullName} made changes to ${entity}.`
  }
}

const getActionIcon = (actionType: string) => {
  switch (actionType) {
    case 'CreateProject':
      return <FiPlus className='h-4 w-4 text-emerald-600' />
    case 'DeleteProject':
      return <FiTrash2 className='h-4 w-4 text-red-500' />
    case 'JoinMember':
    case 'AddMember':
      return <FiUser className='h-4 w-4 text-emerald-600' />
    case 'LeaveMember':
    case 'LeaveProject':
      return <FiUser className='h-4 w-4 text-orange-600' />
    case 'RemoveMember':
      return <FiUser className='h-4 w-4 text-red-500' />
    case 'CreateSprint':
      return <FiPlus className='h-4 w-4 text-lavender-600' />
    case 'UpdateSprint':
      return <FiEdit3 className='h-4 w-4 text-lavender-600' />
    case 'UpdateProject':
      return <FiEdit3 className='h-4 w-4 text-lavender-600' />
    case 'UpdateMember':
      return <FiSettings className='h-4 w-4 text-violet-600' />
    default:
      return <FiEdit3 className='h-4 w-4 text-gray-600' />
  }
}

const getActionColor = (actionType: string) => {
  switch (actionType) {
    case 'CreateProject':
      return 'bg-emerald-50 border-emerald-200 text-emerald-700 shadow-sm'
    case 'DeleteProject':
      return 'bg-red-50 border-red-200 text-red-700 shadow-sm'
    case 'JoinMember':
    case 'AddMember':
      return 'bg-emerald-50 border-emerald-200 text-emerald-700 shadow-sm'
    case 'LeaveMember':
    case 'LeaveProject':
      return 'bg-orange-50 border-orange-200 text-orange-700 shadow-sm'
    case 'RemoveMember':
      return 'bg-red-50 border-red-200 text-red-700 shadow-sm'
    case 'CreateSprint':
      return 'bg-lavender-50 border-lavender-200 text-lavender-700 shadow-sm'
    case 'UpdateSprint':
      return 'bg-lavender-50 border-lavender-200 text-lavender-700 shadow-sm'
    case 'UpdateProject':
      return 'bg-lavender-50 border-lavender-200 text-lavender-700 shadow-sm'
    case 'UpdateMember':
      return 'bg-violet-50 border-violet-200 text-violet-700 shadow-sm'
    default:
      return 'bg-gray-50 border-gray-200 text-gray-700 shadow-sm'
  }
}

const getActionLabel = (actionType: string) => {
  switch (actionType) {
    case 'CreateProject':
      return 'Created Project'
    case 'DeleteProject':
      return 'Deleted Project'
    case 'JoinMember':
    case 'AddMember':
      return 'Joined Team'
    case 'LeaveMember':
    case 'LeaveProject':
      return 'Left Team'
    case 'RemoveMember':
      return 'Removed Member'
    case 'CreateSprint':
      return 'Created Sprint'
    case 'UpdateSprint':
      return 'Updated Sprint'
    case 'UpdateProject':
      return 'Updated Project'
    case 'UpdateMember':
      return 'Updated Member'
    default:
      return actionType.replace(/([A-Z])/g, ' $1').trim()
  }
}

export const ProjectActivityLog = () => {
  const { projectId } = useParams<{ projectId: string }>()
  const [searchParams] = useSearchParams()
  const [logs, setLogs] = useState<ProjectLog[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isSidebarOpen, setIsSidebarOpen] = useState(true)
  const { toast } = useToast()
  const { currentProject } = useCurrentProject()
  const [nextCursor, setNextCursor] = useState<string | null>(null)
  const [hasMore, setHasMore] = useState<boolean>(false)
  const [sprintDialogOpen, setSprintDialogOpen] = useState(false)
  const [selectedSprint] = useState<{ sprintId: string; sprintName: string } | null>(null)
  const navigate = useNavigate()
  const itemRefs = useRef<Record<string, HTMLDivElement | null>>({})
  const [activeHighlightId, setActiveHighlightId] = useState<string | null>(null)
  const groupHeaderRefs = useRef<Record<string, HTMLDivElement | null>>({})
  const [activeSprintHighlightId, setActiveSprintHighlightId] = useState<string | null>(null)

  const groupedLogs = useMemo(() => {
    const map = new Map<string, { sprint: ProjectLog['sprint']; items: ProjectLog[] }>()
    for (const log of logs) {
      const key = log.sprint?.sprintId || 'no-sprint'
      const group = map.get(key) || { sprint: log.sprint, items: [] }
      group.items.push(log)
      map.set(key, group)
    }
    return Array.from(map.entries())
  }, [logs])

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen)

  useEffect(() => {
    const fetchLogs = async () => {
      if (!projectId) return
      try {
        setLoading(true)
        setError(null)
        const response = await projectApi.getProjectLog(projectId)
        setLogs(response.data.items)
        setNextCursor(response.data.nextCursor || null)
        setHasMore(Boolean(response.data.hasMore))
      } catch (err) {
        console.error('Failed to fetch project logs:', err)
        setError('Failed to load activity logs')
        toast({
          title: 'Error',
          description: 'Failed to load activity logs'
        })
      } finally {
        setLoading(false)
      }
    }
    fetchLogs()
  }, [projectId, toast])

  // Handle highlighting a specific log item via ?highlight=LOG_ID
  useEffect(() => {
    const highlightId = searchParams.get('highlight')
    if (!highlightId || loading || logs.length === 0) return

    const targetRef = itemRefs.current[highlightId]
    if (targetRef) {
      setActiveHighlightId(highlightId)
      // Ensure it scrolls into view smoothly and centers the item
      targetRef.scrollIntoView({ behavior: 'smooth', block: 'center' })
      // Remove highlight after a short delay
      const timer = setTimeout(() => {
        setActiveHighlightId(null)
      }, 2500)
      return () => clearTimeout(timer)
    }
  }, [searchParams, logs, loading])

  // Handle highlighting a sprint group header via ?highlightSprint=SPRINT_ID
  useEffect(() => {
    const sprintId = searchParams.get('highlightSprint')
    if (!sprintId || loading || groupedLogs.length === 0) return

    const targetRef = groupHeaderRefs.current[sprintId]
    if (targetRef) {
      setActiveSprintHighlightId(sprintId)
      targetRef.scrollIntoView({ behavior: 'smooth', block: 'center' })
      const timer = setTimeout(() => {
        setActiveSprintHighlightId(null)
      }, 2500)
      return () => clearTimeout(timer)
    }
  }, [searchParams, groupedLogs, loading])

  const loadMore = async () => {
    if (!projectId || !hasMore || !nextCursor) return
    try {
      setLoadingMore(true)
      const response = await projectApi.getProjectLog(projectId, nextCursor)
      setLogs((prev) => [...prev, ...response.data.items])
      setNextCursor(response.data.nextCursor || null)
      setHasMore(Boolean(response.data.hasMore))
    } catch (err) {
      console.error('Failed to load more activity logs:', err)
      toast({ title: 'Error', description: 'Failed to load more activity logs' })
    } finally {
      setLoadingMore(false)
    }
  }

  if (loading) {
    return (
      <div className='flex h-screen bg-gray-50'>
        <Sidebar
          isOpen={isSidebarOpen}
          onToggle={toggleSidebar}
          currentProject={currentProject || ({ id: projectId } as any)}
        />
        <div className='flex-1 flex flex-col'>
          <Navbar isSidebarOpen={isSidebarOpen} toggleSidebar={toggleSidebar} />

          {/* Main Content Area with Skeleton */}
          <div className='flex-1 flex flex-col bg-white' style={{ height: 'calc(100vh - 120px)' }}>
            {/* Header Skeleton */}
            <div className='flex-none w-full p-6 pb-4 bg-transparent'>
              <div className='flex items-center justify-between mb-4'>
                <div className='flex items-center gap-4'>
                  <div className='flex items-center gap-2'>
                    <Skeleton className='h-10 w-10 rounded-lg' />
                    <div className='space-y-2'>
                      <Skeleton className='h-8 w-48' />
                      <Skeleton className='h-4 w-64' />
                    </div>
                  </div>
                  <Skeleton className='h-6 w-24 rounded-full' />
                </div>
              </div>
            </div>

            {/* Activity Feed Skeleton */}
            <div className='flex-1 overflow-y-auto'>
              <div className='px-6 py-6 space-y-8'>
                {Array.from({ length: 3 }).map((_, groupIndex) => (
                  <div key={groupIndex} className='space-y-4'>
                    {/* Group Header Skeleton */}
                    <div className='flex items-center justify-between rounded-lg px-3 py-2 bg-gray-50'>
                      <div className='flex items-center gap-3'>
                        <Skeleton className='h-6 w-40' />
                        <Skeleton className='h-4 w-16 rounded-full' />
                      </div>
                      <Skeleton className='h-8 w-32 rounded-md' />
                    </div>

                    {/* Activity Items Skeleton */}
                    <div className='space-y-4'>
                      {Array.from({ length: 2 }).map((_, itemIndex) => (
                        <div key={itemIndex} className='bg-white border border-gray-200 rounded-lg p-6 shadow-sm'>
                          <div className='flex items-start gap-4'>
                            <div className='relative flex-shrink-0'>
                              <Skeleton className='h-12 w-12 rounded-full' />
                              <div className='absolute -bottom-1 -right-1'>
                                <Skeleton className='h-6 w-6 rounded-full' />
                              </div>
                            </div>
                            <div className='flex-1 min-w-0 space-y-3'>
                              <div className='flex items-center gap-3'>
                                <Skeleton className='h-4 w-32' />
                                <Skeleton className='h-6 w-24 rounded-full' />
                              </div>
                              <Skeleton className='h-4 w-full' />
                              <Skeleton className='h-4 w-3/4' />
                              <div className='flex items-center gap-2'>
                                <Skeleton className='h-4 w-4' />
                                <Skeleton className='h-4 w-40' />
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
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

  if (error) {
    return (
      <div className='flex h-screen bg-gray-50'>
        <Sidebar
          isOpen={isSidebarOpen}
          onToggle={toggleSidebar}
          currentProject={currentProject || ({ id: projectId } as any)}
        />
        <div className='flex-1 flex flex-col'>
          <Navbar isSidebarOpen={isSidebarOpen} toggleSidebar={toggleSidebar} />
          <div className='flex items-center justify-center flex-1'>
            <div className='text-center p-8'>
              <div className='w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4'>
                <FiActivity className='h-8 w-8 text-red-500' />
              </div>
              <h1 className='text-xl font-semibold text-gray-900 mb-2'>Unable to Load Activity Log</h1>
              <p className='text-gray-600 mb-6 max-w-md'>{error}</p>
              <Button onClick={() => window.location.reload()} className='bg-lavender-600 hover:bg-lavender-700'>
                Try Again
              </Button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className='flex h-screen bg-gray-50'>
      <Sidebar
        isOpen={isSidebarOpen}
        onToggle={toggleSidebar}
        currentProject={currentProject || ({ id: projectId } as any)}
      />

      <div className='flex-1 flex flex-col min-w-0'>
        <Navbar isSidebarOpen={isSidebarOpen} toggleSidebar={toggleSidebar} />

        {/* Main Content Area - Fixed height with proper scrolling */}
        <div className='flex-1 flex flex-col bg-white' style={{ height: 'calc(100vh - 120px)' }}>
          {/* Header - Fixed */}
          <div className='flex-none w-full p-6 pb-4 bg-transparent'>
            <div className='flex items-center justify-between mb-4'>
              <div className='flex items-center gap-4'>
                <div className='flex items-center gap-2'>
                  <div className='p-2 bg-lavender-100 rounded-lg'>
                    <FiActivity className='h-6 w-6 text-lavender-600' />
                  </div>
                  <div>
                    <h1 className='text-3xl font-bold text-gray-900'>Activity Log</h1>
                    <p className='text-sm text-gray-600'>Project: {currentProject?.title || 'Project'}</p>
                  </div>
                </div>
                <div className='ml-2 text-sm font-medium text-gray-600 bg-gray-100 rounded-full px-3 py-1 border border-gray-200'>
                  {logs.length} {logs.length === 1 ? 'activity' : 'activities'}
                </div>
              </div>
            </div>
          </div>

          {/* Activity Feed - Scrollable */}
          <div className='flex-1 overflow-y-auto' style={{ maxHeight: 'calc(100vh - 200px)' }}>
            <div className='px-6 py-6'>
              {logs.length === 0 ? (
                <div className='flex flex-col items-center justify-center py-16 text-center'>
                  <div className='w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4'>
                    <FiClock className='h-8 w-8 text-gray-400' />
                  </div>
                  <h3 className='text-lg font-semibold text-gray-900 mb-2'>No Activity Yet</h3>
                  <p className='text-gray-500 max-w-sm'>
                    Project activities and changes will appear here as team members work on the project.
                  </p>
                </div>
              ) : (
                <div className='space-y-8'>
                  {groupedLogs.map(([key, group]) => (
                    <div key={key} className='space-y-4'>
                      <div
                        ref={(el) => {
                          if (el && group.sprint?.sprintId) {
                            groupHeaderRefs.current[group.sprint.sprintId] = el
                          }
                        }}
                        className={`flex items-center justify-between rounded-lg px-3 py-2 transition-colors ${
                          group.sprint?.sprintId && group.sprint.sprintId === activeSprintHighlightId
                            ? 'bg-lavender-50 ring-1 ring-lavender-300'
                            : 'bg-gray-50'
                        }`}
                      >
                        <div className='flex items-center gap-3'>
                          <h3 className='text-lg font-semibold text-gray-900'>
                            {group.sprint ? `Sprint: ${group.sprint.sprintName}` : 'Other activity'}
                          </h3>
                          <span className='text-xs text-gray-500 bg-white px-2 py-1 rounded-full'>
                            {group.items.length} item(s)
                          </span>
                        </div>
                        {group.sprint && (
                          <Button
                            variant='outline'
                            className='h-8 px-3 text-xs border-lavender-200 hover:bg-lavender-50'
                            onClick={() => {
                              if (projectId) {
                                navigate(`/projects/${projectId}/backlog?sprintId=${group.sprint!.sprintId}`)
                              }
                            }}
                          >
                            Go to sprint in backlog
                          </Button>
                        )}
                      </div>
                      <div className='space-y-4'>
                        {group.items.map((log, index) => (
                          <div
                            key={log.id}
                            ref={(el) => {
                              if (el) itemRefs.current[log.id] = el
                            }}
                            className={`group relative border rounded-lg p-6 hover:border-gray-300 hover:shadow-md transition-all duration-200 ${
                              log.id === activeHighlightId
                                ? 'border-lavender-300 bg-lavender-50 ring-2 ring-lavender-300'
                                : 'bg-white border-gray-200 shadow-sm'
                            }`}
                          >
                            {index < group.items.length - 1 && (
                              <div className='absolute left-11 top-16 bottom-0 w-px bg-gradient-to-b from-gray-200 to-transparent'></div>
                            )}
                            <div className='flex items-start gap-4'>
                              <div className='relative flex-shrink-0'>
                                <img
                                  src={log.avatar}
                                  alt={log.fullName}
                                  className='h-12 w-12 rounded-full border-2 border-white shadow-sm ring-2 ring-gray-100'
                                  onError={(e) => {
                                    const target = e.target as HTMLImageElement
                                    target.src = '/logo.png'
                                  }}
                                />
                                <div className='absolute -bottom-1 -right-1 w-6 h-6 bg-white rounded-full flex items-center justify-center shadow-sm ring-2 ring-white'>
                                  {getActionIcon(log.actionType)}
                                </div>
                              </div>
                              <div className='flex-1 min-w-0'>
                                <div className='flex items-center gap-3 mb-3'>
                                  <span className='font-semibold text-gray-900'>{log.fullName}</span>
                                  <span
                                    className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border ${getActionColor(log.actionType)}`}
                                  >
                                    {getActionIcon(log.actionType)}
                                    {getActionLabel(log.actionType)}
                                  </span>
                                </div>
                                <p className='text-gray-700 mb-3 leading-relaxed'>{getNaturalMessageEn(log)}</p>
                                {(log.oldValue || log.newValue || log.sprint || log.board || log.task) && (
                                  <div className='bg-gray-50 border border-gray-200 rounded-lg p-4 mb-3'>
                                    <div className='text-sm space-y-1 text-gray-600'>
                                      {log.oldValue && (
                                        <div>
                                          <span className='font-medium'>Previous:</span>
                                          <span className='ml-2 px-2 py-1 bg-red-100 text-red-700 rounded text-xs font-mono'>
                                            {log.oldValue}
                                          </span>
                                        </div>
                                      )}
                                      {log.newValue && (
                                        <div>
                                          <span className='font-medium'>Current:</span>
                                          <span className='ml-2 px-2 py-1 bg-emerald-100 text-emerald-700 rounded text-xs font-mono'>
                                            {log.newValue}
                                          </span>
                                        </div>
                                      )}
                                      {log.sprint && (
                                        <div>
                                          <span className='font-medium'>Sprint:</span> {log.sprint.sprintName}
                                        </div>
                                      )}
                                      {log.board && (
                                        <div>
                                          <span className='font-medium'>Board:</span> {log.board.boardName}
                                        </div>
                                      )}
                                      {log.task && (
                                        <div>
                                          <span className='font-medium'>Task:</span> {log.task.taskName}
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                )}
                                <div className='flex items-center gap-2 text-sm text-gray-500'>
                                  <FiClock className='h-4 w-4' />
                                  <time dateTime={log.createAt}>
                                    {format(new Date(log.createAt), 'MMM dd, yyyy • HH:mm')}
                                  </time>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                  {hasMore && (
                    <div className='pt-4'>
                      <Button
                        onClick={loadMore}
                        disabled={loadingMore}
                        className='w-full bg-lavender-600 hover:bg-lavender-700 text-white disabled:opacity-60'
                      >
                        {loadingMore ? 'Loading...' : 'Load more'}
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
          <Dialog open={sprintDialogOpen} onOpenChange={setSprintDialogOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Sprint details</DialogTitle>
                {selectedSprint && (
                  <DialogDescription>
                    <div className='space-y-2'>
                      <div>
                        <span className='font-medium text-slate-700'>Name:</span> {selectedSprint.sprintName}
                      </div>
                      <div className='break-all'>
                        <span className='font-medium text-slate-700'>ID:</span> {selectedSprint.sprintId}
                      </div>
                    </div>
                  </DialogDescription>
                )}
              </DialogHeader>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </div>
  )
}
