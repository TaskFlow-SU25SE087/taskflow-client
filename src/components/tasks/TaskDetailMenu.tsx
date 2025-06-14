import { useEffect, useState } from 'react'
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { TaskP } from '@/types/task'
import { ProjectMember } from '@/types/project'
import { useToast } from '@/hooks/use-toast'
import { Paperclip, Calendar, X, ListTodo, MessageCircle, Eye, Filter, UserPlus, Plus, Link } from 'lucide-react'
import { ChevronsUp, ChevronsDown, ChevronUp, ChevronDown } from 'lucide-react'
import { DialogDescription } from '@radix-ui/react-dialog'
import { projectMemberApi } from '@/api/projectMembers'
import { taskApi } from '@/api/tasks'
import { useCurrentProject } from '@/hooks/useCurrentProject'
import { useNavigate } from 'react-router-dom'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { cn } from '@/lib/utils'
import Avatar from 'boring-avatars'
import { useAuth } from '@/hooks/useAuth'
import { Sprint } from '@/types/sprint'
import { sprintApi } from '@/api/sprints'

interface TaskDetailMenuProps {
  task: TaskP
  isOpen: boolean
  onClose: () => void
  onTaskUpdated: () => void
}

export function TaskDetailMenu({ task, isOpen, onClose, onTaskUpdated }: TaskDetailMenuProps) {
  const { toast } = useToast()
  const [assignee, setAssignee] = useState<ProjectMember | null>(null)
  const [sprint, setSprint] = useState<Sprint | null>(null)
  const [projectMembers, setProjectMembers] = useState<ProjectMember[]>([])
  const [projectLeader, setProjectLeader] = useState<ProjectMember | null>(null)
  const [isAssigning, setIsAssigning] = useState(false)
  const { currentProject } = useCurrentProject()
  const { user } = useAuth()
  const navigate = useNavigate()

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

  useEffect(() => {
    if (!currentProject) {
      navigate('/board')
      return
    }

    const fetchAssigneeAndMembers = async () => {
      try {
        const members = await projectMemberApi.getMembersByProjectId(currentProject.id)
        if (!members) {
          throw new Error('Failed to fetch project members')
        }

        setProjectMembers(members)

        const leader = members.find((member) => member.role === 'Leader')
        if (leader) {
          setProjectLeader(leader)
        }

        const tasks = await taskApi.getTasksFromProject(currentProject.id)
        const taskDetails = tasks?.find((t) => t.id === task.id)
        const sprintId = taskDetails?.sprintId
        await sprintApi.getSprintById(sprintId as string).then((sprint) => setSprint(sprint))

        if (taskDetails?.assigneeId) {
          const assignee = members.find((member) => member.userId === taskDetails.assigneeId)
          if (assignee) {
            setAssignee(assignee)
          }
        }
      } catch (error) {
        console.error('Error fetching data:', error)
        toast({
          title: 'Error',
          description: 'Failed to load task details. Please try again.',
          variant: 'destructive'
        })
      }
    }

    fetchAssigneeAndMembers()
  }, [currentProject, navigate, task.id, toast])

  const handleAssignMember = async (memberId: string) => {
    if (!projectLeader) {
      toast({
        title: 'Error',
        description: 'Project leader not found. Cannot assign task.',
        variant: 'destructive'
      })
      return
    }

    const member = projectMembers.find((m) => m.userId === memberId)
    if (!member) return

    setIsAssigning(true)
    try {
      await taskApi.assignTask(task.id, member.user.email)
      setAssignee(member)
      onTaskUpdated()
      toast({
        title: 'Success',
        description: `Task assigned to ${member.user.name}`
      })
    } catch (error) {
      console.log(error)
      toast({
        title: 'Error',
        description: 'Failed to assign task. Please try again.',
        variant: 'destructive'
      })
    } finally {
      setIsAssigning(false)
    }
  }

  const handleAttach = () => {
    toast({
      title: 'Coming Soon',
      description: 'File attachments will be available soon!'
    })
  }

  const handleAddTag = () => {
    toast({
      title: 'Coming Soon',
      description: 'Adding tags will be available soon!'
    })
  }

  // Demo data for cosmetic elements
  const demoData = {
    tags: ['Tag 1']
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogDescription className='hidden'>Description</DialogDescription>
      <DialogContent className='max-w-2xl [&>button]:hidden'>
        <DialogTitle className='hidden'>Title</DialogTitle>

        {/* Header */}
        <div className='flex items-center justify-between mb-4'>
          <div className='flex items-center gap-2'>
            <span className='text-xl font-semibold'>In Sprint: {sprint?.name}</span>
            <button className='p-1 rounded-lg bg-lavender-200 text-lavender-500 hover:bg-lavender-300/60 hover:text-lavender-800'>
              <Link className='h-4 w-4' />
            </button>
          </div>
          <button onClick={onClose} className='text-gray-400 hover:text-gray-600'>
            <X className='h-5 w-5' />
          </button>
        </div>

        {/* Task Name and Priority */}
        <div className='mb-4'>
          <div className='flex items-center gap-2 mb-1'>
            <span className='text-gray-500'>In board</span>
            <span className='text-gray-900 cursor-pointer hover:underline'>{task.status}</span>
          </div>
          <div className='flex items-center gap-2'>
            <ListTodo className='h-5 w-5' />
            <p className='text-2xl font-semibold flex-grow'>{task.title}</p>
            <div className='flex items-center gap-2'>{getPriorityChevron(task.priority)}</div>
          </div>
          <div className='mt-2 text-gray-600'>{task.description ? task.description : 'No description'}</div>
        </div>

        {/* Action Buttons */}
        <div className='flex gap-2 mb-6'>
          <button
            onClick={handleAttach}
            className='flex items-center gap-2 px-3 py-1.5 text-gray-600 rounded-lg border hover:bg-gray-50'
          >
            <Paperclip className='h-4 w-4' />
            <span>Attach</span>
          </button>
        </div>

        {/* Assignee and Tags Grid */}
        <div className='grid grid-cols-2 gap-6 mb-6'>
          {/* Assignee Section */}
          <div>
            <h1 className='text-base font-medium mb-2 flex items-center gap-2'>Assignee</h1>
            <div className='flex items-center gap-2'>
              <Select
                onValueChange={handleAssignMember}
                disabled={isAssigning || !projectLeader}
                value={assignee?.userId}
              >
                <SelectTrigger
                  className={cn(
                    'flex items-center gap-2 px-3 py-1.5 text-gray-600 rounded-lg border hover:bg-gray-50',
                    'focus:ring-0 focus:ring-offset-0 h-auto',
                    '[&>span]:flex [&>span]:items-center [&>span]:gap-2 [&>span]:m-0 [&>span]:p-0',
                    '[&>svg]:hidden'
                  )}
                >
                  <SelectValue
                    placeholder={
                      <div className='flex items-center gap-2 text-gray-500'>
                        <UserPlus className='h-4 w-4' />
                        <span>Assign member</span>
                      </div>
                    }
                  >
                    {assignee && (
                      <div className='flex items-center gap-2'>
                        <Avatar size='24px' variant='beam' name={assignee.userId} />
                        <span>{assignee.user.name}</span>
                      </div>
                    )}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent className='p-0'>
                  {projectMembers.map((member) => (
                    <SelectItem
                      key={member.userId}
                      value={member.userId}
                      className='focus:bg-gray-100 focus:text-gray-900 py-2 px-3'
                    >
                      <div className='flex items-center pl-5 gap-2'>
                        <Avatar size='24px' variant='beam' name={member.userId} />
                        <span>{member.user.name}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Tags Section */}
          <div>
            <h1 className='text-base font-medium mb-2 flex items-center gap-2'>Tags</h1>
            <div className='flex items-center gap-2'>
              {demoData.tags.map((tag, index) => (
                <span key={index} className='px-3 py-1 bg-orange-100 text-orange-600 rounded-full text-sm'>
                  {tag}
                </span>
              ))}
              <div className='flex items-center gap-2 cursor-pointer' onClick={handleAddTag}>
                <Button
                  variant='ghost'
                  size='icon'
                  className='h-6 w-6 rounded-lg bg-lavender-200 hover:hover:bg-lavender-300/60'
                >
                  <Plus className='h-4 w-4 text-lavender-500 hover:text-lavender-800' />
                </Button>
                <span className='font-medium text-lavender-500 hover:text-lavender-800'>Add</span>
              </div>
            </div>
          </div>
        </div>

        {/* Activity Section */}
        <div>
          <div className='flex items-center justify-between mb-4'>
            <div className='flex items-center gap-2'>
              <MessageCircle className='h-5 w-5' />
              <h1 className='text-2xl font-semibold'>Activity</h1>
            </div>
            <div className='flex items-center gap-2'>
              <div className='flex items-center gap-2'>
                <span className='text-gray-500'>Show:</span>
                <button className='flex items-center gap-2 px-3 py-1.5 text-gray-600 rounded-lg border hover:bg-gray-50'>
                  <Filter className='h-4 w-4' />
                  <span>All</span>
                </button>
              </div>
              <button className='flex items-center gap-2 px-3 py-1.5 text-gray-600 rounded-lg border hover:bg-gray-50'>
                <Eye className='h-4 w-4' />
                <span>Hide Details</span>
              </button>
              <button className='flex items-center gap-2 px-3 py-1.5 text-gray-600 rounded-lg border hover:bg-gray-50'>
                <Calendar className='h-4 w-4' />
                <span>Today</span>
              </button>
            </div>
          </div>

          {/* Comment Input */}
          <div className='flex gap-3 mb-6'>
            <Avatar size='32px' variant='beam' name={user?.id} />
            <input
              type='text'
              placeholder='Write a comment...'
              className='flex-1 px-4 py-2 focus-visible:ring-0 focus-visible:ring-offset-0 focus:outline-none rounded-lg border border-gray-200'
            />
          </div>

          {/* Empty Activity State */}
          <div className='text-center text-gray-500 py-4'>No activity yet</div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
