/* eslint-disable @typescript-eslint/no-explicit-any */
import { User } from './auth'
import { Sprint } from './sprint'
import { TaskP } from './task'

export interface Project {
  id: string
  title: string
  analysisResults: any[] // idk yet
  boards: any[] // idk yet
  projectMembers: {
    role: string
    userId: string
    projectId: string
    user: null
  }[]
  sprints: Sprint[]
  taskPs: TaskP[]
}

export interface ProjectMember {
  role: string
  userId: string
  projectId: string
  project: Project | null
  evaluationResults: any[]
  user: User
}
