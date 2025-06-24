import { TaskP } from './task'

export interface Board {
  id: string
  projectId: string
  name: string
  description: string
  order: number
  isActive: boolean
  tasks: TaskP[]
}

export interface BoardP {
  id: string
  orders: number
  status: string
  projectId: string
  taskPs: TaskP[]
}
