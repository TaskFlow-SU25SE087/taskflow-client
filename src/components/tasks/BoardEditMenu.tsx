import { boardApi } from '@/api/boards'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useToastContext } from '@/components/ui/ToastContext'
import { Loader2, Pencil } from 'lucide-react'
import { useEffect, useState } from 'react'
import { APIError } from '@/types/api'

interface BoardEditMenuProps {
  projectId: string
  boardId: string
  currentName: string
  currentDescription: string
  currentType?: string
  onEdited: () => void
  trigger?: React.ReactNode // add this
}

export function BoardEditMenu({
  projectId,
  boardId,
  currentName,
  currentDescription,
  currentType,
  onEdited,
  trigger
}: BoardEditMenuProps) {
  const { showToast } = useToastContext()
  const [isOpen, setIsOpen] = useState(false)
  const [name, setName] = useState(currentName)
  const [description, setDescription] = useState(currentDescription)
  const [type, setType] = useState<string>(currentType || 'Todo')
  const [types, setTypes] = useState<string[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!isOpen) return
    let cancelled = false
    const loadTypes = async () => {
      const list = await boardApi.getBoardTypes(projectId)
      if (!cancelled) setTypes(list)
    }
    loadTypes()
    return () => {
      cancelled = true
    }
  }, [isOpen, projectId])

  const handleEdit = async () => {
    setLoading(true)
    try {
      const selectedType = type || types[0] || 'Todo'
      const res = await boardApi.editBoard(projectId, boardId, name, description, selectedType)
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
      <DialogContent className='sm:max-w-md'>
        <DialogHeader>
          <DialogTitle className='text-center'>
            <div className='flex flex-col items-center gap-4'>
              <Pencil className='h-12 w-12 text-lavender-700' />
              <div>
                <h2 className='text-2xl font-bold'>Edit board</h2>
                <p className='text-sm text-gray-500 mt-1'>Update name, description and type for this board</p>
              </div>
            </div>
          </DialogTitle>
        </DialogHeader>
        <DialogDescription>
          Make changes to your board below. Your updates will be reflected immediately after saving.
        </DialogDescription>

        <div className='space-y-6 py-4'>
          <div>
            <label htmlFor='board-name' className='block text-sm font-medium text-gray-700 mb-1'>
              Board name
            </label>
            <input
              id='board-name'
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={loading}
              placeholder='Enter board name'
              className='w-full bg-transparent text-foreground placeholder-gray-400 text-lg border-b-2 border-gray-200 focus:border-lavender-700 transition-colors duration-300 focus:outline-none focus:ring-0'
            />
          </div>
          <div>
            <label htmlFor='board-desc' className='block text-sm font-medium text-gray-700 mb-1'>
              Description
            </label>
            <input
              id='board-desc'
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={loading}
              placeholder='Enter board description (optional)'
              className='w-full bg-transparent text-foreground placeholder-gray-400 text-lg border-b-2 border-gray-200 focus:border-lavender-700 transition-colors duration-300 focus:outline-none focus:ring-0'
            />
            <p className='text-xs text-gray-500 mt-1'>Keep it concise; you can change this later.</p>
          </div>
          <div>
            <label htmlFor='board-type' className='block text-sm font-medium text-gray-700 mb-1'>
              Board type
            </label>
            <Select value={type} onValueChange={setType}>
              <SelectTrigger
                id='board-type'
                className='h-11 border-0 border-b-2 border-gray-200 rounded-none px-0 focus:ring-0 focus:ring-offset-0 focus:outline-none focus:border-lavender-700'
              >
                <SelectValue placeholder='Select board type' />
              </SelectTrigger>
              <SelectContent>
                {(types.length ? types : ['Todo', 'InProgress', 'Done', 'Custom']).map((t) => (
                  <SelectItem key={t} value={t}>
                    {t}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button variant='outline' onClick={() => setIsOpen(false)} disabled={loading}>
            Cancel
          </Button>
          <Button
            onClick={handleEdit}
            disabled={loading || !name.trim()}
            className='bg-lavender-700 hover:bg-lavender-800 text-white'
          >
            {loading ? (
              <>
                <Loader2 className='mr-2 h-4 w-4 animate-spin' /> Saving...
              </>
            ) : (
              'Save changes'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
