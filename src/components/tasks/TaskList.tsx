import { projectMemberApi } from '@/api/projectMembers'
import { sprintApi } from '@/api/sprints'
import { taskApi } from '@/api/tasks'
import { Button } from '@/components/ui/button'
import { toast } from '@/hooks/use-toast'
import { useBoards } from '@/hooks/useBoards'
import { useCurrentProject } from '@/hooks/useCurrentProject'
import { useSprints } from '@/hooks/useSprints'
import { useTasks } from '@/hooks/useTasks'
import { ProjectMember } from '@/types/project'
import { TaskP } from '@/types/task'
import { SortableContext } from '@dnd-kit/sortable'
import {
    Bug,
    CheckCircle,
    Circle,
    FileText,
    PlayCircle,
    Rocket,
    Settings,
    Zap
} from 'lucide-react'
import { useEffect, useState } from 'react'
import { SortableTaskCard } from './SortableTaskCard'

interface TaskListProps {
  tasks: TaskP[]
  onMoveToSprint?: (taskId: string) => void
  className?: string
  onTaskUpdate?: () => void
  compact?: boolean
}

export function TaskList({ tasks, className = '', onMoveToSprint, onTaskUpdate, compact = false }: TaskListProps) {
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
        console.log('[ProjectMembers] fetchMembers response:', members)
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

  const getBoardColor = (status: string | undefined | null): string => {
    if (!status) return '#5030E5'
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
      if (!currentProject?.id) throw new Error('No projectId')
      const board = boards.find(b => (b.name || '').toLowerCase() === newStatus.toLowerCase())
      if (!board) throw new Error('No board found for status: ' + newStatus)
      await taskApi.moveTaskToBoard(currentProject.id, taskId, board.id)
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
    if (!currentProject?.id) return;
    try {
      await taskApi.deleteTask(currentProject.id, taskId);
      await refreshTasks();
      toast({
        title: 'Success',
        description: 'Task deleted successfully',
      });
      if (onTaskUpdate) onTaskUpdate();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete task',
        variant: 'destructive',
      });
    }
  };

  const handleAssignTask = async (taskId: string, assigneeId: string) => {
    if (!currentProject?.id) return;
    try {
      await taskApi.assignTask(currentProject.id, taskId, assigneeId);
      await refreshTasks();
      toast({
        title: 'Success',
        description: 'Task assigned successfully',
      });
      if (onTaskUpdate) onTaskUpdate();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to assign task',
        variant: 'destructive',
      });
    }
  };

  const handleMoveToSprint = async (taskId: string, sprintId: string) => {
    if (!currentProject?.id) return;
    try {
      await sprintApi.assignTasksToSprint(currentProject.id, sprintId, [taskId]);
      await refreshTasks();
      toast({
        title: 'Success',
        description: 'Task moved to sprint successfully',
      });
      if (onTaskUpdate) onTaskUpdate();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to move task to sprint',
        variant: 'destructive',
      });
    }
  };

  return (
    <SortableContext items={tasks.map((task) => task.id)}>
      {tasks.map((task) => (
        <div key={task.id} className='relative'>
          <SortableTaskCard task={task} compact={compact} />
          {onMoveToSprint && (
            <div className='absolute top-2 right-2'>
              <Button size='sm' variant='outline' onClick={() => onMoveToSprint(task.id)}>
                Move to Sprint
              </Button>
            </div>
          )}
        </div>
      ))}
    </SortableContext>
  )
}
