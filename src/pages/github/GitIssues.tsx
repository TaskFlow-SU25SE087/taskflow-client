import { Navbar } from '@/components/Navbar'
import { Sidebar } from '@/components/Sidebar'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Loader } from '@/components/ui/loader'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useCurrentProject } from '@/hooks/useCurrentProject'
import { cn } from '@/lib/utils'
import { format } from 'date-fns'
import { AlertCircle, ArrowRight, Calendar, ChevronDown, Filter, Search, Tag } from 'lucide-react'
import { useState } from 'react'

// Temporary mock data until API is ready
const MOCK_ISSUES = [
  {
    id: '1',
    number: 123,
    title: 'Fix authentication bug in login flow',
    description:
      'Users are experiencing issues with the login authentication process. The session is not being properly maintained after successful login.',
    state: 'open',
    author: {
      name: 'Sarah Chen',
      email: 'sarah@example.com'
    },
    assignee: {
      name: 'Mike Johnson',
      email: 'mike@example.com'
    },
    createdAt: new Date('2024-01-15T10:30:00'),
    updatedAt: new Date('2024-01-16T14:20:00'),
    labels: ['bug', 'authentication', 'high-priority'],
    comments: 5,
    milestone: 'Sprint 2'
  },
  {
    id: '2',
    number: 124,
    title: 'Add dark mode support to dashboard',
    description:
      'Implement a dark mode theme option for the dashboard to improve user experience in low-light environments.',
    state: 'closed',
    author: {
      name: 'Alex Rodriguez',
      email: 'alex@example.com'
    },
    assignee: {
      name: 'Sarah Chen',
      email: 'sarah@example.com'
    },
    createdAt: new Date('2024-01-14T15:45:00'),
    updatedAt: new Date('2024-01-17T09:15:00'),
    labels: ['enhancement', 'ui/ux', 'feature'],
    comments: 12,
    milestone: 'Sprint 1'
  },
  {
    id: '3',
    number: 125,
    title: 'Performance optimization for large datasets',
    description:
      'The application is experiencing slow loading times when handling large datasets. Need to implement pagination and lazy loading.',
    state: 'open',
    author: {
      name: 'Mike Johnson',
      email: 'mike@example.com'
    },
    assignee: null,
    createdAt: new Date('2024-01-13T11:20:00'),
    updatedAt: new Date('2024-01-16T16:30:00'),
    labels: ['performance', 'optimization'],
    comments: 3,
    milestone: 'Sprint 3'
  }
]

interface IssueCardProps {
  issue: (typeof MOCK_ISSUES)[0]
}

function IssueCard({ issue }: IssueCardProps) {
  const authorInitials = issue.author.name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()

  const assigneeInitials = issue.assignee?.name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()

  const getStateColor = (state: string) => {
    return state === 'open' ? 'bg-green-100 text-green-700' : 'bg-purple-100 text-purple-700'
  }

  return (
    <div className='bg-white rounded-lg p-4 shadow-sm border border-gray-100 hover:border-lavender-200 transition-colors'>
      <div className='flex items-start gap-4'>
        <div className='flex flex-col items-center gap-2'>
          <Avatar className='h-10 w-10'>
            <AvatarFallback className='bg-lavender-100 text-lavender-700'>{authorInitials}</AvatarFallback>
          </Avatar>
          {issue.assignee && (
            <Avatar className='h-8 w-8'>
              <AvatarFallback className='bg-blue-100 text-blue-700 text-xs'>{assigneeInitials}</AvatarFallback>
            </Avatar>
          )}
        </div>

        <div className='flex-1 min-w-0'>
          <div className='flex items-center gap-2 mb-2'>
            <Badge className={cn('text-xs', getStateColor(issue.state))}>
              {issue.state === 'open' ? 'Open' : 'Closed'}
            </Badge>
            <span className='text-gray-500 text-sm'>#{issue.number}</span>
            <span className='text-gray-500'>•</span>
            <span className='text-sm text-gray-500'>{format(issue.updatedAt, 'MMM d, yyyy')}</span>
          </div>

          <h3 className='text-gray-900 font-medium mb-2 hover:text-lavender-700 cursor-pointer'>{issue.title}</h3>

          <p className='text-gray-600 text-sm mb-3 line-clamp-2'>{issue.description}</p>

          <div className='flex items-center gap-4 text-sm'>
            <div className='flex items-center gap-2'>
              <span className='text-gray-500'>by</span>
              <span className='font-medium text-gray-900'>{issue.author.name}</span>
            </div>

            {issue.assignee && (
              <>
                <span className='text-gray-500'>•</span>
                <div className='flex items-center gap-2'>
                  <span className='text-gray-500'>assigned to</span>
                  <span className='font-medium text-gray-900'>{issue.assignee.name}</span>
                </div>
              </>
            )}

            <span className='text-gray-500'>•</span>
            <div className='flex items-center gap-1 text-gray-500'>
              <AlertCircle className='h-4 w-4' />
              <span>{issue.comments}</span>
            </div>
          </div>

          <div className='flex items-center gap-2 mt-3'>
            {issue.labels.map((label) => (
              <Badge key={label} variant='secondary' className='text-xs'>
                {label}
              </Badge>
            ))}
            {issue.milestone && (
              <Badge variant='outline' className='text-xs'>
                <Tag className='mr-1 h-3 w-3' />
                {issue.milestone}
              </Badge>
            )}
          </div>
        </div>

        <Button variant='ghost' size='icon' className='h-8 w-8 rounded-lg hover:bg-gray-100'>
          <ArrowRight className='h-4 w-4 text-gray-500' />
        </Button>
      </div>
    </div>
  )
}

export default function GitIssues() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const { currentProject, isLoading } = useCurrentProject()
  const [filteredIssues] = useState(MOCK_ISSUES)

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen)
  }

  if (isLoading || !currentProject) {
    return (
      <div className='flex h-screen bg-gray-100'>
        <Sidebar isOpen={isSidebarOpen} onToggle={toggleSidebar} currentProject={currentProject} />
        <div className='flex-1 flex flex-col overflow-hidden'>
          <Navbar isSidebarOpen={isSidebarOpen} toggleSidebar={toggleSidebar} />
          <Loader />
        </div>
      </div>
    )
  }

  return (
    <div className='flex h-screen bg-gray-100'>
      <Sidebar isOpen={isSidebarOpen} onToggle={toggleSidebar} currentProject={currentProject} />

      <div className='flex-1 flex flex-col overflow-hidden'>
        <Navbar isSidebarOpen={isSidebarOpen} toggleSidebar={toggleSidebar} />

        <div className='flex flex-col h-full p-6'>
          <div className='flex-none w-full flex items-center justify-between pb-6'>
            <div className='flex items-center gap-2'>
              <h1 className='text-4xl font-bold'>Issues</h1>
              <div className='flex items-center gap-2 ml-4'>
                <span className='text-sm text-gray-500'>Repository:</span>
                <span className='font-medium'>{currentProject.title}</span>
              </div>
            </div>
            <Button className='bg-lavender-600 hover:bg-lavender-700'>New Issue</Button>
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
                  placeholder='Search issues...'
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
                  <SelectItem value='author'>Author name</SelectItem>
                  <SelectItem value='assignee'>Assignee</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className='space-y-4 overflow-y-auto'>
            {filteredIssues.map((issue) => (
              <IssueCard key={issue.id} issue={issue} />
            ))}
            {filteredIssues.length === 0 && <div className='text-center py-8 text-gray-500'>No issues found</div>}
          </div>
        </div>
      </div>
    </div>
  )
}
