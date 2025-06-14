/* eslint-disable @typescript-eslint/no-explicit-any */
import { Workflow } from './workflow'
// export interface TaskP {
//   id: string
//   type: 'todo' | 'ongoing' | 'done' | string
//   description: string
//   startDate: string
//   endDate: string
// }

export interface TaskP {
  id: string
  title: string
  description: string
  priority: number
  created: string
  updated: string
  status: string
  reporterId: string | null
  assigneeId: string | null
  projectId: string
  sprintId: string | null
  boardId: string | null
  assignee: any | null
  board: any | null
  issues: any[]
  project: any | null
  reporter: any | null
  sprint: any | null
  workflows: any[]
  tags: any[]
}

export interface Task {
  id: string
  status: string
  name: string
  description: string
  priority: string
  startDate: Date
  endDate: Date
  projectMemberId: string | null
  projectId: string
  issues: unknown[]
  project: unknown | null
  projectMember: unknown | null
  taskSprints: unknown[]
  workflows: Workflow[]
}
