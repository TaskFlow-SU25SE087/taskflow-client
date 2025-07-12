import { closestCenter, DndContext, PointerSensor, useSensor, useSensors } from '@dnd-kit/core'
import { horizontalListSortingStrategy, SortableContext } from '@dnd-kit/sortable'
import { ReactNode } from 'react'

interface BoardDragDropWrapperProps {
  children: ReactNode
  boardIds: string[]
  onDragEnd: (oldIndex: number, newIndex: number) => void
}

export function BoardDragDropWrapper({ children, boardIds, onDragEnd }: BoardDragDropWrapperProps) {
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }))

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={(event) => {
        const { active, over } = event
        if (active.id !== over?.id) {
          const oldIndex = boardIds.indexOf(active.id as string)
          const newIndex = boardIds.indexOf(over?.id as string)
          if (oldIndex !== -1 && newIndex !== -1) {
            onDragEnd(oldIndex, newIndex)
          }
        }
      }}
    >
      <SortableContext items={boardIds} strategy={horizontalListSortingStrategy}>
        {children}
      </SortableContext>
    </DndContext>
  )
}
