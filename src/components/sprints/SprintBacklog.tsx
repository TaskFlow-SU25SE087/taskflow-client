/* eslint-disable @typescript-eslint/no-explicit-any */
import { sprintApi } from '@/api/sprints'
import { taskApi } from '@/api/tasks'
import { Button } from '@/components/ui/button'
import { useToastContext } from '@/components/ui/ToastContext'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger
} from '@/components/ui/alert-dialog'
import { SprintStatusMap } from '@/constants/sprintStatus'
import { useSprints } from '@/hooks/useSprints'
import { Board } from '@/types/board'
import { TaskP } from '@/types/task'
import { ChevronDown, ChevronRight, Plus, Play, Square } from 'lucide-react'
import { useState } from 'react'
import TaskCreateMenu from '../tasks/TaskCreateMenu'
import { BacklogTaskRow } from './BacklogTaskRow'
import { BacklogTaskRowSkeleton } from './BacklogTaskRowSkeleton'
import { SprintSelector } from './SprintSelector'

interface SprintBacklogProps {
  tasks: TaskP[]
  onMoveTask: (taskId: string) => void
  projectId: string
  onTaskCreated: () => void
  onTaskUpdate: () => void
  sprint?: { id: string; status: string | number } // Enhanced sprint prop
  isLoading?: boolean
  onLoadMore?: () => void
  hasMore?: boolean
  boards: Board[]
  refreshBoards: () => Promise<void>
  isMember?: boolean
  currentSprint?: { id: string; status: string | number; name: string } // Add current sprint for controls
}

export function SprintBacklog({
  tasks,
  projectId,
  onTaskCreated,
  onTaskUpdate,
  sprint,
  isLoading = false,
  boards,
  refreshBoards,
  isMember = false,
  currentSprint
}: SprintBacklogProps) {
  const [isExpanded, setIsExpanded] = useState(true)
  const [isCreateTaskOpen, setIsCreateTaskOpen] = useState(false)
  const [selectedTaskIds, setSelectedTaskIds] = useState<string[]>([])
  const [isEndDialogOpen, setIsEndDialogOpen] = useState(false)
  const { sprints, refreshSprints, updateSprintStatus } = useSprints()
  const { showToast } = useToastContext()
  const [showSprintSelector, setShowSprintSelector] = useState(false)
  const [loadingBatch, setLoadingBatch] = useState(false)
  const [isUpdatingSprintStatus, setIsUpdatingSprintStatus] = useState(false)

  const handleCheck = (taskId: string, checked: boolean) => {
    setSelectedTaskIds((prev) => (checked ? [...prev, taskId] : prev.filter((id) => id !== taskId)))
  }

  // Sprint control functions
  const handleStartSprint = async () => {
    if (!currentSprint) return

    setIsUpdatingSprintStatus(true)
    try {
      const success = await updateSprintStatus(currentSprint.id, '10000') // In Progress
      if (success) {
        showToast({
          title: 'Success',
          description: `Sprint "${currentSprint.name}" has been started!`,
          variant: 'success'
        })
        await refreshSprints()
        onTaskUpdate()
      } else {
        showToast({
          title: 'Error',
          description: 'Failed to start sprint. Please try again.',
          variant: 'destructive'
        })
      }
    } catch (error: any) {
      showToast({
        title: 'Error',
        description: error.message || 'Failed to start sprint. Please try again.',
        variant: 'destructive'
      })
    } finally {
      setIsUpdatingSprintStatus(false)
    }
  }

  const handleEndSprint = async () => {
    if (!currentSprint) return

    setIsUpdatingSprintStatus(true)
    try {
      const success = await updateSprintStatus(currentSprint.id, '20000') // Completed
      if (success) {
        showToast({
          title: 'Success',
          description: `Sprint "${currentSprint.name}" has been completed!`,
          variant: 'success'
        })
        await refreshSprints()
        onTaskUpdate()
      } else {
        showToast({
          title: 'Error',
          description: 'Failed to end sprint. Please try again.',
          variant: 'destructive'
        })
      }
    } catch (error: any) {
      showToast({
        title: 'Error',
        description: error.message || 'Failed to end sprint. Please try again.',
        variant: 'destructive'
      })
    } finally {
      setIsUpdatingSprintStatus(false)
      setIsEndDialogOpen(false)
    }
  }

  // Check if sprint can be started/ended
  const canStartSprint = currentSprint && (currentSprint.status === '0' || currentSprint.status === 0)
  const canEndSprint = currentSprint && (currentSprint.status === '10000' || currentSprint.status === 10000)

  return (
    <div className='bg-white/95 border border-gray-200 border-l-4 border-l-lavender-300/80 rounded-lg shadow-sm transition-all duration-200 hover:shadow-md hover:border-lavender-400/90 relative'>
      {/* subtle backdrop tint */}
      <div className='absolute inset-0 pointer-events-none opacity-[0.35] bg-[radial-gradient(circle_at_20%_15%,rgba(139,92,246,0.08),transparent_60%),radial-gradient(circle_at_85%_40%,rgba(139,92,246,0.05),transparent_55%)]' />
      <div className='relative p-4 flex items-center justify-between border-b border-gray-200 rounded-t-lg bg-gradient-to-r from-white via-white to-lavender-50/70 backdrop-blur-[1px]'>
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
              <h3 className='font-semibold text-lg text-gray-900 tracking-wide'>Backlog</h3>
              {sprint && (
                <span className='ml-2 text-xs rounded px-2 py-1 bg-lavender-100 text-lavender-700 border border-lavender-200'>
                  {SprintStatusMap[sprint.status] || sprint.status}
                </span>
              )}
              <span className='text-gray-600 text-sm bg-gray-100 rounded-full px-2 py-0.5 border border-gray-200'>
                {tasks.length} {tasks.length === 1 ? 'task' : 'tasks'}
              </span>
            </div>
            <div className='text-xs font-medium uppercase tracking-wider text-lavender-600/80 mt-0.5'>
              Unplanned Work
            </div>
            <div className='text-sm text-gray-500'>Tasks not assigned to any sprint</div>
          </div>
        </div>
        <div className='flex items-center gap-2'>
          {/* Sprint Control Buttons */}
          {currentSprint && !isMember && (
            <div className='flex items-center gap-3 mr-4'>
              {canStartSprint && (
                <button
                  onClick={handleStartSprint}
                  disabled={isUpdatingSprintStatus}
                  className='relative group flex items-center justify-center w-12 h-12 rounded-full border-2 border-green-400 bg-gradient-to-br from-green-50 to-green-100 hover:from-green-100 hover:to-green-200 transition-all duration-300 hover:scale-105 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100'
                  title='Start Sprint'
                >
                  <div className='absolute inset-0 rounded-full bg-gradient-to-br from-green-400/20 to-green-600/20 group-hover:from-green-400/30 group-hover:to-green-600/30 transition-all duration-300' />
                  <Play className='h-5 w-5 text-green-600 relative z-10 ml-0.5' />
                  <div className='absolute inset-0 rounded-full border border-green-200 group-hover:border-green-300 transition-colors duration-300' />
                </button>
              )}
              {canEndSprint && (
                <AlertDialog open={isEndDialogOpen} onOpenChange={setIsEndDialogOpen}>
                  <AlertDialogTrigger asChild>
                    <button
                      disabled={isUpdatingSprintStatus}
                      className='relative group flex items-center justify-center w-12 h-12 rounded-full border-2 border-red-400 bg-gradient-to-br from-red-50 to-red-100 hover:from-red-100 hover:to-red-200 transition-all duration-300 hover:scale-105 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100'
                      title='End Sprint'
                    >
                      <div className='absolute inset-0 rounded-full bg-gradient-to-br from-red-400/20 to-red-600/20 group-hover:from-red-400/30 group-hover:to-red-600/30 transition-all duration-300' />
                      <Square className='h-4 w-4 text-red-600 relative z-10' />
                      <div className='absolute inset-0 rounded-full border border-red-200 group-hover:border-red-300 transition-colors duration-300' />
                    </button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>End Sprint</AlertDialogTitle>
                      <AlertDialogDescription>
                        Are you sure you want to end sprint "{currentSprint?.name}"? This action cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={handleEndSprint} disabled={isUpdatingSprintStatus}>
                        {isUpdatingSprintStatus ? 'Ending Sprint...' : 'End Sprint'}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}
              {isUpdatingSprintStatus && (
                <div className='flex items-center gap-2 text-sm text-lavender-600'>
                  <div className='w-4 h-4 border-2 border-lavender-600 border-t-transparent rounded-full animate-spin' />
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
        <div className='overflow-x-auto transition-all duration-200 bg-white/95 rounded-b-lg'>
          {/* Column header for consistency with rows */}
          <div className='px-4 pt-4'>
            <div className='grid grid-cols-[24px,1fr,140px,84px,60px,60px,100px,auto] items-center gap-1 text-[11px] font-medium text-gray-600 bg-lavender-50/60 px-2 py-2 border-y border-lavender-100/70 shadow-[inset_0_0_0_1px_rgba(139,92,246,0.05)]'>
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
                          variant: r.code === 200 ? 'success' : 'destructive'
                        })
                      } else if (res && typeof res === 'object' && 'data' in res && res.data === true) {
                        showToast({
                          title: 'Success',
                          description: 'Tasks moved to sprint successfully!',
                          variant: 'success'
                        })
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
              {tasks.map((task) => (
                <BacklogTaskRow
                  key={task.id}
                  task={task}
                  showMeta={true}
                  checked={selectedTaskIds.includes(task.id)}
                  onCheck={handleCheck}
                  onTaskUpdate={onTaskUpdate}
                  boards={boards}
                  refreshBoards={refreshBoards}
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
