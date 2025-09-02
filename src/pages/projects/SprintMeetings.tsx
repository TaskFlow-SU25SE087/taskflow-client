/* eslint-disable @typescript-eslint/no-explicit-any */
import { Navbar } from '@/components/Navbar'
import { Sidebar } from '@/components/Sidebar'
import { SprintMeetingDetail } from '@/components/sprints/SprintMeetingDetail'
import { SprintMeetingList } from '@/components/sprints/SprintMeetingList'
import { TaskUpdateList } from '@/components/sprints/TaskUpdateList'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
// Removed direct Loader usage in favor of skeleton placeholders for initial page load
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useToastContext } from '@/components/ui/ToastContext'
import { useCurrentProject } from '@/hooks/useCurrentProject'
import { useSprintMeetings } from '@/hooks/useSprintMeetings'
import { SprintMeetingDetail as SprintMeetingDetailType } from '@/types/sprint'
import { canUpdateSprintMeeting } from '@/utils/sprintMeetingUtils'
import { Calendar, Clock, TrendingUp } from 'lucide-react'
import React, { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'

const SprintMeetings: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>()
  const { currentProject, isLoading } = useCurrentProject()
  const [isSidebarOpen, setIsSidebarOpen] = useState(true)
  const [selectedMeetingId, setSelectedMeetingId] = useState<string | null>(null)
  const [meetingDetail, setMeetingDetail] = useState<SprintMeetingDetailType | null>(null)
  const [loadingDetail, setLoadingDetail] = useState(false)
  const { showToast } = useToastContext()

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
      showToast({
        title: 'Error',
        description: 'Failed to load meeting detail. Please try again.',
        variant: 'destructive'
      })
    } finally {
      setLoadingDetail(false)
    }
  }

  const handleBackToList = () => {
    setSelectedMeetingId(null)
    setMeetingDetail(null)
  }

  const handleUpdateMeeting = async (data: { unfinishedTasks: any[]; nextPlan: string }) => {
    if (!selectedMeetingId || !meetingDetail) return false

    // Check if meeting can be updated
    if (!canUpdateSprintMeeting(meetingDetail)) {
      showToast({
        title: 'Error',
        description: 'This meeting cannot be updated at this time.',
        variant: 'destructive'
      })
      return false
    }

    try {
      const success = await updateSprintMeeting(selectedMeetingId, data)
      if (success) {
        // Auto-refresh meeting detail
        await handleRefreshMeetingDetail()
        showToast({
          title: 'Success',
          description: 'Meeting updated successfully',
          variant: 'success'
        })
      }
      return success
    } catch (err: any) {
      // Show specific error message
      const errorMessage = err.message || 'Failed to update meeting'
      showToast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive'
      })
      return false
    }
  }

  const handleUpdateNextPlan = async (nextPlan: string) => {
    if (!selectedMeetingId || !meetingDetail) return false

    // Check if meeting can be updated
    if (!canUpdateSprintMeeting(meetingDetail)) {
      showToast({
        title: 'Error',
        description: 'This meeting cannot be updated at this time.',
        variant: 'destructive'
      })
      return false
    }

    try {
      const success = await updateNextPlan(selectedMeetingId, nextPlan)
      if (success) {
        // Auto-refresh meeting detail
        await handleRefreshMeetingDetail()
        showToast({
          title: 'Success',
          description: 'Next plan updated successfully',
          variant: 'success'
        })
      }
      return success
    } catch (err: any) {
      // Show specific error message
      const errorMessage = err.message || 'Failed to update next plan'
      showToast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive'
      })
      return false
    }
  }

  const handleUpdateTask = async (
    taskId: string,
    itemVersion: number,
    taskData: {
      title: string
      description: string
      priority: string
      reason: string
    }
  ) => {
    // Determine sprintMeetingId source: prefer selected meeting; fallback to taskUpdates mapping
    let sprintMeetingId: string | null = selectedMeetingId
    if (!sprintMeetingId) {
      const task = taskUpdates.find((t) => t.id === taskId)
      sprintMeetingId = task?.sprintMeetingId || null
    }
    if (!sprintMeetingId) {
      showToast({
        title: 'Error',
        description: 'Could not determine the sprint meeting for this task.',
        variant: 'destructive'
      })
      return false
    }

    // Allow view-only details but restrict edits when meeting is not updatable
    if (selectedMeetingId && meetingDetail && !canUpdateSprintMeeting(meetingDetail)) {
      showToast({
        title: 'Error',
        description: 'This meeting is read-only. You can only update the reason.',
        variant: 'destructive'
      })
      // Continue anyway as backend only updates reason
    }

    try {
      const success = await updateSprintMeetingTask(sprintMeetingId, taskId, itemVersion, taskData)
      if (success) {
        // Auto-refresh all data
        await Promise.all([fetchTaskUpdates(), handleRefreshMeetingDetail()])
        showToast({
          title: 'Success',
          description: 'Task updated successfully',
          variant: 'success'
        })
      }
      return success
    } catch (err: any) {
      // Show specific error message
      const errorMessage = err.message || 'Failed to update task'
      showToast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive'
      })
      return false
    }
  }

  // Handle version conflicts from task updates
  const handleVersionConflict = (message: string, newItemVersion?: number, taskId?: string, reason?: string) => {
    if (taskId && reason && newItemVersion) {
      showToast({
        title: 'Version Conflict',
        description: `${message} New version: ${newItemVersion}`,
        variant: 'warning'
      })

      // Optionally, we could automatically retry with the new version
      // handleUpdateTask(taskId, newItemVersion, reason)
    }
  }

  // Thêm function để refresh meeting detail
  const handleRefreshMeetingDetail = async () => {
    if (!selectedMeetingId) return

    try {
      const detail = await getSprintMeetingDetail(selectedMeetingId)
      setMeetingDetail(detail)
    } catch (err) {
      console.error('Failed to refresh meeting detail:', err)
      showToast({
        title: 'Error',
        description: 'Failed to refresh meeting detail',
        variant: 'destructive'
      })
    }
  }

  const handleRefresh = async () => {
    try {
      await Promise.all([fetchSprintMeetings(), fetchTaskUpdates()])
      showToast({
        title: 'Success',
        description: 'Data refreshed successfully',
        variant: 'success'
      })
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (err) {
      showToast({
        title: 'Error',
        description: 'Failed to refresh data',
        variant: 'destructive'
      })
    }
  }

  // Skeleton readiness management similar to ProjectReports / Timeline pages
  const [isPageReady, setIsPageReady] = useState(false)
  useEffect(() => {
    if (!isPageReady && !isLoading && currentProject) {
      // Wait for first non-loading frame from sprint meetings hook
      if (!loading) setIsPageReady(true)
    }
  }, [isPageReady, isLoading, loading, currentProject])

  // If viewing a specific meeting detail
  if (selectedMeetingId) {
    return (
      <div className='flex h-screen bg-gray-50'>
        <Sidebar isOpen={isSidebarOpen} onToggle={toggleSidebar} currentProject={currentProject} />
        <div className='flex-1 flex flex-col overflow-hidden'>
          <Navbar isSidebarOpen={isSidebarOpen} toggleSidebar={toggleSidebar} />
          <div className='flex-1 overflow-y-auto bg-white'>
            <div className='p-6 pb-10'>
              <SprintMeetingDetail
                meetingDetail={meetingDetail}
                onBack={handleBackToList}
                onUpdate={handleUpdateMeeting}
                onUpdateNextPlan={handleUpdateNextPlan}
                onUpdateTask={handleUpdateTask}
                onRefreshMeeting={handleRefreshMeetingDetail}
                loading={loadingDetail}
                onVersionConflict={handleVersionConflict}
              />
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Main view with tabs
  return (
    <div className='flex h-screen bg-gray-50'>
      <Sidebar isOpen={isSidebarOpen} onToggle={toggleSidebar} currentProject={currentProject} />
      <div className='flex-1 flex flex-col overflow-hidden'>
        <Navbar isSidebarOpen={isSidebarOpen} toggleSidebar={toggleSidebar} />
        <div className='flex-1 overflow-y-auto'>
          <div className='p-6 pb-10'>
            {!isPageReady && (
              <div className='animate-pulse'>
                {/* Header skeleton */}
                <div className='flex items-center justify-between mb-8'>
                  <div className='flex items-center gap-3'>
                    <div className='h-10 w-10 rounded-lg bg-gray-200' />
                    <div className='space-y-2'>
                      <div className='h-6 w-48 bg-gray-200 rounded' />
                      <div className='h-4 w-64 bg-gray-200 rounded' />
                    </div>
                    <div className='h-6 w-24 bg-gray-200 rounded-full ml-2' />
                  </div>
                  <div className='h-9 w-28 bg-gray-200 rounded-lg' />
                </div>
                {/* Stat cards skeleton */}
                <div className='grid grid-cols-1 md:grid-cols-3 gap-4 mb-8'>
                  {Array.from({ length: 3 }).map((_, i) => (
                    <div
                      key={i}
                      className='h-28 rounded-lg border border-gray-200 bg-white p-4 flex flex-col justify-between'
                    >
                      <div className='flex items-center justify-between'>
                        <div className='space-y-2'>
                          <div className='h-3 w-24 bg-gray-200 rounded' />
                          <div className='h-6 w-16 bg-gray-200 rounded' />
                        </div>
                        <div className='h-10 w-10 bg-gray-200 rounded-lg' />
                      </div>
                      <div className='h-2 w-full bg-gray-200 rounded-full' />
                    </div>
                  ))}
                </div>
                {/* Tabs skeleton */}
                <div className='border border-gray-200 rounded-xl p-4'>
                  <div className='flex gap-2 mb-4'>
                    <div className='h-9 w-40 bg-gray-200 rounded-md' />
                    <div className='h-9 w-40 bg-gray-200 rounded-md' />
                  </div>
                  <div className='space-y-4'>
                    {Array.from({ length: 3 }).map((_, i) => (
                      <div key={i} className='border border-gray-200 rounded-lg p-4'>
                        <div className='h-4 w-2/3 bg-gray-200 rounded mb-3' />
                        <div className='h-3 w-1/2 bg-gray-200 rounded mb-2' />
                        <div className='h-3 w-1/3 bg-gray-200 rounded' />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
            {isPageReady && (
              <>
                {/* Header */}
                <div className='flex items-center justify-between mb-8'>
                  <div className='flex items-center gap-3'>
                    <div className='p-2 bg-lavender-100 rounded-lg'>
                      <Clock className='h-6 w-6 text-lavender-600' />
                    </div>
                    <div>
                      <h1 className='text-3xl font-bold text-gray-900'>Sprint Meetings</h1>
                      <p className='text-sm text-gray-600'>Project: {currentProject?.title}</p>
                    </div>
                    <div className='ml-2 text-sm font-medium text-gray-600 bg-gray-100 rounded-full px-3 py-1 border border-gray-200'>
                      {sprintMeetings.length} {sprintMeetings.length === 1 ? 'meeting' : 'meetings'}
                    </div>
                  </div>
                  <div className='flex items-center gap-3'>
                    <Button
                      variant='ghost'
                      className='flex items-center gap-2 px-3 py-2 rounded-lg bg-[#ece8fd] hover:bg-[#e0dbfa] text-[#7c3aed]'
                      onClick={handleRefresh}
                      disabled={loading}
                    >
                      <Clock className='h-4 w-4' />
                      <span className='text-sm font-medium'>{loading ? 'Refreshing...' : 'Refresh'}</span>
                    </Button>
                  </div>
                </div>

                {/* Stats Cards */}
                <div className='grid grid-cols-1 md:grid-cols-2 gap-4 mb-8'>
                  <div className='bg-white rounded-lg p-4 border border-gray-200 shadow-sm hover:shadow-md transition-shadow'>
                    <div className='flex items-center justify-between'>
                      <div>
                        <p className='text-gray-600 text-sm font-medium'>Total Meetings</p>
                        <p className='text-2xl font-bold text-gray-900'>{sprintMeetings.length}</p>
                      </div>
                      <div className='p-3 bg-blue-50 rounded-lg'>
                        <Calendar className='h-6 w-6 text-blue-600' />
                      </div>
                    </div>
                    <div className='mt-3 flex items-center gap-2'>
                      <div className='flex-1 bg-gray-200 rounded-full h-2 overflow-hidden'>
                        <div className='bg-blue-500 h-2' style={{ width: sprintMeetings.length > 0 ? '100%' : '0%' }} />
                      </div>
                      <span className='text-xs text-gray-500'>Active</span>
                    </div>
                  </div>
                  <div className='bg-white rounded-lg p-4 border border-gray-200 shadow-sm hover:shadow-md transition-shadow'>
                    <div className='flex items-center justify-between'>
                      <div>
                        <p className='text-gray-600 text-sm font-medium'>Pending Updates</p>
                        <p className='text-2xl font-bold text-gray-900'>{taskUpdates.length}</p>
                      </div>
                      <div className='p-3 bg-orange-50 rounded-lg'>
                        <TrendingUp className='h-6 w-6 text-orange-600' />
                      </div>
                    </div>
                    <div className='mt-3 flex items-center gap-2'>
                      <div className='flex-1 bg-gray-200 rounded-full h-2 overflow-hidden'>
                        <div className='bg-orange-500 h-2' style={{ width: taskUpdates.length > 0 ? '100%' : '0%' }} />
                      </div>
                      <span className='text-xs text-gray-500'>Queued</span>
                    </div>
                  </div>
                </div>

                {/* Error Display */}
                {error && (
                  <Card className='mb-6 border-red-200 bg-red-50'>
                    <CardContent className='p-4'>
                      <div className='flex items-center space-x-2'>
                        <Badge variant='destructive'>Error</Badge>
                        <span className='text-red-800'>{error}</span>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Main Content Tabs */}
                <div className='bg-white border border-gray-200 rounded-xl shadow-sm'>
                  <Tabs defaultValue='meetings' className=''>
                    <div className='border-b border-gray-200 px-4 pt-4'>
                      <TabsList className='grid w-full grid-cols-2 bg-gray-100 p-1 rounded-lg'>
                        <TabsTrigger
                          value='meetings'
                          className='flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-md'
                        >
                          <Calendar className='h-4 w-4' />
                          <span className='text-sm'>Meetings</span>
                          <Badge variant='secondary' className='ml-1'>
                            {sprintMeetings.length}
                          </Badge>
                        </TabsTrigger>
                        <TabsTrigger
                          value='updates'
                          className='flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-md'
                        >
                          <TrendingUp className='h-4 w-4' />
                          <span className='text-sm'>Task Updates</span>
                          <Badge variant='secondary' className='ml-1'>
                            {taskUpdates.length}
                          </Badge>
                        </TabsTrigger>
                      </TabsList>
                    </div>
                    <TabsContent value='meetings' className='p-4'>
                      <Card className='shadow-none border border-gray-200'>
                        <CardHeader className='pb-3'>
                          <CardTitle className='flex items-center gap-2 text-gray-900'>
                            <Calendar className='h-5 w-5 text-lavender-600' />
                            Sprint Meetings
                          </CardTitle>
                        </CardHeader>
                        <CardContent className='pt-0'>
                          <SprintMeetingList
                            sprintMeetings={sprintMeetings}
                            onViewDetail={handleViewDetail}
                            loading={loading}
                          />
                        </CardContent>
                      </Card>
                    </TabsContent>
                    <TabsContent value='updates' className='p-4'>
                      <Card className='shadow-none border border-gray-200'>
                        <CardHeader className='pb-3'>
                          <CardTitle className='flex items-center gap-2 text-gray-900'>
                            <TrendingUp className='h-5 w-5 text-lavender-600' />
                            Task Updates
                          </CardTitle>
                        </CardHeader>
                        <CardContent className='pt-0'>
                          <TaskUpdateList taskUpdates={taskUpdates} onUpdateTask={handleUpdateTask} loading={loading} />
                        </CardContent>
                      </Card>
                    </TabsContent>
                  </Tabs>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default SprintMeetings
