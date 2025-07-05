import { projectMemberApi } from '@/api/projectMembers'
import { taskApi } from '@/api/tasks'
import { useCurrentProject } from '@/hooks/useCurrentProject'
import { ProjectMember } from '@/types/project'
import { Sprint } from '@/types/sprint'
import { TaskP } from '@/types/task'
import { format } from 'date-fns'
import { Calendar, ChevronDown, ChevronsDown, ChevronsUp, ChevronUp, FileText, MessageSquare } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card } from '../ui/card'
import { TaskDetailMenu } from './TaskDetailMenu'

const getPriorityChevron = (priority: number) => {
  switch (priority) {
    case 1:
      return <ChevronDown className='h-8 w-8 text-blue-500' />
    case 2:
      return (
        <div className='flex flex-col'>
          <ChevronsDown className='h-8 w-8 text-orange-400' />
        </div>
      )
    case 3:
      return <ChevronUp className='h-8 w-8 text-red-500' />
    case 4:
      return (
        <div className='flex flex-col'>
          <ChevronsUp className='h-8 w-8 text-red-600' />
        </div>
      )
    default:
      return <ChevronDown className='h-8 w-8 text-gray-400' />
  }
}

interface TaskCardProps { task: TaskP, compact?: boolean, children?: React.ReactNode }
export const TaskCard = ({ task, compact = false, children }: TaskCardProps & { children?: React.ReactNode }) => {
  const [isDetailOpen, setIsDetailOpen] = useState(false)
  const [assignedMember, setAssignedMember] = useState<ProjectMember | null>(null)
  const [sprint, setSprint] = useState<Sprint | null>(null)
  const { currentProject } = useCurrentProject()
  const navigate = useNavigate()

  const fetchTaskDetailsAndMember = useCallback(async () => {
    if (!currentProject) return

    try {
      const tasks = await taskApi.getTasksFromProject(currentProject.id)
      const currentTask = tasks.find((taskFromArray) => taskFromArray.id === task.id)
      if (currentTask) {
        if (currentTask.assigneeId) {
          const members = await projectMemberApi.getMembersByProjectId(currentTask.projectId)
          const member = members.find((m) => m.userId === currentTask.assigneeId)
          if (member) {
            setAssignedMember(member)
          }
        } else {
          setAssignedMember(null)
        }
      }
    } catch (error) {
      console.error('Error fetching task details:', error)
    }
  }, [currentProject, task.id])

  useEffect(() => {
    if (!currentProject) {
      return;
    }
    fetchTaskDetailsAndMember()
  }, [currentProject, navigate, fetchTaskDetailsAndMember])

  const handleTaskUpdated = useCallback(() => {
    fetchTaskDetailsAndMember()
  }, [fetchTaskDetailsAndMember])

  if (!currentProject) {
    return <div className='p-4 text-center text-gray-500'>Chưa chọn project</div>;
  }

  // Lấy số comment, số file, deadline, status, người tạo, ngày tạo, danh sách assignees
  const commentCount = Array.isArray(task.comments) ? task.comments.length : (Array.isArray(task.commnets) ? task.commnets.length : 0);
  const fileCount = Array.isArray(task.attachmentUrlsList) ? task.attachmentUrlsList.length : 0;
  const deadline = sprint?.endDate ? format(new Date(sprint.endDate), 'MMM d, yyyy') : 'N/A';
  const status = task.status || 'N/A';
  const createdBy = task.reporter?.fullName || task.reporter?.email || 'Unknown';
  const createdAt = task.created ? format(new Date(task.created), 'MMM d, yyyy') : 'N/A';
  const assignees = Array.isArray(task.taskAssignees) && task.taskAssignees.length > 0 ? task.taskAssignees : [];
  const priorityText =
    task.priority === 1 ? 'Low' :
    task.priority === 2 ? 'Medium' :
    task.priority === 3 ? 'High' :
    task.priority === 4 ? 'Urgent' : 'N/A';
  const priorityColor =
    task.priority === 1 ? 'text-blue-500' :
    task.priority === 2 ? 'text-orange-400' :
    task.priority === 3 ? 'text-red-500' :
    task.priority === 4 ? 'text-red-600' : 'text-gray-400';

  if (compact) {
    return (
      <div className="flex items-center gap-2 border border-gray-200 rounded px-2 py-1 text-xs bg-white min-h-[36px]">
        {/* Tags */}
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
        {/* Title */}
        <span className="font-semibold truncate max-w-[120px]">{task.title}</span>
        {/* Description */}
        <span className="text-gray-500 truncate max-w-[120px]">{task.description}</span>
        {/* Move to Sprint button if present */}
        <span className="ml-auto">{children}</span>
      </div>
    )
  }

  return (
    <>
      <div className='relative' onClick={() => setIsDetailOpen(true)}>
        <div
          className={`absolute left-[0.115rem] ${compact ? 'top-10 h-8' : 'top-24 h-16'} -translate-y-1/2 w-1 bg-lavender-700 rounded-full`}
          style={{ marginLeft: '-3px' }}
        />

        <Card className={`w-full border border-gray-300 cursor-pointer hover:border-gray-400 transition-colors ${compact ? 'p-2 rounded-md text-sm' : ''}`}>
          <div className={compact ? 'p-2' : 'p-4'}>
            <div className={`flex gap-2 ${compact ? 'mb-1' : 'mb-3'}`}>
              {task.tags && task.tags.length > 0 && (
                <>
                  {task.tags.map((tag: { id: string; name: string }, index: number) => (
                    <span
                      key={tag.id || index}
                      className={`rounded px-2 py-0.5 text-xs bg-orange-100 text-orange-600 mr-1 ${compact ? '' : 'text-sm px-3 py-1'}`}
                    >
                      {tag.name}
                    </span>
                  ))}
                </>
              )}
            </div>

            <div className={`flex items-center gap-2 ${compact ? 'mb-1' : 'mb-2'}`}>
              <h2 className={`font-bold ${compact ? 'text-base truncate max-w-[120px]' : 'text-xl'}`}>{task.title}</h2>
              <span className={`ml-2 font-semibold ${priorityColor}`}>{priorityText}</span>
              {getPriorityChevron(task.priority)}
            </div>

            <p className={`text-gray-500 ${compact ? 'mb-2 truncate max-w-[180px] text-xs' : 'mb-4'}`}>{task.description}</p>

            <div className={`flex items-center ${compact ? 'gap-2 mb-1' : 'gap-6 mb-4'}`}>
              <div className='flex items-center gap-1 text-gray-400'>
                <MessageSquare className={compact ? 'w-4 h-4' : 'w-5 h-5'} />
                <span>{commentCount}</span>
              </div>
              <div className='flex items-center gap-1 text-gray-400'>
                <FileText className={compact ? 'w-4 h-4' : 'w-5 h-5'} />
                <span>{fileCount}</span>
              </div>
            </div>

            <div className='flex justify-between items-center'>
              <div className='flex flex-row items-center space-x-1'>
                {assignees.length > 0 ? (
                  assignees.map((assignee, idx) => (
                    <div key={assignee.projectMemberId || idx} className='flex items-center gap-1'>
                      <img src={assignee.avatar} alt={assignee.executor} style={{ width: 24, height: 24, borderRadius: '50%', marginRight: 8 }} />
                      <span>{assignee.executor}</span>
                    </div>
                  ))
                ) : (
                  <span>No assignees</span>
                )}
              </div>

              <div className='flex flex-col items-end'>
                <div className='flex items-center gap-1 text-gray-400'>
                  <Calendar className={compact ? 'w-4 h-4' : 'w-5 h-5'} />
                  <span className='text-sm'>{deadline}</span>
                </div>
              </div>
            </div>
          </div>
        </Card>
      </div>

      <TaskDetailMenu
        task={task}
        isOpen={isDetailOpen}
        onClose={() => setIsDetailOpen(false)}
        onTaskUpdated={handleTaskUpdated}
      />
    </>
  )
}
