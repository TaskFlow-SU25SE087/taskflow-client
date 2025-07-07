import { issueApi } from '@/api/issues'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { useToast } from '@/hooks/useToast'
import { CreateIssueRequest, IssuePriority, IssueType } from '@/types/issue'
import { AlertCircle } from 'lucide-react'
import React, { useState } from 'react'

interface IssueExampleProps {
  projectId: string
  taskId: string
}

export const IssueExample: React.FC<IssueExampleProps> = ({ projectId, taskId }) => {
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState<CreateIssueRequest>({
    title: '',
    description: '',
    priority: IssuePriority.Medium,
    explanation: '',
    example: '',
    type: IssueType.Bug,
  })

  console.log('🎨 [IssueExample] Component rendered with:', {
    projectId,
    taskId,
    isLoading,
    formData
  })

  const handleInputChange = (field: keyof CreateIssueRequest, value: string | number) => {
    console.log('✏️ [IssueExample] Input changed:', { field, value })
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    console.log('🚀 [IssueExample] Form submitted!')
    console.log('📋 [IssueExample] Form data:', formData)
    setIsLoading(true)

    try {
      console.log('📞 [IssueExample] Calling issueApi.createIssue directly...')
      const success = await issueApi.createIssue(projectId, taskId, formData)
      
      console.log('📊 [IssueExample] Direct API call result:', success)
      
      if (success) {
        console.log('✅ [IssueExample] Issue created successfully, showing success toast')
        toast({
          title: 'Success',
          description: 'Issue created successfully using direct API call!',
          variant: 'default',
        })
        
        // Reset form
        setFormData({
          title: '',
          description: '',
          priority: IssuePriority.Medium,
          explanation: '',
          example: '',
          type: IssueType.Bug,
        })
      } else {
        console.log('❌ [IssueExample] API returned false, showing error toast')
        toast({
          title: 'Error',
          description: 'Failed to create issue',
          variant: 'destructive',
        })
      }
    } catch (error) {
      console.error('💥 [IssueExample] Exception caught:', error)
      toast({
        title: 'Error',
        description: 'An error occurred while creating the issue',
        variant: 'destructive',
      })
    } finally {
      console.log('🏁 [IssueExample] Setting loading to false')
      setIsLoading(false)
    }
  }

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertCircle className="h-5 w-5" />
          Direct API Example - Create Issue
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          This example demonstrates direct API usage for creating issues.
        </p>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => handleInputChange('title', e.target.value)}
                placeholder="Issue title"
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="type">Type *</Label>
              <Select
                value={formData.type.toString()}
                onValueChange={(value) => handleInputChange('type', parseInt(value))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={IssueType.Bug.toString()}>Bug</SelectItem>
                  <SelectItem value={IssueType.FeatureRequest.toString()}>Feature Request</SelectItem>
                  <SelectItem value={IssueType.Improvement.toString()}>Improvement</SelectItem>
                  <SelectItem value={IssueType.Task.toString()}>Task</SelectItem>
                  <SelectItem value={IssueType.Documentation.toString()}>Documentation</SelectItem>
                  <SelectItem value={IssueType.Other.toString()}>Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description *</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              placeholder="Describe the issue in detail"
              rows={3}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="explanation">Explanation (Optional)</Label>
            <Textarea
              id="explanation"
              value={formData.explanation}
              onChange={(e) => handleInputChange('explanation', e.target.value)}
              placeholder="Explain the issue in detail"
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="example">Example (Optional)</Label>
            <Textarea
              id="example"
              value={formData.example}
              onChange={(e) => handleInputChange('example', e.target.value)}
              placeholder="Provide an example or steps to reproduce"
              rows={2}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="priority">Priority *</Label>
            <Select
              value={formData.priority.toString()}
              onValueChange={(value) => handleInputChange('priority', parseInt(value))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={IssuePriority.Low.toString()}>Low</SelectItem>
                <SelectItem value={IssuePriority.Medium.toString()}>Medium</SelectItem>
                <SelectItem value={IssuePriority.High.toString()}>High</SelectItem>
                <SelectItem value={IssuePriority.Urgent.toString()}>Urgent</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                console.log('🔄 [IssueExample] Resetting form')
                setFormData({
                  title: '',
                  description: '',
                  priority: IssuePriority.Medium,
                  explanation: '',
                  example: '',
                  type: IssueType.Bug,
                })
              }}
              disabled={isLoading}
            >
              Reset
            </Button>
            <Button 
              type="submit" 
              disabled={isLoading}
              onClick={() => console.log('🔘 [IssueExample] Create Issue button clicked')}
            >
              {isLoading ? 'Creating...' : 'Create Issue (Direct API)'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
} 