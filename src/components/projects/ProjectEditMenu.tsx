import { projectApi } from '@/api/projects'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { useToast } from '@/hooks/use-toast'
import { Project } from '@/types/project'
import { useState } from 'react'

interface ProjectEditMenuProps {
  project: Project
  onProjectUpdated: () => void
  trigger: React.ReactNode
}

export function ProjectEditMenu({ project, onProjectUpdated, trigger }: ProjectEditMenuProps) {
  const [title, setTitle] = useState(project.title)
  const [isOpen, setIsOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { toast } = useToast()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    
    try {
      console.log('Updating project title:', {
        id: project.id,
        title: title,
        originalTitle: project.title
      })

      const response = await projectApi.updateProject(project.id, title)
      
      console.log('Update response:', response)
      
      toast({
        title: 'Success',
        description: 'Project name updated successfully'
      })
      onProjectUpdated()
      setIsOpen(false)
    } catch (error: any) {
      console.error('Update project error:', error)
      console.error('Error response:', error.response?.data)
      
      const errorMessage = error.response?.data?.message || error.message || 'Failed to update project'
      toast({
        title: 'Error',
        description: `Update failed: ${errorMessage}`,
        variant: 'destructive'
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open)
    if (open) {
      // Reset form khi mở dialog
      setTitle(project.title)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className='sm:max-w-[425px]'>
        <DialogHeader>
          <DialogTitle>Edit Project Name</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className='space-y-4'>
          <div className='space-y-2'>
            <label htmlFor='title' className='text-sm font-medium'>
              Project Name *
            </label>
            <Input
              id='title'
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder='Project name'
              required
              disabled={isSubmitting}
            />
          </div>
          
          {project.description && (
            <div className='p-3 bg-gray-50 rounded-md'>
              <p className='text-sm text-gray-600 mb-2'>
                <strong>Current Description:</strong>
              </p>
              <p className='text-sm text-gray-700'>
                {project.description}
              </p>
              <p className='text-xs text-gray-500 mt-2'>
                ⚠️ Description editing is not supported by the current API.
              </p>
            </div>
          )}
          
          <div className='flex justify-end space-x-2'>
            <Button 
              type='button' 
              variant='outline' 
              onClick={() => setIsOpen(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button 
              type='submit'
              disabled={isSubmitting || !title.trim()}
            >
              {isSubmitting ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
