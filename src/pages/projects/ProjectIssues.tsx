import { IssueCreateMenu } from '@/components/tasks/IssueCreateMenu'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useCurrentProject } from '@/hooks/useCurrentProject'
import { useIssues } from '@/hooks/useIssues'
import { Issue, IssuePriority, IssueStatus, IssueType } from '@/types/issue'
import { AlertCircle, Bug, FileText, Lightbulb, MessageSquare, Plus } from 'lucide-react'
import React, { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'

const priorityOptions = [
  { value: IssuePriority.Low, label: 'Low', color: 'bg-blue-100 text-blue-800' },
  { value: IssuePriority.Medium, label: 'Medium', color: 'bg-orange-100 text-orange-800' },
  { value: IssuePriority.High, label: 'High', color: 'bg-red-100 text-red-800' },
  { value: IssuePriority.Urgent, label: 'Urgent', color: 'bg-red-200 text-red-900' },
]

const typeOptions = [
  { value: IssueType.Bug, label: 'Bug', icon: Bug, color: 'bg-red-100 text-red-800' },
  { value: IssueType.FeatureRequest, label: 'Feature Request', icon: Plus, color: 'bg-green-100 text-green-800' },
  { value: IssueType.Improvement, label: 'Improvement', icon: Lightbulb, color: 'bg-blue-100 text-blue-800' },
  { value: IssueType.Task, label: 'Task', icon: MessageSquare, color: 'bg-purple-100 text-purple-800' },
  { value: IssueType.Documentation, label: 'Documentation', icon: FileText, color: 'bg-purple-100 text-purple-800' },
  { value: IssueType.Other, label: 'Other', icon: AlertCircle, color: 'bg-gray-100 text-gray-800' },
]

const statusOptions = [
  { value: IssueStatus.Open, label: 'Open', color: 'bg-green-100 text-green-800' },
  { value: IssueStatus.InProgress, label: 'In Progress', color: 'bg-blue-100 text-blue-800' },
  { value: IssueStatus.Resolved, label: 'Resolved', color: 'bg-purple-100 text-purple-800' },
  { value: IssueStatus.Closed, label: 'Closed', color: 'bg-gray-100 text-gray-800' },
  { value: IssueStatus.Reopened, label: 'Reopened', color: 'bg-orange-100 text-orange-800' },
  { value: IssueStatus.OnHold, label: 'On Hold', color: 'bg-yellow-100 text-yellow-800' },
  { value: IssueStatus.Cancelled, label: 'Cancelled', color: 'bg-red-100 text-red-800' },
]

export const ProjectIssues: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>()
  const { currentProject } = useCurrentProject()
  const { getProjectIssues, isLoading } = useIssues()
  const [issues, setIssues] = useState<Issue[]>([])
  const [selectedTaskId, setSelectedTaskId] = useState<string>('')

  useEffect(() => {
    if (projectId) {
      loadIssues()
    }
  }, [projectId])

  const loadIssues = async () => {
    if (!projectId) return
    try {
      const projectIssues = await getProjectIssues(projectId)
      setIssues(projectIssues || [])
    } catch (error) {
      console.error('Error loading issues:', error)
    }
  }

  const getPriorityInfo = (priority: IssuePriority) => {
    return priorityOptions.find(p => p.value === priority) || priorityOptions[0]
  }

  const getTypeInfo = (type: IssueType) => {
    return typeOptions.find(t => t.value === type) || typeOptions[5]
  }

  const getStatusInfo = (status: IssueStatus) => {
    return statusOptions.find(s => s.value === status) || statusOptions[0]
  }

  const handleIssueCreated = () => {
    loadIssues()
  }

  if (!currentProject) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Project Selected</h3>
          <p className="text-gray-500">Please select a project to view issues.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Project Issues</h1>
          <p className="text-gray-600 mt-2">
            Manage and track issues for {currentProject.name}
          </p>
        </div>
        <div className="flex gap-2">
          <IssueCreateMenu
            projectId={currentProject.id}
            taskId={selectedTaskId || 'demo-task-id'}
            onIssueCreated={handleIssueCreated}
          />
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-4"></div>
            <p className="text-gray-500">Loading issues...</p>
          </div>
        </div>
      ) : issues.length === 0 ? (
        <Card>
          <CardContent className="flex items-center justify-center h-64">
            <div className="text-center">
              <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Issues Found</h3>
              <p className="text-gray-500 mb-4">
                There are no issues reported for this project yet.
              </p>
              <IssueCreateMenu
                projectId={currentProject.id}
                taskId={selectedTaskId || 'demo-task-id'}
                onIssueCreated={handleIssueCreated}
              />
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {issues.map((issue) => {
            const priorityInfo = getPriorityInfo(issue.priority)
            const typeInfo = getTypeInfo(issue.type)
            const statusInfo = getStatusInfo(issue.status)
            const TypeIcon = typeInfo.icon

            return (
              <Card key={issue.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <TypeIcon className="h-5 w-5 text-gray-600" />
                        <CardTitle className="text-lg">{issue.title}</CardTitle>
                      </div>
                      <div className="flex items-center gap-2 mb-3">
                        <Badge className={priorityInfo.color}>
                          {priorityInfo.label}
                        </Badge>
                        <Badge className={typeInfo.color}>
                          {typeInfo.label}
                        </Badge>
                        <Badge className={statusInfo.color}>
                          {statusInfo.label}
                        </Badge>
                        <span className="text-sm text-gray-500">
                          Created {new Date(issue.createdAt || '').toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-medium text-gray-900 mb-1">Description</h4>
                      <p className="text-gray-600">{issue.description}</p>
                    </div>
                    
                    {issue.explanation && (
                      <div>
                        <h4 className="font-medium text-gray-900 mb-1">Explanation</h4>
                        <p className="text-gray-600">{issue.explanation}</p>
                      </div>
                    )}
                    
                    {issue.example && (
                      <div>
                        <h4 className="font-medium text-gray-900 mb-1">Example</h4>
                        <p className="text-gray-600">{issue.example}</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
} 