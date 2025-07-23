import { Navbar } from '@/components/Navbar'
import { Sidebar } from '@/components/Sidebar'
import { IssueCreateMenu } from '@/components/tasks/IssueCreateMenu'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { useCurrentProject } from '@/hooks/useCurrentProject'
import { useIssues } from '@/hooks/useIssues'
import { Issue, IssuePriority, IssueStatus, IssueType } from '@/types/issue'
import { AlertCircle, Bug, ChevronDown, ChevronUp, FileText, Lightbulb, MessageSquare, Plus } from 'lucide-react'
import React, { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'

const priorityOptions = [
  { value: IssuePriority.Low, label: 'Low', color: 'bg-blue-100 text-blue-800' },
  { value: IssuePriority.Medium, label: 'Medium', color: 'bg-orange-100 text-orange-800' },
  { value: IssuePriority.High, label: 'High', color: 'bg-red-100 text-red-800' },
  { value: IssuePriority.Urgent, label: 'Urgent', color: 'bg-red-200 text-red-900' }
]

const typeOptions = [
  { value: IssueType.Bug, label: 'Bug', icon: Bug, color: 'bg-red-100 text-red-800' },
  { value: IssueType.FeatureRequest, label: 'Feature Request', icon: Plus, color: 'bg-green-100 text-green-800' },
  { value: IssueType.Improvement, label: 'Improvement', icon: Lightbulb, color: 'bg-blue-100 text-blue-800' },
  { value: IssueType.Task, label: 'Task', icon: MessageSquare, color: 'bg-purple-100 text-purple-800' },
  { value: IssueType.Documentation, label: 'Documentation', icon: FileText, color: 'bg-purple-100 text-purple-800' },
  { value: IssueType.Other, label: 'Other', icon: AlertCircle, color: 'bg-gray-100 text-gray-800' }
]

const statusOptions = [
  { value: IssueStatus.Open, label: 'Open', color: 'bg-green-100 text-green-800' },
  { value: IssueStatus.InProgress, label: 'In Progress', color: 'bg-blue-100 text-blue-800' },
  { value: IssueStatus.Resolved, label: 'Resolved', color: 'bg-purple-100 text-purple-800' },
  { value: IssueStatus.Closed, label: 'Closed', color: 'bg-gray-100 text-gray-800' },
  { value: IssueStatus.Reopened, label: 'Reopened', color: 'bg-orange-100 text-orange-800' },
  { value: IssueStatus.OnHold, label: 'On Hold', color: 'bg-yellow-100 text-yellow-800' },
  { value: IssueStatus.Cancelled, label: 'Cancelled', color: 'bg-red-100 text-red-800' }
]

export const ProjectIssues: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>()
  const { currentProject } = useCurrentProject()
  const { getProjectIssues, getFilteredProjectIssues, isLoading } = useIssues()
  const [issues, setIssues] = useState<Issue[]>([])
  const [selectedTaskId, setSelectedTaskId] = useState<string>('')
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [filterType, setFilterType] = useState<string>('all')
  const [filterPriority, setFilterPriority] = useState<string>('all')
  const [search, setSearch] = useState('')
  const [isSidebarOpen, setIsSidebarOpen] = useState(true)
  const [openIndexes, setOpenIndexes] = useState<{ [key: string]: boolean }>({})
  const [showCreateMenu, setShowCreateMenu] = useState(false)
  const toggleOpen = (id: string) => {
    setOpenIndexes(prev => ({ ...prev, [id]: !prev[id] }))
  }

  const toggleSidebar = () => setIsSidebarOpen((v) => !v)

  useEffect(() => {
    if (projectId) {
      loadIssues()
    }
  }, [projectId])

  const loadIssues = async () => {
    if (!projectId) return
    try {
      const projectIssues = await getProjectIssues(projectId)
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

  const getPriorityInfo = (priority: IssuePriority) => {
    return priorityOptions.find((p) => p.value === priority) || priorityOptions[0]
  }

  const getTypeInfo = (type: IssueType) => {
    return typeOptions.find((t) => t.value === type) || typeOptions[5]
  }

  const getStatusInfo = (status: IssueStatus) => {
    return statusOptions.find((s) => s.value === status) || statusOptions[0]
  }

  const handleIssueCreated = () => {
    loadIssues()
  }

  if (!currentProject) {
    return (
      <div className='flex items-center justify-center h-64'>
        <div className='text-center'>
          <AlertCircle className='h-12 w-12 text-gray-400 mx-auto mb-4' />
          <h3 className='text-lg font-medium text-gray-900 mb-2'>No Project Selected</h3>
          <p className='text-gray-500'>Please select a project to view issues.</p>
        </div>
      </div>
    )
  }

  // Thêm component con cho từng issue
  function IssueCard({ issue, idx, isOpen, onToggle }: { issue: any, idx: number, isOpen: boolean, onToggle: () => void }) {
    const priorityInfo = getPriorityInfo(issue.priority)
    const typeInfo = getTypeInfo(issue.type)
    const statusInfo = getStatusInfo(issue.status)
    const TypeIcon = typeInfo.icon
    const issueAny = issue as any
    return (
      <div className='rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden'>
        {/* File name */}
        <div className='flex items-center gap-2 px-6 pt-6'>
          <span className='text-base font-semibold text-indigo-700'>{issueAny.fileName || 'Unknown file'}</span>
          <Separator className='flex-1 mx-2' />
          <Button variant='ghost' size='icon' onClick={onToggle}>
            {isOpen ? <ChevronUp className='w-5 h-5' /> : <ChevronDown className='w-5 h-5' />}
          </Button>
        </div>
        {/* Title */}
        <div className='px-6 pt-2 pb-1'>
          <h2 className='text-xl font-bold text-gray-900'>{issue.title || issueAny.titleTask}</h2>
          <p className='text-gray-600 mt-1'>{issueAny.shortDescription || issue.description}</p>
        </div>
        {/* Người tạo, tag, thời gian, ... */}
        <div className='flex items-center gap-3 px-6 pb-2 text-sm text-gray-500'>
          {issueAny.avatarCreate && (
            <img src={issueAny.avatarCreate} alt='avatar' className='w-7 h-7 rounded-full border' />
          )}
          <span className='font-medium text-gray-800'>{issueAny.nameCreate}</span>
          {issueAny.roleCreate && <span className='text-xs text-gray-500'>({issueAny.roleCreate})</span>}
          <span>• {issueAny.createdAt ? new Date(issueAny.createdAt).toLocaleDateString() : ''}</span>
          {issueAny.reportedBy && <span className='bg-gray-100 rounded px-2 py-0.5 ml-2'>Reported by {issueAny.reportedBy}</span>}
          {issueAny.timeToFix && <span className='bg-gray-100 rounded px-2 py-0.5'>Time to fix: {issueAny.timeToFix}</span>}
          <Badge className={priorityInfo.color}>{priorityInfo.label || issueAny.priorityTask}</Badge>
          <Badge className={typeInfo.color}>{typeInfo.label || issueAny.type}</Badge>
          <Badge className={statusInfo.color}>{statusInfo.label || issueAny.status}</Badge>
        </div>
        {/* Collapse content */}
        {isOpen && (
          <div className='px-6 pb-6'>
            {/* Code block */}
            {issueAny.code && (
              <div className='my-4 rounded-lg overflow-x-auto bg-gray-100 border border-gray-200'>
                <pre className='p-4 text-sm'><code>{issueAny.code}</code></pre>
              </div>
            )}
            {/* Explanation */}
            {issue.explanation && (
              <div className='mb-2'>
                <h4 className='font-semibold text-gray-900 mb-1'>Explanation</h4>
                <p className='text-gray-700'>{issue.explanation}</p>
              </div>
            )}
            {/* Example */}
            {issue.example && (
              <div className='mb-2'>
                <h4 className='font-semibold text-gray-900 mb-1'>Example</h4>
                <p className='text-gray-700'>{issue.example}</p>
              </div>
            )}
            {/* File đính kèm */}
            {issueAny.issueAttachmentUrls && issueAny.issueAttachmentUrls.length > 0 && (
              <div className='mb-2'>
                <h4 className='font-semibold text-gray-900 mb-1'>Attachments</h4>
                <ul className='list-disc list-inside'>
                  {issueAny.issueAttachmentUrls.map((url: string, idx: number) => (
                    <li key={idx}>
                      <a href={url} target='_blank' rel='noopener noreferrer' className='text-blue-600 underline'>
                        {url}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {/* Danh sách assignees */}
            {issueAny.taskAssignees && issueAny.taskAssignees.length > 0 && (
              <div className='mb-2'>
                <h4 className='font-semibold text-gray-900 mb-1'>Assignees</h4>
                <div className='flex flex-wrap gap-2'>
                  {issueAny.taskAssignees.map((assignee: any) => (
                    <span key={assignee.projectMemberId} className='flex items-center gap-1 bg-gray-100 rounded px-2 py-1'>
                      {assignee.avatar && (
                        <img src={assignee.avatar} alt='assignee' className='w-6 h-6 rounded-full border' />
                      )}
                      <span className='text-xs'>{assignee.executor}</span>
                      {assignee.role && <span className='text-xs text-gray-400'>({assignee.role})</span>}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className='flex h-screen bg-gradient-to-br from-slate-50 via-white to-lavender-50'>
      <Sidebar isOpen={isSidebarOpen} onToggle={toggleSidebar} currentProject={currentProject} />
      <div className='flex-1 flex flex-col overflow-hidden'>
        <Navbar isSidebarOpen={isSidebarOpen} toggleSidebar={toggleSidebar} />
        <div className='flex flex-col flex-1 overflow-y-auto bg-white/90'>
          {/* Header */}
          <div className='flex flex-col gap-4 px-8 pt-8 pb-4 border-b border-gray-200 bg-white/80 sticky top-0 z-10'>
            <div className='flex items-center justify-between'>
              <h1 className='text-4xl font-extrabold text-gray-900 mb-2'>Code Issues</h1>
              <Button
                className='bg-lavender-600 hover:bg-lavender-700 text-white font-semibold rounded-lg px-5 py-2 text-base shadow'
                onClick={() => setShowCreateMenu(true)}
              >
                + New Issue
              </Button>
            </div>
            <div className='flex flex-wrap gap-3 items-center'>
              <Select value={filterStatus} onValueChange={handleStatusChange}>
                <SelectTrigger className='w-32'>
                  <SelectValue placeholder='Status' />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='all'>All Statuses</SelectItem>
                  {statusOptions.map((s) => (
                    <SelectItem key={s.value} value={s.value.toString()}>{s.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={filterType} onValueChange={handleTypeChange}>
                <SelectTrigger className='w-32'>
                  <SelectValue placeholder='Type' />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='all'>All Types</SelectItem>
                  {typeOptions.map((t) => (
                    <SelectItem key={t.value} value={t.value.toString()}>{t.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={filterPriority} onValueChange={handlePriorityChange}>
                <SelectTrigger className='w-32'>
                  <SelectValue placeholder='Priority' />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='all'>All Priorities</SelectItem>
                  {priorityOptions.map((p) => (
                    <SelectItem key={p.value} value={p.value.toString()}>{p.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value='today' onValueChange={() => {}}>
                <SelectTrigger className='w-32'>
                  <SelectValue placeholder='Today' />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='today'>Today</SelectItem>
                  <SelectItem value='week'>This week</SelectItem>
                  <SelectItem value='month'>This month</SelectItem>
                </SelectContent>
              </Select>
              <Input
                className='w-64 h-10 rounded-md border border-gray-300 px-3 text-base'
                placeholder='Search For Issue'
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
          </div>
          {showCreateMenu && currentProject && (
            <IssueCreateMenu
              projectId={currentProject.id}
              taskId={selectedTaskId || 'demo-task-id'}
              onIssueCreated={() => {
                setShowCreateMenu(false)
                loadIssues()
              }}
            />
          )}
          <div className='flex-1 flex flex-col gap-6 p-8'>
            {isLoading ? (
              <div className='flex items-center justify-center h-64'>
                <div className='text-center'>
                  <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-4'></div>
                  <p className='text-gray-500'>Loading issues...</p>
                </div>
              </div>
            ) : issues.length === 0 ? (
              <Card>
                <CardContent className='flex items-center justify-center h-64'>
                  <div className='text-center'>
                    <AlertCircle className='h-12 w-12 text-gray-400 mx-auto mb-4' />
                    <h3 className='text-lg font-medium text-gray-900 mb-2'>No Issues Found</h3>
                    <p className='text-gray-500 mb-4'>There are no issues reported for this project yet.</p>
                    {currentProject && (
                      <IssueCreateMenu
                        projectId={currentProject.id}
                        taskId={selectedTaskId || 'demo-task-id'}
                        onIssueCreated={handleIssueCreated}
                      />
                    )}
                  </div>
                </CardContent>
              </Card>
            ) : (
              issues
                .filter(issue => {
                  const q = search.toLowerCase()
                  return (
                    (issue.title?.toLowerCase().includes(q) || (issue as any).titleTask?.toLowerCase().includes(q) || '')
                  )
                })
                .map((issue, idx) => {
                  const id = issue.id ?? String(idx)
                  const isOpen = openIndexes[id] ?? idx === 0
                  return (
                    <IssueCard
                      key={id}
                      issue={issue}
                      idx={idx}
                      isOpen={isOpen}
                      onToggle={() => toggleOpen(id)}
                    />
                  )
                })
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
