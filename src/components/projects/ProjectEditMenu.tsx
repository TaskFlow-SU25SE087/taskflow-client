import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Project } from '@/types/project'
import { projectApi } from '@/api/projects'
import { useToast } from '@/hooks/use-toast'

interface ProjectEditMenuProps {
  project: Project
  onProjectUpdated: () => void
  trigger: React.ReactNode
}

export function ProjectEditMenu({ project, onProjectUpdated, trigger }: ProjectEditMenuProps) {
  const [title, setTitle] = useState(project.title)
  const [isOpen, setIsOpen] = useState(false)
  const { toast } = useToast()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await projectApi.editProject(project.id, title)
      toast({
        title: 'Success',
        description: 'Project name updated successfully'
      })
      onProjectUpdated()
      setIsOpen(false)
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update project name',
        variant: 'destructive'
      })
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className='sm:max-w-[425px]'>
        <DialogHeader>
          <DialogTitle>Edit Project Name</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className='space-y-4'>
          <div className='space-y-2'>
            <label htmlFor='title' className='text-sm font-medium'>
              Project Name
            </label>
            <Input
              id='title'
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder='Project name'
              required
            />
          </div>
          <div className='flex justify-end space-x-2'>
            <Button type='button' variant='outline' onClick={() => setIsOpen(false)}>
              Cancel
            </Button>
            <Button type='submit'>Save Changes</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
