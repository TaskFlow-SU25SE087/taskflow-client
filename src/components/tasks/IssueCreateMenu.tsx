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
import { useIssues } from '@/hooks/useIssues'
import { CreateIssueRequest, IssuePriority, IssueType } from '@/types/issue'
import { AlertCircle } from 'lucide-react'
import React, { useState } from 'react'

interface IssueCreateMenuProps {
  projectId: string
  taskId: string
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

export const IssueCreateMenu: React.FC<IssueCreateMenuProps> = ({ projectId, taskId, onIssueCreated }) => {
  const { createIssue, isLoading } = useIssues()
  const { showToast } = useToastContext()
  const [open, setOpen] = useState(false)
  const [files, setFiles] = useState<File[]>([])

  const [formData, setFormData] = useState<CreateIssueRequest>({
    title: '',
    description: '',
    priority: IssuePriority.Medium,
    explanation: '',
    example: '',
    type: IssueType.Bug
  })

    projectId,
    taskId,
    open,
    isLoading,
    formData
  })

  const handleInputChange = (field: keyof CreateIssueRequest, value: string | number) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value
    }))
  }

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(event.target.files || [])
    setFiles(selectedFiles)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const issueData: CreateIssueRequest = {
      ...formData,
      files: files.length > 0 ? files : undefined
    }

      projectId,
      taskId,
      issueData
    })

    try {
      const res = await createIssue(projectId, taskId, issueData)
      if (res?.code === 200) {
        showToast({ title: 'Success', description: res?.message || 'Issue created successfully' })
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
        onIssueCreated?.()
      } else {
        showToast({ title: 'Error', description: res?.message || 'Failed to create issue', variant: 'destructive' })
      }
    } catch (error: any) {
      showToast({ title: 'Error', description: error.response?.data?.message || error.message || 'Failed to create issue', variant: 'destructive' })
    }
  }

  const resetForm = () => {
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
    setOpen(newOpen)
  }

  return (
    <Dialog open={open} onOpenChange={handleDialogChange}>
      <DialogTrigger asChild>
        <Button
          variant='outline'
          size='sm'
          className='gap-2'
        >
          <AlertCircle className='h-4 w-4' />
          Report Issue
        </Button>
      </DialogTrigger>
      <DialogContent className='max-w-2xl max-h-[90vh] overflow-y-auto'>
        <DialogHeader>
          <DialogTitle>Create New Issue</DialogTitle>
          <DialogDescription>Fill out the form below to report a new issue for this task.</DialogDescription>
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

          <div className='space-y-2'>
            <Label htmlFor='explanation'>Explanation (Optional)</Label>
            <Textarea
              id='explanation'
              value={formData.explanation}
              onChange={(e) => handleInputChange('explanation', e.target.value)}
              placeholder='Explain the issue in detail'
              rows={3}
            />
          </div>

          <div className='space-y-2'>
            <Label htmlFor='example'>Example (Optional)</Label>
            <Textarea
              id='example'
              value={formData.example}
              onChange={(e) => handleInputChange('example', e.target.value)}
              placeholder='Provide an example or steps to reproduce'
              rows={2}
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
              <Label htmlFor='files'>Files (Optional)</Label>
              <Input id='files' type='file' multiple onChange={handleFileChange} className='cursor-pointer' />
              {files.length > 0 && <div className='text-sm text-muted-foreground'>{files.length} file(s) selected</div>}
            </div>
          </div>

          <div className='flex justify-end gap-2 pt-4'>
            <Button type='button' variant='outline' onClick={resetForm} disabled={isLoading}>
              Reset
            </Button>
            <Button
              type='submit'
              disabled={isLoading}
            >
              {isLoading ? 'Creating...' : 'Create Issue'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
