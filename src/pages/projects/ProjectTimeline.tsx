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
import {
  Calendar,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  Clock,
  PlayCircle,
  Search,
  Target,
  TrendingUp,
  Users
} from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'

interface SprintWithTasks extends Sprint {
  tasks: TaskP[]
}

// Progress statistics calculation
const calculateSprintProgress = (tasks: TaskP[]) => {
  const total = tasks.length
  const completed = tasks.filter((task) => task.status === 'done' || task.status === 'Completed').length
  const inProgress = tasks.filter((task) => task.status === 'ongoing' || task.status === 'In Progress').length
  const blocked = tasks.filter((task) => task.status === 'Blocked').length
  const notStarted = tasks.filter((task) => task.status === 'Not Started').length

  const completionPercentage = total > 0 ? Math.round((completed / total) * 100) : 0

  return {
    total,
    completed,
    inProgress,
    blocked,
    notStarted,
    completionPercentage
  }
}

// Statistics overview component
function StatisticsOverview({ sprintsWithTasks }: { sprintsWithTasks: SprintWithTasks[] }) {
  const allTasks = sprintsWithTasks.flatMap((sprint) => sprint.tasks)
  const stats = calculateSprintProgress(allTasks)
  const averageProgress =
    sprintsWithTasks.length > 0
      ? Math.round(
          sprintsWithTasks.reduce((sum, sprint) => {
            const sprintStats = calculateSprintProgress(sprint.tasks)
            return sum + sprintStats.completionPercentage
          }, 0) / sprintsWithTasks.length
        )
      : 0

  return (
    <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 mb-6'>
      {/* Total Tasks Card - Clean white design */}
      <div className='bg-white rounded-lg p-4 border border-gray-200 shadow-sm hover:shadow-md transition-shadow'>
        <div className='flex items-center justify-between'>
          <div>
            <p className='text-gray-600 text-sm font-medium'>Total Tasks</p>
            <p className='text-2xl font-bold text-gray-900'>{stats.total}</p>
          </div>
          <div className='p-3 bg-blue-50 rounded-lg'>
            <Target className='h-6 w-6 text-blue-600' />
          </div>
        </div>
        <div className='mt-3 flex items-center gap-2'>
          <div className='flex-1 bg-gray-200 rounded-full h-2'>
            <div
              className='bg-blue-500 rounded-full h-2 transition-all duration-500'
              style={{ width: `${stats.total > 0 ? 100 : 0}%` }}
            />
          </div>
          <span className='text-xs text-gray-500'>Active</span>
        </div>
      </div>

      {/* Completed Card - Clean white design */}
      <div className='bg-white rounded-lg p-4 border border-gray-200 shadow-sm hover:shadow-md transition-shadow'>
        <div className='flex items-center justify-between'>
          <div>
            <p className='text-gray-600 text-sm font-medium'>Completed</p>
            <p className='text-2xl font-bold text-gray-900'>{stats.completed}</p>
          </div>
          <div className='p-3 bg-green-50 rounded-lg'>
            <CheckCircle className='h-6 w-6 text-green-600' />
          </div>
        </div>
        <div className='mt-3 flex items-center gap-2'>
          <div className='flex-1 bg-gray-200 rounded-full h-2'>
            <div
              className='bg-green-500 rounded-full h-2 transition-all duration-500'
              style={{ width: `${stats.completionPercentage}%` }}
            />
          </div>
          <span className='text-xs text-gray-500'>{stats.completionPercentage}%</span>
        </div>
      </div>

      {/* In Progress Card - Clean white design */}
      <div className='bg-white rounded-lg p-4 border border-gray-200 shadow-sm hover:shadow-md transition-shadow'>
        <div className='flex items-center justify-between'>
          <div>
            <p className='text-gray-600 text-sm font-medium'>In Progress</p>
            <p className='text-2xl font-bold text-gray-900'>{stats.inProgress}</p>
          </div>
          <div className='p-3 bg-orange-50 rounded-lg'>
            <PlayCircle className='h-6 w-6 text-orange-600' />
          </div>
        </div>
        <div className='mt-3 flex items-center gap-2'>
          <div className='flex-1 bg-gray-200 rounded-full h-2'>
            <div
              className='bg-orange-500 rounded-full h-2 transition-all duration-500'
              style={{ width: `${stats.total > 0 ? (stats.inProgress / stats.total) * 100 : 0}%` }}
            />
          </div>
          <span className='text-xs text-gray-500'>Active</span>
        </div>
      </div>

      {/* Average Progress Card - Clean white design */}
      <div className='bg-white rounded-lg p-4 border border-gray-200 shadow-sm hover:shadow-md transition-shadow'>
        <div className='flex items-center justify-between'>
          <div>
            <p className='text-gray-600 text-sm font-medium'>Avg Progress</p>
            <p className='text-2xl font-bold text-gray-900'>{averageProgress}%</p>
          </div>
          <div className='p-3 bg-gray-50 rounded-lg'>
            <TrendingUp className='h-6 w-6 text-gray-600' />
          </div>
        </div>
        <div className='mt-3 flex items-center gap-2'>
          <div className='flex-1 bg-gray-200 rounded-full h-2'>
            <div
              className='bg-gray-500 rounded-full h-2 transition-all duration-500'
              style={{ width: `${averageProgress}%` }}
            />
          </div>
          <span className='text-xs text-gray-500'>Overall</span>
        </div>
      </div>
    </div>
  )
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

  const weekdays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
  const isWeekend = (date: Date) => {
    const dayOfWeek = date.getDay()
    return dayOfWeek === 0 || dayOfWeek === 6
  }

  return (
    <div className='sticky top-0 z-20 bg-white/95 backdrop-blur-sm shadow-sm border-b border-gray-200'>
      <div className='flex items-center justify-between px-6 py-4'>
        <div className='flex items-center gap-4'>
          <div className='flex items-center gap-2'>
            <Clock className='h-5 w-5 text-lavender-600' />
            <h2 className='text-xl font-bold text-gray-900'>{format(currentDate, 'MMMM yyyy')}</h2>
          </div>
          <div className='flex items-center gap-1 bg-gray-50 rounded-lg p-1'>
            <Button
              variant='ghost'
              size='sm'
              className='h-8 w-8 rounded-lg hover:bg-gray-100 transition-colors'
              onClick={() => onNavigate('prev')}
            >
              <ChevronLeft className='h-4 w-4' />
            </Button>
            <Button
              variant='ghost'
              size='sm'
              className='h-8 w-8 rounded-lg hover:bg-gray-100 transition-colors'
              onClick={() => onNavigate('next')}
            >
              <ChevronRight className='h-4 w-4' />
            </Button>
          </div>
        </div>
        <div className='flex items-center gap-2 text-sm text-gray-600'>
          <Target className='h-4 w-4' />
          <span>Timeline View</span>
        </div>
      </div>

      <div className='grid grid-cols-[240px,1fr] border-t border-gray-200 bg-gray-50'>
        <div className='p-4 font-semibold text-gray-700 bg-gray-50 border-r border-gray-200 flex items-center gap-2'>
          <Users className='h-4 w-4' />
          <span>Sprints</span>
        </div>
        <div className='grid grid-cols-31 border-l border-gray-200 overflow-hidden'>
          {days.map((day, _index) => (
            <div
              key={day.toString()}
              className={cn(
                'px-1 py-2 text-center text-xs border-r border-gray-200 transition-colors',
                isWeekend(day) ? 'bg-red-50 text-red-600' : 'bg-white text-gray-700 hover:bg-gray-50'
              )}
            >
              <div className='font-bold text-sm mb-1'>{format(day, 'd')}</div>
              <div className='text-xs opacity-75'>{weekdays[day.getDay() === 0 ? 6 : day.getDay() - 1]}</div>
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
      return <span className='text-emerald-600'>✅</span>
    case 'ongoing':
    case 'In Progress':
      return <span className='text-blue-600'>🔄</span>
    case 'Not Started':
      return <span className='text-gray-500'>⏳</span>
    case 'Blocked':
      return <span className='text-red-600'>🚫</span>
    default:
      return <span className='text-gray-400'>⚪</span>
  }
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
      className='absolute top-0 bottom-0 w-1 bg-gradient-to-b from-lavender-400 to-lavender-600 shadow-lg shadow-lavender-400/40 z-30 rounded-full animate-pulse'
      style={{
        left: `calc(240px + (100% - 240px) * ${percentage / 100})`
      }}
    >
      <div className='w-4 h-4 rounded-full bg-lavender-500 border-2 border-white -translate-x-1/2 shadow-lg shadow-lavender-400/40 animate-bounce-subtle' />
      <div className='absolute -top-8 left-1/2 -translate-x-1/2 bg-lavender-600 text-white px-2 py-1 rounded-lg text-xs font-medium shadow-lg'>
        Now
      </div>
    </div>
  )
}

function getSprintColor(index: number) {
  const colors = [
    { bg: 'bg-blue-50', border: 'border-blue-200', accent: 'bg-blue-500', text: 'text-blue-700' },
    { bg: 'bg-green-50', border: 'border-green-200', accent: 'bg-green-500', text: 'text-green-700' },
    { bg: 'bg-orange-50', border: 'border-orange-200', accent: 'bg-orange-500', text: 'text-orange-700' },
    { bg: 'bg-red-50', border: 'border-red-200', accent: 'bg-red-500', text: 'text-red-700' },
    { bg: 'bg-purple-50', border: 'border-purple-200', accent: 'bg-purple-500', text: 'text-purple-700' },
    { bg: 'bg-yellow-50', border: 'border-yellow-200', accent: 'bg-yellow-500', text: 'text-yellow-700' },
    { bg: 'bg-cyan-50', border: 'border-cyan-200', accent: 'bg-cyan-500', text: 'text-cyan-700' },
    { bg: 'bg-pink-50', border: 'border-pink-200', accent: 'bg-pink-500', text: 'text-pink-700' }
  ]
  return colors[index % colors.length]
}

// Enhanced avatar colors with gradients
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
      <div className='flex items-center justify-center h-7 px-3 rounded-full bg-gray-100 border border-gray-200'>
        <Users className='w-3 h-3 text-gray-400' />
        <span className='text-xs text-gray-500 ml-1'>Unassigned</span>
      </div>
    )
  }
  return (
    <div className='flex -space-x-2'>
      {assignees.slice(0, 3).map((assignee, idx) => {
        const { bg, text } = getAvatarColor(idx)
        return (
          <Avatar
            key={assignee.projectMemberId || idx}
            className='h-7 w-7 border-2 border-white shadow-md ring-2 ring-white/50'
          >
            {assignee.avatar ? (
              <AvatarImage src={assignee.avatar} alt={assignee.executor} />
            ) : (
              <AvatarFallback style={{ background: bg, color: text }} className='text-xs font-medium'>
                {assignee.executor?.[0]?.toUpperCase() || '?'}
              </AvatarFallback>
            )}
          </Avatar>
        )
      })}
      {assignees.length > 3 && (
        <Avatar className='h-7 w-7 border-2 border-white shadow-md ring-2 ring-white/50'>
          <AvatarFallback className='bg-gradient-to-br from-gray-100 to-gray-200 text-gray-600 text-xs font-medium'>
            +{assignees.length - 3}
          </AvatarFallback>
        </Avatar>
      )}
    </div>
  )
}

function SprintProgressBar({ tasks }: { tasks: TaskP[] }) {
  const progress = calculateSprintProgress(tasks)

  return (
    <div className='w-full bg-gray-200 rounded-full h-2 mb-2 overflow-hidden'>
      <div className='flex h-full'>
        <div
          className='bg-green-500 transition-all duration-500'
          style={{ width: `${progress.total > 0 ? (progress.completed / progress.total) * 100 : 0}%` }}
        />
        <div
          className='bg-blue-500 transition-all duration-500'
          style={{ width: `${progress.total > 0 ? (progress.inProgress / progress.total) * 100 : 0}%` }}
        />
        <div
          className='bg-red-500 transition-all duration-500'
          style={{ width: `${progress.total > 0 ? (progress.blocked / progress.total) * 100 : 0}%` }}
        />
      </div>
    </div>
  )
}

function SprintRow({
  sprint,
  currentDate,
  index,
  onTaskClick
}: {
  sprint: SprintWithTasks
  currentDate: Date
  index: number
  onTaskClick?: (task: TaskP) => void
}) {
  const monthStart = startOfMonth(currentDate)
  const monthEnd = endOfMonth(currentDate)
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd })
  const totalDays = days.length

  const progress = calculateSprintProgress(sprint.tasks)

  // Handle null dates by providing defaults or returning early
  if (!sprint.startDate || !sprint.endDate) {
    return (
      <div className='grid grid-cols-[240px,1fr] min-h-[200px] border-b border-gray-200 hover:bg-gray-50 transition-colors'>
        <div className='p-6 bg-white border-r border-gray-200'>
          <div className='flex items-center gap-2 mb-3'>
            <div className='w-3 h-3 rounded-full bg-gray-400' />
            <h3 className='font-semibold text-gray-900'>{sprint.name}</h3>
          </div>
          <p className='text-sm text-gray-500 mb-3'>📅 Dates not set</p>
          <div className='flex items-center gap-2 text-xs text-gray-500 mb-2'>
            <Target className='h-3 w-3' />
            <span className='bg-gray-100 px-2 py-1 rounded-full'>{sprint.tasks.length} task(s)</span>
          </div>
          <div className='w-full bg-gray-200 rounded-full h-2'>
            <div className='bg-gray-400 h-2 rounded-full' style={{ width: '0%' }} />
          </div>
        </div>
        <div className='relative border-l border-gray-200 bg-gray-50'>
          <div className='flex items-center justify-center h-full text-sm text-gray-500'>
            <div className='text-center'>
              <Clock className='h-8 w-8 mx-auto mb-2 text-gray-400' />
              <span>Sprint dates not configured</span>
            </div>
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

  return (
    <div className='grid grid-cols-[240px,1fr] min-h-[200px] border-b border-gray-200 hover:bg-gray-50 transition-colors'>
      <div className='p-6 bg-white border-r border-gray-200'>
        <div className='flex items-center gap-2 mb-3'>
          <div className={`w-3 h-3 rounded-full ${sprintColor.accent}`} />
          <h3 className='font-semibold text-gray-900'>{sprint.name}</h3>
        </div>
        <div className='flex items-center gap-2 text-sm text-gray-600 mb-3'>
          <Calendar className='h-4 w-4' />
          <span>
            {format(sprintStartDate, 'MMM dd')} - {format(sprintEndDate, 'MMM dd')}
          </span>
        </div>

        {/* Progress Statistics */}
        <div className='mb-3'>
          <div className='flex items-center justify-between text-xs text-gray-600 mb-1'>
            <span>Progress</span>
            <span className='font-semibold'>{progress.completionPercentage}%</span>
          </div>
          <SprintProgressBar tasks={sprint.tasks} />
        </div>

        {/* Task Statistics */}
        <div className='grid grid-cols-2 gap-2 text-xs'>
          <div className='flex items-center gap-2'>
            <div className='w-2 h-2 bg-green-500 rounded-full' />
            <span>Done: {progress.completed}</span>
          </div>
          <div className='flex items-center gap-2'>
            <div className='w-2 h-2 bg-blue-500 rounded-full' />
            <span>Progress: {progress.inProgress}</span>
          </div>
          <div className='flex items-center gap-2'>
            <div className='w-2 h-2 bg-red-500 rounded-full' />
            <span>Blocked: {progress.blocked}</span>
          </div>
          <div className='flex items-center gap-2'>
            <div className='w-2 h-2 bg-gray-400 rounded-full' />
            <span>Todo: {progress.notStarted}</span>
          </div>
        </div>
      </div>

      <div className='relative border-l border-gray-200 bg-gray-50'>
        <div className='grid grid-cols-31 h-full absolute inset-0'>
          {days.map((day) => (
            <div
              key={day.toString()}
              className={cn(
                'border-r border-gray-200',
                format(day, 'eee') === 'Sat' || format(day, 'eee') === 'Sun' ? 'bg-red-50' : ''
              )}
            />
          ))}
        </div>

        {startOffset < totalDays && visibleDuration > 0 && (
          <div
            className={`absolute top-3 bottom-3 rounded-lg border ${sprintColor.border} ${sprintColor.bg} shadow-md hover:shadow-lg transition-shadow`}
            style={{
              left: `${(startOffset / totalDays) * 100}%`,
              width: `${(visibleDuration / totalDays) * 100}%`,
              minWidth: '220px'
            }}
          >
            <div className='p-4 space-y-3 h-full overflow-y-auto'>
              {sprint.tasks && sprint.tasks.length > 0 ? (
                sprint.tasks.map((task) => (
                  <div
                    key={task.id}
                    className={cn(
                      'px-3 py-2 bg-white rounded-lg border text-sm shadow-sm hover:shadow-md transition-shadow cursor-pointer',
                      task.status === 'done' || task.status === 'Completed'
                        ? 'border-green-200 bg-green-50'
                        : task.status === 'ongoing' || task.status === 'In Progress'
                          ? 'border-blue-200 bg-blue-50'
                          : task.status === 'Blocked'
                            ? 'border-red-200 bg-red-50'
                            : 'border-gray-200'
                    )}
                    onClick={() => onTaskClick && onTaskClick(task)}
                  >
                    <div className='font-medium text-gray-900 truncate mb-2'>{task.title}</div>
                    <div className='flex items-center justify-between gap-2'>
                      <AvatarStack assignees={Array.isArray(task.taskAssignees) ? task.taskAssignees : []} />
                      <div className='flex items-center gap-1 text-xs text-gray-600'>
                        <Calendar className='w-3 h-3' />
                        <span>{task.deadline ? format(new Date(task.deadline), 'MMM dd') : 'N/A'}</span>
                      </div>
                    </div>
                    <div className='mt-2'>
                      <span
                        className={cn(
                          'px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1 w-fit',
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
                  </div>
                ))
              ) : (
                <div className='flex items-center justify-center h-full text-sm text-gray-500'>
                  <div className='text-center'>
                    <Target className='h-8 w-8 mx-auto mb-2 text-gray-400' />
                    <span>No tasks in this sprint</span>
                  </div>
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
  const [tasksLoading, setTasksLoading] = useState(false)
  const lastTasksFetchKeyRef = useRef<string>('')
  const lastProjectRef = useRef<string | undefined>(undefined)
  const { sprints, isLoading: sprintsLoading } = useSprints()
  const [selectedTask, setSelectedTask] = useState<TaskP | null>(null)
  const timelineScrollRef = useRef<HTMLDivElement>(null)
  const isDragging = useRef(false)
  const startX = useRef(0)
  const scrollLeft = useRef(0)
  const { projectId: urlProjectId } = useParams<{ projectId: string }>()
  const navigate = useNavigate()

  // Use URL projectId as a fallback so reloads on /projects/:id/timeline still work even if hook state is momentarily null
  const effectiveProjectId = currentProject?.id || urlProjectId

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    isDragging.current = true
    startX.current = e.pageX - (timelineScrollRef.current?.getBoundingClientRect().left || 0)
    scrollLeft.current = timelineScrollRef.current?.scrollLeft || 0
  }

  const handleMouseLeave = () => {
    isDragging.current = false
  }

  const handleMouseUp = () => {
    isDragging.current = false
  }

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDragging.current) return
    e.preventDefault()
    const x = e.pageX - (timelineScrollRef.current?.getBoundingClientRect().left || 0)
    const walk = x - startX.current
    if (timelineScrollRef.current) {
      timelineScrollRef.current.scrollLeft = scrollLeft.current - walk
    }
  }

  // Sprints are fetched by useSprints when currentProject is available via the centralized provider

  // Load tasks for each sprint once sprints are available
  useEffect(() => {
    const loadSprintTasks = async () => {
      if (!effectiveProjectId) return

      // Build a stable key from sprint IDs to detect meaningful changes
      const key = sprints.map((s) => s.id).join(',')
      const projectChanged = lastProjectRef.current !== effectiveProjectId
      const sprintsChanged = lastTasksFetchKeyRef.current !== key

      if (!projectChanged && !sprintsChanged) {
        return
      }

      lastProjectRef.current = effectiveProjectId
      lastTasksFetchKeyRef.current = key

      // Render sprint rows immediately using existing tasks where available
      if (sprints.length > 0) {
        const prevById = new Map<string, TaskP[]>(sprintsWithTasks.map((sw) => [sw.id, sw.tasks]))
        const immediate = sprints.map((s) => ({ ...s, tasks: prevById.get(s.id) || [] }))
        setSprintsWithTasks(immediate)
      } else {
        setSprintsWithTasks([])
      }

      if (sprints.length === 0) return

      setTasksLoading(true)
      try {
        // Keep previous sprintsWithTasks to avoid blank UI while fetching
        const sprintsData = await Promise.all(
          sprints.map(async (sprint) => {
            const tasks = await sprintApi.getSprintTasks(effectiveProjectId, sprint.id)
            return {
              ...sprint,
              tasks
            }
          })
        )
        setSprintsWithTasks(sprintsData)
      } finally {
        setTasksLoading(false)
      }
    }

    loadSprintTasks()
  }, [sprints, effectiveProjectId])

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen)
  }

  const handleNavigate = (direction: 'prev' | 'next') => {
    setCurrentDate((current) => (direction === 'prev' ? addMonths(current, -1) : addMonths(current, 1)))
  }

  // If we don't even have an ID from URL or state, send user back to project list
  useEffect(() => {
    if (!projectLoading && !effectiveProjectId) {
      navigate('/projects')
    }
  }, [projectLoading, effectiveProjectId])

  // Show loader while fetching sprints or if we lack any project identifier yet
  // Only block the page for the very first load (sprints or missing id). Keep the page visible during task fetches.
  if (sprintsLoading || !effectiveProjectId) {
    return (
      <div className='flex h-screen bg-gray-50'>
        <Sidebar
          isOpen={isSidebarOpen}
          onToggle={toggleSidebar}
          currentProject={currentProject || (effectiveProjectId ? ({ id: effectiveProjectId } as any) : null)}
        />
        <div className='flex-1 flex flex-col overflow-hidden'>
          <Navbar isSidebarOpen={isSidebarOpen} toggleSidebar={toggleSidebar} />
          <div className='flex-1 flex items-center justify-center'>
            <div className='text-center'>
              <Loader />
              <p className='mt-4 text-gray-600'>Loading project timeline...</p>
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
        currentProject={currentProject || ({ id: effectiveProjectId } as any)}
      />

      <div className='flex-1 flex flex-col overflow-hidden'>
        <Navbar isSidebarOpen={isSidebarOpen} toggleSidebar={toggleSidebar} />

        <div className='flex flex-col h-full bg-white'>
          <div className='flex-none w-full p-6 pb-4'>
            <div className='flex items-center justify-between mb-6'>
              <div className='flex items-center gap-4'>
                <div className='flex items-center gap-2'>
                  <div className='p-2 bg-lavender-100 rounded-lg'>
                    <Clock className='h-6 w-6 text-lavender-600' />
                  </div>
                  <div>
                    <h1 className='text-3xl font-bold text-gray-900'>Timeline</h1>
                    <p className='text-sm text-gray-600'>Project: {currentProject?.title || ''}</p>
                  </div>
                </div>
              </div>

              <div className='flex items-center gap-3'>
                <div className='relative'>
                  <Search className='absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 transform text-gray-400' />
                  <Input placeholder='Search sprints and tasks...' className='w-[300px] pl-10 border-gray-300' />
                </div>
                <Select defaultValue='month'>
                  <SelectTrigger className='w-[180px] border-gray-300'>
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

            {/* Statistics Overview */}
            <StatisticsOverview sprintsWithTasks={sprintsWithTasks} />
          </div>

          <div className='flex-1 overflow-hidden bg-white rounded-t-lg shadow-sm border border-gray-200'>
            <div className='min-w-[1200px] relative h-full'>
              <TimelineHeader currentDate={currentDate} onNavigate={handleNavigate} />
              <CurrentTimeIndicator currentDate={currentDate} />
              <div
                ref={timelineScrollRef}
                className='relative overflow-x-auto overflow-y-auto h-full cursor-grab select-none'
                onMouseDown={handleMouseDown}
                onMouseLeave={handleMouseLeave}
                onMouseUp={handleMouseUp}
                onMouseMove={handleMouseMove}
              >
                {sprintsWithTasks.map((sprint, idx) => (
                  <SprintRow
                    key={sprint.id}
                    sprint={sprint}
                    currentDate={currentDate}
                    index={idx}
                    onTaskClick={(task) => setSelectedTask(task)}
                  />
                ))}
                {/* Show empty state only when sprints have been fetched */}
                {sprints.length === 0 && (
                  <div className='flex items-center justify-center h-96 text-center'>
                    <div>
                      <Clock className='h-16 w-16 mx-auto mb-4 text-gray-400' />
                      <h3 className='text-xl font-semibold text-gray-700 mb-2'>No sprints yet</h3>
                      <p className='text-gray-500'>Create your first sprint to get started with timeline tracking</p>
                    </div>
                  </div>
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
