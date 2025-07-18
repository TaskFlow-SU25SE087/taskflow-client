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
      showToast({ title: res?.code === 200 ? 'Success' : 'Error', description: res?.message || 'Board deleted successfully', variant: res?.code === 200 ? 'default' : 'destructive' })
      onDeleted()
    } catch (error) {
      showToast({ title: 'Error', description: error.response?.data?.message || error.message || 'Failed to delete board.', variant: 'destructive' })
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
