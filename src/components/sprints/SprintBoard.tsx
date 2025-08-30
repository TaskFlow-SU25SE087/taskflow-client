import { taskApi } from '@/api/tasks'
import { Button } from '@/components/ui/button'
import { useToastContext } from '@/components/ui/ToastContext'
import { useSprints } from '@/hooks/useSprints'
import { Board } from '@/types/board'
import { Sprint } from '@/types/sprint'
import { TaskP } from '@/types/task'
import { format } from 'date-fns'
import { ChevronDown, ChevronRight, PlayCircle, Plus } from 'lucide-react'
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
  const { updateSprint } = useSprints()
  const { showToast } = useToastContext()
  const [selectedTaskIds, setSelectedTaskIds] = useState<string[]>([])
  const [loadingBatch, setLoadingBatch] = useState(false)

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
          {!sprint.startDate && !isMember && (
            <Button
              variant='default'
              size='sm'
              className='gap-2 bg-lavender-600 hover:bg-lavender-700 text-white'
              onClick={() => setIsStartDialogOpen(true)}
            >
              <PlayCircle className='h-4 w-4' />
              Start Sprint
            </Button>
          )}
          {/* {isActiveSprint() && (
            <Button
              variant="default"
              size="sm"
              className="gap-2 bg-green-500 hover:bg-green-700 text-white"
              onClick={handleCompleteSprint}
              disabled
            >
              <CheckCircle className="h-4 w-4" />
              Complete Sprint
            </Button>
          )} */}
        </div>
      </div>
      {isExpanded && (
        <div className='overflow-x-auto transition-all duration-200 bg-white rounded-b-lg'>
          {loadingTasks && <div className='p-4 text-center text-gray-500'>Đang tải tasks...</div>}
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
                      if (!window.confirm('Bạn có chắc muốn xóa các task đã chọn?')) return
                      setLoadingBatch(true)
                      try {
                        let lastRes = null
                        for (const id of selectedTaskIds) {
                          lastRes = await taskApi.deleteTask(projectId, id)
                        }
                        if (lastRes && typeof lastRes === 'object' && 'code' in (lastRes as any)) {
                          const r: any = lastRes
                          showToast({
                            title: r.code === 200 ? 'Success' : 'Error',
                            description: r.message || 'Deleted selected tasks!',
                            variant: r.code === 200 ? 'success' : 'destructive'
                          })
                        } else if (
                          lastRes &&
                          typeof lastRes === 'object' &&
                          'data' in lastRes &&
                          lastRes.data === true
                        ) {
                          showToast({ title: 'Success', description: 'Deleted selected tasks!' })
                        } else {
                          showToast({ title: 'Error', description: 'Failed to delete tasks', variant: 'destructive' })
                        }
                        setSelectedTaskIds([])
                        onTaskUpdate()
                      } catch (err: any) {
                        showToast({
                          title: 'Error',
                          description: err.response?.data?.message || err.message || 'Failed to delete tasks',
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
