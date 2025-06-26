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
import { Tag } from '@/types/project'
import { useTags } from '@/hooks/useTags'

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
  const { tags } = useTags()
  const [isTagSelectOpen, setIsTagSelectOpen] = useState(false)
  const [selectedTagId, setSelectedTagId] = useState<string>('')
  const [taskTags, setTaskTags] = useState<Tag[]>(task.tags || [])
  const [completeLoading, setCompleteLoading] = useState(false)
  const [comment, setComment] = useState('')
  const [commentFiles, setCommentFiles] = useState<File[]>([])
  const [isCommentLoading, setIsCommentLoading] = useState(false)
  const [removeLoading, setRemoveLoading] = useState(false)
  const [removeReason, setRemoveReason] = useState('')
  const [leaveLoading, setLeaveLoading] = useState(false)
  const [leaveReason, setLeaveReason] = useState('')

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
        // @ts-expect-error: getSprintById may not exist in sprintApi type, but is implemented in backend
        await sprintApi.getSprintById(sprintId as string).then((sprint: Sprint) => setSprint(sprint))

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
    if (!projectLeader || !currentProject) {
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
      await taskApi.assignTask(currentProject.id, task.id, member.userId)
      setAssignee(member)
      onTaskUpdated()
      toast({
        title: 'Success',
        description: `Task assigned to ${member.user.fullName || member.user.username}`
      })
    } catch {
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
    setIsTagSelectOpen(true)
  }

  const handleTagSelect = async (tagId: string) => {
    if (!currentProject) return
    try {
      await taskApi.addTagToTask(currentProject.id, task.id, tagId)
      const tag = tags.find((t) => t.id === tagId)
      if (tag) setTaskTags([...taskTags, tag])
      toast({ title: 'Success', description: 'Tag added to task!' })
      setIsTagSelectOpen(false)
      setSelectedTagId('')
    } catch {
      toast({ title: 'Error', description: 'Failed to add tag', variant: 'destructive' })
    }
  }

  const handleCompleteTask = async () => {
    if (!currentProject) return
    setCompleteLoading(true)
    try {
      await taskApi.completeTask(currentProject.id, task.id)
      toast({ title: 'Success', description: 'Task marked as complete!' })
      onTaskUpdated()
      onClose()
    } catch {
      toast({ title: 'Error', description: 'Failed to complete task', variant: 'destructive' })
    } finally {
      setCompleteLoading(false)
    }
  }

  const handleCommentFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setCommentFiles(Array.from(e.target.files))
    }
  }

  const handleAddComment = async () => {
    if (!currentProject || !comment.trim()) return
    setIsCommentLoading(true)
    try {
      await taskApi.addTaskComment(currentProject.id, task.id, comment, commentFiles)
      toast({ title: 'Success', description: 'Comment added!' })
      setComment('')
      setCommentFiles([])
      // TODO: reload comments/activity if needed
    } catch {
      toast({ title: 'Error', description: 'Failed to add comment', variant: 'destructive' })
    } finally {
      setIsCommentLoading(false)
    }
  }

  const handleRemoveAssignee = async () => {
    if (!currentProject || !assignee) return
    setRemoveLoading(true)
    try {
      await taskApi.removeTaskAssignment(
        currentProject.id,
        task.id,
        {
          assigneeId: assignee.userId,
          reason: removeReason
        }
      )
      toast({ title: 'Success', description: 'Assignee removed from task!' })
      setAssignee(null)
      setRemoveReason('')
      onTaskUpdated()
    } catch {
      toast({ title: 'Error', description: 'Failed to remove assignee', variant: 'destructive' })
    } finally {
      setRemoveLoading(false)
    }
  }

  const handleLeaveAssignment = async () => {
    if (!currentProject || !assignee || user?.id !== assignee.userId) return
    setLeaveLoading(true)
    try {
      await taskApi.leaveTaskAssignment(currentProject.id, task.id, { reason: leaveReason })
      toast({ title: 'Success', description: 'You have left this task!' })
      setAssignee(null)
      setLeaveReason('')
      onTaskUpdated()
    } catch {
      toast({ title: 'Error', description: 'Failed to leave task', variant: 'destructive' })
    } finally {
      setLeaveLoading(false)
    }
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
          <Button
            onClick={handleCompleteTask}
            disabled={completeLoading}
            className='flex items-center gap-2 px-3 py-1.5 text-green-700 border border-green-300 bg-green-50 hover:bg-green-100'
          >
            {completeLoading ? 'Completing...' : 'Hoàn thành'}
          </Button>
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
                        <span>{assignee.user.fullName || assignee.user.username}</span>
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
                        <span>{member.user.fullName || member.user.username}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {assignee && (
                <div className='flex items-center gap-2 ml-2'>
                  <input
                    type='text'
                    placeholder='Reason (optional)'
                    value={removeReason}
                    onChange={e => setRemoveReason(e.target.value)}
                    className='px-2 py-1 border rounded text-sm'
                    disabled={removeLoading}
                  />
                  <Button
                    onClick={handleRemoveAssignee}
                    disabled={removeLoading}
                    variant='destructive'
                    size='sm'
                  >
                    {removeLoading ? 'Removing...' : 'Gỡ người được giao'}
                  </Button>
                </div>
              )}
              {assignee && user?.id === assignee.userId && (
                <div className='flex items-center gap-2 ml-2'>
                  <input
                    type='text'
                    placeholder='Reason (optional)'
                    value={leaveReason}
                    onChange={(e) => setLeaveReason(e.target.value)}
                    className='px-2 py-1 border rounded text-sm'
                    disabled={leaveLoading}
                  />
                  <Button
                    onClick={handleLeaveAssignment}
                    disabled={leaveLoading}
                    variant='outline'
                    size='sm'
                  >
                    {leaveLoading ? 'Leaving...' : 'Rời khỏi task'}
                  </Button>
                </div>
              )}
            </div>
          </div>

          {/* Tags Section */}
          <div>
            <h1 className='text-base font-medium mb-2 flex items-center gap-2'>Tags</h1>
            <div className='flex items-center gap-2 flex-wrap'>
              {taskTags.map((tag) => (
                <span key={tag.id} className='px-3 py-1 bg-orange-100 text-orange-600 rounded-full text-sm'>
                  {tag.name}
                </span>
              ))}
              <div className='flex items-center gap-2 cursor-pointer'>
                <Button
                  variant='ghost'
                  size='icon'
                  className='h-6 w-6 rounded-lg bg-lavender-200 hover:bg-lavender-300/60'
                  onClick={handleAddTag}
                >
                  <Plus className='h-4 w-4 text-lavender-500 hover:text-lavender-800' />
                </Button>
                <span className='font-medium text-lavender-500 hover:text-lavender-800'>Add</span>
                {isTagSelectOpen && (
                  <Select value={selectedTagId} onValueChange={handleTagSelect}>
                    <SelectTrigger className='ml-2 w-40'>
                      <SelectValue placeholder='Select tag' />
                    </SelectTrigger>
                    <SelectContent>
                      {tags
                        .filter((t) => !taskTags.some((tag) => tag.id === t.id))
                        .map((tag) => (
                          <SelectItem key={tag.id} value={tag.id}>
                            {tag.name}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                )}
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
          <div className='flex gap-3 mb-6 items-center'>
            <Avatar size='32px' variant='beam' name={user?.id} />
            <input
              type='text'
              placeholder='Write a comment...'
              className='flex-1 px-4 py-2 focus-visible:ring-0 focus-visible:ring-offset-0 focus:outline-none rounded-lg border border-gray-200'
              value={comment}
              onChange={e => setComment(e.target.value)}
              disabled={isCommentLoading}
            />
            <input
              type='file'
              multiple
              onChange={handleCommentFileChange}
              className='block text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-lavender-50 file:text-lavender-700 hover:file:bg-lavender-100'
              disabled={isCommentLoading}
            />
            <Button
              onClick={handleAddComment}
              disabled={isCommentLoading || !comment.trim()}
              className='ml-2 px-4 py-2 bg-lavender-500 text-white hover:bg-lavender-700'
            >
              {isCommentLoading ? 'Sending...' : 'Send'}
            </Button>
          </div>

          {/* Empty Activity State */}
          <div className='text-center text-gray-500 py-4'>No activity yet</div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
