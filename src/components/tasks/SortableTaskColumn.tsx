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
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: props.id })
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    cursor: 'grab',
  }
  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <TaskColumn {...props} />
    </div>
  )
}

interface SortableBoardColumnProps {
  id: string
  children: ReactNode
}

export function SortableBoardColumn({ id, children }: SortableBoardColumnProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id })
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    cursor: 'grab',
  }
  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      {children}
    </div>
  )
}
