import { adminApi } from '@/api/admin'
import AdminLayout from '@/components/admin/AdminLayout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useAdmin } from '@/hooks/useAdmin'
import type { AdminUser } from '@/types/admin'
import { Users, Layout, Calendar, BarChart3 } from 'lucide-react'
import { ReactNode, useEffect, useMemo, useRef, useState } from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, PieChart, Pie, Cell, Tooltip, ResponsiveContainer, LabelList } from 'recharts'

const COLORS = ['#ec4899', '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#84cc16']

interface StatItem {
  label: string
  value: number
  icon?: ReactNode
  description?: string
}

const STAT_COLORS = [
  {
    bg: 'bg-gradient-to-br from-pink-100 via-rose-50 to-red-100',
    icon: 'text-pink-600 bg-pink-100',
    shadow: 'shadow-pink-100'
  },
  {
    bg: 'bg-gradient-to-br from-blue-100 via-indigo-50 to-purple-100',
    icon: 'text-blue-600 bg-blue-100',
    shadow: 'shadow-blue-100'
  },
  {
    bg: 'bg-gradient-to-br from-green-100 via-emerald-50 to-teal-100',
    icon: 'text-green-600 bg-green-100',
    shadow: 'shadow-green-100'
  },
  {
    bg: 'bg-gradient-to-br from-orange-100 via-amber-50 to-yellow-100',
    icon: 'text-orange-600 bg-orange-100',
    shadow: 'shadow-orange-100'
  }
]

const StatCard = ({ stat, index }: { stat: StatItem, index: number }) => {
  const color = STAT_COLORS[index % STAT_COLORS.length];
  const displayValue = typeof stat.value === 'number' ? stat.value.toLocaleString() : '0';
  return (
    <div className={`rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 border border-white/50 ${color.bg} ${color.shadow}`}>
      <div className="flex items-center justify-between">
        <div>
          <div className="text-sm font-medium text-gray-600 mb-1">{stat.label}</div>
          <div className="text-3xl font-bold text-gray-800 mb-2">{displayValue}</div>
          {stat.description && <div className="text-sm text-gray-500 font-medium">{stat.description}</div>}
        </div>
        <div className={`rounded-xl p-3 shadow-sm ${color.icon}`}>{stat.icon}</div>
      </div>
    </div>
  );
}

const LoadingSpinner = () => (
  <div className="flex items-center justify-center h-64">
    <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-500 rounded-full animate-spin" />
  </div>
)

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
        // Handle different possible response structures
        let termsData = null
        if (r?.data?.data?.items) {
          // Structure: { data: { data: { items: [...] } } }
          termsData = r.data.data.items
        } else if (r?.data?.data) {
          // Structure: { data: { data: [...] } }
          termsData = r.data.data
        } else if (r?.data?.items) {
          // Structure: { data: { items: [...] } }
          termsData = r.data.items
        } else if (Array.isArray(r?.data)) {
          // Structure: { data: [...] } (direct array)
          termsData = r.data
        } else if (Array.isArray(r)) {
          // Structure: [...] (direct array)
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
        // Set empty arrays on error to prevent undefined issues
        setAllUsers([])
        setProjects([])
        setTerms([])
        setTeams([])
      })
      .finally(() => setFetching(false))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const totalUsers = allUsers?.length || 0
  const totalProjects = projects?.length || 0
  const totalTerms = terms?.length || 0
  const totalTeams = teams?.length || 0
  const activeTeams = teams?.filter(team => (team.totalMembers || 0) > 0)?.length || 0
  
  // Debug logging
  console.log('Dashboard stats:', {
    totalUsers,
    totalProjects, 
    totalTerms,
    totalTeams,
    activeTeams,
    termsData: terms
  })
  const stats: StatItem[] = [
    { label: 'Total Users', value: totalUsers, icon: <Users className="w-6 h-6" />, description: 'Registered users' },
    { label: 'Total Projects', value: totalProjects, icon: <Layout className="w-6 h-6" />, description: 'All projects' },
    { 
      label: 'Total Teams', 
      value: activeTeams, 
      icon: <Users className="w-6 h-6" />, 
      description: 'Teams with members' 
    },
    { label: 'Academic Terms', value: totalTerms, icon: <Calendar className="w-6 h-6" />, description: 'Managed periods' }
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
    return [
      { name: 'Active', value: active },
      { name: 'Inactive', value: inactive }
    ].filter((d) => d.value > 0)
  }, [allUsers])

  const isLoading = loading || fetching

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminLayout title="Admin Dashboard" description="System overview">
        {isLoading ? (
          <LoadingSpinner />
        ) : (
          <div className="space-y-6">
            {/* Debug section for Academic Terms */}
            {totalTerms === 0 && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-yellow-800">No Academic Terms Found</h3>
                    <p className="text-yellow-700">Academic Terms count is 0. This might be because:</p>
                    <ul className="list-disc list-inside text-yellow-700 mt-2">
                      <li>No terms have been created yet</li>
                      <li>API endpoint might be incorrect</li>
                      <li>There might be a server connection issue</li>
                    </ul>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => window.location.href = '/admin/terms'}
                      className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium transition-colors"
                    >
                      Go to Terms Management
                    </button>
                    <button
                      onClick={() => window.location.reload()}
                      className="px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg font-medium transition-colors"
                    >
                      Refresh Data
                    </button>
                  </div>
                </div>
              </div>
            )}
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {stats.map((s, i) => (
                <StatCard key={s.label} stat={s} index={i} />
              ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-50 rounded">
                      <BarChart3 className="w-5 h-5 text-blue-600" />
                    </div>
                    <CardTitle>Projects by Term</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  {projectsByTerm.length === 0 ? (
                    <div className="py-8 text-center text-gray-500">No project data</div>
                  ) : (
                    <div style={{ width: '100%', height: 300 }}>
                      <ResponsiveContainer>
                        <BarChart data={projectsByTerm} margin={{ top: 20, right: 20, left: 0, bottom: 20 }}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="name" />
                          <YAxis />
                          <Bar dataKey="count" fill="#3b82f6">
                            {/* Add value labels on top of each bar */}
                            <LabelList dataKey="count" position="top" />
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-green-50 rounded">
                      <Users className="w-5 h-5 text-green-600" />
                    </div>
                    <CardTitle>User Status</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  {userStatusData.length === 0 ? (
                    <div className="py-8 text-center text-gray-500">No users</div>
                  ) : (
                    <div style={{ width: '100%', height: 300 }}>
                      <ResponsiveContainer>
                        <PieChart>
                          <Pie data={userStatusData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                            {userStatusData.map((_, i) => (
                              <Cell key={i} fill={COLORS[i % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </AdminLayout>
    </div>
  )
}
