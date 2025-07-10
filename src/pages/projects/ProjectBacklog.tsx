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
import { useCurrentProject } from '@/hooks/useCurrentProject'
import { useOptimizedTasks } from '@/hooks/useOptimizedTasks'
import { useSprints } from '@/hooks/useSprints'
import { useToast } from '@/hooks/useToast'
import { TaskP } from '@/types/task'
import { Filter, Search, Share2 } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'

export default function ProjectBacklog() {
  const { toast } = useToast()
  const { tasks, isLoading: tasksLoading, refreshTasks } = useOptimizedTasks()
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

  // Memoize filtered tasks to avoid unnecessary recalculations
  const filteredTasks = useMemo(() => {
    if (!taskSearchQuery) return tasks
    
    const searchLower = taskSearchQuery.toLowerCase()
    return tasks.filter(task => 
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

  const handleCreateSprint = async (data: { name: string; description: string; startDate: string; endDate: string }) => {
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
        toast({
          title: 'Success',
          description: 'Sprint created successfully'
        })
        return true
      } else {
        toast({
          title: 'Error',
          description: result.message,
          variant: 'destructive'
        })
        return false
      }
    } catch (error: any) {
      toast({
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
      toast({
        title: 'Success',
        description: 'Task moved to sprint successfully'
      })
    } catch (error) {
      console.log(error)
      toast({
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

  const backlogTasks = filteredTasks.filter(
    (task) =>
      !Object.values(sprintTasks)
        .flat()
        .some((sprintTask) => sprintTask.id === task.id)
  )

  // Filter sprints
  const filteredSprints = sprints.filter((sprint) => {
    if (!sprintSearchQuery) return true
    return sprint.name.toLowerCase().includes(sprintSearchQuery.toLowerCase())
  })

  // Filter sprint tasks
  const filteredSprintTasks = Object.entries(sprintTasks).reduce(
    (acc, [sprintId, tasks]) => ({
      ...acc,
      [sprintId]: tasks.filter(task => {
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
    <div className='flex h-screen bg-gray-100'>
      <Sidebar isOpen={isSidebarOpen} onToggle={toggleSidebar} />

      <div className='flex-1 overflow-hidden'>
        <Navbar isSidebarOpen={isSidebarOpen} toggleSidebar={toggleSidebar} />

        <div ref={contentRef} className='p-6 overflow-auto h-[calc(100vh-64px)]'>
          <div className='flex-none w-full flex items-center justify-between pb-4'>
            <div className='flex items-center gap-4'>
              <h1 className='text-4xl font-bold'>Backlog</h1>
              <div className='text-2xl font-medium text-gray-500'>
                {tasks.length} {tasks.length === 1 ? 'task' : 'tasks'}
              </div>
            </div>

            <div className='flex items-center gap-4'>
              {currentProject && (
                <>
                  <SprintCreateMenu onCreateSprint={handleCreateSprint} />
                  {selectedTaskId && <SprintSelector sprints={sprints} onSprintSelect={handleMoveToSprint} />}
                </>
              )}
            </div>
          </div>

          <div className='pb-6 flex items-center justify-between'>
            <div className='flex items-center gap-4'>
              <Button variant='outline' className='bg-white hover:bg-gray-50'>
                <Filter className='mr-2 h-4 w-4' />
                Filter
              </Button>
              <div className='flex gap-4'>
                <div className='relative'>
                  <Search className='absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 transform text-gray-400' />
                  <Input
                    placeholder='Search tasks...'
                    value={taskSearchQuery}
                    onChange={(e) => setTaskSearchQuery(e.target.value)}
                    className='w-[280px] rounded-md bg-white pl-10 focus-visible:ring-offset-0 focus-visible:ring-0'
                  />
                </div>
                <div className='relative'>
                  <Search className='absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 transform text-gray-400' />
                  <Input
                    placeholder='Search sprints...'
                    value={sprintSearchQuery}
                    onChange={(e) => setSprintSearchQuery(e.target.value)}
                    className='w-[280px] rounded-md bg-white pl-10 focus-visible:ring-offset-0 focus-visible:ring-0'
                  />
                </div>
              </div>
            </div>
            <div className='flex gap-2'>
              <Button variant='outline' className='bg-white hover:bg-gray-50'>
                <Share2 className='mr-2 h-4 w-4' />
                Share
              </Button>
              <Select defaultValue='newest'>
                <SelectTrigger className='w-[180px] bg-white'>
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
              />
            ))}
            <SprintBacklog
              tasks={backlogTasks}
              onMoveTask={setSelectedTaskId}
              projectId={currentProject?.id || ''}
              onTaskCreated={handleTaskUpdate}
              onTaskUpdate={handleTaskUpdate}
              isLoading={tasksLoading}
            />
          </div>
        </div>
      </div>
    </div>
  )
}