import { Navbar } from '@/components/Navbar'
import { Sidebar } from '@/components/Sidebar'
import { BacklogSkeleton } from '@/components/sprints/BacklogSkeleton'
import { SprintBacklog } from '@/components/sprints/SprintBacklog'
import { SprintBoard } from '@/components/sprints/SprintBoard'
import { SprintCreateMenu } from '@/components/sprints/SprintCreateMenu'
import { SprintSelector } from '@/components/sprints/SprintSelector'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useToastContext } from '@/components/ui/ToastContext'
import { useCurrentProject } from '@/hooks/useCurrentProject'
import { useOptimizedTasks } from '@/hooks/useOptimizedTasks'
import { useSprints } from '@/hooks/useSprints'
import { TaskP } from '@/types/task'
import { Filter, Search, Share2, ChevronDown } from 'lucide-react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

const ProjectBacklog = () => {
  // Cleaned up noisy perf logs to keep UI logic focused

  const { showToast } = useToastContext()
  const { tasks, isLoading: tasksLoading, refreshTasks, loadMore, hasMore } = useOptimizedTasks()
  const [isSidebarOpen, setIsSidebarOpen] = useState(true)
  const [taskSearchQuery, setTaskSearchQuery] = useState('')
  const [sprintSearchQuery, setSprintSearchQuery] = useState('')
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null)
  const { currentProject } = useCurrentProject()
  const [scrollPosition, setScrollPosition] = useState(0)
  const contentRef = useRef<HTMLDivElement>(null)

  const {
    sprints,
    isLoading: sprintsLoading,
    createSprint,
    getSprintTasks,
    addTaskToSprint,
    fetchSprints
  } = useSprints()

  const [sprintTasks, setSprintTasks] = useState<Record<string, TaskP[]>>({})
  const [loadingSprintIds, setLoadingSprintIds] = useState<string[]>([])

  // Debounced search queries - phải khai báo trước useMemo
  const [debouncedTaskSearch, setDebouncedTaskSearch] = useState('')
  const [debouncedSprintSearch, setDebouncedSprintSearch] = useState('')

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
        task.description.toLowerCase().includes(searchLower) ||
        task.status.toLowerCase().includes(searchLower) ||
        task.title?.toLowerCase().includes(searchLower)
    )
  }, [tasks, debouncedTaskSearch])

  useEffect(() => {
    if (!sprints.length || !currentProject?.id) return

    const loadSprintTasks = async () => {
      const tasksMap: Record<string, TaskP[]> = {}
      await Promise.all(
        sprints.map(async (sprint) => {
          const tasks = await getSprintTasks(sprint.id, currentProject.id)
          tasksMap[sprint.id] = tasks
        })
      )

      setSprintTasks(tasksMap)
    }

    loadSprintTasks()
  }, [sprints, getSprintTasks, currentProject?.id])

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
          status: '0'
        })
        if (result.ok) {
          showToast({
            title: 'Success',
            description: 'Sprint created successfully'
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
      } catch (error: any) {
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
        await fetchSprints()
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
    [selectedTaskId, addTaskToSprint, fetchSprints, showToast]
  )

  const handleTaskUpdate = useCallback(async () => {
    if (contentRef.current) {
      setScrollPosition(contentRef.current.scrollTop)
    }
    await fetchSprints()
    await refreshTasks()
  }, [fetchSprints, refreshTasks])

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
            task.description.toLowerCase().includes(searchLower) ||
            task.status.toLowerCase().includes(searchLower) ||
            task.title?.toLowerCase().includes(searchLower)
        )
      }),
      {} as Record<string, TaskP[]>
    )
  }, [sprintTasks, debouncedTaskSearch])

  // Keep render lightweight – no debug logs

  if (sprintsLoading || tasksLoading) {
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
                  <SprintCreateMenu onCreateSprint={handleCreateSprint} />
                  {selectedTaskId && <SprintSelector sprints={sprints} onSprintSelect={handleMoveToSprint} />}
                </>
              )}
            </div>
          </div>

          {/* Toolbar (match Board style) */}
          <div className='flex items-center justify-between mb-3'>
            <div className='flex items-center gap-3'>
              <Button variant='outline' className='hover:bg-gray-50 border-gray-300'>
                <Filter className='mr-2 h-4 w-4' />
                Filter
                <ChevronDown className='ml-2 h-4 w-4' />
              </Button>
              <div className='relative'>
                <Search className='absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 transform text-gray-400' />
                <Input
                  placeholder='Search tasks...'
                  value={taskSearchQuery}
                  onChange={(e) => setTaskSearchQuery(e.target.value)}
                  className='w-[280px] pl-10 border-gray-300'
                />
              </div>
              <div className='relative'>
                <Search className='absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 transform text-gray-400' />
                <Input
                  placeholder='Search sprints...'
                  value={sprintSearchQuery}
                  onChange={(e) => setSprintSearchQuery(e.target.value)}
                  className='w-[220px] pl-10 border-gray-300'
                />
              </div>
            </div>
            <div className='flex gap-2 items-center'>
              <Button variant='ghost' className='hover:bg-gray-100'>
                <Share2 className='mr-2 h-4 w-4' />
                Share
              </Button>
              <Select defaultValue='newest'>
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
              <SprintBoard
                key={sprint.id}
                sprint={sprint}
                tasks={filteredSprintTasks[sprint.id] || []}
                onMoveTask={setSelectedTaskId}
                projectId={currentProject?.id || ''}
                onTaskUpdate={handleTaskUpdate}
                onTaskCreated={handleTaskUpdate}
                onSprintUpdate={handleSprintUpdate}
                onLoadTasks={() => handleLoadSprintTasks(sprint.id)}
                loadingTasks={loadingSprintIds.includes(sprint.id)}
                hasLoadedTasks={!!sprintTasks[sprint.id]}
              />
            ))}
            <SprintBacklog
              tasks={backlogTasks as any as TaskP[]}
              onMoveTask={setSelectedTaskId}
              projectId={currentProject?.id || ''}
              onTaskCreated={handleTaskUpdate}
              onTaskUpdate={handleTaskUpdate}
              isLoading={tasksLoading}
              onLoadMore={loadMore}
              hasMore={hasMore}
            />
          </div>
        </div>
      </div>
    </div>
  )
}

export default ProjectBacklog
