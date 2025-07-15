import TaskCreateMenuForBoard from '@/components/tasks/TaskCreateMenuForBoard'
import { useCurrentProject } from '@/hooks/useCurrentProject'
import { TaskP } from '@/types/task'
import { Inbox } from 'lucide-react'
import { useState } from 'react'
import { BoardDeleteButton } from './BoardDeleteButton'
import { BoardEditMenu } from './BoardEditMenu'
import { SortableTaskCard } from './SortableTaskCard'

interface TaskColumnProps {
  title: string
  tasks: TaskP[]
  color: string
  onTaskCreated: () => void
  status: string
  boardId: string
}

export function TaskColumn({ title, tasks, color, onTaskCreated, boardId }: TaskColumnProps) {
  const [isAddingTask, setIsAddingTask] = useState(false)
  const { currentProject } = useCurrentProject()

  const EmptyState = () => (
    <div className='flex flex-col items-center justify-center h-full py-12 text-gray-400'>
      <Inbox className='w-16 h-16 mb-4 stroke-1' />
      <p className='text-lg font-medium'>Nothing here yet!</p>
    </div>
  )

  return (
    <div className='bg-white rounded-lg border w-[400px] border-gray-300 flex flex-col min-h-0'>
      <div className='flex-none'>
        <div className='flex items-center justify-between px-6 pt-6 pb-4'>
          <div className='flex items-center gap-x-3'>
            <div style={{ backgroundColor: color }} className='w-2 h-2 rounded-full'></div>
            <span className='font-medium'>{title}</span>
            <span className='bg-gray-300 px-2 py-0.5 rounded-full text-sm'>{tasks.length}</span>
          </div>
          <div className='flex items-center gap-x-3'>
            {currentProject && (
              <TaskCreateMenuForBoard
                isOpen={isAddingTask}
                onOpenChange={setIsAddingTask}
                projectId={currentProject.id}
                onTaskCreated={onTaskCreated}
                boardId={boardId}
              />
            )}
            {currentProject && (
              <BoardEditMenu
                projectId={currentProject.id}
                boardId={boardId}
                currentName={title}
                currentDescription={''}
                onEdited={onTaskCreated}
              />
            )}
            {currentProject && (
              <BoardDeleteButton projectId={currentProject.id} boardId={boardId} onDeleted={onTaskCreated} />
            )}
          </div>
        </div>
        <div className='px-6'>
          <div style={{ backgroundColor: color }} className='h-1 w-full rounded-full mb-4'></div>
        </div>
      </div>

      {tasks.length === 0 ? (
        <EmptyState />
      ) : (
        <div className='flex-1 min-h-0 overflow-y-auto px-6'>
          <div className='space-y-4 pb-4'>
            {tasks.map((task) => (
              <SortableTaskCard key={task.id} task={task} />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
