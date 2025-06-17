import { ProjectMember } from './project'

export interface AuthResponse {
  accessToken: string
  refreshToken: string
}

export interface User {
  id: string
  fullName: string
  email: string
  password?: string
  role?: string
  status?: string
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  feedbacks?: any[]
  projectMembers?: ProjectMember[]
  phoneNumber?: string
}

export interface ApiError {
  message: string
  status?: number
}
