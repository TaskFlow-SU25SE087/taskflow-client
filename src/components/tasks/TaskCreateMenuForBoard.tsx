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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
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
  const [sprints, setSprints] = useState<Sprint[]>([])
  const [selectedSprintId, setSelectedSprintId] = useState<string>('')
  const { tags } = useTags()
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([])
  const [priority, setPriority] = useState('Medium')
  const [deadline, setDeadline] = useState('')
  const [description, setDescription] = useState('')
  const [file, setFile] = useState<File | null>(null)

  useEffect(() => {
    if (boards && boardId) {
      const foundBoard = boards.find((board) => board.id === boardId)
      if (foundBoard) {
        setBoard(foundBoard)
      }
    }
  }, [boards, boardId])

  useEffect(() => {
    const fetchSprints = async () => {
      try {
        const fetchedSprints = await sprintApi.getAllSprintByProjectId(projectId)
        console.log('Fetched sprints:', fetchedSprints)
        const runningSprints = fetchedSprints.filter(
          (sprint) => sprint.startDate && sprint.startDate !== null && sprint.endDate && sprint.endDate !== null
        )
        console.log('Running sprints:', runningSprints)
        setSprints(runningSprints)
        if (runningSprints.length > 0) {
          setSelectedSprintId(runningSprints[0].id)
        }
      } catch (error) {
        console.error('Failed to fetch sprints:', error)
        showToast({ title: 'Error', description: 'Failed to fetch sprints', variant: 'destructive' })
      }
    }

    if (isOpen) {
      fetchSprints()
    }
  }, [isOpen, projectId, showToast])

  const handleTagChange = (tagId: string) => {
    setSelectedTagIds((prev) => (prev.includes(tagId) ? prev.filter((id) => id !== tagId) : [...prev, tagId]))
  }

  const handleSubmit = async () => {
    if (!title.trim()) {
      showToast({ title: 'Validation Error', description: 'Please enter a task title', variant: 'destructive' })
      return
    }
    if (!selectedSprintId) {
      showToast({ title: 'Validation Error', description: 'Please select a sprint', variant: 'destructive' })
      return
    }
    if (!board) {
      showToast({ title: 'Error', description: 'Board not found', variant: 'destructive' })
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
      formData.append('Priority', priority)
      formData.append('Deadline', deadline)
      if (file) formData.append('File', file)
      formData.append('SprintId', selectedSprintId)
      selectedTagIds.forEach((tagId) => formData.append('TagIds', tagId))
      const res = await taskApi.createTask(projectId, formData)
      showToast({
        title: res.code === 200 ? 'Success' : 'Error',
        description: res.message || 'Task created successfully',
        variant: res.code === 200 ? 'success' : 'destructive'
      })
      await refreshTasks()
      onTaskCreated()
      onOpenChange(false)
      setTitle('')
      setDescription('')
      setFile(null)
      setSelectedTagIds([])
    } catch (error) {
      const err = error as any
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
      <DialogContent className='sm:max-w-md'>
        <DialogHeader>
          <DialogTitle className='text-center'>
            <div className='flex flex-col items-center gap-4'>
              <Plus className='h-12 w-12 text-lavender-700' />
              <div>
                <h2 className='text-2xl font-bold'>Create new task</h2>
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
              className='w-full bg-transparent text-foreground placeholder-gray-400 text-lg border-b-2 border-gray-200 focus:border-lavender-700 transition-colors duration-300 focus:outline-none focus:ring-0'
            />
          </div>

          <div>
            <Label htmlFor='sprint' className='text-sm font-medium'>
              Select sprint
            </Label>
            <Select value={selectedSprintId} onValueChange={setSelectedSprintId}>
              <SelectTrigger className='h-11 border-0 border-b-2 border-gray-200 rounded-none px-0 focus:ring-0 focus:ring-offset-0 focus:outline-none focus:border-lavender-700'>
                <SelectValue placeholder='Select a sprint' />
              </SelectTrigger>
              <SelectContent>
                {sprints.map((sprint) => (
                  <SelectItem key={sprint.id} value={sprint.id}>
                    {sprint.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedSprintId &&
              (() => {
                const sprint = sprints.find((s) => s.id === selectedSprintId)
                if (!sprint) return null
                return (
                  <div className='text-xs text-gray-500 mt-1'>
                    Time: {sprint.startDate ? new Date(sprint.startDate).toLocaleDateString('en-GB') : '...'} -{' '}
                    {sprint.endDate ? new Date(sprint.endDate).toLocaleDateString('en-GB') : '...'}
                  </div>
                )
              })()}
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
                  <span style={{ color: tag.color }}>{tag.name}</span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <Label htmlFor='priority' className='text-sm font-medium'>
              Priority
            </Label>
            <Select value={priority} onValueChange={setPriority}>
              <SelectTrigger className='h-11 border-0 border-b-2 border-gray-200 rounded-none px-0 focus:ring-0 focus:ring-offset-0 focus:outline-none focus:border-lavender-700'>
                <SelectValue placeholder='Select priority' />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='Low'>Low</SelectItem>
                <SelectItem value='Medium'>Medium</SelectItem>
                <SelectItem value='High'>High</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor='deadline' className='text-sm font-medium'>
              Deadline
            </Label>
            <input
              id='deadline'
              type='date'
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
              className='w-full bg-transparent text-foreground placeholder-gray-400 text-lg border-b-2 border-gray-200 focus:border-lavender-700 transition-colors duration-300 focus:outline-none focus:ring-0'
            />
          </div>

          <div>
            <Label htmlFor='description' className='text-sm font-medium'>
              Description
            </Label>
            <input
              id='description'
              placeholder='Enter task description (optional)'
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className='w-full bg-transparent text-foreground placeholder-gray-400 text-lg border-b-2 border-gray-200 focus:border-lavender-700 transition-colors duration-300 focus:outline-none focus:ring-0'
            />
            <p className='text-xs text-gray-500 mt-1'>Optional, you can attach a file below.</p>
          </div>

          <div>
            <Label htmlFor='file' className='text-sm font-medium'>
              Attach file
            </Label>
            <Input
              id='file'
              type='file'
              className='h-11'
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
