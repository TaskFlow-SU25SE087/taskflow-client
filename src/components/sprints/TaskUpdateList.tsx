import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { TaskUpdate } from '@/types/sprint'
import { format } from 'date-fns'
import { AlertTriangle, Calendar, CheckCircle, Clock } from 'lucide-react'
import React from 'react'

interface TaskUpdateListProps {
  taskUpdates: TaskUpdate[]
  onUpdateTask: (taskId: string, itemVersion: number, reason: string) => Promise<boolean>
  loading?: boolean
}

export const TaskUpdateList: React.FC<TaskUpdateListProps> = ({
  taskUpdates,
  onUpdateTask,
  loading = false
}) => {
  const [updatingTaskId, setUpdatingTaskId] = React.useState<string | null>(null)
  const [updateReason, setUpdateReason] = React.useState('')
  const [showUpdateDialog, setShowUpdateDialog] = React.useState(false)
  const [selectedTask, setSelectedTask] = React.useState<TaskUpdate | null>(null)

  const handleUpdateClick = (task: TaskUpdate) => {
    setSelectedTask(task)
    setUpdateReason('')
    setShowUpdateDialog(true)
  }

  const handleSubmitUpdate = async () => {
    if (!selectedTask || !updateReason.trim()) return

    setUpdatingTaskId(selectedTask.id)
    try {
      const success = await onUpdateTask(selectedTask.id, selectedTask.itemVersion, updateReason)
      if (success) {
        setShowUpdateDialog(false)
        setSelectedTask(null)
        setUpdateReason('')
      }
    } finally {
      setUpdatingTaskId(null)
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'High': return 'bg-red-100 text-red-800'
      case 'Medium': return 'bg-yellow-100 text-yellow-800'
      case 'Low': return 'bg-green-100 text-green-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getDeadlineStatus = (deadline: string) => {
    const now = new Date()
    const deadlineDate = new Date(deadline)
    const diffTime = deadlineDate.getTime() - now.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

    if (diffDays < 0) {
      return { status: 'overdue', color: 'bg-red-100 text-red-800', icon: AlertTriangle }
    } else if (diffDays <= 1) {
      return { status: 'urgent', color: 'bg-orange-100 text-orange-800', icon: AlertTriangle }
    } else if (diffDays <= 3) {
      return { status: 'soon', color: 'bg-yellow-100 text-yellow-800', icon: Clock }
    } else {
      return { status: 'ok', color: 'bg-green-100 text-green-800', icon: CheckCircle }
    }
  }

  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, index) => (
          <Card key={index} className="animate-pulse">
            <CardContent className="p-6">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-1/2"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  if (taskUpdates.length === 0) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Task Updates</h3>
          <p className="text-gray-500">No task updates are pending.</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {taskUpdates.map((task) => {
        const deadlineStatus = getDeadlineStatus(task.updateDeadline)
        const DeadlineIcon = deadlineStatus.icon

        return (
          <Card key={task.id} className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Calendar className="h-5 w-5 text-blue-600" />
                  <CardTitle className="text-lg">{task.title}</CardTitle>
                  <Badge className={getPriorityColor(task.priority)}>
                    {task.priority}
                  </Badge>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleUpdateClick(task)}
                  disabled={updatingTaskId === task.id}
                >
                  {updatingTaskId === task.id ? 'Updating...' : 'Update Task'}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <p className="text-gray-700">{task.description}</p>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div className="flex items-center space-x-2">
                    <Clock className="h-4 w-4 text-gray-500" />
                    <span className="text-gray-600">
                      Deadline: {format(new Date(task.updateDeadline), 'MMM dd, yyyy')}
                    </span>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <DeadlineIcon className="h-4 w-4" />
                    <Badge className={deadlineStatus.color}>
                      {deadlineStatus.status === 'overdue' && 'Overdue'}
                      {deadlineStatus.status === 'urgent' && 'Urgent'}
                      {deadlineStatus.status === 'soon' && 'Due Soon'}
                      {deadlineStatus.status === 'ok' && 'On Track'}
                    </Badge>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <span className="text-gray-600">Version: {task.itemVersion}</span>
                  </div>
                </div>

                {task.reason && (
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <p className="text-sm text-gray-700">
                      <strong>Current Reason:</strong> {task.reason}
                    </p>
                  </div>
                )}

                <div className="text-xs text-gray-500">
                  Sprint: {task.sprintName}
                </div>
              </div>
            </CardContent>
          </Card>
        )
      })}

      {/* Update Dialog */}
      {showUpdateDialog && selectedTask && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9994]">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-medium mb-4">Update Task: {selectedTask.title}</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Update Reason
                </label>
                <textarea
                  value={updateReason}
                  onChange={(e) => setUpdateReason(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={4}
                  placeholder="Enter the reason for this update..."
                />
              </div>
              
              <div className="flex justify-end space-x-3">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowUpdateDialog(false)
                    setSelectedTask(null)
                    setUpdateReason('')
                  }}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSubmitUpdate}
                  disabled={!updateReason.trim() || updatingTaskId === selectedTask.id}
                >
                  {updatingTaskId === selectedTask.id ? 'Updating...' : 'Update Task'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
} 