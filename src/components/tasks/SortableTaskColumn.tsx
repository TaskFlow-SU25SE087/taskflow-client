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
  onTaskUpdated?: () => void
  status: string
  boardId: string
  movingTaskId?: string | null
  type?: string
  canCreate?: boolean
  isMember?: boolean
}

export function SortableTaskColumn(props: SortableTaskColumnProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging, isSorting, isOver } = useSortable({
    id: props.id,
    disabled: props.isMember // Disable drag and drop for members
  })

  const style = {
    ...(transform ? { transform: CSS.Transform.toString(transform) } : {}),
    transition: transition || 'transform 150ms ease-in-out',
    opacity: isDragging ? 0.8 : 1,
    cursor: props.isMember ? 'default' : (isDragging ? 'grabbing' : 'grab'),
    zIndex: isDragging ? 1000 : 1
  } as React.CSSProperties

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`
        w-full
        transition-all duration-150 ease-in-out
        ${isDragging ? 'animate-drag-preview scale-105 rotate-2 shadow-2xl' : ''}
        ${isOver ? 'animate-drop-zone' : ''}
        ${isSorting ? 'animate-bounce-subtle' : ''}
      `}
      {...attributes}
      {...(props.isMember ? {} : listeners)} // Only add listeners if not a member
    >
      <TaskColumn {...props} />
    </div>
  )
}

interface SortableBoardColumnProps {
  id: string
  children: ReactNode
  isMember?: boolean
}

export function SortableBoardColumn({ id, children, isMember = false }: SortableBoardColumnProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging, isSorting, isOver } = useSortable({
    id,
    disabled: isMember // Disable drag and drop for members
  })

  const style = {
    ...(transform ? { transform: CSS.Transform.toString(transform) } : {}),
    transition: transition || 'transform 150ms cubic-bezier(0.25, 0.46, 0.45, 0.94)',
    opacity: isDragging ? 0.9 : 1,
    cursor: isMember ? 'default' : isDragging ? 'grabbing' : 'grab',
    zIndex: isDragging ? 999 : 1
  } as React.CSSProperties

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`
        w-full
        transition-all duration-150 ease-in-out
        ${isDragging ? 'animate-drag-preview scale-105 rotate-1 shadow-2xl' : ''}
        ${isOver ? 'animate-drop-zone ring-2 ring-lavender-300 ring-opacity-50' : ''}
        ${isSorting ? 'animate-bounce-subtle' : ''}
      `}
      {...attributes}
      {...(isMember ? {} : listeners)} // Only add listeners if not a member
    >
      {children}
    </div>
  )
}
