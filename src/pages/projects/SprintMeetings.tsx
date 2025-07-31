import { Navbar } from '@/components/Navbar'
import { Sidebar } from '@/components/Sidebar'
import { SprintMeetingDetail } from '@/components/sprints/SprintMeetingDetail'
import { SprintMeetingList } from '@/components/sprints/SprintMeetingList'
import { TaskUpdateList } from '@/components/sprints/TaskUpdateList'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Loader } from '@/components/ui/loader'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useCurrentProject } from '@/hooks/useCurrentProject'
import { useSprintMeetings } from '@/hooks/useSprintMeetings'
import { SprintMeetingDetail as SprintMeetingDetailType } from '@/types/sprint'
import { Calendar, Clock, TrendingUp, Users } from 'lucide-react'
import React, { useState } from 'react'
import { useParams } from 'react-router-dom'

const SprintMeetings: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>()
  const { currentProject, isLoading } = useCurrentProject()
  const [isSidebarOpen, setIsSidebarOpen] = useState(true)
  const [selectedMeetingId, setSelectedMeetingId] = useState<string | null>(null)
  const [meetingDetail, setMeetingDetail] = useState<SprintMeetingDetailType | null>(null)
  const [loadingDetail, setLoadingDetail] = useState(false)

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen)
  }

  const {
    sprintMeetings,
    taskUpdates,
    loading,
    error,
    fetchSprintMeetings,
    fetchTaskUpdates,
    getSprintMeetingDetail,
    updateSprintMeetingTask,
    updateSprintMeeting,
    updateNextPlan
  } = useSprintMeetings(projectId || '')

  const handleViewDetail = async (meetingId: string) => {
    setSelectedMeetingId(meetingId)
    setLoadingDetail(true)
    
    try {
      const detail = await getSprintMeetingDetail(meetingId)
      setMeetingDetail(detail)
    } catch (err) {
      console.error('Failed to load meeting detail:', err)
    } finally {
      setLoadingDetail(false)
    }
  }

  const handleBackToList = () => {
    setSelectedMeetingId(null)
    setMeetingDetail(null)
  }

  const handleUpdateMeeting = async (data: { unfinishedTasks: any[]; nextPlan: string }) => {
    if (!selectedMeetingId) return false
    
    const success = await updateSprintMeeting(selectedMeetingId, data)
    if (success) {
      // Refresh the meeting detail
      const detail = await getSprintMeetingDetail(selectedMeetingId)
      setMeetingDetail(detail)
    }
    return success
  }

  const handleUpdateNextPlan = async (nextPlan: string) => {
    if (!selectedMeetingId) return false
    
    const success = await updateNextPlan(selectedMeetingId, nextPlan)
    if (success) {
      // Refresh the meeting detail
      const detail = await getSprintMeetingDetail(selectedMeetingId)
      setMeetingDetail(detail)
    }
    return success
  }

  const handleUpdateTask = async (taskId: string, itemVersion: number, reason: string) => {
    if (!selectedMeetingId) return false
    
    const success = await updateSprintMeetingTask(selectedMeetingId, taskId, itemVersion, reason)
    if (success) {
      // Refresh data
      fetchTaskUpdates()
      if (meetingDetail) {
        const detail = await getSprintMeetingDetail(selectedMeetingId)
        setMeetingDetail(detail)
      }
    }
    return success
  }

  if (isLoading || !currentProject) {
    return (
      <div className='flex h-screen bg-gray-100'>
        <Sidebar isOpen={isSidebarOpen} onToggle={toggleSidebar} currentProject={currentProject} />
        <div className='flex-1 flex flex-col overflow-hidden'>
          <Navbar isSidebarOpen={isSidebarOpen} toggleSidebar={toggleSidebar} />
          <div className='flex items-center justify-center flex-1'>
            <Loader />
          </div>
        </div>
      </div>
    )
  }

  // If viewing a specific meeting detail
  if (selectedMeetingId) {
    return (
      <div className='flex h-screen bg-gray-100'>
        <Sidebar isOpen={isSidebarOpen} onToggle={toggleSidebar} currentProject={currentProject} />
        <div className='flex-1 flex flex-col overflow-hidden'>
          <Navbar isSidebarOpen={isSidebarOpen} toggleSidebar={toggleSidebar} />
          <div className='flex-1 overflow-y-auto p-6'>
            <SprintMeetingDetail
              meetingDetail={meetingDetail}
              onBack={handleBackToList}
              onUpdate={handleUpdateMeeting}
              onUpdateNextPlan={handleUpdateNextPlan}
              loading={loadingDetail}
            />
          </div>
        </div>
      </div>
    )
  }

  // Main view with tabs
  return (
    <div className='flex h-screen bg-gray-100'>
      <Sidebar isOpen={isSidebarOpen} onToggle={toggleSidebar} currentProject={currentProject} />
      <div className='flex-1 flex flex-col overflow-hidden'>
        <Navbar isSidebarOpen={isSidebarOpen} toggleSidebar={toggleSidebar} />
        <div className='flex-1 overflow-y-auto p-6'>
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Sprint Meetings</h1>
            <p className="text-gray-600 mt-2">Manage and track sprint meetings and task updates</p>
          </div>
          <div className="flex items-center space-x-4">
            <Button
              variant="outline"
              onClick={() => {
                fetchSprintMeetings()
                fetchTaskUpdates()
              }}
              disabled={loading}
            >
              <Clock className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-3">
              <Calendar className="h-8 w-8 text-blue-600" />
              <div>
                <p className="text-sm font-medium text-gray-600">Total Meetings</p>
                <p className="text-2xl font-bold text-gray-900">{sprintMeetings.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-3">
              <TrendingUp className="h-8 w-8 text-orange-600" />
              <div>
                <p className="text-sm font-medium text-gray-600">Pending Updates</p>
                <p className="text-2xl font-bold text-gray-900">{taskUpdates.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-3">
              <Users className="h-8 w-8 text-green-600" />
              <div>
                <p className="text-sm font-medium text-gray-600">Active Sprints</p>
                <p className="text-2xl font-bold text-gray-900">
                  {sprintMeetings.filter(m => new Date(m.updatedAt) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)).length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Error Display */}
      {error && (
        <Card className="mb-6 border-red-200 bg-red-50">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Badge variant="destructive">Error</Badge>
              <span className="text-red-800">{error}</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Main Content Tabs */}
      <Tabs defaultValue="meetings" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="meetings" className="flex items-center space-x-2">
            <Calendar className="h-4 w-4" />
            <span>Sprint Meetings</span>
            <Badge variant="secondary">{sprintMeetings.length}</Badge>
          </TabsTrigger>
          <TabsTrigger value="updates" className="flex items-center space-x-2">
            <TrendingUp className="h-4 w-4" />
            <span>Task Updates</span>
            <Badge variant="secondary">{taskUpdates.length}</Badge>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="meetings" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Calendar className="h-5 w-5" />
                <span>Sprint Meetings</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <SprintMeetingList
                sprintMeetings={sprintMeetings}
                onViewDetail={handleViewDetail}
                loading={loading}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="updates" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <TrendingUp className="h-5 w-5" />
                <span>Task Updates</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <TaskUpdateList
                taskUpdates={taskUpdates}
                onUpdateTask={handleUpdateTask}
                loading={loading}
              />
            </CardContent>
          </Card>
        </TabsContent>
              </Tabs>
        </div>
      </div>
    </div>
  )
}

export default SprintMeetings 