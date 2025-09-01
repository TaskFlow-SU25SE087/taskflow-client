import { projectMemberApi } from '@/api/projectMembers'
import { sprintApi } from '@/api/sprints'
import { taskApi } from '@/api/tasks'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToastContext } from '@/components/ui/ToastContext'
import { useTags } from '@/hooks/useTags'
import { useTasks } from '@/hooks/useTasks'
import { Loader2, Plus } from 'lucide-react'
import { useEffect, useState } from 'react'

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
  const [deadline, setDeadline] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [effortPoints, setEffortPoints] = useState<string>('')
  const [effortPointsError, setEffortPointsError] = useState<string>('')

  const textareaStyle = `w-full bg-transparent text-foreground placeholder-gray-400 text-sm 
    border-b-2 border-gray-200 focus:border-lavender-700 
    transition-colors duration-300 focus:outline-none focus:ring-0 resize-none`

  const handleTagChange = (tagId: string) => {
    setSelectedTagIds((prev) => (prev.includes(tagId) ? prev.filter((id) => id !== tagId) : [...prev, tagId]))
  }

  useEffect(() => {
    const fetchMembers = async () => {
      try {
        await projectMemberApi.getMembersByProjectId(projectId)
      } catch {
        // Ignore errors during member fetch
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
    // Validate effort points if provided
    if (effortPoints.trim() && !/^\d+$/.test(effortPoints.trim())) {
      showToast({
        title: 'Validation Error',
        description: 'Effort points must be a valid integer',
        variant: 'destructive'
      })
      return
    }
    // Check if there's an error state for effort points
    if (effortPointsError) {
      showToast({
        title: 'Validation Error',
        description: effortPointsError,
        variant: 'destructive'
      })
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
      formData.append('Deadline', deadline || '')
      if (file) formData.append('File', file)
      if (effortPoints.trim()) formData.append('EffortPoints', effortPoints.trim())
      if (sprintId) formData.append('SprintId', sprintId)
      selectedTagIds.forEach((tagId) => formData.append('TagIds', tagId))
      const res = await taskApi.createTask(projectId, formData)
      if (res.code === 200) {
        showToast({ title: 'Success', description: 'Task created successfully', variant: 'success' })

        // Give the backend a moment to fully save the task before searching for it
        await new Promise((resolve) => setTimeout(resolve, 100))

        // After create: locate the task and ensure sprint/tag assignments (and optional board move later)
        const tasks = await taskApi.getTasksFromProject(projectId)
        // Improved task lookup: sort by creation time and find most recent task with matching title
        // This is more reliable than matching both title and description, especially when description is empty
        const sortedTasks = tasks.sort(
          (a, b) =>
            new Date(b.createdAt || b.created || 0).getTime() - new Date(a.createdAt || a.created || 0).getTime()
        )
        // Find the most recently created task with matching title (and description if provided)
        const createdTask = sortedTasks.find((t) => {
          const titleMatches = t.title === title
          // If description is empty, just match by title; otherwise match both
          const descriptionMatches = description.trim() === '' || t.description === description
          return titleMatches && descriptionMatches
        })

        if (createdTask) {
          try {
            // Apply tags if any were selected
            if (selectedTagIds.length > 0) {
              for (const tagId of selectedTagIds) {
                await taskApi.addTagToTask(projectId, createdTask.id, tagId)
              }
            }
            // Ensure sprint assignment if sprintId was provided
            if (sprintId && createdTask.sprintId !== sprintId) {
              // enforce sprint assignment in case backend ignored SprintId
              await sprintApi.assignTasksToSprint(projectId, sprintId, [createdTask.id])
            }
          } catch (error) {
            // If tagging or sprint assignment fails, show a more specific warning
            console.warn('Failed to apply tags or sprint assignment:', error)
          }
        } else {
          // Only show warning if we actually have tags or sprint assignment to do
          if (selectedTagIds.length > 0 || sprintId) {
            showToast({ title: 'Warning', description: 'Task created but not found for tagging.', variant: 'warning' })
          }
        }
      } else {
        showToast({ title: 'Error', description: 'Failed to create task', variant: 'destructive' })
      }
      await refreshTasks()
      onTaskCreated()
      onOpenChange(false)
      setTitle('')
      setDescription('')
      setFile(null)
      setSelectedTagIds([])
      setPriority('Medium')
      setDeadline('')
      setEffortPoints('')
      setEffortPointsError('')
    } catch (error) {
      const err = error as { response?: { data?: { message?: string } }; message?: string }
      showToast({
        title: 'Error',
        description: err?.response?.data?.message || err?.message || 'Failed to create task.',
        variant: 'destructive'
      })
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
      <DialogContent
        className='w-[95vw] sm:max-w-md max-h-[90vh] overflow-y-auto scrollbar-transparent'
        data-prevent-dnd
      >
        <DialogHeader>
          <DialogTitle className='text-center'>
            <div className='flex flex-col items-center gap-4'>
              <Plus className='h-8 w-8 text-lavender-700' />
              <div>
                <h2 className='text-xl font-semibold'>Create new task</h2>
                <p className='text-sm text-gray-500 mt-1'>Add a task to your project</p>
              </div>
            </div>
          </DialogTitle>
        </DialogHeader>
        <DialogDescription>
          Fill in the task details below. You can attach a file and set priority and deadline.
        </DialogDescription>

        <div className='grid gap-6 py-4'>
          <div>
            <Label htmlFor='title' className='text-sm font-medium'>
              Task title
            </Label>
            <input
              id='title'
              placeholder='Enter task title'
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !isSubmitting) handleSubmit()
              }}
              className='w-full bg-transparent text-foreground placeholder-gray-400 text-sm border-b-2 border-gray-200 focus:border-lavender-700 transition-colors duration-300 focus:outline-none focus:ring-0'
            />
          </div>
          <div>
            <Label htmlFor='description' className='text-sm font-medium'>
              Description
            </Label>
            <textarea
              id='description'
              placeholder='Enter task description (optional)'
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className={textareaStyle}
              rows={3}
            />
            <p className='text-xs text-gray-500 mt-1'>Optional, you can attach a file below.</p>
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
          <div>
            <Label htmlFor='priority' className='text-sm font-medium'>
              Priority
            </Label>
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value)}
              className='h-10 w-full rounded-md border border-neutral-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-lavender-600'
            >
              <option value='Low'>Low</option>
              <option value='Medium'>Medium</option>
              <option value='High'>High</option>
              <option value='Urgent'>Urgent</option>
            </select>
          </div>
          <div>
            <Label htmlFor='deadline' className='text-sm font-medium'>
              Deadline (optional)
            </Label>
            <input
              id='deadline'
              type='date'
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
              className='w-full h-10 rounded-md border border-neutral-200 bg-white px-3 py-2 text-sm placeholder:text-neutral-500 focus:outline-none focus:ring-2 focus:ring-lavender-600'
            />
          </div>
          <div>
            <Label htmlFor='file' className='text-sm font-medium'>
              Attach file
            </Label>
            <Input id='file' type='file' className='h-10' onChange={(e) => setFile(e.target.files?.[0] || null)} />
          </div>

          <div>
            <Label htmlFor='effortPoints' className='text-sm font-medium'>
              Effort Points (optional)
            </Label>
            <input
              id='effortPoints'
              type='text'
              placeholder='Enter effort points (e.g., 2, 5, 8)'
              value={effortPoints}
              onChange={(e) => {
                const value = e.target.value
                setEffortPoints(value)
                // Clear error when user starts typing
                if (effortPointsError) setEffortPointsError('')
              }}
              onBlur={() => {
                // Validate on blur
                if (effortPoints.trim() && !/^\d+$/.test(effortPoints.trim())) {
                  setEffortPointsError('Effort points must be a valid positive integer')
                } else {
                  setEffortPointsError('')
                }
              }}
              className={`w-full bg-transparent text-foreground placeholder-gray-400 text-sm border-b-2 transition-colors duration-300 focus:outline-none focus:ring-0 ${
                effortPointsError ? 'border-red-500 focus:border-red-500' : 'border-gray-200 focus:border-lavender-700'
              }`}
            />
            {effortPointsError && <p className='text-xs text-red-500 mt-1'>{effortPointsError}</p>}
            {!effortPointsError && (
              <p className='text-xs text-gray-500 mt-1'>Optional. Enter a positive integer for effort estimation.</p>
            )}
          </div>

          <div className='flex justify-end gap-3 pt-2'>
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
              className='px-8 bg-lavender-700 hover:bg-lavender-800 text-white focus:ring-0 focus-visible:ring-0 focus-visible:ring-offset-0'
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                  Creating...
                </>
              ) : (
                'Create task'
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
