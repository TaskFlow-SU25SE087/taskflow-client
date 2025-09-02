import React, { useMemo, useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { Navbar } from '@/components/Navbar'
import { Sidebar } from '@/components/Sidebar'
import { useCurrentProject } from '@/hooks/useCurrentProject'
import { useTeamActivityReport } from '@/hooks/useTeamActivityReport'
import { useBurndownChart } from '@/hooks/useBurndownChart'
import { useSprints } from '@/hooks/useSprints'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  AlertCircle,
  Calendar,
  Users,
  BarChart3,
  TrendingUp,
  MessageSquare,
  Filter,
  RefreshCw,
  Search,
  Timer
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent
} from '@/components/ui/chart'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { BarChart as ReBarChart, Bar, XAxis, YAxis, CartesianGrid, LineChart, Line, Cell } from 'recharts'

const ProjectReports: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>()
  const { report, loading, error, refetch, setQuery } = useTeamActivityReport(projectId)
  const { currentProject } = useCurrentProject()
  const { sprints } = useSprints()
  const [isSidebarOpen, setIsSidebarOpen] = useState(true)
  const toggleSidebar = () => setIsSidebarOpen((v) => !v)
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d'>('30d')
  const [memberSearch, setMemberSearch] = useState('')
  const [showComments, setShowComments] = useState(true)
  const [showTasks, setShowTasks] = useState(true)
  const [topCount, setTopCount] = useState(5)
  const [selectedSprintId, setSelectedSprintId] = useState<string>('')

  const {
    burndownData,
    loading: burndownLoading,
    error: burndownError,
    refetch: refetchBurndown
  } = useBurndownChart(projectId, selectedSprintId)

  // Set default sprint when sprints are loaded
  useEffect(() => {
    if (sprints.length > 0 && !selectedSprintId) {
      setSelectedSprintId(sprints[0].id)
    }
  }, [sprints, selectedSprintId])

  const applyTimeRange = (range: typeof timeRange) => {
    setTimeRange(range)
    if (!report) return
    const end = new Date()
    const start = new Date()
    if (range === '7d') start.setDate(end.getDate() - 7)
    else if (range === '30d') start.setDate(end.getDate() - 30)
    else start.setDate(end.getDate() - 90)
    setQuery((q) => ({
      ...q,
      startDate: start.toISOString(),
      endDate: end.toISOString(),
      topContributorsCount: topCount
    }))
    refetch({ startDate: start.toISOString(), endDate: end.toISOString(), topContributorsCount: topCount })
  }

  const filteredMembers = useMemo(() => {
    if (!report?.memberActivities) return []
    const term = memberSearch.trim().toLowerCase()
    if (!term) return report.memberActivities
    return report.memberActivities.filter(
      (m) =>
        m.fullName.toLowerCase().includes(term) ||
        m.email.toLowerCase().includes(term) ||
        m.role.toLowerCase().includes(term)
    )
  }, [report, memberSearch])

  const recentTaskActivities = useMemo(() => {
    if (!showTasks) return []
    return (
      report?.memberActivities
        .flatMap((m) =>
          m.taskActivities.map((t) => ({ ...t, fullName: m.fullName, avatar: m.avatar, userId: m.userId }))
        )
        .sort(
          (a, b) =>
            new Date(b.assignedAt || b.completedAt || b.deadline || 0).getTime() -
            new Date(a.assignedAt || a.completedAt || a.deadline || 0).getTime()
        )
        .slice(0, 30) || []
    )
  }, [report, showTasks])

  const recentCommentActivities = useMemo(() => {
    if (!showComments) return []
    return (
      report?.memberActivities
        .flatMap((m) =>
          m.commentActivities.map((c) => ({ ...c, fullName: m.fullName, avatar: m.avatar, userId: m.userId }))
        )
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, 30) || []
    )
  }, [report, showComments])

  const handleTopCountChange = (val: string) => {
    const n = Number(val)
    setTopCount(n)
    setQuery((q) => ({ ...q, topContributorsCount: n }))
    refetch({ topContributorsCount: n })
  }

  const fmt = (d?: string) => (d ? new Date(d).toLocaleString() : '-')

  // For this page we want a full-page skeleton any time loading to avoid showing stale or partial UI
  const showSkeleton = loading
  const s = report?.summary

  // -------- Chart Data Computations --------
  const taskStatusData = useMemo(() => {
    if (!s) return []
    return [
      { key: 'completed', label: 'Completed', value: s.totalCompletedTasks },
      { key: 'inProgress', label: 'In Progress', value: s.totalInProgressTasks },
      { key: 'todo', label: 'Todo', value: s.totalTodoTasks },
      { key: 'overdue', label: 'Overdue', value: s.totalOverdueTasks }
    ]
  }, [s])

  const burndownChartData = useMemo(() => {
    if (!burndownData) return []

    // Check if we have valid data
    if (!burndownData.dailyProgress?.length || !burndownData.idealBurndown?.length) {
      console.warn('Burndown data incomplete:', {
        dailyProgress: burndownData.dailyProgress?.length || 0,
        idealBurndown: burndownData.idealBurndown?.length || 0
      })
      return []
    }

    // Create a map of dates to ideal burndown data for proper matching
    const idealBurndownMap = new Map(burndownData.idealBurndown.map((ideal) => [ideal.date, ideal]))

    const combinedData = burndownData.dailyProgress.map((progress) => {
      const progressDate = new Date(progress.date)
      const idealData = idealBurndownMap.get(progress.date)

      return {
        date: progressDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        rawDate: progress.date, // Keep raw date for proper sorting/matching
        remainingEffort: progress.remainingEffortPoints,
        idealEffort: idealData?.remainingEffortPoints || 0,
        completedEffort: progress.completedEffortPoints,
        totalEffort: progress.totalEffortPoints
      }
    })

    // Sort by date to ensure proper chronological order
    const sortedData = combinedData.sort((a, b) => new Date(a.rawDate).getTime() - new Date(b.rawDate).getTime())

    return sortedData
  }, [burndownData])

  const chartConfig = {
    completed: { label: 'Completed', color: '#16a34a' },
    inProgress: { label: 'In Progress', color: '#6366f1' },
    todo: { label: 'Todo', color: '#94a3b8' },
    overdue: { label: 'Overdue', color: '#dc2626' },
    high: { label: 'High', color: '#dc2626' },
    medium: { label: 'Medium', color: '#f59e0b' },
    low: { label: 'Low', color: '#60a5fa' },
    urgent: { label: 'Urgent', color: '#7c3aed' },
    remainingEffort: { label: 'Remaining Effort', color: '#6366f1' },
    idealEffort: { label: 'Ideal Burndown', color: '#dc2626' }
  }

  return (
    <div className='flex h-screen bg-gray-50'>
      <Sidebar isOpen={isSidebarOpen} onToggle={toggleSidebar} currentProject={currentProject} />
      <div className='flex-1 flex flex-col overflow-hidden'>
        <Navbar isSidebarOpen={isSidebarOpen} toggleSidebar={toggleSidebar} />
        <div className='flex-1 overflow-y-auto'>
          <div className='flex flex-col flex-1 min-h-0'>
            <div className='flex-none w-full p-6 pb-4 bg-transparent'>
              <div className='flex flex-col lg:flex-row lg:items-center justify-between gap-3 mb-4'>
                <div className='flex items-center gap-3'>
                  {showSkeleton ? (
                    <>
                      <Skeleton className='h-10 w-10 rounded-lg' />
                      <div className='space-y-2'>
                        <Skeleton className='h-6 w-40' />
                        <Skeleton className='h-4 w-64' />
                      </div>
                      <Skeleton className='h-6 w-32 rounded-full ml-2' />
                    </>
                  ) : (
                    <>
                      <div className='p-2 bg-lavender-100 rounded-lg'>
                        <BarChart3 className='h-6 w-6 text-lavender-600' />
                      </div>
                      <div>
                        <h1 className='text-3xl font-bold text-gray-900'>Report</h1>
                        <p className='text-sm text-gray-600'>
                          Project: {currentProject?.title || report?.projectTitle}
                        </p>
                      </div>
                      {s && (
                        <div className='ml-2 text-sm font-medium text-gray-600 bg-gray-100 rounded-full px-3 py-1 border border-gray-200'>
                          {s.totalTasks} tasks • {s.totalComments} comments • {s.totalAssignedEffortPoints} effort
                        </div>
                      )}
                    </>
                  )}
                </div>
                <div className='flex items-center gap-2 lg:gap-3 flex-wrap'>
                  {showSkeleton ? (
                    <>
                      <Skeleton className='h-9 w-[120px] rounded-lg' />
                      <Skeleton className='h-9 w-[110px] rounded-lg' />
                      <Skeleton className='h-9 w-24 rounded-lg' />
                    </>
                  ) : (
                    <>
                      <Select value={timeRange} onValueChange={(v: typeof timeRange) => applyTimeRange(v)}>
                        <SelectTrigger className='w-[120px] h-9 rounded-lg border-gray-300 bg-white/70 backdrop-blur shadow-sm'>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value='7d'>Last 7 days</SelectItem>
                          <SelectItem value='30d'>Last 30 days</SelectItem>
                          <SelectItem value='90d'>Last 90 days</SelectItem>
                        </SelectContent>
                      </Select>
                      <Select value={String(topCount)} onValueChange={handleTopCountChange}>
                        <SelectTrigger className='w-[110px] h-9 rounded-lg border-gray-300 bg-white/70 backdrop-blur shadow-sm'>
                          <SelectValue placeholder='Top N' />
                        </SelectTrigger>
                        <SelectContent>
                          {[3, 5, 10].map((n) => (
                            <SelectItem key={n} value={String(n)}>
                              Top {n}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Button
                        size='sm'
                        variant='ghost'
                        onClick={() => refetch()}
                        className='h-9 px-3 rounded-lg bg-[#ece8fd] hover:bg-[#e0dbfa] text-[#7c3aed] flex items-center gap-1'
                      >
                        <RefreshCw className='h-4 w-4' /> Refresh
                      </Button>
                    </>
                  )}
                </div>
              </div>
              {/* Meta row moved below to mirror secondary details area */}
              {showSkeleton ? (
                <div className='flex flex-wrap items-center gap-4 mb-2 pl-[52px]'>
                  <Skeleton className='h-4 w-40' />
                  <Skeleton className='h-4 w-24' />
                  <Skeleton className='h-4 w-32' />
                </div>
              ) : (
                report &&
                s && (
                  <div className='flex flex-wrap items-center gap-4 mb-2 text-xs text-gray-500 pl-[52px]'>
                    <span className='inline-flex items-center gap-1'>
                      <Calendar className='h-3.5 w-3.5' /> {fmt(report.startDate)} – {fmt(report.endDate)}
                    </span>
                    <span className='inline-flex items-center gap-1'>
                      <Users className='h-3.5 w-3.5' /> {s.totalMembers} members
                    </span>
                    <span className='inline-flex items-center gap-1'>
                      <Timer className='h-3.5 w-3.5' /> Generated {fmt(report.reportGeneratedAt)}
                    </span>
                  </div>
                )
              )}

              {/* Controls Bar */}
              <div className='flex flex-col md:flex-row md:items-center justify-between gap-3'>
                {showSkeleton ? (
                  <div className='flex items-center gap-2 flex-wrap w-full justify-between'>
                    <div className='flex items-center gap-2 flex-wrap'>
                      <Skeleton className='h-9 w-[220px] rounded-lg' />
                      <Skeleton className='h-9 w-20 rounded-lg' />
                      <Skeleton className='h-9 w-24 rounded-lg' />
                      <Skeleton className='h-9 w-24 rounded-lg' />
                    </div>
                    <Skeleton className='h-4 w-48 rounded' />
                  </div>
                ) : (
                  <>
                    <div className='flex items-center gap-2 flex-wrap'>
                      <div className='relative'>
                        <Search className='absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400' />
                        <Input
                          placeholder='Search members...'
                          className='pl-10 w-[220px] h-9 rounded-lg border-gray-300 bg-white/70 backdrop-blur'
                          value={memberSearch}
                          onChange={(e) => setMemberSearch(e.target.value)}
                        />
                      </div>
                      <Button
                        variant={showTasks ? 'default' : 'outline'}
                        size='sm'
                        className={`h-9 rounded-lg ${showTasks ? 'bg-lavender-600 hover:bg-lavender-500' : ''}`}
                        onClick={() => setShowTasks((v) => !v)}
                      >
                        Tasks
                      </Button>
                      <Button
                        variant={showComments ? 'default' : 'outline'}
                        size='sm'
                        className={`h-9 rounded-lg ${showComments ? 'bg-lavender-600 hover:bg-lavender-500' : ''}`}
                        onClick={() => setShowComments((v) => !v)}
                      >
                        Comments
                      </Button>
                      <Button
                        variant='outline'
                        size='sm'
                        className='h-9 rounded-lg flex items-center gap-1 border-gray-300'
                        disabled
                      >
                        <Filter className='h-4 w-4' /> Filters
                      </Button>
                    </div>
                    {s && (
                      <div className='text-xs text-gray-500'>
                        Showing {filteredMembers.length} of {s.totalMembers} members
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>

            {/* Executive Summary */}
            <div className='px-6 space-y-6'>
              {/* Key Performance Indicators - Top Row */}
              <div className='grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4'>
                {showSkeleton || !s
                  ? Array.from({ length: 4 }).map((_, i) => (
                      <Card key={i} className='rounded-xl border border-gray-200 shadow-sm bg-white/80 backdrop-blur'>
                        <CardContent className='p-6'>
                          <div className='space-y-2'>
                            <Skeleton className='h-4 w-24' />
                            <Skeleton className='h-8 w-16' />
                            <Skeleton className='h-3 w-20' />
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  : [
                      {
                        label: 'Task Progress',
                        value: `${((s.totalCompletedTasks / s.totalTasks) * 100).toFixed(1)}%`,
                        subvalue: `${s.totalCompletedTasks}/${s.totalTasks} tasks completed`,
                        icon: <TrendingUp className='h-6 w-6 text-green-600' />,
                        trend: 'positive'
                      },
                      {
                        label: 'Effort Utilization',
                        value: `${s.overallEffortPointCompletionRate.toFixed(1)}%`,
                        subvalue: `${s.totalCompletedEffortPoints}/${s.totalAssignedEffortPoints} points`,
                        icon: <Timer className='h-6 w-6 text-blue-600' />,
                        trend:
                          s.overallEffortPointCompletionRate >= 75
                            ? 'positive'
                            : s.overallEffortPointCompletionRate >= 50
                              ? 'neutral'
                              : 'negative'
                      },
                      {
                        label: 'Team Activity',
                        value: s.totalComments.toString(),
                        subvalue: `${s.averageCommentsPerTask.toFixed(1)} avg per task`,
                        icon: <MessageSquare className='h-6 w-6 text-purple-600' />,
                        trend: 'neutral'
                      },
                      {
                        label: 'Workload Balance',
                        value: s.averageTasksPerMember.toFixed(1),
                        subvalue: `${s.averageEffortPointsPerMember.toFixed(0)} effort/member`,
                        icon: <Users className='h-6 w-6 text-orange-600' />,
                        trend: 'neutral'
                      }
                    ].map((kpi) => (
                      <Card
                        key={kpi.label}
                        className='rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition bg-white/80 backdrop-blur'
                      >
                        <CardContent className='p-6'>
                          <div className='flex items-start justify-between'>
                            <div className='flex-1'>
                              <div className='flex items-center gap-2 mb-2'>
                                {kpi.icon}
                                <p className='text-sm font-semibold text-gray-700'>{kpi.label}</p>
                              </div>
                              <p className='text-3xl font-bold text-gray-900 mb-1'>{kpi.value}</p>
                              <p className='text-xs text-gray-500'>{kpi.subvalue}</p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
              </div>

              {/* Detailed Breakdown - Second Row */}
              <div className='grid grid-cols-1 lg:grid-cols-3 gap-6'>
                {/* Task Status Breakdown */}
                <Card className='rounded-xl border border-gray-200 shadow-sm bg-white/80 backdrop-blur'>
                  <CardHeader className='pb-3'>
                    {showSkeleton ? (
                      <Skeleton className='h-6 w-32' />
                    ) : (
                      <CardTitle className='text-lg font-semibold flex items-center gap-2'>
                        <BarChart3 className='h-5 w-5 text-blue-600' />
                        Task Status
                      </CardTitle>
                    )}
                  </CardHeader>
                  <CardContent className='pt-0'>
                    {showSkeleton || !s ? (
                      <div className='space-y-3'>
                        {Array.from({ length: 4 }).map((_, i) => (
                          <div key={i} className='flex items-center justify-between'>
                            <Skeleton className='h-4 w-20' />
                            <Skeleton className='h-4 w-8' />
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className='space-y-3'>
                        <div className='flex items-center justify-between p-3 bg-green-50 rounded-lg'>
                          <span className='text-sm font-medium text-green-800'>Completed</span>
                          <span className='text-lg font-bold text-green-900'>{s.totalCompletedTasks}</span>
                        </div>
                        <div className='flex items-center justify-between p-3 bg-blue-50 rounded-lg'>
                          <span className='text-sm font-medium text-blue-800'>In Progress</span>
                          <span className='text-lg font-bold text-blue-900'>{s.totalInProgressTasks}</span>
                        </div>
                        <div className='flex items-center justify-between p-3 bg-gray-50 rounded-lg'>
                          <span className='text-sm font-medium text-gray-800'>Todo</span>
                          <span className='text-lg font-bold text-gray-900'>{s.totalTodoTasks}</span>
                        </div>
                        {s.totalOverdueTasks > 0 && (
                          <div className='flex items-center justify-between p-3 bg-red-50 rounded-lg'>
                            <span className='text-sm font-medium text-red-800'>Overdue</span>
                            <span className='text-lg font-bold text-red-900'>{s.totalOverdueTasks}</span>
                          </div>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Effort Points Breakdown */}
                <Card className='rounded-xl border border-gray-200 shadow-sm bg-white/80 backdrop-blur'>
                  <CardHeader className='pb-3'>
                    {showSkeleton ? (
                      <Skeleton className='h-6 w-40' />
                    ) : (
                      <CardTitle className='text-lg font-semibold flex items-center gap-2'>
                        <Timer className='h-5 w-5 text-indigo-600' />
                        Effort Distribution
                      </CardTitle>
                    )}
                  </CardHeader>
                  <CardContent className='pt-0'>
                    {showSkeleton || !s ? (
                      <div className='space-y-3'>
                        {Array.from({ length: 3 }).map((_, i) => (
                          <div key={i} className='flex items-center justify-between'>
                            <Skeleton className='h-4 w-20' />
                            <Skeleton className='h-4 w-8' />
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className='space-y-3'>
                        <div className='flex items-center justify-between p-3 bg-emerald-50 rounded-lg'>
                          <span className='text-sm font-medium text-emerald-800'>Completed</span>
                          <span className='text-lg font-bold text-emerald-900'>{s.totalCompletedEffortPoints}</span>
                        </div>
                        <div className='flex items-center justify-between p-3 bg-blue-50 rounded-lg'>
                          <span className='text-sm font-medium text-blue-800'>In Progress</span>
                          <span className='text-lg font-bold text-blue-900'>{s.totalInProgressEffortPoints}</span>
                        </div>
                        <div className='flex items-center justify-between p-3 bg-gray-50 rounded-lg'>
                          <span className='text-sm font-medium text-gray-800'>Todo</span>
                          <span className='text-lg font-bold text-gray-900'>{s.totalTodoEffortPoints}</span>
                        </div>
                        <div className='mt-4 pt-3 border-t border-gray-200'>
                          <div className='flex items-center justify-between text-xs text-gray-600'>
                            <span>Avg per task</span>
                            <span className='font-medium'>{s.averageEffortPointsPerTask.toFixed(1)}</span>
                          </div>
                          <div className='flex items-center justify-between text-xs text-gray-600 mt-1'>
                            <span>Tasks with effort</span>
                            <span className='font-medium'>
                              {s.totalTasksWithEffortPoints}/{s.totalTasks}
                            </span>
                          </div>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Team Performance */}
                <Card className='rounded-xl border border-gray-200 shadow-sm bg-white/80 backdrop-blur'>
                  <CardHeader className='pb-3'>
                    {showSkeleton ? (
                      <Skeleton className='h-6 w-32' />
                    ) : (
                      <CardTitle className='text-lg font-semibold flex items-center gap-2'>
                        <Users className='h-5 w-5 text-purple-600' />
                        Team Metrics
                      </CardTitle>
                    )}
                  </CardHeader>
                  <CardContent className='pt-0'>
                    {showSkeleton || !s ? (
                      <div className='space-y-3'>
                        {Array.from({ length: 4 }).map((_, i) => (
                          <div key={i} className='flex items-center justify-between'>
                            <Skeleton className='h-4 w-20' />
                            <Skeleton className='h-4 w-8' />
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className='space-y-4'>
                        <div className='space-y-2'>
                          <div className='flex items-center justify-between'>
                            <span className='text-sm text-gray-600'>Total Members</span>
                            <span className='text-lg font-bold text-gray-900'>{s.totalMembers}</span>
                          </div>
                          <div className='flex items-center justify-between'>
                            <span className='text-sm text-gray-600'>Tasks per Member</span>
                            <span className='text-lg font-bold text-gray-900'>
                              {s.averageTasksPerMember.toFixed(1)}
                            </span>
                          </div>
                          <div className='flex items-center justify-between'>
                            <span className='text-sm text-gray-600'>Comments per Task</span>
                            <span className='text-lg font-bold text-gray-900'>
                              {s.averageCommentsPerTask.toFixed(1)}
                            </span>
                          </div>
                          <div className='flex items-center justify-between'>
                            <span className='text-sm text-gray-600'>Effort per Member</span>
                            <span className='text-lg font-bold text-gray-900'>
                              {s.averageEffortPointsPerMember.toFixed(0)}
                            </span>
                          </div>
                        </div>
                        <div className='pt-3 border-t border-gray-200'>
                          <div className='flex items-center justify-between'>
                            <span className='text-xs text-gray-500'>Overall Completion</span>
                            <span className='text-sm font-semibold text-green-600'>
                              {((s.totalCompletedTasks / s.totalTasks) * 100).toFixed(0)}%
                            </span>
                          </div>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Visual Analytics */}
            <div className='p-6'>
              <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
                {/* Task Status Bar */}
                <Card className='rounded-xl border-gray-200 shadow-sm bg-white/80 backdrop-blur'>
                  <CardHeader className='pb-2'>
                    {showSkeleton ? (
                      <Skeleton className='h-4 w-40' />
                    ) : (
                      <CardTitle className='text-sm font-semibold'>Task Status Distribution</CardTitle>
                    )}
                  </CardHeader>
                  <CardContent className='h-[260px]'>
                    {showSkeleton ? (
                      <Skeleton className='h-full w-full rounded-lg' />
                    ) : taskStatusData.length ? (
                      <ChartContainer config={chartConfig} className='aspect-auto h-full'>
                        <ReBarChart data={taskStatusData}>
                          <CartesianGrid strokeDasharray='3 3' vertical={false} />
                          <XAxis dataKey='label' tickLine={false} axisLine={false} />
                          <YAxis allowDecimals={false} width={30} />
                          <ChartTooltip content={<ChartTooltipContent />} />
                          <Bar dataKey='value' radius={[4, 4, 0, 0]}>
                            {taskStatusData.map((entry) => (
                              <Cell key={entry.key} fill={`var(--color-${entry.key})`} />
                            ))}
                          </Bar>
                          <ChartLegend content={<ChartLegendContent />} />
                        </ReBarChart>
                      </ChartContainer>
                    ) : (
                      <p className='text-xs text-gray-500'>No status data</p>
                    )}
                  </CardContent>
                </Card>

                {/* Burndown Chart */}
                <Card className='rounded-xl border-gray-200 shadow-sm bg-white/80 backdrop-blur'>
                  <CardHeader className='pb-2'>
                    <div className='flex items-center justify-between'>
                      {showSkeleton ? (
                        <Skeleton className='h-4 w-40' />
                      ) : (
                        <CardTitle className='text-sm font-semibold'>Sprint Burndown Chart</CardTitle>
                      )}
                      {!showSkeleton && (
                        <div className='flex items-center gap-2'>
                          <Select value={selectedSprintId} onValueChange={setSelectedSprintId}>
                            <SelectTrigger className='w-[200px] h-8 rounded-lg border-gray-300 bg-white/70 backdrop-blur shadow-sm'>
                              <SelectValue placeholder='Select Sprint' />
                            </SelectTrigger>
                            <SelectContent>
                              {sprints.map((sprint) => (
                                <SelectItem key={sprint.id} value={sprint.id}>
                                  {sprint.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <Button
                            size='sm'
                            variant='ghost'
                            onClick={refetchBurndown}
                            className='h-8 px-2 rounded-lg border border-gray-300'
                            disabled={burndownLoading}
                          >
                            <RefreshCw className={`h-3 w-3 ${burndownLoading ? 'animate-spin' : ''}`} />
                          </Button>
                        </div>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className='h-[320px]'>
                    {showSkeleton || burndownLoading ? (
                      <Skeleton className='h-full w-full rounded-lg' />
                    ) : burndownError ? (
                      <div className='flex items-center justify-center h-full'>
                        <div className='text-center'>
                          <AlertCircle className='h-8 w-8 text-red-500 mx-auto mb-2' />
                          <p className='text-xs text-red-500 mb-1'>Error loading burndown chart</p>
                          <p className='text-xs text-gray-500'>{burndownError}</p>
                        </div>
                      </div>
                    ) : burndownChartData.length ? (
                      <ChartContainer config={chartConfig} className='aspect-auto h-full'>
                        <LineChart data={burndownChartData}>
                          <CartesianGrid strokeDasharray='3 3' />
                          <XAxis dataKey='date' tickLine={false} axisLine={false} tick={{ fontSize: 12 }} />
                          <YAxis allowDecimals={false} width={50} />
                          <ChartTooltip
                            content={({ active, payload, label }) => {
                              if (active && payload && payload.length) {
                                return (
                                  <div className='bg-white p-3 border rounded-lg shadow-lg'>
                                    <p className='font-medium text-sm mb-2'>{label}</p>
                                    {payload.map((entry, index) => (
                                      <p key={index} className='text-xs flex items-center gap-2'>
                                        <span
                                          className='w-3 h-3 rounded-full'
                                          style={{ backgroundColor: entry.color }}
                                        />
                                        {entry.name}: {entry.value} points
                                      </p>
                                    ))}
                                  </div>
                                )
                              }
                              return null
                            }}
                          />
                          <Line
                            type='monotone'
                            dataKey='remainingEffort'
                            stroke='var(--color-remainingEffort)'
                            strokeWidth={3}
                            dot={{ r: 4 }}
                            name='Actual Remaining'
                          />
                          <Line
                            type='monotone'
                            dataKey='idealEffort'
                            stroke='var(--color-idealEffort)'
                            strokeWidth={2}
                            strokeDasharray='5 5'
                            dot={false}
                            name='Ideal Burndown'
                          />
                          <ChartLegend content={<ChartLegendContent />} />
                        </LineChart>
                      </ChartContainer>
                    ) : selectedSprintId ? (
                      <div className='flex items-center justify-center h-full'>
                        <div className='text-center'>
                          <BarChart3 className='h-8 w-8 text-gray-400 mx-auto mb-2' />
                          <p className='text-xs text-gray-500 mb-1'>No burndown data available</p>
                          <p className='text-xs text-gray-400'>
                            Sprint may not have started or no effort points assigned
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className='flex items-center justify-center h-full'>
                        <p className='text-xs text-gray-500'>Select a sprint to view burndown chart</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Main Content */}
            <div className='p-6 pt-4 space-y-6'>
              <div className='grid grid-cols-1 lg:grid-cols-3 gap-6'>
                {/* Top Contributors */}
                <Card className='lg:col-span-1 rounded-xl border-gray-200 shadow-sm bg-white/80 backdrop-blur'>
                  <CardHeader className='pb-3'>
                    {showSkeleton ? (
                      <Skeleton className='h-4 w-32' />
                    ) : (
                      <CardTitle className='text-sm font-semibold'>Top Contributors</CardTitle>
                    )}
                  </CardHeader>
                  <CardContent className='space-y-3'>
                    {showSkeleton || !s ? (
                      Array.from({ length: 4 }).map((_, i) => (
                        <div key={i} className='p-3 border rounded-lg bg-white/60 backdrop-blur-sm'>
                          <Skeleton className='h-4 w-40 mb-2' />
                          <Skeleton className='h-3 w-32' />
                        </div>
                      ))
                    ) : s.topContributors?.length ? (
                      s.topContributors.map((tc) => {
                        const tcAvatar = report?.memberActivities?.find((m) => m.userId === tc.userId)?.avatar
                        return (
                          <div
                            key={tc.userId}
                            className='flex items-center justify-between p-3 border rounded-lg bg-white/60 backdrop-blur-sm'
                          >
                            <div className='flex items-center gap-3'>
                              <Avatar className='h-9 w-9'>
                                {tcAvatar ? (
                                  <AvatarImage src={tcAvatar} alt={tc.fullName} />
                                ) : (
                                  <AvatarFallback>
                                    {(tc.fullName || '?')
                                      .split(' ')
                                      .map((n) => n[0])
                                      .slice(0, 2)
                                      .join('')
                                      .toUpperCase()}
                                  </AvatarFallback>
                                )}
                              </Avatar>
                              <div>
                                <p className='font-medium text-sm'>{tc.fullName}</p>
                                <p className='text-xs text-gray-500'>
                                  {`Done ${tc.completedTasks} • Comments ${tc.totalComments} • Effort ${tc.completedEffortPoints}`}
                                </p>
                              </div>
                            </div>
                            <Badge variant='secondary' className='rounded-full'>
                              Score {tc.contributionScore}
                            </Badge>
                          </div>
                        )
                      })
                    ) : (
                      <p className='text-sm text-gray-500'>No data</p>
                    )}
                  </CardContent>
                </Card>

                {/* Member Activities */}
                <Card className='lg:col-span-2 rounded-xl border-gray-200 shadow-sm bg-white/80 backdrop-blur'>
                  <CardHeader className='pb-3'>
                    {showSkeleton ? (
                      <Skeleton className='h-4 w-40' />
                    ) : (
                      <CardTitle className='text-sm font-semibold'>Member Activities</CardTitle>
                    )}
                  </CardHeader>
                  <CardContent className='space-y-3 max-h-[420px] overflow-y-auto pr-1 custom-scroll'>
                    {showSkeleton
                      ? Array.from({ length: 5 }).map((_, i) => (
                          <div key={i} className='p-3 border rounded-lg bg-white/60 backdrop-blur-sm'>
                            <Skeleton className='h-4 w-48 mb-1' />
                            <Skeleton className='h-3 w-40 mb-3' />
                            <div className='grid grid-cols-1 md:grid-cols-2 gap-3'>
                              <Skeleton className='h-3 w-24' />
                              <Skeleton className='h-3 w-32' />
                              <Skeleton className='h-3 w-40' />
                              <Skeleton className='h-3 w-28' />
                            </div>
                          </div>
                        ))
                      : filteredMembers.map((m) => (
                          <div key={m.projectMemberId} className='p-3 border rounded-lg bg-white/60 backdrop-blur-sm'>
                            <div className='flex items-center justify-between mb-2'>
                              <div className='flex items-center gap-3'>
                                <Avatar className='h-9 w-9'>
                                  {m.avatar ? (
                                    <AvatarImage src={m.avatar} alt={m.fullName} />
                                  ) : (
                                    <AvatarFallback>
                                      {(m.fullName || '?')
                                        .split(' ')
                                        .map((n) => n[0])
                                        .slice(0, 2)
                                        .join('')
                                        .toUpperCase()}
                                    </AvatarFallback>
                                  )}
                                </Avatar>
                                <div>
                                  <p className='font-medium text-sm'>
                                    {m.fullName} <span className='text-xs text-gray-500'>• {m.role}</span>
                                  </p>
                                  <p className='text-xs text-gray-500'>{m.email}</p>
                                </div>
                              </div>
                              <div className='flex items-center gap-1.5 text-[10px] flex-wrap'>
                                <Badge className='rounded-full'>Assigned {m.taskStats.totalAssigned}</Badge>
                                <Badge variant='secondary' className='rounded-full'>
                                  Done {m.taskStats.totalCompleted}
                                </Badge>
                                <Badge className='bg-blue-100 text-blue-800 hover:bg-blue-100 rounded-full'>
                                  In Progress {m.taskStats.totalInProgress}
                                </Badge>
                                <Badge className='bg-gray-100 text-gray-800 hover:bg-gray-100 rounded-full'>
                                  Todo {m.taskStats.totalTodo}
                                </Badge>
                                <Badge className='bg-red-100 text-red-800 hover:bg-red-100 rounded-full'>
                                  Overdue {m.taskStats.totalOverdue}
                                </Badge>
                              </div>
                            </div>
                            <div className='grid grid-cols-1 md:grid-cols-3 gap-3'>
                              <div className='text-xs text-gray-600'>CR: {m.taskStats.completionRate.toFixed(1)}%</div>
                              <div className='text-xs text-gray-600'>
                                Pri: L {m.taskStats.lowPriorityTasks} • M {m.taskStats.mediumPriorityTasks} • H{' '}
                                {m.taskStats.highPriorityTasks} • U {m.taskStats.urgentPriorityTasks}
                              </div>
                              <div className='text-xs text-gray-600'>
                                Comments: {m.commentStats.totalComments} (avg{' '}
                                {m.commentStats.averageCommentsPerTask.toFixed(1)})
                              </div>
                              <div className='text-xs text-gray-600'>
                                Effort: {m.effortPointStats.totalAssignedEffortPoints} (CR:{' '}
                                {m.effortPointStats.effortPointCompletionRate.toFixed(1)}%)
                              </div>
                              <div className='text-xs text-gray-600'>
                                Avg Effort/Task: {m.effortPointStats.averageEffortPointsPerTask.toFixed(1)}
                              </div>
                              {m.commentStats.lastCommentDate && (
                                <div className='text-xs text-gray-600'>Last: {fmt(m.commentStats.lastCommentDate)}</div>
                              )}
                            </div>
                          </div>
                        ))}
                  </CardContent>
                </Card>
              </div>

              <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
                {/* Recent Task Activities */}
                {showTasks && (
                  <Card className='rounded-xl border-gray-200 shadow-sm bg-white/80 backdrop-blur'>
                    <CardHeader className='pb-3'>
                      {showSkeleton ? (
                        <Skeleton className='h-4 w-44' />
                      ) : (
                        <CardTitle className='text-sm font-semibold'>Recent Task Activities</CardTitle>
                      )}
                    </CardHeader>
                    <CardContent className='space-y-3 max-h-[360px] overflow-y-auto pr-1 custom-scroll'>
                      {showSkeleton
                        ? Array.from({ length: 6 }).map((_, i) => (
                            <div key={i} className='p-3 border rounded-lg bg-white/60 backdrop-blur-sm'>
                              <Skeleton className='h-4 w-60 mb-2' />
                              <div className='flex gap-3 flex-wrap'>
                                <Skeleton className='h-3 w-24' />
                                <Skeleton className='h-3 w-20' />
                                <Skeleton className='h-3 w-28' />
                              </div>
                            </div>
                          ))
                        : recentTaskActivities.map((t) => (
                            <div
                              key={`${t.taskId}-${t.taskTitle}-${t.assignedAt || t.completedAt || t.deadline}`}
                              className='p-3 border rounded-lg bg-white/60 backdrop-blur-sm'
                            >
                              <div className='flex items-center justify-between'>
                                <div className='flex items-center gap-3'>
                                  <Avatar className='h-8 w-8'>
                                    {t.avatar ? (
                                      <AvatarImage src={t.avatar} alt={t.fullName} />
                                    ) : (
                                      <AvatarFallback>
                                        {(t.fullName || '?')
                                          .split(' ')
                                          .map((n) => n[0])
                                          .slice(0, 2)
                                          .join('')
                                          .toUpperCase()}
                                      </AvatarFallback>
                                    )}
                                  </Avatar>
                                  <div>
                                    <p className='font-medium text-sm'>
                                      {t.taskTitle} <span className='text-xs text-gray-500'>• {t.status}</span>
                                    </p>
                                    <p className='text-xs text-gray-500'>{t.fullName}</p>
                                  </div>
                                </div>
                                <Badge variant='outline' className='rounded-full'>
                                  {t.priority}
                                </Badge>
                              </div>
                              <div className='mt-1 text-[11px] text-gray-600 flex flex-wrap gap-3'>
                                {t.sprintName && (
                                  <span className='inline-flex items-center gap-1'>
                                    <BarChart3 className='h-3.5 w-3.5' /> {t.sprintName}
                                  </span>
                                )}
                                {t.assignedAt && (
                                  <span className='inline-flex items-center gap-1'>
                                    <Calendar className='h-3.5 w-3.5' /> Assigned {fmt(t.assignedAt)}
                                  </span>
                                )}
                                {t.completedAt && (
                                  <span className='inline-flex items-center gap-1'>
                                    <TrendingUp className='h-3.5 w-3.5' /> Completed {fmt(t.completedAt)}
                                  </span>
                                )}
                                {t.deadline && (
                                  <span className='inline-flex items-center gap-1'>
                                    <Calendar className='h-3.5 w-3.5' /> Due {fmt(t.deadline)}
                                  </span>
                                )}
                                {t.isOverdue && (
                                  <span className='inline-flex items-center gap-1 text-red-600'>
                                    <AlertCircle className='h-3.5 w-3.5' /> Overdue
                                  </span>
                                )}
                                <span className='inline-flex items-center gap-1'>
                                  <Timer className='h-3.5 w-3.5' /> Effort: {t.taskEffortPoints} (
                                  {t.assignedEffortPoints})
                                </span>
                              </div>
                            </div>
                          ))}
                    </CardContent>
                  </Card>
                )}

                {/* Recent Comment Activities */}
                {showComments && (
                  <Card className='rounded-xl border-gray-200 shadow-sm bg-white/80 backdrop-blur'>
                    <CardHeader className='pb-3'>
                      {showSkeleton ? (
                        <Skeleton className='h-4 w-56' />
                      ) : (
                        <CardTitle className='text-sm font-semibold'>Recent Comment Activities</CardTitle>
                      )}
                    </CardHeader>
                    <CardContent className='space-y-3 max-h-[360px] overflow-y-auto pr-1 custom-scroll'>
                      {showSkeleton
                        ? Array.from({ length: 6 }).map((_, i) => (
                            <div key={i} className='p-3 border rounded-lg bg-white/60 backdrop-blur-sm'>
                              <Skeleton className='h-4 w-56 mb-2' />
                              <Skeleton className='h-3 w-40' />
                            </div>
                          ))
                        : recentCommentActivities.map((c) => (
                            <div key={c.commentId} className='p-3 border rounded-lg bg-white/60 backdrop-blur-sm'>
                              <div className='flex items-center justify-between'>
                                <div className='flex items-center gap-3'>
                                  <Avatar className='h-8 w-8'>
                                    {c.avatar ? (
                                      <AvatarImage src={c.avatar} alt={c.fullName} />
                                    ) : (
                                      <AvatarFallback>
                                        {(c.fullName || '?')
                                          .split(' ')
                                          .map((n) => n[0])
                                          .slice(0, 2)
                                          .join('')
                                          .toUpperCase()}
                                      </AvatarFallback>
                                    )}
                                  </Avatar>
                                  <div>
                                    <p className='font-medium text-sm'>{c.taskTitle}</p>
                                    <p className='text-xs text-gray-500'>{c.fullName}</p>
                                  </div>
                                </div>
                                <span className='inline-flex items-center gap-1 text-[11px] text-gray-500'>
                                  <MessageSquare className='h-3.5 w-3.5' /> {fmt(c.createdAt)}
                                </span>
                              </div>
                              <p className='text-xs text-gray-700 mt-1 line-clamp-3'>{c.content}</p>
                            </div>
                          ))}
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
      {error && !showSkeleton && (
        <div className='absolute inset-0 flex items-center justify-center bg-white/60 backdrop-blur-sm z-50'>
          <Card className='w-full max-w-md'>
            <CardContent className='pt-6'>
              <div className='text-center'>
                <AlertCircle className='h-12 w-12 text-red-500 mx-auto mb-4' />
                <h3 className='text-lg font-semibold mb-2'>Error Loading Project Report</h3>
                <p className='text-gray-600 mb-4'>{error}</p>
                <Button onClick={() => refetch()}>Try Again</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}

export default ProjectReports
