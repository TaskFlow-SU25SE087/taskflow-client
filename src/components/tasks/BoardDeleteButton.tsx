import { useState } from 'react'
import { Trash2 } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { boardApi } from '@/api/boards'
import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'

interface BoardDeleteButtonProps {
  projectId: string
  boardId: string
  onDeleted: () => void
}

export function BoardDeleteButton({ projectId, boardId, onDeleted }: BoardDeleteButtonProps) {
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)

  const handleDelete = async () => {
    setLoading(true)
    try {
      await boardApi.deleteBoard(projectId, boardId)
      toast({
        title: 'Board deleted',
        description: 'The board was deleted successfully.'
      })
      onDeleted()
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete board.',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="ghost" size="icon" className="text-red-500 hover:bg-red-100">
          <Trash2 className="w-5 h-5" />
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
          <AlertDialogAction onClick={handleDelete} disabled={loading} className="bg-red-500 hover:bg-red-600">
            {loading ? 'Deleting...' : 'Delete'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
