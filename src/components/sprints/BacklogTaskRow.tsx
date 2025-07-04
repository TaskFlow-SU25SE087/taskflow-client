import { taskApi } from '@/api/tasks'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { useToast } from '@/hooks/use-toast'
import { useBoards } from '@/hooks/useBoards'
import { useCurrentProject } from '@/hooks/useCurrentProject'
import { TaskP } from '@/types/task'
import Avatar from 'boring-avatars'
import { AlertCircle, Calendar, FileText, MessageSquare } from 'lucide-react'
import React, { useState } from 'react'
import { TaskDetailMenu } from '../tasks/TaskDetailMenu'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '../ui/dropdown-menu'

interface BacklogTaskRowProps {
  task: TaskP
  showMeta?: boolean
  checked?: boolean
  onCheck?: (taskId: string, checked: boolean) => void
  onTaskUpdate?: () => void
}

const statusColorMap: Record<string, string> = {
  'to do': 'bg-gray-200 text-gray-700',
  'in progress': 'bg-blue-100 text-blue-700',
  'done': 'bg-green-100 text-green-700',
  'review': 'bg-yellow-100 text-yellow-700',
  'blocked': 'bg-red-100 text-red-700',
}

const getBoardColorClass = (board: any) => {
  if (board?.color) {
    return `bg-[${board.color}] text-white`;
  }
  return statusColorMap[board?.name?.toLowerCase?.()] || 'bg-gray-100 text-gray-600';
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

export const BacklogTaskRow: React.FC<BacklogTaskRowProps> = ({ task, showMeta, checked = false, onCheck, onTaskUpdate }) => {
  const [isDetailOpen, setIsDetailOpen] = useState(false)
  const [statusLoading, setStatusLoading] = useState(false)
  const { boards, refreshBoards } = useBoards()
  const { currentProject } = useCurrentProject()
  const { toast } = useToast()
  
  // Map assignee từ taskAssignees (lấy người đầu tiên nếu có)
  const assignee = Array.isArray(task.taskAssignees) && task.taskAssignees.length > 0
    ? { fullName: task.taskAssignees[0].executor, avatar: task.taskAssignees[0].avatar }
    : null;

  // Comment count
  const commentCount = Array.isArray(task.commnets) ? task.commnets.length : 0;

  // File count: attachmentUrl + completionAttachmentUrls + file trong comment
  const fileCount =
    (task.attachmentUrl ? 1 : 0) +
    (Array.isArray(task.completionAttachmentUrls) ? task.completionAttachmentUrls.length : 0) +
    (Array.isArray(task.commnets)
      ? task.commnets.reduce((acc, c) => acc + (Array.isArray(c.attachmentUrls) ? c.attachmentUrls.length : 0), 0)
      : 0);

  // Deadline: deadline -> updatedAt -> createdAt -> N/A
  const deadline = task.deadline
    ? new Date(task.deadline).toLocaleDateString('en-GB')
    : task.updatedAt
    ? new Date(task.updatedAt).toLocaleDateString('en-GB')
    : task.createdAt
    ? new Date(task.createdAt).toLocaleDateString('en-GB')
    : 'N/A';
  const deadlineColor = getDeadlineColor(task.deadline || task.updatedAt || task.createdAt);
  const DeadlineIcon = getDeadlineIcon(task.deadline || task.updatedAt || task.createdAt);

  return (
    <TooltipProvider>
      <>
        <div
          className="flex items-center border border-gray-200 rounded px-2 py-1 text-xs bg-white min-h-[36px] mb-2 cursor-pointer hover:bg-gray-50"
          onClick={(e) => {
            if ((e.target as HTMLElement).closest('button')) return
            setIsDetailOpen(true)
          }}
        >
          {/* Checkbox */}
          <div className="flex-shrink-0 w-6 flex justify-center">
            {onCheck && (
              <input
                type="checkbox"
                checked={checked}
                onChange={e => onCheck(task.id, e.target.checked)}
                onClick={e => e.stopPropagation()}
                className="form-checkbox h-4 w-4 text-lavender-600"
              />
            )}
          </div>
          
          {/* Tags */}
          <div className="flex-shrink-0 min-w-[60px] max-w-[80px]">
            {task.tags && task.tags.length > 0 && (
              <div className="flex gap-1">
                {task.tags.map((tag: { id: string; name: string }, index: number) => (
                  <Tooltip key={tag.id || index}>
                    <TooltipTrigger>
                      <span
                        className="rounded px-1 py-0.5 bg-orange-100 text-orange-600 truncate block"
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
              <div className="flex-shrink-0 min-w-[100px] max-w-[140px] font-semibold truncate">
                {task.title}
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <p>{task.title}</p>
            </TooltipContent>
          </Tooltip>
          
          {/* Status (dropdown) */}
          <div className="flex-shrink-0 min-w-[90px] max-w-[110px]">
            {task.status && boards.length > 0 ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    className={`px-2 py-0.5 rounded text-xs font-medium w-full text-left ${getBoardColorClass(boards.find(b => b.id === task.boardId) || { name: task.status })} ${statusLoading ? 'opacity-60' : ''}`}
                    disabled={statusLoading}
                  >
                    {task.status}
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start">
                  {boards.map((board) => (
                    <DropdownMenuItem
                      key={board.id}
                      className={getBoardColorClass(board)}
                      onClick={async () => {
                        if (!currentProject?.id || board.id === task.boardId) return
                        setStatusLoading(true)
                        try {
                          await taskApi.moveTaskToBoard(currentProject.id, task.id, board.id)
                          toast({ title: 'Success', description: `Status changed to ${board.name}` })
                          await refreshBoards()
                          window.location.reload()
                        } catch (err) {
                          toast({ title: 'Error', description: 'Failed to change status', variant: 'destructive' })
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
                <span className={`px-2 py-0.5 rounded text-xs font-medium ${statusColorMap[task.status.toLowerCase()] || 'bg-gray-100 text-gray-600'}`}>
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
                  <div className="flex-shrink-0 w-8 flex justify-center">
                    {assignee?.avatar ? (
                      <img 
                        src={assignee.avatar} 
                        alt="avatar" 
                        className="w-5 h-5 rounded-full object-cover border border-gray-200" 
                      />
                    ) : (
                      <Avatar 
                        size={20} 
                        name={assignee?.fullName || assignee?.email || 'No assignee'} 
                        variant="beam"
                        colors={['#92A1C6', '#146A7C', '#F0AB3D', '#C271B4', '#C20D90']}
                      />
                    )}
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{assignee?.fullName || assignee?.email || 'No assignee'}</p>
                </TooltipContent>
              </Tooltip>
              
              {/* Comments */}
              <Tooltip>
                <TooltipTrigger>
                  <div className="flex-shrink-0 w-10 flex items-center justify-center text-gray-400">
                    <MessageSquare className="w-4 h-4 mr-1" /> {commentCount}
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{commentCount} comment{commentCount !== 1 ? 's' : ''}</p>
                </TooltipContent>
              </Tooltip>
              
              {/* Files */}
              <Tooltip>
                <TooltipTrigger>
                  <div className="flex-shrink-0 w-10 flex items-center justify-center text-gray-400">
                    <FileText className="w-4 h-4 mr-1" /> {fileCount}
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{fileCount} file{fileCount !== 1 ? 's' : ''} attached</p>
                </TooltipContent>
              </Tooltip>
              
              {/* Due date */}
              <Tooltip>
                <TooltipTrigger>
                  <div className={`flex-shrink-0 w-16 flex items-center justify-center ${deadlineColor}`}>
                    <DeadlineIcon className="w-4 h-4 mr-1" /> {deadline}
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
                className="ml-2 px-2 py-1 text-xs text-red-600 border border-red-200 rounded hover:bg-red-50 transition-colors"
                onClick={async (e) => {
                  e.stopPropagation();
                  if (!currentProject?.id) return;
                  if (!window.confirm('Are you sure you want to delete this task?')) return;
                  try {
                    await taskApi.deleteTask(currentProject.id, task.id);
                    toast({ title: 'Success', description: 'Task deleted!' });
                    if (typeof refreshBoards === 'function') await refreshBoards();
                    if (typeof onTaskUpdate === 'function') onTaskUpdate();
                  } catch {
                    toast({ title: 'Error', description: 'Failed to delete task', variant: 'destructive' });
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