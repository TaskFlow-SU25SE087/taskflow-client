import TaskCreateMenuForBoard from '@/components/tasks/TaskCreateMenuForBoard'
import { useCurrentProject } from '@/hooks/useCurrentProject'
import { TaskP } from '@/types/task'
import { Inbox, Plus, Pencil } from 'lucide-react'
import { useState } from 'react'
import { BoardDeleteButton } from './BoardDeleteButton'
import { BoardEditMenu } from './BoardEditMenu'
import { SortableTaskCard } from './SortableTaskCard'

interface TaskColumnProps {
  title: string
  tasks: TaskP[]
  color: string
  onTaskCreated: () => void
  onTaskUpdated?: () => void
  status: string
  boardId: string
  movingTaskId?: string | null
  type?: string
  canCreate?: boolean
}

// Color mapping aligned with project board colors and API types
const getBoardColor = (labelOrType: string, fallbackColor: string) => {
  const key = (labelOrType || '').toLowerCase().replace(/\s+/g, '')
  if (key === 'done') return '#8BC34A' // project green
  if (key === 'inprogress') return '#3b82f6' // blue
  if (key === 'todo' || key === 'to-do') return '#5030E5' // purple
  if (key === 'custom') return '#64748b' // gray
  // legacy heuristics if only a name is provided
  if (key.includes('done') || key.includes('complete') || key.includes('finished')) return '#8BC34A'
  if (key.includes('progress') || key.includes('doing') || key.includes('active')) return '#3b82f6'
  if (key.includes('todo') || key.includes('backlog') || key.includes('new')) return '#5030E5'
  return fallbackColor
}

export function TaskColumn({
  title,
  tasks,
  color,
  onTaskCreated,
  onTaskUpdated,
  boardId,
  movingTaskId,
  type,
  canCreate
}: TaskColumnProps) {
  const [isAddingTask, setIsAddingTask] = useState(false)
  const [isHovered, setIsHovered] = useState(false)
  const { currentProject } = useCurrentProject()

  // Prefer type-based color if available, fallback to title-based heuristics
  const dynamicColor = getBoardColor(type || title, color)

  const EmptyState = () => (
    <div className='flex flex-col items-center justify-center py-12 text-gray-400'>
      <Inbox className='w-16 h-16 mb-4 stroke-1' />
      <p className='text-lg font-medium'>Nothing here yet!</p>
      {canCreate === false ? (
        <p className='text-sm text-gray-300 mt-1'>Start a sprint to begin adding tasks</p>
      ) : (
        <p className='text-sm text-gray-300 mt-1'>Click + to add your first task</p>
      )}
    </div>
  )

  return (
    <div
      className='bg-white rounded-lg border border-t-0 border-gray-300 w-full flex flex-col'
      style={{ width: '320px', minWidth: '320px', minHeight: '200px' }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Header */}
      <div className='flex-none sticky top-px -mt-px border-t border-t-gray-200 border-b-gray-200 z-[9992] bg-white shadow-sm border-b border-gray-200'>
        <div className='flex items-center justify-between px-4 pt-3 pb-2'>
          <div className='flex items-center gap-2'>
            <div style={{ backgroundColor: dynamicColor }} className='w-2 h-2 rounded-full' />
            <span className='font-medium text-gray-800'>{title}</span>
            <span className='bg-gray-200 text-gray-600 px-1.5 py-0.5 rounded-full text-xs'>{tasks.length}</span>
          </div>
          <div
            className={`flex items-center gap-2 transition-opacity duration-200 ${
              isHovered ? 'opacity-100' : 'opacity-0'
            }`}
          >
            {currentProject && canCreate !== false && (
              <TaskCreateMenuForBoard
                isOpen={isAddingTask}
                onOpenChange={setIsAddingTask}
                projectId={currentProject.id}
                onTaskCreated={onTaskCreated}
                boardId={boardId}
                trigger={
                  <button
                    type='button'
                    className='w-8 h-8 p-0 flex items-center justify-center rounded-xl transition-colors duration-150 shadow-none border-none focus:outline-none bg-lavender-100 hover:bg-lavender-200'
                    title='Add task'
                  >
                    <Plus className='h-4 w-4 text-lavender-600' />
                  </button>
                }
              />
            )}
            {currentProject && (
              <BoardEditMenu
                projectId={currentProject.id}
                boardId={boardId}
                currentName={title}
                currentDescription={''}
                currentType={type}
                onEdited={onTaskCreated}
                trigger={
                  <button
                    type='button'
                    className='w-8 h-8 p-0 flex items-center justify-center bg-lavender-100 hover:bg-lavender-200 rounded-xl transition-colors duration-150 shadow-none border-none focus:outline-none'
                  >
                    <Pencil className='h-4 w-4 text-lavender-600' />
                  </button>
                }
              />
            )}
            {currentProject && (
              <BoardDeleteButton
                projectId={currentProject.id}
                boardId={boardId}
                onDeleted={onTaskCreated}
                trigger={
                  <button
                    type='button'
                    className='w-8 h-8 p-0 flex items-center justify-center bg-red-100 hover:bg-red-200 rounded-xl transition-colors duration-150 shadow-none border-none focus:outline-none'
                  >
                    <svg
                      className='h-4 w-4 text-red-600'
                      fill='none'
                      stroke='currentColor'
                      strokeWidth={2}
                      viewBox='0 0 24 24'
                    >
                      <path strokeLinecap='round' strokeLinejoin='round' d='M6 18L18 6M6 6l12 12' />
                    </svg>
                  </button>
                }
              />
            )}
          </div>
        </div>
        {/* Progress bar */}
        <div className='px-4'>
          <div style={{ backgroundColor: dynamicColor }} className='h-1 w-full rounded-full mb-2' />
        </div>
        {/* bottom border now handled by header's border-b */}
      </div>
      {/* Tasks container */}
      <div className='flex-1 min-h-0'>
        {tasks.length === 0 ? (
          <EmptyState />
        ) : (
          <div className='px-6'>
            <div className='space-y-4 pt-4 pb-4'>
              {tasks.map((task) => (
                <div key={task.id}>
                  <SortableTaskCard task={task} isMoving={movingTaskId === task.id} onTaskUpdated={onTaskUpdated} />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
