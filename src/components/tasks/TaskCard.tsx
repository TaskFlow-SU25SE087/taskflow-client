import { projectMemberApi } from '@/api/projectMembers'
import { sprintApi } from '@/api/sprints'
import { taskApi } from '@/api/tasks'
import { useCurrentProject } from '@/hooks/useCurrentProject'
import { ProjectMember } from '@/types/project'
import { Sprint } from '@/types/sprint'
import { TaskP } from '@/types/task'
import Avatar from 'boring-avatars'
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
        const sprintId = await taskApi.getSprintIdFromTaskId(task.id)
        if (sprintId && currentProject?.id) {
          const sprint = await sprintApi.getSprintById(currentProject.id, sprintId)
          setSprint(sprint)
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
              {getPriorityChevron(task.priority)}
            </div>

            <p className={`text-gray-500 ${compact ? 'mb-2 truncate max-w-[180px] text-xs' : 'mb-4'}`}>{task.description}</p>

            <div className={`flex items-center ${compact ? 'gap-2 mb-1' : 'gap-6 mb-4'}`}>
              <div className='flex items-center gap-1 text-gray-400'>
                <MessageSquare className={compact ? 'w-4 h-4' : 'w-5 h-5'} />
              </div>
              <div className='flex items-center gap-1 text-gray-400'>
                <FileText className={compact ? 'w-4 h-4' : 'w-5 h-5'} />
              </div>
            </div>

            <div className='flex justify-between items-center'>
              <div className='flex flex-row items-center space-x-1'>
                {assignedMember ? (
                  <>
                    <Avatar size={compact ? '20px' : '32px'} variant='beam' name={assignedMember.userId} />
                    {!compact && <p className='text-gray-500'>{assignedMember.fullName || assignedMember.email || 'No name'}</p>}
                  </>
                ) : (
                  <>
                    <div className={compact ? 'w-5 h-5 rounded-full bg-gray-200' : 'w-8 h-8 rounded-full bg-gray-200'}></div>
                    {!compact && <p className='text-gray-500'>No assignees</p>}
                  </>
                )}
              </div>

              <div className='flex items-center gap-1 text-gray-400'>
                <Calendar className={compact ? 'w-4 h-4' : 'w-5 h-5'} />
                {!compact && <span className='text-sm'>{sprint?.endDate ? format(new Date(sprint?.endDate), 'MMM d') : 'N/A'}</span>}
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
