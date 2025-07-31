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

export interface SprintMeeting {
  id: string
  sprintId: string
  sprintName: string
  createdAt: string
  updatedAt: string
}

export interface TaskUpdate {
  id: string
  title: string
  description: string
  priority: 'Low' | 'Medium' | 'High'
  reason: string
  itemVersion: number
  sprintMeetingId: string
  sprintName: string
  updateDeadline: string
}

export interface UnfinishedTask {
  id: string
  title: string
  description: string
  priority: 'Low' | 'Medium' | 'High'
  reason: string
  itemVersion: number
}

export interface CompletedTask {
  id: string
  title: string
  description: string
  priority: 'Low' | 'Medium' | 'High'
}

export interface SprintMeetingDetail {
  id: string
  sprintId: string
  sprintName: string
  unfinishedTasks: UnfinishedTask[]
  completedTasks: CompletedTask[]
  nextPlan: string
  createdAt: string
  updatedAt: string
}

export interface SprintMeetingUpdateRequest {
  unfinishedTasks: UnfinishedTask[]
  nextPlan: string
}
