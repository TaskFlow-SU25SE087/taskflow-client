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
import { Textarea } from '@/components/ui/textarea'
import { useToastContext } from '@/components/ui/ToastContext'
import axiosClient from '@/configs/axiosClient'
import { useIssues } from '@/hooks/useIssues'
import { CreateIssueRequest, IssuePriority, IssueType } from '@/types/issue'
import { AlertCircle } from 'lucide-react'
import React, { useEffect, useState } from 'react'

interface ProjectIssueCreateMenuProps {
  projectId: string
  onIssueCreated?: () => void
}

const priorityOptions = [
  { value: IssuePriority.Low, label: 'Low' },
  { value: IssuePriority.Medium, label: 'Medium' },
  { value: IssuePriority.High, label: 'High' },
  { value: IssuePriority.Urgent, label: 'Urgent' }
]

const typeOptions = [
  { value: IssueType.Bug, label: 'Bug' },
  { value: IssueType.FeatureRequest, label: 'Feature Request' },
  { value: IssueType.Improvement, label: 'Improvement' },
  { value: IssueType.Task, label: 'Task' },
  { value: IssueType.Documentation, label: 'Documentation' },
  { value: IssueType.Other, label: 'Other' }
]

export const ProjectIssueCreateMenu: React.FC<ProjectIssueCreateMenuProps> = ({ projectId, onIssueCreated }) => {
  const { createProjectIssue, isLoading } = useIssues()
  const { showToast } = useToastContext()
  const [open, setOpen] = useState(false)
  const [files, setFiles] = useState<File[]>([])
  const [tasks, setTasks] = useState<any[]>([])
  const [selectedTaskId, setSelectedTaskId] = useState<string>('')

  const [formData, setFormData] = useState<CreateIssueRequest>({
    title: '',
    description: '',
    priority: IssuePriority.Medium,
    explanation: '',
    example: '',
    type: IssueType.Bug
  })

  // Load tasks when component mounts
  useEffect(() => {
    const loadTasks = async () => {
      try {
        const response = await axiosClient.get(`/projects/${projectId}/tasks`)
        const tasksData = response.data?.data || []
        setTasks(tasksData)
        if (tasksData.length > 0) {
          setSelectedTaskId(tasksData[0].id)
        }
      } catch (error) {
        console.error('Failed to load tasks:', error)
        showToast({
          title: 'Error',
          description: 'Failed to load tasks',
          variant: 'destructive'
        })
      }
    }

    if (projectId) {
      loadTasks()
    }
  }, [projectId, showToast])

  console.log('🎨 [ProjectIssueCreateMenu] Component rendered with:', {
    projectId,
    open,
    isLoading,
    formData
  })

  const handleInputChange = (field: keyof CreateIssueRequest, value: string | number) => {
    console.log('✏️ [ProjectIssueCreateMenu] Input changed:', { field, value })
    setFormData((prev) => ({
      ...prev,
      [field]: value
    }))
  }

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(event.target.files || [])
    console.log('📁 [ProjectIssueCreateMenu] Files selected:', selectedFiles)
    setFiles(selectedFiles)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    console.log('🚀 [ProjectIssueCreateMenu] Form submitted!')
    console.log('📋 [ProjectIssueCreateMenu] Form data:', formData)
    console.log('📁 [ProjectIssueCreateMenu] Files:', files)

    const issueData: CreateIssueRequest = {
      ...formData,
      files: files.length > 0 ? files : undefined
    }

    console.log('📤 [ProjectIssueCreateMenu] Calling createProjectIssue with:', {
      projectId,
      issueData
    })

    try {
      // Use the selected task ID instead of createProjectIssue
      const response = await axiosClient.post(`/projects/${projectId}/tasks/${selectedTaskId}/issues/create`, issueData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      
      if (response.data && (response.data.code === 200 || response.data.code === 0)) {
        showToast({ 
          title: 'Success', 
          description: response.data.message || 'Issue created successfully' 
        })
        setOpen(false)
        setFormData({
          title: '',
          description: '',
          priority: IssuePriority.Medium,
          explanation: '',
          example: '',
          type: IssueType.Bug
        })
        setFiles([])
        setSelectedTaskId(tasks.length > 0 ? tasks[0].id : '')
        onIssueCreated?.()
      } else {
        showToast({ 
          title: 'Error', 
          description: response.data?.message || 'Failed to create issue', 
          variant: 'destructive' 
        })
      }
    } catch (error: any) {
      showToast({ 
        title: 'Error', 
        description: error.response?.data?.message || error.message || 'Failed to create issue', 
        variant: 'destructive' 
      })
    }
  }

  const resetForm = () => {
    console.log('🔄 [ProjectIssueCreateMenu] Resetting form')
    setFormData({
      title: '',
      description: '',
      priority: IssuePriority.Medium,
      explanation: '',
      example: '',
      type: IssueType.Bug
    })
    setFiles([])
  }

  const handleDialogChange = (newOpen: boolean) => {
    console.log('🚪 [ProjectIssueCreateMenu] Dialog open state changing to:', newOpen)
    setOpen(newOpen)
    if (!newOpen) {
      resetForm()
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleDialogChange}>
      <DialogTrigger asChild>
        <Button
          variant='outline'
          size='sm'
          className='gap-2'
          onClick={() => console.log('🔘 [ProjectIssueCreateMenu] Report Issue button clicked')}
        >
          <AlertCircle className='h-4 w-4' />
          Report Issue
        </Button>
      </DialogTrigger>
      <DialogContent className='max-w-2xl max-h-[90vh] overflow-y-auto'>
        <DialogHeader>
          <DialogTitle>Create New Issue</DialogTitle>
          <DialogDescription>Fill out the form below to report a new issue for this project.</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className='space-y-4'>
          <div className='grid grid-cols-2 gap-4'>
            <div className='space-y-2'>
              <Label htmlFor='title'>Title *</Label>
              <Input
                id='title'
                value={formData.title}
                onChange={(e) => handleInputChange('title', e.target.value)}
                placeholder='Issue title'
                required
              />
            </div>

            <div className='space-y-2'>
              <Label htmlFor='type'>Type *</Label>
              <Select
                value={formData.type.toString()}
                onValueChange={(value) => handleInputChange('type', parseInt(value))}
              >
                <SelectTrigger>
                  <SelectValue placeholder='Select type' />
                </SelectTrigger>
                <SelectContent>
                  {typeOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value.toString()}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className='space-y-2'>
            <Label htmlFor='task'>Task *</Label>
            <Select
              value={selectedTaskId}
              onValueChange={setSelectedTaskId}
            >
              <SelectTrigger>
                <SelectValue placeholder='Select task' />
              </SelectTrigger>
              <SelectContent>
                {tasks.map((task) => (
                  <SelectItem key={task.id} value={task.id}>
                    {task.title || task.name || `Task ${task.id}`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className='space-y-2'>
            <Label htmlFor='description'>Description *</Label>
            <Textarea
              id='description'
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              placeholder='Describe the issue in detail'
              rows={3}
              required
            />
          </div>

          <div className='grid grid-cols-2 gap-4'>
            <div className='space-y-2'>
              <Label htmlFor='priority'>Priority *</Label>
              <Select
                value={formData.priority.toString()}
                onValueChange={(value) => handleInputChange('priority', parseInt(value))}
              >
                <SelectTrigger>
                  <SelectValue placeholder='Select priority' />
                </SelectTrigger>
                <SelectContent>
                  {priorityOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value.toString()}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className='space-y-2'>
              <Label htmlFor='files'>Attachments</Label>
              <Input
                id='files'
                type='file'
                multiple
                onChange={handleFileChange}
                accept='.jpg,.jpeg,.png,.gif,.pdf,.doc,.docx,.txt'
              />
            </div>
          </div>

          <div className='space-y-2'>
            <Label htmlFor='explanation'>Explanation</Label>
            <Textarea
              id='explanation'
              value={formData.explanation}
              onChange={(e) => handleInputChange('explanation', e.target.value)}
              placeholder='Additional explanation (optional)'
              rows={2}
            />
          </div>

          <div className='space-y-2'>
            <Label htmlFor='example'>Example</Label>
            <Textarea
              id='example'
              value={formData.example}
              onChange={(e) => handleInputChange('example', e.target.value)}
              placeholder='Provide an example (optional)'
              rows={2}
            />
          </div>

          <div className='flex justify-end gap-2 pt-4'>
            <Button
              type='button'
              variant='outline'
              onClick={() => setOpen(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              type='submit'
              disabled={isLoading || !formData.title || !formData.description || !selectedTaskId}
            >
              {isLoading ? 'Creating...' : 'Create Issue'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
} 