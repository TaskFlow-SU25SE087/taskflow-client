import { TaskP } from '@/types/task';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { TaskCard } from './TaskCard';

export function SortableTaskCard({ task, compact, isMoving }: { task: TaskP; compact?: boolean; isMoving?: boolean }) {
  const { 
    attributes, 
    listeners, 
    setNodeRef, 
    transform, 
    transition, 
    isDragging,
    isSorting,
    isOver
  } = useSortable({ id: task.id })
  
  const style = {
    transform: CSS.Transform.toString(transform),
    transition: transition || 'transform 200ms cubic-bezier(0.25, 0.46, 0.45, 0.94)',
    opacity: isDragging ? 0.85 : 1,
    cursor: isDragging ? 'grabbing' : 'grab',
    zIndex: isDragging ? 1001 : 1
  }
  
  return (
    <div 
      ref={setNodeRef} 
      style={style} 
      className={`
        transition-all duration-200 ease-in-out
        ${isDragging ? 'animate-drag-preview scale-105 rotate-1 shadow-xl' : ''}
        ${isOver ? 'animate-drop-zone' : ''}
        ${isSorting ? 'animate-bounce-subtle' : ''}
      `}
      {...attributes} 
      {...listeners}
    >
      <TaskCard task={task} compact={compact} isMoving={isMoving} />
    </div>
  )
}
