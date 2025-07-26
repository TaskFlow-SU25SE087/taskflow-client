import { taskApi } from '@/api/tasks'
import { useToastContext } from '@/components/ui/ToastContext'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { useBoards } from '@/hooks/useBoards'
import { useCurrentProject } from '@/hooks/useCurrentProject'
import { TaskP } from '@/types/task'
import { AlertCircle, Calendar, FileText, MessageSquare } from 'lucide-react'
import React, { useState } from 'react'
import { TaskDetailMenu } from '../tasks/TaskDetailMenu'
import { AvatarFallback, AvatarImage, Avatar as UIAvatar } from '../ui/avatar'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '../ui/dropdown-menu'

interface BacklogTaskRowProps {
  task: TaskP
  showMeta?: boolean
  checked?: boolean
  onCheck?: (taskId: string, checked: boolean) => void
  onTaskUpdate?: () => void
}

type TaskStatus =
  | 'to do'
  | 'not started'
  | 'in progress'
  | 'done'
  | 'completed'
  | 'review'
  | 'blocked'
  | 'cancelled'
  | 'on hold'
  | 'unassigned'
  | 'urgent'
  | 'testing'
  | 'pending'
  | 'n/a'

const statusColorMap: Record<TaskStatus, string> = {
  'to do': 'bg-gray-200 text-gray-700',
  'not started': 'bg-gray-200 text-gray-700',
  'in progress': 'bg-blue-100 text-blue-700',
  done: 'bg-green-100 text-green-700',
  completed: 'bg-green-100 text-green-700',
  review: 'bg-yellow-100 text-yellow-700',
  blocked: 'bg-red-100 text-red-700',
  cancelled: 'bg-pink-100 text-pink-700',
  'on hold': 'bg-amber-100 text-amber-700',
  unassigned: 'bg-slate-100 text-slate-500',
  urgent: 'bg-red-200 text-red-800',
  testing: 'bg-purple-100 text-purple-700',
  pending: 'bg-orange-100 text-orange-700',
  'n/a': 'bg-gray-100 text-gray-500'
}

interface Board {
  color?: string
  name?: string
}

const getBoardColorClass = (board?: Board) => {
  if (board?.color) {
    return `bg-[${board.color}] text-white`
  }
  const boardName = board?.name?.toLowerCase() || ''
  return statusColorMap[boardName as TaskStatus] || 'bg-gray-100 text-gray-600'
}

// Helper function to get deadline color based on urgency
const getDeadlineColor = (deadline: string | null) => {
  if (!deadline) return 'text-gray-400'

  const now = new Date()
  const deadlineDate = new Date(deadline)
  const diffTime = deadlineDate.getTime() - now.getTime()
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

  if (diffDays < 0) return 'text-red-500' // Overdue
  if (diffDays <= 1) return 'text-orange-500' // Due today/tomorrow
  if (diffDays <= 3) return 'text-yellow-600' // Due soon
  return 'text-gray-400' // Due later
}

// Helper function to get deadline icon
const getDeadlineIcon = (deadline: string | null) => {
  if (!deadline) return Calendar

  const now = new Date()
  const deadlineDate = new Date(deadline)
  const diffTime = deadlineDate.getTime() - now.getTime()
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

  if (diffDays < 0) return AlertCircle // Overdue
  return Calendar
}

// --- AvatarStack nội bộ cho backlog ---
const avatarColors = [
  { bg: 'linear-gradient(135deg, #FF6B6B 0%, #FF8E8E 100%)', text: '#FFFFFF' },
  { bg: 'linear-gradient(135deg, #4ECDC4 0%, #45B7AF 100%)', text: '#FFFFFF' },
  { bg: 'linear-gradient(135deg, #FFD93D 0%, #FFE566 100%)', text: '#000000' },
  { bg: 'linear-gradient(135deg, #6C5CE7 0%, #8480E9 100%)', text: '#FFFFFF' },
  { bg: 'linear-gradient(135deg, #A8E6CF 0%, #DCEDC1 100%)', text: '#000000' },
  { bg: 'linear-gradient(135deg, #FF8B94 0%, #FFC2C7 100%)', text: '#000000' },
  { bg: 'linear-gradient(135deg, #98ACFF 0%, #6C63FF 100%)', text: '#FFFFFF' },
  { bg: 'linear-gradient(135deg, #FFA62B 0%, #FFB85C 100%)', text: '#000000' }
]
const getAvatarColor = (index: number) => avatarColors[index % avatarColors.length]

interface Assignee {
  projectMemberId?: string
  avatar?: string
  executor?: string
}

function AvatarStack({ assignees }: { assignees: Assignee[] }) {
  if (!assignees || assignees.length === 0) {
    return (
      <div className='flex items-center justify-center min-w-[70px] h-7'>
        <span className='text-xs text-gray-500 whitespace-nowrap text-center w-full'>Unassigned</span>
      </div>
    )
  }
  return (
    <div className='flex items-center justify-center min-w-[70px] h-7'>
      <div className='flex items-center justify-center -space-x-2'>
        {assignees.slice(0, 4).map((assignee, idx) => {
          const { bg, text } = getAvatarColor(idx)
          return (
            <UIAvatar key={assignee.projectMemberId || idx} className='h-4 w-4 border border-white shadow'>
              {assignee.avatar ? (
                <AvatarImage src={assignee.avatar} alt={assignee.executor} />
              ) : (
                <AvatarFallback style={{ background: bg, color: text, fontSize: '10px' }}>
                  {assignee.executor?.[0]?.toUpperCase() || '?'}
                </AvatarFallback>
              )}
            </UIAvatar>
          )
        })}
        {assignees.length > 4 && (
          <UIAvatar className='h-4 w-4 border border-white shadow'>
            <AvatarFallback style={{ background: '#F3F4F6', color: '#6B7280', fontSize: '10px' }}>
              +{assignees.length - 4}
            </AvatarFallback>
          </UIAvatar>
        )}
      </div>
    </div>
  )
}

export const BacklogTaskRow: React.FC<BacklogTaskRowProps> = ({
  task,
  showMeta,
  checked = false,
  onCheck,
  onTaskUpdate
}) => {
  const [isDetailOpen, setIsDetailOpen] = useState(false)
  const [statusLoading, setStatusLoading] = useState(false)
  const { boards, refreshBoards } = useBoards()
  const { currentProject } = useCurrentProject()
  const { showToast } = useToastContext()

  // Comment count
  const commentCount = Array.isArray(task.commnets) ? task.commnets.length : 0

  // File count: attachmentUrl + completionAttachmentUrls + file trong comment
  const fileCount =
    (task.attachmentUrl ? 1 : 0) +
    (Array.isArray(task.completionAttachmentUrls) ? task.completionAttachmentUrls.length : 0) +
    (Array.isArray(task.commnets)
      ? task.commnets.reduce((acc, c) => acc + (Array.isArray(c.attachmentUrls) ? c.attachmentUrls.length : 0), 0)
      : 0)

  // Deadline: deadline -> updatedAt -> createdAt -> N/A
  const rawDeadline: string | null = task.deadline ?? task.updatedAt ?? task.createdAt ?? null
  const deadline = rawDeadline ? new Date(rawDeadline).toLocaleDateString('en-GB') : 'N/A'
  const deadlineColor = getDeadlineColor(rawDeadline)
  const DeadlineIcon = getDeadlineIcon(rawDeadline)

  return (
    <TooltipProvider>
      <>
        <div
          className='flex items-center border border-gray-200 rounded px-2 py-1 text-xs bg-white min-h-[36px] mb-2 cursor-pointer hover:bg-gray-50'
          onClick={(e) => {
            if ((e.target as HTMLElement).closest('button')) return
            setIsDetailOpen(true)
          }}
        >
          {/* Checkbox */}
          <div className='flex-shrink-0 w-6 flex justify-center'>
            {onCheck && (
              <input
                type='checkbox'
                checked={checked}
                onChange={(e) => onCheck(task.id, e.target.checked)}
                onClick={(e) => e.stopPropagation()}
                className='form-checkbox h-4 w-4 text-lavender-600'
              />
            )}
          </div>

          {/* Tags */}
          <div className='flex-shrink-0 min-w-[60px] max-w-[80px]'>
            {task.tags && task.tags.length > 0 && (
              <div className='flex gap-1'>
                {task.tags.map((tag: { id: string; name: string; color?: string }, index: number) => (
                  <Tooltip key={tag.id || index}>
                    <TooltipTrigger>
                      <span
                        style={{
                          backgroundColor: tag.color || '#eee',
                          color: '#fff',
                          borderRadius: '8px',
                          padding: '2px 8px',
                          fontWeight: 500,
                          fontSize: '0.95em',
                          display: 'inline-block'
                        }}
                        title={tag.name}
                      >
                        {tag.name}
                      </span>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>{tag.name}</p>
                    </TooltipContent>
                  </Tooltip>
                ))}
              </div>
            )}
          </div>

          {/* Title */}
          <Tooltip>
            <TooltipTrigger>
              <div className='flex-shrink-0 min-w-[100px] max-w-[140px] font-semibold truncate'>{task.title}</div>
            </TooltipTrigger>
            <TooltipContent>
              <p>{task.title}</p>
            </TooltipContent>
          </Tooltip>

          {/* Status (dropdown) */}
          <div className='flex-shrink-0 min-w-[90px] max-w-[110px]'>
            {task.status && boards.length > 0 ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    className={`px-2 py-0.5 rounded text-xs font-medium w-full text-left ${getBoardColorClass(boards.find((b) => b.id === task.boardId) || { name: task.status })} ${statusLoading ? 'opacity-60' : ''}`}
                    disabled={statusLoading}
                  >
                    {task.status}
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align='start'>
                  {boards.map((board) => (
                    <DropdownMenuItem
                      key={board.id}
                      className={getBoardColorClass(board)}
                      onClick={async () => {
                        if (!currentProject?.id || board.id === task.boardId) return
                        setStatusLoading(true)
                        try {
                          await taskApi.moveTaskToBoard(currentProject.id, task.id, board.id)
                          showToast({ title: 'Success', description: `Status changed to ${board.name}` })
                          await refreshBoards()
                          window.location.reload()
                        } catch {
                          showToast({ title: 'Error', description: 'Failed to change status', variant: 'destructive' })
                        } finally {
                          setStatusLoading(false)
                        }
                      }}
                    >
                      {board.name}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              task.status && (
                <span
                  className={`px-2 py-0.5 rounded text-xs font-medium ${statusColorMap[task.status.toLowerCase() as TaskStatus] || 'bg-gray-100 text-gray-600'}`}
                >
                  {task.status}
                </span>
              )
            )}
          </div>

          {/* Meta info for sprint board */}
          {showMeta && (
            <>
              {/* Assignee */}
              <Tooltip>
                <TooltipTrigger>
                  <div className='flex-shrink-0 min-w-[70px] flex items-center justify-center h-7 ml-3'>
                    <AvatarStack assignees={Array.isArray(task.taskAssignees) ? task.taskAssignees : []} />
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p>
                    {Array.isArray(task.taskAssignees) && task.taskAssignees.length > 0
                      ? task.taskAssignees.map((a) => a.executor).join(', ')
                      : 'Unassigned'}
                  </p>
                </TooltipContent>
              </Tooltip>

              {/* Comments */}
              <Tooltip>
                <TooltipTrigger>
                  <div className='flex-shrink-0 w-10 flex items-center justify-center text-gray-400'>
                    <MessageSquare className='w-4 h-4 mr-1' /> {commentCount}
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p>
                    {commentCount} comment{commentCount !== 1 ? 's' : ''}
                  </p>
                </TooltipContent>
              </Tooltip>

              {/* Files */}
              <Tooltip>
                <TooltipTrigger>
                  <div className='flex-shrink-0 w-10 flex items-center justify-center text-gray-400'>
                    <FileText className='w-4 h-4 mr-1' /> {fileCount}
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p>
                    {fileCount} file{fileCount !== 1 ? 's' : ''} attached
                  </p>
                </TooltipContent>
              </Tooltip>

              {/* Due date */}
              <Tooltip>
                <TooltipTrigger>
                  <div className={`flex-shrink-0 w-16 flex items-center justify-center ${deadlineColor}`}>
                    <DeadlineIcon className='w-4 h-4 mr-1' /> {deadline}
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Deadline: {deadline}</p>
                </TooltipContent>
              </Tooltip>
            </>
          )}

          {/* Nút xóa task */}
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                className='ml-2 px-2 py-1 text-xs text-red-600 border border-red-200 rounded hover:bg-red-50 transition-colors'
                onClick={async (e) => {
                  e.stopPropagation()
                  if (!currentProject?.id) return
                  if (!window.confirm('Are you sure you want to delete this task?')) return
                  try {
                    const res = await taskApi.deleteTask(currentProject.id, task.id)
                    if (res && typeof res === 'object' && 'code' in res && 'message' in res) {
                      const r = res as { code: number; message: string }
                      showToast({
                        title: r.code === 200 ? 'Success' : 'Error',
                        description: r.message || 'Task deleted!',
                        variant: r.code === 200 ? 'default' : 'destructive'
                      })
                    } else if (res && typeof res === 'object' && 'data' in res && res.data === true) {
                      showToast({ title: 'Success', description: 'Task deleted!' })
                    } else {
                      showToast({ title: 'Error', description: 'Failed to delete task', variant: 'destructive' })
                    }
                    if (typeof refreshBoards === 'function') await refreshBoards()
                    if (typeof onTaskUpdate === 'function') onTaskUpdate()
                  } catch (error) {
                    showToast({
                      title: 'Error',
                      description: error instanceof Error ? error.message : 'Failed to delete task',
                      variant: 'destructive'
                    })
                  }
                }}
              >
                Delete
              </button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Delete this task</p>
            </TooltipContent>
          </Tooltip>
        </div>
        <TaskDetailMenu
          task={task}
          isOpen={isDetailOpen}
          onClose={() => setIsDetailOpen(false)}
          onTaskUpdated={() => {}}
        />
      </>
    </TooltipProvider>
  )
}
