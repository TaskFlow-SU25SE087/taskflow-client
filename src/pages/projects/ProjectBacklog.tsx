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
import { Filter, Search, Share2 } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'

export default function ProjectBacklog() {
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

  // Hàm lazy load tasks cho sprint
  const handleLoadSprintTasks = async (sprintId: string) => {
    if (sprintTasks[sprintId] || loadingSprintIds.includes(sprintId) || !currentProject?.id) return
    setLoadingSprintIds((prev) => [...prev, sprintId])
    try {
      const tasks = await getSprintTasks(sprintId, currentProject.id)
      setSprintTasks((prev) => ({ ...prev, [sprintId]: tasks }))
    } finally {
      setLoadingSprintIds((prev) => prev.filter((id) => id !== sprintId))
    }
  }

  // Memoize filtered tasks to avoid unnecessary recalculations
  const filteredTasks = useMemo(() => {
    if (!taskSearchQuery) return tasks

    const searchLower = taskSearchQuery.toLowerCase()
    return tasks.filter(
      (task) =>
        task.description.toLowerCase().includes(searchLower) ||
        task.status.toLowerCase().includes(searchLower) ||
        task.title?.toLowerCase().includes(searchLower)
    )
  }, [tasks, taskSearchQuery])

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

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen)

  const handleCreateSprint = async (data: {
    name: string
    description: string
    startDate: string
    endDate: string
  }) => {
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
  }

  const handleMoveToSprint = async (sprintId: string) => {
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
  }

  const handleTaskUpdate = async () => {
    if (contentRef.current) {
      setScrollPosition(contentRef.current.scrollTop)
    }
    await fetchSprints()
    await refreshTasks()
  }

  const handleSprintUpdate = async () => {
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
  }

  // Lọc backlog: task chưa gán sprint hoặc sprintId đặc biệt/no sprint
  const backlogTasks = filteredTasks.filter(
    (task) =>
      !task.sprintId ||
      task.sprintId === '' ||
      task.sprintId === null ||
      task.sprintId === undefined ||
      task.sprintId === '00000000-0000-0000-0000-000000000000' ||
      (task.sprintName && task.sprintName.toLowerCase() === 'no sprint')
  )
  console.log('DEBUG backlogTasks:', backlogTasks);

  // Filter sprints
  const filteredSprints = sprints.filter((sprint) => {
    if (!sprintSearchQuery) return true
    return sprint.name.toLowerCase().includes(sprintSearchQuery.toLowerCase())
  })

  // Filter sprint tasks
  const filteredSprintTasks = Object.entries(sprintTasks).reduce(
    (acc, [sprintId, tasks]) => ({
      ...acc,
      [sprintId]: tasks.filter((task) => {
        if (!taskSearchQuery) return true
        const searchLower = taskSearchQuery.toLowerCase()
        return (
          task.description.toLowerCase().includes(searchLower) ||
          task.status.toLowerCase().includes(searchLower) ||
          task.title?.toLowerCase().includes(searchLower)
        )
      })
    }),
    {} as Record<string, TaskP[]>
  )

  if (sprintsLoading || tasksLoading) {
    return (
      <div className='flex h-screen bg-gray-100'>
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
    <div className="flex h-screen bg-gradient-to-br from-indigo-50 via-white to-blue-50">
      <Sidebar isOpen={isSidebarOpen} onToggle={toggleSidebar} />

      <div className="flex-1 overflow-hidden flex flex-col">
        <Navbar isSidebarOpen={isSidebarOpen} toggleSidebar={toggleSidebar} />

        <div
          ref={contentRef}
          className="p-2 sm:p-6 overflow-auto h-[calc(100vh-64px)] flex flex-col gap-4"
        >
          {/* Header */}
          <div className="flex-none w-full flex flex-col sm:flex-row sm:items-center justify-between pb-2 sm:pb-4 gap-2 sm:gap-0">
            <div className="flex items-center gap-4">
              <h1 className="text-3xl sm:text-4xl font-bold text-indigo-700 flex items-center gap-2 drop-shadow-sm">
                <span className="inline-block bg-indigo-100 rounded-full p-2">
                  <Filter className="h-6 w-6 text-indigo-500" />
                </span>
                Backlog
              </h1>
              <div className="text-lg sm:text-2xl font-medium text-gray-500 bg-white/70 rounded px-3 py-1 shadow-sm">
                {tasks.length} {tasks.length === 1 ? 'task' : 'tasks'}
              </div>
            </div>
            <div className="flex items-center gap-2 sm:gap-4">
              {currentProject && (
                <>
                  <SprintCreateMenu onCreateSprint={handleCreateSprint} />
                  {selectedTaskId && <SprintSelector sprints={sprints} onSprintSelect={handleMoveToSprint} />}
                </>
              )}
            </div>
          </div>

          {/* Toolbar */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 sm:gap-0 bg-white/80 rounded-lg shadow px-3 py-2 mb-2 border border-gray-100">
            <div className="flex items-center gap-2 sm:gap-4 flex-1">
              <Button variant="outline" className="bg-white hover:bg-gray-50 border-indigo-100">
                <Filter className="mr-2 h-4 w-4 text-indigo-400" />
                Filter
              </Button>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 transform text-gray-400" />
                <Input
                  placeholder="Search tasks..."
                  value={taskSearchQuery}
                  onChange={(e) => setTaskSearchQuery(e.target.value)}
                  className="w-[180px] sm:w-[240px] rounded-md bg-white pl-10 focus-visible:ring-2 focus-visible:ring-indigo-200"
                />
              </div>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 transform text-gray-400" />
                <Input
                  placeholder="Search sprints..."
                  value={sprintSearchQuery}
                  onChange={(e) => setSprintSearchQuery(e.target.value)}
                  className="w-[140px] sm:w-[180px] rounded-md bg-white pl-10 focus-visible:ring-2 focus-visible:ring-indigo-200"
                />
              </div>
            </div>
            <div className="flex gap-2 items-center">
              <Button variant="outline" className="bg-white hover:bg-gray-50 border-indigo-100">
                <Share2 className="mr-2 h-4 w-4 text-indigo-400" />
                Share
              </Button>
              <Select defaultValue="newest">
                <SelectTrigger className="w-[120px] sm:w-[160px] bg-white border-indigo-100">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="newest">Newest</SelectItem>
                  <SelectItem value="oldest">Oldest</SelectItem>
                  <SelectItem value="priority">Priority</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Sprint & Backlog List */}
          <div className="space-y-6">
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
