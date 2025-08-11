import { taskApi } from '@/api/tasks'
import { useToastContext } from '@/components/ui/ToastContext'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { useCurrentProject } from '@/hooks/useCurrentProject'
import { TaskP } from '@/types/task'
import { Board } from '@/types/board'
import {
  AlertCircle,
  Calendar,
  FileText,
  MessageSquare,
  Circle,
  PlayCircle,
  CheckCircle,
  ChevronDown
} from 'lucide-react'
import React, { useState } from 'react'
import { TaskDetailMenu } from '../tasks/TaskDetailMenu'
import { AvatarFallback, AvatarImage, Avatar as UIAvatar } from '../ui/avatar'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '../ui/dropdown-menu'
import { Checkbox } from '../ui/checkbox'

interface BacklogTaskRowProps {
  task: TaskP
  showMeta?: boolean
  checked?: boolean
  onCheck?: (taskId: string, checked: boolean) => void
  onTaskUpdate?: () => void
  boards: Board[]
  refreshBoards: () => Promise<void> | (() => Promise<any>) | any
}

// Note: statusColorMap removed in favor of unified getBoardColor-based theming

// (Board type imported from '@/types/board')

// Unified color palette for boards/statuses (consistent across pages)
const boardColors: Record<string, string> = {
  todo: '#5030E5',
  'to do': '#5030E5',
  ongoing: '#FFA500',
  'in progress': '#FFA500',
  done: '#22C55E',
  completed: '#22C55E',
  backlog: '#E84393',
  review: '#00B894',
  blocked: '#FF4757',
  testing: '#9B59B6',
  deployed: '#27AE60',
  'not started': '#9CA3AF'
}

const getBoardColor = (statusOrBoard?: string | Board): string => {
  if (!statusOrBoard) return '#5030E5'
  if (typeof statusOrBoard === 'string') {
    return boardColors[statusOrBoard.toLowerCase()] || '#5030E5'
  }
  const key = (statusOrBoard.name || '').toLowerCase()
  return boardColors[key] || '#5030E5'
}

const getStatusIcon = (status: string) => {
  const s = status.toLowerCase()
  const iconClass = 'h-4 w-4 stroke-[2.5px]'
  const color = getBoardColor(status)
  const style = { color }
  if (s === 'ongoing' || s === 'in progress') return <PlayCircle className={iconClass} style={style} />
  if (s === 'done' || s === 'completed') return <CheckCircle className={iconClass} style={style} />
  return <Circle className={iconClass} style={style} />
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
      <div className='flex items-center justify-center min-w-[84px] h-7'>
        <span className='text-xs text-gray-500 whitespace-nowrap text-center w-full'>Unassigned</span>
      </div>
    )
  }
  return (
    <div className='flex items-center justify-center min-w-[84px] h-7'>
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
  showMeta = true,
  checked = false,
  onCheck,
  onTaskUpdate,
  boards,
  refreshBoards
}) => {
  const [isDetailOpen, setIsDetailOpen] = useState(false)
  const [statusLoading, setStatusLoading] = useState(false)
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

  const TagPill: React.FC<{ name: string; color?: string }> = ({ name, color }) => (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium ${
        color ? 'text-white' : 'bg-gray-100 text-gray-700'
      }`}
      style={color ? { backgroundColor: color } : undefined}
      title={name}
    >
      {name}
    </span>
  )

  const hasTags = Array.isArray(task.tags) && task.tags.length > 0

  return (
    <TooltipProvider>
      <>
        <div
          className='grid grid-cols-[24px,1fr,140px,84px,60px,60px,100px,auto] items-center gap-1 px-2 h-11 text-xs bg-white cursor-pointer hover:bg-gray-50 border-b border-gray-100'
          onClick={(e) => {
            if ((e.target as HTMLElement).closest('button')) return
            setIsDetailOpen(true)
          }}
        >
          {/* Checkbox */}
          <div className='w-6 flex justify-center'>
            {onCheck && (
              <Checkbox
                checked={checked}
                onCheckedChange={(v) => onCheck(task.id, Boolean(v))}
                onClick={(e) => e.stopPropagation()}
                className='h-4 w-4 border-gray-300 data-[state=checked]:bg-lavender-600 data-[state=checked]:border-lavender-600'
              />
            )}
          </div>

          {/* Title + Tags (inline) */}
          <div className='min-w-0'>
            <div className='flex items-center gap-2'>
              <Tooltip>
                <TooltipTrigger>
                  <div className='font-medium text-gray-900 truncate pl-1'>{task.title}</div>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{task.title}</p>
                </TooltipContent>
              </Tooltip>
              {hasTags && (
                <div className='flex gap-1'>
                  {task.tags!.slice(0, 1).map((tag: { id: string; name: string; color?: string }, index: number) => (
                    <Tooltip key={tag.id || index}>
                      <TooltipTrigger>
                        <TagPill name={tag.name} color={tag.color} />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>{tag.name}</p>
                      </TooltipContent>
                    </Tooltip>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Status (dropdown) */}
          <div className='min-w-[140px] max-w-[140px]'>
            {task.status && boards && boards.length > 0 ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    className={`w-full inline-flex items-center justify-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium transition-colors border border-transparent ${
                      statusLoading ? 'opacity-60' : ''
                    }`}
                    style={{
                      backgroundColor: `${getBoardColor(
                        (boards.find((b: Board) => b.id === (task as any).boardId) as Board) || task.status
                      )}20`
                    }}
                    disabled={statusLoading}
                  >
                    {getStatusIcon(task.status)}
                    <span className='capitalize' style={{ color: getBoardColor(task.status) }}>
                      {task.status}
                    </span>
                    <ChevronDown className='h-3 w-3 opacity-60' style={{ color: getBoardColor(task.status) }} />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align='start' className='w-[200px] p-1.5 border-none shadow-lg'>
                  {boards.map((board: Board, idx: number) => (
                    <DropdownMenuItem
                      key={board.id || idx}
                      className='gap-2 rounded-md px-2.5 py-2 cursor-pointer transition-colors focus:ring-0 focus:ring-offset-0'
                      style={{
                        backgroundColor:
                          (board.id && board.id === task.boardId) ||
                          board.name?.toLowerCase() === task.status?.toLowerCase()
                            ? `${getBoardColor(board)}20`
                            : 'transparent'
                      }}
                      onClick={async () => {
                        if (!currentProject?.id || board.id === task.boardId) return
                        setStatusLoading(true)
                        try {
                          await taskApi.moveTaskToBoard(currentProject.id, task.id, board.id as string)
                          showToast({ title: 'Success', description: `Status changed to ${board.name}` })
                          await refreshBoards()
                          if (typeof onTaskUpdate === 'function') onTaskUpdate()
                        } catch {
                          showToast({ title: 'Error', description: 'Failed to change status', variant: 'destructive' })
                        } finally {
                          setStatusLoading(false)
                        }
                      }}
                    >
                      {getStatusIcon(board.name || '')}
                      <span className='capitalize font-medium' style={{ color: getBoardColor(board) }}>
                        {board.name}
                      </span>
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              task.status && (
                <span
                  className={`inline-flex items-center justify-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium`}
                  style={{ backgroundColor: `${getBoardColor(task.status)}20`, color: getBoardColor(task.status) }}
                >
                  {getStatusIcon(task.status)}
                  <span className='capitalize'>{task.status}</span>
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
                  <div className='flex items-center justify-center h-7'>
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
                  <div className='w-10 flex items-center justify-center text-gray-400'>
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
                  <div className='w-10 flex items-center justify-center text-gray-400'>
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
                  <div className={`w-24 flex items-center justify-center ${deadlineColor}`}>
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
