import { useDroppable } from '@dnd-kit/core'
import React from 'react'

type DroppableBoardProps = {
  boardId: string
  children: React.ReactNode
  className?: string
}

export function DroppableBoard({ boardId, children, className = '' }: DroppableBoardProps) {
  const { setNodeRef, isOver } = useDroppable({ id: boardId })
  const isEmpty = React.Children.count(children) === 0
  return (
    <div
      ref={setNodeRef}
      className={`rounded-2xl h-full relative p-2 flex flex-col min-w-[340px] max-w-[400px] mx-2 ${className}`}
      style={{ minHeight: 140, minWidth: 340, maxWidth: 400 }}
    >
      {children}
      {isOver && isEmpty && (
        <div
          className={
            'absolute inset-0 flex items-center justify-center pointer-events-none select-none text-violet-500 font-semibold text-base animate-pulse bg-violet-50/80 rounded-2xl'
          }
        >
          Thả task vào đây
        </div>
      )}
    </div>
  )
}
