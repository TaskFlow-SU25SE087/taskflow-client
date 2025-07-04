import { TaskP } from '@/types/task'
import Avatar from 'boring-avatars'
import { Calendar, FileText, MessageSquare } from 'lucide-react'
import React, { useState } from 'react'
import { TaskDetailMenu } from '../tasks/TaskDetailMenu'

interface BacklogTaskRowProps {
  task: TaskP
  onMoveToSprint?: (taskId: string) => void
  showMeta?: boolean
  checked?: boolean
  onCheck?: (taskId: string, checked: boolean) => void
}

const statusColorMap: Record<string, string> = {
  'to do': 'bg-gray-200 text-gray-700',
  'in progress': 'bg-blue-100 text-blue-700',
  'done': 'bg-green-100 text-green-700',
  'review': 'bg-yellow-100 text-yellow-700',
  'blocked': 'bg-red-100 text-red-700',
}

export const BacklogTaskRow: React.FC<BacklogTaskRowProps> = ({ task, onMoveToSprint, showMeta, checked = false, onCheck }) => {
  const [isDetailOpen, setIsDetailOpen] = useState(false)
  // Fake meta for demo, you can replace with real data if available
  const assignee = task.assignee || null
  const commentCount = task.comments ? task.comments.length : 0
  const fileCount = task.files ? task.files.length : 0
  const dueDate = task.dueDate || null

  return (
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
                <span
                  key={tag.id || index}
                  className="rounded px-1 py-0.5 bg-orange-100 text-orange-600"
                >
                  {tag.name}
                </span>
              ))}
            </div>
          )}
        </div>
        {/* Title */}
        <div className="flex-shrink-0 min-w-[100px] max-w-[140px] font-semibold truncate">
          {task.title}
        </div>
        {/* Status */}
        <div className="flex-shrink-0 min-w-[90px] max-w-[110px]">
          {task.status && (
            <span className={`px-2 py-0.5 rounded text-xs font-medium ${statusColorMap[task.status.toLowerCase()] || 'bg-gray-100 text-gray-600'}`}>
              {task.status}
            </span>
          )}
        </div>
        {/* Description */}
        <div className="flex-shrink-0 min-w-[120px] max-w-[180px] text-gray-500 truncate">
          {task.description}
        </div>
        {/* Meta info for sprint board */}
        {showMeta && (
          <>
            {/* Assignee */}
            <div className="flex-shrink-0 w-8 flex justify-center" title={assignee?.fullName || assignee?.email || 'No assignee'}>
              {assignee?.avatar ? (
                <img src={assignee.avatar} alt="avatar" className="w-5 h-5 rounded-full object-cover" />
              ) : (
                <Avatar size={20} name={assignee?.fullName || assignee?.email || 'No assignee'} variant="beam" />
              )}
            </div>
            {/* Comments */}
            <div className="flex-shrink-0 w-10 flex items-center justify-center text-gray-400" title="Comments">
              <MessageSquare className="w-4 h-4 mr-1" /> {commentCount}
            </div>
            {/* Files */}
            <div className="flex-shrink-0 w-10 flex items-center justify-center text-gray-400" title="Files">
              <FileText className="w-4 h-4 mr-1" /> {fileCount}
            </div>
            {/* Due date */}
            <div className="flex-shrink-0 w-16 flex items-center justify-center text-gray-400" title="Due date">
              <Calendar className="w-4 h-4 mr-1" /> {dueDate ? dueDate : 'N/A'}
            </div>
          </>
        )}
      </div>
      <TaskDetailMenu
        task={task}
        isOpen={isDetailOpen}
        onClose={() => setIsDetailOpen(false)}
        onTaskUpdated={() => {}}
      />
    </>
  )
} 