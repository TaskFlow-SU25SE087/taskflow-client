import { sprintApi } from '@/api/sprints'
import { Button } from '@/components/ui/button'
import { SprintStatusMap } from '@/constants/sprintStatus'
import { useToast } from '@/hooks/use-toast'
import { useSprints } from '@/hooks/useSprints'
import { TaskP } from '@/types/task'
import { ChevronDown, ChevronRight, Plus } from 'lucide-react'
import { useState } from 'react'
import TaskCreateMenu from '../tasks/TaskCreateMenu'
import { BacklogTaskRow } from './BacklogTaskRow'
import { SprintSelector } from './SprintSelector'

interface SprintBacklogProps {
  tasks: TaskP[]
  onMoveTask: (taskId: string) => void
  projectId: string
  onTaskCreated: () => void
  onTaskUpdate: () => void
  sprint?: { status: string } // Thêm prop sprint nếu có
}

export function SprintBacklog({ tasks, onMoveTask, projectId, onTaskCreated, onTaskUpdate, sprint }: SprintBacklogProps) {
  const [isExpanded, setIsExpanded] = useState(true)
  const [isCreateTaskOpen, setIsCreateTaskOpen] = useState(false)
  const [selectedTaskIds, setSelectedTaskIds] = useState<string[]>([])
  const { sprints, refreshSprints } = useSprints()
  const { toast } = useToast()
  const [showSprintSelector, setShowSprintSelector] = useState(false)
  const [loadingBatch, setLoadingBatch] = useState(false)

  const handleCheck = (taskId: string, checked: boolean) => {
    setSelectedTaskIds(prev => checked ? [...prev, taskId] : prev.filter(id => id !== taskId))
  }

  const handleMoveSelectedToSprint = (sprintId: string) => {
    selectedTaskIds.forEach(id => onMoveTask(id))
    setSelectedTaskIds([])
  }

  const handleBatchMove = async (sprintId: string) => {
    setLoadingBatch(true)
    try {
      await sprintApi.assignTasksToSprint(projectId, sprintId, selectedTaskIds)
      toast({ title: 'Success', description: 'Tasks moved to sprint successfully!' })
      setSelectedTaskIds([])
      setShowSprintSelector(false)
      await refreshSprints()
      onTaskUpdate()
    } catch (err) {
      toast({ title: 'Error', description: 'Failed to move tasks', variant: 'destructive' })
    } finally {
      setLoadingBatch(false)
    }
  }

  return (
    <div className='bg-white border border-gray-200 rounded-lg shadow-sm transition-colors'>
      <div className='p-4 flex items-center justify-between border-b border-gray-200'>
        <div className='flex items-center gap-2'>
          <Button
            variant='ghost'
            size='icon'
            className='h-6 w-6 hover:text-lavender-500'
            onClick={() => setIsExpanded(!isExpanded)}
          >
            {isExpanded ? <ChevronDown className='h-4 w-4' /> : <ChevronRight className='h-4 w-4' />}
          </Button>
          <div>
            <div className='flex items-center gap-2'>
              <h3 className='font-semibold text-lg'>Backlog</h3>
              {sprint && (
                <span className='ml-2 text-xs rounded px-2 py-1 bg-gray-100 text-gray-600'>
                  {SprintStatusMap[sprint.status] || sprint.status}
                </span>
              )}
              <span className='text-gray-500 text-sm'>
                ({tasks.length} {tasks.length === 1 ? 'task' : 'tasks'})
              </span>
            </div>
            <div className='text-sm text-gray-500'>Tasks not assigned to any sprint</div>
          </div>
        </div>
        <div className='flex items-center gap-2'>
          <TaskCreateMenu
            isOpen={isCreateTaskOpen}
            onOpenChange={setIsCreateTaskOpen}
            projectId={projectId}
            onTaskCreated={onTaskCreated}
            trigger={
              <div className='flex items-center gap-2 cursor-pointer'>
                <span className='font-medium'>Add Task</span>
                <Button variant='ghost' size='icon' className='h-6 w-6 rounded-lg bg-violet-100 hover:bg-violet-200'>
                  <Plus className='h-4 w-4 text-violet-600' />
                </Button>
              </div>
            }
          />
        </div>
      </div>
      {isExpanded && (
        <div className='overflow-x-auto'>
          {selectedTaskIds.length > 0 && (
            <div className='mb-2 flex items-center gap-2'>
              <span className='text-xs text-gray-600'>{selectedTaskIds.length} selected</span>
              <Button size='sm' variant='outline' onClick={() => setShowSprintSelector(true)} disabled={loadingBatch}>
                Move selected to Sprint
              </Button>
              {showSprintSelector && (
                <SprintSelector
                  sprints={sprints}
                  onSprintSelect={handleBatchMove}
                  trigger={null}
                />
              )}
            </div>
          )}
          {tasks.length > 0 ? (
            <div>
              {tasks.map((task) => (
                <BacklogTaskRow
                  key={task.id}
                  task={task}
                  onMoveToSprint={onMoveTask}
                  showMeta={true}
                  checked={selectedTaskIds.includes(task.id)}
                  onCheck={handleCheck}
                />
              ))}
            </div>
          ) : (
            <div className='p-4 text-center text-gray-500'>No tasks in backlog</div>
          )}
        </div>
      )}
    </div>
  )
}
