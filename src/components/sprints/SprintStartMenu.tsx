import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useState } from 'react'

interface SprintStartMenuProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  onStartSprint: (startDate: string, endDate: string) => Promise<void>
}

export function SprintStartMenu({ isOpen, onOpenChange, onStartSprint }: SprintStartMenuProps) {
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleStartSprint = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!startDate || !endDate) return

    setIsLoading(true)
    try {
      await onStartSprint(startDate, endDate)
      onOpenChange(false)
      setStartDate('')
      setEndDate('')
    } catch (error) {
      console.error('Failed to start sprint:', error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className='sm:max-w-[425px]'>
        <DialogHeader>
          <DialogTitle>Start Sprint</DialogTitle>
          <DialogDescription>Set the start and end dates for this sprint.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleStartSprint} className='space-y-4'>
          <div className='space-y-4'>
            <div className='space-y-2'>
              <label className='text-sm font-medium'>Start Date</label>
              <Input type='date' value={startDate} onChange={(e) => setStartDate(e.target.value)} required />
            </div>
            <div className='space-y-2'>
              <label className='text-sm font-medium'>End Date</label>
              <Input
                type='date'
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                min={startDate}
                required
              />
            </div>
          </div>
          <div className='flex justify-end gap-2'>
            <Button type='button' variant='outline' onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button
              type='submit'
              disabled={!startDate || !endDate || isLoading}
              className='bg-lavender-500 hover:bg-lavender-700'
            >
              {isLoading ? 'Starting...' : 'Start Sprint'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
