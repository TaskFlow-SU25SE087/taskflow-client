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
import { useState, useCallback } from 'react'

interface SprintEditMenuProps {
  sprint: {
    id: string
    name: string
    description: string
    startDate: string
    endDate: string
    status: number | string
  }
  onUpdateSprint: (data: {
    name: string
    description: string
    startDate: string
    endDate: string
    status: string // canonical: NotStarted | InProgress | Completed
  }) => Promise<void>
}

export function SprintEditMenu({ sprint, onUpdateSprint }: SprintEditMenuProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [name, setName] = useState(sprint.name)
  const [description, setDescription] = useState(sprint.description)
  const [startDate, setStartDate] = useState(sprint.startDate?.slice(0, 10) || '')
  const [endDate, setEndDate] = useState(sprint.endDate?.slice(0, 10) || '')
  // Map any incoming numeric / string code to canonical status
  const mapToCanonical = (raw: string | number): string => {
    const val = String(raw)
    const numeric = Number(val)
    // Numeric codes used elsewhere map to canonical
    if (val === 'NotStarted' || val === 'NOT_STARTED' || numeric === 0) return 'NotStarted'
    if (val === 'InProgress' || val === 'IN_PROGRESS' || numeric === 10000 || numeric === 1) return 'InProgress'
    if (val === 'Completed' || val === 'COMPLETED' || numeric === 20000 || numeric === 2) return 'Completed'
    // Fallback
    return 'NotStarted'
  }
  const [status, setStatus] = useState<string>(mapToCanonical(sprint.status))

  // When opening the dialog, always refresh local state from latest sprint props
  const handleOpenChange = useCallback(
    (open: boolean) => {
      setIsOpen(open)
      if (open) {
        // Re-sync all editable fields with the current sprint prop to avoid stale values
        setName(sprint.name)
        setDescription(sprint.description)
        setStartDate(sprint.startDate?.slice(0, 10) || '')
        setEndDate(sprint.endDate?.slice(0, 10) || '')
        setStatus(mapToCanonical(sprint.status))
      }
    },
    [sprint]
  )

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
      status // send canonical textual status
    })
    setIsOpen(false)
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
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
            >
              <option value='NotStarted'>Not Started</option>
              <option value='InProgress'>In Progress</option>
              <option value='Completed'>Completed</option>
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
