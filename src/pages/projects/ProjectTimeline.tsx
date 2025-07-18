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
import { Calendar, CheckCircle, ChevronLeft, ChevronRight, Clock, PlayCircle, Search, Target, TrendingUp, Users } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'

interface SprintWithTasks extends Sprint {
  tasks: TaskP[]
}

// Progress statistics calculation
const calculateSprintProgress = (tasks: TaskP[]) => {
  const total = tasks.length
  const completed = tasks.filter(task => task.status === 'done' || task.status === 'Completed').length
  const inProgress = tasks.filter(task => task.status === 'ongoing' || task.status === 'In Progress').length
  const blocked = tasks.filter(task => task.status === 'Blocked').length
  const notStarted = tasks.filter(task => task.status === 'Not Started').length
  
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
  const allTasks = sprintsWithTasks.flatMap(sprint => sprint.tasks)
  const stats = calculateSprintProgress(allTasks)
  const totalSprints = sprintsWithTasks.length
  const completedSprints = sprintsWithTasks.filter(sprint => {
    const sprintStats = calculateSprintProgress(sprint.tasks)
    return sprintStats.completionPercentage === 100
  }).length
  
  const averageProgress = sprintsWithTasks.length > 0 
    ? Math.round(sprintsWithTasks.reduce((sum, sprint) => {
        const sprintStats = calculateSprintProgress(sprint.tasks)
        return sum + sprintStats.completionPercentage
      }, 0) / sprintsWithTasks.length)
    : 0

  return (
    <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6'>
      <div className='bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-4 text-white shadow-lg hover:shadow-xl transition-all duration-300'>
        <div className='flex items-center justify-between'>
          <div>
            <p className='text-blue-100 text-sm font-medium'>Total Tasks</p>
            <p className='text-2xl font-bold'>{stats.total}</p>
          </div>
          <div className='p-3 bg-blue-400/30 rounded-xl'>
            <Target className='h-6 w-6' />
          </div>
        </div>
        <div className='mt-3 flex items-center gap-2'>
          <div className='flex-1 bg-blue-400/30 rounded-full h-2'>
            <div 
              className='bg-white rounded-full h-2 transition-all duration-500'
              style={{ width: `${stats.total > 0 ? 100 : 0}%` }}
            />
          </div>
          <span className='text-xs text-blue-100'>Active</span>
        </div>
      </div>

      <div className='bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-2xl p-4 text-white shadow-lg hover:shadow-xl transition-all duration-300'>
        <div className='flex items-center justify-between'>
          <div>
            <p className='text-emerald-100 text-sm font-medium'>Completed</p>
            <p className='text-2xl font-bold'>{stats.completed}</p>
          </div>
          <div className='p-3 bg-emerald-400/30 rounded-xl'>
            <CheckCircle className='h-6 w-6' />
          </div>
        </div>
        <div className='mt-3 flex items-center gap-2'>
          <div className='flex-1 bg-emerald-400/30 rounded-full h-2'>
            <div 
              className='bg-white rounded-full h-2 transition-all duration-500'
              style={{ width: `${stats.completionPercentage}%` }}
            />
          </div>
          <span className='text-xs text-emerald-100'>{stats.completionPercentage}%</span>
        </div>
      </div>

      <div className='bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl p-4 text-white shadow-lg hover:shadow-xl transition-all duration-300'>
        <div className='flex items-center justify-between'>
          <div>
            <p className='text-orange-100 text-sm font-medium'>In Progress</p>
            <p className='text-2xl font-bold'>{stats.inProgress}</p>
          </div>
          <div className='p-3 bg-orange-400/30 rounded-xl'>
            <PlayCircle className='h-6 w-6' />
          </div>
        </div>
        <div className='mt-3 flex items-center gap-2'>
          <div className='flex-1 bg-orange-400/30 rounded-full h-2'>
            <div 
              className='bg-white rounded-full h-2 transition-all duration-500'
              style={{ width: `${stats.total > 0 ? (stats.inProgress / stats.total) * 100 : 0}%` }}
            />
          </div>
          <span className='text-xs text-orange-100'>Active</span>
        </div>
      </div>

      <div className='bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl p-4 text-white shadow-lg hover:shadow-xl transition-all duration-300'>
        <div className='flex items-center justify-between'>
          <div>
            <p className='text-purple-100 text-sm font-medium'>Avg Progress</p>
            <p className='text-2xl font-bold'>{averageProgress}%</p>
          </div>
          <div className='p-3 bg-purple-400/30 rounded-xl'>
            <TrendingUp className='h-6 w-6' />
          </div>
        </div>
        <div className='mt-3 flex items-center gap-2'>
          <div className='flex-1 bg-purple-400/30 rounded-full h-2'>
            <div 
              className='bg-white rounded-full h-2 transition-all duration-500'
              style={{ width: `${averageProgress}%` }}
            />
          </div>
          <span className='text-xs text-purple-100'>Overall</span>
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
            <h2 className='text-xl font-bold text-gray-900 tracking-tight'>
              {format(currentDate, 'MMMM yyyy')}
            </h2>
          </div>
          <div className='flex items-center gap-1 bg-lavender-50 rounded-xl p-1'>
            <Button 
              variant='ghost' 
              size='sm' 
              className='h-8 w-8 rounded-lg hover:bg-lavender-100 transition-all duration-200' 
              onClick={() => onNavigate('prev')}
            >
              <ChevronLeft className='h-4 w-4 text-lavender-600' />
            </Button>
            <Button 
              variant='ghost' 
              size='sm' 
              className='h-8 w-8 rounded-lg hover:bg-lavender-100 transition-all duration-200' 
              onClick={() => onNavigate('next')}
            >
              <ChevronRight className='h-4 w-4 text-lavender-600' />
            </Button>
          </div>
        </div>
        <div className='flex items-center gap-2 text-sm text-gray-600'>
          <Target className='h-4 w-4' />
          <span>Timeline View</span>
        </div>
      </div>
      
      <div className='grid grid-cols-[240px,1fr] border-t border-gray-200 bg-gradient-to-r from-slate-50 to-white'>
        <div className='p-4 font-semibold text-gray-700 bg-gradient-to-r from-lavender-50 to-slate-50 border-r border-gray-200 flex items-center gap-2'>
          <Users className='h-4 w-4 text-lavender-600' />
          <span>Sprints</span>
        </div>
        <div className='grid grid-cols-31 border-l border-gray-200 overflow-hidden'>
          {days.map((day, index) => (
            <div
              key={day.toString()}
              className={cn(
                'px-1 py-2 text-center text-xs border-r border-gray-200 transition-all duration-200',
                isWeekend(day) 
                  ? 'bg-gradient-to-b from-rose-50 to-rose-100 text-rose-700' 
                  : 'bg-gradient-to-b from-white to-gray-50 text-gray-700 hover:bg-lavender-50',
                'animate-fade-in'
              )}
              style={{ animationDelay: `${index * 0.01}s` }}
            >
              <div className='font-bold text-sm mb-1'>{format(day, 'd')}</div>
              <div className='text-xs opacity-75 font-medium'>
                {weekdays[day.getDay() === 0 ? 6 : day.getDay() - 1]}
              </div>
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

function TaskTooltip({ task }: { task: TaskP }) {
  return (
    <div className='absolute z-50 left-1/2 top-full mt-2 -translate-x-1/2 bg-gradient-to-br from-gray-900 to-gray-800 text-white rounded-xl shadow-2xl p-4 min-w-[280px] pointer-events-none border border-gray-700 backdrop-blur-sm animate-fade-in'>
      <div className='font-bold text-lg mb-2 text-white'>{task.title}</div>
      <div className='text-sm mb-2 text-gray-200 line-clamp-2'>
        {task.description || 'No description available'}
      </div>
      <div className='flex items-center gap-2 text-xs mb-2 text-gray-300'>
        <Users className='h-3 w-3' />
        <span>
          {Array.isArray(task.taskAssignees) && task.taskAssignees.length > 0
            ? task.taskAssignees[0].executor
            : 'Unassigned'}
        </span>
      </div>
      <div className='flex items-center gap-2 text-xs text-gray-300'>
        <Calendar className='h-3 w-3' />
        <span>
          {task.sprint?.startDate ? format(new Date(task.sprint.startDate), 'MMM dd') : 'N/A'} - {' '}
          {task.sprint?.endDate ? format(new Date(task.sprint.endDate), 'MMM dd') : 'N/A'}
        </span>
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
    { bg: 'bg-gradient-to-br from-blue-50 to-blue-100', border: 'border-blue-300', accent: 'bg-blue-500', text: 'text-blue-700' },
    { bg: 'bg-gradient-to-br from-emerald-50 to-emerald-100', border: 'border-emerald-300', accent: 'bg-emerald-500', text: 'text-emerald-700' },
    { bg: 'bg-gradient-to-br from-amber-50 to-amber-100', border: 'border-amber-300', accent: 'bg-amber-500', text: 'text-amber-700' },
    { bg: 'bg-gradient-to-br from-rose-50 to-rose-100', border: 'border-rose-300', accent: 'bg-rose-500', text: 'text-rose-700' },
    { bg: 'bg-gradient-to-br from-violet-50 to-violet-100', border: 'border-violet-300', accent: 'bg-violet-500', text: 'text-violet-700' },
    { bg: 'bg-gradient-to-br from-orange-50 to-orange-100', border: 'border-orange-300', accent: 'bg-orange-500', text: 'text-orange-700' },
    { bg: 'bg-gradient-to-br from-cyan-50 to-cyan-100', border: 'border-cyan-300', accent: 'bg-cyan-500', text: 'text-cyan-700' },
    { bg: 'bg-gradient-to-br from-lime-50 to-lime-100', border: 'border-lime-300', accent: 'bg-lime-500', text: 'text-lime-700' },
    { bg: 'bg-gradient-to-br from-pink-50 to-pink-100', border: 'border-pink-300', accent: 'bg-pink-500', text: 'text-pink-700' },
    { bg: 'bg-gradient-to-br from-indigo-50 to-indigo-100', border: 'border-indigo-300', accent: 'bg-indigo-500', text: 'text-indigo-700' }
  ]
  return colors[index % colors.length]
}

// Enhanced avatar colors with gradients
const avatarColors = [
  { bg: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', text: '#FFFFFF' },
  { bg: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)', text: '#FFFFFF' },
  { bg: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)', text: '#FFFFFF' },
  { bg: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)', text: '#000000' },
  { bg: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)', text: '#000000' },
  { bg: 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)', text: '#000000' },
  { bg: 'linear-gradient(135deg, #d299c2 0%, #fef9d7 100%)', text: '#000000' },
  { bg: 'linear-gradient(135deg, #89f7fe 0%, #66a6ff 100%)', text: '#000000' }
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
          <Avatar key={assignee.projectMemberId || idx} className='h-7 w-7 border-2 border-white shadow-md ring-2 ring-white/50'>
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

function SprintProgressBar({ tasks, sprintColor }: { tasks: TaskP[], sprintColor: any }) {
  const progress = calculateSprintProgress(tasks)
  
  return (
    <div className='w-full bg-white/50 rounded-full h-2 mb-2 overflow-hidden'>
      <div className='flex h-full'>
        <div 
          className='bg-emerald-500 transition-all duration-500'
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
  const [hoveredTaskId, setHoveredTaskId] = useState<string | null>(null)
  const [isHovered, setIsHovered] = useState(false)
  
  const progress = calculateSprintProgress(sprint.tasks)

  // Handle null dates by providing defaults or returning early
  if (!sprint.startDate || !sprint.endDate) {
    return (
      <div className='grid grid-cols-[240px,1fr] min-h-[200px] border-b border-gray-200 group hover:bg-gradient-to-r hover:from-gray-50 hover:to-white transition-all duration-300'>
        <div className='p-6 bg-gradient-to-r from-gray-50 to-white border-r border-gray-200'>
          <div className='flex items-center gap-2 mb-3'>
            <div className='w-3 h-3 rounded-full bg-gray-400' />
            <h3 className='font-semibold text-gray-900'>{sprint.name}</h3>
          </div>
          <p className='text-sm text-gray-500 mb-3'>📅 Dates not set</p>
          <div className='flex items-center gap-2 text-xs text-gray-500 mb-2'>
            <Target className='h-3 w-3' />
            <span className='bg-gray-100 px-2 py-1 rounded-full'>
              {sprint.tasks.length} task(s)
            </span>
          </div>
          <div className='w-full bg-gray-200 rounded-full h-2'>
            <div className='bg-gray-400 h-2 rounded-full' style={{ width: '0%' }} />
          </div>
        </div>
        <div className='relative border-l border-gray-200 bg-gradient-to-r from-white to-gray-50'>
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
    <div
      className={`grid grid-cols-[240px,1fr] min-h-[200px] border-b border-gray-200 group hover:shadow-lg transition-all duration-300 animate-fade-in ${sprintColor.bg}`}
      style={{ animationDelay: `${index * 0.1}s` }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className='p-6 bg-gradient-to-r from-white/80 to-white/60 backdrop-blur-sm border-r border-gray-200'>
        <div className='flex items-center gap-2 mb-3'>
          <div className={`w-3 h-3 rounded-full ${sprintColor.accent} shadow-sm`} />
          <h3 className='font-bold text-gray-900 text-lg'>{sprint.name}</h3>
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
          <SprintProgressBar tasks={sprint.tasks} sprintColor={sprintColor} />
        </div>
        
        {/* Task Statistics */}
        <div className='grid grid-cols-2 gap-2 text-xs'>
          <div className='flex items-center gap-2'>
            <div className='w-2 h-2 bg-emerald-500 rounded-full' />
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
      
      <div className='relative border-l border-gray-200 bg-gradient-to-r from-white/50 to-white/30'>
        <div className='grid grid-cols-31 h-full absolute inset-0'>
          {days.map((day, dayIndex) => (
            <div
              key={day.toString()}
              className={cn(
                'border-r border-gray-200 transition-all duration-200',
                format(day, 'eee') === 'Sat' || format(day, 'eee') === 'Sun' ? 'bg-red-50/50' : 'hover:bg-lavender-50/30'
              )}
              style={{ animationDelay: `${dayIndex * 0.005}s` }}
            />
          ))}
        </div>

        {startOffset < totalDays && visibleDuration > 0 && (
          <div
            className={`absolute top-3 bottom-3 rounded-xl border-2 ${sprintColor.border} bg-white/90 backdrop-blur-sm shadow-lg hover:shadow-xl transition-all duration-300 ${isHovered ? 'scale-105' : ''}`}
            style={{
              left: `${(startOffset / totalDays) * 100}%`,
              width: `${(visibleDuration / totalDays) * 100}%`,
              minWidth: '220px'
            }}
          >
            <div className='p-4 space-y-3 h-full overflow-y-auto'>
              {sprint.tasks && sprint.tasks.length > 0 ? (
                sprint.tasks.map((task, taskIndex) => (
                  <div
                    key={task.id}
                    className={cn(
                      'px-4 py-3 bg-white rounded-lg border-2 text-sm shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer group/task animate-slide-in',
                      task.status === 'done' || task.status === 'Completed'
                        ? 'border-emerald-300 hover:border-emerald-400 bg-emerald-50/50'
                        : task.status === 'ongoing' || task.status === 'In Progress'
                          ? 'border-blue-300 hover:border-blue-400 bg-blue-50/50'
                          : task.status === 'Blocked'
                            ? 'border-red-300 hover:border-red-400 bg-red-50/50'
                            : 'border-gray-300 hover:border-lavender-300 bg-gray-50/50'
                    )}
                    style={{ animationDelay: `${taskIndex * 0.05}s` }}
                    onClick={() => onTaskClick && onTaskClick(task)}
                    onMouseEnter={() => setHoveredTaskId(task.id)}
                    onMouseLeave={() => setHoveredTaskId(null)}
                  >
                    <div className='font-semibold text-gray-900 truncate group-hover/task:text-lavender-700 transition-colors'>
                      {task.title}
                    </div>
                    <div className='flex items-center justify-between mt-2 gap-2'>
                      <AvatarStack assignees={Array.isArray(task.taskAssignees) ? task.taskAssignees : []} />
                      <div className='flex items-center gap-1 text-xs text-gray-600'>
                        <Calendar className='w-3 h-3' />
                        <span>{task.deadline ? format(new Date(task.deadline), 'MMM dd') : 'N/A'}</span>
                      </div>
                    </div>
                    <div className='flex items-center justify-between mt-2'>
                      <span
                        className={cn(
                          'px-2 py-1 rounded-full text-xs font-semibold flex items-center gap-1',
                          task.status === 'done' || task.status === 'Completed'
                            ? 'bg-emerald-100 text-emerald-700'
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
  const { sprints, isLoading: sprintsLoading } = useSprints(currentProject?.id)
  const [selectedTask, setSelectedTask] = useState<TaskP | null>(null)
  const timelineScrollRef = useRef<HTMLDivElement>(null)
  const isDragging = useRef(false)
  const startX = useRef(0)
  const scrollLeft = useRef(0)

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
      <div className='flex h-screen bg-gradient-to-br from-slate-50 via-white to-lavender-50'>
        <Sidebar isOpen={isSidebarOpen} onToggle={toggleSidebar} currentProject={currentProject} />
        <div className='flex-1 flex flex-col overflow-hidden'>
          <Navbar isSidebarOpen={isSidebarOpen} toggleSidebar={toggleSidebar} />
          <div className='flex-1 flex items-center justify-center'>
            <div className='text-center'>
              <Loader />
              <p className='mt-4 text-gray-600 animate-pulse'>Loading project timeline...</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className='flex h-screen bg-gradient-to-br from-slate-50 via-white to-lavender-50'>
      <Sidebar isOpen={isSidebarOpen} onToggle={toggleSidebar} currentProject={currentProject} />

      <div className='flex-1 flex flex-col overflow-hidden'>
        <Navbar isSidebarOpen={isSidebarOpen} toggleSidebar={toggleSidebar} />

        <div className='flex flex-col h-full bg-white/50 backdrop-blur-sm'>
          <div className='flex-none w-full p-6 pb-4'>
            <div className='flex items-center justify-between mb-6'>
              <div className='flex items-center gap-4'>
                <div className='flex items-center gap-2'>
                  <div className='p-2 bg-lavender-100 rounded-xl'>
                    <Clock className='h-6 w-6 text-lavender-600' />
                  </div>
                  <div>
                    <h1 className='text-3xl font-bold text-gray-900 tracking-tight'>Timeline</h1>
                    <p className='text-sm text-gray-600'>Project: {currentProject.title}</p>
                  </div>
                </div>
              </div>

              <div className='flex items-center gap-3'>
                <div className='relative'>
                  <Search className='absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 transform text-gray-400' />
                  <Input 
                    placeholder='Search sprints and tasks...' 
                    className='w-[300px] pl-10 bg-white/80 backdrop-blur-sm border-gray-200 hover:border-gray-300 focus:border-lavender-400 focus:ring-lavender-400 rounded-xl shadow-sm hover:shadow-md transition-all duration-200' 
                  />
                </div>
                <Select defaultValue='month'>
                  <SelectTrigger className='w-[180px] bg-white/80 backdrop-blur-sm border-gray-200 hover:border-gray-300 rounded-xl shadow-sm hover:shadow-md transition-all duration-200'>
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

          <div className='flex-1 overflow-hidden bg-white/30 backdrop-blur-sm rounded-t-3xl shadow-lg border border-white/50'>
            <div className='min-w-[1200px] relative h-full'>
              <TimelineHeader currentDate={currentDate} onNavigate={handleNavigate} />
              <CurrentTimeIndicator currentDate={currentDate} />
              <div
                ref={timelineScrollRef}
                className='relative overflow-x-auto overflow-y-auto h-full cursor-grab select-none timeline-scroll-container'
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
                {sprintsWithTasks.length === 0 && (
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
