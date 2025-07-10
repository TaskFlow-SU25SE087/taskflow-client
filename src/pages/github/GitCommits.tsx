import { Navbar } from '@/components/Navbar'
import { Sidebar } from '@/components/Sidebar'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Loader } from '@/components/ui/loader'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useCurrentProject } from '@/hooks/useCurrentProject'
import { cn } from '@/lib/utils'
import { format } from 'date-fns'
import { ArrowRight, Calendar, ChevronDown, Filter, GitCommit, Search } from 'lucide-react'
import { useState } from 'react'

// Temporary mock data until API is ready
const MOCK_COMMITS = [
  {
    id: '1',
    hash: 'a1b2c3d',
    message: 'Add user authentication and session management',
    author: {
      name: 'Sarah Chen',
      email: 'sarah@example.com'
    },
    date: new Date('2024-01-15T10:30:00'),
    changes: { additions: 120, deletions: 45 },
    branch: 'main'
  },
  {
    id: '2',
    hash: 'e4f5g6h',
    message: 'Fix responsive layout issues in dashboard',
    author: {
      name: 'Mike Johnson',
      email: 'mike@example.com'
    },
    date: new Date('2024-01-14T15:45:00'),
    changes: { additions: 85, deletions: 32 },
    branch: 'fix/responsive-layout'
  }
  // Add more mock commits as needed
]

interface CommitCardProps {
  commit: (typeof MOCK_COMMITS)[0]
}

function CommitCard({ commit }: CommitCardProps) {
  const initials = commit.author.name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()

  return (
    <div className='bg-white rounded-lg p-4 shadow-sm border border-gray-100 hover:border-lavender-200 transition-colors'>
      <div className='flex items-start gap-4'>
        <Avatar className='h-10 w-10'>
          <AvatarFallback className='bg-lavender-100 text-lavender-700'>{initials}</AvatarFallback>
        </Avatar>
        <div className='flex-1 min-w-0'>
          <div className='flex items-center gap-2 mb-1'>
            <span className='font-medium text-gray-900'>{commit.author.name}</span>
            <span className='text-gray-500'>committed</span>
            <span className='text-sm text-gray-500'>{format(commit.date, 'MMM d, yyyy')}</span>
          </div>
          <p className='text-gray-900 font-medium mb-2'>{commit.message}</p>
          <div className='flex items-center gap-4 text-sm'>
            <div className='flex items-center gap-1.5 text-gray-500'>
              <GitCommit className='h-4 w-4' />
              <span className='font-mono'>{commit.hash}</span>
            </div>
            <div className='flex items-center gap-2'>
              <span
                className={cn(
                  'px-2 py-0.5 rounded-full text-xs font-medium',
                  commit.branch === 'main' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'
                )}
              >
                {commit.branch}
              </span>
            </div>
            <div className='flex items-center gap-2 text-gray-500'>
              <span className='text-green-600'>+{commit.changes.additions}</span>
              <span className='text-red-600'>-{commit.changes.deletions}</span>
            </div>
          </div>
        </div>
        <Button variant='ghost' size='icon' className='h-8 w-8 rounded-lg hover:bg-gray-100'>
          <ArrowRight className='h-4 w-4 text-gray-500' />
        </Button>
      </div>
    </div>
  )
}

export default function GitCommits() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const { currentProject, isLoading } = useCurrentProject()
  const [filteredCommits] = useState(MOCK_COMMITS)

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
              <h1 className='text-4xl font-bold'>Commits</h1>
              <div className='flex items-center gap-2 ml-4'>
                <span className='text-sm text-gray-500'>Repository:</span>
                <span className='font-medium'>{currentProject.title}</span>
              </div>
            </div>
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
                  placeholder='Search commits...'
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
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className='space-y-4 overflow-y-auto'>
            {filteredCommits.map((commit) => (
              <CommitCard key={commit.id} commit={commit} />
            ))}
            {filteredCommits.length === 0 && <div className='text-center py-8 text-gray-500'>No commits found</div>}
          </div>
        </div>
      </div>
    </div>
  )
}
