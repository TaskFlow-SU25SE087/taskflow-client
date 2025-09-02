import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToastContext } from '@/components/ui/ToastContext'
import { useSprints } from '@/hooks/useSprints'
import { Edit, Loader2, MoreHorizontal, Trash2 } from 'lucide-react'
import { useCallback, useState } from 'react'

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
  onSprintDeleted?: () => void
  isMember?: boolean
}

export function SprintEditMenu({ sprint, onUpdateSprint, onSprintDeleted, isMember = false }: SprintEditMenuProps) {
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [name, setName] = useState(sprint.name)
  const [description, setDescription] = useState(sprint.description)
  const [startDate, setStartDate] = useState(sprint.startDate?.slice(0, 10) || '')
  const [endDate, setEndDate] = useState(sprint.endDate?.slice(0, 10) || '')
  const { deleteSprint } = useSprints()
  const { showToast } = useToastContext()

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

  // When opening the edit dialog, always refresh local state from latest sprint props
  const handleEditOpenChange = useCallback(
    (open: boolean) => {
      setIsEditOpen(open)
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
    // If date already contains time (has 'T'), return as is
    if (date.includes('T')) return date
    // Convert date string (YYYY-MM-DD) to ISO string with timezone
    const dateObj = new Date(date + 'T00:00:00.000Z')
    return dateObj.toISOString()
  }

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return

    try {
      await onUpdateSprint({
        name,
        description,
        startDate: toISOString(startDate),
        endDate: toISOString(endDate),
        status // send canonical textual status
      })

      showToast({
        title: 'Success',
        description: `Sprint "${name}" was updated successfully.`,
        variant: 'success'
      })
      setIsEditOpen(false)
    } catch {
      showToast({
        title: 'Error',
        description: 'Failed to update sprint. Please try again.',
        variant: 'destructive'
      })
    }
  }

  const handleDelete = async () => {
    setDeleting(true)
    try {
      const success = await deleteSprint(sprint.id)

      if (success) {
        showToast({
          title: 'Success',
          description: `Sprint "${sprint.name}" was deleted successfully.`,
          variant: 'success'
        })
        setIsDeleteOpen(false)
        onSprintDeleted?.()
      } else {
        showToast({
          title: 'Error',
          description: 'Failed to delete sprint. Please try again.',
          variant: 'destructive'
        })
      }
    } catch {
      showToast({
        title: 'Error',
        description: 'Failed to delete sprint. Please try again.',
        variant: 'destructive'
      })
    } finally {
      setDeleting(false)
    }
  }

  // Hide the button for members
  if (isMember) {
    return null
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant='ghost' size='sm' className='h-8 w-8 p-0'>
            <MoreHorizontal className='h-4 w-4' />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align='end'>
          <DropdownMenuItem onClick={() => setIsEditOpen(true)}>
            <Edit className='mr-2 h-4 w-4' />
            Edit Sprint
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setIsDeleteOpen(true)} className='text-red-600 focus:text-red-600'>
            <Trash2 className='mr-2 h-4 w-4' />
            Delete Sprint
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Edit Dialog */}
      <Dialog open={isEditOpen} onOpenChange={handleEditOpenChange}>
        <DialogContent className='sm:max-w-[425px]'>
          <DialogHeader>
            <DialogTitle>Edit Sprint</DialogTitle>
            <DialogDescription>Update sprint details.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleEditSubmit} className='space-y-4'>
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
              <Button type='button' variant='outline' onClick={() => setIsEditOpen(false)}>
                Cancel
              </Button>
              <Button type='submit' className='bg-lavender-500 hover:bg-lavender-700'>
                Save
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteOpen} onOpenChange={(v) => !deleting && setIsDeleteOpen(v)}>
        <DialogContent className='max-w-md p-0 overflow-hidden'>
          <div className='p-6 pb-4'>
            <DialogHeader className='items-center'>
              <div className='flex flex-col items-center gap-4'>
                <div className='w-14 h-14 rounded-xl bg-red-100 flex items-center justify-center'>
                  <Trash2 className='h-7 w-7 text-red-600' />
                </div>
                <div className='text-center'>
                  <DialogTitle className='text-xl font-semibold'>Delete Sprint</DialogTitle>
                  <DialogDescription className='mt-1 text-sm text-gray-500'>
                    This action cannot be undone.
                  </DialogDescription>
                </div>
              </div>
            </DialogHeader>

            <div className='mt-6 flex gap-3 rounded-lg border border-red-200 bg-red-50/70 px-4 py-3'>
              <div className='mt-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-red-100 text-[11px] font-semibold text-red-600'>
                !
              </div>
              <div className='text-sm text-red-700'>
                <p className='font-medium'>You're about to permanently delete this sprint.</p>
                <p className='mt-1'>
                  Sprint: <span className='font-semibold'>{sprint.name}</span>
                </p>
                <p className='mt-1 text-red-600'>All tasks in this sprint will be moved back to the backlog.</p>
              </div>
            </div>
          </div>

          <div className='px-6 py-4 border-t flex gap-3 justify-end'>
            <Button variant='outline' disabled={deleting} onClick={() => setIsDeleteOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleDelete} disabled={deleting} className='bg-red-600 hover:bg-red-700 text-white'>
              {deleting ? (
                <>
                  <Loader2 className='h-4 w-4 animate-spin mr-2' />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className='h-4 w-4 mr-2' />
                  Delete Sprint
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
