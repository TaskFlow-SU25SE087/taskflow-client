import { TaskP } from '@/types/task'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import {
  MoreHorizontal,
  Circle,
  Bug,
  Rocket,
  Zap,
  FileText,
  Settings,
  ChevronDown,
  PlayCircle,
  CheckCircle,
  User
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuPortal,
  DropdownMenuSubContent
} from '@/components/ui/dropdown-menu'
import { useState, useEffect } from 'react'
import { taskApi } from '@/api/tasks'
import { sprintApi } from '@/api/sprints'
import { toast } from '@/hooks/use-toast'
import { cn } from '@/lib/utils'
import { useBoards } from '@/hooks/useBoards'
import { useTasks } from '@/hooks/useTasks'
import { useSprints } from '@/hooks/useSprints'
import { useCurrentProject } from '@/hooks/useCurrentProject'
import { projectMemberApi } from '@/api/projectMembers'
import { ProjectMember } from '@/types/project'
import { Avatar, AvatarFallback } from '../ui/avatar'

interface TaskListProps {
  tasks: TaskP[]
  onMoveToSprint?: (taskId: string) => void
  className?: string
  onTaskUpdate?: () => void
}

export function TaskList({ tasks, className = '', onTaskUpdate }: TaskListProps) {
  const [selectedTasks, setSelectedTasks] = useState<string[]>([])
  const [updatingTaskId, setUpdatingTaskId] = useState<string | null>(null)
  const [projectMembers, setProjectMembers] = useState<ProjectMember[]>([])
  const { refreshTasks } = useTasks()
  const { boards } = useBoards()
  const { currentProject } = useCurrentProject()
  const { sprints } = useSprints(currentProject?.id)

  useEffect(() => {
    const fetchMembers = async () => {
      if (!currentProject?.id) return

      try {
        const members = await projectMemberApi.getMembersByProjectId(currentProject.id)
        setProjectMembers(members)
      } catch (error) {
        console.error('Failed to fetch project members:', error)
        toast({
          title: 'Error',
          description: 'Failed to load project members',
          variant: 'destructive'
        })
      }
    }
    fetchMembers()
  }, [currentProject?.id])

  const toggleTaskSelection = (taskId: string) => {
    setSelectedTasks((prev) => (prev.includes(taskId) ? prev.filter((id) => id !== taskId) : [...prev, taskId]))
  }

  const toggleAllTasks = () => {
    setSelectedTasks((prev) => (prev.length === tasks.length ? [] : tasks.map((task) => task.id)))
  }

  const getTaskIcon = (description: string) => {
    const lowerDesc = description.toLowerCase()
    if (lowerDesc.includes('bug') || lowerDesc.includes('fix')) {
      return <Bug className='h-5 w-5 text-red-500' />
    }
    if (lowerDesc.includes('feature') || lowerDesc.includes('implement')) {
      return <Rocket className='h-5 w-5 text-lavender-500' />
    }
    if (lowerDesc.includes('improve') || lowerDesc.includes('optimize')) {
      return <Zap className='h-5 w-5 text-amber-500' />
    }
    if (lowerDesc.includes('config') || lowerDesc.includes('setup')) {
      return <Settings className='h-5 w-5 text-blue-500' />
    }
    return <FileText className='h-5 w-5 text-gray-500' />
  }

  const boardColors: { [key: string]: string } = {
    todo: '#5030E5',
    ongoing: '#FFA500',
    done: '#8BC34A',
    backlog: '#E84393',
    'in review': '#00B894',
    blocked: '#FF4757',
    testing: '#9B59B6',
    deployed: '#27AE60'
  }

  const getBoardColor = (status: string): string => {
    return boardColors[status.toLowerCase()] || '#5030E5'
  }

  const getStatusColor = (status: string) => {
    const color = getBoardColor(status)
    return `bg-opacity-10 text-opacity-100 hover:bg-opacity-20 hover:text-opacity-100 transition-colors bg-[${color}] text-[${color}] hover:bg-[${color}] hover:text-[${color}]`
  }

  const getStatusIcon = (status: string) => {
    const color = getBoardColor(status)
    const iconClass = `h-4 w-4 stroke-[2.5px]`
    const style = { color }

    switch (status.toLowerCase()) {
      case 'todo':
        return <Circle className={iconClass} style={style} />
      case 'ongoing':
        return <PlayCircle className={iconClass} style={style} />
      case 'done':
        return <CheckCircle className={iconClass} style={style} />
      default:
        return <Circle className={iconClass} style={style} />
    }
  }

  const handleStatusChange = async (taskId: string, newStatus: string) => {
    try {
      setUpdatingTaskId(taskId)
      await taskApi.updateTaskStatus(taskId, newStatus)
      await refreshTasks()
      toast({
        title: 'Success',
        description: `Task status updated successfully to "${newStatus}"`
      })
      if (onTaskUpdate) {
        onTaskUpdate()
      }
    } catch (error) {
      console.error('Error updating task status:', error)
      toast({
        title: 'Error',
        description: 'Failed to update task status',
        variant: 'destructive'
      })
    } finally {
      setUpdatingTaskId(null)
    }
  }

  const handleDeleteTask = async (taskId: string) => {
    try {
      await taskApi.deleteTask(taskId)
      await refreshTasks()
      toast({
        title: 'Success',
        description: 'Task deleted successfully'
      })
      if (onTaskUpdate) {
        onTaskUpdate()
      }
    } catch (error) {
      console.error('Error deleting task:', error)
      toast({
        title: 'Error',
        description: 'Failed to delete task',
        variant: 'destructive'
      })
    }
  }

  const handleAssignTask = async (taskId: string, email: string) => {
    if (!currentProject?.projectMembers?.[0]?.userId) {
      toast({
        title: 'Error',
        description: 'Cannot assign task: No project leader found',
        variant: 'destructive'
      })
      return
    }

    try {
      await taskApi.assignTask(taskId, email)
      await refreshTasks()
      toast({
        title: 'Success',
        description: 'Task assigned successfully'
      })
      if (onTaskUpdate) {
        onTaskUpdate()
      }
    } catch (error) {
      console.error('Error assigning task:', error)
      toast({
        title: 'Error',
        description: 'Failed to assign task',
        variant: 'destructive'
      })
    }
  }

  const handleMoveToSprint = async (taskId: string, sprintId: string) => {
    try {
      await sprintApi.addTaskToSprint(sprintId, taskId)
      await refreshTasks()
      toast({
        title: 'Success',
        description: 'Task moved to sprint successfully'
      })
      if (onTaskUpdate) {
        onTaskUpdate()
      }
    } catch (error) {
      console.error('Error moving task to sprint:', error)
      toast({
        title: 'Error',
        description: 'Failed to move task to sprint',
        variant: 'destructive'
      })
    }
  }

  return (
    <div className={`min-w-[800px] ${className}`}>
      <div className='grid grid-cols-[auto,auto,1fr,auto,auto,auto] gap-4 p-4 border-b border-gray-200 bg-gray-50 text-sm font-medium text-gray-500'>
        <div className='flex items-center justify-center'>
          <Checkbox
            checked={selectedTasks.length === tasks.length && tasks.length > 0}
            onCheckedChange={toggleAllTasks}
            className='border-lavender-400 data-[state=checked]:bg-lavender-500 data-[state=checked]:border-lavender-500'
          />
        </div>
        <div className='flex items-center justify-center'></div>
        <div className='flex items-center'>Task</div>
        <div className='flex items-center pr-10'>Status</div>
        <div className='flex items-center pr-5'>Assignee</div>
        <div></div>
      </div>

      <div className='divide-y divide-gray-100'>
        {tasks.map((task) => {
          const isSelected = selectedTasks.includes(task.id)
          const statusColor = getBoardColor(task.status)

          return (
            <div
              key={task.id}
              className={cn(
                'grid grid-cols-[auto,auto,1fr,auto,auto,auto] gap-4 p-4 transition-colors items-center group',
                isSelected ? 'bg-lavender-50/70' : 'hover:bg-gray-50',
                isSelected && 'hover:bg-lavender-100/70'
              )}
            >
              <div className='flex items-center justify-center'>
                <Checkbox
                  checked={isSelected}
                  onCheckedChange={() => toggleTaskSelection(task.id)}
                  className='border-lavender-400 data-[state=checked]:bg-lavender-500 data-[state=checked]:border-lavender-500'
                />
              </div>
              <div className='flex items-center justify-center'>{getTaskIcon(task.description)}</div>
              <div>
                <div className='font-medium text-gray-900'>{task.title}</div>
                <div className='text-sm text-gray-500 mt-1'>{task.description || 'No description'}</div>
              </div>
              <div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant='ghost'
                      size='sm'
                      className={cn(
                        'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm transition-colors',
                        'focus:ring-0 focus:ring-offset-0 focus-visible:ring-0 focus-visible:ring-offset-0',
                        'active:scale-95 data-[state=open]:bg-transparent',
                        'after:hidden',
                        getStatusColor(task.status),
                        updatingTaskId === task.id && 'opacity-50 cursor-not-allowed'
                      )}
                      style={{ backgroundColor: `${statusColor}20` }}
                      disabled={updatingTaskId === task.id}
                    >
                      {getStatusIcon(task.status)}
                      <span className='capitalize font-medium' style={{ color: statusColor }}>
                        {task.status}
                      </span>
                      <ChevronDown className='h-3 w-3 ml-0.5 opacity-50' style={{ color: statusColor }} />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    align='start'
                    className='w-[180px] p-1.5 animate-in fade-in-0 zoom-in-95 border-none shadow-lg'
                  >
                    {boards.map((board, index) => {
                      const boardColor = getBoardColor(board.status)
                      return (
                        <div key={board.status}>
                          <DropdownMenuItem
                            className={cn(
                              'gap-2 rounded-md px-2.5 py-2 cursor-pointer transition-colors focus:ring-0 focus:ring-offset-0',
                              task.status.toLowerCase() === board.status.toLowerCase()
                                ? 'bg-opacity-10'
                                : 'hover:bg-opacity-10'
                            )}
                            style={{
                              backgroundColor:
                                task.status.toLowerCase() === board.status.toLowerCase()
                                  ? `${boardColor}20`
                                  : 'transparent',
                              ['--hover-bg' as string]: `${boardColor}20`
                            }}
                            onClick={() => handleStatusChange(task.id, board.status)}
                          >
                            {getStatusIcon(board.status)}
                            <span className='capitalize font-medium' style={{ color: boardColor }}>
                              {board.status}
                            </span>
                          </DropdownMenuItem>
                          {index < boards.length - 1 && <DropdownMenuSeparator className='my-1 opacity-50' />}
                        </div>
                      )
                    })}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
              <div className='flex items-center gap-2'>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant='ghost'
                      size='sm'
                      className='p-0 h-auto hover:bg-transparent focus-visible:ring-transparent focus-visible:ring-0 focus-visible:ring-offset-0'
                    >
                      <Avatar className='h-8 w-8 bg-gray-200'>
                        <AvatarFallback>
                          <User className='h-4 w-4 text-gray-500' />
                        </AvatarFallback>
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align='start' className='w-[220px] p-1.5'>
                    {projectMembers.map((member) => (
                      <DropdownMenuItem
                        key={member.userId}
                        onClick={() => handleAssignTask(task.id, member.user.email)}
                        className='flex items-start gap-2 px-2 py-2'
                      >
                        <Avatar className='h-8 w-8 bg-gray-200'>
                          <AvatarFallback>
                            <User className='h-4 w-4 text-gray-500' />
                          </AvatarFallback>
                        </Avatar>
                        <div className='flex flex-col'>
                          <span className='font-medium'>{member.user.name}</span>
                          <span className='text-xs text-gray-500'>{member.user.email}</span>
                        </div>
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
              <div className='text-right'>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant='ghost'
                      size='icon'
                      className='hover:bg-gray-100 focus-visible:ring-0 focus-visible:ring-offset-0 focus:outline-none'
                    >
                      <MoreHorizontal className='h-4 w-4' />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align='end' className='min-w-[160px] p-1.5'>
                    <DropdownMenuSub>
                      <DropdownMenuSubTrigger className='px-2.5 py-2'>
                        <PlayCircle className='mr-2 h-4 w-4' />
                        <span>Move to Sprint</span>
                      </DropdownMenuSubTrigger>
                      <DropdownMenuPortal>
                        <DropdownMenuSubContent className='min-w-[200px]'>
                          {sprints.map((sprint) => (
                            <DropdownMenuItem key={sprint.id} onClick={() => handleMoveToSprint(task.id, sprint.id)}>
                              {sprint.name}
                            </DropdownMenuItem>
                          ))}
                        </DropdownMenuSubContent>
                      </DropdownMenuPortal>
                    </DropdownMenuSub>

                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      className='text-red-600 px-2.5 py-2 cursor-pointer'
                      onClick={() => handleDeleteTask(task.id)}
                    >
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          )
        })}

        {tasks.length === 0 && <div className='p-4 text-center text-gray-500'>No tasks found</div>}
      </div>
    </div>
  )
}
