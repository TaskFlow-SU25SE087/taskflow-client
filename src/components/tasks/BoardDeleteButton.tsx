import { boardApi } from '@/api/boards'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { useToastContext } from '@/components/ui/ToastContext'
import { Trash2 } from 'lucide-react'
import { useState } from 'react'
import { APIError } from '@/types/api'

interface BoardDeleteButtonProps {
  projectId: string
  boardId: string
  onDeleted: () => void
  trigger?: React.ReactNode // add this
}

export function BoardDeleteButton({ projectId, boardId, onDeleted, trigger }: BoardDeleteButtonProps) {
  const { showToast } = useToastContext()
  const [loading, setLoading] = useState(false)

  const handleDelete = async () => {
    setLoading(true)
    try {
      const res = await boardApi.deleteBoard(projectId, boardId)
      if (res) {
        showToast({ title: 'Success', description: 'Board deleted successfully', variant: 'success' })
      } else {
        showToast({ title: 'Error', description: 'Failed to delete board', variant: 'destructive' })
      }
      onDeleted()
    } catch (error) {
      const err = error as APIError
      showToast({
        title: 'Error',
        description: err?.response?.data?.message || err?.message || 'Failed to delete board.',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog>
      <DialogTrigger asChild>
        {trigger ? (
          trigger
        ) : (
          <button
            type='button'
            className='w-8 h-8 p-0 flex items-center justify-center bg-red-100 hover:bg-red-200 rounded-xl transition-colors duration-150 shadow-none border-none focus:outline-none'
          >
            <Trash2 className='h-4 w-4 text-red-600' />
          </button>
        )}
      </DialogTrigger>
      <DialogContent className='max-w-sm'>
        <DialogHeader>
          <DialogTitle>Delete Board?</DialogTitle>
          <DialogDescription>
            Are you sure you want to delete this board? This action cannot be undone.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant='outline' disabled={loading} data-autofocus>
              Cancel
            </Button>
          </DialogClose>
          <Button onClick={handleDelete} disabled={loading} className='bg-red-500 hover:bg-red-600'>
            {loading ? 'Deleting...' : 'Delete'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
