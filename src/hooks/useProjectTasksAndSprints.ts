import { TaskP } from '@/types/task'
import { useEffect, useState } from 'react'
import { useCurrentProject } from './useCurrentProject'
import { useSprints } from './useSprints'
import { useTasks } from './useTasks'

export function useProjectTasksAndSprints() {
  const { currentProject } = useCurrentProject()
  const { tasks, refreshTasks, isTaskLoading } = useTasks()
  const { sprints, isLoading: isSprintsLoading, refreshSprints } = useSprints(currentProject?.id)
  const [sprintTaskMap, setSprintTaskMap] = useState<Record<string, TaskP[]>>({})
  const [backlogTasks, setBacklogTasks] = useState<TaskP[]>([])

  useEffect(() => {
    if (!tasks || !sprints) return
    // Mapping sprintId -> list task
    const map: Record<string, TaskP[]> = {}
    sprints.forEach((sprint) => {
      map[sprint.id] = tasks.filter((task) => task.sprintId === sprint.id)
    })
    setSprintTaskMap(map)
    setBacklogTasks(tasks.filter((task) => !task.sprintId))
  }, [tasks, sprints])

  return {
    tasks,
    sprints,
    sprintTaskMap,
    backlogTasks,
    isTaskLoading,
    isSprintsLoading,
    refreshTasks,
    refreshSprints
  }
}
