import { TaskP } from '@/types/task'
import { Board } from '@/types/board'
import React from 'react'
import { FixedSizeList as List } from 'react-window'
import { BacklogTaskRow } from './BacklogTaskRow'
import { BacklogTaskRowSkeleton } from './BacklogTaskRowSkeleton'

interface OptimizedTaskP {
  id: string
  title: string
  description: string
  status: string
  updated: string
  assignee: any | null
  tags: any[]
  commnets?: any[]
  attachmentUrlsList?: string[]
  boardId: string | null
  projectId: string
}

interface VirtualizedTaskListProps {
  tasks: (TaskP | OptimizedTaskP)[]
  showMeta?: boolean
  selectedTaskIds: string[]
  onCheck: (taskId: string, checked: boolean) => void
  onTaskUpdate?: () => void
  isLoading?: boolean
  height?: number
  onLoadMore?: () => void
  hasMore?: boolean
  boards?: Board[]
  refreshBoards?: () => Promise<void>
}

const ITEM_HEIGHT = 44 // Height of each task row including margin

export const VirtualizedTaskList: React.FC<VirtualizedTaskListProps> = ({
  tasks,
  showMeta = true,
  selectedTaskIds,
  onCheck,
  onTaskUpdate,
  isLoading = false,
  height = 400,
  onLoadMore,
  hasMore,
  boards = [],
  refreshBoards
}) => {
  // Thêm effect để gọi onLoadMore khi scroll đến cuối
  const listRef = React.useRef<any>(null)
  const handleItemsRendered = ({ visibleStopIndex }: { visibleStopIndex: number }) => {
    if (hasMore && onLoadMore && visibleStopIndex >= tasks.length - 1) {
      onLoadMore()
    }
  }

  if (isLoading) {
    return (
      <div style={{ height }}>
        {Array.from({ length: Math.ceil(height / ITEM_HEIGHT) }).map((_, index) => (
          <BacklogTaskRowSkeleton key={index} />
        ))}
      </div>
    )
  }

  if (tasks.length === 0) {
    return (
      <div className='p-4 text-center text-gray-500' style={{ height }}>
        No tasks in backlog
      </div>
    )
  }

  const Row = ({ index, style }: { index: number; style: React.CSSProperties }) => {
    const task = tasks[index]
    return (
      <div style={style}>
        <BacklogTaskRow
          task={task as TaskP}
          showMeta={showMeta}
          checked={selectedTaskIds.includes(task.id)}
          onCheck={onCheck}
          onTaskUpdate={onTaskUpdate}
          boards={boards}
          refreshBoards={refreshBoards as any}
        />
      </div>
    )
  }

  const autoHeight = Math.min(tasks.length * ITEM_HEIGHT, height)

  return (
    <List
      height={autoHeight}
      itemCount={tasks.length}
      itemSize={ITEM_HEIGHT}
      width='100%'
      overscanCount={3}
      onItemsRendered={({ visibleStopIndex }) => handleItemsRendered({ visibleStopIndex })}
      ref={listRef}
      style={{ overflowX: 'hidden' }}
    >
      {Row}
    </List>
  )
}
