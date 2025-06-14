export interface Workflow {
  id: string
  oldStatus: string
  currentStatus: string
  newStatus: string
  updatedAt: Date
  taskId: string
}
