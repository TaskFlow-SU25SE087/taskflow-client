import { useState } from 'react'
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

interface SprintCreateMenuProps {
  onCreateSprint: (data: { name: string }) => Promise<void>
}

export function SprintCreateMenu({ onCreateSprint }: SprintCreateMenuProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [name, setName] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    await onCreateSprint({ name })
    setIsOpen(false)
    setName('')
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button className='bg-lavender-500 hover:bg-lavender-700 text-white'>Create Sprint</Button>
      </DialogTrigger>
      <DialogContent className='sm:max-w-[425px]'>
        <DialogHeader>
          <DialogTitle>Create New Sprint</DialogTitle>
          <DialogDescription>Set up a new sprint for your project. Add a name and date range.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className='space-y-4'>
          <div className='space-y-2'>
            <Label htmlFor='name'>Sprint Name</Label>
            <Input id='name' value={name} onChange={(e) => setName(e.target.value)} placeholder='Sprint 1' required />
          </div>
          <div className='flex justify-end gap-2'>
            <Button type='button' variant='outline' onClick={() => setIsOpen(false)}>
              Cancel
            </Button>
            <Button type='submit' className='bg-lavender-500 hover:bg-lavender-700'>
              Create Sprint
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
