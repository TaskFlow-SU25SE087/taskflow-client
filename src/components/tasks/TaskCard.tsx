import { Calendar, ChevronDown, ChevronsDown, ChevronsUp, ChevronUp, FileText, MessageSquare } from 'lucide-react'
import { Card } from '../ui/card'
import { TaskP } from '@/types/task'
import { format } from 'date-fns'
import { useEffect, useState, useCallback } from 'react'
import { TaskDetailMenu } from './TaskDetailMenu'
import { useCurrentProject } from '@/hooks/useCurrentProject'
import { taskApi } from '@/api/tasks'
import { useNavigate } from 'react-router-dom'
import { projectMemberApi } from '@/api/projectMembers'
import { ProjectMember } from '@/types/project'
import Avatar from 'boring-avatars'
import { Sprint } from '@/types/sprint'
import { sprintApi } from '@/api/sprints'

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

export const TaskCard = ({ task }: { task: TaskP }) => {
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
        const sprint = await sprintApi.getSprintById(sprintId)
        setSprint(sprint)
      }
    } catch (error) {
      console.error('Error fetching task details:', error)
    }
  }, [currentProject, task.id])

  useEffect(() => {
    if (!currentProject) {
      return navigate('/board')
    }

    fetchTaskDetailsAndMember()
  }, [currentProject, navigate, fetchTaskDetailsAndMember])

  const handleTaskUpdated = useCallback(() => {
    fetchTaskDetailsAndMember()
  }, [fetchTaskDetailsAndMember])

  const demoTags = ['Tag 1', 'Tag 2']

  return (
    <>
      <div className='relative' onClick={() => setIsDetailOpen(true)}>
        <div
          className='absolute left-[0.115rem] top-24 -translate-y-1/2 w-1 h-16 bg-lavender-700 rounded-full'
          style={{ marginLeft: '-3px' }}
        />

        <Card className='w-full border border-gray-300 cursor-pointer hover:border-gray-400 transition-colors'>
          <div className='p-4'>
            <div className='flex gap-2 mb-3'>
              {demoTags.map((tag, index) => (
                <span
                  key={index}
                  className={`px-3 py-1 rounded-md text-sm ${
                    index === 0 ? 'bg-orange-100 text-orange-600' : 'bg-blue-100 text-blue-600'
                  }`}
                >
                  {tag}
                </span>
              ))}
            </div>

            <div className='flex items-center gap-2 mb-2'>
              <h2 className='text-xl font-bold'>{task.title}</h2>
              {getPriorityChevron(task.priority)}
            </div>

            <p className='text-gray-500 mb-4'>{task.description}</p>

            <div className='flex items-center gap-6 mb-4'>
              <div className='flex items-center gap-2 text-gray-500'>
                <MessageSquare className='w-5 h-5' />
                <span className='text-sm'>0 comments</span>
              </div>
              <div className='flex items-center gap-2 text-gray-500'>
                <FileText className='w-5 h-5' />
                <span className='text-sm'>0 files</span>
              </div>
            </div>

            <div className='flex justify-between items-center'>
              <div className='flex flex-row items-center space-x-2'>
                {assignedMember ? (
                  <>
                    <Avatar size='32px' variant='beam' name={assignedMember.userId} />
                    <p className='text-gray-500'>{assignedMember.user.name}</p>
                  </>
                ) : (
                  <>
                    <div className='w-8 h-8 rounded-full bg-gray-200'></div>
                    <p className='text-gray-500'>No assignees</p>
                  </>
                )}
              </div>

              <div className='flex items-center gap-2 text-gray-500'>
                <Calendar className='w-5 h-5' />
                <span className='text-sm'>{sprint?.endDate ? format(sprint?.endDate as Date, 'MMM d') : 'N/A'}</span>
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
