import { Sprint } from '@/types/sprint'
import { TaskP } from '@/types/task'
import { format } from 'date-fns'
import { ChevronDown, ChevronRight, PlayCircle, CheckCircle, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useState } from 'react'
import { TaskList } from '../tasks/TaskList'
import TaskCreateMenu from '../tasks/TaskCreateMenu'
import { SprintStartMenu } from './SprintStartMenu'
import { useSprints } from '@/hooks/useSprints'
import { useToast } from '@/hooks/use-toast'

interface SprintBoardProps {
  sprint: Sprint
  tasks: TaskP[]
  onMoveTask: (taskId: string) => void
  projectId: string
  onTaskCreated: () => void
  onTaskUpdate: () => void
  onSprintUpdate: () => void
}

export function SprintBoard({
  sprint,
  tasks,
  onMoveTask,
  projectId,
  onTaskCreated,
  onTaskUpdate,
  onSprintUpdate
}: SprintBoardProps) {
  const [isExpanded, setIsExpanded] = useState(true)
  const [isCreateTaskOpen, setIsCreateTaskOpen] = useState(false)
  const [isStartDialogOpen, setIsStartDialogOpen] = useState(false)
  const { startSprint, completeSprint } = useSprints(projectId)
  const { toast } = useToast()

  const getSprintStatus = () => {
    const now = new Date()
    const startDate = sprint.startDate ? new Date(sprint.startDate) : null
    const endDate = sprint.endDate ? new Date(sprint.endDate) : null

    if (!startDate || !endDate) {
      return <span className='text-lavender-500 text-sm font-medium'>Future Sprint</span>
    }

    if (now >= startDate && now <= endDate) {
      return <span className='text-lavender-500 text-sm font-medium'>Active Sprint</span>
    }

    if (now > endDate) {
      return <span className='text-gray-600 text-sm font-medium'>Completed</span>
    }

    return <span className='text-lavender-500 text-sm font-medium'>Future Sprint</span>
  }

  const isActiveSprint = () => {
    if (!sprint.startDate || !sprint.endDate) return false
    const now = new Date()
    const startDate = new Date(sprint.startDate)
    const endDate = new Date(sprint.endDate)
    return now >= startDate && now <= endDate
  }

  const formatSprintDate = (date: Date | null) => {
    if (!date) return ''
    return format(new Date(date), 'MMM d, yyyy')
  }

  const handleStartSprint = async (startDate: string, endDate: string) => {
    try {
      await startSprint(sprint.id, startDate, endDate)
      onSprintUpdate()
      toast({
        title: 'Sprint Started',
        description: `${sprint.name} has been started successfully`,
        variant: 'default'
      })
    } catch (error) {
      console.error('Failed to start sprint:', error)
      toast({
        title: 'Error',
        description: 'Failed to start sprint. Please try again.',
        variant: 'destructive'
      })
    }
  }

  const handleCompleteSprint = async () => {
    try {
      await completeSprint(sprint.id)
      onSprintUpdate()
      toast({
        title: 'Sprint Completed',
        description: `${sprint.name} has been completed successfully`,
        variant: 'default'
      })
    } catch (error) {
      console.error('Failed to complete sprint:', error)
      toast({
        title: 'Error',
        description: 'Failed to complete sprint. Please try again.',
        variant: 'destructive'
      })
    }
  }

  return (
    <div className='bg-white border border-gray-200 rounded-lg shadow-sm'>
      <div className='p-4 flex items-center justify-between border-b border-gray-200'>
        <div className='flex items-center gap-2'>
          <Button variant='ghost' size='icon' className='h-6 w-6' onClick={() => setIsExpanded(!isExpanded)}>
            {isExpanded ? <ChevronDown className='h-4 w-4' /> : <ChevronRight className='h-4 w-4' />}
          </Button>
          <div>
            <div className='flex items-center gap-2'>
              <h3 className='font-semibold text-lg'>{sprint.name}</h3>
              <span className='text-gray-500 text-sm'>
                ({tasks.length} {tasks.length === 1 ? 'task' : 'tasks'})
              </span>
            </div>
            <div className='flex items-center gap-3 text-sm text-gray-500'>
              {getSprintStatus()}
              {(sprint.startDate || sprint.endDate) && (
                <>
                  <span>•</span>
                  <span>
                    {formatSprintDate(sprint.startDate)} - {formatSprintDate(sprint.endDate)}
                  </span>
                </>
              )}
            </div>
          </div>
        </div>
        <div className='flex items-center gap-2'>
          <TaskCreateMenu
            isOpen={isCreateTaskOpen}
            onOpenChange={setIsCreateTaskOpen}
            projectId={projectId}
            onTaskCreated={onTaskCreated}
            sprintId={sprint.id}
            trigger={
              <div className='flex items-center gap-2 cursor-pointer'>
                <span className='font-medium'>Add Task</span>
                <Button variant='ghost' size='icon' className='h-6 w-6 rounded-lg bg-violet-100 hover:bg-violet-200'>
                  <Plus className='h-4 w-4 text-violet-600' />
                </Button>
              </div>
            }
          />
          {!sprint.startDate && (
            <Button
              variant='default'
              size='sm'
              className='gap-2 bg-lavender-500 hover:bg-lavender-700'
              onClick={() => setIsStartDialogOpen(true)}
            >
              <PlayCircle className='h-4 w-4' />
              Start Sprint
            </Button>
          )}
          {isActiveSprint() && (
            <Button
              variant='default'
              size='sm'
              className='gap-2 bg-lavender-500 hover:bg-lavender-700'
              onClick={handleCompleteSprint}
            >
              <CheckCircle className='h-4 w-4' />
              Complete Sprint
            </Button>
          )}
        </div>
      </div>
      {isExpanded && (
        <div className='overflow-x-auto'>
          {tasks.length > 0 ? (
            <TaskList tasks={tasks} onMoveToSprint={onMoveTask} className='border-none' onTaskUpdate={onTaskUpdate} />
          ) : (
            <div className='p-4 text-center text-gray-500'>No tasks in this sprint yet</div>
          )}
        </div>
      )}

      <SprintStartMenu
        isOpen={isStartDialogOpen}
        onOpenChange={setIsStartDialogOpen}
        onStartSprint={handleStartSprint}
      />
    </div>
  )
}
