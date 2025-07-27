import { sprintApi } from '@/api/sprints'
import { taskApi } from '@/api/tasks'
import { Button } from '@/components/ui/button'
import { useToastContext } from '@/components/ui/ToastContext'
import { SprintStatusMap } from '@/constants/sprintStatus'
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
  onLoadMore?: () => void
  hasMore?: boolean
}

export function SprintBacklog({
  tasks,
  projectId,
  onTaskCreated,
  onTaskUpdate,
  sprint,
  isLoading = false,
  onLoadMore,
  hasMore
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
    <div className="bg-white border border-indigo-100 rounded-xl shadow-lg transition-all duration-200 hover:shadow-xl">
      <div className="p-4 flex items-center justify-between border-b border-indigo-100 bg-gradient-to-r from-indigo-50 via-white to-blue-50 rounded-t-xl">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 hover:text-indigo-500 text-indigo-500"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-lg text-indigo-700">Backlog</h3>
              {sprint && (
                <span className="ml-2 text-xs rounded px-2 py-1 bg-indigo-100 text-indigo-700 border border-indigo-200">
                  {SprintStatusMap[sprint.status] || sprint.status}
                </span>
              )}
              <span className="text-gray-500 text-sm bg-white/70 rounded px-2 py-0.5 shadow-sm">
                ({tasks.length} {tasks.length === 1 ? 'task' : 'tasks'})
              </span>
            </div>
            <div className="text-sm text-gray-500">Tasks not assigned to any sprint</div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <TaskCreateMenu
            isOpen={isCreateTaskOpen}
            onOpenChange={setIsCreateTaskOpen}
            projectId={projectId}
            onTaskCreated={onTaskCreated}
            trigger={
              <div className="flex items-center gap-2 cursor-pointer">
                <span className="font-medium text-indigo-700">Add Task</span>
                <Button variant="ghost" size="icon" className="h-6 w-6 rounded-lg bg-indigo-100 hover:bg-indigo-200">
                  <Plus className="h-4 w-4 text-indigo-600" />
                </Button>
              </div>
            }
          />
        </div>
      </div>
      {isExpanded && (
        <div className="overflow-x-auto transition-all duration-200 bg-white rounded-b-xl">
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
                      const res = await sprintApi.assignTasksToSprint(projectId, sprintId, selectedTaskIds)
                      if (typeof res === 'object' && res !== null && 'code' in (res as any)) {
                        const r: any = res;
                        showToast({ title: r.code === 200 ? 'Success' : 'Error', description: r.message || 'Tasks moved to sprint successfully!', variant: r.code === 200 ? 'default' : 'destructive' })
                      } else if (res && typeof res === 'object' && 'data' in res && res.data === true) {
                        showToast({ title: 'Success', description: 'Tasks moved to sprint successfully!' })
                      } else {
                        showToast({ title: 'Error', description: 'Failed to move tasks', variant: 'destructive' })
                      }
                      setSelectedTaskIds([])
                      setShowSprintSelector(false)
                      await refreshSprints()
                      onTaskUpdate()
                    } catch (err: any) {
                      showToast({ title: 'Error', description: err.response?.data?.message || err.message || 'Failed to move tasks', variant: 'destructive' })
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
                    let lastRes = null
                    for (const id of selectedTaskIds) {
                      lastRes = await taskApi.deleteTask(projectId, id)
                    }
                    if (lastRes && typeof lastRes === 'object' && 'code' in (lastRes as any)) {
                      const r: any = lastRes;
                      showToast({ title: r.code === 200 ? 'Success' : 'Error', description: r.message || 'Deleted selected tasks!', variant: r.code === 200 ? 'default' : 'destructive' })
                    } else if (lastRes && typeof lastRes === 'object' && 'data' in lastRes && lastRes.data === true) {
                      showToast({ title: 'Success', description: 'Deleted selected tasks!' })
                    } else {
                      showToast({ title: 'Error', description: 'Failed to delete tasks', variant: 'destructive' })
                    }
                    setSelectedTaskIds([])
                    onTaskUpdate()
                  } catch (err: any) {
                    showToast({ title: 'Error', description: err.response?.data?.message || err.message || 'Failed to delete tasks', variant: 'destructive' })
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
