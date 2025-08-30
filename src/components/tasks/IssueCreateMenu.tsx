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
import { useIssues } from '@/hooks/useIssues'
import { CreateIssueRequest } from '@/types/issue'
import { AlertCircle, Bug, ChevronDown, ChevronUp, ChevronsDown, ChevronsUp, FileText, Lightbulb, Loader2, MessageSquare, Plus, X } from 'lucide-react'
import React, { useState } from 'react'

interface IssueCreateMenuProps {
  projectId: string
  taskId: string
  onIssueCreated?: () => void
}

const priorityOptions = [
  { value: 0, label: 'Low', color: 'text-blue-600', icon: ChevronDown },
  { value: 10000, label: 'Medium', color: 'text-orange-600', icon: ChevronsDown },
  { value: 20000, label: 'High', color: 'text-red-600', icon: ChevronUp },
  { value: 30000, label: 'Urgent', color: 'text-red-800', icon: ChevronsUp }
]

const typeOptions = [
  { value: 10000, label: 'Bug', icon: Bug, color: 'text-red-600' },
  { value: 20000, label: 'Feature Request', icon: Plus, color: 'text-green-600' },
  { value: 30000, label: 'Improvement', icon: Lightbulb, color: 'text-blue-600' },
  { value: 40000, label: 'Sub Task', icon: MessageSquare, color: 'text-purple-600' },
  { value: 50000, label: 'Documentation', icon: FileText, color: 'text-indigo-600' },
  { value: 60000, label: 'Other', icon: X, color: 'text-gray-600' }
]

export const IssueCreateMenu: React.FC<IssueCreateMenuProps> = ({ projectId, taskId, onIssueCreated }) => {
  const { createIssue, isLoading } = useIssues()
  const [open, setOpen] = useState(false)
  const [files, setFiles] = useState<File[]>([])

  const [formData, setFormData] = useState<CreateIssueRequest>({
    title: '',
    description: '',
    priority: 10000, // Medium/Trung bình
    explanation: '',
    example: '',
    type: 10000 // Bug
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

    try {
      const res = await createIssue(projectId, taskId, issueData) as any
      if (res) {
        // Issue created successfully - useIssues already shows success toast
        
        // Đóng dialog với delay nhỏ để user thấy thông báo
        setTimeout(() => {
          setOpen(false)
          // Reset form
          setFormData({
            title: '',
            description: '',
            priority: 10000, // Medium/Trung bình
            explanation: '',
            example: '',
            type: 10000 // Bug
          })
          setFiles([])
          // Gọi callback để update realtime
          onIssueCreated?.()
        }, 1000)
      }
    } catch (error: any) {
      // Exception occurred - useIssues already shows error toast
    }
  }

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      priority: 10000, // Medium/Trung bình
      explanation: '',
      example: '',
      type: 10000 // Bug
    })
    setFiles([])
  }

  const handleDialogChange = (newOpen: boolean) => {
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
        >
          <AlertCircle className='h-4 w-4' />
          Report Issue
        </Button>
      </DialogTrigger>
      <DialogContent className='max-w-2xl max-h-[90vh] overflow-y-auto'>
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-gray-900">Create New Issue</DialogTitle>
          <DialogDescription>Fill out the form below to report a new issue for this task.</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className='space-y-6'>
          <div className='grid grid-cols-2 gap-4'>
            <div className='space-y-2'>
              <Label htmlFor='title' className="text-sm font-medium text-gray-700">Title *</Label>
              <Input
                id='title'
                value={formData.title}
                onChange={(e) => handleInputChange('title', e.target.value)}
                placeholder='Issue title'
                required
                className="w-full"
              />
            </div>

            <div className='space-y-2'>
              <Label htmlFor='type' className="text-sm font-medium text-gray-700">Type *</Label>
              <Select
                value={formData.type.toString()}
                onValueChange={(value) => handleInputChange('type', parseInt(value))}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder='Select type'>
                    {(() => {
                      const selectedType = typeOptions.find(type => type.value === formData.type);
                      if (selectedType) {
                        const TypeIcon = selectedType.icon;
                        return (
                          <div className="flex items-center gap-2">
                            <TypeIcon className={`w-4 h-4 ${selectedType.color}`} />
                            {selectedType.label}
                          </div>
                        );
                      }
                      return "Select type";
                    })()}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent className="max-h-48 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100" position="popper">
                  {typeOptions.map((type) => {
                    const TypeIcon = type.icon
                    return (
                      <SelectItem key={type.value} value={type.value.toString()} className="flex items-center gap-2 py-2 cursor-pointer">
                        <TypeIcon className={`w-4 h-4 ${type.color}`} />
                        {type.label}
                      </SelectItem>
                    )
                  })}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className='space-y-2'>
            <Label htmlFor='description' className="text-sm font-medium text-gray-700">Description *</Label>
            <Textarea
              id='description'
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              placeholder='Describe the issue in detail'
              rows={4}
              required
              className="w-full"
            />
          </div>

          <div className='space-y-2'>
            <Label htmlFor='explanation' className="text-sm font-medium text-gray-700">Explanation (Optional)</Label>
            <Textarea
              id='explanation'
              value={formData.explanation}
              onChange={(e) => handleInputChange('explanation', e.target.value)}
              placeholder='Explain the issue in detail'
              rows={3}
              className="w-full"
            />
          </div>

          <div className='space-y-2'>
            <Label htmlFor='example' className="text-sm font-medium text-gray-700">Example (Optional)</Label>
            <Textarea
              id='example'
              value={formData.example}
              onChange={(e) => handleInputChange('example', e.target.value)}
              placeholder='Provide an example or steps to reproduce'
              rows={3}
              className="w-full"
            />
          </div>

          <div className='grid grid-cols-2 gap-4'>
            <div className='space-y-2'>
              <Label htmlFor='priority' className="text-sm font-medium text-gray-700">Priority *</Label>
              <Select
                value={formData.priority.toString()}
                onValueChange={(value) => handleInputChange('priority', parseInt(value))}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder='Select priority'>
                    {(() => {
                      const selectedPriority = priorityOptions.find(priority => priority.value === formData.priority);
                      if (selectedPriority) {
                        const PriorityIcon = selectedPriority.icon;
                        return (
                          <div className="flex items-center gap-2">
                            <PriorityIcon className={`w-4 h-4 ${selectedPriority.color}`} />
                            {selectedPriority.label}
                          </div>
                        );
                      }
                      return "Select priority";
                    })()}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent className="max-h-48 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100" position="popper">
                  {priorityOptions.map((priority) => {
                    const PriorityIcon = priority.icon;
                    return (
                      <SelectItem key={priority.value} value={priority.value.toString()} className="flex items-center gap-2 py-2 cursor-pointer">
                        <PriorityIcon className={`w-4 h-4 ${priority.color}`} />
                        {priority.label}
                      </SelectItem>
                    )
                  })}
                </SelectContent>
              </Select>
            </div>

            <div className='space-y-2'>
              <Label htmlFor='files' className="text-sm font-medium text-gray-700">Files (Optional)</Label>
              <Input 
                id='files' 
                type='file' 
                multiple 
                onChange={handleFileChange} 
                className="cursor-pointer"
                accept='.jpg,.jpeg,.png,.gif,.pdf,.doc,.docx,.txt'
              />
              {files.length > 0 && (
                <div className="text-sm text-gray-600">
                  Selected files: {files.map(f => f.name).join(', ')}
                </div>
              )}
            </div>
          </div>

          <div className='flex justify-end gap-3 pt-4'>
            <Button 
              type='button' 
              variant='outline' 
              onClick={resetForm} 
              disabled={isLoading}
              className="px-6"
            >
              Reset
            </Button>
            <Button
              type='submit'
              disabled={isLoading || !formData.title.trim() || !formData.description.trim()}
              className='px-6 flex items-center gap-2'
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Plus className='h-4 w-4 flex-shrink-0' />
              )}
              {isLoading ? 'Creating...' : 'Create Issue'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
