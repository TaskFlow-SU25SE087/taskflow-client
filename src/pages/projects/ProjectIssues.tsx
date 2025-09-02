/* eslint-disable @typescript-eslint/no-explicit-any */
import { Navbar } from '@/components/Navbar'
import { Sidebar } from '@/components/Sidebar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { useCurrentProject } from '@/hooks/useCurrentProject'
import { useIssues } from '@/hooks/useIssues'
import { Issue, IssuePriority, IssueStatus, IssueType } from '@/types/issue'
import {
  AlertCircle,
  Bug,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  FileText,
  GitBranch,
  Lightbulb,
  MessageSquare,
  RefreshCw,
  Search,
  Share2
} from 'lucide-react'
import React, { useEffect, useState } from 'react'
import { useParams, useSearchParams } from 'react-router-dom'

const priorityOptions = [
  { value: 0, label: 'Low', color: 'bg-blue-100 text-blue-800', stringValue: 'Low' },
  { value: 10000, label: 'Medium', color: 'bg-orange-100 text-orange-800', stringValue: 'Medium' },
  { value: 20000, label: 'High', color: 'bg-red-100 text-red-800', stringValue: 'High' },
  { value: 30000, label: 'Urgent', color: 'bg-red-200 text-red-900', stringValue: 'Urgent' }
]

// BoardType mapping for priorityTask
const boardTypeOptions = [
  { value: 0, label: 'Todo', color: 'bg-blue-100 text-blue-800', stringValue: 'Todo' },
  { value: 1, label: 'InProgress ', color: 'bg-orange-100 text-orange-800', stringValue: 'InProgress' },
  { value: 2, label: 'Done ', color: 'bg-green-100 text-green-800', stringValue: 'Done' },
  { value: 3, label: 'Custom ', color: 'bg-purple-100 text-purple-800', stringValue: 'Custom' }
]

const typeOptions = [
  { value: IssueType.Bug, label: 'Bug', icon: Bug, color: 'bg-red-100 text-red-800', stringValue: 'Bug' },
  {
    value: IssueType.FeatureRequest,
    label: 'Feature Request',
    icon: Lightbulb,
    color: 'bg-green-100 text-green-800',
    stringValue: 'FeatureRequest'
  },
  {
    value: IssueType.Improvement,
    label: 'Improvement',
    icon: FileText,
    color: 'bg-blue-100 text-blue-800',
    stringValue: 'Improvement'
  },
  {
    value: IssueType.Task,
    label: 'Task',
    icon: MessageSquare,
    color: 'bg-purple-100 text-purple-800',
    stringValue: 'Task'
  },
  {
    value: IssueType.Documentation,
    label: 'Documentation',
    icon: AlertCircle,
    color: 'bg-purple-100 text-purple-800',
    stringValue: 'Documentation'
  },
  { value: IssueType.Other, label: 'Other', icon: Bug, color: 'bg-gray-100 text-gray-800', stringValue: 'Other' }
]

const statusOptions = [
  { value: 0, label: 'Open', color: 'bg-green-100 text-green-800', stringValue: 'Open' },
  { value: 10000, label: 'In Progress', color: 'bg-blue-100 text-blue-800', stringValue: 'InProgress' },
  { value: 20000, label: 'Resolved', color: 'bg-purple-100 text-purple-800', stringValue: 'Resolved' },
  { value: 30000, label: 'Closed', color: 'bg-gray-100 text-gray-800', stringValue: 'Closed' },
  { value: 40000, label: 'Reopened', color: 'bg-orange-100 text-orange-800', stringValue: 'Reopened' },
  { value: 50000, label: 'On Hold', color: 'bg-yellow-100 text-yellow-800', stringValue: 'OnHold' },
  { value: 60000, label: 'Cancelled', color: 'bg-red-100 text-red-800', stringValue: 'Cancelled' }
]

export const ProjectIssues: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>()
  const { currentProject } = useCurrentProject()
  const { getProjectIssues, getFilteredProjectIssues, isLoading } = useIssues()
  const [issues, setIssues] = useState<Issue[]>([])
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [filterType, setFilterType] = useState<string>('all')
  const [filterPriority, setFilterPriority] = useState<string>('all')
  const [search, setSearch] = useState('')
  const [isSidebarOpen, setIsSidebarOpen] = useState(true)
  const [openIndexes, setOpenIndexes] = useState<{ [key: string]: boolean }>({})

  // URL parameters handling
  const [searchParams] = useSearchParams()
  // const navigate = useNavigate()
  const issueIdFromUrl = searchParams.get('issue')

  const [selectedImage, setSelectedImage] = useState<{ url: string; fileName: string } | null>(null)
  const toggleOpen = (id: string) => {
    setOpenIndexes((prev) => ({ ...prev, [id]: !prev[id] }))
  }

  const toggleSidebar = () => setIsSidebarOpen((v) => !v)

  useEffect(() => {
    if (projectId) {
      loadIssues()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId])

  // Auto-expand issue when URL parameter is present
  useEffect(() => {
    if (issueIdFromUrl && issues.length > 0) {
      const issue = issues.find((i) => i.id === issueIdFromUrl)
      if (issue) {
        setOpenIndexes((prev) => ({ ...prev, [issueIdFromUrl]: true }))
        // Scroll to issue
        setTimeout(() => {
          const element = document.getElementById(`issue-${issueIdFromUrl}`)
          if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'center' })
          }
        }, 500)
      }
    }
  }, [issueIdFromUrl, issues])

  // Keyboard support for image modal
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && selectedImage) {
        setSelectedImage(null)
      }
    }

    if (selectedImage) {
      document.addEventListener('keydown', handleKeyDown)
      return () => document.removeEventListener('keydown', handleKeyDown)
    }
  }, [selectedImage])

  // Generate shareable link for issue
  const generateIssueLink = (issueId: string) => {
    const currentUrl = new URL(window.location.href)
    currentUrl.searchParams.set('issue', issueId)
    return currentUrl.toString()
  }

  // Copy issue link to clipboard
  const copyIssueLink = async (issueId: string) => {
    try {
      const link = generateIssueLink(issueId)
      await navigator.clipboard.writeText(link)
      // Show success message (you can add toast here)
      console.log('Issue link copied to clipboard:', link)
    } catch (error) {
      console.error('Failed to copy link:', error)
    }
  }

  const loadIssues = async (forceRefresh = false) => {
    if (!projectId) return
    try {
      const projectIssues = await getProjectIssues(projectId, forceRefresh)
      setIssues(projectIssues || [])
    } catch (error) {
      console.error('Error loading issues:', error)
    }
  }

  // Sửa lại hàm handleFilterChange để gọi API filter đúng với status, type, priority
  const handleFilterChange = async (status: string, type: string, priority: string) => {
    if (!projectId) return
    if ((status === 'all' || !status) && (type === 'all' || !type) && (priority === 'all' || !priority)) {
      loadIssues()
      return
    }
    try {
      const filteredIssues = await getFilteredProjectIssues(projectId, {
        status: status === 'all' ? undefined : status,
        type: type === 'all' ? undefined : type,
        priority: priority === 'all' ? undefined : priority
      })
      setIssues(filteredIssues || [])
    } catch (error) {
      console.error('Error filtering issues:', error)
    }
  }

  const handleStatusChange = (value: string) => {
    setFilterStatus(value)
    handleFilterChange(value, filterType, filterPriority)
  }
  const handleTypeChange = (value: string) => {
    setFilterType(value)
    handleFilterChange(filterStatus, value, filterPriority)
  }
  const handlePriorityChange = (value: string) => {
    setFilterPriority(value)
    handleFilterChange(filterStatus, filterType, value)
  }

  const getPriorityInfo = (priority: IssuePriority | string) => {
    // Handle both enum values and string values from API
    if (typeof priority === 'string') {
      return priorityOptions.find((p) => p.stringValue === priority) || priorityOptions[1] // Default to Medium
    }
    return priorityOptions.find((p) => p.value === priority) || priorityOptions[1]
  }

  const getTypeInfo = (type: IssueType | string) => {
    // Handle both enum values and string values from API
    if (typeof type === 'string') {
      return typeOptions.find((t) => t.stringValue === type) || typeOptions[5] // Default to Other
    }
    return typeOptions.find((t) => t.value === type) || typeOptions[5]
  }

  const getStatusInfo = (status: IssueStatus | string) => {
    // Handle both enum values and string values from API
    if (typeof status === 'string') {
      return statusOptions.find((s) => s.stringValue === status) || statusOptions[0] // Default to Open
    }
    return statusOptions.find((s) => s.value === status) || statusOptions[0]
  }

  const getBoardTypeInfo = (priorityTask: number) => {
    return boardTypeOptions.find((b) => b.value === priorityTask) || boardTypeOptions[0] // Default to Todo
  }

  if (!currentProject) {
    return (
      <div className='flex h-screen bg-gray-50'>
        <Sidebar isOpen={isSidebarOpen} onToggle={toggleSidebar} currentProject={currentProject} />
        <div className='flex-1 flex flex-col overflow-hidden'>
          <Navbar isSidebarOpen={isSidebarOpen} toggleSidebar={toggleSidebar} />
          <div className='flex-1 flex items-center justify-center'>
            <Card>
              <CardContent className='flex items-center justify-center h-64'>
                <div className='text-center'>
                  <AlertCircle className='h-12 w-12 text-gray-400 mx-auto mb-4' />
                  <h3 className='text-lg font-medium text-gray-900 mb-2'>No Project Selected</h3>
                  <p className='text-gray-500'>Please select a project to view issues.</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    )
  }

  // Thêm component con cho từng issue
  function IssueCard({ issue, isOpen, onToggle }: { issue: any; isOpen: boolean; onToggle: () => void }) {
    const priorityInfo = getPriorityInfo(issue.priority)
    const typeInfo = getTypeInfo(issue.type)
    const statusInfo = getStatusInfo(issue.status)
    const TypeIcon = typeInfo.icon
    const issueAny = issue as any
    return (
      <Card
        className={`w-full transition-all duration-200 hover:shadow-md ${isOpen ? 'ring-2 ring-lavender-400' : ''}`}
      >
        <CardContent className='p-6'>
          {/* Header */}
          <div className='flex items-center justify-between mb-4'>
            <div className='flex items-center gap-3'>
              <div className={`p-2 rounded-lg ${typeInfo.color}`}>
                <TypeIcon className='h-5 w-5' />
              </div>
              <div>
                <h3 className='text-lg font-semibold text-gray-900'>{issue.title}</h3>
                {issueAny.titleTask && (
                  <div className='flex items-center gap-2 mt-1'>
                    <GitBranch className='w-3 h-3 text-gray-500' />
                    <span className='text-sm text-gray-600'>Task: {issueAny.titleTask}</span>
                  </div>
                )}
              </div>
            </div>
            <div className='flex items-center gap-2'>
              {/* Share button */}
              <Button
                variant='ghost'
                size='icon'
                onClick={() => copyIssueLink(issue.id)}
                className='transition-all duration-200 hover:bg-blue-50 hover:text-blue-600'
                title='Copy issue link'
              >
                <Share2 className='w-4 h-4' />
              </Button>
              {/* External link button */}
              <Button
                variant='ghost'
                size='icon'
                onClick={() => window.open(generateIssueLink(issue.id), '_blank')}
                className='transition-all duration-200 hover:bg-green-50 hover:text-green-600'
                title='Open in new tab'
              >
                <ExternalLink className='w-4 h-4' />
              </Button>
              <Button variant='ghost' size='icon' onClick={onToggle} className='transition-transform duration-200'>
                {isOpen ? <ChevronUp className='w-5 h-5' /> : <ChevronDown className='w-5 h-5' />}
              </Button>
            </div>
          </div>

          {/* Description */}
          <p className='text-gray-600 mb-4'>{issueAny.shortDescription || issue.description}</p>

          {/* Meta information */}
          <div className='flex flex-wrap items-center gap-3 text-sm text-gray-500 mb-4'>
            {issueAny.avatarCreate && (
              <img
                src={issueAny.avatarCreate}
                alt='avatar'
                className='w-8 h-8 rounded-full border-2 border-lavender-400 shadow'
                title={issueAny.nameCreate}
              />
            )}
            <span className='font-medium text-gray-800'>{issueAny.nameCreate}</span>
            {issueAny.roleCreate && <span className='text-xs text-gray-500'>({issueAny.roleCreate})</span>}
            <span>• {issueAny.createdAt ? new Date(issueAny.createdAt).toLocaleDateString() : ''}</span>
          </div>

          {/* Priority, Type, and Status badges */}
          <div className='flex flex-wrap items-center gap-2 mb-4'>
            <Badge className={`${priorityInfo.color} font-medium`}>Priority: {priorityInfo.label}</Badge>
            <Badge className={`${typeInfo.color} font-medium flex items-center gap-1`}>
              <TypeIcon className='w-3 h-3' />
              {typeInfo.label}
            </Badge>
            <Badge className={`${statusInfo.color} font-medium`}>{statusInfo.label}</Badge>
          </div>

          {/* Task Information Section */}
          {(issueAny.titleTask || issueAny.priorityTask !== undefined) && (
            <div className='mb-4 p-4 bg-blue-50 rounded-lg border border-blue-200'>
              <h4 className='text-sm font-semibold text-blue-900 mb-2 flex items-center gap-2'>
                <GitBranch className='w-4 h-4' />
                Task Information
              </h4>
              <div className='grid grid-cols-1 md:grid-cols-2 gap-2 text-sm'>
                {issueAny.titleTask && (
                  <div className='flex items-center gap-2'>
                    <span className='text-blue-700 font-medium'>Task Name:</span>
                    <span className='text-blue-900'>{issueAny.titleTask}</span>
                  </div>
                )}
                {issueAny.priorityTask !== undefined && (
                  <div className='flex items-center gap-2'>
                    <span className='text-blue-700 font-medium'>Task Status:</span>
                    <Badge variant='outline' className={`text-xs ${getBoardTypeInfo(issueAny.priorityTask).color}`}>
                      {getBoardTypeInfo(issueAny.priorityTask).label}
                    </Badge>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Collapsible content */}
          <div
            className={`transition-all duration-300 ease-in-out ${
              isOpen ? 'max-h-[1000px] opacity-100' : 'max-h-0 opacity-0'
            } overflow-hidden`}
          >
            {isOpen && (
              <div className='space-y-4 pt-4 border-t border-gray-200'>
                {/* Code block */}
                {issueAny.code && (
                  <div className='rounded-lg overflow-hidden bg-gray-50 border border-gray-200 relative'>
                    <button
                      className='absolute top-2 right-2 text-xs bg-white hover:bg-gray-100 rounded px-2 py-1 shadow border'
                      onClick={() => navigator.clipboard.writeText(issueAny.code)}
                      title='Copy code'
                    >
                      Copy
                    </button>
                    <pre className='p-4 text-sm font-mono text-gray-800 whitespace-pre-wrap overflow-x-auto'>
                      <code>{issueAny.code}</code>
                    </pre>
                  </div>
                )}

                {/* Explanation */}
                {issue.explanation && (
                  <div>
                    <h4 className='font-semibold text-gray-900 mb-2'>Explanation</h4>
                    <p className='text-gray-700'>{issue.explanation}</p>
                  </div>
                )}

                {/* Example */}
                {issue.example && (
                  <div>
                    <h4 className='font-semibold text-gray-900 mb-2'>Example</h4>
                    <p className='text-gray-700'>{issue.example}</p>
                  </div>
                )}

                {/* File attachments */}
                {issueAny.issueAttachmentUrls && issueAny.issueAttachmentUrls.length > 0 && (
                  <div>
                    <h4 className='font-semibold text-gray-900 mb-3'>Attachments</h4>
                    <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'>
                      {issueAny.issueAttachmentUrls.map((url: string, idx: number) => {
                        const isImage = /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(url)
                        const isVideo = /\.(mp4|webm|ogg|mov)$/i.test(url)
                        const isAudio = /\.(mp3|wav|ogg|m4a)$/i.test(url)
                        const isPdf = /\.pdf$/i.test(url)
                        const fileName = url.split('/').pop() || `File ${idx + 1}`

                        return (
                          <div
                            key={idx}
                            className='border border-gray-200 rounded-lg overflow-hidden bg-white hover:shadow-md transition-shadow'
                          >
                            {isImage ? (
                              <div className='relative group'>
                                <img
                                  src={url}
                                  alt={fileName}
                                  className='w-full h-32 object-cover cursor-pointer hover:scale-105 transition-transform'
                                  onClick={() => setSelectedImage({ url, fileName })}
                                  title='Click to view full size'
                                />
                                <div className='absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all flex items-center justify-center'>
                                  <span className='text-white opacity-0 group-hover:opacity-100 text-xs font-medium'>
                                    Click to enlarge
                                  </span>
                                </div>
                              </div>
                            ) : isVideo ? (
                              <div className='relative'>
                                <video src={url} className='w-full h-32 object-cover' controls preload='metadata' />
                              </div>
                            ) : isAudio ? (
                              <div className='p-4'>
                                <audio src={url} controls className='w-full' preload='metadata' />
                              </div>
                            ) : isPdf ? (
                              <div className='p-4 text-center'>
                                <div className='w-16 h-16 mx-auto mb-2 bg-red-100 rounded-lg flex items-center justify-center'>
                                  <FileText className='w-8 h-8 text-red-600' />
                                </div>
                                <span className='text-xs text-gray-600 block truncate'>{fileName}</span>
                              </div>
                            ) : (
                              <div className='p-4 text-center'>
                                <div className='w-16 h-16 mx-auto mb-2 bg-gray-100 rounded-lg flex items-center justify-center'>
                                  <FileText className='w-8 h-8 text-gray-600' />
                                </div>
                                <span className='text-xs text-gray-600 block truncate'>{fileName}</span>
                              </div>
                            )}

                            <div className='p-3 bg-gray-50'>
                              <div className='flex items-center justify-between gap-2'>
                                <span className='text-xs text-gray-600 truncate flex-1' title={fileName}>
                                  {fileName}
                                </span>
                                <div className='flex gap-1'>
                                  <Button
                                    variant='ghost'
                                    size='sm'
                                    className='h-6 px-2 text-xs'
                                    onClick={() => window.open(url, '_blank')}
                                    title='Open in new tab'
                                  >
                                    <ExternalLink className='w-3 h-3' />
                                  </Button>
                                  <Button
                                    variant='ghost'
                                    size='sm'
                                    className='h-6 px-2 text-xs'
                                    onClick={() => navigator.clipboard.writeText(url)}
                                    title='Copy URL'
                                  >
                                    <Share2 className='w-3 h-3' />
                                  </Button>
                                </div>
                              </div>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}

                {/* Assignees */}
                {issueAny.taskAssignees && issueAny.taskAssignees.length > 0 && (
                  <div>
                    <h4 className='font-semibold text-gray-900 mb-2'>Assignees</h4>
                    <div className='flex flex-wrap gap-2'>
                      {issueAny.taskAssignees.map((assignee: any) => (
                        <div
                          key={assignee.projectMemberId}
                          className='flex items-center gap-2 bg-gray-100 rounded-full px-3 py-1 shadow-sm'
                        >
                          {assignee.avatar && (
                            <img
                              src={assignee.avatar}
                              alt='assignee'
                              className='w-6 h-6 rounded-full border border-gray-300'
                              title={assignee.executor}
                            />
                          )}
                          <span className='text-sm font-medium'>{assignee.executor}</span>
                          {assignee.role && <span className='text-xs text-gray-500'>({assignee.role})</span>}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className='flex h-screen bg-gray-50'>
      <Sidebar isOpen={isSidebarOpen} onToggle={toggleSidebar} currentProject={currentProject} />
      <div className='flex-1 flex flex-col overflow-hidden'>
        <Navbar isSidebarOpen={isSidebarOpen} toggleSidebar={toggleSidebar} />
        <div className='flex flex-col flex-1 overflow-y-auto'>
          {/* Header */}
          <div className='flex-none w-full p-6 pb-4'>
            <div className='flex items-center justify-between mb-6'>
              <div className='flex items-center gap-4'>
                <div className='p-2 bg-lavender-100 rounded-lg'>
                  <AlertCircle className='h-6 w-6 text-lavender-600' />
                </div>
                <div>
                  <h1 className='text-3xl font-bold text-gray-900'>Issues</h1>
                  <p className='text-sm text-gray-600'>Project: {currentProject?.title || ''}</p>
                </div>
                <div className='ml-2 text-sm font-medium text-gray-600 bg-gray-100 rounded-full px-3 py-1 border border-gray-200'>
                  {issues.length} {issues.length === 1 ? 'issue' : 'issues'}
                </div>
              </div>

              <div className='flex items-center gap-3'>
                <Button
                  variant='outline'
                  className='hover:bg-gray-50 border-gray-300 flex items-center gap-2'
                  onClick={() => loadIssues(true)}
                  disabled={isLoading}
                >
                  <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                  Refresh
                </Button>
              </div>
            </div>

            <div className='flex items-center gap-3 flex-wrap'>
              <Select value={filterStatus} onValueChange={handleStatusChange}>
                <SelectTrigger className='w-32 border-gray-300'>
                  <SelectValue placeholder='Status' />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='all'>All Statuses</SelectItem>
                  {statusOptions.map((s) => (
                    <SelectItem key={s.value} value={s.stringValue}>
                      {s.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={filterType} onValueChange={handleTypeChange}>
                <SelectTrigger className='w-32 border-gray-300'>
                  <SelectValue placeholder='Type' />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='all'>All Types</SelectItem>
                  {typeOptions.map((t) => (
                    <SelectItem key={t.value} value={t.stringValue} className='flex items-center gap-2'>
                      <t.icon className={`inline w-4 h-4 mr-1 ${t.color}`} />
                      {t.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={filterPriority} onValueChange={handlePriorityChange}>
                <SelectTrigger className='w-32 border-gray-300'>
                  <SelectValue placeholder='Priority' />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='all'>All Priorities</SelectItem>
                  {priorityOptions.map((p) => (
                    <SelectItem key={p.value} value={p.stringValue}>
                      {p.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value='today' onValueChange={() => {}}>
                <SelectTrigger className='w-32 border-gray-300'>
                  <SelectValue placeholder='Today' />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='today'>Today</SelectItem>
                  <SelectItem value='week'>This week</SelectItem>
                  <SelectItem value='month'>This month</SelectItem>
                </SelectContent>
              </Select>
              <div className='relative'>
                <Search className='absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 transform text-gray-400' />
                <Input
                  className='w-[300px] pl-10 border-gray-300'
                  placeholder='Search issues...'
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
            </div>
          </div>

          <div className='flex-1 flex flex-col gap-6 p-6 pt-0'>
            {isLoading ? (
              <div className='space-y-4'>
                {Array.from({ length: 3 }).map((_, i) => (
                  <Card key={i} className='w-full'>
                    <CardContent className='p-6'>
                      <div className='space-y-4'>
                        <div className='flex items-center justify-between'>
                          <div className='flex items-center gap-3'>
                            <Skeleton className='h-8 w-8 rounded-full' />
                            <div className='space-y-2'>
                              <Skeleton className='h-4 w-48' />
                              <Skeleton className='h-3 w-32' />
                            </div>
                          </div>
                          <Skeleton className='h-8 w-8 rounded' />
                        </div>
                        <Skeleton className='h-4 w-full' />
                        <Skeleton className='h-4 w-3/4' />
                        <div className='flex gap-2'>
                          <Skeleton className='h-6 w-16 rounded-full' />
                          <Skeleton className='h-6 w-20 rounded-full' />
                          <Skeleton className='h-6 w-14 rounded-full' />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : issues.length === 0 ? (
              <Card>
                <CardContent className='flex items-center justify-center h-64'>
                  <div className='text-center'>
                    <AlertCircle className='h-12 w-12 text-gray-400 mx-auto mb-4' />
                    <h3 className='text-lg font-medium text-gray-900 mb-2'>No Issues Found</h3>
                    <p className='text-gray-500 mb-4'>There are no issues reported for this project yet.</p>
                  </div>
                </CardContent>
              </Card>
            ) : (
              issues
                .filter((issue) => {
                  const q = search.toLowerCase()
                  return (
                    issue.title?.toLowerCase().includes(q) || (issue as any).titleTask?.toLowerCase().includes(q) || ''
                  )
                })
                .map((issue, idx) => {
                  const id = issue.id ?? String(idx)
                  const isOpen = openIndexes[id] ?? idx === 0
                  return <IssueCard key={id} issue={issue} isOpen={isOpen} onToggle={() => toggleOpen(id)} />
                })
            )}
          </div>
        </div>
      </div>

      {/* Image Modal */}
      {selectedImage && (
        <div
          className='fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-[10003] p-4'
          onClick={() => setSelectedImage(null)}
        >
          <div className='relative max-w-4xl max-h-full' onClick={(e) => e.stopPropagation()}>
            <div className='bg-white rounded-lg shadow-2xl overflow-hidden'>
              <div className='flex items-center justify-between p-4 border-b border-gray-200'>
                <h3 className='text-lg font-semibold text-gray-900 truncate'>{selectedImage.fileName}</h3>
                <div className='flex gap-2'>
                  <Button
                    variant='outline'
                    size='sm'
                    onClick={() => window.open(selectedImage.url, '_blank')}
                    className='flex items-center gap-2'
                  >
                    <ExternalLink className='w-4 h-4' />
                    Open in new tab
                  </Button>
                  <Button
                    variant='outline'
                    size='sm'
                    onClick={() => navigator.clipboard.writeText(selectedImage.url)}
                    className='flex items-center gap-2'
                  >
                    <Share2 className='w-4 h-4' />
                    Copy URL
                  </Button>
                  <Button
                    variant='ghost'
                    size='sm'
                    onClick={() => setSelectedImage(null)}
                    className='text-gray-500 hover:text-gray-700'
                  >
                    ✕
                  </Button>
                </div>
              </div>
              <div className='p-4'>
                <img
                  src={selectedImage.url}
                  alt={selectedImage.fileName}
                  className='max-w-full max-h-[70vh] object-contain mx-auto'
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
