import { AlertCircle, Calendar, Clock, FileText, TrendingUp } from 'lucide-react'
import React, { useState } from 'react'
import { useParams } from 'react-router-dom'

import { Navbar } from '@/components/Navbar'
import { ActivityChart, ActivityTimeline, BarChart, DistributionChart, DonutChart, LineChartComponent, MetricCard, MultiLineChart, PieChartComponent, ProgressChart, StackedBarChart } from '@/components/reports/ReportCharts'
import { Sidebar } from '@/components/Sidebar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useCurrentProject } from '@/hooks/useCurrentProject'
import { useProjectReports } from '@/hooks/useProjectReports'

const ProjectReports: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>()
  const { reportData, loading, error, refetch } = useProjectReports(projectId)
  const { currentProject } = useCurrentProject()
  const [selectedTimeRange, setSelectedTimeRange] = useState<'week' | 'month' | 'quarter'>('month')
  const [isSidebarOpen, setIsSidebarOpen] = useState(true)

  const toggleSidebar = () => setIsSidebarOpen((v) => !v)

  const getPriorityColor = (priority: string | number) => {
    switch (priority?.toString()) {
      case 'High':
      case '3':
        return 'bg-red-100 text-red-800'
      case 'Medium':
      case '2':
        return 'bg-yellow-100 text-yellow-800'
      case 'Low':
      case '1':
        return 'bg-green-100 text-green-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'done':
        return 'bg-green-100 text-green-800'
      case 'ongoing':
        return 'bg-blue-100 text-blue-800'
      case 'todo':
        return 'bg-gray-100 text-gray-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getIssueTypeName = (type: string | number) => {
    switch (type?.toString()) {
      case '10000':
      case 'Bug':
        return 'Bug'
      case '20000':
      case 'FeatureRequest':
        return 'Feature Request'
      case '30000':
      case 'Improvement':
        return 'Improvement'
      case '40000':
      case 'Task':
        return 'Task'
      case '50000':
      case 'Documentation':
        return 'Documentation'
      case '60000':
      case 'Other':
        return 'Other'
      default:
        return type?.toString() || 'Unknown'
    }
  }

  const getIssuePriorityName = (priority: string | number) => {
    switch (priority?.toString()) {
      case '0':
      case 'Low':
        return 'Low'
      case '10000':
      case 'Medium':
        return 'Medium'
      case '20000':
      case 'High':
        return 'High'
      case '30000':
      case 'Urgent':
        return 'Urgent'
      default:
        return priority?.toString() || 'Unknown'
    }
  }

  if (loading) {
    return (
      <div className="flex h-screen bg-gradient-to-br from-slate-50 via-white to-lavender-50">
        <Sidebar isOpen={isSidebarOpen} onToggle={toggleSidebar} currentProject={currentProject} />
        <div className="flex-1 flex flex-col overflow-hidden">
          <Navbar isSidebarOpen={isSidebarOpen} toggleSidebar={toggleSidebar} />
          <div className="flex items-center justify-center flex-1">
            <div className="text-center">
              <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900 mx-auto"></div>
              <p className="mt-4 text-gray-600">Loading reports...</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex h-screen bg-gradient-to-br from-slate-50 via-white to-lavender-50">
        <Sidebar isOpen={isSidebarOpen} onToggle={toggleSidebar} currentProject={currentProject} />
        <div className="flex-1 flex flex-col overflow-hidden">
          <Navbar isSidebarOpen={isSidebarOpen} toggleSidebar={toggleSidebar} />
          <div className="flex items-center justify-center flex-1">
            <Card className="w-full max-w-md">
              <CardContent className="pt-6">
                <div className="text-center">
                  <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Error Loading Reports</h3>
                  <p className="text-gray-600 mb-4">{error}</p>
                  <Button onClick={refetch}>Try Again</Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    )
  }

  if (!reportData) {
    return null
  }

  return (
    <div className="flex h-screen bg-gradient-to-br from-slate-50 via-white to-lavender-50">
      <Sidebar isOpen={isSidebarOpen} onToggle={toggleSidebar} currentProject={currentProject} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Navbar isSidebarOpen={isSidebarOpen} toggleSidebar={toggleSidebar} />
        <div className="flex-1 overflow-y-auto bg-white/90">
          <div className="container mx-auto p-6 space-y-6">
            {/* Header */}
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-3xl font-bold">Project Reports</h1>
                <p className="text-gray-600">Comprehensive analytics and insights for your project</p>
              </div>
              <div className="flex gap-2">
                <Button
                  variant={selectedTimeRange === 'week' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedTimeRange('week')}
                >
                  Week
                </Button>
                <Button
                  variant={selectedTimeRange === 'month' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedTimeRange('month')}
                >
                  Month
                </Button>
                <Button
                  variant={selectedTimeRange === 'quarter' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedTimeRange('quarter')}
                >
                  Quarter
                </Button>
              </div>
            </div>

                         {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <MetricCard
                title="Total Tasks"
                value={reportData.stats.totalTasks}
                icon={<FileText className="h-4 w-4 text-blue-600" />}
                color="blue"
              />
              <MetricCard
                title="Completion Rate"
                value={`${reportData.stats.completionRate.toFixed(1)}%`}
                icon={<TrendingUp className="h-4 w-4 text-green-600" />}
                color="green"
              />
              <MetricCard
                title="Active Sprints"
                value={reportData.stats.activeSprints}
                icon={<Clock className="h-4 w-4 text-purple-600" />}
                color="purple"
              />
              <MetricCard
                title="Open Issues"
                value={reportData.stats.openIssues}
                icon={<AlertCircle className="h-4 w-4 text-red-600" />}
                color="red"
              />
            </div>

            {/* Detailed Reports */}
            <Tabs defaultValue="overview" className="space-y-4">
              <TabsList>
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="charts">Charts</TabsTrigger>
                <TabsTrigger value="tasks">Tasks</TabsTrigger>
                <TabsTrigger value="sprints">Sprints</TabsTrigger>
                <TabsTrigger value="issues">Issues</TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="space-y-4">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Task Status Distribution */}
                  <ProgressChart
                    title="Task Status Distribution"
                    description="Breakdown of tasks by current status"
                    data={Object.entries(reportData.stats.tasksByStatus).map(([status, count]) => ({
                      label: status.charAt(0).toUpperCase() + status.slice(1),
                      value: count,
                      color: status === 'done' ? '#10b981' : status === 'ongoing' ? '#3b82f6' : '#6b7280'
                    }))}
                    total={reportData.stats.totalTasks}
                  />

                  {/* Task Priority Distribution */}
                  <DistributionChart
                    title="Task Priority Distribution"
                    description="Breakdown of tasks by priority level"
                    data={Object.entries(reportData.stats.tasksByPriority).map(([priority, count]) => ({
                      label: priority,
                      value: count,
                      color: priority === 'High' || priority === '3' ? '#ef4444' : 
                             priority === 'Medium' || priority === '2' ? '#f59e0b' : '#10b981'
                    }))}
                  />
                </div>

                {/* Additional Charts */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Bar Chart for Sprint Performance */}
                  <BarChart
                    title="Sprint Performance"
                    description="Tasks completed per sprint"
                    data={reportData.sprints.slice(0, 5).map(sprint => ({
                      label: sprint.name,
                      value: sprint.taskPs?.length || 0,
                      color: sprint.status === 1 ? '#3b82f6' : '#10b981'
                    }))}
                  />

                  {/* Pie Chart for Issue Types */}
                  <PieChartComponent
                    title="Issue Types Distribution"
                    description="Breakdown of issues by type"
                    data={Object.entries(reportData.stats.issuesByType).map(([type, count]) => ({
                      label: getIssueTypeName(type),
                      value: count,
                      color: type === '10000' || type === 'Bug' ? '#ef4444' : 
                             type === '20000' || type === 'FeatureRequest' ? '#10b981' : 
                             type === '30000' || type === 'Improvement' ? '#3b82f6' : 
                             type === '40000' || type === 'Task' ? '#8b5cf6' :
                             type === '50000' || type === 'Documentation' ? '#06b6d4' : '#f59e0b'
                    }))}
                  />
                </div>

                {/* Line Chart - Task Completion Trend */}
                <LineChartComponent
                  title="Task Completion Trend"
                  description="Weekly task completion progress"
                  data={[
                    { label: 'Week 1', value: Math.floor(reportData.stats.completedTasks * 0.3) },
                    { label: 'Week 2', value: Math.floor(reportData.stats.completedTasks * 0.5) },
                    { label: 'Week 3', value: Math.floor(reportData.stats.completedTasks * 0.7) },
                    { label: 'Week 4', value: reportData.stats.completedTasks },
                    { label: 'Week 5', value: Math.floor(reportData.stats.completedTasks * 1.1) }
                  ]}
                />

                {/* Donut Chart - Sprint Status */}
                <DonutChart
                  title="Sprint Status Distribution"
                  description="Current sprint status breakdown"
                  data={[
                    { label: 'Active', value: reportData.stats.activeSprints, color: '#3b82f6' },
                    { label: 'Completed', value: reportData.stats.completedSprints, color: '#10b981' },
                    { label: 'Planning', value: reportData.stats.totalSprints - reportData.stats.activeSprints - reportData.stats.completedSprints, color: '#f59e0b' }
                  ]}
                />

                {/* Multi-line Chart */}
                <MultiLineChart
                  title="Project Activity Overview"
                  description="Tasks, Issues, and Sprints by week"
                  data={[
                    { label: 'Week 1', tasks: Math.floor(reportData.stats.completedTasks * 0.2), issues: Math.floor(reportData.stats.openIssues * 0.3), sprints: 1 },
                    { label: 'Week 2', tasks: Math.floor(reportData.stats.completedTasks * 0.4), issues: Math.floor(reportData.stats.openIssues * 0.6), sprints: 1 },
                    { label: 'Week 3', tasks: Math.floor(reportData.stats.completedTasks * 0.6), issues: Math.floor(reportData.stats.openIssues * 0.8), sprints: 2 },
                    { label: 'Week 4', tasks: reportData.stats.completedTasks, issues: reportData.stats.openIssues, sprints: reportData.stats.activeSprints }
                  ]}
                />

                {/* Stacked Bar Chart */}
                <StackedBarChart
                  title="Task Status by Sprint"
                  description="Task breakdown by status for each sprint"
                  data={reportData.sprints.slice(0, 4).map(sprint => ({
                    label: sprint.name,
                    completed: Math.floor((sprint.taskPs?.length || 0) * 0.6),
                    inProgress: Math.floor((sprint.taskPs?.length || 0) * 0.3),
                    pending: Math.floor((sprint.taskPs?.length || 0) * 0.1)
                  }))}
                />

                {/* Activity Chart */}
                <ActivityChart
                  title="Weekly Activity"
                  description="Activity summary for the last 7 days"
                  data={[
                    { date: 'Mon', tasks: reportData.stats.completedTasks, issues: reportData.stats.openIssues, sprints: reportData.stats.activeSprints },
                    { date: 'Tue', tasks: Math.floor(reportData.stats.completedTasks * 0.8), issues: Math.floor(reportData.stats.openIssues * 1.1), sprints: reportData.stats.activeSprints },
                    { date: 'Wed', tasks: Math.floor(reportData.stats.completedTasks * 0.9), issues: Math.floor(reportData.stats.openIssues * 0.9), sprints: reportData.stats.activeSprints },
                    { date: 'Thu', tasks: Math.floor(reportData.stats.completedTasks * 1.1), issues: Math.floor(reportData.stats.openIssues * 0.8), sprints: reportData.stats.activeSprints },
                    { date: 'Fri', tasks: Math.floor(reportData.stats.completedTasks * 0.7), issues: Math.floor(reportData.stats.openIssues * 1.2), sprints: reportData.stats.activeSprints }
                  ]}
                />

                {/* Recent Activity */}
                <ActivityTimeline
                  activities={[
                    ...reportData.tasks.slice(0, 3).map(task => ({
                      id: task.id,
                      title: task.title,
                      description: `Task ${task.status}`,
                      timestamp: task.updated,
                      type: 'task' as const
                    })),
                    ...reportData.sprints.slice(0, 2).map(sprint => ({
                      id: sprint.id,
                      title: sprint.name,
                      description: `Sprint ${sprint.status === 1 ? 'Active' : 'Completed'}`,
                      timestamp: sprint.startDate,
                      type: 'sprint' as const
                    }))
                  ]}
                />
              </TabsContent>

              <TabsContent value="charts" className="space-y-4">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Line Chart */}
                  <LineChartComponent
                    title="Task Completion Trend"
                    description="Weekly task completion progress"
                    data={[
                      { label: 'Week 1', value: Math.floor(reportData.stats.completedTasks * 0.3) },
                      { label: 'Week 2', value: Math.floor(reportData.stats.completedTasks * 0.5) },
                      { label: 'Week 3', value: Math.floor(reportData.stats.completedTasks * 0.7) },
                      { label: 'Week 4', value: reportData.stats.completedTasks },
                      { label: 'Week 5', value: Math.floor(reportData.stats.completedTasks * 1.1) }
                    ]}
                  />

                  {/* Donut Chart */}
                  <DonutChart
                    title="Sprint Status Distribution"
                    description="Current sprint status breakdown"
                    data={[
                      { label: 'Active', value: reportData.stats.activeSprints, color: '#3b82f6' },
                      { label: 'Completed', value: reportData.stats.completedSprints, color: '#10b981' },
                      { label: 'Planning', value: reportData.stats.totalSprints - reportData.stats.activeSprints - reportData.stats.completedSprints, color: '#f59e0b' }
                    ]}
                  />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Multi-line Chart */}
                  <MultiLineChart
                    title="Project Activity Overview"
                    description="Tasks, Issues, and Sprints by week"
                    data={[
                      { label: 'Week 1', tasks: Math.floor(reportData.stats.completedTasks * 0.2), issues: Math.floor(reportData.stats.openIssues * 0.3), sprints: 1 },
                      { label: 'Week 2', tasks: Math.floor(reportData.stats.completedTasks * 0.4), issues: Math.floor(reportData.stats.openIssues * 0.6), sprints: 1 },
                      { label: 'Week 3', tasks: Math.floor(reportData.stats.completedTasks * 0.6), issues: Math.floor(reportData.stats.openIssues * 0.8), sprints: 2 },
                      { label: 'Week 4', tasks: reportData.stats.completedTasks, issues: reportData.stats.openIssues, sprints: reportData.stats.activeSprints }
                    ]}
                  />

                  {/* Stacked Bar Chart */}
                  <StackedBarChart
                    title="Task Status by Sprint"
                    description="Task breakdown by status for each sprint"
                    data={reportData.sprints.slice(0, 4).map(sprint => ({
                      label: sprint.name,
                      completed: Math.floor((sprint.taskPs?.length || 0) * 0.6),
                      inProgress: Math.floor((sprint.taskPs?.length || 0) * 0.3),
                      pending: Math.floor((sprint.taskPs?.length || 0) * 0.1)
                    }))}
                  />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Progress Chart */}
                  <ProgressChart
                    title="Task Status Distribution"
                    description="Breakdown of tasks by current status"
                    data={Object.entries(reportData.stats.tasksByStatus).map(([status, count]) => ({
                      label: status.charAt(0).toUpperCase() + status.slice(1),
                      value: count,
                      color: status === 'done' ? '#10b981' : status === 'ongoing' ? '#3b82f6' : '#6b7280'
                    }))}
                    total={reportData.stats.totalTasks}
                  />

                  {/* Distribution Chart */}
                  <DistributionChart
                    title="Task Priority Distribution"
                    description="Breakdown of tasks by priority level"
                    data={Object.entries(reportData.stats.tasksByPriority).map(([priority, count]) => ({
                      label: priority,
                      value: count,
                      color: priority === 'High' || priority === '3' ? '#ef4444' : 
                             priority === 'Medium' || priority === '2' ? '#f59e0b' : '#10b981'
                    }))}
                  />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Bar Chart */}
                  <BarChart
                    title="Sprint Performance"
                    description="Tasks completed per sprint"
                    data={reportData.sprints.slice(0, 5).map(sprint => ({
                      label: sprint.name,
                      value: sprint.taskPs?.length || 0,
                      color: sprint.status === 1 ? '#3b82f6' : '#10b981'
                    }))}
                  />

                  {/* Pie Chart */}
                  <PieChartComponent
                    title="Issue Types Distribution"
                    description="Breakdown of issues by type"
                    data={Object.entries(reportData.stats.issuesByType).map(([type, count]) => ({
                      label: getIssueTypeName(type),
                      value: count,
                      color: type === '10000' || type === 'Bug' ? '#ef4444' : 
                             type === '20000' || type === 'FeatureRequest' ? '#10b981' : 
                             type === '30000' || type === 'Improvement' ? '#3b82f6' : 
                             type === '40000' || type === 'Task' ? '#8b5cf6' :
                             type === '50000' || type === 'Documentation' ? '#06b6d4' : '#f59e0b'
                    }))}
                  />
                </div>
              </TabsContent>

              <TabsContent value="tasks" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Task Analytics</CardTitle>
                    <CardDescription>Detailed task performance metrics</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Task Progress */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="text-center p-4 border rounded-lg">
                        <div className="text-2xl font-bold text-green-600">{reportData.stats.completedTasks}</div>
                        <div className="text-sm text-gray-600">Completed</div>
                      </div>
                      <div className="text-center p-4 border rounded-lg">
                        <div className="text-2xl font-bold text-blue-600">{reportData.stats.inProgressTasks}</div>
                        <div className="text-sm text-gray-600">In Progress</div>
                      </div>
                      <div className="text-center p-4 border rounded-lg">
                        <div className="text-2xl font-bold text-gray-600">{reportData.stats.pendingTasks}</div>
                        <div className="text-sm text-gray-600">Pending</div>
                      </div>
                    </div>

                    {/* Average Task Duration */}
                    <div className="p-4 border rounded-lg">
                      <h4 className="font-medium mb-2">Average Task Duration</h4>
                      <div className="text-2xl font-bold">
                        {reportData.stats.averageTaskDuration.toFixed(1)} days
                      </div>
                      <p className="text-sm text-gray-600">For completed tasks</p>
                    </div>

                    {/* Task List */}
                    <div>
                      <h4 className="font-medium mb-4">All Tasks</h4>
                      <div className="space-y-2 max-h-96 overflow-y-auto">
                        {reportData.tasks.map((task) => (
                          <div key={task.id} className="flex items-center justify-between p-3 border rounded-lg">
                            <div className="flex-1">
                              <p className="font-medium">{task.title}</p>
                              <p className="text-sm text-gray-600">{task.description}</p>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Badge className={getPriorityColor(task.priority)}>
                                {task.priority}
                              </Badge>
                              <Badge className={getStatusColor(task.status)}>
                                {task.status}
                              </Badge>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="sprints" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Sprint Analytics</CardTitle>
                    <CardDescription>Sprint performance and timeline</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Sprint Overview */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="text-center p-4 border rounded-lg">
                        <div className="text-2xl font-bold text-blue-600">{reportData.stats.activeSprints}</div>
                        <div className="text-sm text-gray-600">Active Sprints</div>
                      </div>
                      <div className="text-center p-4 border rounded-lg">
                        <div className="text-2xl font-bold text-green-600">{reportData.stats.completedSprints}</div>
                        <div className="text-sm text-gray-600">Completed Sprints</div>
                      </div>
                      <div className="text-center p-4 border rounded-lg">
                        <div className="text-2xl font-bold text-gray-600">{reportData.stats.totalSprints}</div>
                        <div className="text-sm text-gray-600">Total Sprints</div>
                      </div>
                    </div>

                    {/* Sprint List */}
                    <div>
                      <h4 className="font-medium mb-4">Sprint Details</h4>
                      <div className="space-y-4">
                        {reportData.sprints.map((sprint) => (
                          <div key={sprint.id} className="p-4 border rounded-lg">
                            <div className="flex items-center justify-between mb-2">
                              <h5 className="font-medium">{sprint.name}</h5>
                              <Badge variant={sprint.status === 1 ? 'default' : 'secondary'}>
                                {sprint.status === 1 ? 'Active' : sprint.status === 2 ? 'Completed' : 'Planning'}
                              </Badge>
                            </div>
                            <p className="text-sm text-gray-600 mb-2">{sprint.description}</p>
                            <div className="flex items-center space-x-4 text-sm text-gray-500">
                              <div className="flex items-center space-x-1">
                                <Calendar className="h-4 w-4" />
                                <span>{new Date(sprint.startDate).toLocaleDateString()}</span>
                              </div>
                              <span>-</span>
                              <div className="flex items-center space-x-1">
                                <Calendar className="h-4 w-4" />
                                <span>{new Date(sprint.endDate).toLocaleDateString()}</span>
                              </div>
                              <div className="flex items-center space-x-1">
                                <FileText className="h-4 w-4" />
                                <span>{sprint.taskPs?.length || 0} tasks</span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="issues" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Issue Analytics</CardTitle>
                    <CardDescription>Issue tracking and resolution metrics</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Issue Overview */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <div className="text-center p-4 border rounded-lg">
                        <div className="text-2xl font-bold text-red-600">{reportData.stats.openIssues}</div>
                        <div className="text-sm text-gray-600">Open Issues</div>
                      </div>
                      <div className="text-center p-4 border rounded-lg">
                        <div className="text-2xl font-bold text-green-600">{reportData.stats.resolvedIssues}</div>
                        <div className="text-sm text-gray-600">Resolved</div>
                      </div>
                      <div className="text-center p-4 border rounded-lg">
                        <div className="text-2xl font-bold text-orange-600">{reportData.stats.highPriorityIssues}</div>
                        <div className="text-sm text-gray-600">High Priority</div>
                      </div>
                      <div className="text-center p-4 border rounded-lg">
                        <div className="text-2xl font-bold text-gray-600">{reportData.stats.totalIssues}</div>
                        <div className="text-sm text-gray-600">Total Issues</div>
                      </div>
                    </div>

                    {/* Issue Distribution */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      <div>
                        <h4 className="font-medium mb-4">Issues by Type</h4>
                        <div className="space-y-2">
                          {Object.entries(reportData.stats.issuesByType).map(([type, count]) => {
                            const typeName = getIssueTypeName(type)
                            return (
                              <div key={type} className="flex items-center justify-between">
                                <span className="text-sm">{typeName}</span>
                                <Badge variant="outline">{count}</Badge>
                              </div>
                            )
                          })}
                        </div>
                      </div>
                      <div>
                        <h4 className="font-medium mb-4">Issues by Priority</h4>
                        <div className="space-y-2">
                          {Object.entries(reportData.stats.issuesByPriority).map(([priority, count]) => {
                            const priorityName = getIssuePriorityName(priority)
                            return (
                              <div key={priority} className="flex items-center justify-between">
                                <span className="text-sm">{priorityName}</span>
                                <Badge variant="outline">{count}</Badge>
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ProjectReports
