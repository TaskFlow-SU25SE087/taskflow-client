import { taskApi } from '@/api/tasks'
import { Button } from '@/components/ui/button'
import { useToastContext } from '@/components/ui/ToastContext'
import { useSprints } from '@/hooks/useSprints'
import { APIResponse } from '@/types/api'
import { Board } from '@/types/board'
import { Sprint } from '@/types/sprint'
import { TaskP } from '@/types/task'
import { format } from 'date-fns'
import { ChevronDown, ChevronRight, Play, Plus, Square } from 'lucide-react'
import { useState } from 'react'
import TaskCreateMenu from '../tasks/TaskCreateMenu'
import { BacklogTaskRow } from './BacklogTaskRow'
import { SprintEditMenu } from './SprintEditMenu'
import { SprintStartMenu } from './SprintStartMenu'
import { SprintStatusDropdown } from './SprintStatusDropdown'

interface SprintBoardProps {
  sprint: Sprint
  tasks: TaskP[]
  onMoveTask: (taskId: string) => void
  projectId: string
  onTaskCreated: () => void
  onTaskUpdate: () => void
  onSprintUpdate: () => void
  onLoadTasks: () => void
  loadingTasks: boolean
  hasLoadedTasks: boolean
  boards: Board[]
  refreshBoards: () => Promise<void>
  isMember?: boolean
}

export function SprintBoard({
  sprint,
  tasks,
  projectId,
  onTaskCreated,
  onTaskUpdate,
  onSprintUpdate,
  onLoadTasks,
  loadingTasks,
  hasLoadedTasks,
  boards,
  refreshBoards,
  isMember = false
}: SprintBoardProps) {
  const [isExpanded, setIsExpanded] = useState(true)
  const [isCreateTaskOpen, setIsCreateTaskOpen] = useState(false)
  const [isStartDialogOpen, setIsStartDialogOpen] = useState(false)
  // Sửa destructuring useSprints chỉ lấy các property thực sự có
  const { updateSprint, updateSprintStatus } = useSprints()
  const { showToast } = useToastContext()
  const [selectedTaskIds, setSelectedTaskIds] = useState<string[]>([])
  const [loadingBatch, setLoadingBatch] = useState(false)
  const [isUpdatingSprintStatus, setIsUpdatingSprintStatus] = useState(false)

  // Map backend status string to UI status
  // const _statusMap: Record<string, { label: string; color: string }> = {
  //   NotStarted: { label: 'Not Started', color: 'bg-gray-200 text-gray-700' },
  //   InProgress: { label: 'In Progress', color: 'bg-blue-100 text-blue-700' },
  //   Completed: { label: 'Completed', color: 'bg-green-100 text-green-700' },
  //   OnHold: { label: 'On Hold', color: 'bg-yellow-100 text-yellow-700' },
  //   Cancelled: { label: 'Cancelled', color: 'bg-red-100 text-red-700' }
  // }

  // Removed unused getSprintStatus function

  const formatSprintDate = (date: string | Date | null) => {
    if (!date) return ''
    return format(new Date(date), 'MMM d, yyyy')
  }

  const handleCheck = (taskId: string, checked: boolean) => {
    setSelectedTaskIds((prev) => (checked ? [...prev, taskId] : prev.filter((id) => id !== taskId)))
  }

  // Sprint control functions
  const handleStartSprint = async () => {
    setIsUpdatingSprintStatus(true)
    try {
      const success = await updateSprintStatus(sprint.id, '10000') // In Progress
      if (success) {
        showToast({
          title: 'Success',
          description: `Sprint "${sprint.name}" has been started!`,
          variant: 'success'
        })
        onSprintUpdate()
      } else {
        showToast({
          title: 'Error',
          description: 'Failed to start sprint. Please try again.',
          variant: 'destructive'
        })
      }
    } catch (error: unknown) {
      const err = error as { message?: string }
      showToast({
        title: 'Error',
        description: err.message || 'Failed to start sprint. Please try again.',
        variant: 'destructive'
      })
    } finally {
      setIsUpdatingSprintStatus(false)
    }
  }

  const handleEndSprint = async () => {
    const confirmEnd = window.confirm(
      `Are you sure you want to end sprint "${sprint.name}"? This action cannot be undone.`
    )
    if (!confirmEnd) return

    setIsUpdatingSprintStatus(true)
    try {
      const success = await updateSprintStatus(sprint.id, '20000') // Completed
      if (success) {
        showToast({
          title: 'Success',
          description: `Sprint "${sprint.name}" has been completed!`,
          variant: 'success'
        })
        onSprintUpdate()
      } else {
        showToast({
          title: 'Error',
          description: 'Failed to end sprint. Please try again.',
          variant: 'destructive'
        })
      }
    } catch (error: unknown) {
      const err = error as { message?: string }
      showToast({
        title: 'Error',
        description: err.message || 'Failed to end sprint. Please try again.',
        variant: 'destructive'
      })
    } finally {
      setIsUpdatingSprintStatus(false)
    }
  }

  // Check if sprint can be started/ended
  const canStartSprint = String(sprint.status) === '0' || String(sprint.status) === 'NotStarted'
  const canEndSprint = String(sprint.status) === '10000' || String(sprint.status) === 'InProgress'

  return (
    <div className='bg-white border border-gray-200 rounded-lg shadow-sm transition-all duration-200 hover:shadow-md'>
      <div className='p-4 flex items-center justify-between border-b border-gray-200 rounded-t-lg bg-white'>
        <div className='flex items-center gap-2'>
          <Button
            variant='ghost'
            size='icon'
            className='h-6 w-6 text-lavender-600 hover:bg-lavender-100 rounded-lg'
            onClick={() => {
              const next = !isExpanded
              setIsExpanded(next)
              if (next && !hasLoadedTasks) {
                onLoadTasks()
              }
            }}
          >
            {isExpanded ? <ChevronDown className='h-4 w-4' /> : <ChevronRight className='h-4 w-4' />}
          </Button>
          <div>
            <div className='flex items-center gap-2'>
              <h3 className='font-semibold text-lg text-gray-900'>{sprint.name}</h3>
              <span className='text-gray-600 text-sm bg-gray-100 rounded-full px-2 py-0.5 border border-gray-200'>
                {tasks.length} {tasks.length === 1 ? 'task' : 'tasks'}
              </span>
              <SprintEditMenu
                sprint={{
                  id: sprint.id,
                  name: sprint.name,
                  description: sprint.description || '',
                  startDate: sprint.startDate || '',
                  endDate: sprint.endDate || '',
                  status: sprint.status
                }}
                onUpdateSprint={async (data) => {
                  // Update: pass canonical textual status; updateSprint expects string status
                  await updateSprint(sprint.id, {
                    name: data.name,
                    description: data.description,
                    startDate: data.startDate,
                    endDate: data.endDate,
                    status: data.status
                  })
                  onSprintUpdate()
                }}
                isMember={isMember}
              />
            </div>
            <div className='flex items-center gap-3 text-sm'>
              <SprintStatusDropdown sprint={sprint} onStatusUpdate={onSprintUpdate} isMember={isMember} />
              {(sprint.startDate || sprint.endDate) && (
                <>
                  <span>•</span>
                  <span className='text-gray-500'>
                    {formatSprintDate(sprint.startDate)} - {formatSprintDate(sprint.endDate)}
                  </span>
                </>
              )}
            </div>
          </div>
        </div>
        <div className='flex items-center gap-2'>
          {/* Sprint Control Buttons */}
          {!isMember && (
            <div className='flex items-center gap-3 mr-4'>
              {canStartSprint && (
                <button
                  onClick={handleStartSprint}
                  disabled={isUpdatingSprintStatus}
                  className='flex items-center gap-2 px-3 py-2 rounded-lg transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed group'
                  title='Start Sprint'
                >
                  <div className='flex items-center justify-center w-8 h-8 rounded-full border-2 border-gray-300 bg-white group-hover:border-lavender-400'>
                    <Play
                      className='h-3.5 w-3.5 text-gray-600 group-hover:text-lavender-600 ml-0.5'
                      fill='currentColor'
                    />
                  </div>
                  <span className='text-sm font-medium text-gray-700 group-hover:text-gray-900'>Start Sprint</span>
                </button>
              )}
              {canEndSprint && (
                <button
                  onClick={handleEndSprint}
                  disabled={isUpdatingSprintStatus}
                  className='flex items-center gap-2 px-3 py-2 rounded-lg transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed group'
                  title='End Sprint'
                >
                  <div className='flex items-center justify-center w-8 h-8 rounded-full border-2 border-gray-300 bg-white group-hover:border-lavender-400'>
                    <Square className='h-3 w-3 text-gray-600 group-hover:text-lavender-600' fill='currentColor' />
                  </div>
                  <span className='text-sm font-medium text-gray-700 group-hover:text-gray-900'>End Sprint</span>
                </button>
              )}
              {isUpdatingSprintStatus && (
                <div className='flex items-center gap-2 text-sm text-gray-600 px-3 py-2'>
                  <div className='w-4 h-4 border-2 border-gray-300 border-t-lavender-600 rounded-full animate-spin' />
                  <span>Updating...</span>
                </div>
              )}
            </div>
          )}

          <TaskCreateMenu
            isOpen={isCreateTaskOpen}
            onOpenChange={setIsCreateTaskOpen}
            projectId={projectId}
            onTaskCreated={onTaskCreated}
            sprintId={sprint.id}
            trigger={
              !isMember ? (
                <div className='flex items-center gap-2 cursor-pointer'>
                  <span className='font-medium text-gray-800'>Add Task</span>
                  <Button
                    variant='ghost'
                    size='icon'
                    className='h-6 w-6 rounded-lg bg-lavender-100 hover:bg-lavender-200'
                  >
                    <Plus className='h-4 w-4 text-lavender-600' />
                  </Button>
                </div>
              ) : null
            }
          />
        </div>
      </div>
      {isExpanded && (
        <div className='overflow-x-auto transition-all duration-200 bg-white rounded-b-lg'>
          {loadingTasks && <div className='p-4 text-center text-gray-500'>Loading tasks...</div>}
          {/* Column header for consistency with Backlog */}
          {!loadingTasks && (
            <div className='px-4 pt-4'>
              <div className='grid grid-cols-[24px,1fr,140px,84px,60px,60px,100px,auto] items-center gap-1 text-[11px] font-medium text-gray-500 bg-gray-50 px-2 py-2 border-y border-gray-100'>
                <div className='text-center'>{/* checkbox */}</div>
                <div className='pl-1'>Task</div>
                <div className='text-center'>Status</div>
                <div className='text-center'>Assignees</div>
                <div className='text-center'>Comments</div>
                <div className='text-center'>Files</div>
                <div className='text-center'>Due</div>
                <div className='text-right pr-1'>Actions</div>
              </div>
            </div>
          )}
          {!loadingTasks && hasLoadedTasks && (
            <>
              {selectedTaskIds.length > 0 && (
                <div className='pt-4 pb-2 px-4 flex items-center gap-2'>
                  <span className='text-[11px] text-gray-600'>{selectedTaskIds.length} selected</span>
                  <Button
                    size='xs'
                    variant='destructive'
                    onClick={async () => {
                      if (!window.confirm('Are you sure you want to delete the selected tasks?')) return
                      setLoadingBatch(true)
                      try {
                        let lastRes: APIResponse<boolean> | null = null
                        for (const id of selectedTaskIds) {
                          lastRes = await taskApi.deleteTask(projectId, id)
                        }
                        if (lastRes) {
                          if (lastRes.code === 200 || lastRes.data === true) {
                            showToast({
                              title: 'Success',
                              description: lastRes.message || 'Deleted selected tasks!',
                              variant: 'success'
                            })
                          } else {
                            showToast({
                              title: 'Error',
                              description: lastRes.message || 'Failed to delete tasks',
                              variant: 'destructive'
                            })
                          }
                        } else {
                          showToast({ title: 'Error', description: 'Failed to delete tasks', variant: 'destructive' })
                        }
                        setSelectedTaskIds([])
                        onTaskUpdate()
                      } catch (err: unknown) {
                        const error = err as { response?: { data?: { message?: string } }; message?: string }
                        showToast({
                          title: 'Error',
                          description: error.response?.data?.message || error.message || 'Failed to delete tasks',
                          variant: 'destructive'
                        })
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
              {tasks.length > 0 ? (
                <div className='p-4'>
                  {tasks.map((task) => (
                    <BacklogTaskRow
                      key={task.id}
                      task={task}
                      showMeta={true}
                      checked={selectedTaskIds.includes(task.id)}
                      onCheck={handleCheck}
                      boards={boards}
                      refreshBoards={refreshBoards}
                      onTaskUpdate={onTaskUpdate}
                    />
                  ))}
                </div>
              ) : (
                <div className='p-4 text-center text-gray-400'>No tasks in this sprint.</div>
              )}
            </>
          )}
        </div>
      )}

      <SprintStartMenu
        isOpen={isStartDialogOpen}
        onOpenChange={setIsStartDialogOpen}
        onStartSprint={async () => {
          /* Do nothing */
        }}
      />
    </div>
  )
}
