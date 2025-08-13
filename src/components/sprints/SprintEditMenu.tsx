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
import { useState } from 'react'

interface SprintEditMenuProps {
  sprint: {
    id: string
    name: string
    description: string
    startDate: string
    endDate: string
    status: number
  }
  onUpdateSprint: (data: {
    name: string
    description: string
    startDate: string
    endDate: string
    status: number
  }) => Promise<void>
}

export function SprintEditMenu({ sprint, onUpdateSprint }: SprintEditMenuProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [name, setName] = useState(sprint.name)
  const [description, setDescription] = useState(sprint.description)
  const [startDate, setStartDate] = useState(sprint.startDate?.slice(0, 10) || '')
  const [endDate, setEndDate] = useState(sprint.endDate?.slice(0, 10) || '')
  const [status, setStatus] = useState(String(sprint.status))

  const toISOString = (date: string) => {
    if (!date) return ''
    return date.includes('T') ? date : new Date(date + 'T00:00:00').toISOString()
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return
    
    await onUpdateSprint({
      name,
      description,
      startDate: toISOString(startDate),
      endDate: toISOString(endDate),
      status: Number(status)
    })
    setIsOpen(false)
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant='outline' size='sm'>
          Edit
        </Button>
      </DialogTrigger>
      <DialogContent className='sm:max-w-[425px]'>
        <DialogHeader>
          <DialogTitle>Edit Sprint</DialogTitle>
          <DialogDescription>Update sprint details.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className='space-y-4'>
          <div className='space-y-2'>
            <Label htmlFor='name'>Sprint Name</Label>
            <Input id='name' value={name} onChange={(e) => setName(e.target.value)} required />
          </div>
          <div className='space-y-2'>
            <Label htmlFor='description'>Description</Label>
            <Input id='description' value={description} onChange={(e) => setDescription(e.target.value)} />
          </div>
          <div className='space-y-2'>
            <Label htmlFor='startDate'>Start Date</Label>
            <Input
              id='startDate'
              type='date'
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              required
            />
          </div>
          <div className='space-y-2'>
            <Label htmlFor='endDate'>End Date</Label>
            <Input id='endDate' type='date' value={endDate} onChange={(e) => setEndDate(e.target.value)} required />
          </div>
          <div className='space-y-2'>
            <Label htmlFor='status'>Status</Label>
            <select
              id='status'
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className='w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-lavender-500'
              required
            >
              <option value='10000'>In Progress</option>
              <option value='20000'>Completed</option>
              <option value='30000'>On Hold</option>
            </select>
          </div>
          <div className='flex justify-end gap-2'>
            <Button type='button' variant='outline' onClick={() => setIsOpen(false)}>
              Cancel
            </Button>
            <Button type='submit' className='bg-lavender-500 hover:bg-lavender-700'>
              Save
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
