import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { SprintMeetingDetail as SprintMeetingDetailType, UnfinishedTask } from '@/types/sprint'
import { canUpdateSprintMeeting, formatLastUpdateTime, getUpdateRestrictionMessage } from '@/utils/sprintMeetingUtils'
import { AlertTriangle, ArrowLeft, CheckCircle, Clock, Edit, XCircle } from 'lucide-react'
import React, { useEffect, useState } from 'react'

interface SprintMeetingDetailProps {
  meetingDetail: SprintMeetingDetailType | null
  onBack: () => void
  onUpdate: (data: { unfinishedTasks: UnfinishedTask[]; nextPlan: string }) => Promise<boolean>
  onUpdateNextPlan: (nextPlan: string) => Promise<boolean>
  onUpdateTask?: (taskId: string, itemVersion: number, taskData: {
    title: string
    description: string
    priority: string
    reason: string
  }) => Promise<boolean>
  onRefreshMeeting?: () => Promise<void>  // Thêm callback để refresh
  onVersionConflict?: (message: string, newItemVersion?: number, taskId?: string, reason?: string) => void
  loading?: boolean
}

export const SprintMeetingDetail: React.FC<SprintMeetingDetailProps> = ({
  meetingDetail,
  onBack,
  // onUpdate,
  onUpdateNextPlan,
  onUpdateTask,
  onRefreshMeeting,  // Thêm prop
  // onVersionConflict,  // Thêm prop
  loading = false
}) => {
  const [isEditing, setIsEditing] = useState(false)
  const [nextPlan, setNextPlan] = useState('')
  const [unfinishedTasks, setUnfinishedTasks] = useState<UnfinishedTask[]>([])
  const [editingTask, setEditingTask] = useState<UnfinishedTask | null>(null)
  const [isTaskDialogOpen, setIsTaskDialogOpen] = useState(false)
  const [updatingTaskId, setUpdatingTaskId] = useState<string | null>(null)
  const [versionConflictDialog, setVersionConflictDialog] = useState<{
    isOpen: boolean
    message: string
    newItemVersion?: number
    taskId?: string
    reason?: string
  }>({
    isOpen: false,
    message: '',
    newItemVersion: undefined,
    taskId: undefined,
    reason: undefined
  })

  useEffect(() => {
    if (meetingDetail) {
      setNextPlan(meetingDetail.nextPlan || '')
      setUnfinishedTasks(meetingDetail.unfinishedTasks || [])
    }
  }, [meetingDetail])

  // Check if meeting can be updated
  const canUpdate = meetingDetail ? canUpdateSprintMeeting(meetingDetail) : false
  const updateRestrictionMessage = meetingDetail ? getUpdateRestrictionMessage(meetingDetail) : ''

  // const handleSave = async () => {
  //   if (await onUpdate({ unfinishedTasks, nextPlan })) {
  //     setIsEditing(false)
  //   }
  // }

  const handleUpdateNextPlan = async () => {
    if (await onUpdateNextPlan(nextPlan)) {
      setIsEditing(false)
      // Refresh meeting detail sau khi update
      if (onRefreshMeeting) {
        await onRefreshMeeting()
      }
    }
  }

  const handleEditTask = (task: UnfinishedTask) => {
    // Ensure we have the latest task data with safe defaults
    const currentTask = unfinishedTasks.find(t => t.id === task.id) || task
    const safeTask = {
      ...currentTask,
      title: currentTask.title || '',
      description: currentTask.description || '',
      priority: currentTask.priority || 'Medium',
      reason: currentTask.reason || '',
      itemVersion: currentTask.itemVersion || 1
    }
    setEditingTask(safeTask)
    setIsTaskDialogOpen(true)
  }

  const handleSaveTask = async (updatedTask: UnfinishedTask) => {
    if (!onUpdateTask) {
      // Fallback to local update if no server update function
      setUnfinishedTasks(prev => 
        prev.map(task => task.id === updatedTask.id ? updatedTask : task)
      )
      setIsTaskDialogOpen(false)
      setEditingTask(null)
      return
    }

    // Send update to server
    setUpdatingTaskId(updatedTask.id)
    try {
      const taskData = {
        title: updatedTask.title,
        description: updatedTask.description,
        priority: updatedTask.priority,
        reason: updatedTask.reason
      }
      
      const success = await onUpdateTask(
        updatedTask.id, 
        updatedTask.itemVersion, 
        taskData
      )
      
      if (success) {
        // Update local state immediately to reflect changes
        setUnfinishedTasks(prev => 
          prev.map(task => task.id === updatedTask.id ? updatedTask : task)
        )
        
        // Refresh meeting detail to get updated data from server
        if (onRefreshMeeting) {
          await onRefreshMeeting()
        }
        setIsTaskDialogOpen(false)
        setEditingTask(null)
      }
    } catch (error) {
      console.error('Failed to update task:', error)
    } finally {
      setUpdatingTaskId(null)
    }
  }

  const handleVersionConflict = (message: string, newItemVersion?: number, taskId?: string, reason?: string) => {
    setVersionConflictDialog({
      isOpen: true,
      message,
      newItemVersion,
      taskId,
      reason
    })
  }

  const handleOverwriteTask = async () => {
    if (!versionConflictDialog.taskId || !versionConflictDialog.reason || !onUpdateTask) return
    
    try {
      const success = await onUpdateTask(
        versionConflictDialog.taskId,
        versionConflictDialog.newItemVersion || 1,
        {
          title: editingTask?.title || '',
          description: editingTask?.description || '',
          priority: editingTask?.priority || 'Medium',
          reason: versionConflictDialog.reason
        }
      )
      
      if (success) {
        if (onRefreshMeeting) {
          await onRefreshMeeting()
        }
        setIsTaskDialogOpen(false)
        setEditingTask(null)
      }
    } catch (error) {
      console.error('Failed to overwrite task:', error)
    } finally {
      setVersionConflictDialog({ isOpen: false, message: '', newItemVersion: undefined, taskId: undefined, reason: undefined })
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

  if (loading) {
    return (
      <Card className="animate-pulse">
        <CardContent className="p-6">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-2/3"></div>
        </CardContent>
      </Card>
    )
  }

  if (!meetingDetail) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <AlertTriangle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Meeting Not Found</h3>
          <p className="text-gray-500">The requested meeting could not be loaded.</p>
          <Button onClick={onBack} className="mt-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to List
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="outline" onClick={onBack}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to List
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{meetingDetail.sprintName}</h1>
            <p className="text-gray-600">Sprint Meeting Details</p>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          <Badge variant={canUpdate ? "secondary" : "destructive"}>
            {canUpdate ? 'Updatable' : 'Read Only'}
          </Badge>
          <Badge variant="outline">
            <Clock className="h-3 w-3 mr-1" />
            {formatLastUpdateTime(meetingDetail)}
          </Badge>
          {onRefreshMeeting && (
            <Button
              variant="outline"
              size="sm"
              onClick={onRefreshMeeting}
              disabled={loading}
            >
              <Clock className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          )}
        </div>
      </div>

      {/* Warning Banner for Non-updatable Meetings */}
      {!canUpdate && (
        <Card className="border-orange-200 bg-orange-50">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="h-5 w-5 text-orange-600" />
              <div>
                <p className="text-orange-800 font-medium">Meeting Cannot Be Updated</p>
                <p className="text-orange-700 text-sm">
                  {updateRestrictionMessage}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Unfinished Tasks */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center space-x-2">
                <XCircle className="h-5 w-5 text-orange-600" />
                <span>Unfinished Tasks</span>
                <Badge variant="outline">{unfinishedTasks.length}</Badge>
              </CardTitle>
              {canUpdate && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsEditing(!isEditing)}
                >
                  {isEditing ? 'Cancel Edit' : 'Edit Tasks'}
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {unfinishedTasks.length === 0 ? (
              <p className="text-gray-500 text-center py-4">No unfinished tasks</p>
            ) : (
              <div className="space-y-3">
                {unfinishedTasks.map((task) => (
                  <div key={task.id} className="border rounded-lg p-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="font-medium">{task.title}</h4>
                        <p className="text-sm text-gray-600 mt-1">{task.description}</p>
                        <div className="flex items-center space-x-2 mt-2">
                          <Badge className={getPriorityColor(task.priority)}>
                            {task.priority}
                          </Badge>
                          <span className="text-xs text-gray-500">v{task.itemVersion}</span>
                        </div>
                        {task.reason && (
                          <p className="text-sm text-gray-600 mt-2">
                            <strong>Reason:</strong> {task.reason}
                          </p>
                        )}
                      </div>
                      {canUpdate && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditTask(task)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Completed Tasks */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <span>Completed Tasks</span>
              <Badge variant="outline">{meetingDetail.completedTasks.length}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {meetingDetail.completedTasks.length === 0 ? (
              <p className="text-gray-500 text-center py-4">No completed tasks</p>
            ) : (
              <div className="space-y-3">
                {meetingDetail.completedTasks.map((task) => (
                  <div key={task.id} className="border rounded-lg p-3 bg-green-50">
                    <h4 className="font-medium">{task.title}</h4>
                    <p className="text-sm text-gray-600 mt-1">{task.description}</p>
                    <Badge className={getPriorityColor(task.priority)}>
                      {task.priority}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Next Plan */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Next Plan</CardTitle>
            {canUpdate && (
              <Button
                variant={isEditing ? "default" : "outline"}
                size="sm"
                onClick={() => setIsEditing(!isEditing)}
              >
                {isEditing ? 'Cancel' : 'Edit'}
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {isEditing ? (
            <div className="space-y-4">
              <Textarea
                value={nextPlan}
                onChange={(e) => setNextPlan(e.target.value)}
                placeholder="Enter the next plan..."
                rows={4}
              />
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setIsEditing(false)}>
                  Cancel
                </Button>
                <Button onClick={handleUpdateNextPlan}>
                  Save Next Plan
                </Button>
              </div>
            </div>
          ) : (
            <div>
              {nextPlan ? (
                <p className="whitespace-pre-wrap">{nextPlan}</p>
              ) : (
                <p className="text-gray-500">No next plan defined</p>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Task Edit Dialog */}
      <Dialog open={isTaskDialogOpen} onOpenChange={setIsTaskDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Task</DialogTitle>
          </DialogHeader>
          {editingTask && (
            <TaskEditForm
              task={editingTask}
              onSave={handleSaveTask}
              onCancel={() => {
                setIsTaskDialogOpen(false)
                setEditingTask(null)
              }}
              updatingTaskId={updatingTaskId}
              onVersionConflict={handleVersionConflict}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Version Conflict Dialog */}
      <Dialog open={versionConflictDialog.isOpen} onOpenChange={(open) => setVersionConflictDialog(prev => ({ ...prev, isOpen: open }))}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Version Conflict</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-gray-800">{versionConflictDialog.message}</p>
            <p className="text-sm text-gray-600 mt-2">
              <strong>Current Version:</strong> {editingTask?.itemVersion}
            </p>
            <p className="text-sm text-gray-600">
              <strong>New Version:</strong> {versionConflictDialog.newItemVersion}
            </p>
            <p className="text-sm text-gray-600">
              <strong>Reason:</strong> {versionConflictDialog.reason}
            </p>
          </div>
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => setVersionConflictDialog({ ...versionConflictDialog, isOpen: false })}>
              Cancel
            </Button>
            <Button variant="default" onClick={handleOverwriteTask}>
              Overwrite
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

interface TaskEditFormProps {
  task: UnfinishedTask
  onSave: (task: UnfinishedTask) => void
  onCancel: () => void
  updatingTaskId?: string | null
  onVersionConflict: (message: string, newItemVersion?: number, taskId?: string, reason?: string) => void
}

const TaskEditForm: React.FC<TaskEditFormProps> = ({ task, onSave, onCancel, updatingTaskId, onVersionConflict }) => {
  const [formData, setFormData] = useState({
    title: task.title || '',
    description: task.description || '',
    priority: task.priority || 'Medium',
    reason: task.reason || '',
    itemVersion: task.itemVersion || 1
  })

  // Update form data when task changes
  useEffect(() => {
    setFormData({
      title: task.title || '',
      description: task.description || '',
      priority: task.priority || 'Medium',
      reason: task.reason || '',
      itemVersion: task.itemVersion || 1
    })
  }, [task])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    // Check if there's a version conflict callback
    if (onVersionConflict && typeof onVersionConflict === 'function') {
      // Simulate version conflict for testing - in real scenario this would come from API
      // onVersionConflict('Someone has updated the reason. Do you want to overwrite it?', task.itemVersion + 1, task.id, formData.reason)
    }
    
    onSave({
      ...task,
      ...formData
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      
      <div>
        <Label htmlFor="title">Title</Label>
        <Input
          id="title"
          value={formData.title}
          onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
          required
          disabled
        />
      </div>
      
      <div>
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
          rows={3}
          disabled
        />
      </div>
      
      <div>
        <Label htmlFor="priority">Priority</Label>
        <Select
          value={formData.priority}
          onValueChange={(value) => setFormData(prev => ({ ...prev, priority: value as any }))}
          disabled
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Low">Low</SelectItem>
            <SelectItem value="Medium">Medium</SelectItem>
            <SelectItem value="High">High</SelectItem>
          </SelectContent>
        </Select>
      </div>
      
      <div>
        <Label htmlFor="reason">Reason *</Label>
        <Textarea
          id="reason"
          value={formData.reason}
          onChange={(e) => setFormData(prev => ({ ...prev, reason: e.target.value }))}
          rows={2}
          disabled={updatingTaskId === task.id}
          required
        />
        <p className="text-xs text-gray-500 mt-1">This field will be updated on the server</p>
      </div>
      
      <div className="flex justify-end space-x-2">
        <Button 
          type="button" 
          variant="outline" 
          onClick={onCancel}
          disabled={updatingTaskId === task.id}
        >
          Cancel
        </Button>
        <Button 
          type="submit"
          disabled={updatingTaskId === task.id}
        >
          {updatingTaskId === task.id ? 'Saving...' : 'Save Changes'}
        </Button>
      </div>
    </form>
  )
} 