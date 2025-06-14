import { TaskP } from './task'

export interface Board {
  id: string
  status: string
  taskPs: TaskP[]
  orders: number
}

export interface BoardP {
  id: string
  orders: number
  status: string
  projectId: string
  taskPs: TaskP[]
}
