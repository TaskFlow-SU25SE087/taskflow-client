import { Navbar } from '@/components/Navbar'
import { Sidebar } from '@/components/Sidebar'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Loader } from '@/components/ui/loader'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useCurrentProject } from '@/hooks/useCurrentProject'
import { useIssues } from '@/hooks/useIssues'
import { cn } from '@/lib/utils'
import { format } from 'date-fns'
import {
  AlertCircle,
  ArrowRight,
  Bug,
  Calendar,
  ChevronDown,
  Clock,
  FileText,
  Filter,
  GitBranch,
  GitCommit,
  GitPullRequest,
  Lightbulb,
  MessageSquare,
  RefreshCw,
  Search,
  Tag,
  User,
  Users
} from 'lucide-react'
import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'

// Interface for GitHub issue data
interface GitHubIssue {
  id: string
  number?: number
  title: string
  description?: string
  state?: string
  author?: {
    name: string
    email?: string
  }
  assignee?: {
    name: string
    email?: string
  } | null
  createdAt?: string | Date
  updatedAt?: string | Date
  labels?: string[]
  comments?: number
  milestone?: string
  // Additional fields from API
  titleTask?: string
  nameCreate?: string
  avatarCreate?: string
  roleCreate?: string
  priority?: string
  type?: string
  status?: string
  explanation?: string
  example?: string
  issueAttachmentUrls?: string[]
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  taskAssignees?: any[]
}

interface IssueCardProps {
  issue: GitHubIssue
}

function IssueCard({ issue }: IssueCardProps) {
  // Handle both API data and mock data structure
  const authorName = issue.author?.name || issue.nameCreate || 'Unknown'
  const assigneeName = issue.assignee?.name || 'Unassigned'

  const authorInitials = authorName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()

  const assigneeInitials = assigneeName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()

  const getStateColor = (state?: string) => {
    if (!state) return 'bg-gray-100 text-gray-700'
    return state === 'open' ? 'bg-green-100 text-green-700' : 'bg-purple-100 text-purple-700'
  }

  const getIssueTypeIcon = (type?: string) => {
    switch (type?.toLowerCase()) {
      case 'bug':
        return <Bug className='w-4 h-4' />
      case 'featurerequest':
      case 'feature request':
        return <Lightbulb className='w-4 h-4' />
      case 'improvement':
        return <FileText className='w-4 h-4' />
      case 'task':
        return <MessageSquare className='w-4 h-4' />
      case 'documentation':
        return <AlertCircle className='w-4 h-4' />
      default:
        return <Bug className='w-4 h-4' />
    }
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
            <Badge className={cn('text-xs', getStateColor(issue.state || issue.status))}>
              {issue.state === 'open' || issue.status === 'Open' ? 'Open' : 'Closed'}
            </Badge>
            <span className='text-gray-500 text-sm'>#{issue.number || issue.id}</span>
            <span className='text-gray-500'>•</span>
            <span className='text-sm text-gray-500 flex items-center gap-1'>
              <Clock className='w-3 h-3' />
              {issue.updatedAt ? format(new Date(issue.updatedAt), 'MMM d, yyyy') : 'Unknown date'}
            </span>
          </div>

          <h3 className='text-gray-900 font-medium mb-2 hover:text-lavender-700 cursor-pointer flex items-center gap-2'>
            {getIssueTypeIcon(issue.type)}
            {issue.title}
          </h3>

          {/* Hiển thị tên task nếu có */}
          {issue.titleTask && (
            <div className='mb-2'>
              <Badge
                variant='outline'
                className='text-xs bg-blue-50 text-blue-700 border-blue-200 flex items-center gap-1 w-fit'
              >
                <GitBranch className='w-3 h-3' />
                Task: {issue.titleTask}
              </Badge>
            </div>
          )}

          <p className='text-gray-600 text-sm mb-3 line-clamp-2'>
            {issue.description || issue.explanation || 'No description available'}
          </p>

          <div className='flex items-center gap-4 text-sm'>
            <div className='flex items-center gap-2'>
              <User className='h-4 w-4 text-gray-400' />
              <span className='text-gray-500'>by</span>
              <span className='font-medium text-gray-900'>{authorName}</span>
            </div>

            {issue.assignee && (
              <>
                <span className='text-gray-500'>•</span>
                <div className='flex items-center gap-2'>
                  <Users className='h-4 w-4 text-gray-400' />
                  <span className='text-gray-500'>assigned to</span>
                  <span className='font-medium text-gray-900'>{assigneeName}</span>
                </div>
              </>
            )}

            <span className='text-gray-500'>•</span>
            <div className='flex items-center gap-1 text-gray-500'>
              <AlertCircle className='h-4 w-4' />
              <span>{issue.comments || 0}</span>
            </div>
          </div>

          <div className='flex items-center gap-2 mt-3'>
            {issue.labels &&
              issue.labels.map((label) => (
                <Badge key={label} variant='secondary' className='text-xs flex items-center gap-1'>
                  <Tag className='h-3 w-3' />
                  {label}
                </Badge>
              ))}
            {issue.milestone && (
              <Badge variant='outline' className='text-xs flex items-center gap-1'>
                <Clock className='h-3 w-3' />
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
  const { projectId } = useParams<{ projectId: string }>()
  const [isSidebarOpen, setIsSidebarOpen] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const { currentProject, isLoading: projectLoading } = useCurrentProject()
  const { getProjectIssues, isLoading: issuesLoading } = useIssues()
  const [issues, setIssues] = useState<GitHubIssue[]>([])
  const [filteredIssues, setFilteredIssues] = useState<GitHubIssue[]>([])
  const [loadingTimeout, setLoadingTimeout] = useState(false)

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen)
  }

  const handleRefresh = async () => {
    if (projectId) {
      setLoadingTimeout(false)
      try {
        console.log('🔄 Refreshing issues for project:', projectId)
        const projectIssues = await getProjectIssues(projectId)
        console.log('✅ Issues refreshed:', projectIssues)
        setIssues(projectIssues || [])
        setFilteredIssues(projectIssues || [])
      } catch (error) {
        console.error('Error refreshing issues:', error)
        setIssues([])
        setFilteredIssues([])
      }
    }
  }

  // Load issues when component mounts
  useEffect(() => {
    const loadIssues = async () => {
      if (projectId) {
        try {
          console.log('🔄 Loading issues for project:', projectId)

          // Set a timeout to show loading timeout message after 15 seconds
          const timeoutId = setTimeout(() => {
            setLoadingTimeout(true)
          }, 15000)

          const projectIssues = await getProjectIssues(projectId)
          console.log('✅ Issues loaded:', projectIssues)

          clearTimeout(timeoutId)
          setLoadingTimeout(false)
          setIssues(projectIssues || [])
          setFilteredIssues(projectIssues || [])
        } catch (error) {
          console.error('Error loading issues:', error)
          setLoadingTimeout(false)
          setIssues([])
          setFilteredIssues([])
        }
      }
    }

    loadIssues()
  }, [projectId, getProjectIssues])

  // Filter issues based on search query
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredIssues(issues)
    } else {
      const filtered = issues.filter(
        (issue) =>
          (issue.title || issue.titleTask || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
          (issue.description || issue.explanation || '').toLowerCase().includes(searchQuery.toLowerCase())
      )
      setFilteredIssues(filtered)
    }
  }, [searchQuery, issues])

  if (projectLoading || !currentProject) {
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
    <div className='flex h-screen bg-gradient-to-br from-lavender-50 via-white to-blue-50'>
      <Sidebar isOpen={isSidebarOpen} onToggle={toggleSidebar} currentProject={currentProject} />

      <div className='flex-1 flex flex-col overflow-hidden'>
        <Navbar isSidebarOpen={isSidebarOpen} toggleSidebar={toggleSidebar} />

        <div className='flex flex-col h-full p-8'>
          <div className='flex-none w-full flex items-center justify-between pb-8 border-b-2 border-lavender-200 mb-6 shadow-sm'>
            <div className='flex items-center gap-3'>
              <div className='w-10 h-10 rounded-full bg-lavender-100 p-2 flex items-center justify-center'>
                <GitPullRequest className='w-6 h-6 text-lavender-700' />
              </div>
              <h1 className='text-4xl font-extrabold text-lavender-700 drop-shadow'>Issues</h1>
              <div className='flex items-center gap-2 ml-4'>
                <GitBranch className='w-5 h-5 text-blue-600' />
                <span className='text-base text-blue-700 font-semibold'>Repository:</span>
                <span className='font-bold text-purple-700'>{currentProject.title}</span>
              </div>
            </div>
          </div>

          <div className='pb-8 flex items-center justify-between'>
            <div className='flex items-center gap-4 bg-white/80 rounded-2xl shadow-md px-6 py-3'>
              <Button
                variant='outline'
                className='bg-lavender-50 hover:bg-lavender-100 text-lavender-700 border-0 font-semibold rounded-lg'
              >
                <Filter className='mr-2 h-4 w-4 text-blue-400' />
                Filter
                <ChevronDown className='ml-2 h-4 w-4 text-blue-400' />
              </Button>
              <div className='relative'>
                <Search className='absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 transform text-blue-400' />
                <Input
                  placeholder='Search issues...'
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className='w-[280px] pl-10 bg-lavender-50 border-0 rounded-lg text-lavender-700 font-medium focus:ring-2 focus:ring-lavender-400'
                />
              </div>
              <Button
                variant='outline'
                className='bg-blue-50 hover:bg-blue-100 text-blue-700 border-0 font-semibold rounded-lg'
                onClick={handleRefresh}
                disabled={issuesLoading}
              >
                <RefreshCw className={`mr-2 h-4 w-4 ${issuesLoading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>
            <div className='flex gap-2 bg-white/80 rounded-2xl shadow-md px-6 py-3'>
              <Button
                variant='outline'
                className='bg-blue-50 hover:bg-blue-100 text-blue-700 border-0 font-semibold rounded-lg'
              >
                <Calendar className='mr-2 h-4 w-4 text-purple-400' />
                Time Range
              </Button>
              <Select defaultValue='newest'>
                <SelectTrigger className='w-[180px] bg-lavender-50 border-0 rounded-lg text-lavender-700 font-semibold'>
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

          <div className='space-y-6 overflow-y-auto'>
            {issuesLoading ? (
              <div className='text-center py-12'>
                <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-lavender-600 mx-auto mb-4'></div>
                <p className='text-lavender-600 font-medium'>
                  {loadingTimeout ? 'Loading is taking longer than expected...' : 'Loading issues...'}
                </p>
                {loadingTimeout && (
                  <p className='text-sm text-gray-500 mt-2'>
                    The server might be slow. Please wait or try refreshing the page.
                  </p>
                )}
              </div>
            ) : filteredIssues.length > 0 ? (
              filteredIssues.map((issue: GitHubIssue) => <IssueCard key={issue.id} issue={issue} />)
            ) : (
              <div className='text-center py-12 text-lavender-400 text-xl font-semibold flex flex-col items-center'>
                <div className='w-16 h-16 mb-4 opacity-60 flex items-center justify-center'>
                  <GitCommit className='w-12 h-12 text-lavender-400' />
                </div>
                {searchQuery ? 'No issues found matching your search' : 'No issues found'}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
