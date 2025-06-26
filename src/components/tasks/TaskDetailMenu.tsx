import { projectMemberApi } from '@/api/projectMembers'
import { sprintApi } from '@/api/sprints'
import { taskApi } from '@/api/tasks'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useToast } from '@/hooks/use-toast'
import { useAuth } from '@/hooks/useAuth'
import { useCurrentProject } from '@/hooks/useCurrentProject'
import { useTags } from '@/hooks/useTags'
import { cn } from '@/lib/utils'
import { ProjectMember, Tag } from '@/types/project'
import { Sprint } from '@/types/sprint'
import { TaskP } from '@/types/task'
import Avatar from 'boring-avatars'
import { Calendar, ChevronDown, ChevronsDown, ChevronsUp, ChevronUp, Eye, Filter, Link, ListTodo, Loader2, MessageCircle, Paperclip, Pencil, Plus, UserPlus, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '../ui/dialog'

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
  const [isUpdating, setIsUpdating] = useState(false)
  const [editTitle, setEditTitle] = useState(task.title)
  const [editDescription, setEditDescription] = useState(task.description)
  const [editPriority, setEditPriority] = useState(task.priority)

  // State cho edit mode
  const [isEditingTitle, setIsEditingTitle] = useState(false)
  const [isEditingDescription, setIsEditingDescription] = useState(false)

  // Priority mapping
  const PRIORITY_MAP: Record<number, string> = {
    1: 'Low',
    2: 'Medium',
    3: 'High',
    4: 'Critical'
  }

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
      await fetchComments()
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
      await taskApi.removeTaskAssignment(currentProject.id, task.id, {
        assigneeId: assignee.userId,
        reason: removeReason
      })
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

  useEffect(() => {
    setEditTitle(task.title)
    setEditDescription(task.description)
    setEditPriority(task.priority)
  }, [task])

  const handleUpdateTask = async () => {
    if (!currentProject) return
    setIsUpdating(true)
    try {
      await taskApi.updateTask(currentProject.id, task.id, {
        title: editTitle,
        description: editDescription,
        priority: editPriority.toString()
      })
      toast({ title: 'Success', description: 'Task updated!' })
      onTaskUpdated()
    } catch {
      toast({ title: 'Error', description: 'Failed to update task', variant: 'destructive' })
    } finally {
      setIsUpdating(false)
    }
  }

  // Activity Section
  const [comments, setComments] = useState<any[]>([])

  const fetchComments = async () => {
    if (!currentProject) return
    try {
      const tasks = await taskApi.getTasksFromProject(currentProject.id)
      const currentTask = tasks.find((t: any) => t.id === task.id)
      setComments(currentTask?.commnets || [])
    } catch (e) {
      setComments([])
    }
  }

  useEffect(() => {
    fetchComments()
    // eslint-disable-next-line
  }, [isOpen, task.id])

  // Tổng hợp file đính kèm từ task và các comment
  const allAttachmentUrls: string[] = [
    ...(task.attachmentUrlsList || []),
    ...((task.commnets || []).flatMap(c => c.attachmentUrls || []))
  ];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogDescription className='hidden'>Description</DialogDescription>
      <DialogContent className='max-w-4xl w-full [&>button]:hidden'>
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
            <div className='relative flex-grow'>
              {isEditingTitle ? (
                <Input
                  className='text-2xl font-semibold pr-10 w-full'
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  onBlur={() => setIsEditingTitle(false)}
                  autoFocus
                  disabled={isUpdating}
                />
              ) : (
                <div
                  className='text-2xl font-semibold pr-10 w-full flex items-center group cursor-pointer rounded hover:bg-gray-50 transition'
                  onClick={() => setIsEditingTitle(true)}
                >
                  <span className='flex-1 truncate'>{editTitle}</span>
                  <Pencil className='h-5 w-5 ml-2 text-gray-400 opacity-0 group-hover:opacity-100 transition' />
                </div>
              )}
            </div>
            <div className='flex items-center gap-2'>
              <div className='relative'>
                <select
                  className='w-28 border rounded px-2 py-1 text-center bg-white pr-8'
                  value={editPriority}
                  onChange={(e) => setEditPriority(Number(e.target.value))}
                  disabled={isUpdating}
                >
                  <option value={1}>Low</option>
                  <option value={2}>Medium</option>
                  <option value={3}>High</option>
                  <option value={4}>Critical</option>
                </select>
                <span className='absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none'>
                  <Pencil className='h-4 w-4' />
                </span>
              </div>
              <span className='ml-2 text-sm font-semibold'>{PRIORITY_MAP[editPriority]}</span>
              {getPriorityChevron(editPriority)}
            </div>
          </div>
          <div className='mt-2 text-gray-600'>
            <div className='relative'>
              {isEditingDescription ? (
                <textarea
                  className='w-full border rounded p-2 pr-10'
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  onBlur={() => setIsEditingDescription(false)}
                  autoFocus
                  disabled={isUpdating}
                />
              ) : (
                <div className='w-full min-h-[48px] flex items-center rounded px-2 py-2 bg-gray-50'>
                  <span className={`flex-1 ${!editDescription ? 'text-gray-400 italic' : ''}`}>
                    {editDescription || 'Chưa có mô tả chi tiết cho task này.'}
                  </span>
                  <Button
                    variant='ghost'
                    size='icon'
                    className='ml-2 text-gray-400 hover:text-blue-500'
                    onClick={() => setIsEditingDescription(true)}
                  >
                    <Pencil className='h-4 w-4' />
                  </Button>
                </div>
              )}
            </div>
          </div>
          <div className='flex justify-end mt-2'>
            <Button
              onClick={handleUpdateTask}
              disabled={
                isUpdating ||
                !editTitle.trim() ||
                (editTitle === task.title && editDescription === task.description && editPriority === task.priority)
              }
              className='px-6 bg-blue-500 hover:bg-blue-600 text-white'
            >
              {isUpdating ? (
                <>
                  <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                  Đang lưu...
                </>
              ) : (
                'Lưu'
              )}
            </Button>
          </div>
        </div>

        {/* Attachments */}
        {allAttachmentUrls.length > 0 && (
          <div className="mt-4">
            <div className="font-semibold mb-2">Attachments:</div>
            <div className="flex flex-wrap gap-3">
              {allAttachmentUrls.map((url: string, idx: number) => {
                if (url.match(/\.(jpg|jpeg|png|gif)$/i)) {
                  // Ảnh
                  return (
                    <a key={idx} href={url} target="_blank" rel="noopener noreferrer">
                      <img src={url} alt={`attachment-${idx}`} className="w-24 h-24 object-cover rounded border" />
                    </a>
                  )
                } else if (url.match(/\.pdf$/i)) {
                  // PDF
                  return (
                    <div key={idx} className="w-48 h-64 border rounded overflow-hidden">
                      <iframe src={url} title={`pdf-${idx}`} className="w-full h-full" />
                      <a href={url} target="_blank" rel="noopener noreferrer" className="block text-blue-600 underline text-center mt-1">Xem PDF</a>
                    </div>
                  )
                } else {
                  // File khác
                  return (
                    <a
                      key={idx}
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 underline flex items-center gap-1"
                    >
                      📎 File {idx + 1}
                    </a>
                  )
                }
              })}
            </div>
          </div>
        )}

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
                    onChange={(e) => setRemoveReason(e.target.value)}
                    className='px-2 py-1 border rounded text-sm'
                    disabled={removeLoading}
                  />
                  <Button onClick={handleRemoveAssignee} disabled={removeLoading} variant='destructive' size='sm'>
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
                  <Button onClick={handleLeaveAssignment} disabled={leaveLoading} variant='outline' size='sm'>
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
              onChange={(e) => setComment(e.target.value)}
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
              onClick={async () => { await handleAddComment(); await fetchComments(); }}
              disabled={isCommentLoading || !comment.trim()}
              className='ml-2 px-4 py-2 bg-lavender-500 text-white hover:bg-lavender-700'
            >
              {isCommentLoading ? 'Sending...' : 'Send'}
            </Button>
          </div>

          {/* Hiển thị danh sách comment */}
          <div className='space-y-2'>
            {comments.length === 0 ? (
              <div className='text-center text-gray-500 py-4'>No activity yet</div>
            ) : (
              comments.map((c, idx) => (
                <div key={c.commenter + idx} className='flex items-start gap-2'>
                  <Avatar size='28px' variant='beam' name={c.commenter} src={c.avatar} />
                  <div className='flex-1'>
                    <div className='font-medium'>{c.commenter}</div>
                    <div className='text-gray-700 mb-1'>{c.content}</div>
                    {Array.isArray(c.attachmentUrls) && c.attachmentUrls.length > 0 && (
                      <div className='flex flex-wrap gap-2 mb-1'>
                        {c.attachmentUrls.map((url: string, i: number) => {
                          if (url.match(/\.(jpg|jpeg|png|gif)$/i)) {
                            return (
                              <img
                                key={i}
                                src={url}
                                alt={`attachment-${i}`}
                                className='w-24 h-24 object-cover rounded border'
                              />
                            )
                          } else {
                            return (
                              <a
                                key={i}
                                href={url}
                                target='_blank'
                                rel='noopener noreferrer'
                                className='text-blue-600 underline text-sm flex items-center gap-1'
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" className='h-4 w-4' fill='none' viewBox='0 0 24 24' stroke='currentColor'><path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.586-6.586a2 2 0 10-2.828-2.828z' /></svg>
                                File {i + 1}
                              </a>
                            )
                          }
                        })}
                      </div>
                    )}
                    <div className='text-xs text-gray-400'>{c.lastUpdate}</div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
