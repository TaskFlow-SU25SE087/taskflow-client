import { adminApi } from '@/api/admin'
import AdminLayout from '@/components/admin/AdminLayout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart'
import { useAdmin } from '@/hooks/useAdmin'
import type { AdminUser } from '@/types/admin'
import { Activity, BarChart3, Calendar, CheckCircle, Database, Layout, PieChart as PieChartIcon, TrendingUp, Users, UserX } from 'lucide-react'
import { ReactNode, useEffect, useMemo, useRef, useState } from 'react'
import { Bar, BarChart, CartesianGrid, Cell, LabelList, Legend, Pie, PieChart, XAxis, YAxis } from 'recharts'

// Dashboard visual configuration
const dashboardConfig = {
  colors: {
    primary: 'from-blue-600 to-purple-600',
    success: 'from-green-500 to-emerald-600',
    warning: 'from-orange-500 to-yellow-500',
    danger: 'from-red-500 to-pink-600',
    info: 'from-cyan-500 to-blue-500',
    secondary: 'from-gray-500 to-slate-600',
    indigo: 'from-indigo-500 to-purple-500',
    teal: 'from-teal-500 to-cyan-500'
  },
  chartColors: {
    active: '#22c55e',
    inactive: '#f59e0b',
    banned: '#ef4444',
    projects: '#6366f1'
  }
}

interface EnhancedStatItem {
  label: string
  value: number
  icon: ReactNode
  gradient: string
  trend?: string | null
  description?: string
}

// Enhanced stat card
const EnhancedStatCard = ({ stat, index }: { stat: EnhancedStatItem; index: number }) => (
  <div
    className={`group relative overflow-hidden rounded-2xl bg-gradient-to-br ${stat.gradient} p-6 text-white shadow-lg hover:shadow-2xl transition-all duration-500 transform hover:scale-105 hover:-translate-y-2`}
    style={{ animationDelay: `${index * 0.1}s`, animation: 'fadeInUp 0.6s ease-out forwards' }}
  >
    <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-10 transition-opacity duration-300" />
    <div className="absolute -top-4 -right-4 w-24 h-24 bg-white opacity-5 rounded-full group-hover:scale-150 transition-transform duration-700" />

    <div className="relative z-10">
      <div className="flex items-center justify-between mb-4">
        <div className="p-3 bg-white bg-opacity-20 rounded-xl backdrop-blur-sm group-hover:bg-opacity-30 transition-all duration-300">
          {stat.icon}
        </div>
        <div className="text-right">
          <div className="text-3xl font-bold mb-1 group-hover:scale-110 transition-transform duration-300">
            {Number(stat.value).toLocaleString()}
          </div>
          {stat.trend && (
            <div className="flex items-center gap-1 text-sm opacity-90">
              <TrendingUp className="h-4 w-4" />
              <span>{stat.trend}</span>
            </div>
          )}
        </div>
      </div>
      <div className="text-lg font-medium">{stat.label}</div>
      {stat.description && <div className="text-sm opacity-80 mt-1">{stat.description}</div>}
    </div>
  </div>
)

// Loading indicator
const LoadingSpinner = () => (
  <div className="flex flex-col items-center justify-center min-h-64 space-y-4">
    <div className="relative">
      <div className="w-16 h-16 border-4 border-blue-200 rounded-full animate-spin" />
      <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin absolute top-0 left-0" />
    </div>
    <p className="text-lg font-medium text-gray-600 animate-pulse">Loading data...</p>
  </div>
)

// Empty state helper
const EmptyState = ({ icon: Icon, message }: { icon: any; message: string }) => (
  <div className="flex flex-col items-center justify-center h-64 text-gray-500">
    <div className="p-4 bg-gray-100 rounded-full mb-4">
      <Icon className="h-12 w-12 opacity-50" />
    </div>
    <p className="text-center font-medium">{message}</p>
  </div>
)

export default function AdminDashboard() {
  const { fetchAllUsers, loading } = useAdmin()
  const [allUsers, setAllUsers] = useState<AdminUser[]>([])
  const [fetching, setFetching] = useState(true)
  const [projects, setProjects] = useState<Array<{ id: string; isActive: boolean; termName?: string; semester?: string }>>([])
  const [terms, setTerms] = useState<Array<{ id: string; season: string; year: number }>>([])
  const fetchedRef = useRef(false)

  useEffect(() => {
    if (fetchedRef.current) return
    fetchedRef.current = true
    setFetching(true)
    Promise.all([
      fetchAllUsers(),
      adminApi.getAllProjects().then((res) => (res?.data as any[]) || []),
      adminApi.getTermList(1).then((res) => ((res?.data?.data as any[]) || []))
    ])
      .then(([users, proj, termList]) => {
        setAllUsers(users)
        setProjects(
          proj.map((p: any) => ({
            id: p.id,
            isActive: Boolean(p.isActive),
            termName: p.termName,
            semester: p.semester
          }))
        )
        setTerms(termList.map((t: any) => ({ id: t.id, season: t.season, year: t.year })))
      })
      .finally(() => setFetching(false))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const totalUsers = allUsers.length
  const activeUsers = allUsers.filter((u) => u.isActive && !u.isPermanentlyBanned).length
  const inactiveUsers = allUsers.filter((u) => !u.isActive && !u.isPermanentlyBanned).length

  const totalProjects = projects.length
  const activeProjects = projects.filter((p) => p.isActive).length
  const inactiveProjects = totalProjects - activeProjects
  const totalTerms = terms.length

  const enhancedStats: EnhancedStatItem[] = [
    {
      label: 'Total Users',
      value: totalUsers,
      icon: <Users className='h-6 w-6' />,
      gradient: dashboardConfig.colors.primary,
      trend: totalUsers > 0 ? '+12%' : null,
      description: 'Total registered users'
    },
    {
      label: 'Active Users',
      value: activeUsers,
      icon: <CheckCircle className='h-6 w-6' />,
      gradient: dashboardConfig.colors.success,
      trend: activeUsers > 0 ? '+8%' : null,
      description: 'Actively engaged'
    },
    {
      label: 'Inactive Users',
      value: inactiveUsers,
      icon: <UserX className='h-6 w-6' />,
      gradient: dashboardConfig.colors.secondary,
      trend: inactiveUsers > 0 ? '+5%' : null,
      description: 'Not active recently'
    },
    {
      label: 'Total Projects',
      value: totalProjects,
      icon: <Layout className='h-6 w-6' />,
      gradient: dashboardConfig.colors.info,
      trend: totalProjects > 0 ? '+15%' : null,
      description: 'All projects'
    },
    {
      label: 'Active Projects',
      value: activeProjects,
      icon: <Activity className='h-6 w-6' />,
      gradient: dashboardConfig.colors.success,
      trend: activeProjects > 0 ? '+20%' : null,
      description: 'In progress'
    },
    {
      label: 'Inactive Projects',
      value: inactiveProjects,
      icon: <Layout className='h-6 w-6' />,
      gradient: dashboardConfig.colors.secondary,
      trend: inactiveProjects > 0 ? '+10%' : null,
      description: 'Completed or paused'
    },
    {
      label: 'Total Terms',
      value: totalTerms,
      icon: <Calendar className='h-6 w-6' />,
      gradient: dashboardConfig.colors.indigo,
      trend: 'Stable',
      description: 'Managed terms'
    }
  ]

  const projectsByTerm = useMemo(() => {
    const map = new Map<string, number>()
    for (const p of projects) {
      const key = p.termName || p.semester || 'Unknown'
      map.set(key, (map.get(key) || 0) + 1)
    }
    return Array.from(map.entries()).map(([name, count]) => ({ name, count }))
  }, [projects])

  const userStatusData = useMemo(
    () => [
      { name: 'Active', value: activeUsers, fill: dashboardConfig.chartColors.active },
      { name: 'Inactive', value: inactiveUsers, fill: dashboardConfig.chartColors.inactive }
    ],
    [activeUsers, inactiveUsers]
  )

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-purple-50/30">
      <AdminLayout title='Admin Dashboard' description='System overview'>
        {loading || fetching ? (
          <LoadingSpinner />
        ) : (
          <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {enhancedStats.map((stat, index) => (
                <EnhancedStatCard key={index} stat={stat} index={index} />
              ))}
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
              <Card className="shadow-xl border-0 overflow-hidden bg-white/80 backdrop-blur-sm hover:shadow-2xl transition-all duration-500">
                <CardHeader className="bg-gradient-to-r from-blue-500 to-purple-600 text-white">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-white bg-opacity-20 rounded-lg">
                      <BarChart3 className="h-6 w-6" />
                    </div>
                    <CardTitle className="text-xl">Projects by Term</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="p-6">
                  {projectsByTerm.length === 0 ? (
                    <EmptyState icon={Database} message="No project-by-term data yet" />
                  ) : (
                    <ChartContainer
                      config={{ projects: { label: 'Projects', color: dashboardConfig.chartColors.projects } }}
                      className='w-full h-80'
                    >
                      <BarChart data={projectsByTerm} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
                        <defs>
                          <linearGradient id="colorProjects" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor={dashboardConfig.chartColors.projects} stopOpacity={0.8} />
                            <stop offset="95%" stopColor={dashboardConfig.chartColors.projects} stopOpacity={0.3} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                        <XAxis
                          dataKey='name'
                          tickLine={false}
                          axisLine={false}
                          interval={0}
                          angle={-45}
                          height={80}
                          textAnchor='end'
                          tick={{ fontSize: 12, fill: '#000000' }}
                        />
                        <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 12, fill: '#000000' }} />
                        <ChartTooltip content={<ChartTooltipContent nameKey='projects' />} cursor={{ fill: 'rgba(59, 130, 246, 0.1)' }} />
                        <Bar dataKey='count' fill='url(#colorProjects)' radius={[8, 8, 0, 0]} strokeWidth={2} stroke={dashboardConfig.chartColors.projects}>
                          <LabelList dataKey='count' position='top' fill='#000000' className='text-[11px]' />
                        </Bar>
                      </BarChart>
                    </ChartContainer>
                  )}
                </CardContent>
              </Card>

              <Card className="shadow-xl border-0 overflow-hidden bg-white/80 backdrop-blur-sm hover:shadow-2xl transition-all duration-500">
                <CardHeader className="bg-gradient-to-r from-purple-500 to-pink-600 text-white">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-white bg-opacity-20 rounded-lg">
                      <PieChartIcon className="h-6 w-6" />
                    </div>
                    <CardTitle className="text-xl">User Status</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="p-6">
                  {totalUsers === 0 ? (
                    <EmptyState icon={Users} message="No user data yet" />
                  ) : (
                    <ChartContainer
                      config={{
                        active: { label: 'Active', color: dashboardConfig.chartColors.active },
                        inactive: { label: 'Inactive', color: dashboardConfig.chartColors.inactive }
                      }}
                      className='w-full h-80'
                    >
                      <PieChart>
                        <ChartTooltip content={<ChartTooltipContent />} />
                        <Pie
                          data={userStatusData}
                          dataKey='value'
                          nameKey='name'
                          cx='50%'
                          cy='50%'
                          outerRadius={100}
                          innerRadius={40}
                          paddingAngle={2}
                          strokeWidth={3}
                          stroke="#fff"
                          labelLine={false}
                        >
                          {userStatusData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.fill} className="hover:opacity-80 transition-opacity cursor-pointer drop-shadow-lg" />
                          ))}
                          <LabelList dataKey='value' position='inside' content={(props: any) => {
                            const { x, y, value } = props
                            return (
                              <text x={x} y={y} fill="#000000" textAnchor="middle" dominantBaseline="central" fontSize={12} fontWeight={700}>
                                {value}
                              </text>
                            )
                          }} />
                        </Pie>
                        <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ paddingTop: '20px', color: '#000000' }} />
                      </PieChart>
                    </ChartContainer>
                  )}
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="shadow-lg border-0 bg-gradient-to-br from-green-50 to-emerald-50 hover:shadow-xl transition-all duration-300">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-green-700">
                    <CheckCircle className="h-5 w-5" />
                    System Performance
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">{totalUsers > 0 ? Math.round((activeUsers / totalUsers) * 100) : 0}%</div>
                  <p className="text-sm text-green-600 mt-1">Active user ratio</p>
                </CardContent>
              </Card>

              <Card className="shadow-lg border-0 bg-gradient-to-br from-blue-50 to-cyan-50 hover:shadow-xl transition-all duration-300">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-blue-700">
                    <Layout className="h-5 w-5" />
                    Project Ratio
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-blue-600">{totalProjects > 0 ? Math.round((activeProjects / totalProjects) * 100) : 0}%</div>
                  <p className="text-sm text-blue-600 mt-1">Active projects</p>
                </CardContent>
              </Card>

              <Card className="shadow-lg border-0 bg-gradient-to-br from-purple-50 to-indigo-50 hover:shadow-xl transition-all duration-300">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-purple-700">
                    <Calendar className="h-5 w-5" />
                    Managed Terms
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-purple-600">{totalTerms}</div>
                  <p className="text-sm text-purple-600 mt-1">Total number of terms</p>
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </AdminLayout>

      <style>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(30px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  )
}
