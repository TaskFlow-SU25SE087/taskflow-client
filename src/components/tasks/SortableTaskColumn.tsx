import { TaskP } from '@/types/task'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { ReactNode } from 'react'
import { TaskColumn } from './TaskColumn'

interface SortableTaskColumnProps {
  id: string
  title: string
  description: string
  tasks: TaskP[]
  color: string
  onTaskCreated: () => void
  status: string
  boardId: string
}

export function SortableTaskColumn(props: SortableTaskColumnProps) {
  const { 
    attributes, 
    listeners, 
    setNodeRef, 
    transform, 
    transition, 
    isDragging,
    isSorting,
    isOver
  } = useSortable({ id: props.id })
  
  const style = {
    transform: CSS.Transform.toString(transform),
    transition: transition || 'transform 250ms ease-in-out',
    opacity: isDragging ? 0.8 : 1,
    cursor: isDragging ? 'grabbing' : 'grab',
    zIndex: isDragging ? 1000 : 1
  }

  return (
    <div 
      ref={setNodeRef} 
      style={style} 
      className={`
        transition-all duration-300 ease-in-out
        ${isDragging ? 'animate-drag-preview scale-105 rotate-2 shadow-2xl' : ''}
        ${isOver ? 'animate-drop-zone' : ''}
        ${isSorting ? 'animate-bounce-subtle' : ''}
      `}
      {...attributes} 
      {...listeners}
    >
      <TaskColumn {...props} />
    </div>
  )
}

interface SortableBoardColumnProps {
  id: string
  children: ReactNode
}

export function SortableBoardColumn({ id, children }: SortableBoardColumnProps) {
  const { 
    attributes, 
    listeners, 
    setNodeRef, 
    transform, 
    transition, 
    isDragging,
    isSorting,
    isOver
  } = useSortable({ id })
  
  const style = {
    transform: CSS.Transform.toString(transform),
    transition: transition || 'transform 250ms cubic-bezier(0.25, 0.46, 0.45, 0.94)',
    opacity: isDragging ? 0.9 : 1,
    cursor: isDragging ? 'grabbing' : 'grab',
    zIndex: isDragging ? 999 : 1
  }

  return (
    <div 
      ref={setNodeRef} 
      style={style} 
      className={`
        transition-all duration-300 ease-in-out
        ${isDragging ? 'animate-drag-preview scale-105 rotate-1 shadow-2xl' : ''}
        ${isOver ? 'animate-drop-zone ring-2 ring-lavender-300 ring-opacity-50' : ''}
        ${isSorting ? 'animate-bounce-subtle' : ''}
      `}
      {...attributes} 
      {...listeners}
    >
      {children}
    </div>
  )
}
