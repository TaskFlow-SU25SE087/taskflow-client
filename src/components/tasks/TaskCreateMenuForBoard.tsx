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
// Removed sprint select UI (auto-detect running sprint)
import { useToastContext } from '@/components/ui/ToastContext'
import { useBoards } from '@/hooks/useBoards'
import { useTags } from '@/hooks/useTags'
import { useTasks } from '@/hooks/useTasks'
import { Board } from '@/types/board'
import { Sprint } from '@/types/sprint'
import { Loader2, Plus } from 'lucide-react'
import { useEffect, useState } from 'react'

interface CreateTaskDialogProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  projectId: string
  onTaskCreated: () => void
  boardId: string
  trigger?: React.ReactNode
}

export default function TaskCreateMenuForBoard({
  isOpen,
  onOpenChange,
  projectId,
  onTaskCreated,
  boardId,
  trigger
}: CreateTaskDialogProps) {
  const { boards } = useBoards()
  const [board, setBoard] = useState<Board | null>(null)
  const { showToast } = useToastContext()
  const { refreshTasks } = useTasks()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [title, setTitle] = useState('')
  const [activeSprintId, setActiveSprintId] = useState<string>('')
  const [, setActiveSprint] = useState<Sprint | null>(null)
  const { tags } = useTags()
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([])
  const [priority, setPriority] = useState('Medium')
  const [deadline, setDeadline] = useState('')
  const [description, setDescription] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [effortPoints, setEffortPoints] = useState<string>('')
  const [effortPointsError, setEffortPointsError] = useState<string>('')

  const textareaStyle = `w-full bg-transparent text-foreground placeholder-gray-400 text-sm 
    border-b-2 border-gray-200 focus:border-lavender-700 
    transition-colors duration-300 focus:outline-none focus:ring-0 resize-none`

  useEffect(() => {
    if (boards && boardId) {
      const foundBoard = boards.find((board) => board.id === boardId)
      if (foundBoard) {
        setBoard(foundBoard)
      }
    }
  }, [boards, boardId])

  useEffect(() => {
    const detectActiveSprint = async () => {
      try {
        // 1. Try dedicated endpoint
        const current = await sprintApi.getCurrentSprint(projectId)
        if (current && current.id) {
          setActiveSprint(current)
          setActiveSprintId(current.id)
          return
        }
      } catch {
        // Fallback to manual detection
      }
      try {
        // 2. Fallback: load all and infer
        const all = await sprintApi.getAllSprintByProjectId(projectId)
        const now = new Date()
        // Heuristic: status===1 likely IN_PROGRESS (0:not started,1:in progress,2:completed,3:cancelled)
        const inProgress = all.filter(
          (s) =>
            s.status === 1 && s.startDate && s.endDate && new Date(s.startDate) <= now && new Date(s.endDate) >= now
        )
        // If multiple, choose one ending soonest
        const candidate = inProgress.sort((a, b) => new Date(a.endDate).getTime() - new Date(b.endDate).getTime())[0]
        if (candidate) {
          setActiveSprint(candidate)
          setActiveSprintId(candidate.id)
          return
        }
        // 3. Last resort: any sprint whose date range includes now
        const runningByDate = all
          .filter((s) => s.startDate && s.endDate && new Date(s.startDate) <= now && new Date(s.endDate) >= now)
          .sort((a, b) => new Date(a.endDate).getTime() - new Date(b.endDate).getTime())[0]
        if (runningByDate) {
          setActiveSprint(runningByDate)
          setActiveSprintId(runningByDate.id)
        } else {
          setActiveSprint(null)
          setActiveSprintId('')
        }
      } catch (err2) {
        console.error('Failed to infer active sprint:', err2)
        setActiveSprint(null)
        setActiveSprintId('')
      }
    }
    if (isOpen) detectActiveSprint()
  }, [isOpen, projectId])

  const handleTagChange = (tagId: string) => {
    setSelectedTagIds((prev) => (prev.includes(tagId) ? prev.filter((id) => id !== tagId) : [...prev, tagId]))
  }

  const handleSubmit = async () => {
    if (!title.trim()) {
      showToast({ title: 'Validation Error', description: 'Please enter a task title', variant: 'destructive' })
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
    // Sprint selection removed: silently allow no active sprint, task will be backlog if none running
    if (!board) {
      showToast({ title: 'Error', description: 'Board not found', variant: 'destructive' })
      return
    }
    setIsSubmitting(true)
    try {
      const formData = new FormData()
      formData.append('Title', title)
      formData.append('Description', description)
      formData.append('Priority', priority)
      if (deadline) formData.append('Deadline', deadline) // Deadline now optional
      if (file) formData.append('File', file)
      if (effortPoints.trim()) formData.append('EffortPoints', effortPoints.trim())
      if (activeSprintId) formData.append('SprintId', activeSprintId)
      // Hint backend to put task on the clicked board (best-effort; server may ignore)
      if (boardId) formData.append('BoardId', boardId)
      selectedTagIds.forEach((tagId) => formData.append('TagIds', tagId))
      const res = await taskApi.createTask(projectId, formData)
      showToast({
        title: res.code === 200 ? 'Success' : 'Error',
        description: res.message || 'Task created successfully',
        variant: res.code === 200 ? 'success' : 'destructive'
      })
      // Post-create: ensure the task is actually in the selected sprint and board
      try {
        const tasks = await taskApi.getTasksFromProject(projectId)
        const createdTask = tasks.find((t) => t.title === title && t.description === description)
        if (createdTask) {
          // Ensure sprint assignment (in case backend ignored SprintId)
          if (activeSprintId && createdTask.sprintId !== activeSprintId) {
            try {
              await sprintApi.assignTasksToSprint(projectId, activeSprintId, [createdTask.id])
            } catch {
              // Best-effort assignment
            }
          }
          // Ensure board placement (so it shows immediately on this column)
          if (boardId && createdTask.boardId !== boardId) {
            try {
              await taskApi.moveTaskToBoard(projectId, createdTask.id, boardId)
            } catch {
              // Best-effort placement
            }
          }
        } else {
          // Couldn't find created task deterministically
          showToast({ title: 'Notice', description: 'Task created. Syncing lists…', variant: 'default' })
        }
      } catch {
        // Ignore, will refresh below
      }
      await refreshTasks()
      onTaskCreated()
      onOpenChange(false)
      setTitle('')
      setDescription('')
      setFile(null)
      setSelectedTagIds([])
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
                <p className='text-sm text-gray-500 mt-1'>Add a task to the selected board and sprint</p>
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
                      fontSize: '0.875rem',
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

          <div>
            <Label htmlFor='file' className='text-sm font-medium'>
              Attach file
            </Label>
            <Input
              id='file'
              type='file'
              className='h-10'
              onChange={(e) => setFile(e.target.files ? e.target.files[0] : null)}
            />
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
