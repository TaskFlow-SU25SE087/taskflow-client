import { getProjectPartCommitsV2 } from '@/api/webhooks'
import { Navbar } from '@/components/Navbar'
import { Sidebar } from '@/components/Sidebar'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Loader } from '@/components/ui/loader'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useCurrentProject } from '@/hooks/useCurrentProject'
import { useProjectParts } from '@/hooks/useProjectParts'
import { useToast } from '@/hooks/use-toast'
import { CommitListItem, ProjectPart } from '@/types/commits'
import { format } from 'date-fns'
import { Calendar, ChevronDown, Clock, Filter, RefreshCw, Search } from 'lucide-react'
import { useEffect, useState } from 'react'

// Helper functions for status handling
const getStatusColor = (status: string) => {
  switch (status?.toLowerCase()) {
    case 'done':
      return 'bg-green-100 text-green-700'
    case 'processing':
    case 'scanning':
      return 'bg-yellow-100 text-yellow-700'
    case 'pending':
    case 'queued':
      return 'bg-blue-100 text-blue-700'
    case 'failed':
    case 'error':
      return 'bg-red-100 text-red-700'
    default:
      return 'bg-gray-100 text-gray-700'
  }
}

const getStatusIcon = (status: string) => {
  switch (status?.toLowerCase()) {
    case 'done':
      return '✅'
    case 'processing':
    case 'scanning':
      return '⏳'
    case 'pending':
    case 'queued':
      return '⏱️'
    case 'failed':
    case 'error':
      return '❌'
    default:
      return '❓'
  }
}

const renderQualityScoreSection = (commit: CommitListItem) => {
  const isPending = commit.status?.toLowerCase() === 'pending' || commit.status?.toLowerCase() === 'queued'
  const isProcessing = commit.status?.toLowerCase() === 'processing' || commit.status?.toLowerCase() === 'scanning'
  const isDone = commit.status?.toLowerCase() === 'done'

  if (isPending) {
    return (
      <div className='flex items-center gap-3 bg-gradient-to-r from-blue-50 to-indigo-50 p-2 rounded-lg border border-blue-200 my-2'>
        <div className='flex items-center gap-2'>
          <div className='w-2 h-2 rounded-full bg-blue-500 animate-pulse'></div>
          <span className='text-xs font-medium text-gray-700'>Status:</span>
          <span className='text-sm font-bold text-blue-600'>Queued for Scanning</span>
        </div>
      </div>
    )
  }

  if (isProcessing) {
    return (
      <div className='flex items-center gap-3 bg-gradient-to-r from-yellow-50 to-orange-50 p-2 rounded-lg border border-yellow-200 my-2'>
        <div className='flex items-center gap-2'>
          <div className='w-2 h-2 rounded-full bg-yellow-500 relative'>
            <div className='w-full h-full rounded-full bg-yellow-500 animate-ping absolute'></div>
          </div>
          <span className='text-xs font-medium text-gray-700'>Status:</span>
          <span className='text-sm font-bold text-yellow-600'>Scanning...</span>
        </div>
      </div>
    )
  }

  if (isDone && commit.qualityScore !== undefined) {
    return (
      <div className='flex items-center gap-3 bg-gradient-to-r from-emerald-50 to-green-50 p-2 rounded-lg border border-emerald-200 my-2'>
        <div className='flex items-center gap-2'>
          <div
            className={`w-2 h-2 rounded-full ${
              commit.qualityScore >= 8 ? 'bg-green-500' : commit.qualityScore >= 7 ? 'bg-yellow-500' : 'bg-red-500'
            }`}
          ></div>
          <span className='text-xs font-medium text-gray-700'>Quality Score:</span>
          <span
            className={`text-lg font-bold ${
              commit.qualityScore >= 8 ? 'text-green-600' : commit.qualityScore >= 7 ? 'text-yellow-600' : 'text-red-600'
            }`}
          >
            {commit.qualityScore}/10
          </span>
        </div>
        <div className='text-xs text-gray-500'>
          Gate:{' '}
          <span className={`font-medium ${commit.qualityGateStatus === 'OK' ? 'text-green-600' : 'text-red-600'}`}>
            {commit.qualityGateStatus}
          </span>
        </div>
      </div>
    )
  }

  return (
    <div className='flex items-center gap-3 bg-gradient-to-r from-gray-50 to-slate-50 p-2 rounded-lg border border-gray-200 my-2'>
      <div className='flex items-center gap-2'>
        <div className='w-2 h-2 rounded-full bg-gray-400'></div>
        <span className='text-xs font-medium text-gray-700'>Quality Score:</span>
        <span className='text-sm font-medium text-gray-500'>Pending</span>
      </div>
    </div>
  )
}

export default function CodeQualityCommits() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const { currentProject, isLoading } = useCurrentProject()
  const { fetchParts } = useProjectParts()
  const [parts, setParts] = useState<ProjectPart[]>([])
  const [selectedPartId, setSelectedPartId] = useState<string>('')
  const [commits, setCommits] = useState<CommitListItem[]>([])
  const [loadingCommits, setLoadingCommits] = useState(false)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  useEffect(() => {
    if (currentProject?.id) {
      fetchParts(currentProject.id).then((res) => {
        setParts(res.data || []);
        if (res.data && res.data.length > 0) {
          setSelectedPartId(res.data[0].id);
        }
      });
    }
  }, [currentProject?.id]);

  useEffect(() => {
    if (currentProject?.id && selectedPartId) {
      setLoadingCommits(true);
      getProjectPartCommitsV2(currentProject.id, selectedPartId, page)
        .then((res) => {
          setCommits(res.data?.items || []);
          setTotalPages(res.data?.totalPages || 1);
        })
        .finally(() => setLoadingCommits(false));
    }
  }, [currentProject?.id, selectedPartId, page]);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const filteredCommits = commits.filter((commit) =>
    commit.commitMessage?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (isLoading || !currentProject) {
    return (
      <div className='flex h-screen bg-gray-100'>
        <Sidebar isOpen={isSidebarOpen} onToggle={toggleSidebar} currentProject={currentProject} />
        <div className='flex-1 flex flex-col overflow-hidden'>
          <Navbar isSidebarOpen={isSidebarOpen} toggleSidebar={toggleSidebar} />
          <Loader />
        </div>
      </div>
    );
  }

  return (
    <div className='flex h-screen bg-gray-100'>
      <Sidebar isOpen={isSidebarOpen} onToggle={toggleSidebar} currentProject={currentProject} />
      <div className='flex-1 flex flex-col overflow-hidden'>
        <Navbar isSidebarOpen={isSidebarOpen} toggleSidebar={toggleSidebar} />
        <div className='flex flex-col h-full p-6'>
          <div className='flex-none w-full flex items-center justify-between pb-6'>
            <div className='flex items-center gap-2'>
              <h1 className='text-4xl font-bold'>Code Quality by Commit</h1>
              <div className='flex items-center gap-2 ml-4'>
                <span className='text-sm text-gray-500'>Repository Part:</span>
                <Select value={selectedPartId} onValueChange={setSelectedPartId}>
                  <SelectTrigger className='w-[220px] bg-white'>
                    <SelectValue placeholder='Select part' />
                  </SelectTrigger>
                  <SelectContent>
                    {parts.map((part) => (
                      <SelectItem key={part.id} value={part.id}>
                        {part.name} ({part.programmingLanguage}, {part.framework})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
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
            </div>
          </div>
          <div className='space-y-4 overflow-y-auto'>
            {loadingCommits ? (
              <Loader />
            ) : filteredCommits.length > 0 ? (
              filteredCommits.map((commit) => (
                <div key={commit.commitId} className='bg-white rounded-lg p-4 shadow-sm border border-gray-100 hover:border-lavender-200 transition-colors'>
                    <div className='flex flex-col gap-2'>
                      <div className='flex items-center gap-2'>
                        <span className='font-medium text-gray-900'>{commit.pusher}</span>
                        <span className='text-gray-500'>committed</span>
                        <span className='text-sm text-gray-500'>
                          {commit.pushedAt ? format(new Date(commit.pushedAt), 'MMM d, yyyy') : ''}
                        </span>
                      </div>
                      <div className='text-gray-900 font-medium'>{commit.commitMessage}</div>

                      {/* Quality Score Section */}
                      {renderQualityScoreSection(commit)}

                      <div className='flex flex-wrap gap-2 text-xs'>
                        <span className='bg-blue-100 text-blue-700 px-2 py-1 rounded'>Status: {commit.status}</span>
                        <span className='bg-green-100 text-green-700 px-2 py-1 rounded'>
                          Quality: {commit.qualityGateStatus}
                        </span>
                        <span className='bg-yellow-100 text-yellow-700 px-2 py-1 rounded'>
                          Bugs: {commit.bugs}
                        </span>
                        <span className='bg-red-100 text-red-700 px-2 py-1 rounded'>Vuln: {commit.vulnerabilities}</span>
                        <span className='bg-gray-100 text-gray-700 px-2 py-1 rounded'>
                          Code Smells: {commit.codeSmells}
                        </span>
                        <span className='bg-orange-100 text-orange-700 px-2 py-1 rounded'>
                          Security Hotspots: {commit.securityHotspots}
                        </span>
                        <span className='bg-purple-100 text-purple-700 px-2 py-1 rounded'>
                          Dup Lines: {commit.duplicatedLines}
                        </span>
                        <span className='bg-pink-100 text-pink-700 px-2 py-1 rounded'>
                          Dup Blocks: {commit.duplicatedBlocks}
                        </span>
                        <span className='bg-cyan-100 text-cyan-700 px-2 py-1 rounded'>Coverage: {commit.coverage}%</span>
                        <span className='bg-indigo-100 text-indigo-700 px-2 py-1 rounded'>
                          Dup Density: {commit.duplicatedLinesDensity}%
                        </span>
                        <span className='bg-emerald-100 text-emerald-700 px-2 py-1 rounded'>
                          Quality Score: {commit.qualityScore}
                        </span>
                        <span className='bg-teal-100 text-teal-700 px-2 py-1 rounded'>Duration: {commit.scanDuration}</span>
                      </div>
                      <div className='flex flex-col gap-1 text-xs text-gray-500 mt-2'>
                        <div>Result: {commit.resultSummary}</div>
                        <div>
                          Expected Finish:{' '}
                          {commit.expectedFinishAt
                            ? format(new Date(commit.expectedFinishAt), 'MMM d, yyyy HH:mm')
                            : 'N/A'}
                        </div>
                        {commit.commitUrl && (
                          <div>
                            <a
                              href={commit.commitUrl}
                              target='_blank'
                              rel='noopener noreferrer'
                              className='text-blue-600 hover:underline'
                            >
                              View on GitHub
                            </a>
                          </div>
                        )}
                      </div>
                    </div>
                </div>
              ))
            ) : (
              <div className='text-center py-8 text-gray-500'>No commits found</div>
            )}
          </div>
          <div className='flex justify-center mt-6 gap-2'>
            {Array.from({ length: totalPages }, (_, i) => (
              <Button
                key={i}
                variant={i + 1 === page ? 'default' : 'outline'}
                size='sm'
                onClick={() => setPage(i + 1)}
                className={i + 1 === page ? 'bg-lavender-700 hover:bg-lavender-800' : ''}
              >
                {i + 1}
              </Button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
} 