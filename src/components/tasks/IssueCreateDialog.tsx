import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { useIssues } from '@/hooks/useIssues'
import { IssuePriority, IssueType } from '@/types/issue'
import { Bug, FileText, Lightbulb, MessageSquare, Plus, X } from 'lucide-react'
import { useState } from 'react'

interface IssueCreateDialogProps {
  isOpen: boolean
  onClose: () => void
  projectId: string
  onIssueCreated?: () => void
}

export default function IssueCreateDialog({ isOpen, onClose, projectId, onIssueCreated }: IssueCreateDialogProps) {
  const { createProjectIssue, isLoading } = useIssues()
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    type: IssueType.Bug,
    priority: IssuePriority.Medium,
    explanation: '',
    example: ''
  })
  const [files, setFiles] = useState<File[]>([])

  const typeOptions = [
    { value: IssueType.Bug, label: 'Bug', icon: Bug, color: 'text-red-600' },
    { value: IssueType.FeatureRequest, label: 'Feature Request', icon: Plus, color: 'text-green-600' },
    { value: IssueType.Improvement, label: 'Improvement', icon: Lightbulb, color: 'text-blue-600' },
    { value: IssueType.Task, label: 'Task', icon: MessageSquare, color: 'text-purple-600' },
    { value: IssueType.Documentation, label: 'Documentation', icon: FileText, color: 'text-indigo-600' },
    { value: IssueType.Other, label: 'Other', icon: X, color: 'text-gray-600' }
  ]

  const priorityOptions = [
    { value: IssuePriority.Low, label: 'Low', color: 'text-blue-600' },
    { value: IssuePriority.Medium, label: 'Medium', color: 'text-orange-600' },
    { value: IssuePriority.High, label: 'High', color: 'text-red-600' },
    { value: IssuePriority.Urgent, label: 'Urgent', color: 'text-red-800' }
  ]

  const handleInputChange = (field: string, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(event.target.files || [])
    setFiles(selectedFiles)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.title.trim() || !formData.description.trim()) {
      return
    }

    try {
      const success = await createProjectIssue(projectId, {
        ...formData,
        files
      })

      if (success) {
        // Reset form
        setFormData({
          title: '',
          description: '',
          type: IssueType.Bug,
          priority: IssuePriority.Medium,
          explanation: '',
          example: ''
        })
        setFiles([])
        
        // Close dialog and refresh
        onClose()
        onIssueCreated?.()
      }
    } catch (error) {
      console.error('Error creating issue:', error)
    }
  }

  const handleReset = () => {
    setFormData({
      title: '',
      description: '',
      type: IssueType.Bug,
      priority: IssuePriority.Medium,
      explanation: '',
      example: ''
    })
    setFiles([])
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-gray-900">Create New Issue</DialogTitle>
          <DialogDescription>
            Fill out the form below to report a new issue for this task.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title" className="text-sm font-medium text-gray-700">
              Title *
            </Label>
            <Input
              id="title"
              placeholder="Issue title"
              value={formData.title}
              onChange={(e) => handleInputChange('title', e.target.value)}
              required
              className="w-full"
            />
          </div>

          {/* Type */}
          <div className="space-y-2">
            <Label htmlFor="type" className="text-sm font-medium text-gray-700">
              Type *
            </Label>
            <Select value={formData.type.toString()} onValueChange={(value) => handleInputChange('type', parseInt(value))}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select issue type" />
              </SelectTrigger>
              <SelectContent>
                {typeOptions.map((type) => {
                  const TypeIcon = type.icon
                  return (
                    <SelectItem key={type.value} value={type.value.toString()} className="flex items-center gap-2">
                      <TypeIcon className={`w-4 h-4 ${type.color}`} />
                      {type.label}
                    </SelectItem>
                  )
                })}
              </SelectContent>
            </Select>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description" className="text-sm font-medium text-gray-700">
              Description *
            </Label>
            <Textarea
              id="description"
              placeholder="Describe the issue in detail"
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              required
              rows={4}
              className="w-full"
            />
          </div>

          {/* Explanation (Optional) */}
          <div className="space-y-2">
            <Label htmlFor="explanation" className="text-sm font-medium text-gray-700">
              Explanation (Optional)
            </Label>
            <Textarea
              id="explanation"
              placeholder="Explain the issue in detail"
              value={formData.explanation}
              onChange={(e) => handleInputChange('explanation', e.target.value)}
              rows={3}
              className="w-full"
            />
          </div>

          {/* Example (Optional) */}
          <div className="space-y-2">
            <Label htmlFor="example" className="text-sm font-medium text-gray-700">
              Example (Optional)
            </Label>
            <Textarea
              id="example"
              placeholder="Provide an example or steps to reproduce"
              value={formData.example}
              onChange={(e) => handleInputChange('example', e.target.value)}
              rows={3}
              className="w-full"
            />
          </div>

          {/* Priority */}
          <div className="space-y-2">
            <Label htmlFor="priority" className="text-sm font-medium text-gray-700">
              Priority *
            </Label>
            <Select value={formData.priority.toString()} onValueChange={(value) => handleInputChange('priority', parseInt(value))}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select priority" />
              </SelectTrigger>
              <SelectContent>
                {priorityOptions.map((priority) => (
                  <SelectItem key={priority.value} value={priority.value.toString()} className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${priority.color.replace('text-', 'bg-')}`}></span>
                    {priority.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Files (Optional) */}
          <div className="space-y-2">
            <Label htmlFor="files" className="text-sm font-medium text-gray-700">
              Files (Optional)
            </Label>
            <Input
              id="files"
              type="file"
              multiple
              onChange={handleFileChange}
              className="w-full"
            />
            {files.length > 0 && (
              <div className="text-sm text-gray-600">
                Selected files: {files.map(f => f.name).join(', ')}
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleReset}
              disabled={isLoading}
              className="px-6"
            >
              Reset
            </Button>
            <Button
              type="submit"
              disabled={isLoading || !formData.title.trim() || !formData.description.trim()}
              className="px-6 flex items-center gap-2"
            >
              <Plus className="h-4 w-4 flex-shrink-0" />
              {isLoading ? 'Creating...' : 'Create Issue'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
} 