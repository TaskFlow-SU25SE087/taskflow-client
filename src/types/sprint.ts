import { Project } from './project'
import { TaskP } from './task'

export interface Sprint {
  id: string
  name: string
  description: string
  startDate: string
  endDate: string
  status: number
  projectId: string
  project: Project
  taskPs: TaskP[]
}
