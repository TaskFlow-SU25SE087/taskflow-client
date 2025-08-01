/* eslint-disable @typescript-eslint/no-explicit-any */
import { Sprint } from './sprint'
import { TaskP } from './task'

export interface Project {
  id: string
  title: string
  description: string
  ownerId?: string
  createdAt?: string
  lastUpdate?: string
  role?: string
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
  id?: string
  role: string
  userId: string
  projectId?: string
  project?: Project | null
  evaluationResults?: any[]
  // user?: User
  fullName?: string
  avatar?: string
  email?: string
}

export interface GitMemberLocal {
  id: string
  projectMemberId: string
  projectPartId: string
  nameLocal: string
  emailLocal: string
  createdAt?: string
  updatedAt?: string
}

export interface ProjectListItem {
  id: string
  title: string
  description: string
  ownerId: string
  lastUpdate: string
  role: string
  createdAt: string
}

export interface ProjectDetail {
  id: string
  title: string
  description: string
  ownerId: string
  createdAt: string
  lastUpdate: string
  boards: BoardDetail[]
}

export interface BoardDetail {
  id: string
  projectId: string
  name: string
  description: string
  order: number
  isActive: boolean
  tasks: TaskDetail[]
}

export interface TaskDetail {
  id: string
  title: string
  description: string
  priority: string
  createdAt: string
  updatedAt: string
  isActive: boolean
  sprintName: string
  comments: TaskComment[]
  tags: TaskTag[]
}

export interface TaskComment {
  id: string
  content: string
  createdAt: string
  userId: string
}

export interface TaskTag {
  id: string
  name: string
  description: string
}

export interface Tag {
  id: string
  name: string
  description: string
  color: string
}
