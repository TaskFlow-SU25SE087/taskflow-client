import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { SprintMeetingDetail, UnfinishedTask } from '@/types/sprint'
import { format } from 'date-fns'
import { ArrowLeft, CheckCircle, Clock, Edit, Save, XCircle } from 'lucide-react'
import React, { useEffect, useState } from 'react'

interface SprintMeetingDetailProps {
  meetingDetail: SprintMeetingDetail | null
  onBack: () => void
  onUpdate: (data: { unfinishedTasks: UnfinishedTask[]; nextPlan: string }) => Promise<boolean>
  onUpdateNextPlan: (nextPlan: string) => Promise<boolean>
  loading?: boolean
}

export const SprintMeetingDetail: React.FC<SprintMeetingDetailProps> = ({
  meetingDetail,
  onBack,
  onUpdate,
  onUpdateNextPlan,
  loading = false
}) => {
  const [isEditing, setIsEditing] = useState(false)
  const [nextPlan, setNextPlan] = useState('')
  const [unfinishedTasks, setUnfinishedTasks] = useState<UnfinishedTask[]>([])
  const [editingTask, setEditingTask] = useState<UnfinishedTask | null>(null)
  const [isTaskDialogOpen, setIsTaskDialogOpen] = useState(false)

  useEffect(() => {
    if (meetingDetail) {
      setNextPlan(meetingDetail.nextPlan || '')
      setUnfinishedTasks(meetingDetail.unfinishedTasks || [])
    }
  }, [meetingDetail])

  const handleSave = async () => {
    if (await onUpdate({ unfinishedTasks, nextPlan })) {
      setIsEditing(false)
    }
  }

  const handleUpdateNextPlan = async () => {
    if (await onUpdateNextPlan(nextPlan)) {
      setIsEditing(false)
    }
  }

  const handleEditTask = (task: UnfinishedTask) => {
    setEditingTask(task)
    setIsTaskDialogOpen(true)
  }

  const handleSaveTask = (updatedTask: UnfinishedTask) => {
    setUnfinishedTasks(prev => 
      prev.map(task => task.id === updatedTask.id ? updatedTask : task)
    )
    setIsTaskDialogOpen(false)
    setEditingTask(null)
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
          <div className="h-4 bg-gray-200 rounded w-3/4"></div>
        </CardContent>
      </Card>
    )
  }

  if (!meetingDetail) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <XCircle className="h-12 w-12 text-red-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Meeting Not Found</h3>
          <p className="text-gray-500">The sprint meeting details could not be loaded.</p>
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
        <div className="flex items-center space-x-3">
          <Button variant="ghost" onClick={onBack}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-2xl font-bold">{meetingDetail.sprintName}</h1>
            <p className="text-gray-600">Sprint Meeting Details</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Badge variant="secondary">
            <Clock className="h-3 w-3 mr-1" />
            {format(new Date(meetingDetail.updatedAt), 'MMM dd, yyyy HH:mm')}
          </Badge>
          <Button
            variant={isEditing ? "default" : "outline"}
            onClick={() => setIsEditing(!isEditing)}
          >
            {isEditing ? <Save className="h-4 w-4 mr-2" /> : <Edit className="h-4 w-4 mr-2" />}
            {isEditing ? 'Save' : 'Edit'}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Unfinished Tasks */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <XCircle className="h-5 w-5 text-orange-600" />
              <span>Unfinished Tasks</span>
              <Badge variant="outline">{unfinishedTasks.length}</Badge>
            </CardTitle>
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
                      {isEditing && (
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
          <CardTitle>Next Plan</CardTitle>
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
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

interface TaskEditFormProps {
  task: UnfinishedTask
  onSave: (task: UnfinishedTask) => void
  onCancel: () => void
}

const TaskEditForm: React.FC<TaskEditFormProps> = ({ task, onSave, onCancel }) => {
  const [formData, setFormData] = useState({
    title: task.title,
    description: task.description,
    priority: task.priority,
    reason: task.reason,
    itemVersion: task.itemVersion
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
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
        />
      </div>
      
      <div>
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
          rows={3}
        />
      </div>
      
      <div>
        <Label htmlFor="priority">Priority</Label>
        <Select
          value={formData.priority}
          onValueChange={(value) => setFormData(prev => ({ ...prev, priority: value as any }))}
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
        <Label htmlFor="reason">Reason</Label>
        <Textarea
          id="reason"
          value={formData.reason}
          onChange={(e) => setFormData(prev => ({ ...prev, reason: e.target.value }))}
          rows={2}
        />
      </div>
      
      <div className="flex justify-end space-x-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit">
          Save Changes
        </Button>
      </div>
    </form>
  )
} 