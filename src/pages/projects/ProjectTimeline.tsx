import { sprintApi } from '@/api/sprints'
import { Navbar } from '@/components/Navbar'
import { Sidebar } from '@/components/Sidebar'
import { TaskDetailMenu } from '@/components/tasks/TaskDetailMenu'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
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
import { useEffect, useRef, useState } from 'react'

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

function getStatusIcon(status: string) {
  switch (status) {
    case 'done':
    case 'Completed':
      return <>✅</>
    case 'ongoing':
    case 'In Progress':
      return <>🔄</>
    case 'Not Started':
      return <>🕓</>
    case 'Blocked':
      return <>⛔</>
    default:
      return <>•</>
  }
}

function TaskTooltip({ task }: { task: TaskP }) {
  return (
    <div className="absolute z-50 left-1/2 top-full mt-2 -translate-x-1/2 bg-black/80 text-white rounded-lg shadow-lg p-3 min-w-[220px] pointer-events-none">
      <div className="font-semibold mb-1">{task.title}</div>
      <div className="text-sm mb-1">{task.description || 'No description'}</div>
      <div className="text-xs mb-1">Assignee: {Array.isArray(task.taskAssignees) && task.taskAssignees.length > 0 ? task.taskAssignees[0].executor : 'Unassigned'}</div>
      <div className="text-xs">Start: {task.sprint?.startDate ? format(new Date(task.sprint.startDate), 'dd/MM/yyyy') : 'N/A'} - End: {task.sprint?.endDate ? format(new Date(task.sprint.endDate), 'dd/MM/yyyy') : 'N/A'}</div>
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
      className='absolute top-0 bottom-0 w-[4px] bg-purple-600 shadow-lg shadow-purple-400/40 z-30 rounded'
      style={{
        left: `calc(200px + (100% - 200px) * ${percentage / 100})`
      }}
    >
      <div className='w-4 h-4 rounded-full bg-purple-600 border-2 border-white -translate-x-1/2 shadow-lg shadow-purple-400/40' />
    </div>
  )
}

function getSprintColor(index: number) {
  const colors = [
    'bg-blue-50 border-blue-200',
    'bg-green-50 border-green-200',
    'bg-yellow-50 border-yellow-200',
    'bg-pink-50 border-pink-200',
    'bg-purple-50 border-purple-200',
    'bg-orange-50 border-orange-200',
    'bg-cyan-50 border-cyan-200',
    'bg-lime-50 border-lime-200',
    'bg-rose-50 border-rose-200',
    'bg-violet-50 border-violet-200'
  ]
  return colors[index % colors.length]
}

// --- AvatarStack nội bộ cho timeline task ---
const avatarColors = [
  { bg: 'linear-gradient(135deg, #FF6B6B 0%, #FF8E8E 100%)', text: '#FFFFFF' },
  { bg: 'linear-gradient(135deg, #4ECDC4 0%, #45B7AF 100%)', text: '#FFFFFF' },
  { bg: 'linear-gradient(135deg, #FFD93D 0%, #FFE566 100%)', text: '#000000' },
  { bg: 'linear-gradient(135deg, #6C5CE7 0%, #8480E9 100%)', text: '#FFFFFF' },
  { bg: 'linear-gradient(135deg, #A8E6CF 0%, #DCEDC1 100%)', text: '#000000' },
  { bg: 'linear-gradient(135deg, #FF8B94 0%, #FFC2C7 100%)', text: '#000000' },
  { bg: 'linear-gradient(135deg, #98ACFF 0%, #6C63FF 100%)', text: '#FFFFFF' },
  { bg: 'linear-gradient(135deg, #FFA62B 0%, #FFB85C 100%)', text: '#000000' }
]
const getAvatarColor = (index: number) => avatarColors[index % avatarColors.length]

function AvatarStack({ assignees }: { assignees: any[] }) {
  if (!assignees || assignees.length === 0) {
    return (
      <div className='flex items-center justify-center h-7 px-2 rounded bg-gray-100'>
        <span className='text-xs text-gray-500'>Unassigned</span>
      </div>
    )
  }
  return (
    <div className='flex -space-x-2'>
      {assignees.slice(0, 4).map((assignee, idx) => {
        const { bg, text } = getAvatarColor(idx)
        return (
          <Avatar key={assignee.projectMemberId || idx} className='h-6 w-6 border-2 border-white shadow'>
            {assignee.avatar ? (
              <AvatarImage src={assignee.avatar} alt={assignee.executor} />
            ) : (
              <AvatarFallback style={{ background: bg, color: text }}>
                {assignee.executor?.[0]?.toUpperCase() || '?'}
              </AvatarFallback>
            )}
          </Avatar>
        )
      })}
      {assignees.length > 4 && (
        <Avatar className='h-6 w-6 border-2 border-white shadow'>
          <AvatarFallback style={{ background: '#F3F4F6', color: '#6B7280' }}>
            +{assignees.length - 4}
          </AvatarFallback>
        </Avatar>
      )}
    </div>
  )
}

function SprintRow({ sprint, currentDate, index, onTaskClick }: { sprint: SprintWithTasks; currentDate: Date; index: number; onTaskClick?: (task: TaskP) => void }) {
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

  const sprintColor = getSprintColor(index)
  const [hoveredTaskId, setHoveredTaskId] = useState<string | null>(null);

  return (
    <div className={`grid grid-cols-[200px,1fr] min-h-[160px] border-b border-gray-200 group hover:bg-gray-50 ${sprintColor}`}>
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
            className={`absolute top-2 bottom-2 rounded-lg border-2 ${sprintColor}`}
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
                    className={cn(
                      'px-3 py-2 bg-white rounded-md border text-sm shadow-sm hover:border-lavender-300 transition-colors cursor-pointer hover:shadow-md',
                      task.status === 'done' || task.status === 'Completed'
                        ? 'border-green-400'
                        : task.status === 'ongoing' || task.status === 'In Progress'
                        ? 'border-blue-400'
                        : task.status === 'Blocked'
                        ? 'border-red-400'
                        : 'border-gray-300'
                    )}
                    onClick={() => onTaskClick && onTaskClick(task)}
                    onMouseEnter={() => setHoveredTaskId(task.id)}
                    onMouseLeave={() => setHoveredTaskId(null)}
                    style={{ position: 'relative' }}
                  >
                    <div className='font-medium truncate'>{task.title}</div>
                    <div className='flex items-center justify-between mt-1'>
                      <AvatarStack assignees={Array.isArray(task.taskAssignees) ? task.taskAssignees : []} />
                      <span className='flex items-center gap-1 text-xs text-gray-700 font-semibold'>
                        <Calendar className='w-4 h-4 text-gray-400' />
                        {task.deadline ? format(new Date(task.deadline), 'dd/MM/yyyy') : 'N/A'}
                      </span>
                      <span
                        className={cn(
                          'px-2 py-0.5 rounded-full text-xs font-medium flex items-center gap-1',
                          task.status === 'done' || task.status === 'Completed'
                            ? 'bg-green-100 text-green-700'
                            : task.status === 'ongoing' || task.status === 'In Progress'
                            ? 'bg-blue-100 text-blue-700'
                            : task.status === 'Blocked'
                            ? 'bg-red-100 text-red-700'
                            : 'bg-gray-100 text-gray-700'
                        )}
                      >
                        {getStatusIcon(task.status)}
                        {task.status}
                      </span>
                    </div>
                    {hoveredTaskId === task.id && <TaskTooltip task={task} />}
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
  const [selectedTask, setSelectedTask] = useState<TaskP | null>(null)
  const timelineScrollRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);
  const startX = useRef(0);
  const scrollLeft = useRef(0);

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    isDragging.current = true;
    startX.current = e.pageX - (timelineScrollRef.current?.getBoundingClientRect().left || 0);
    scrollLeft.current = timelineScrollRef.current?.scrollLeft || 0;
  };

  const handleMouseLeave = () => {
    isDragging.current = false;
  };

  const handleMouseUp = () => {
    isDragging.current = false;
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDragging.current) return;
    e.preventDefault();
    const x = e.pageX - (timelineScrollRef.current?.getBoundingClientRect().left || 0);
    const walk = x - startX.current;
    if (timelineScrollRef.current) {
      timelineScrollRef.current.scrollLeft = scrollLeft.current - walk;
    }
  };

  useEffect(() => {
    const loadSprintTasks = async () => {
      if (!sprints.length || !currentProject?.id) return

      const sprintsData = await Promise.all(
        sprints.map(async (sprint) => {
          const tasks = await sprintApi.getSprintTasks(currentProject.id, sprint.id)
          return {
            ...sprint,
            tasks
          }
        })
      )
      setSprintsWithTasks(sprintsData)
    }

    loadSprintTasks()
  }, [sprints, currentProject])

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen)
  }

  const handleNavigate = (direction: 'prev' | 'next') => {
    setCurrentDate((current) => (direction === 'prev' ? addMonths(current, -1) : addMonths(current, 1)))
  }

  if (projectLoading || sprintsLoading || !currentProject) {
    return (
      <div className='flex h-screen bg-gray-100'>
        <Sidebar isOpen={isSidebarOpen} onToggle={toggleSidebar} currentProject={currentProject} />
        <div className='flex-1 flex flex-col overflow-hidden'>
          <Navbar isSidebarOpen={isSidebarOpen} toggleSidebar={toggleSidebar} />
          <Loader />
        </div>
      </div>
    )
  }

  return (
    <div className='flex h-screen bg-gray-100'>
      <Sidebar isOpen={isSidebarOpen} onToggle={toggleSidebar} currentProject={currentProject} />

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

          <div className='flex-1 overflow-y-auto bg-white border-t border-gray-200'>
            <div className='min-w-[1200px] relative pb-6'>
              <TimelineHeader currentDate={currentDate} onNavigate={handleNavigate} />
              <CurrentTimeIndicator currentDate={currentDate} />
              <div
                ref={timelineScrollRef}
                className='relative overflow-x-auto cursor-grab select-none'
                onMouseDown={handleMouseDown}
                onMouseLeave={handleMouseLeave}
                onMouseUp={handleMouseUp}
                onMouseMove={handleMouseMove}
              >
                {sprintsWithTasks.map((sprint, idx) => (
                  <SprintRow key={sprint.id} sprint={sprint} currentDate={currentDate} index={idx} onTaskClick={task => setSelectedTask(task)} />
                ))}
                {sprintsWithTasks.length === 0 && (
                  <div className='p-8 text-center text-gray-500'>No sprints found for this project</div>
                )}
              </div>
            </div>
          </div>
        </div>
        {selectedTask && (
          <TaskDetailMenu
            task={selectedTask}
            isOpen={!!selectedTask}
            onClose={() => setSelectedTask(null)}
            onTaskUpdated={() => {}}
          />
        )}
      </div>
    </div>
  )
}
