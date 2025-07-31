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
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

const ProjectBacklog = () => {
  // Console log để đo thời gian load trang
  const startTime = useRef(Date.now())
  const hasLoggedMount = useRef(false)
  const hasLoggedTasks = useRef(false)
  const hasLoggedSprints = useRef(false)
  const hasLoggedComplete = useRef(false)
  
  console.log('🚀 [BACKLOG] Component mount started at:', new Date().toISOString())
  console.log('⏱️ [BACKLOG] Performance measurement started')
  
  // Log khi user navigate đến trang (chỉ một lần)
  useEffect(() => {
    if (!hasLoggedMount.current) {
      console.log('📍 [BACKLOG] User navigated to backlog page')
      console.log('🔄 [BACKLOG] Starting data loading process...')
      
      // Performance mark cho navigation
      if (typeof performance !== 'undefined') {
        performance.mark('backlog-navigation-start')
      }
      hasLoggedMount.current = true
    }
  }, [])
  
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

  // Log khi tasks load xong (chỉ một lần)
  useEffect(() => {
    if (!tasksLoading && tasks.length > 0 && !hasLoggedTasks.current) {
      const tasksLoadTime = Date.now() - startTime.current
      console.log('📋 [BACKLOG] Tasks loaded in:', tasksLoadTime, 'ms')
      console.log('📊 [BACKLOG] Total tasks loaded:', tasks.length)
      hasLoggedTasks.current = true
    }
  }, [tasksLoading, tasks.length])

  // Log khi sprints load xong (chỉ một lần)
  useEffect(() => {
    if (!sprintsLoading && sprints.length > 0 && !hasLoggedSprints.current) {
      const sprintsLoadTime = Date.now() - startTime.current
      console.log('🏃 [BACKLOG] Sprints loaded in:', sprintsLoadTime, 'ms')
      console.log('📊 [BACKLOG] Total sprints loaded:', sprints.length)
      hasLoggedSprints.current = true
    }
  }, [sprintsLoading, sprints.length])

  // Log khi render hoàn tất (chỉ một lần)
  useEffect(() => {
    if (!tasksLoading && !sprintsLoading && !hasLoggedComplete.current) {
      const totalLoadTime = Date.now() - startTime.current
      console.log('✅ [BACKLOG] Page fully loaded in:', totalLoadTime, 'ms')
      console.log('📈 [BACKLOG] Final metrics:', {
        componentMount: 27, // Fixed value since we're not tracking this separately
        tasksLoaded: hasLoggedTasks.current ? 'completed' : 'pending',
        sprintsLoaded: hasLoggedSprints.current ? 'completed' : 'pending',
        totalTime: totalLoadTime
      })
      hasLoggedComplete.current = true
      
      // Performance mark cho completion
      if (typeof performance !== 'undefined') {
        performance.mark('backlog-load-complete')
        performance.measure('backlog-total-load-time', 'backlog-navigation-start', 'backlog-load-complete')
        
        const measure = performance.getEntriesByName('backlog-total-load-time')[0]
        if (measure) {
          console.log('🎯 [BACKLOG] Performance API measurement:', {
            totalLoadTime: measure.duration,
            startTime: measure.startTime,
            endTime: measure.startTime + measure.duration
          })
        }
      }
    }
  }, [tasksLoading, sprintsLoading])

  // Hàm lazy load tasks cho sprint - sử dụng useCallback
  const handleLoadSprintTasks = useCallback(async (sprintId: string) => {
    if (sprintTasks[sprintId] || loadingSprintIds.includes(sprintId) || !currentProject?.id) return
    
    const sprintStartTime = Date.now()
    console.log(`🔄 [BACKLOG] Loading tasks for sprint ${sprintId}...`)
    
    setLoadingSprintIds((prev) => [...prev, sprintId])
    try {
      const tasks = await getSprintTasks(sprintId, currentProject.id)
      const sprintLoadTime = Date.now() - sprintStartTime
      console.log(`✅ [BACKLOG] Sprint ${sprintId} tasks loaded in:`, sprintLoadTime, 'ms')
      console.log(`📊 [BACKLOG] Sprint ${sprintId} has ${tasks.length} tasks`)
      
      setSprintTasks((prev) => ({ ...prev, [sprintId]: tasks }))
    } finally {
      setLoadingSprintIds((prev) => prev.filter((id) => id !== sprintId))
    }
  }, [sprintTasks, loadingSprintIds, currentProject?.id, getSprintTasks])

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

  const handleCreateSprint = useCallback(async (data: {
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
  }, [currentProject, createSprint, showToast])

  const handleMoveToSprint = useCallback(async (sprintId: string) => {
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
  }, [selectedTaskId, addTaskToSprint, fetchSprints, showToast])

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
    return sprints.filter((sprint) => 
      sprint.name.toLowerCase().includes(searchLower)
    )
  }, [sprints, debouncedSprintSearch])

  // Filter sprint tasks
  const filteredSprintTasks = useMemo(() => {
    if (!debouncedTaskSearch.trim()) return sprintTasks
    
    const searchLower = debouncedTaskSearch.toLowerCase().trim()
    return Object.entries(sprintTasks).reduce(
      (acc, [sprintId, tasks]) => ({
        ...acc,
        [sprintId]: tasks.filter((task) => 
          task.description.toLowerCase().includes(searchLower) ||
          task.status.toLowerCase().includes(searchLower) ||
          task.title?.toLowerCase().includes(searchLower)
        )
      }),
      {} as Record<string, TaskP[]>
    )
  }, [sprintTasks, debouncedTaskSearch])

  // Log render performance
  useEffect(() => {
    if (!tasksLoading && !sprintsLoading) {
      const renderTime = Date.now() - startTime.current
      console.log('🎨 [BACKLOG] Render cycle completed in:', renderTime, 'ms')
      console.log('📈 [BACKLOG] Final render metrics:', {
        totalTasks: tasks.length,
        totalSprints: sprints.length,
        backlogTasks: backlogTasks.length,
        filteredSprints: filteredSprints.length,
        totalRenderTime: renderTime
      })
    }
  }, [tasksLoading, sprintsLoading, tasks.length, sprints.length, backlogTasks.length, filteredSprints.length])


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

export default ProjectBacklog
