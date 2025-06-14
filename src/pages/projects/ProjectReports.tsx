import { useState } from 'react'
import { ChevronDown, Filter, Search, Calendar, ArrowRight, BarChart3, PieChart, Clock, Users } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useCurrentProject } from '@/hooks/useCurrentProject'
import { Sidebar } from '@/components/Sidebar'
import { Navbar } from '@/components/Navbar'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts'
import { Loader } from '@/components/ui/loader'

// Mock data for reports
const MOCK_REPORTS = [
  {
    id: '1',
    title: 'Sprint Velocity Report',
    type: 'velocity',
    description: 'Analysis of team velocity across sprints',
    lastUpdated: new Date('2024-01-15T10:30:00'),
    author: 'Sarah Chen'
  },
  {
    id: '2',
    title: 'Burndown Chart',
    type: 'burndown',
    description: 'Current sprint progress tracking',
    lastUpdated: new Date('2024-01-14T15:45:00'),
    author: 'Mike Johnson'
  },
  {
    id: '3',
    title: 'Task Distribution',
    type: 'distribution',
    description: 'Overview of task status and assignments',
    lastUpdated: new Date('2024-01-13T09:15:00'),
    author: 'Alex Wong'
  }
]

const MOCK_VELOCITY_DATA = [
  { sprint: 'Sprint 1', planned: 30, completed: 25 },
  { sprint: 'Sprint 2', planned: 35, completed: 32 },
  { sprint: 'Sprint 3', planned: 40, completed: 38 },
  { sprint: 'Sprint 4', planned: 35, completed: 34 },
  { sprint: 'Sprint 5', planned: 45, completed: 40 }
]

const MOCK_BURNDOWN_DATA = [
  { day: 'Day 1', remaining: 100, ideal: 90 },
  { day: 'Day 2', remaining: 85, ideal: 80 },
  { day: 'Day 3', remaining: 75, ideal: 70 },
  { day: 'Day 4', remaining: 60, ideal: 60 },
  { day: 'Day 5', remaining: 45, ideal: 50 },
  { day: 'Day 6', remaining: 30, ideal: 40 },
  { day: 'Day 7', remaining: 25, ideal: 30 },
  { day: 'Day 8', remaining: 15, ideal: 20 },
  { day: 'Day 9', remaining: 10, ideal: 10 },
  { day: 'Day 10', remaining: 5, ideal: 0 }
]

interface MetricCardProps {
  title: string
  value: string
  change: string
  icon: React.ReactNode
  trend: 'up' | 'down'
}

function MetricCard({ title, value, change, icon, trend }: MetricCardProps) {
  return (
    <Card>
      <CardContent className='pt-6'>
        <div className='flex items-center justify-between'>
          <div className='space-y-2'>
            <p className='text-sm font-medium text-gray-500'>{title}</p>
            <div className='flex items-center gap-2'>
              <span className='text-2xl font-bold'>{value}</span>
              <span className={`text-sm font-medium ${trend === 'up' ? 'text-green-600' : 'text-red-600'}`}>
                {change}
              </span>
            </div>
          </div>
          <div className='h-12 w-12 rounded-lg bg-lavender-50 flex items-center justify-center'>{icon}</div>
        </div>
      </CardContent>
    </Card>
  )
}

export default function ProjectReports() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const { currentProject, isLoading } = useCurrentProject()

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen)
  }

  if (isLoading || !currentProject) {
    return (
      <div className='flex h-screen bg-gray-100'>
        <Sidebar isOpen={isSidebarOpen} onToggle={toggleSidebar} />
        <div className='flex-1 flex flex-col overflow-hidden'>
          <Navbar isSidebarOpen={isSidebarOpen} toggleSidebar={toggleSidebar} />
          <Loader />
        </div>
      </div>
    )
  }

  return (
    <div className='flex h-screen bg-gray-100'>
      <Sidebar isOpen={isSidebarOpen} onToggle={toggleSidebar} />

      <div className='flex-1 flex flex-col overflow-hidden'>
        <Navbar isSidebarOpen={isSidebarOpen} toggleSidebar={toggleSidebar} />

        <div className='flex flex-col h-full p-6 overflow-y-auto'>
          <div className='flex-none w-full flex items-center justify-between pb-6'>
            <div className='flex items-center gap-2'>
              <h1 className='text-4xl font-bold'>Reports</h1>
              <div className='flex items-center gap-2 ml-4'>
                <span className='text-sm text-gray-500'>Project:</span>
                <span className='font-medium'>{currentProject.title}</span>
              </div>
            </div>
          </div>

          {/* Metrics Overview */}
          <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6'>
            <MetricCard
              title='Sprint Velocity'
              value='32 pts'
              change='+12.5%'
              trend='up'
              icon={<BarChart3 className='h-6 w-6 text-lavender-600' />}
            />
            <MetricCard
              title='Completion Rate'
              value='94%'
              change='+5.2%'
              trend='up'
              icon={<PieChart className='h-6 w-6 text-lavender-600' />}
            />
            <MetricCard
              title='Avg. Cycle Time'
              value='3.2 days'
              change='-0.5 days'
              trend='down'
              icon={<Clock className='h-6 w-6 text-lavender-600' />}
            />
            <MetricCard
              title='Team Capacity'
              value='85%'
              change='+2.1%'
              trend='up'
              icon={<Users className='h-6 w-6 text-lavender-600' />}
            />
          </div>

          <div className='pb-6 flex items-center justify-between'>
            <div className='flex items-center gap-4'>
              <Button variant='outline' className='bg-white hover:bg-gray-50'>
                <Filter className='mr-2 h-4 w-4' />
                Filter
                <ChevronDown className='ml-2 h-4 w-4' />
              </Button>
              <div className='relative'>
                <Search className='absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 transform text-gray-400' />
                <Input
                  placeholder='Search reports...'
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className='w-[280px] pl-10 bg-white'
                />
              </div>
            </div>
            <div className='flex gap-2'>
              <Button variant='outline' className='bg-white hover:bg-gray-50'>
                <Calendar className='mr-2 h-4 w-4' />
                Time Range
              </Button>
              <Select defaultValue='newest'>
                <SelectTrigger className='w-[180px] bg-white'>
                  <SelectValue placeholder='Sort by' />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='newest'>Newest first</SelectItem>
                  <SelectItem value='oldest'>Oldest first</SelectItem>
                  <SelectItem value='name'>Report name</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Charts */}
          <div className='grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6'>
            <Card>
              <CardHeader>
                <CardTitle>Sprint Velocity Trend</CardTitle>
              </CardHeader>
              <CardContent>
                <div className='h-[300px]'>
                  <ResponsiveContainer width='100%' height='100%'>
                    <BarChart data={MOCK_VELOCITY_DATA}>
                      <CartesianGrid strokeDasharray='3 3' />
                      <XAxis dataKey='sprint' />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey='planned' fill='#94a3b8' name='Planned' />
                      <Bar dataKey='completed' fill='#818cf8' name='Completed' />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Sprint Burndown</CardTitle>
              </CardHeader>
              <CardContent>
                <div className='h-[300px]'>
                  <ResponsiveContainer width='100%' height='100%'>
                    <LineChart data={MOCK_BURNDOWN_DATA}>
                      <CartesianGrid strokeDasharray='3 3' />
                      <XAxis dataKey='day' />
                      <YAxis />
                      <Tooltip />
                      <Line type='monotone' dataKey='remaining' stroke='#818cf8' name='Actual' />
                      <Line type='monotone' dataKey='ideal' stroke='#94a3b8' strokeDasharray='5 5' name='Ideal' />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Reports List */}
          <div className='space-y-4'>
            {MOCK_REPORTS.map((report) => (
              <Card key={report.id} className='hover:border-lavender-200 transition-colors'>
                <CardContent className='p-4'>
                  <div className='flex items-start justify-between'>
                    <div className='flex-1'>
                      <h3 className='text-lg font-medium mb-1'>{report.title}</h3>
                      <p className='text-gray-500 text-sm mb-2'>{report.description}</p>
                      <div className='flex items-center gap-4 text-sm text-gray-500'>
                        <span>Last updated: {report.lastUpdated.toLocaleDateString()}</span>
                        <span>By: {report.author}</span>
                      </div>
                    </div>
                    <Button variant='ghost' size='icon' className='h-8 w-8 rounded-lg hover:bg-gray-100'>
                      <ArrowRight className='h-4 w-4 text-gray-500' />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
