import { boardApi } from '@/api/boards'
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { useToastContext } from '@/components/ui/ToastContext'
import { Trash2 } from 'lucide-react'
import { useState } from 'react'
import { APIError } from '@/types/api'

interface BoardDeleteButtonProps {
  projectId: string
  boardId: string
  onDeleted: () => void
}

export function BoardDeleteButton({ projectId, boardId, onDeleted }: BoardDeleteButtonProps) {
  const { showToast } = useToastContext()
  const [loading, setLoading] = useState(false)

  const handleDelete = async () => {
    setLoading(true)
    try {
      const res = await boardApi.deleteBoard(projectId, boardId)
      if (res) {
        showToast({ title: 'Success', description: 'Board deleted successfully', variant: 'default' })
      } else {
        showToast({ title: 'Error', description: 'Failed to delete board', variant: 'destructive' })
      }
      onDeleted()
    } catch (error) {
      const err = error as APIError
      showToast({ title: 'Error', description: err?.response?.data?.message || err?.message || 'Failed to delete board.', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant='ghost' size='icon' className='p-2 rounded-lg hover:bg-red-50 transition-all duration-200 text-red-500 hover:text-red-600 shadow-sm hover:shadow-md'>
          <Trash2 className='w-4 h-4' />
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Board?</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete this board? This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={loading}>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={handleDelete} disabled={loading} className='bg-red-500 hover:bg-red-600'>
            {loading ? 'Deleting...' : 'Delete'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
