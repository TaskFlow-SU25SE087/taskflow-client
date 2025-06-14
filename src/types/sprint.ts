import { Project } from './project'
import { TaskP } from './task'

export interface Sprint {
  id: string
  name: string
  startDate: Date | null
  endDate: Date | null
  projectId: string
  project: Project
  taskPs: TaskP[]
}
