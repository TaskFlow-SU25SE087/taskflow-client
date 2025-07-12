import { sprintApi } from '@/api/sprints'
import { taskApi } from '@/api/tasks'
import { Button } from '@/components/ui/button'
import { SprintStatusMap } from '@/constants/sprintStatus'
import { useToast } from '@/hooks/use-toast'
import { useSprints } from '@/hooks/useSprints'
import { TaskP } from '@/types/task'
import { ChevronDown, ChevronRight, Plus } from 'lucide-react'
import { useState } from 'react'
import TaskCreateMenu from '../tasks/TaskCreateMenu'
import { BacklogTaskRowSkeleton } from './BacklogTaskRowSkeleton'
import { SprintSelector } from './SprintSelector'
import { VirtualizedTaskList } from './VirtualizedTaskList'

interface SprintBacklogProps {
  tasks: TaskP[]
  onMoveTask: (taskId: string) => void
  projectId: string
  onTaskCreated: () => void
  onTaskUpdate: () => void
  sprint?: { status: string } // Thêm prop sprint nếu có
  isLoading?: boolean
}

export function SprintBacklog({
  tasks,
  onMoveTask,
  projectId,
  onTaskCreated,
  onTaskUpdate,
  sprint,
  isLoading = false
}: SprintBacklogProps) {
  const [isExpanded, setIsExpanded] = useState(true)
  const [isCreateTaskOpen, setIsCreateTaskOpen] = useState(false)
  const [selectedTaskIds, setSelectedTaskIds] = useState<string[]>([])
  const { sprints, refreshSprints } = useSprints()
  const { toast } = useToast()
  const [showSprintSelector, setShowSprintSelector] = useState(false)
  const [loadingBatch, setLoadingBatch] = useState(false)

  const handleCheck = (taskId: string, checked: boolean) => {
    setSelectedTaskIds((prev) => (checked ? [...prev, taskId] : prev.filter((id) => id !== taskId)))
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
            <div className='mb-2 flex items-center gap-2 p-2 bg-blue-50 border-b border-blue-100'>
              <span className='text-xs text-blue-600 font-medium'>{selectedTaskIds.length} selected</span>
              <Button size='sm' variant='outline' onClick={() => setShowSprintSelector(true)} disabled={loadingBatch}>
                Move to Sprint
              </Button>
              {showSprintSelector && (
                <SprintSelector
                  sprints={sprints}
                  onSprintSelect={async (sprintId) => {
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
                  }}
                  trigger={null}
                />
              )}
              <Button
                size='sm'
                variant='destructive'
                onClick={async () => {
                  if (!window.confirm('Are you sure you want to delete the selected tasks?')) return
                  setLoadingBatch(true)
                  try {
                    for (const id of selectedTaskIds) {
                      await taskApi.deleteTask(projectId, id)
                    }
                    toast({ title: 'Success', description: 'Deleted selected tasks!' })
                    setSelectedTaskIds([])
                    onTaskUpdate()
                  } catch {
                    toast({ title: 'Error', description: 'Failed to delete tasks', variant: 'destructive' })
                  } finally {
                    setLoadingBatch(false)
                  }
                }}
                disabled={loadingBatch}
              >
                Delete selected
              </Button>
            </div>
          )}

          {isLoading ? (
            <div className='p-4'>
              {Array.from({ length: 5 }).map((_, index) => (
                <BacklogTaskRowSkeleton key={index} />
              ))}
            </div>
          ) : tasks.length > 0 ? (
            <div className='p-4'>
              <VirtualizedTaskList
                tasks={tasks}
                showMeta={true}
                selectedTaskIds={selectedTaskIds}
                onCheck={handleCheck}
                onTaskUpdate={onTaskUpdate}
                height={Math.min(tasks.length * 44, 400)} // Dynamic height based on task count
              />
            </div>
          ) : (
            <div className='p-4 text-center text-gray-500'>No tasks in backlog</div>
          )}
        </div>
      )}
    </div>
  )
}
