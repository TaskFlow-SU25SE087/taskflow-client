import TaskCreateMenuForBoard from '@/components/tasks/TaskCreateMenuForBoard'
import { useCurrentProject } from '@/hooks/useCurrentProject'
import { TaskP } from '@/types/task'
import { Inbox, Plus } from 'lucide-react'
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
  movingTaskId?: string | null
}

// Enhanced color mapping for different board statuses
const getBoardStyling = (boardName: string) => {
  const name = boardName.toLowerCase()
  
  if (name.includes('todo') || name.includes('backlog') || name.includes('new')) {
    return {
      bgColor: 'bg-gradient-to-br from-slate-50 to-slate-100',
      borderColor: 'border-slate-200',
      headerColor: 'bg-slate-100',
      accentColor: 'bg-slate-400',
      textColor: 'text-slate-700',
      countBg: 'bg-slate-200',
      countText: 'text-slate-600'
    }
  } else if (name.includes('progress') || name.includes('doing') || name.includes('active')) {
    return {
      bgColor: 'bg-gradient-to-br from-blue-50 to-blue-100',
      borderColor: 'border-blue-200',
      headerColor: 'bg-blue-100',
      accentColor: 'bg-blue-400',
      textColor: 'text-blue-700',
      countBg: 'bg-blue-200',
      countText: 'text-blue-600'
    }
  } else if (name.includes('review') || name.includes('testing') || name.includes('qa')) {
    return {
      bgColor: 'bg-gradient-to-br from-amber-50 to-amber-100',
      borderColor: 'border-amber-200',
      headerColor: 'bg-amber-100',
      accentColor: 'bg-amber-400',
      textColor: 'text-amber-700',
      countBg: 'bg-amber-200',
      countText: 'text-amber-600'
    }
  } else if (name.includes('done') || name.includes('complete') || name.includes('finished')) {
    return {
      bgColor: 'bg-gradient-to-br from-emerald-50 to-emerald-100',
      borderColor: 'border-emerald-200',
      headerColor: 'bg-emerald-100',
      accentColor: 'bg-emerald-400',
      textColor: 'text-emerald-700',
      countBg: 'bg-emerald-200',
      countText: 'text-emerald-600'
    }
  } else if (name.includes('blocked') || name.includes('error') || name.includes('failed')) {
    return {
      bgColor: 'bg-gradient-to-br from-red-50 to-red-100',
      borderColor: 'border-red-200',
      headerColor: 'bg-red-100',
      accentColor: 'bg-red-400',
      textColor: 'text-red-700',
      countBg: 'bg-red-200',
      countText: 'text-red-600'
    }
  }
  
  // Default lavender theme
  return {
    bgColor: 'bg-gradient-to-br from-lavender-50 to-lavender-100',
    borderColor: 'border-lavender-200',
    headerColor: 'bg-lavender-100',
    accentColor: 'bg-lavender-400',
    textColor: 'text-lavender-700',
    countBg: 'bg-lavender-200',
    countText: 'text-lavender-600'
  }
}

export function TaskColumn({ title, tasks, onTaskCreated, boardId, movingTaskId }: TaskColumnProps) {
  const [isAddingTask, setIsAddingTask] = useState(false)
  const [isHovered, setIsHovered] = useState(false)
  const { currentProject } = useCurrentProject()
  
  const styling = getBoardStyling(title)

  const EmptyState = () => (
    <div className={`flex flex-col items-center justify-center py-8 ${styling.textColor} opacity-60`}>
      <Inbox className='w-12 h-12 mb-3 stroke-1' />
      <p className='text-base font-medium'>No tasks yet</p>
      <p className='text-sm opacity-75 mt-1'>Click + to add your first task</p>
    </div>
  )

  return (
    <div 
      className={`${styling.bgColor} rounded-2xl w-full flex flex-col border-none shadow-none animate-fade-in`}
      style={{ width: '320px', minWidth: '320px', minHeight: '200px' }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Header */}
      <div className={`${styling.headerColor} rounded-t-2xl flex-none`}>
        <div className='flex items-center justify-between px-6 py-4'>
          <div className='flex items-center gap-x-3'>
            <div 
              className={`w-3 h-3 rounded-full ${styling.accentColor} shadow-sm`}
            />
            <span className={`font-semibold text-lg ${styling.textColor}`}>
              {title}
            </span>
            <span className={`${styling.countBg} ${styling.countText} px-3 py-1 rounded-full text-sm font-medium transition-all duration-200`}>
              {tasks.length}
            </span>
          </div>
          <div className={`flex items-center gap-x-2 transition-all duration-200 ${isHovered ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-2'}`}>
            {currentProject && (
              <TaskCreateMenuForBoard
                isOpen={isAddingTask}
                onOpenChange={setIsAddingTask}
                projectId={currentProject.id}
                onTaskCreated={onTaskCreated}
                boardId={boardId}
                trigger={
                  <button className={`p-2 rounded-lg ${styling.accentColor} hover:opacity-80 transition-all duration-200 text-white shadow-sm hover:shadow-md`}>
                    <Plus className='h-4 w-4' />
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
                onEdited={onTaskCreated}
              />
            )}
            {currentProject && (
              <BoardDeleteButton 
                projectId={currentProject.id} 
                boardId={boardId} 
                onDeleted={onTaskCreated}
              />
            )}
          </div>
        </div>
        
        {/* Progress bar */}
        <div className='px-6 pb-4'>
          <div className={`h-2 ${styling.countBg} rounded-full overflow-hidden shadow-inner`}>
            <div 
              className={`h-full ${styling.accentColor} rounded-full transition-all duration-500 ease-out shadow-sm`}
              style={{ width: tasks.length > 0 ? '100%' : '0%' }}
            />
          </div>
        </div>
      </div>

      {/* Tasks container */}
      <div className='flex-1 min-h-0'>
        {tasks.length === 0 ? (
          <EmptyState />
        ) : (
          <div className='overflow-y-auto px-4 py-2 scroll-smooth'>
            <div className='space-y-3 pb-4'>
              {tasks.map((task) => (
                <div 
                  key={task.id} 
                >
                  <SortableTaskCard task={task} isMoving={movingTaskId === task.id} />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
