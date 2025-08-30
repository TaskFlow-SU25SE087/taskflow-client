import { boardApi } from '@/api/boards'
import { taskApi } from '@/api/tasks'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { useToastContext } from '@/components/ui/ToastContext'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Loader2, Trash2 } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { APIError } from '@/types/api'
import { Board } from '@/types/board'
import { TaskP } from '@/types/task'

interface BoardDeleteButtonProps {
  projectId: string
  boardId: string
  onDeleted: () => void
  trigger?: React.ReactNode
  tasks?: TaskP[] // tasks currently passed from board (may be filtered by sprint/view)
}

export function BoardDeleteButton({
  projectId,
  boardId,
  onDeleted,
  trigger,
  tasks: passedTasks = []
}: BoardDeleteButtonProps) {
  const { showToast } = useToastContext()
  const [loading, setLoading] = useState(false)
  const [boards, setBoards] = useState<Board[]>([])
  const [destinationBoardId, setDestinationBoardId] = useState<string>('')
  const [open, setOpen] = useState(false)
  const [movedCount, setMovedCount] = useState(0)
  // Internal state so we can fetch hidden tasks (e.g., when no active sprint / backlog filtering hides them)
  const [boardTasks, setBoardTasks] = useState<TaskP[]>(passedTasks)

  // Merge any newly passed tasks (e.g., prop change after re-render) into internal list
  useEffect(() => {
    if (passedTasks.length) {
      setBoardTasks((prev) => {
        const existingIds = new Set(prev.map((t) => t.id))
        const merged = [...prev]
        passedTasks.forEach((t) => {
          if (!existingIds.has(t.id)) merged.push(t)
        })
        return merged
      })
    }
  }, [passedTasks])

  const hasTasks = boardTasks.length > 0
  const selectableBoards = useMemo(() => boards.filter((b) => b.id !== boardId), [boards, boardId])

  // Preselect first board if any when opening (for convenience)
  useEffect(() => {
    if (!open) return

    // Fetch boards & all tasks (to ensure we capture tasks hidden by sprint filters)
    let cancelled = false

    const load = async () => {
      try {
        const [boardList, allProjectTasks] = await Promise.all([
          boardApi.getAllBoardsByProjectId(projectId),
          // Always fetch all tasks so we also capture tasks not in active sprint / backlog, etc.
          taskApi.getAllTasks(projectId).catch((e) => {
            console.warn('[BoardDeleteButton] Failed to fetch all tasks; proceeding with passed tasks', e)
            return [] as TaskP[]
          })
        ])
        if (cancelled) return
        setBoards(boardList)
        const currentBoardTasks = allProjectTasks.filter((t) => t.boardId === boardId)
        setBoardTasks((prev) => {
          // Prefer freshly fetched tasks for authoritative data; merge any not returned (unlikely)
          const mergedIds = new Set(currentBoardTasks.map((t) => t.id))
          prev.forEach((t) => {
            if (t.boardId === boardId && !mergedIds.has(t.id)) currentBoardTasks.push(t)
          })
          return currentBoardTasks
        })
      } catch (err) {
        console.error('[BoardDeleteButton] Failed initial data load', err)
      }
    }
    load()
    return () => {
      cancelled = true
    }
  }, [open, projectId, boardId])

  useEffect(() => {
    if (!destinationBoardId && selectableBoards.length > 0) {
      setDestinationBoardId(selectableBoards[0].id)
    }
  }, [selectableBoards, destinationBoardId])

  const moveAllTasks = async (targetBoardId: string) => {
    if (!hasTasks) return
    // Sequential move; if needed optimize with Promise.allSettled respecting order.
    for (let i = 0; i < boardTasks.length; i++) {
      const t = boardTasks[i]
      try {
        await taskApi.moveTaskToBoard(projectId, t.id, targetBoardId)
        setMovedCount(i + 1)
      } catch (err: any) {
        throw new Error(`Failed to move task "${t.title}" (${t.id}): ${err?.message || 'Unknown error'}`)
      }
    }
  }

  const handleDelete = async () => {
    if (hasTasks && !destinationBoardId) {
      showToast({
        title: 'Select destination',
        description: 'Please choose a board to move existing tasks before deletion.',
        variant: 'destructive'
      })
      return
    }
    setLoading(true)
    setMovedCount(0)
    try {
      if (hasTasks) {
        await moveAllTasks(destinationBoardId)
      }
      const res: any = await boardApi.deleteBoard(projectId, boardId)
      const success =
        (res && (res.code === 200 || res.code === 0) && (res.data === true || res.data === 1)) || res === true
      console.log('[BoardDeleteButton] deleteBoard response:', res, 'interpreted success:', success)
      if (success) {
        showToast({
          title: 'Board deleted',
          description: hasTasks
            ? `Moved ${boardTasks.length} task${boardTasks.length !== 1 ? 's' : ''} then deleted board.`
            : res?.message || 'Board deleted successfully.',
          variant: 'success'
        })
      } else {
        showToast({
          title: 'Error',
          description: res?.message || 'Failed to delete board',
          variant: 'destructive'
        })
        return // Don't close dialog or trigger refresh on failure
      }
      setOpen(false)
      onDeleted()
    } catch (error) {
      const err = error as APIError | Error
      showToast({
        title: 'Error',
        description: (err as any)?.response?.data?.message || err.message || 'Failed to move tasks or delete board.',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !loading && setOpen(v)}>
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
      <DialogContent className='max-w-md sm:max-w-lg p-0 overflow-hidden'>
        <div className='p-6 pb-4'>
          <DialogHeader className='items-center'>
            <div className='flex flex-col items-center gap-4'>
              <div className='w-14 h-14 rounded-xl bg-red-100 flex items-center justify-center'>
                <Trash2 className='h-7 w-7 text-red-600' />
              </div>
              <div className='text-center'>
                <DialogTitle className='text-2xl font-semibold'>Delete Board</DialogTitle>
                <DialogDescription className='mt-1 text-sm text-gray-500'>
                  {hasTasks ? 'Move its tasks to another board before deletion.' : 'This action cannot be undone.'}
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          {/* Warning panel (simplified to match creation menu minimal style) */}
          <div className='mt-6 flex gap-3 rounded-lg border border-red-200 bg-red-50/70 px-4 py-3'>
            <div className='mt-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-red-100 text-[11px] font-semibold text-red-600'>
              !
            </div>
            <div className='text-sm text-red-700'>
              <p className='font-medium'>You're about to permanently delete this board.</p>
              {hasTasks && <p className='mt-1 text-xs text-red-600'>All tasks must be moved to another board first.</p>}
            </div>
          </div>

          {hasTasks && (
            <div className='mt-6 space-y-4'>
              <TaskPreview tasks={boardTasks} movedCount={movedCount} loading={loading} />
              <div className='space-y-2'>
                <label className='text-xs font-semibold uppercase tracking-wide text-gray-600'>Destination Board</label>
                <Select
                  value={destinationBoardId}
                  onValueChange={(v) => setDestinationBoardId(v)}
                  disabled={loading || selectableBoards.length === 0}
                >
                  <SelectTrigger className='h-11 rounded-lg'>
                    <SelectValue placeholder='Select a board to receive tasks' />
                  </SelectTrigger>
                  <SelectContent className='max-h-60'>
                    {selectableBoards.length === 0 && (
                      <div className='px-2 py-1 text-xs text-gray-500'>No other boards available</div>
                    )}
                    {selectableBoards.map((b) => (
                      <SelectItem key={b.id} value={b.id} disabled={b.id === boardId}>
                        {b.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {loading && hasTasks && (
                  <div className='space-y-1'>
                    <div className='flex justify-between text-[11px] font-medium text-gray-500'>
                      <span>Moving tasks</span>
                      <span>
                        {movedCount}/{boardTasks.length}
                      </span>
                    </div>
                    <div className='h-1.5 w-full rounded-full bg-gray-200 overflow-hidden'>
                      <div
                        className='h-full bg-red-500 transition-all duration-300'
                        style={{ width: `${(movedCount / Math.max(boardTasks.length, 1)) * 100}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        <div className='px-6 py-4 border-t flex flex-col sm:flex-row gap-3 sm:gap-4 justify-end'>
          <DialogClose asChild>
            <Button variant='outline' disabled={loading} className='h-11'>
              Cancel
            </Button>
          </DialogClose>
          <Button
            onClick={handleDelete}
            disabled={
              loading ||
              (hasTasks && (!destinationBoardId || selectableBoards.length === 0)) ||
              (hasTasks && selectableBoards.length === 0)
            }
            className='h-11 font-semibold bg-red-600 hover:bg-red-700 text-white flex items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed'
          >
            {loading ? (
              <>
                <Loader2 className='h-4 w-4 animate-spin' />
                {hasTasks && movedCount < boardTasks.length ? 'Moving tasks…' : 'Deleting…'}
              </>
            ) : (
              <>
                <Trash2 className='h-4 w-4' /> Delete Board
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// Internal lightweight preview component (kept inside file to avoid extra exports)
function TaskPreview({ tasks, movedCount, loading }: { tasks: TaskP[]; movedCount: number; loading: boolean }) {
  const [showAll, setShowAll] = useState(false)
  const preview = showAll ? tasks : tasks.slice(0, 4)
  return (
    <div className='rounded-lg border border-gray-200 p-3 bg-white'>
      <div className='flex items-center justify-between mb-2'>
        <h4 className='text-xs font-semibold tracking-wide text-gray-600 flex items-center gap-2'>
          Tasks to Move
          <span className='px-1.5 py-0.5 rounded-full bg-gray-100 text-gray-700 text-[10px] font-medium'>
            {tasks.length}
          </span>
        </h4>
        {tasks.length > 4 && (
          <button
            type='button'
            onClick={() => setShowAll((v) => !v)}
            className='text-[11px] font-medium text-red-600 hover:underline'
          >
            {showAll ? 'Show less' : `Show all (${tasks.length})`}
          </button>
        )}
      </div>
      <ul className='space-y-1.5 max-h-40 overflow-y-auto pr-1 custom-scrollbar'>
        {preview.map((t, i) => {
          const moved = movedCount >= i + 1
          return (
            <li
              key={t.id}
              className={`group flex items-center gap-2 text-xs rounded-md px-2 py-1.5 border ${
                moved ? 'bg-green-50 border-green-200 text-green-700' : 'bg-gray-50 border-gray-200 text-gray-600'
              }`}
            >
              <span
                className={`flex-shrink-0 w-1.5 h-1.5 rounded-full ${
                  moved ? 'bg-green-500' : 'bg-gray-300 group-hover:bg-gray-400'
                }`}
              />
              <span className='flex-1 truncate font-medium'>{t.title || 'Untitled task'}</span>
              {loading && !moved && <span className='text-[10px] text-gray-400'>pending</span>}
              {moved && <span className='text-[10px] font-medium text-green-600'>moved</span>}
            </li>
          )
        })}
      </ul>
      {tasks.length === 0 && <div className='text-xs text-gray-400 italic'>No tasks</div>}
    </div>
  )
}
