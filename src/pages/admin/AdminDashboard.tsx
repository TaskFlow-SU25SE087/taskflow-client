import { adminApi } from '@/api/admin'
import AdminLayout from '@/components/admin/AdminLayout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useAdmin } from '@/hooks/useAdmin'
import type { AdminUser } from '@/types/admin'
import { Users, Layout, Calendar, BarChart3, Activity, Clock } from 'lucide-react'
import { ReactNode, useEffect, useMemo, useRef, useState } from 'react'
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  PieChart, 
  Pie, 
  Cell, 
  Tooltip, 
  ResponsiveContainer, 
  LabelList,
  Area,
  AreaChart,
  Legend
} from 'recharts'

const COLORS = ['#6366f1', '#8b5cf6', '#ec4899', '#ef4444', '#f59e0b', '#10b981', '#06b6d4', '#84cc16']


interface StatItem {
  label: string
  value: number
  icon?: ReactNode
  description?: string
}

const STAT_CONFIGS = [
  {
    bg: 'bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50',
    icon: 'text-indigo-600 bg-white/80',
    border: 'border-indigo-200/50',
    shadow: 'hover:shadow-indigo-200/50',
    glow: 'hover:shadow-2xl hover:shadow-indigo-200/30'
  },
  {
    bg: 'bg-gradient-to-br from-blue-50 via-cyan-50 to-teal-50',
    icon: 'text-blue-600 bg-white/80',
    border: 'border-blue-200/50',
    shadow: 'hover:shadow-blue-200/50',
    glow: 'hover:shadow-2xl hover:shadow-blue-200/30'
  },
  {
    bg: 'bg-gradient-to-br from-emerald-50 via-green-50 to-teal-50',
    icon: 'text-emerald-600 bg-white/80',
    border: 'border-emerald-200/50',
    shadow: 'hover:shadow-emerald-200/50',
    glow: 'hover:shadow-2xl hover:shadow-emerald-200/30'
  },
  {
    bg: 'bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50',
    icon: 'text-orange-600 bg-white/80',
    border: 'border-orange-200/50',
    shadow: 'hover:shadow-orange-200/50',
    glow: 'hover:shadow-2xl hover:shadow-orange-200/30'
  }
]

const StatCard = ({ stat, index }: { stat: StatItem, index: number }) => {
  const config = STAT_CONFIGS[index % STAT_CONFIGS.length]
  const displayValue = typeof stat.value === 'number' ? stat.value.toLocaleString() : '0'
  
  return (
    <div className={`
      relative overflow-hidden rounded-2xl p-6 border backdrop-blur-sm
      transition-all duration-500 ease-out
      hover:scale-[1.02] hover:-translate-y-1
      ${config.bg} ${config.border} ${config.glow}
    `}>
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute -right-4 -top-4 w-24 h-24 rounded-full bg-current"></div>
        <div className="absolute -left-2 -bottom-2 w-16 h-16 rounded-full bg-current"></div>
      </div>
      
      <div className="relative flex items-start justify-between">
        <div className="flex-1">
          <div className="text-sm font-medium text-gray-600 mb-1 uppercase tracking-wider">
            {stat.label}
          </div>
          <div className="text-4xl font-bold text-gray-800 mb-2 tracking-tight">
            {displayValue}
          </div>
          {stat.description && (
            <div className="text-sm text-gray-500 font-medium">
              {stat.description}
            </div>
          )}
        </div>
        <div className={`
          rounded-xl p-3 shadow-lg backdrop-blur-sm
          transition-transform duration-300 hover:scale-110
          ${config.icon}
        `}>
          {stat.icon}
        </div>
      </div>
    </div>
  )
}

const LoadingSpinner = () => (
  <div className="flex items-center justify-center h-64">
    <div className="relative">
      <div className="w-16 h-16 border-4 border-indigo-100 border-t-indigo-500 rounded-full animate-spin"></div>
      <div className="absolute inset-0 w-16 h-16 border-4 border-transparent border-r-purple-400 rounded-full animate-spin animate-reverse" style={{ animationDelay: '-0.3s' }}></div>
    </div>
  </div>
)

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white/95 backdrop-blur-sm border border-gray-200 rounded-lg shadow-xl p-3">
        <p className="font-semibold text-gray-800">{label}</p>
        {payload.map((entry: any, index: number) => (
          <p key={index} className="text-sm" style={{ color: entry.color }}>
            {entry.name}: {entry.value}
          </p>
        ))}
      </div>
    )
  }
  return null
}

// Custom Pie Chart Label Component
const CustomPieLabel = ({ cx, cy, midAngle, outerRadius, value, name }: any) => {
  const RADIAN = Math.PI / 180;
  
  // Calculate position for the label
  const radius = outerRadius + 25;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);
  
  // Determine text anchor based on position
  const textAnchor = x > cx ? 'start' : 'end';
  
  return (
    <text
      x={x}
      y={y}
      fill="#374151"
      textAnchor={textAnchor}
      dominantBaseline="central"
      fontSize={12}
      fontWeight="600"
    >
      {`${name}: ${value}`}
    </text>
  );
};

export default function AdminDashboard() {
  const { fetchAllUsers, loading } = useAdmin()
  const [allUsers, setAllUsers] = useState<AdminUser[]>([])
  const [projects, setProjects] = useState<any[]>([])
  const [terms, setTerms] = useState<any[]>([])
  const [teams, setTeams] = useState<any[]>([])
  const [fetching, setFetching] = useState(false)
  const fetchedRef = useRef(false)

  useEffect(() => {
    if (fetchedRef.current) return
    fetchedRef.current = true
    setFetching(true)

    Promise.all([
      fetchAllUsers(),
      adminApi.getAllProjects().then((r) => (r?.data as any[]) || []),
      adminApi.getTermList(1).then((r) => {
        console.log('Term API Response:', r)
        let termsData = null
        if (r?.data?.data?.items) {
          termsData = r.data.data.items
        } else if (r?.data?.data) {
          termsData = r.data.data
        } else if (r?.data?.items) {
          termsData = r.data.items
        } else if (Array.isArray(r?.data)) {
          termsData = r.data
        } else if (Array.isArray(r)) {
          termsData = r
        }
        console.log('Processed terms data:', termsData)
        return Array.isArray(termsData) ? termsData : []
      }),
      adminApi.getTeams().then((r) => (r?.data as any[]) || [])
    ])
      .then(([users, proj, termList, teamsRes]) => {
        console.log('Dashboard data loaded:', { users: users?.length, projects: proj?.length, terms: termList?.length, teams: teamsRes?.length })
        setAllUsers(users || [])
        setProjects(proj || [])
        setTerms(termList || [])
        setTeams(teamsRes || [])
      })
      .catch((err) => {
        console.error('Dashboard fetch error', err)
        setAllUsers([])
        setProjects([])
        setTerms([])
        setTeams([])
      })
      .finally(() => setFetching(false))
  }, [])

  const totalUsers = allUsers?.length || 0
  const totalProjects = projects?.length || 0
  const totalTerms = terms?.length || 0
  const totalTeams = teams?.length || 0
  const activeTeams = teams?.filter(team => (team.totalMembers || 0) > 0)?.length || 0
  
  console.log('Dashboard stats:', {
    totalUsers,
    totalProjects, 
    totalTerms,
    totalTeams,
    activeTeams,
    termsData: terms
  })

  const stats: StatItem[] = [
    { 
      label: 'Total Users', 
      value: totalUsers, 
      icon: <Users className="w-7 h-7" />, 
      description: 'Registered users'
    },
    { 
      label: 'Active Projects', 
      value: totalProjects, 
      icon: <Layout className="w-7 h-7" />, 
      description: 'All projects'
    },
    { 
      label: 'Active Teams', 
      value: activeTeams, 
      icon: <Activity className="w-7 h-7" />, 
      description: 'Teams with members'
    },
    { 
      label: 'Academic Semesters', 
      value: totalTerms, 
      icon: <Calendar className="w-7 h-7" />, 
      description: 'Managed periods'
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

  const userStatusData = useMemo(() => {
    const active = allUsers.filter((u) => u.isActive && !u.isPermanentlyBanned).length
    const inactive = allUsers.length - active
    const banned = allUsers.filter((u) => u.isPermanentlyBanned).length
    
    return [
      { name: 'Active Users', value: active, fill: COLORS[0] },
      { name: 'Inactive Users', value: inactive, fill: COLORS[1] },
      ...(banned > 0 ? [{ name: 'Banned Users', value: banned, fill: COLORS[3] }] : [])
    ].filter((d) => d.value > 0)
  }, [allUsers])

  const teamsByTerm = useMemo(() => {
    const map = new Map<string, { teams: number, members: number }>()
    for (const team of teams) {
      // Chỉ tính những team có member
      if ((team.totalMembers || 0) > 0) {
        const key = team.semester || team.termName || 'Unknown'
        const current = map.get(key) || { teams: 0, members: 0 }
        map.set(key, {
          teams: current.teams + 1,
          members: current.members + (team.totalMembers || 0)
        })
      }
    }
    return Array.from(map.entries()).map(([name, data]) => ({ 
      name, 
      teams: data.teams, 
      members: data.members 
    }))
  }, [teams])

  const usersByTerm = useMemo(() => {
    const map = new Map<string, { active: number, inactive: number }>()
    
    for (const user of allUsers) {
      // Sử dụng term hoặc termSeason + termYear để phân loại
      let key = 'Unknown'
      if (user.term) {
        key = user.term
      } else if (user.termSeason && user.termYear) {
        key = `${user.termSeason} ${user.termYear}`
      }
      
      const current = map.get(key) || { active: 0, inactive: 0 }
      
      if (user.isActive && !user.isPermanentlyBanned) {
        current.active += 1
      } else {
        current.inactive += 1
      }
      
      map.set(key, current)
    }
    
    return Array.from(map.entries()).map(([name, data]) => ({
      name,
      active: data.active,
      inactive: data.inactive
    }))
  }, [allUsers])

  const isLoading = loading || fetching

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100">
      <AdminLayout title="Admin Dashboard" description="System overview and analytics">
        {isLoading ? (
          <LoadingSpinner />
        ) : (
          <div className="space-y-8">
            {/* Alert for no terms */}
            {totalTerms === 0 && (
              <div className="relative overflow-hidden bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-2xl p-6 shadow-lg">
                <div className="absolute inset-0 bg-amber-100 opacity-20"></div>
                <div className="relative flex items-center justify-between">
                  <div className="flex items-start gap-4">
                    <div className="p-2 bg-amber-100 rounded-xl">
                      <Clock className="w-6 h-6 text-amber-600" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-amber-800 mb-2">No Academic Semesters Found</h3>
                      <p className="text-amber-700 mb-3">Academic Semesters count is 0. This might be because:</p>
                      <ul className="list-disc list-inside text-amber-700 space-y-1">
                        <li>No semesters have been created yet</li>
                        <li>API endpoint might be incorrect</li>
                        <li>There might be a server connection issue</li>
                      </ul>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <button
                      onClick={() => window.location.href = '/admin/terms'}
                      className="px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-xl font-semibold transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
                    >
                      Manage Terms
                    </button>
                    <button
                      onClick={() => window.location.reload()}
                      className="px-6 py-3 bg-gradient-to-r from-gray-500 to-gray-600 hover:from-gray-600 hover:to-gray-700 text-white rounded-xl font-semibold transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
                    >
                      Refresh
                    </button>
                  </div>
                </div>
              </div>
            )}
            
            {/* Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {stats.map((stat, index) => (
                <StatCard key={stat.label} stat={stat} index={index} />
              ))}
            </div>

            {/* Charts Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-8">
              
              {/* Projects by Term - Area Chart */}
              <div className="lg:col-span-2">
                <Card className="border-0 shadow-xl bg-gradient-to-br from-white to-gray-50/50 backdrop-blur-sm">
                  <CardHeader className="pb-3">
                    <div className="flex items-center gap-3">
                      <div className="p-3 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl shadow-lg">
                        <BarChart3 className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <CardTitle className="text-xl">Projects Distribution</CardTitle>
                        <p className="text-sm text-gray-500 mt-1">Projects across academic semesters</p>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {projectsByTerm.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-12 text-gray-400">
                        <BarChart3 className="w-16 h-16 mb-4 opacity-50" />
                        <p className="text-lg font-medium">No project data available</p>
                      </div>
                    ) : (
                      <div style={{ width: '100%', height: 320 }}>
                        <ResponsiveContainer>
                          <AreaChart data={projectsByTerm} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                            <defs>
                              <linearGradient id="projectGradient" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#6366f1" stopOpacity={0.8}/>
                                <stop offset="95%" stopColor="#6366f1" stopOpacity={0.1}/>
                              </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                            <XAxis 
                              dataKey="name" 
                              stroke="#64748b"
                              fontSize={12}
                              tickLine={false}
                            />
                            <YAxis 
                              stroke="#64748b"
                              fontSize={12}
                              tickLine={false}
                              axisLine={false}
                            />
                            <Tooltip content={<CustomTooltip />} />
                            <Area
                              type="monotone"
                              dataKey="count"
                              stroke="#6366f1"
                              strokeWidth={3}
                              fill="url(#projectGradient)"
                            />
                          </AreaChart>
                        </ResponsiveContainer>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* User Status - Radial Chart */}
              <Card className="border-0 shadow-xl bg-gradient-to-br from-white to-gray-50/50 backdrop-blur-sm">
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-xl shadow-lg">
                      <Users className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <CardTitle className="text-xl">User Status</CardTitle>
                      <p className="text-sm text-gray-500 mt-1">User activity overview</p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {userStatusData.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 text-gray-400">
                      <Users className="w-16 h-16 mb-4 opacity-50" />
                      <p className="text-lg font-medium">No user data</p>
                    </div>
                  ) : (
                    <div style={{ width: '100%', height: 320 }}>
                      <ResponsiveContainer>
                        <PieChart>
                          <Pie 
                            data={userStatusData} 
                            dataKey="value" 
                            nameKey="name" 
                            cx="50%" 
                            cy="50%" 
                            outerRadius={80}
                            innerRadius={20}
                            label={<CustomPieLabel />}
                            labelLine={false}
                          >
                            {userStatusData.map((entry, index) => (
                              <Cell key={index} fill={entry.fill || COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip content={<CustomTooltip />} />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Teams by Term - Multi-bar Chart */}
              <div className="lg:col-span-2 xl:col-span-3">
                <Card className="border-0 shadow-xl bg-gradient-to-br from-white to-gray-50/50 backdrop-blur-sm">
                  <CardHeader className="pb-3">
                    <div className="flex items-center gap-3">
                      <div className="p-3 bg-gradient-to-r from-purple-500 to-pink-600 rounded-xl shadow-lg">
                        <Activity className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <CardTitle className="text-xl">Teams & Members Overview</CardTitle>
                        <p className="text-sm text-gray-500 mt-1">Team distribution and membership across terms</p>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {teamsByTerm.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-12 text-gray-400">
                        <Activity className="w-16 h-16 mb-4 opacity-50" />
                        <p className="text-lg font-medium">No team data available</p>
                      </div>
                    ) : (
                      <div style={{ width: '100%', height: 320 }}>
                        <ResponsiveContainer>
                          <BarChart data={teamsByTerm} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                            <XAxis 
                              dataKey="name" 
                              stroke="#64748b"
                              fontSize={12}
                              tickLine={false}
                            />
                            <YAxis 
                              stroke="#64748b"
                              fontSize={12}
                              tickLine={false}
                              axisLine={false}
                            />
                            <Tooltip content={<CustomTooltip />} />
                            <Legend />
                            <Bar 
                              dataKey="teams" 
                              fill="#8b5cf6" 
                              name="Teams"
                              radius={[4, 4, 0, 0]}
                            >
                              <LabelList dataKey="teams" position="top" fontSize={10} />
                            </Bar>
                            <Bar 
                              dataKey="members" 
                              fill="#06b6d4" 
                              name="Members"
                              radius={[4, 4, 0, 0]}
                            >
                              <LabelList dataKey="members" position="top" fontSize={10} />
                            </Bar>
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Users by Term - Multi-bar Chart */}
              <div className="lg:col-span-2 xl:col-span-3">
                <Card className="border-0 shadow-xl bg-gradient-to-br from-white to-gray-50/50 backdrop-blur-sm">
                  <CardHeader className="pb-3">
                    <div className="flex items-center gap-3">
                      <div className="p-3 bg-gradient-to-r from-rose-500 to-pink-600 rounded-xl shadow-lg">
                        <Users className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <CardTitle className="text-xl">Users by Semester Overview</CardTitle>
                        <p className="text-sm text-gray-500 mt-1">User distribution and status across academic semesters</p>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {usersByTerm.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-12 text-gray-400">
                        <Users className="w-16 h-16 mb-4 opacity-50" />
                        <p className="text-lg font-medium">No user data available</p>
                      </div>
                    ) : (
                      <div style={{ width: '100%', height: 320 }}>
                        <ResponsiveContainer>
                          <BarChart data={usersByTerm} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                            <XAxis 
                              dataKey="name" 
                              stroke="#64748b"
                              fontSize={12}
                              tickLine={false}
                            />
                            <YAxis 
                              stroke="#64748b"
                              fontSize={12}
                              tickLine={false}
                              axisLine={false}
                            />
                            <Tooltip content={<CustomTooltip />} />
                            <Legend />
                            <Bar 
                              dataKey="active" 
                              fill="#10b981" 
                              name="Active Users"
                              radius={[4, 4, 0, 0]}
                            >
                              <LabelList dataKey="active" position="top" fontSize={10} />
                            </Bar>
                            <Bar 
                              dataKey="inactive" 
                              fill="#ef4444" 
                              name="Inactive Users"
                              radius={[4, 4, 0, 0]}
                            >
                              <LabelList dataKey="inactive" position="top" fontSize={10} />
                            </Bar>
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        )}
      </AdminLayout>
    </div>
  )
}
