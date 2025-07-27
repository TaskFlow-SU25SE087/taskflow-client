import { projectMemberApi } from '@/api/projectMembers'
import { Button } from '@/components/ui/button'
import { useToastContext } from '@/components/ui/ToastContext'
import { useCurrentProject } from '@/hooks/useCurrentProject'
import { TaskP } from '@/types/task'
import { SortableContext } from '@dnd-kit/sortable'
import { useEffect } from 'react'
import { SortableTaskCard } from './SortableTaskCard'

interface TaskListProps {
  tasks: TaskP[]
  onMoveToSprint?: (taskId: string) => void
  className?: string
  onTaskUpdate?: () => void
  compact?: boolean
}

export function TaskList({ tasks, onMoveToSprint, compact = false }: TaskListProps) {
  const { currentProject } = useCurrentProject()
  const { showToast } = useToastContext()

  useEffect(() => {
    const fetchMembers = async () => {
      if (!currentProject?.id) return

      try {
        const members = await projectMemberApi.getMembersByProjectId(currentProject.id)
        console.log('[ProjectMembers] fetchMembers response:', members)
      } catch (error) {
        console.error('Failed to fetch project members:', error)
        showToast({
          title: 'Error',
          description: 'Failed to load project members',
          variant: 'destructive'
        })
      }
    }
    fetchMembers()
  }, [currentProject?.id])

  return (
    <SortableContext items={tasks.map((task) => task.id)}>
      {tasks.map((task) => (
        <div key={task.id} className='relative'>
          <SortableTaskCard task={task} compact={compact} />
          {onMoveToSprint && (
            <div className='absolute top-2 right-2'>
              <Button size='sm' variant='outline' onClick={() => onMoveToSprint(task.id)}>
                Move to Sprint
              </Button>
            </div>
          )}
        </div>
      ))}
    </SortableContext>
  )
}
