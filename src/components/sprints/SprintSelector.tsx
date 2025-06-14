import { Sprint } from '@/types/sprint'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { format } from 'date-fns'

interface SprintSelectorProps {
  sprints: Sprint[]
  onSprintSelect: (sprintId: string) => void
  trigger?: React.ReactNode
}

export function SprintSelector({ sprints, onSprintSelect, trigger }: SprintSelectorProps) {
  return (
    <Dialog>
      <DialogTrigger asChild>{trigger || <Button variant='secondary'>Select Sprint</Button>}</DialogTrigger>
      <DialogContent className='sm:max-w-[425px]'>
        <DialogHeader>
          <DialogTitle>Select Sprint</DialogTitle>
          <DialogDescription>Choose a sprint to move the task to</DialogDescription>
        </DialogHeader>
        <ScrollArea className='mt-4 max-h-[60vh]'>
          <div className='space-y-2'>
            {sprints.map((sprint) => (
              <Button
                key={sprint.id}
                variant='outline'
                className='w-full justify-start'
                onClick={() => onSprintSelect(sprint.id)}
              >
                <div className='flex flex-col items-start'>
                  <span className='font-medium'>{sprint.name}</span>
                  <span className='text-sm text-gray-500'>
                    {format(new Date(sprint.startDate), 'MMM d')} - {format(new Date(sprint.endDate), 'MMM d, yyyy')}
                  </span>
                </div>
              </Button>
            ))}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  )
}
