import { projectApi } from '@/api/projects'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import LoadingSpinner from '@/components/LoadingSpinner'
import { Navbar } from '@/components/Navbar'
import { Sidebar } from '@/components/Sidebar'
import { useToast } from '@/hooks/use-toast'
import { useCurrentProject } from '@/hooks/useCurrentProject'
import { format } from 'date-fns'
import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { FiArrowLeft, FiClock, FiUser, FiEdit3, FiPlus, FiTrash2, FiSettings } from 'react-icons/fi'

interface ProjectLog {
  id: string
  projectMemberId: string
  fullName: string
  avatar: string
  actionType: string
  fieldChanged: string | null
  oldValue: string
  newValue: string
  description: string
  createAt: string
}

const getActionIcon = (actionType: string) => {
  switch (actionType) {
    case 'CreateProject':
      return <FiPlus className="h-4 w-4 text-green-600" />
    case 'DeleteProject':
      return <FiTrash2 className="h-4 w-4 text-red-600" />
    case 'JoinMember':
    case 'AddMember':
      return <FiUser className="h-4 w-4 text-green-600" />
    case 'LeaveMember':
    case 'LeaveProject':
      return <FiUser className="h-4 w-4 text-orange-600" />
    case 'RemoveMember':
      return <FiUser className="h-4 w-4 text-red-600" />
    case 'CreateSprint':
      return <FiPlus className="h-4 w-4 text-blue-600" />
    case 'UpdateSprint':
      return <FiEdit3 className="h-4 w-4 text-blue-600" />
    case 'UpdateProject':
      return <FiEdit3 className="h-4 w-4 text-blue-600" />
    case 'UpdateMember':
      return <FiSettings className="h-4 w-4 text-indigo-600" />
    default:
      return <FiEdit3 className="h-4 w-4 text-gray-600" />
  }
}

const getActionColor = (actionType: string) => {
  switch (actionType) {
    case 'CreateProject':
      return 'bg-green-50 border-green-200 text-green-800'
    case 'DeleteProject':
      return 'bg-red-50 border-red-200 text-red-800'
    case 'JoinMember':
    case 'AddMember':
      return 'bg-green-50 border-green-200 text-green-800'
    case 'LeaveMember':
    case 'LeaveProject':
      return 'bg-orange-50 border-orange-200 text-orange-800'
    case 'RemoveMember':
      return 'bg-red-50 border-red-200 text-red-800'
    case 'CreateSprint':
      return 'bg-blue-50 border-blue-200 text-blue-800'
    case 'UpdateSprint':
      return 'bg-blue-50 border-blue-200 text-blue-800'
    case 'UpdateProject':
      return 'bg-blue-50 border-blue-200 text-blue-800'
    case 'UpdateMember':
      return 'bg-indigo-50 border-indigo-200 text-indigo-800'
    default:
      return 'bg-gray-50 border-gray-200 text-gray-800'
  }
}

const getActionLabel = (actionType: string) => {
  switch (actionType) {
    case 'CreateProject':
      return 'Create Project'
    case 'DeleteProject':
      return 'Delete Project'
    case 'JoinMember':
    case 'AddMember':
      return 'Join Member'
    case 'LeaveMember':
    case 'LeaveProject':
      return 'Leave Member'
    case 'RemoveMember':
      return 'Remove Member'
    case 'CreateSprint':
      return 'Create Sprint'
    case 'UpdateSprint':
      return 'Update Sprint'
    case 'UpdateProject':
      return 'Update Project'
    case 'UpdateMember':
      return 'Update Member'
    default:
      return actionType.replace(/([A-Z])/g, ' $1').trim()
  }
}

export const ProjectActivityLog = () => {
  const { projectId } = useParams<{ projectId: string }>()
  const [logs, setLogs] = useState<ProjectLog[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isSidebarOpen, setIsSidebarOpen] = useState(true)
  const { toast } = useToast()
  const { currentProject } = useCurrentProject()

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen)

  useEffect(() => {
    const fetchLogs = async () => {
      if (!projectId) return
      
      try {
        setLoading(true)
        setError(null)
        const response = await projectApi.getProjectLog(projectId)
        setLogs(response.data)
      } catch (err) {
        console.error('Failed to fetch project logs:', err)
        setError('Failed to load activity logs')
        toast({
          title: 'Error',
          description: 'Failed to load activity logs'
        })
      } finally {
        setLoading(false)
      }
    }

    fetchLogs()
  }, [projectId, toast])

  if (loading) {
    return (
      <div className="flex h-screen bg-gray-50">
        <Sidebar
          isOpen={isSidebarOpen}
          onToggle={toggleSidebar}
          currentProject={currentProject || ({ id: projectId } as any)}
        />
        <div className="flex-1 flex flex-col overflow-hidden min-h-0">
          <Navbar isSidebarOpen={isSidebarOpen} toggleSidebar={toggleSidebar} />
          <div className="flex items-center justify-center h-full">
            <LoadingSpinner />
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex h-screen bg-gray-50">
        <Sidebar
          isOpen={isSidebarOpen}
          onToggle={toggleSidebar}
          currentProject={currentProject || ({ id: projectId } as any)}
        />
        <div className="flex-1 flex flex-col overflow-hidden min-h-0">
          <Navbar isSidebarOpen={isSidebarOpen} toggleSidebar={toggleSidebar} />
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <h1 className="text-2xl font-bold text-gray-900 mb-4">Error Loading Activity Log</h1>
              <p className="text-gray-600 mb-4">{error}</p>
              <Button onClick={() => window.location.reload()}>Try Again</Button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar
        isOpen={isSidebarOpen}
        onToggle={toggleSidebar}
        currentProject={currentProject || ({ id: projectId } as any)}
      />

      <div className="flex-1 flex flex-col overflow-hidden min-h-0">
        <Navbar isSidebarOpen={isSidebarOpen} toggleSidebar={toggleSidebar} />

        <div className="flex flex-col h-full bg-white min-h-0">
          {/* Header */}
          <div className="flex-none w-full p-6 pb-4">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-lavender-100 rounded-lg">
                    <FiClock className="h-6 w-6 text-lavender-600" />
                  </div>
                  <div>
                    <h1 className="text-3xl font-bold text-gray-900">Activity Log</h1>
                    <p className="text-sm text-gray-600">Project: {currentProject?.title || ''}</p>
                    <p className="text-sm text-gray-500 mt-1">Total activities: {logs.length}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Activity Log Content */}
          <div className="flex-1 overflow-hidden bg-white rounded-t-lg shadow-sm border border-gray-200 min-h-0">
            <div className="h-full p-6">
              {logs.length === 0 ? (
                <div className="text-center py-12">
                  <FiClock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No activities yet</h3>
                  <p className="text-gray-600">Activities will appear here as you work on the project</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {logs.map((log) => (
                    <div
                      key={log.id}
                      className="flex items-start gap-4 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      {/* Avatar */}
                      <div className="flex-shrink-0">
                        <img
                          src={log.avatar}
                          alt={log.fullName}
                          className="h-10 w-10 rounded-full border-2 border-gray-200"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement
                            target.src = '/logo.png'
                          }}
                        />
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="font-medium text-gray-900">{log.fullName}</span>
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border ${getActionColor(log.actionType)}`}
                          >
                            {getActionIcon(log.actionType)}
                            {getActionLabel(log.actionType)}
                          </span>
                        </div>
                        
                        <p className="text-gray-700 mb-2">{log.description}</p>
                        
                        {log.fieldChanged && (
                          <div className="text-sm text-gray-600 bg-gray-50 p-2 rounded border">
                            <span className="font-medium">Field:</span> {log.fieldChanged}
                            {log.oldValue && (
                              <span className="ml-2">
                                <span className="font-medium">From:</span> {log.oldValue}
                              </span>
                            )}
                            {log.newValue && (
                              <span className="ml-2">
                                <span className="font-medium">To:</span> {log.newValue}
                              </span>
                            )}
                          </div>
                        )}
                        
                        <div className="flex items-center gap-2 mt-3 text-sm text-gray-500">
                          <FiClock className="h-4 w-4" />
                          {format(new Date(log.createAt), 'MMM dd, yyyy HH:mm')}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
