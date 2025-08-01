import { taskApi } from '@/api/tasks'
import { useSignalR } from '@/contexts/SignalRContext'
import { useCurrentProject } from '@/hooks/useCurrentProject'
import { TaskP } from '@/types/task'
import { format } from 'date-fns'
import { Calendar, ChevronDown, ChevronsDown, ChevronsUp, ChevronUp, Clock, FileText, MessageSquare, User } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar'
import { Card } from '../ui/card'
import { TaskDetailMenu } from './TaskDetailMenu'

const getPriorityConfig = (priority: number) => {
  switch (priority) {
    case 1:
      return {
        icon: <ChevronDown className='h-4 w-4' />,
        text: 'Low',
        color: 'text-priority-low',
        bg: 'bg-cyan-50',
        border: 'border-cyan-200'
      }
    case 2:
      return {
        icon: <ChevronsDown className='h-4 w-4' />,
        text: 'Medium',
        color: 'text-priority-medium',
        bg: 'bg-amber-50',
        border: 'border-amber-200'
      }
    case 3:
      return {
        icon: <ChevronUp className='h-4 w-4' />,
        text: 'High',
        color: 'text-priority-high',
        bg: 'bg-red-50',
        border: 'border-red-200'
      }
    case 4:
      return {
        icon: <ChevronsUp className='h-4 w-4' />,
        text: 'Urgent',
        color: 'text-priority-urgent',
        bg: 'bg-red-100',
        border: 'border-red-300'
      }
    default:
      return {
        icon: <ChevronDown className='h-4 w-4' />,
        text: 'Low',
        color: 'text-gray-400',
        bg: 'bg-gray-50',
        border: 'border-gray-200'
      }
  }
}

interface TaskCardProps {
  task: TaskP
  compact?: boolean
  children?: React.ReactNode
}

export const TaskCard = ({ task, compact = false, children }: TaskCardProps & { children?: React.ReactNode }) => {
  const [isDetailOpen, setIsDetailOpen] = useState(false)
  const [isHovered, setIsHovered] = useState(false)
  const { currentProject } = useCurrentProject()
  const navigate = useNavigate()
  const { notificationService } = useSignalR()

  const fetchTaskDetails = useCallback(async () => {
    if (!currentProject) return

    try {
      const tasks = await taskApi.getTasksFromProject(currentProject.id)
      const currentTask = tasks.find((taskFromArray) => taskFromArray.id === task.id)
      if (currentTask) {
        // Task details updated, component will re-render with new data
        console.log('Task details updated:', currentTask)
      }
    } catch (error) {
      console.error('Error fetching task details:', error)
    }
  }, [currentProject, task.id])

  useEffect(() => {
    if (!currentProject) {
      return
    }
    fetchTaskDetails()
  }, [currentProject, navigate, fetchTaskDetails])

  // SignalR: Listen for task-related notifications
  useEffect(() => {
    const handleTaskNotification = (notification: any) => {
      if (notification.taskId === task.id) {
        console.log('Task updated via SignalR:', notification.message)
        fetchTaskDetails()
      }
    }

    notificationService.addListener(handleTaskNotification)

    return () => {
      notificationService.removeListener(handleTaskNotification)
    }
  }, [task.id, notificationService, fetchTaskDetails])

  const handleTaskUpdated = useCallback(() => {
    fetchTaskDetails()
  }, [fetchTaskDetails])

  if (!currentProject) {
    return <div className='p-4 text-center text-gray-500'>Chưa chọn project</div>
  }

  const commentCount = Array.isArray(task.comments)
    ? task.comments.length
    : Array.isArray(task.commnets)
      ? task.commnets.length
      : 0
  const fileCount = task.attachmentUrl ? 1 : 0
  const assignees = Array.isArray(task.taskAssignees) && task.taskAssignees.length > 0 ? task.taskAssignees : []
  
  const priorityConfig = getPriorityConfig(Number(task.priority))

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
        <div className='flex items-center justify-center h-8 px-3 rounded-full bg-gray-100 border border-gray-200'>
          <User className='w-3 h-3 text-gray-400' />
          <span className='text-xs text-gray-500 ml-1'>Unassigned</span>
        </div>
      )
    }
    return (
      <div className='flex -space-x-2'>
        {assignees.slice(0, 3).map((assignee, idx) => {
          const { bg, text } = getAvatarColor(idx)
          return (
            <Avatar key={assignee.projectMemberId || idx} className='h-8 w-8 border-2 border-white shadow-md ring-2 ring-white/50'>
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
          <Avatar className='h-8 w-8 border-2 border-white shadow-md ring-2 ring-white/50'>
            <AvatarFallback className='bg-gradient-to-br from-gray-100 to-gray-200 text-gray-600 text-xs font-medium'>
              +{assignees.length - 3}
            </AvatarFallback>
          </Avatar>
        )}
      </div>
    )
  }

  // Màu cho từng trạng thái task
  const statusColorMap: Record<string, string> = {
    'to do': 'bg-gray-200 text-gray-700',
    'not started': 'bg-gray-200 text-gray-700',
    'in progress': 'bg-blue-100 text-blue-700',
    'done': 'bg-green-100 text-green-700',
    'completed': 'bg-green-100 text-green-700',
    'review': 'bg-yellow-100 text-yellow-700',
    'blocked': 'bg-red-100 text-red-700',
    'cancelled': 'bg-pink-100 text-pink-700',
    'on hold': 'bg-amber-100 text-amber-700',
    'unassigned': 'bg-slate-100 text-slate-500',
    'urgent': 'bg-red-200 text-red-800',
    'testing': 'bg-purple-100 text-purple-700',
    'pending': 'bg-orange-100 text-orange-700',
    'n/a': 'bg-gray-100 text-gray-500'
  }
  const getStatusColor = (status: string) => statusColorMap[status?.toLowerCase?.()] || 'bg-gray-100 text-gray-600';

  if (compact) {
    return (
      <div className='group flex items-center gap-3 border border-gray-200 rounded-xl px-3 py-2 text-sm bg-white hover:bg-gray-50 hover:border-gray-300 transition-all duration-200 min-h-[44px] shadow-sm hover:shadow-md'>
        {/* Priority indicator */}
        <div className={`w-1 h-8 rounded-full ${priorityConfig.color.replace('text-', 'bg-')}`} />
        
        {/* Tags */}
        {task.tags && task.tags.length > 0 && (
          <div className='flex gap-1'>
            {task.tags.slice(0, 2).map((tag: { id: string; name: string; color?: string }, index: number) => (
              <span
                key={tag.id || index}
                className='inline-block px-2 py-1 text-xs font-medium rounded-md text-white shadow-sm'
                style={{ backgroundColor: tag.color || '#8B5CF6' }}
              >
                {tag.name}
              </span>
            ))}
            {task.tags.length > 2 && (
              <span className='inline-block px-2 py-1 text-xs font-medium rounded-md bg-gray-200 text-gray-600'>
                +{task.tags.length - 2}
              </span>
            )}
          </div>
        )}
        
        {/* Title */}
        <span className='font-semibold truncate max-w-[150px] text-gray-900'>{task.title}</span>
        
        {/* Description */}
        <span className='text-gray-500 truncate max-w-[150px]'>{task.description}</span>
        
        {/* Priority */}
        <div className={`flex items-center gap-1 ${priorityConfig.color} text-xs font-medium`}>
          {priorityConfig.icon}
          <span>{priorityConfig.text}</span>
        </div>
        
        {/* Status badge */}
        {task.status && (
          <span className={`px-2 py-0.5 rounded text-xs font-semibold ml-2 ${getStatusColor(task.status)}`}>{task.status}</span>
        )}
        
        {/* Move to Sprint button if present */}
        <span className='ml-auto'>{children}</span>
      </div>
    )
  }

  return (
    <>
      <div 
        className='relative group'
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onClick={() => setIsDetailOpen(true)}
      >
        {/* Priority indicator bar */}
        <div
          className={`absolute left-0 top-4 bottom-4 w-1 rounded-full ${priorityConfig.color.replace('text-', 'bg-')} shadow-sm transition-all duration-200`}
        />

        <Card className={`
          w-full border-none shadow-none cursor-pointer transition-all duration-300 ml-2 
          ${isHovered 
            ? 'hover:shadow-lg hover:shadow-xl transform hover:-translate-y-1' 
            : ''
          }
          ${priorityConfig.bg} backdrop-blur-sm
          hover:animate-task-hover
        `}>
          <div className='p-4'>
            {/* Tags */}
            {task.tags && task.tags.length > 0 && (
              <div className='flex gap-2 mb-3 flex-wrap'>
                {task.tags.map((tag: { id: string; name: string; color?: string }, index: number) => (
                  <span
                    key={tag.id || index}
                    className='inline-block px-3 py-1 text-xs font-medium rounded-full text-white shadow-sm hover:shadow-md transition-all duration-200'
                    style={{ backgroundColor: tag.color || '#8B5CF6' }}
                  >
                    {tag.name}
                  </span>
                ))}
              </div>
            )}

            {/* Title and Priority */}
            <div className='flex items-start justify-between mb-3'>
              <h3 className='font-bold text-lg text-gray-900 leading-tight flex-1 mr-3'>
                {task.title}
              </h3>
              <div className={`flex items-center gap-1 ${priorityConfig.color} ${priorityConfig.bg} px-2 py-1 rounded-full text-xs font-semibold border ${priorityConfig.border}`}>
                {priorityConfig.icon}
                <span>{priorityConfig.text}</span>
              </div>
            </div>

            {/* Description */}
            <p className='text-gray-600 mb-4 line-clamp-2 text-sm leading-relaxed'>
              {task.description}
            </p>

            {/* Stats */}
            <div className='flex items-center gap-4 mb-4'>
              <div className='flex items-center gap-1 text-gray-500 hover:text-gray-700 transition-colors'>
                <MessageSquare className='w-4 h-4' />
                <span className='text-sm font-medium'>{commentCount}</span>
              </div>
              <div className='flex items-center gap-1 text-gray-500 hover:text-gray-700 transition-colors'>
                <FileText className='w-4 h-4' />
                <span className='text-sm font-medium'>{fileCount}</span>
              </div>
              {task.deadline && (
                <div className='flex items-center gap-1 text-gray-500'>
                  <Clock className='w-4 h-4' />
                  <span className='text-sm font-medium'>
                    {format(new Date(task.deadline), 'MMM d')}
                  </span>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className='flex justify-between items-center'>
              <AvatarStack assignees={assignees} />
              
              {task.deadline && (
                <div className='flex items-center gap-1 text-gray-500'>
                  <Calendar className='w-4 h-4' />
                  <span className='text-sm font-semibold'>
                    {format(new Date(task.deadline), 'dd/MM/yyyy')}
                  </span>
                </div>
              )}
            </div>
          </div>
        </Card>
      </div>

      <TaskDetailMenu
        task={task}
        isOpen={isDetailOpen}
        onClose={() => setIsDetailOpen(false)}
        onTaskUpdated={handleTaskUpdated}
      />
    </>
  )
}
