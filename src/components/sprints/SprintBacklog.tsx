import { sprintApi } from '@/api/sprints'
import { taskApi } from '@/api/tasks'
import { Button } from '@/components/ui/button'
import { useToastContext } from '@/components/ui/ToastContext'
import { SprintStatusMap } from '@/constants/sprintStatus'
import { useSprints } from '@/hooks/useSprints'
import { TaskP } from '@/types/task'
import { Board } from '@/types/board'
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
  onLoadMore?: () => void
  hasMore?: boolean
  boards: Board[]
  refreshBoards: () => Promise<void>
}

export function SprintBacklog({
  tasks,
  projectId,
  onTaskCreated,
  onTaskUpdate,
  sprint,
  isLoading = false,
  onLoadMore,
  hasMore,
  boards,
  refreshBoards
}: SprintBacklogProps) {
  const [isExpanded, setIsExpanded] = useState(true)
  const [isCreateTaskOpen, setIsCreateTaskOpen] = useState(false)
  const [selectedTaskIds, setSelectedTaskIds] = useState<string[]>([])
  const { sprints, refreshSprints } = useSprints()
  const { showToast } = useToastContext()
  const [showSprintSelector, setShowSprintSelector] = useState(false)
  const [loadingBatch, setLoadingBatch] = useState(false)

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
            onClick={() => setIsExpanded(!isExpanded)}
          >
            {isExpanded ? <ChevronDown className='h-4 w-4' /> : <ChevronRight className='h-4 w-4' />}
          </Button>
          <div>
            <div className='flex items-center gap-2'>
              <h3 className='font-semibold text-lg text-gray-900'>Backlog</h3>
              {sprint && (
                <span className='ml-2 text-xs rounded px-2 py-1 bg-lavender-100 text-lavender-700 border border-lavender-200'>
                  {SprintStatusMap[sprint.status] || sprint.status}
                </span>
              )}
              <span className='text-gray-600 text-sm bg-gray-100 rounded-full px-2 py-0.5 border border-gray-200'>
                {tasks.length} {tasks.length === 1 ? 'task' : 'tasks'}
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
                <span className='font-medium text-gray-800'>Add Task</span>
                <Button
                  variant='ghost'
                  size='icon'
                  className='h-6 w-6 rounded-lg bg-lavender-100 hover:bg-lavender-200'
                >
                  <Plus className='h-4 w-4 text-lavender-600' />
                </Button>
              </div>
            }
          />
        </div>
      </div>
      {isExpanded && (
        <div className='overflow-x-auto transition-all duration-200 bg-white rounded-b-lg'>
          {/* Column header for consistency with rows */}
          <div className='px-4 pt-4'>
            <div className='grid grid-cols-[24px,1fr,140px,84px,60px,60px,100px,auto] items-center gap-1 text-[11px] font-medium text-gray-500 bg-gray-50 px-2 py-2 border-y border-gray-100'>
              <div className='text-center'>{/* checkbox column */}</div>
              <div className='pl-1'>Task</div>
              <div className='text-center'>Status</div>
              <div className='text-center'>Assignees</div>
              <div className='text-center'>Comments</div>
              <div className='text-center'>Files</div>
              <div className='text-center'>Due</div>
              <div className='text-right pr-1'>Actions</div>
            </div>
          </div>
          {selectedTaskIds.length > 0 && (
            <div className='pt-4 pb-2 px-4 flex items-center gap-2'>
              <span className='text-[11px] text-gray-600'>{selectedTaskIds.length} selected</span>
              <Button size='xs' variant='outline' onClick={() => setShowSprintSelector(true)} disabled={loadingBatch}>
                Move to Sprint
              </Button>
              {showSprintSelector && (
                <SprintSelector
                  sprints={sprints}
                  onSprintSelect={async (sprintId) => {
                    setLoadingBatch(true)
                    try {
                      const res = await sprintApi.assignTasksToSprint(projectId, sprintId, selectedTaskIds)
                      if (typeof res === 'object' && res !== null && 'code' in (res as any)) {
                        const r: any = res
                        showToast({
                          title: r.code === 200 ? 'Success' : 'Error',
                          description: r.message || 'Tasks moved to sprint successfully!',
                          variant: r.code === 200 ? 'default' : 'destructive'
                        })
                      } else if (res && typeof res === 'object' && 'data' in res && res.data === true) {
                        showToast({ title: 'Success', description: 'Tasks moved to sprint successfully!', variant: 'success' })
                      } else {
                        showToast({ title: 'Error', description: 'Failed to move tasks', variant: 'destructive' })
                      }
                      setSelectedTaskIds([])
                      setShowSprintSelector(false)
                      await refreshSprints()
                      onTaskUpdate()
                    } catch (err: any) {
                      showToast({
                        title: 'Error',
                        description: err.response?.data?.message || err.message || 'Failed to move tasks',
                        variant: 'destructive'
                      })
                    } finally {
                      setLoadingBatch(false)
                    }
                  }}
                  trigger={null}
                />
              )}
              <Button
                size='xs'
                variant='destructive'
                onClick={async () => {
                  if (!window.confirm('Are you sure you want to delete the selected tasks?')) return
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
                        variant: r.code === 200 ? 'default' : 'destructive'
                      })
                    } else if (lastRes && typeof lastRes === 'object' && 'data' in lastRes && lastRes.data === true) {
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
                boards={boards}
                refreshBoards={refreshBoards}
                height={Math.min(tasks.length * 44, 400)} // Dynamic height based on task count
                onLoadMore={onLoadMore}
                hasMore={hasMore}
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
