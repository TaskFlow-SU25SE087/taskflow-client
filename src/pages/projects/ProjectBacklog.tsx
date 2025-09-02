import { projectMemberApi } from '@/api/projectMembers'
import { Navbar } from '@/components/Navbar'
import { Sidebar } from '@/components/Sidebar'
import { BacklogSkeleton } from '@/components/sprints/BacklogSkeleton'
import { SprintBacklog } from '@/components/sprints/SprintBacklog'
import { SprintBoard } from '@/components/sprints/SprintBoard'
import { SprintCreateMenu } from '@/components/sprints/SprintCreateMenu'
import { SprintSelector } from '@/components/sprints/SprintSelector'
import { Button } from '@/components/ui/button'
import {
    DropdownMenu,
    DropdownMenuCheckboxItem,
    DropdownMenuContent,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useToastContext } from '@/components/ui/ToastContext'
import { useAuth } from '@/hooks/useAuth'
import { useBoards } from '@/hooks/useBoards'
import { useCurrentProject } from '@/hooks/useCurrentProject'
import { useOptimizedTasks } from '@/hooks/useOptimizedTasks'
import { useSprints } from '@/hooks/useSprints'
import { ProjectMember } from '@/types/project'
import { TaskP } from '@/types/task'
import { ChevronDown, Filter, Search, Share2 } from 'lucide-react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useLocation } from 'react-router-dom'

const ProjectBacklog = () => {
  // Cleaned up noisy perf logs to keep UI logic focused

  const { showToast } = useToastContext()
  const { user } = useAuth()
  const { tasks, didInitialLoad: tasksDidInitialLoad, refreshTasks, loadMore, hasMore } = useOptimizedTasks()
  const [isSidebarOpen, setIsSidebarOpen] = useState(true)
  const [taskSearchQuery, setTaskSearchQuery] = useState('')
  const [sprintSearchQuery, setSprintSearchQuery] = useState('')
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null)
  const { currentProject, isLoading: isProjectLoading } = useCurrentProject()
  const [scrollPosition, setScrollPosition] = useState(0)
  const contentRef = useRef<HTMLDivElement>(null)
  const location = useLocation()
  const [highlightSprintId, setHighlightSprintId] = useState<string | null>(null)
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'priority'>('newest')
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>([])
  
  // Project members for role checking
  const [projectMembers, setProjectMembers] = useState<ProjectMember[]>([])

  // Check user's role in current project
  const myMemberRecord = useMemo(() => {
    if (!user || !projectMembers.length) return null
    return projectMembers.find((m) => m.userId === user.id || m.id === user.id || m.email === user.email) || null
  }, [projectMembers, user])

  const isMember = (myMemberRecord?.role || '').toLowerCase() === 'member'

  const {
    sprints,
    didInitialLoad: sprintsDidInitialLoad,
    createSprint,
    getSprintTasks,
    addTaskToSprint,
    fetchSprints
  } = useSprints()

  const [sprintTasks, setSprintTasks] = useState<Record<string, TaskP[]>>({})
  const [loadingSprintIds, setLoadingSprintIds] = useState<string[]>([])
  // Initial prefetch flag so we wait for sprint tasks only on first paint
  const [isInitialSprintPrefetching, setIsInitialSprintPrefetching] = useState(true)
  const [hasPrefetchedInitialSprintTasks, setHasPrefetchedInitialSprintTasks] = useState(false)
  // Load boards once (used by task status dropdowns); gate page on this to avoid late dropdown render
  const { boards, didInitialLoad: boardsDidInitialLoad, refreshBoards } = useBoards()

  // Debounced search queries - phải khai báo trước useMemo
  const [debouncedTaskSearch, setDebouncedTaskSearch] = useState('')
  const [debouncedSprintSearch, setDebouncedSprintSearch] = useState('')
  const preventEnterDefault = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      e.stopPropagation()
    }
  }, [])

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedTaskSearch(taskSearchQuery)
    }, 300)
    return () => clearTimeout(timer)
  }, [taskSearchQuery])

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSprintSearch(sprintSearchQuery)
    }, 300)
    return () => clearTimeout(timer)
  }, [sprintSearchQuery])

  // Fetch project members for role checking
  useEffect(() => {
    const fetchProjectMembers = async () => {
      if (!currentProject?.id) return
      try {
        const members = await projectMemberApi.getMembersByProjectId(currentProject.id)
        setProjectMembers(members || [])
      } catch (error) {
        console.error('Error fetching project members:', error)
        setProjectMembers([])
      }
    }

    fetchProjectMembers()
  }, [currentProject?.id])

  // Removed heavy console logging and perf measurement to prevent noise and align code style

  // Lazy load tasks for a sprint when requested
  const handleLoadSprintTasks = useCallback(
    async (sprintId: string) => {
      if (sprintTasks[sprintId] || loadingSprintIds.includes(sprintId) || !currentProject?.id) return

      setLoadingSprintIds((prev) => [...prev, sprintId])
      try {
        const tasks = await getSprintTasks(sprintId, currentProject.id)

        setSprintTasks((prev) => ({ ...prev, [sprintId]: tasks }))
      } finally {
        setLoadingSprintIds((prev) => prev.filter((id) => id !== sprintId))
      }
    },
    [sprintTasks, loadingSprintIds, currentProject?.id, getSprintTasks]
  )

  // Memoize filtered tasks to avoid unnecessary recalculations
  const filteredTasks = useMemo(() => {
    if (!debouncedTaskSearch.trim()) {
      return tasks
    }

    const searchLower = debouncedTaskSearch.toLowerCase().trim()
    return tasks.filter(
      (task) =>
        (task.description || '').toLowerCase().includes(searchLower) ||
        (task.status || '').toLowerCase().includes(searchLower) ||
        (task.title || '').toLowerCase().includes(searchLower)
    )
  }, [tasks, debouncedTaskSearch])

  // derive available statuses for Filter menu
  const availableStatuses = useMemo(() => {
    const set = new Set<string>()
    tasks.forEach((t) => {
      if (t.status) set.add(t.status)
    })
    return Array.from(set).sort()
  }, [tasks])

  useEffect(() => {
    let isCancelled = false
    // Wait for project and sprints initial load to finish before prefetching tasks
    if (!currentProject?.id || !sprintsDidInitialLoad) return

    const prefetchAllSprintTasks = async () => {
      // Only block initial paint once
      const shouldBlock = !hasPrefetchedInitialSprintTasks

      if (shouldBlock) setIsInitialSprintPrefetching(true)
      try {
        if (!sprints.length) {
          if (!isCancelled) setSprintTasks({})
          return
        }
        const tasksMap: Record<string, TaskP[]> = {}
        await Promise.all(
          sprints.map(async (sprint) => {
            const tasks = await getSprintTasks(sprint.id, currentProject.id)
            tasksMap[sprint.id] = tasks
          })
        )
        if (!isCancelled) setSprintTasks(tasksMap)
      } finally {
        if (shouldBlock && !isCancelled) {
          setIsInitialSprintPrefetching(false)
          setHasPrefetchedInitialSprintTasks(true)
        }
      }
    }

    prefetchAllSprintTasks()
    return () => {
      isCancelled = true
    }
  }, [sprints, getSprintTasks, currentProject?.id, sprintsDidInitialLoad, hasPrefetchedInitialSprintTasks])

  // Placeholder: autoscroll effect moved below filteredSprints declaration

  useEffect(() => {
    if (contentRef.current) {
      contentRef.current.scrollTop = scrollPosition
    }
  }, [tasks, scrollPosition])

  const toggleSidebar = useCallback(() => setIsSidebarOpen(!isSidebarOpen), [isSidebarOpen])

  const handleCreateSprint = useCallback(
    async (data: { name: string; description: string; startDate: string; endDate: string }) => {
      if (!currentProject) return false
      try {
        const result = await createSprint({
          name: data.name,
          description: data.description,
          startDate: data.startDate,
          endDate: data.endDate,
          status: '10000' // Changed from '0' (Not Started) to '10000' (In Progress)
        })
        if (result.ok) {
          showToast({
            title: 'Success',
            description: 'Sprint created successfully',
            variant: 'success'
          })
          return true
        } else {
          showToast({
            title: 'Error',
            description: result.message,
            variant: 'destructive'
          })
          return false
        }
      } catch {
        showToast({
          title: 'Error',
          description: 'Failed to create sprint. Please try again.',
          variant: 'destructive'
        })
        return false
      }
    },
    [currentProject, createSprint, showToast]
  )

  const handleMoveToSprint = useCallback(
    async (sprintId: string) => {
      if (!selectedTaskId) return

      try {
        await addTaskToSprint(sprintId, selectedTaskId)
        // Refresh sprints and sprint tasks so the UI reflects the move immediately
        await fetchSprints()
        try {
          const tasksMap: Record<string, TaskP[]> = {}
          await Promise.all(
            sprints.map(async (s) => {
              const t = await getSprintTasks(s.id, currentProject?.id)
              tasksMap[s.id] = t
            })
          )
          setSprintTasks(tasksMap)
        } catch {
          // ignore, best-effort refresh
        }
        showToast({
          title: 'Success',
          description: 'Task moved to sprint successfully'
        })
      } catch (error) {
        console.log(error)
        showToast({
          title: 'Error',
          description: 'Failed to move task to sprint. Please try again.',
          variant: 'destructive'
        })
      }
      setSelectedTaskId(null)
    },
    [selectedTaskId, addTaskToSprint, fetchSprints, showToast, sprints, getSprintTasks, currentProject?.id]
  )

  const handleTaskUpdate = useCallback(async () => {
    if (contentRef.current) {
      setScrollPosition(contentRef.current.scrollTop)
    }
    // Refresh backlog tasks
    await refreshTasks()
    // Also refresh sprints and sprint task lists so sprint sections stay in sync
    await fetchSprints()
    try {
      const tasksMap: Record<string, TaskP[]> = {}
      await Promise.all(
        sprints.map(async (sprint) => {
          const t = await getSprintTasks(sprint.id, currentProject?.id)
          tasksMap[sprint.id] = t
        })
      )
      setSprintTasks(tasksMap)
    } catch {
      // no-op
    }
  }, [fetchSprints, refreshTasks, sprints, getSprintTasks, currentProject?.id])

  const handleSprintUpdate = useCallback(async () => {
    if (contentRef.current) {
      setScrollPosition(contentRef.current.scrollTop)
    }
    await fetchSprints()
    const tasksMap: Record<string, TaskP[]> = {}
    await Promise.all(
      sprints.map(async (sprint) => {
        const tasks = await getSprintTasks(sprint.id, currentProject?.id)
        tasksMap[sprint.id] = tasks
      })
    )
    setSprintTasks(tasksMap)
  }, [fetchSprints, sprints, getSprintTasks, currentProject?.id])

  // Lọc backlog: task chưa gán sprint hoặc sprintId đặc biệt/no sprint
  const backlogTasks = useMemo(() => {
    return filteredTasks.filter(
      (task) =>
        !task.sprintId ||
        task.sprintId === '' ||
        task.sprintId === null ||
        task.sprintId === undefined ||
        task.sprintId === '00000000-0000-0000-0000-000000000000' ||
        (task.sprintName && task.sprintName.toLowerCase() === 'no sprint')
    )
  }, [filteredTasks])

  // Filter sprints
  const filteredSprints = useMemo(() => {
    if (!debouncedSprintSearch.trim()) return sprints

    const searchLower = debouncedSprintSearch.toLowerCase().trim()
    return sprints.filter((sprint) => sprint.name.toLowerCase().includes(searchLower))
  }, [sprints, debouncedSprintSearch])

  // Filter sprint tasks
  const filteredSprintTasks = useMemo(() => {
    if (!debouncedTaskSearch.trim()) return sprintTasks

    const searchLower = debouncedTaskSearch.toLowerCase().trim()
    return Object.entries(sprintTasks).reduce(
      (acc, [sprintId, tasks]) => ({
        ...acc,
        [sprintId]: tasks.filter(
          (task) =>
            (task.description || '').toLowerCase().includes(searchLower) ||
            (task.status || '').toLowerCase().includes(searchLower) ||
            (task.title || '').toLowerCase().includes(searchLower)
        )
      }),
      {} as Record<string, TaskP[]>
    )
  }, [sprintTasks, debouncedTaskSearch])

  // Apply status filters and sorting (loosen typing to interop with OptimizedTaskP and TaskP)
  const sortTasks = useCallback(
    (list: Array<Record<string, unknown>>): Array<Record<string, unknown>> => {
      const filteredByStatus = selectedStatuses.length
        ? list.filter((t) => selectedStatuses.includes(((t as any).status || '').toString()))
        : list
      const cloned = [...filteredByStatus]
      switch (sortBy) {
        case 'oldest':
          cloned.sort(
            (a, b) =>
              new Date(((a as any).created || (a as any).createdAt || (a as any).updated || 0) as string).getTime() -
              new Date(((b as any).created || (b as any).createdAt || (b as any).updated || 0) as string).getTime()
          )
          break
        case 'priority':
          cloned.sort((a, b) => Number((a as any).priority ?? 0) - Number((b as any).priority ?? 0))
          break
        case 'newest':
        default:
          cloned.sort(
            (a, b) =>
              new Date(((b as any).created || (b as any).createdAt || (b as any).updated || 0) as string).getTime() -
              new Date(((a as any).created || (a as any).createdAt || (a as any).updated || 0) as string).getTime()
          )
      }
      return cloned
    },
    [selectedStatuses, sortBy]
  )

  const visibleBacklogTasks = useMemo(() => sortTasks(backlogTasks as unknown as Array<Record<string, unknown>>) as unknown as TaskP[], [backlogTasks, sortTasks])
  const visibleSprintTasks = useMemo(() => {
    const result: Record<string, TaskP[]> = {}
    Object.entries(filteredSprintTasks).forEach(([sid, list]) => {
      result[sid] = sortTasks(list as unknown as Array<Record<string, unknown>>) as unknown as TaskP[]
    })
    return result
  }, [filteredSprintTasks, sortTasks])

  // Keep render lightweight – no debug logs

  // Auto-scroll to sprint from query (?sprintId=...) with robust retry until rendered
  useEffect(() => {
    const params = new URLSearchParams(location.search)
    const sprintId = params.get('sprintId')
    if (!sprintId) return

    let cancelled = false
    const tryScroll = (attemptsLeft: number) => {
      if (cancelled) return
      const el = document.getElementById(`sprint-${sprintId}`)
      if (el && contentRef.current) {
        setHighlightSprintId(sprintId)
        el.scrollIntoView({ behavior: 'smooth', block: 'start' })
        // Clear highlight after a brief moment
        const t = setTimeout(() => setHighlightSprintId(null), 2200)
        return () => clearTimeout(t)
      }
      if (attemptsLeft > 0) {
        setTimeout(() => tryScroll(attemptsLeft - 1), 200)
      }
    }

    // Try up to ~2s
    tryScroll(10)
    return () => {
      cancelled = true
    }
  }, [location.search, filteredSprints.length])

  // Hold skeleton until project, boards/sprints, tasks, and prefetch done
  const isPageLoading =
    isProjectLoading ||
    !currentProject ||
    // Gate on initial completion of each dataset only; ignore background refresh/mutations
    !sprintsDidInitialLoad ||
    !tasksDidInitialLoad ||
    !boardsDidInitialLoad ||
    isInitialSprintPrefetching

  if (isPageLoading) {
    return (
      <div className='flex h-screen bg-gray-50'>
        <Sidebar isOpen={isSidebarOpen} onToggle={toggleSidebar} />
        <div className='flex-1 overflow-hidden'>
          <Navbar isSidebarOpen={isSidebarOpen} toggleSidebar={toggleSidebar} />
          <div className='p-6 overflow-auto h-[calc(100vh-64px)]'>
            <BacklogSkeleton />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className='flex h-screen bg-gray-50'>
      <Sidebar isOpen={isSidebarOpen} onToggle={toggleSidebar} />

      <div className='flex-1 overflow-hidden flex flex-col'>
        <Navbar isSidebarOpen={isSidebarOpen} toggleSidebar={toggleSidebar} />

        <div ref={contentRef} className='p-6 overflow-auto h-[calc(100vh-64px)] flex flex-col gap-4'>
          {/* Header */}
          <div className='flex-none w-full flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-0'>
            <div className='flex items-center gap-3'>
              <div className='p-2 bg-lavender-100 rounded-lg'>
                <Filter className='h-6 w-6 text-lavender-600' />
              </div>
              <div>
                <h1 className='text-3xl font-bold text-gray-900'>Backlog</h1>
                {currentProject?.title && <p className='text-sm text-gray-600'>Project: {currentProject.title}</p>}
              </div>
              <div className='ml-2 text-sm font-medium text-gray-600 bg-gray-100 rounded-full px-3 py-1 border border-gray-200'>
                {tasks.length} {tasks.length === 1 ? 'task' : 'tasks'}
              </div>
            </div>
            <div className='flex items-center gap-2 sm:gap-3'>
              {currentProject && (
                <>
                  <SprintCreateMenu onCreateSprint={handleCreateSprint} isMember={isMember} />
                  {selectedTaskId && <SprintSelector sprints={sprints} onSprintSelect={handleMoveToSprint} />}
                </>
              )}
            </div>
          </div>

          {/* Toolbar (match Board style) */}
          <div className='flex items-center justify-between mb-3'>
            <div className='flex items-center gap-3'>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant='outline' className='hover:bg-gray-50 border-gray-300'>
                    <Filter className='mr-2 h-4 w-4' />
                    Filter
                    <ChevronDown className='ml-2 h-4 w-4' />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align='start' className='w-56'>
                  <DropdownMenuLabel>Status</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {availableStatuses.length === 0 && (
                    <div className='px-3 py-2 text-sm text-gray-500'>No statuses</div>
                  )}
                  {availableStatuses.map((status) => (
                    <DropdownMenuCheckboxItem
                      key={status}
                      checked={selectedStatuses.includes(status)}
                      onCheckedChange={(checked) => {
                        setSelectedStatuses((prev) => {
                          if (checked) return [...prev, status]
                          return prev.filter((s) => s !== status)
                        })
                      }}
                    >
                      {status}
                    </DropdownMenuCheckboxItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
              <div className='relative'>
                <Search className='absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 transform text-gray-400' />
                <Input
                  placeholder='Search tasks...'
                  value={taskSearchQuery}
                  onChange={(e) => setTaskSearchQuery(e.target.value)}
                  onKeyDown={preventEnterDefault}
                  className='w-[280px] pl-10 border-gray-300'
                />
              </div>
              <div className='relative'>
                <Search className='absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 transform text-gray-400' />
                <Input
                  placeholder='Search sprints...'
                  value={sprintSearchQuery}
                  onChange={(e) => setSprintSearchQuery(e.target.value)}
                  onKeyDown={preventEnterDefault}
                  className='w-[220px] pl-10 border-gray-300'
                />
              </div>
            </div>
            <div className='flex gap-2 items-center'>
              <Button variant='ghost' className='hover:bg-gray-100'>
                <Share2 className='mr-2 h-4 w-4' />
                Share
              </Button>
              <Select value={sortBy} onValueChange={(v) => setSortBy(v as 'newest' | 'oldest' | 'priority')}>
                <SelectTrigger className='w-[180px] border-gray-300'>
                  <SelectValue placeholder='Sort by' />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='newest'>Newest</SelectItem>
                  <SelectItem value='oldest'>Oldest</SelectItem>
                  <SelectItem value='priority'>Priority</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Sprint & Backlog List */}
          <div className='space-y-6'>
            {filteredSprints.map((sprint) => (
              <div
                key={sprint.id}
                id={`sprint-${sprint.id}`}
                className={highlightSprintId === sprint.id ? 'ring-2 ring-blue-400 rounded-md' : ''}
              >
                <SprintBoard
                  sprint={sprint}
                  tasks={visibleSprintTasks[sprint.id] || []}
                  onMoveTask={setSelectedTaskId}
                  projectId={currentProject?.id || ''}
                  onTaskUpdate={handleTaskUpdate}
                  onTaskCreated={handleTaskUpdate}
                  onSprintUpdate={handleSprintUpdate}
                  onLoadTasks={() => handleLoadSprintTasks(sprint.id)}
                  loadingTasks={loadingSprintIds.includes(sprint.id)}
                  hasLoadedTasks={!!sprintTasks[sprint.id]}
                  boards={boards}
                  refreshBoards={refreshBoards}
                  isMember={isMember}
                />
              </div>
            ))}
            <SprintBacklog
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              tasks={visibleBacklogTasks as any as TaskP[]}
              onMoveTask={setSelectedTaskId}
              projectId={currentProject?.id || ''}
              onTaskCreated={handleTaskUpdate}
              onTaskUpdate={handleTaskUpdate}
              isLoading={!tasksDidInitialLoad}
              onLoadMore={loadMore}
              hasMore={hasMore}
              boards={boards}
              refreshBoards={refreshBoards}
              isMember={isMember}
            />
          </div>
        </div>
      </div>
    </div>
  )
}

export default ProjectBacklog
