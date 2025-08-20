import { getProjectPartCommitDetail, getProjectPartCommitsV2 } from '@/api/webhooks'
import { Navbar } from '@/components/Navbar'
import { Sidebar } from '@/components/Sidebar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Loader } from '@/components/ui/loader'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useCurrentProject } from '@/hooks/useCurrentProject'
import { useProjectParts } from '@/hooks/useProjectParts'
import { CommitDetail, CommitListItem, ProjectPart } from '@/types/commits'
import { format } from 'date-fns'
import {
  AlertTriangle,
  Calendar,
  ChevronDown,
  Clock,
  FileText,
  Filter,
  GitBranch,
  GitCommit,
  Info,
  RefreshCw,
  Search,
  User
} from 'lucide-react'
import { useCallback, useEffect, useRef, useState } from 'react'

// IssueCard Component
interface IssueCardProps {
  item: CommitDetail
}

function IssueCard({ item }: IssueCardProps) {
  const getSeverityColor = (severity: string) => {
    switch (severity.toUpperCase()) {
      case 'BLOCKER':
        return 'bg-red-50 text-red-800 border-red-200 border-l-red-500'
      case 'CRITICAL':
        return 'bg-orange-50 text-orange-800 border-orange-200 border-l-orange-500'
      case 'MAJOR':
        return 'bg-yellow-50 text-yellow-800 border-yellow-200 border-l-yellow-500'
      case 'MINOR':
        return 'bg-blue-50 text-blue-800 border-blue-200 border-l-blue-500'
      case 'INFO':
        return 'bg-gray-50 text-gray-800 border-gray-200 border-l-gray-500'
      default:
        return 'bg-gray-50 text-gray-800 border-gray-200 border-l-gray-500'
    }
  }

  const getSeverityBadgeColor = (severity: string) => {
    switch (severity.toUpperCase()) {
      case 'BLOCKER':
        return 'bg-red-500 text-white border-0'
      case 'CRITICAL':
        return 'bg-orange-500 text-white border-0'
      case 'MAJOR':
        return 'bg-yellow-500 text-white border-0'
      case 'MINOR':
        return 'bg-blue-500 text-white border-0'
      case 'INFO':
        return 'bg-gray-500 text-white border-0'
      default:
        return 'bg-gray-500 text-white border-0'
    }
  }

  const getSeverityIcon = (severity: string) => {
    switch (severity.toUpperCase()) {
      case 'BLOCKER':
      case 'CRITICAL':
        return <AlertTriangle className='h-4 w-4' />
      case 'MAJOR':
        return <Info className='h-4 w-4' />
      default:
        return <Info className='h-4 w-4' />
    }
  }

  return (
    <Card className={`border-l-4 hover:shadow-md transition-all ${getSeverityColor(item.severity)}`}>
      <CardContent className='p-6'>
        <div className='flex items-start justify-between gap-4'>
          <div className='flex-1 space-y-4'>
            {/* Header */}
            <div className='flex items-center gap-3'>
              <Badge className={`${getSeverityBadgeColor(item.severity)} px-3 py-1 font-semibold`}>
                {getSeverityIcon(item.severity)}
                <span className='ml-1'>{item.severity}</span>
              </Badge>
              <span className='text-sm font-mono text-gray-600 bg-gray-100 px-2 py-1 rounded'>{item.rule}</span>
            </div>

            {/* Message */}
            <p className='text-gray-900 font-semibold text-lg'>{item.message}</p>

            {/* File Info */}
            <div className='flex items-center gap-4 text-sm text-gray-700'>
              <div className='flex items-center gap-2 bg-gray-50 px-3 py-2 rounded'>
                <FileText className='h-4 w-4 text-lavender-500' />
                <span className='font-mono font-medium'>{item.filePath}</span>
              </div>
              <div className='flex items-center gap-2 bg-gray-50 px-3 py-2 rounded'>
                <span>Line:</span>
                <span className='font-mono bg-lavender-600 text-white px-2 py-0.5 rounded font-bold'>{item.line}</span>
              </div>
            </div>

            {/* Line Content */}
            {item.lineContent && (
              <div className='bg-gray-50 p-4 rounded-lg border-l-4 border-lavender-400'>
                <div className='text-xs text-lavender-600 mb-2 font-semibold'>Code at line {item.line}:</div>
                <pre className='text-sm font-mono text-gray-800 whitespace-pre-wrap bg-white p-2 rounded'>
                  {item.lineContent}
                </pre>
              </div>
            )}

            {/* Blame Info */}
            {(item.blamedGitName || item.blamedGitEmail) && (
              <div className='flex items-center gap-2 text-sm text-gray-700 bg-gray-50 px-3 py-2 rounded w-fit'>
                <User className='h-4 w-4 text-green-500' />
                <span className='font-semibold'>Blamed: {item.blamedGitName || 'Unknown'}</span>
                {item.blamedGitEmail && <span className='text-gray-500'>({item.blamedGitEmail})</span>}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export default function GitCommits() {
  console.log('[GitCommits] Component rendered')

  const [isSidebarOpen, setIsSidebarOpen] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const { currentProject, isLoading } = useCurrentProject()
  const projectPartsHook = useProjectParts()

  console.log('[GitCommits] currentProject:', currentProject?.id)
  console.log('[GitCommits] isLoading:', isLoading)

  const fetchPartsRef = useRef(projectPartsHook.fetchParts)
  fetchPartsRef.current = projectPartsHook.fetchParts

  console.log('[GitCommits] fetchPartsRef updated')

  const [parts, setParts] = useState<ProjectPart[]>([])
  const [selectedPartId, setSelectedPartId] = useState<string>('')
  const [commits, setCommits] = useState<CommitListItem[]>([])
  const [loadingCommits, setLoadingCommits] = useState(false)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [showDetail, setShowDetail] = useState(false)
  const [commitDetail, setCommitDetail] = useState<CommitDetail[] | null>(null)
  const [loadingDetail, setLoadingDetail] = useState(false)
  const [selectedCommit, setSelectedCommit] = useState<CommitListItem | null>(null)
  const [autoRefresh, setAutoRefresh] = useState(true)
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date())

  // Debug state changes
  useEffect(() => {
    console.log('[GitCommits] State changed - parts:', parts.length, 'selectedPartId:', selectedPartId)
  }, [parts, selectedPartId])

  useEffect(() => {
    console.log('[GitCommits] State changed - commits:', commits.length, 'page:', page, 'totalPages:', totalPages)
  }, [commits, page, totalPages])

  const fetchCommits = useCallback(async () => {
    if (!currentProject?.id || !selectedPartId) return

    console.log('[GitCommits] Fetching commits for part:', selectedPartId, 'page:', page)
    setLoadingCommits(true)
    try {
      const res = await getProjectPartCommitsV2(currentProject.id, selectedPartId, page)
      console.log('[GitCommits] Commits fetched successfully:', res.data?.items?.length || 0, 'commits')
      setCommits(res.data?.items || [])
      setTotalPages(res.data?.totalPages || 1)
    } catch (error) {
      console.error('Error fetching commits:', error)
      setCommits([])
      setTotalPages(1)
    } finally {
      setLoadingCommits(false)
    }
  }, [currentProject?.id, selectedPartId, page])

  // Memoize fetchParts to prevent infinite loop
  const memoizedFetchParts = useCallback(async (projectId: string) => {
    console.log('[GitCommits] memoizedFetchParts called with projectId:', projectId)
    try {
      console.log('[GitCommits] Fetching parts for project:', projectId)
      const res = await fetchPartsRef.current(projectId)
      console.log('[GitCommits] Parts fetched successfully:', res.data?.length || 0, 'parts')
      setParts(res.data || [])
      if (res.data && res.data.length > 0) {
        console.log('[GitCommits] Setting selectedPartId to:', res.data[0].id)
        setSelectedPartId(res.data[0].id)
      }
    } catch (error) {
      console.error('Error fetching parts:', error)
      setParts([])
    }
  }, [])

  useEffect(() => {
    console.log('[GitCommits] useEffect triggered - currentProject?.id:', currentProject?.id)
    if (currentProject?.id) {
      console.log('[GitCommits] Calling memoizedFetchParts')
      memoizedFetchParts(currentProject.id)
    }
  }, [currentProject?.id, memoizedFetchParts])

  // Auto-refresh commits every 30 seconds
  useEffect(() => {
    if (!autoRefresh || !currentProject?.id || !selectedPartId) return

    const interval = setInterval(() => {
      console.log('[GitCommits] Auto-refreshing commits...')
      fetchCommits()
      setLastRefresh(new Date())
    }, 30000)

    return () => clearInterval(interval)
  }, [autoRefresh, currentProject?.id, selectedPartId, fetchCommits])

  useEffect(() => {
    console.log(
      '[GitCommits] Commits useEffect triggered - currentProject?.id:',
      currentProject?.id,
      'selectedPartId:',
      selectedPartId,
      'page:',
      page
    )
    if (currentProject?.id && selectedPartId) {
      fetchCommits()
    }
  }, [currentProject?.id, selectedPartId, page, fetchCommits])

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen)
  }

  const filteredCommits = commits.filter(
    (commit) =>
      commit.commitMessage?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      commit.pusher?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const handleShowDetail = async (commit: CommitListItem) => {
    if (!currentProject || !selectedPartId) return
    setSelectedCommit(commit)
    setShowDetail(true)
    setLoadingDetail(true)
    try {
      const res = await getProjectPartCommitDetail(currentProject.id, selectedPartId, commit.commitId)
      setCommitDetail(res.data)
    } catch (err) {
      console.error('Error fetching commit detail:', err)
      setCommitDetail(null)
    } finally {
      setLoadingDetail(false)
    }
  }

  const handleManualRefresh = () => {
    fetchCommits()
    setLastRefresh(new Date())
  }

  if (isLoading || !currentProject) {
    return (
      <div className='flex h-screen bg-gray-50'>
        <Sidebar isOpen={isSidebarOpen} onToggle={toggleSidebar} currentProject={currentProject} />
        <div className='flex-1 flex flex-col overflow-hidden'>
          <Navbar isSidebarOpen={isSidebarOpen} toggleSidebar={toggleSidebar} />
          <Loader />
        </div>
      </div>
    )
  }

  return (
    <div className='flex h-screen bg-gray-50'>
      <Sidebar isOpen={isSidebarOpen} onToggle={toggleSidebar} currentProject={currentProject} />
      <div className='flex-1 flex flex-col overflow-hidden'>
        <Navbar isSidebarOpen={isSidebarOpen} toggleSidebar={toggleSidebar} />
        <div className='flex flex-col h-full p-6'>
          <div className='flex-none w-full flex items-center justify-between pb-6'>
            <div className='flex items-center gap-4'>
              <div className='flex items-center gap-2'>
                <div className='p-2 bg-lavender-100 rounded-lg'>
                  <GitCommit className='h-6 w-6 text-lavender-600' />
                </div>
                <div>
                  <h1 className='text-3xl font-bold text-gray-900'>Code Quality by Commit</h1>
                  <p className='text-sm text-gray-600'>Project: {currentProject?.title || ''}</p>
                </div>
              </div>
              <div className='flex items-center gap-3 ml-4'>
                <GitBranch className='h-4 w-4 text-lavender-500' />
                <Select value={selectedPartId} onValueChange={setSelectedPartId}>
                  <SelectTrigger className='w-[220px] bg-white border-gray-300'>
                    <SelectValue placeholder='Select part' />
                  </SelectTrigger>
                  <SelectContent className='bg-white'>
                    {parts.map((part) => (
                      <SelectItem key={part.id} value={part.id} className='hover:bg-gray-50'>
                        <div className='flex items-center justify-between w-full'>
                          <div className='flex items-center gap-2'>
                            <span className='font-medium text-gray-900'>{part.name}</span>
                          </div>
                          <div className='flex items-center gap-2 text-xs'>
                            {part.programmingLanguage !== 'None' && (
                              <div className='flex items-center gap-1 bg-blue-50 px-2 py-1 rounded'>
                                <span className='text-blue-700 font-medium'>{part.programmingLanguage}</span>
                              </div>
                            )}
                            {part.framework && part.framework !== 'None' && (
                              <div className='flex items-center gap-1 bg-purple-50 px-2 py-1 rounded'>
                                <span className='text-purple-700 font-medium'>{part.framework}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className='flex items-center gap-4'>
              <div className='flex items-center gap-2'>
                <input
                  type='checkbox'
                  id='autoRefresh'
                  checked={autoRefresh}
                  onChange={(e) => setAutoRefresh(e.target.checked)}
                  className='rounded border-gray-300 text-lavender-600 focus:ring-lavender-500'
                />
                <label htmlFor='autoRefresh' className='text-sm font-medium text-gray-700'>
                  Auto-refresh (30s)
                </label>
              </div>

              <div className='flex items-center gap-2 text-sm text-gray-600'>
                <Clock className='h-4 w-4' />
                <span className='font-medium'>
                  Last updated: <span className='font-mono'>{format(lastRefresh, 'HH:mm:ss')}</span>
                </span>
              </div>

              <Button
                variant='outline'
                size='sm'
                onClick={handleManualRefresh}
                disabled={loadingCommits}
                className='flex items-center gap-2 border-gray-300'
              >
                <RefreshCw className={`h-4 w-4 ${loadingCommits ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>
          </div>

          <div className='pb-6 flex items-center justify-between'>
            <div className='flex items-center gap-4'>
              <Button variant='outline' className='bg-white hover:bg-gray-50 border-gray-300'>
                <Filter className='mr-2 h-4 w-4' />
                <span className='font-medium'>Filter</span>
                <ChevronDown className='ml-2 h-4 w-4' />
              </Button>
              <div className='relative'>
                <Search className='absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 transform text-gray-400' />
                <Input
                  placeholder='Search commits...'
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className='w-[280px] pl-10 bg-white border-gray-300'
                />
              </div>
            </div>
            <div className='flex gap-2'>
              <Button variant='outline' className='bg-white hover:bg-gray-50 border-gray-300'>
                <Calendar className='mr-2 h-4 w-4' />
                <span className='font-medium'>Time Range</span>
              </Button>
            </div>
          </div>

          <div className='space-y-4 overflow-y-auto'>
            {loadingCommits ? (
              <Loader />
            ) : filteredCommits.length > 0 ? (
              filteredCommits.map((commit) => (
                <div
                  key={commit.commitId}
                  className='bg-white rounded-lg p-6 shadow-sm border border-gray-200 hover:shadow-md transition-shadow'
                >
                  <div className='flex flex-col gap-4'>
                    <div className='flex items-center gap-3'>
                      <div className='bg-lavender-100 p-2 rounded-full'>
                        <User className='h-4 w-4 text-lavender-600' />
                      </div>
                      <span className='font-semibold text-gray-900'>{commit.pusher}</span>
                      <span className='text-gray-600'>committed</span>
                      <span className='text-sm text-gray-500'>
                        {commit.pushedAt ? format(new Date(commit.pushedAt), 'MMM d, yyyy') : ''}
                      </span>
                    </div>
                    <div className='text-gray-900 font-medium text-lg'>{commit.commitMessage}</div>
                    <div className='flex flex-wrap gap-2 text-sm'>
                      <Badge className='bg-blue-100 text-blue-700 border-0'>Status: {commit.status}</Badge>
                      <Badge className='bg-green-100 text-green-700 border-0'>
                        Quality: {commit.qualityGateStatus}
                      </Badge>
                      <Badge className='bg-yellow-100 text-yellow-700 border-0'>Bugs: {commit.bugs}</Badge>
                      <Badge className='bg-red-100 text-red-700 border-0'>Vuln: {commit.vulnerabilities}</Badge>
                      <Badge className='bg-gray-100 text-gray-700 border-0'>Code Smells: {commit.codeSmells}</Badge>
                      <Badge className='bg-purple-100 text-purple-700 border-0'>
                        Dup Lines: {commit.duplicatedLines}
                      </Badge>
                      <Badge className='bg-cyan-100 text-cyan-700 border-0'>Coverage: {commit.coverage}%</Badge>
                    </div>
                    <div className='text-sm text-gray-600 italic'>Result: {commit.resultSummary}</div>
                    {/* View Detail Button */}
                    <div className='mt-2'>
                      <Button
                        size='sm'
                        onClick={() => handleShowDetail(commit)}
                        className='bg-lavender-600 hover:bg-lavender-700 text-white'
                      >
                        View Detail
                      </Button>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className='text-center py-12 bg-white rounded-lg'>
                <FileText className='h-16 w-16 mx-auto mb-4 text-gray-300' />
                <p className='text-gray-500 text-lg'>No commits found</p>
              </div>
            )}
          </div>

          <div className='flex justify-center mt-6 gap-2'>
            {Array.from({ length: totalPages }, (_, i) => (
              <Button
                key={i}
                variant={i + 1 === page ? 'default' : 'outline'}
                size='sm'
                onClick={() => setPage(i + 1)}
                className={
                  i + 1 === page
                    ? 'bg-lavender-600 hover:bg-lavender-700 text-white'
                    : 'bg-white hover:bg-gray-50 border-gray-300'
                }
              >
                {i + 1}
              </Button>
            ))}
          </div>
        </div>
      </div>

      <Dialog open={showDetail} onOpenChange={setShowDetail}>
        <DialogContent className='max-w-6xl max-h-[80vh] bg-white'>
          <DialogHeader>
            <DialogTitle className='flex items-center gap-3'>
              <div className='bg-lavender-100 p-2 rounded-full'>
                <GitCommit className='h-5 w-5 text-lavender-600' />
              </div>
              <span className='text-xl font-bold text-gray-900'>Commit Detail</span>
              {selectedCommit && (
                <span className='text-sm font-normal text-gray-600 ml-2'>
                  {selectedCommit.commitMessage.substring(0, 50)}...
                </span>
              )}
            </DialogTitle>
          </DialogHeader>

          {loadingDetail ? (
            <div className='flex items-center justify-center py-12'>
              <Loader />
              <span className='ml-2 font-medium text-gray-700'>Loading commit details...</span>
            </div>
          ) : commitDetail && commitDetail.length > 0 ? (
            <div className='space-y-6'>
              {/* Commit Summary */}
              {selectedCommit && (
                <Card className='bg-gray-50 border-gray-200'>
                  <CardHeader className='pb-3'>
                    <CardTitle className='text-xl font-bold text-gray-900'>Commit Summary</CardTitle>
                  </CardHeader>
                  <CardContent className='pt-0'>
                    <div className='grid grid-cols-2 md:grid-cols-4 gap-4 text-sm'>
                      <div className='flex items-center gap-2'>
                        <User className='h-4 w-4 text-lavender-500' />
                        <span className='font-semibold text-gray-800'>{selectedCommit.pusher}</span>
                      </div>
                      <div className='flex items-center gap-2'>
                        <Clock className='h-4 w-4 text-blue-500' />
                        <span className='font-medium text-gray-700'>
                          {format(new Date(selectedCommit.pushedAt), 'MMM d, yyyy HH:mm')}
                        </span>
                      </div>
                      <div className='flex items-center gap-2'>
                        <span className='font-medium text-gray-700'>Status:</span>
                        <Badge className='bg-blue-100 text-blue-700 border-0'>{selectedCommit.status}</Badge>
                      </div>
                      <div className='flex items-center gap-2'>
                        <span className='font-medium text-gray-700'>Quality:</span>
                        <Badge className='bg-green-100 text-green-700 border-0'>
                          {selectedCommit.qualityGateStatus}
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Issues List with Tabs */}
              <Tabs defaultValue='all' className='w-full'>
                <TabsList className='grid w-full grid-cols-4 bg-gray-100'>
                  <TabsTrigger value='all' className='data-[state=active]:bg-white'>
                    All Issues
                    <Badge variant='secondary' className='ml-1'>
                      {commitDetail.length}
                    </Badge>
                  </TabsTrigger>
                  <TabsTrigger value='critical' className='data-[state=active]:bg-white'>
                    Critical
                    <Badge variant='secondary' className='ml-1'>
                      {
                        commitDetail.filter((item) => item.severity === 'BLOCKER' || item.severity === 'CRITICAL')
                          .length
                      }
                    </Badge>
                  </TabsTrigger>
                  <TabsTrigger value='major' className='data-[state=active]:bg-white'>
                    Major
                    <Badge variant='secondary' className='ml-1'>
                      {commitDetail.filter((item) => item.severity === 'MAJOR').length}
                    </Badge>
                  </TabsTrigger>
                  <TabsTrigger value='minor' className='data-[state=active]:bg-white'>
                    Minor
                    <Badge variant='secondary' className='ml-1'>
                      {commitDetail.filter((item) => item.severity === 'MINOR').length}
                    </Badge>
                  </TabsTrigger>
                </TabsList>

                <TabsContent value='all' className='mt-6'>
                  <div className='space-y-4 max-h-96 overflow-y-auto'>
                    {commitDetail.map((item: CommitDetail, idx: number) => (
                      <IssueCard key={idx} item={item} />
                    ))}
                  </div>
                </TabsContent>

                <TabsContent value='critical' className='mt-6'>
                  <div className='space-y-4 max-h-96 overflow-y-auto'>
                    {commitDetail
                      .filter((item) => item.severity === 'BLOCKER' || item.severity === 'CRITICAL')
                      .map((item: CommitDetail, idx: number) => (
                        <IssueCard key={idx} item={item} />
                      ))}
                  </div>
                </TabsContent>

                <TabsContent value='major' className='mt-6'>
                  <div className='space-y-4 max-h-96 overflow-y-auto'>
                    {commitDetail
                      .filter((item) => item.severity === 'MAJOR')
                      .map((item: CommitDetail, idx: number) => (
                        <IssueCard key={idx} item={item} />
                      ))}
                  </div>
                </TabsContent>

                <TabsContent value='minor' className='mt-6'>
                  <div className='space-y-4 max-h-96 overflow-y-auto'>
                    {commitDetail
                      .filter((item) => item.severity === 'MINOR')
                      .map((item: CommitDetail, idx: number) => (
                        <IssueCard key={idx} item={item} />
                      ))}
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          ) : (
            <div className='text-center py-12 bg-green-50 rounded-lg border border-green-200'>
              <div className='bg-green-100 p-4 rounded-full w-fit mx-auto mb-4'>
                <FileText className='h-12 w-12 text-green-600' />
              </div>
              <p className='text-green-800 font-semibold text-xl mb-2'>No code quality issues found for this commit.</p>
              <p className='text-green-600'>This commit passed all quality checks!</p>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
