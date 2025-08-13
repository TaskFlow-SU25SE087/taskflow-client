import React, { useMemo, useState } from 'react'
import { useParams } from 'react-router-dom'
import { Navbar } from '@/components/Navbar'
import { Sidebar } from '@/components/Sidebar'
import { useCurrentProject } from '@/hooks/useCurrentProject'
import { useTeamActivityReport } from '@/hooks/useTeamActivityReport'
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

const ProjectReports: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>()
  const { report, loading, error, refetch, setQuery } = useTeamActivityReport(projectId)
  const { currentProject } = useCurrentProject()
  const [isSidebarOpen, setIsSidebarOpen] = useState(true)
  const toggleSidebar = () => setIsSidebarOpen((v) => !v)
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d'>('30d')
  const [memberSearch, setMemberSearch] = useState('')
  const [showComments, setShowComments] = useState(true)
  const [showTasks, setShowTasks] = useState(true)
  const [topCount, setTopCount] = useState(5)

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
        .flatMap((m) => m.taskActivities.map((t) => ({ ...t, fullName: m.fullName })))
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
        .flatMap((m) => m.commentActivities.map((c) => ({ ...c, fullName: m.fullName })))
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

  return (
    <div className='flex h-screen bg-gradient-to-br from-slate-50 via-white to-lavender-50 relative'>
      <Sidebar isOpen={isSidebarOpen} onToggle={toggleSidebar} currentProject={currentProject} />
      <div className='flex-1 flex flex-col overflow-hidden'>
        <Navbar isSidebarOpen={isSidebarOpen} toggleSidebar={toggleSidebar} />
        <div className='flex-1 overflow-y-auto bg-gradient-to-br from-white via-slate-50 to-lavender-50/60'>
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
                          {s.totalTasks} tasks • {s.totalComments} comments
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
                      <Select value={timeRange} onValueChange={(v: any) => applyTimeRange(v)}>
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

            {/* Summary Cards */}
            <div className='px-6 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4'>
              {showSkeleton || !s
                ? Array.from({ length: 4 }).map((_, i) => (
                    <Card key={i} className='rounded-xl border border-gray-200 shadow-sm bg-white/80 backdrop-blur'>
                      <CardContent className='p-4'>
                        <div className='space-y-2'>
                          <Skeleton className='h-3 w-20' />
                          <Skeleton className='h-7 w-16' />
                        </div>
                      </CardContent>
                    </Card>
                  ))
                : [
                    {
                      label: 'Total Tasks',
                      value: s.totalTasks,
                      icon: <BarChart3 className='h-5 w-5 text-blue-600' />
                    },
                    {
                      label: 'Completed',
                      value: s.totalCompletedTasks,
                      icon: <TrendingUp className='h-5 w-5 text-green-600' />
                    },
                    {
                      label: 'In Progress',
                      value: s.totalInProgressTasks,
                      icon: <BarChart3 className='h-5 w-5 text-purple-600' />
                    },
                    {
                      label: 'Overdue',
                      value: s.totalOverdueTasks,
                      icon: <AlertCircle className='h-5 w-5 text-red-600' />
                    }
                  ].map((c) => (
                    <Card
                      key={c.label}
                      className='rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition bg-white/80 backdrop-blur'
                    >
                      <CardContent className='p-4'>
                        <div className='flex items-center justify-between'>
                          <div>
                            <p className='text-xs font-medium text-gray-500 tracking-wide uppercase'>{c.label}</p>
                            <p className='mt-1 text-2xl font-bold text-gray-900'>{c.value}</p>
                          </div>
                          {c.icon}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
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
                      s.topContributors.map((tc) => (
                        <div
                          key={tc.userId}
                          className='flex items-center justify-between p-3 border rounded-lg bg-white/60 backdrop-blur-sm'
                        >
                          <div>
                            <p className='font-medium text-sm'>{tc.fullName}</p>
                            <p className='text-xs text-gray-500'>
                              Done {tc.completedTasks} • Comments {tc.totalComments}
                            </p>
                          </div>
                          <Badge variant='secondary' className='rounded-full'>
                            Score {tc.contributionScore}
                          </Badge>
                        </div>
                      ))
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
                              <div>
                                <p className='font-medium text-sm'>
                                  {m.fullName} <span className='text-xs text-gray-500'>• {m.role}</span>
                                </p>
                                <p className='text-xs text-gray-500'>{m.email}</p>
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
                            <div className='grid grid-cols-1 md:grid-cols-2 gap-3'>
                              <div className='text-xs text-gray-600'>CR: {m.taskStats.completionRate.toFixed(1)}%</div>
                              <div className='text-xs text-gray-600'>
                                Pri: L {m.taskStats.lowPriorityTasks} • M {m.taskStats.mediumPriorityTasks} • H{' '}
                                {m.taskStats.highPriorityTasks} • U {m.taskStats.urgentPriorityTasks}
                              </div>
                              <div className='text-xs text-gray-600'>
                                Comments: {m.commentStats.totalComments} (avg{' '}
                                {m.commentStats.averageCommentsPerTask.toFixed(1)})
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
                                <p className='font-medium text-sm'>
                                  {t.taskTitle} <span className='text-xs text-gray-500'>• {t.status}</span>
                                </p>
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
                                <p className='font-medium text-sm'>{c.taskTitle}</p>
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
