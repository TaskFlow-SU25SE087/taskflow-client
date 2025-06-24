import { boardApi } from '@/api/boards'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/use-toast'
import { Loader2, SquarePlus } from 'lucide-react'
import { useState } from 'react'

interface TaskBoardCreateMenuProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  projectId: string
  onBoardCreated: () => void
  trigger?: React.ReactNode
}

export default function TaskBoardCreateMenu({
  isOpen,
  onOpenChange,
  projectId,
  onBoardCreated,
  trigger
}: TaskBoardCreateMenuProps) {
  const { toast } = useToast()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [status, setStatus] = useState('')
  const [description, setDescription] = useState('')

  const handleSubmit = async () => {
    if (!status.trim()) {
      toast({
        title: 'Validation Error',
        description: 'Please enter a board name',
        variant: 'destructive'
      })
      return
    }
    setIsSubmitting(true)
    try {
      await boardApi.createBoard(projectId, status.trim(), description.trim())
      toast({
        title: 'Success',
        description: 'Board created successfully'
      })
      onBoardCreated()
      onOpenChange(false)
      setStatus('')
      setDescription('')
    } catch (error) {
      console.error(error)
      toast({
        title: 'Error',
        description: 'Failed to create board. Please try again.',
        variant: 'destructive'
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const defaultTrigger = (
    <Button className='bg-lavender-500 hover:bg-lavender-700 text-white'>
      <SquarePlus className='mr-2 h-4 w-4' />
      Create Board
    </Button>
  )

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>{trigger || defaultTrigger}</DialogTrigger>
      <DialogContent className='sm:max-w-[425px]'>
        <DialogHeader>
          <DialogTitle className='text-2xl font-semibold'>Create New Board</DialogTitle>
        </DialogHeader>
        <div className='grid gap-4 py-4'>
          <div className='space-y-2'>
            <Label htmlFor='status' className='text-sm font-medium'>
              Board Name
            </Label>
            <Input
              id='status'
              placeholder='Enter board name (e.g., To Do, In Progress)'
              className='h-11'
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !isSubmitting) {
                  handleSubmit()
                }
              }}
            />
          </div>
          <div className='space-y-2'>
            <Label htmlFor='description' className='text-sm font-medium'>
              Description
            </Label>
            <Input
              id='description'
              placeholder='Enter board description (optional)'
              className='h-11'
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <div className='flex justify-end gap-3 pt-4'>
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
              className='px-8 bg-lavender-500 hover:bg-lavender-700 text-white focus:ring-0 focus-visible:ring-0 focus-visible:ring-offset-0'
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                  Creating...
                </>
              ) : (
                'Create Board'
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
