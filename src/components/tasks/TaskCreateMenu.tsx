import { projectMemberApi } from '@/api/projectMembers'
import { taskApi } from '@/api/tasks'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { useToastContext } from '@/components/ui/ToastContext'
import { useTags } from '@/hooks/useTags'
import { useTasks } from '@/hooks/useTasks'
import { Loader2, Plus } from 'lucide-react'
import { useEffect, useState } from 'react'
import DatePicker from 'react-datepicker'
import 'react-datepicker/dist/react-datepicker.css'

interface CreateTaskDialogProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  projectId: string
  onTaskCreated: () => void
  sprintId?: string
  trigger?: React.ReactNode
}

export default function TaskCreateMenu({
  isOpen,
  onOpenChange,
  projectId,
  onTaskCreated,
  sprintId,
  trigger
}: CreateTaskDialogProps) {
  const { showToast } = useToastContext()
  const { refreshTasks } = useTasks()
  const { tags } = useTags()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [title, setTitle] = useState('')
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([])
  const [description, setDescription] = useState('')
  const [priority, setPriority] = useState('Medium')
  const [deadline, setDeadline] = useState<Date | null>(null)
  const [file, setFile] = useState<File | null>(null)

  const handleTagChange = (tagId: string) => {
    setSelectedTagIds((prev) => (prev.includes(tagId) ? prev.filter((id) => id !== tagId) : [...prev, tagId]))
  }

  useEffect(() => {
    const fetchMembers = async () => {
      try {
        const data = await projectMemberApi.getMembersByProjectId(projectId)
        // setMembers(data) // XÓA: setMembers(data)
      } catch (error) {
        // setMembers([]) // XÓA: setMembers([])
      }
    }
    fetchMembers()
  }, [projectId])

  const handleSubmit = async () => {
    if (!title.trim()) {
      showToast({ title: 'Validation Error', description: 'Please enter a task title', variant: 'destructive' })
      return
    }
    if (!priority) {
      showToast({ title: 'Validation Error', description: 'Please select a priority', variant: 'destructive' })
      return
    }
    if (!deadline) {
      showToast({ title: 'Validation Error', description: 'Please select a deadline', variant: 'destructive' })
      return
    }
    setIsSubmitting(true)
    try {
      const formData = new FormData()
      formData.append('Title', title)
      formData.append('Description', description)
      const priorityMap = {
        Low: 0,
        Medium: 10000,
        High: 20000,
        Urgent: 30000
      }
      formData.append('Priority', String(priorityMap[priority as 'Low' | 'Medium' | 'High' | 'Urgent']))
      formData.append('Deadline', deadline ? deadline.toISOString() : '')
      if (file) formData.append('File', file)
      if (sprintId) formData.append('SprintId', sprintId)
      selectedTagIds.forEach((tagId) => formData.append('TagIds', tagId))
      const res = await taskApi.createTask(projectId, formData)
      if (res === true) {
        showToast({ title: 'Success', description: 'Task created successfully', variant: 'default' })
      } else {
        showToast({ title: 'Error', description: 'Failed to create task', variant: 'destructive' })
      }
      // Sau khi tạo, lấy lại danh sách task và tìm task vừa tạo
      const tasks = await taskApi.getTasksFromProject(projectId)
      const createdTask = tasks.find((t) => t.title === title && t.description === description)
      if (createdTask) {
        for (const tagId of selectedTagIds) {
          await taskApi.addTagToTask(projectId, createdTask.id, tagId)
        }
      } else {
        showToast({ title: 'Warning', description: 'Task created but not found for tag/assignee.', variant: 'default' })
      }
      await refreshTasks()
      onTaskCreated()
      onOpenChange(false)
      setTitle('')
      setDescription('')
      setFile(null)
      setSelectedTagIds([])
      setPriority('Medium')
      setDeadline(null)
    } catch (error) {
      showToast({ title: 'Error', description: error.response?.data?.message || error.message || 'Failed to create task.', variant: 'destructive' })
    } finally {
      setIsSubmitting(false)
    }
  }

  const defaultTrigger = (
    <div className='flex items-center gap-2 cursor-pointer'>
      <span className='font-medium'>Add Task</span>
      <Button variant='ghost' size='icon' className='h-6 w-6 rounded-lg bg-violet-100 hover:bg-violet-200'>
        <Plus className='h-4 w-4 text-violet-600' />
      </Button>
    </div>
  )

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>{trigger || defaultTrigger}</DialogTrigger>
      <DialogContent className='sm:max-w-[425px]'>
        <DialogHeader>
          <DialogTitle className='text-2xl font-semibold'>Create New Task</DialogTitle>
        </DialogHeader>
        <div className='grid gap-4 py-4'>
          <div className='space-y-2'>
            <Label htmlFor='title' className='text-sm font-medium'>
              Task Title
            </Label>
            <Input
              id='title'
              placeholder='Enter task title'
              className='h-11'
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !isSubmitting) {
                  handleSubmit()
                }
              }}
            />
          </div>
          <div className='space-y-2'>
            <Label htmlFor='description' className='text-sm font-medium'>
              Description
            </Label>
            <Textarea
              id='description'
              placeholder='Enter task description'
              className='h-20'
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
          <div className='space-y-2'>
            <Label className='text-sm font-medium'>Tags</Label>
            <div className='flex flex-wrap gap-2'>
              {tags.map((tag) => (
                <label key={tag.id} className='flex items-center gap-1'>
                  <input
                    type='checkbox'
                    checked={selectedTagIds.includes(tag.id)}
                    onChange={() => handleTagChange(tag.id)}
                  />
                  <span
                    style={{
                      backgroundColor: tag.color,
                      color: getContrastYIQ(tag.color),
                      padding: '2px 8px',
                      borderRadius: '8px',
                      fontWeight: 500,
                      fontSize: '0.95em',
                      display: 'inline-block'
                    }}
                  >
                    {tag.name}
                  </span>
                </label>
              ))}
            </div>
          </div>
          <div className='space-y-2'>
            <Label htmlFor='priority' className='text-sm font-medium'>
              Priority
            </Label>
            <Select value={priority} onValueChange={setPriority}>
              <SelectTrigger className='h-11'>
                <SelectValue placeholder='Select priority' />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='Low'>Low</SelectItem>
                <SelectItem value='Medium'>Medium</SelectItem>
                <SelectItem value='High'>High</SelectItem>
                <SelectItem value='Urgent'>Urgent</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className='space-y-2 w-full'>
            <Label htmlFor='deadline' className='text-sm font-medium'>
              Deadline
            </Label>
            <div>
              <DatePicker
                id='deadline'
                selected={deadline}
                onChange={(date: Date | null) => setDeadline(date)}
                dateFormat='dd/MM/yy'
                placeholderText='dd/mm/yy'
                className='w-full h-11 rounded-lg border border-gray-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-lavender-400 transition-all text-base bg-gray-50'
                required
              />
            </div>
          </div>
          <div className='space-y-2'>
            <Label htmlFor='file' className='text-sm font-medium'>
              Attachment
            </Label>
            <Input id='file' type='file' className='h-11' onChange={(e) => setFile(e.target.files?.[0] || null)} />
          </div>
          {/* XÓA: <div className='space-y-2'>
            <label className='text-sm font-medium'>Assignee</label>
            <select
              className='h-11 w-full border rounded px-3'
              value={assigneeId}
              onChange={e => setAssigneeId(e.target.value)}
            >
              <option value=''>Assign member</option>
              {members.map(member => (
                <option key={member.userId} value={member.userId}>
                  {member.user?.fullName || member.user?.username || member.user?.email || member.userId}
                </option>
              ))}
            </select>
          </div> */}
          <div className='flex justify-end gap-3 pt-4'>
            <Button
              variant='outline'
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
              className='focus:ring-0 focus-visible:ring-0 focus-visible:ring-offset-0'
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              className='px-8 bg-lavender-500 hover:bg-lavender-600 focus:ring-0 focus-visible:ring-0 focus-visible:ring-offset-0'
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                  Creating...
                </>
              ) : (
                'Create Task'
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

function getContrastYIQ(hexcolor: string) {
  let color = hexcolor.replace('#', '')
  if (color.length === 3) {
    color = color[0] + color[0] + color[1] + color[1] + color[2] + color[2]
  }
  const r = parseInt(color.substr(0, 2), 16)
  const g = parseInt(color.substr(2, 2), 16)
  const b = parseInt(color.substr(4, 2), 16)
  const yiq = (r * 299 + g * 587 + b * 114) / 1000
  return yiq >= 128 ? '#222' : '#fff'
}
