import { boardApi } from '@/api/boards'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToastContext } from '@/components/ui/ToastContext'
import { Pencil } from 'lucide-react'
import { useState } from 'react'
import { APIError } from '@/types/api'

interface BoardEditMenuProps {
  projectId: string
  boardId: string
  currentName: string
  currentDescription: string
  onEdited: () => void
  trigger?: React.ReactNode // add this
}

export function BoardEditMenu({
  projectId,
  boardId,
  currentName,
  currentDescription,
  onEdited,
  trigger
}: BoardEditMenuProps) {
  const { showToast } = useToastContext()
  const [isOpen, setIsOpen] = useState(false)
  const [name, setName] = useState(currentName)
  const [description, setDescription] = useState(currentDescription)
  const [loading, setLoading] = useState(false)

  const handleEdit = async () => {
    setLoading(true)
    try {
      const res = await boardApi.editBoard(projectId, boardId, name, description)
      if (res) {
        showToast({ title: 'Success', description: 'Board updated successfully', variant: 'success' })
      } else {
        showToast({ title: 'Error', description: 'Failed to update board', variant: 'destructive' })
      }
      onEdited()
      setIsOpen(false)
    } catch (error) {
      const err = error as APIError
      showToast({
        title: 'Error',
        description: err?.response?.data?.message || err?.message || 'Failed to update board.',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {trigger ? (
          trigger
        ) : (
          <button
            type='button'
            className='w-8 h-8 p-0 flex items-center justify-center bg-lavender-100 hover:bg-lavender-200 rounded-xl transition-colors duration-150 shadow-none border-none focus:outline-none'
          >
            <Pencil className='h-4 w-4 text-lavender-600' />
          </button>
        )}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Board</DialogTitle>
        </DialogHeader>
        <div className='space-y-4 py-2'>
          <div>
            <Label htmlFor='board-name'>Board Name</Label>
            <Input id='board-name' value={name} onChange={(e) => setName(e.target.value)} disabled={loading} />
          </div>
          <div>
            <Label htmlFor='board-desc'>Description</Label>
            <Input
              id='board-desc'
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={loading}
            />
          </div>
        </div>
        <DialogFooter>
          <Button
            onClick={handleEdit}
            disabled={loading || !name.trim()}
            className='bg-blue-500 hover:bg-blue-600 text-white'
          >
            {loading ? 'Saving...' : 'Save'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
