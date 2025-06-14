import { ProjectMember } from './project'

export interface AuthResponse {
  id: string
  token: string
  name: string
  email: string
  role: string
}

export interface User {
  id: string
  name: string
  email: string
  password: string
  role: string
  status: string
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  feedbacks: any[] // Not clear yet
  projectMembers: ProjectMember[]
}
export interface ApiError {
  message: string
  status?: number
}
