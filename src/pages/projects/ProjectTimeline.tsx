import { Navbar } from '@/components/Navbar'
import { Sidebar } from '@/components/Sidebar'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Loader } from '@/components/ui/loader'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useCurrentProject } from '@/hooks/useCurrentProject'
import { useSprints } from '@/hooks/useSprints'
import { cn } from '@/lib/utils'
import { Sprint } from '@/types/sprint'
import { TaskP } from '@/types/task'
import { addMonths, eachDayOfInterval, endOfMonth, format, startOfMonth } from 'date-fns'
import { ArrowLeft, ArrowRight, Calendar, Search } from 'lucide-react'
import { useEffect, useState } from 'react'
import { sprintApi } from '@/api/sprints'

interface SprintWithTasks extends Sprint {
  tasks: TaskP[]
}

function TimelineHeader({
  currentDate,
  onNavigate
}: {
  currentDate: Date
  onNavigate: (direction: 'prev' | 'next') => void
}) {
  const days = eachDayOfInterval({
    start: startOfMonth(currentDate),
    end: endOfMonth(currentDate)
  })

  return (
    <div className='sticky top-0 z-10 bg-white border-b border-gray-200'>
      <div className='flex items-center justify-between px-6 py-4'>
        <div className='flex items-center gap-2'>
          <h2 className='text-lg font-semibold'>{format(currentDate, 'MMMM yyyy')}</h2>
          <div className='flex items-center gap-1'>
            <Button variant='ghost' size='icon' className='h-8 w-8 rounded-full' onClick={() => onNavigate('prev')}>
              <ArrowLeft className='h-4 w-4' />
            </Button>
            <Button variant='ghost' size='icon' className='h-8 w-8 rounded-full' onClick={() => onNavigate('next')}>
              <ArrowRight className='h-4 w-4' />
            </Button>
          </div>
        </div>
      </div>
      <div className='grid grid-cols-[200px,1fr] border-t border-gray-200'>
        <div className='p-4 font-medium text-gray-500'>Sprints</div>
        <div className='grid grid-cols-31 border-l border-gray-200'>
          {days.map((day) => (
            <div
              key={day.toString()}
              className={cn(
                'px-2 py-1 text-center text-sm border-r border-gray-200',
                format(day, 'eee') === 'Sat' || format(day, 'eee') === 'Sun' ? 'bg-gray-50' : 'bg-white'
              )}
            >
              <div className='font-medium'>{format(day, 'd')}</div>
              <div className='text-xs text-gray-500'>{format(day, 'eee')}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function CurrentTimeIndicator({ currentDate }: { currentDate: Date }) {
  const now = new Date()
  const monthStart = startOfMonth(currentDate)
  const monthEnd = endOfMonth(currentDate)

  if (now < monthStart || now > monthEnd) {
    return null
  }

  const dayOfMonth = now.getDate() - 1
  const totalDays = endOfMonth(currentDate).getDate()

  const hoursProgress = (now.getHours() + now.getMinutes() / 60) / 24

  const percentage = ((dayOfMonth + hoursProgress) / totalDays) * 100

  return (
    <div
      className='absolute top-0 bottom-0 w-[2px] bg-lavender-500 z-20'
      style={{
        left: `calc(200px + (100% - 200px) * ${percentage / 100})`
      }}
    >
      <div className='w-2 h-2 rounded-full bg-lavender-500 -translate-x-[3px]' />
    </div>
  )
}

function SprintRow({ sprint, currentDate }: { sprint: SprintWithTasks; currentDate: Date }) {
  const monthStart = startOfMonth(currentDate)
  const monthEnd = endOfMonth(currentDate)
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd })
  const totalDays = days.length

  // Handle null dates by providing defaults or returning early
  if (!sprint.startDate || !sprint.endDate) {
    return (
      <div className='grid grid-cols-[200px,1fr] min-h-[160px] border-b border-gray-200 group hover:bg-gray-50'>
        <div className='p-4'>
          <h3 className='font-medium text-gray-900'>{sprint.name}</h3>
          <p className='text-sm text-gray-500 mt-1'>Dates not set</p>
          <p className='text-xs text-gray-500 mt-1'>{sprint.tasks.length} task(s)</p>
        </div>
        <div className='relative border-l border-gray-200'>
          <div className='flex items-center justify-center h-full text-sm text-gray-500'>
            Sprint dates not configured
          </div>
        </div>
      </div>
    )
  }

  const sprintStartDate = new Date(sprint.startDate)
  const sprintEndDate = new Date(sprint.endDate)

  const startOffset = Math.max(
    0,
    Math.floor((sprintStartDate.getTime() - monthStart.getTime()) / (1000 * 60 * 60 * 24))
  )

  const visibleDuration = Math.min(
    totalDays - startOffset,
    Math.ceil(
      (sprintEndDate.getTime() - Math.max(sprintStartDate.getTime(), monthStart.getTime())) / (1000 * 60 * 60 * 24)
    ) + 1
  )

  return (
    <div className='grid grid-cols-[200px,1fr] min-h-[160px] border-b border-gray-200 group hover:bg-gray-50'>
      <div className='p-4'>
        <h3 className='font-medium text-gray-900'>{sprint.name}</h3>
        <p className='text-sm text-gray-500 mt-1'>
          {format(sprintStartDate, 'dd/MM/yyyy')} - {format(sprintEndDate, 'dd/MM/yyyy')}
        </p>
        <p className='text-xs text-gray-500 mt-1'>{sprint.tasks.length} task(s)</p>
      </div>
      <div className='relative border-l border-gray-200'>
        <div className='grid grid-cols-31 h-full absolute inset-0'>
          {days.map((day) => (
            <div
              key={day.toString()}
              className={cn(
                'border-r border-gray-200',
                format(day, 'eee') === 'Sat' || format(day, 'eee') === 'Sun' ? 'bg-gray-50/50' : ''
              )}
            />
          ))}
        </div>

        {startOffset < totalDays && visibleDuration > 0 && (
          <div
            className='absolute top-2 bottom-2 bg-lavender-100 rounded-lg border-2 border-lavender-200'
            style={{
              left: `${(startOffset / totalDays) * 100}%`,
              width: `${(visibleDuration / totalDays) * 100}%`,
              minWidth: '200px'
            }}
          >
            <div className='p-3 space-y-2 h-full overflow-y-auto'>
              {sprint.tasks && sprint.tasks.length > 0 ? (
                sprint.tasks.map((task) => (
                  <div
                    key={task.id}
                    className='px-3 py-2 bg-white rounded-md border border-gray-200 text-sm shadow-sm hover:border-lavender-300 transition-colors cursor-pointer hover:shadow-md'
                  >
                    <div className='font-medium truncate'>{task.title}</div>
                    <div className='flex items-center justify-between'>
                      <span className='text-xs text-gray-500'>{'Unassigned'}</span>
                      <span
                        className={cn(
                          'px-2 py-0.5 rounded-full text-xs font-medium',
                          task.status === 'done'
                            ? 'bg-green-100 text-green-700'
                            : task.status === 'ongoing'
                              ? 'bg-blue-100 text-blue-700'
                              : 'bg-gray-100 text-gray-700'
                        )}
                      >
                        {task.status}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <div className='flex items-center justify-center h-full text-sm text-gray-500'>
                  No tasks in this sprint
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default function ProjectTimeline() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true)
  const { currentProject, isLoading: projectLoading } = useCurrentProject()
  const [currentDate, setCurrentDate] = useState(new Date())
  const [sprintsWithTasks, setSprintsWithTasks] = useState<SprintWithTasks[]>([])
  const { sprints, isLoading: sprintsLoading } = useSprints(currentProject?.id)

  useEffect(() => {
    const loadSprintTasks = async () => {
      if (!sprints.length) return

      const sprintsData = await Promise.all(
        sprints.map(async (sprint) => {
          const tasks = await sprintApi.getSprintTasks(sprint.id)
          return {
            ...sprint,
            tasks
          }
        })
      )
      setSprintsWithTasks(sprintsData)
    }

    loadSprintTasks()
  }, [sprints])

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen)
  }

  const handleNavigate = (direction: 'prev' | 'next') => {
    setCurrentDate((current) => (direction === 'prev' ? addMonths(current, -1) : addMonths(current, 1)))
  }

  if (projectLoading || sprintsLoading || !currentProject) {
    return (
      <div className='flex h-screen bg-gray-100'>
        <Sidebar isOpen={isSidebarOpen} onToggle={toggleSidebar} />
        <div className='flex-1 flex flex-col overflow-hidden'>
          <Navbar isSidebarOpen={isSidebarOpen} toggleSidebar={toggleSidebar} />
          <Loader />
        </div>
      </div>
    )
  }

  return (
    <div className='flex h-screen bg-gray-100'>
      <Sidebar isOpen={isSidebarOpen} onToggle={toggleSidebar} />

      <div className='flex-1 flex flex-col overflow-hidden'>
        <Navbar isSidebarOpen={isSidebarOpen} toggleSidebar={toggleSidebar} />

        <div className='flex flex-col h-full'>
          <div className='flex-none w-full flex items-center justify-between p-6 pb-4'>
            <div className='flex items-center gap-2'>
              <h1 className='text-4xl font-bold'>Timeline</h1>
              <div className='flex items-center gap-2 ml-4'>
                <span className='text-sm text-gray-500'>Project:</span>
                <span className='font-medium'>{currentProject.title}</span>
              </div>
            </div>

            <div className='flex items-center gap-3'>
              <div className='relative'>
                <Search className='absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 transform text-gray-400' />
                <Input placeholder='Search sprints and tasks...' className='w-[280px] pl-10 bg-white' />
              </div>
              <Select defaultValue='month'>
                <SelectTrigger className='w-[180px] bg-white'>
                  <Calendar className='mr-2 h-4 w-4' />
                  <SelectValue placeholder='View' />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='month'>Month</SelectItem>
                  <SelectItem value='quarter'>Quarter</SelectItem>
                  <SelectItem value='year'>Year</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className='flex-1 overflow-y-auto overflow-x-auto bg-white border-t border-gray-200'>
            <div className='min-w-[1200px] relative pb-6'>
              <TimelineHeader currentDate={currentDate} onNavigate={handleNavigate} />
              <CurrentTimeIndicator currentDate={currentDate} />
              <div className='relative'>
                {sprintsWithTasks.map((sprint) => (
                  <SprintRow key={sprint.id} sprint={sprint} currentDate={currentDate} />
                ))}
                {sprintsWithTasks.length === 0 && (
                  <div className='p-8 text-center text-gray-500'>No sprints found for this project</div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
