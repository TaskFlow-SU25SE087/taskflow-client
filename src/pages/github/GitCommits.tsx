import { getProjectPartCommitDetail, getProjectPartCommitsV2 } from '@/api/webhooks';
import { Navbar } from '@/components/Navbar';
import { Sidebar } from '@/components/Sidebar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Loader } from '@/components/ui/loader';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useCurrentProject } from '@/hooks/useCurrentProject';
import { useProjectParts } from '@/hooks/useProjectParts';
import { CommitDetail, CommitListItem, ProjectPart } from '@/types/commits';
import { format } from 'date-fns';
import { AlertTriangle, Calendar, ChevronDown, Clock, FileText, Filter, GitBranch, GitCommit, Info, RefreshCw, Search, Sparkles, User } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';

// IssueCard Component
interface IssueCardProps {
  item: CommitDetail;
}

function IssueCard({ item }: IssueCardProps) {
  const getSeverityColor = (severity: string) => {
    switch (severity.toUpperCase()) {
      case 'BLOCKER':
        return 'bg-gradient-to-br from-red-50 to-pink-50 text-red-800 border-red-200 border-l-red-500 shadow-red-100';
      case 'CRITICAL':
        return 'bg-gradient-to-br from-orange-50 to-red-50 text-orange-800 border-orange-200 border-l-orange-500 shadow-orange-100';
      case 'MAJOR':
        return 'bg-gradient-to-br from-yellow-50 to-amber-50 text-yellow-800 border-yellow-200 border-l-yellow-500 shadow-yellow-100';
      case 'MINOR':
        return 'bg-gradient-to-br from-blue-50 to-cyan-50 text-blue-800 border-blue-200 border-l-blue-500 shadow-blue-100';
      case 'INFO':
        return 'bg-gradient-to-br from-gray-50 to-slate-50 text-gray-800 border-gray-200 border-l-gray-500 shadow-gray-100';
      default:
        return 'bg-gradient-to-br from-gray-50 to-slate-50 text-gray-800 border-gray-200 border-l-gray-500 shadow-gray-100';
    }
  };

  const getSeverityBadgeColor = (severity: string) => {
    switch (severity.toUpperCase()) {
      case 'BLOCKER':
        return 'bg-gradient-to-r from-red-500 to-pink-500 text-white border-0 shadow-lg';
      case 'CRITICAL':
        return 'bg-gradient-to-r from-orange-500 to-red-500 text-white border-0 shadow-lg';
      case 'MAJOR':
        return 'bg-gradient-to-r from-yellow-500 to-amber-500 text-white border-0 shadow-lg';
      case 'MINOR':
        return 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white border-0 shadow-lg';
      case 'INFO':
        return 'bg-gradient-to-r from-gray-500 to-slate-500 text-white border-0 shadow-lg';
      default:
        return 'bg-gradient-to-r from-gray-500 to-slate-500 text-white border-0 shadow-lg';
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity.toUpperCase()) {
      case 'BLOCKER':
      case 'CRITICAL':
        return <AlertTriangle className="h-4 w-4" />;
      case 'MAJOR':
        return <Info className="h-4 w-4" />;
      default:
        return <Info className="h-4 w-4" />;
    }
  };

  return (
    <Card className={`border-l-4 hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02] ${getSeverityColor(item.severity)} shadow-lg`}>
      <CardContent className="p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 space-y-4">
            {/* Header */}
            <div className="flex items-center gap-3">
              <Badge className={`${getSeverityBadgeColor(item.severity)} px-3 py-1 font-semibold`}>
                {getSeverityIcon(item.severity)}
                <span className="ml-1">{item.severity}</span>
              </Badge>
              <span className="text-sm font-mono text-gray-600 bg-white/70 px-2 py-1 rounded-full">{item.rule}</span>
            </div>
            
            {/* Message */}
            <p className="text-gray-900 font-semibold text-lg">{item.message}</p>
            
            {/* File Info */}
            <div className="flex items-center gap-4 text-sm text-gray-700">
              <div className="flex items-center gap-2 bg-white/70 px-3 py-2 rounded-full">
                <FileText className="h-4 w-4 text-purple-500" />
                <span className="font-mono font-medium">{item.filePath}</span>
              </div>
              <div className="flex items-center gap-2 bg-white/70 px-3 py-2 rounded-full">
                <span>Line:</span>
                <span className="font-mono bg-gradient-to-r from-purple-500 to-blue-500 text-white px-3 py-1 rounded-full font-bold">{item.line}</span>
              </div>
            </div>
            
            {/* Line Content */}
            {item.lineContent && (
              <div className="bg-gradient-to-r from-gray-50 to-slate-50 p-4 rounded-lg border-l-4 border-purple-400 shadow-inner">
                <div className="text-xs text-purple-600 mb-2 font-semibold">Code at line {item.line}:</div>
                <pre className="text-sm font-mono text-gray-800 whitespace-pre-wrap bg-white/50 p-2 rounded">{item.lineContent}</pre>
              </div>
            )}
            
            {/* Blame Info */}
            {(item.blamedGitName || item.blamedGitEmail) && (
              <div className="flex items-center gap-2 text-sm text-gray-700 bg-white/70 px-3 py-2 rounded-full w-fit">
                <User className="h-4 w-4 text-green-500" />
                <span className="font-semibold">Blamed: {item.blamedGitName || 'Unknown'}</span>
                {item.blamedGitEmail && (
                  <span className="text-gray-500">({item.blamedGitEmail})</span>
                )}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function GitCommits() {
  console.log('[GitCommits] Component rendered');
  
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const { currentProject, isLoading } = useCurrentProject();
  const projectPartsHook = useProjectParts();
  
  console.log('[GitCommits] currentProject:', currentProject?.id);
  console.log('[GitCommits] isLoading:', isLoading);
  
  const fetchPartsRef = useRef(projectPartsHook.fetchParts);
  fetchPartsRef.current = projectPartsHook.fetchParts;
  
  console.log('[GitCommits] fetchPartsRef updated');
  
  const [parts, setParts] = useState<ProjectPart[]>([]);
  const [selectedPartId, setSelectedPartId] = useState<string>('');
  const [commits, setCommits] = useState<CommitListItem[]>([]);
  const [loadingCommits, setLoadingCommits] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showDetail, setShowDetail] = useState(false);
  const [commitDetail, setCommitDetail] = useState<CommitDetail[] | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [selectedCommit, setSelectedCommit] = useState<CommitListItem | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

  // Debug state changes
  useEffect(() => {
    console.log('[GitCommits] State changed - parts:', parts.length, 'selectedPartId:', selectedPartId);
  }, [parts, selectedPartId]);

  useEffect(() => {
    console.log('[GitCommits] State changed - commits:', commits.length, 'page:', page, 'totalPages:', totalPages);
  }, [commits, page, totalPages]);

  const fetchCommits = useCallback(async () => {
    if (!currentProject?.id || !selectedPartId) return;
    
    console.log('[GitCommits] Fetching commits for part:', selectedPartId, 'page:', page);
    setLoadingCommits(true);
    try {
      const res = await getProjectPartCommitsV2(currentProject.id, selectedPartId, page);
      console.log('[GitCommits] Commits fetched successfully:', res.data?.items?.length || 0, 'commits');
      setCommits(res.data?.items || []);
      setTotalPages(res.data?.totalPages || 1);
    } catch (error) {
      console.error('Error fetching commits:', error);
      setCommits([]);
      setTotalPages(1);
    } finally {
      setLoadingCommits(false);
    }
  }, [currentProject?.id, selectedPartId, page]);

  // Memoize fetchParts to prevent infinite loop
  const memoizedFetchParts = useCallback(async (projectId: string) => {
    console.log('[GitCommits] memoizedFetchParts called with projectId:', projectId);
    try {
      console.log('[GitCommits] Fetching parts for project:', projectId);
      const res = await fetchPartsRef.current(projectId);
      console.log('[GitCommits] Parts fetched successfully:', res.data?.length || 0, 'parts');
      setParts(res.data || []);
      if (res.data && res.data.length > 0) {
        console.log('[GitCommits] Setting selectedPartId to:', res.data[0].id);
        setSelectedPartId(res.data[0].id);
      }
    } catch (error) {
      console.error('Error fetching parts:', error);
      setParts([]);
    }
  }, []);

  useEffect(() => {
    console.log('[GitCommits] useEffect triggered - currentProject?.id:', currentProject?.id);
    if (currentProject?.id) {
      console.log('[GitCommits] Calling memoizedFetchParts');
      memoizedFetchParts(currentProject.id);
    }
  }, [currentProject?.id, memoizedFetchParts]);

  // Auto-refresh commits every 30 seconds
  useEffect(() => {
    if (!autoRefresh || !currentProject?.id || !selectedPartId) return;

    const interval = setInterval(() => {
      console.log('[GitCommits] Auto-refreshing commits...');
      fetchCommits();
      setLastRefresh(new Date());
    }, 30000);

    return () => clearInterval(interval);
  }, [autoRefresh, currentProject?.id, selectedPartId, fetchCommits]);

  useEffect(() => {
    console.log('[GitCommits] Commits useEffect triggered - currentProject?.id:', currentProject?.id, 'selectedPartId:', selectedPartId, 'page:', page);
    if (currentProject?.id && selectedPartId) {
      fetchCommits();
    }
  }, [currentProject?.id, selectedPartId, page, fetchCommits]);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const filteredCommits = commits.filter((commit) =>
    commit.commitMessage?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    commit.pusher?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleShowDetail = async (commit: CommitListItem) => {
    if (!currentProject || !selectedPartId) return;
    setSelectedCommit(commit);
    setShowDetail(true);
    setLoadingDetail(true);
    try {
      const res = await getProjectPartCommitDetail(currentProject.id, selectedPartId, commit.commitId);
      setCommitDetail(res.data);
    } catch (err) {
      console.error('Error fetching commit detail:', err);
      // Fallback to sample data for demo purposes
      setCommitDetail([
        {
          rule: "python:S1481",
          severity: "MINOR",
          message: "Remove the unused local variable \"password\".",
          filePath: "fjfjuw.py",
          line: 9,
          lineContent: "    password = \"123456\"",
          blamedGitEmail: "",
          blamedGitName: ""
        },
        {
          rule: "python:S1481",
          severity: "MINOR",
          message: "Remove the unused local variable \"unused_var\".",
          filePath: "testttttttttt.py",
          line: 6,
          lineContent: "    unused_var = 10",
          blamedGitEmail: "",
          blamedGitName: ""
        },
        {
          rule: "python:S1481",
          severity: "MINOR",
          message: "Remove the unused local variable \"temp\".",
          filePath: "testttttttsd - Copy.py",
          line: 29,
          lineContent: "    temp = 999",
          blamedGitEmail: "133194662+tientq-work@users.noreply.github.com",
          blamedGitName: "tientq-work"
        },
        {
          rule: "python:S1066",
          severity: "MAJOR",
          message: "Merge this if statement with the enclosing one.",
          filePath: "testttttttsd - Copy.py",
          line: 17,
          lineContent: "        if b > 0:",
          blamedGitEmail: "133194662+tientq-work@users.noreply.github.com",
          blamedGitName: "tientq-work"
        },
        {
          rule: "python:S1764",
          severity: "MAJOR",
          message: "Correct one of the identical sub-expressions on both sides of operator \"==\".",
          filePath: "fjfjuw.py",
          line: 12,
          lineContent: "    if a == a:",
          blamedGitEmail: "",
          blamedGitName: ""
        }
      ]);
    } finally {
      setLoadingDetail(false);
    }
  };

  const handleManualRefresh = () => {
    fetchCommits();
    setLastRefresh(new Date());
  };

  if (isLoading || !currentProject) {
    return (
      <div className='flex h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-cyan-50'>
        <Sidebar isOpen={isSidebarOpen} onToggle={toggleSidebar} currentProject={currentProject} />
        <div className='flex-1 flex flex-col overflow-hidden'>
          <Navbar isSidebarOpen={isSidebarOpen} toggleSidebar={toggleSidebar} />
          <Loader />
        </div>
      </div>
    );
  }

  return (
    <div className='flex h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-cyan-50'>
      <Sidebar isOpen={isSidebarOpen} onToggle={toggleSidebar} currentProject={currentProject} />
      <div className='flex-1 flex flex-col overflow-hidden'>
        <Navbar isSidebarOpen={isSidebarOpen} toggleSidebar={toggleSidebar} />
        <div className='flex flex-col h-full p-6'>
          <div className='flex-none w-full flex items-center justify-between pb-6'>
            <div className='flex items-center gap-4'>
              <div className="flex items-center gap-3">
                <h1 className='text-4xl font-bold bg-gradient-to-r from-purple-600 via-blue-600 to-cyan-600 bg-clip-text text-transparent'>
                  Code Quality by Commit
                </h1>
                <Sparkles className="h-8 w-8 text-yellow-500 animate-pulse" />
              </div>
              <div className='flex items-center gap-3 ml-4 bg-white/70 backdrop-blur-sm rounded-lg p-3 shadow-lg border border-white/30'>
                <GitBranch className='h-4 w-4 text-purple-500' />
                <Select value={selectedPartId} onValueChange={setSelectedPartId}>
                  <SelectTrigger className='w-[220px] bg-gradient-to-r from-white to-gray-50 border-2 border-purple-200 focus:border-purple-400 shadow-md'>
                    <SelectValue placeholder='Select part' />
                  </SelectTrigger>
                  <SelectContent className="bg-white/95 backdrop-blur-sm">
                    {parts.map((part) => (
                                             <SelectItem key={part.id} value={part.id} className="hover:bg-gradient-to-r hover:from-purple-50 hover:to-blue-50">
                         <div className="flex items-center justify-between w-full">
                           <div className="flex items-center gap-2">
                             <span className="font-medium text-gray-900">{part.name}</span>
                           </div>
                           <div className="flex items-center gap-2 text-xs">
                             {part.programmingLanguage !== 'None' && (
                               <div className="flex items-center gap-1 bg-blue-50 px-2 py-1 rounded-full">
                                 <img 
                                   src={`https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/${part.programmingLanguage.toLowerCase()}/${part.programmingLanguage.toLowerCase()}-original.svg`}
                                   alt={part.programmingLanguage}
                                   className="h-3 w-3"
                                   onError={(e) => {
                                     e.currentTarget.style.display = 'none';
                                   }}
                                 />
                                 <span className="text-blue-700 font-medium">{part.programmingLanguage}</span>
                               </div>
                             )}
                             {part.framework && part.framework !== 'None' && (
                               <div className="flex items-center gap-1 bg-purple-50 px-2 py-1 rounded-full">
                                 <img 
                                   src={`https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/${part.framework.toLowerCase().replace(/\s+/g, '')}/${part.framework.toLowerCase().replace(/\s+/g, '')}-original.svg`}
                                   alt={part.framework}
                                   className="h-3 w-3"
                                   onError={(e) => {
                                     e.currentTarget.style.display = 'none';
                                   }}
                                 />
                                 <span className="text-purple-700 font-medium">{part.framework}</span>
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
            
            <div className='flex items-center gap-4 bg-white/70 backdrop-blur-sm rounded-lg p-3 shadow-lg border border-white/30'>
              <div className='flex items-center gap-2'>
                <input
                  type="checkbox"
                  id="autoRefresh"
                  checked={autoRefresh}
                  onChange={(e) => setAutoRefresh(e.target.checked)}
                  className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                />
                <label htmlFor="autoRefresh" className="text-sm font-semibold text-gray-700">
                  Auto-refresh (30s)
                </label>
              </div>
              
              <div className='flex items-center gap-2 text-sm text-gray-600'>
                <Clock className='h-4 w-4 text-blue-500' />
                <span className="font-medium">Last updated: <span className="font-mono text-purple-600">{format(lastRefresh, 'HH:mm:ss')}</span></span>
              </div>
              
              <Button
                variant="outline"
                size="sm"
                onClick={handleManualRefresh}
                disabled={loadingCommits}
                className="flex items-center gap-2 bg-gradient-to-r from-purple-500 to-blue-500 text-white border-0 hover:from-purple-600 hover:to-blue-600 shadow-lg"
              >
                <RefreshCw className={`h-4 w-4 ${loadingCommits ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>
          </div>
          
          <div className='pb-6 flex items-center justify-between'>
            <div className='flex items-center gap-4'>
              <Button variant='outline' className='bg-gradient-to-r from-white to-gray-50 hover:from-gray-50 hover:to-gray-100 shadow-lg border-2 border-purple-200 hover:border-purple-400'>
                <Filter className='mr-2 h-4 w-4 text-purple-500' />
                <span className="font-semibold">Filter</span>
                <ChevronDown className='ml-2 h-4 w-4 text-purple-500' />
              </Button>
              <div className='relative'>
                <Search className='absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 transform text-purple-400' />
                <Input
                  placeholder='Search commits...'
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className='w-[280px] pl-10 bg-gradient-to-r from-white to-gray-50 border-2 border-purple-200 focus:border-purple-400 shadow-lg'
                />
              </div>
            </div>
            <div className='flex gap-2'>
              <Button variant='outline' className='bg-gradient-to-r from-white to-gray-50 hover:from-gray-50 hover:to-gray-100 shadow-lg border-2 border-purple-200 hover:border-purple-400'>
                <Calendar className='mr-2 h-4 w-4 text-purple-500' />
                <span className="font-semibold">Time Range</span>
              </Button>
            </div>
          </div>
          
          <div className='space-y-4 overflow-y-auto'>
            {loadingCommits ? (
              <Loader />
            ) : filteredCommits.length > 0 ? (
              filteredCommits.map((commit) => (
                <div key={commit.commitId} className='bg-gradient-to-r from-white via-white to-gray-50 rounded-xl p-6 shadow-xl border border-white/50 hover:shadow-2xl transition-all duration-300 transform hover:scale-[1.01]'>
                  <div className='flex flex-col gap-4'>
                    <div className='flex items-center gap-3'>
                      <div className="bg-gradient-to-r from-purple-500 to-blue-500 p-2 rounded-full">
                        <User className="h-4 w-4 text-white" />
                      </div>
                      <span className='font-bold text-gray-900 text-lg'>{commit.pusher}</span>
                      <span className='text-gray-600 font-medium'>committed</span>
                      <span className='text-sm text-gray-500 bg-gradient-to-r from-purple-100 to-blue-100 px-3 py-1 rounded-full font-medium'>
                        {commit.pushedAt ? format(new Date(commit.pushedAt), 'MMM d, yyyy') : ''}
                      </span>
                    </div>
                    <div className='text-gray-900 font-bold text-lg bg-gradient-to-r from-gray-50 to-slate-50 p-3 rounded-lg border-l-4 border-purple-400'>
                      {commit.commitMessage}
                    </div>
                    <div className='flex flex-wrap gap-3 text-sm'>
                      <span className='bg-gradient-to-r from-blue-500 to-cyan-500 text-white px-3 py-2 rounded-full font-semibold shadow-lg'>
                        Status: {commit.status}
                      </span>
                      <span className='bg-gradient-to-r from-green-500 to-emerald-500 text-white px-3 py-2 rounded-full font-semibold shadow-lg'>
                        Quality: {commit.qualityGateStatus}
                      </span>
                      <span className='bg-gradient-to-r from-yellow-500 to-amber-500 text-white px-3 py-2 rounded-full font-semibold shadow-lg'>
                        Bugs: {commit.bugs}
                      </span>
                      <span className='bg-gradient-to-r from-red-500 to-pink-500 text-white px-3 py-2 rounded-full font-semibold shadow-lg'>
                        Vuln: {commit.vulnerabilities}
                      </span>
                      <span className='bg-gradient-to-r from-gray-500 to-slate-500 text-white px-3 py-2 rounded-full font-semibold shadow-lg'>
                        Code Smells: {commit.codeSmells}
                      </span>
                      <span className='bg-gradient-to-r from-purple-500 to-violet-500 text-white px-3 py-2 rounded-full font-semibold shadow-lg'>
                        Dup Lines: {commit.duplicatedLines}
                      </span>
                      <span className='bg-gradient-to-r from-cyan-500 to-teal-500 text-white px-3 py-2 rounded-full font-semibold shadow-lg'>
                        Coverage: {commit.coverage}%
                      </span>
                    </div>
                    <div className='text-sm text-gray-600 bg-gradient-to-r from-gray-50 to-slate-50 p-2 rounded-lg italic'>
                      Result: {commit.resultSummary}
                    </div>
                    {/* Nút View Detail */}
                    <div className='mt-2'>
                      <Button 
                        size='sm' 
                        onClick={() => handleShowDetail(commit)}
                        className="bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white border-0 shadow-lg font-semibold"
                      >
                        View Detail
                      </Button>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className='text-center py-12 bg-gradient-to-r from-white to-gray-50 rounded-xl shadow-lg'>
                <FileText className="h-16 w-16 mx-auto mb-4 text-purple-300" />
                <p className="text-gray-500 text-lg font-medium">No commits found</p>
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
                    ? 'bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white shadow-lg font-bold' 
                    : 'bg-white hover:bg-gradient-to-r hover:from-purple-50 hover:to-blue-50 border-2 border-purple-200 hover:border-purple-400 shadow-md'
                }
              >
                {i + 1}
              </Button>
            ))}
          </div>
        </div>
      </div>
      
      <Dialog open={showDetail} onOpenChange={setShowDetail}>
        <DialogContent className='max-w-6xl max-h-[80vh] bg-gradient-to-br from-white via-purple-50/30 to-blue-50/30 backdrop-blur-sm border-2 border-purple-200'>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              <div className="bg-gradient-to-r from-purple-500 to-blue-500 p-2 rounded-full">
                <GitCommit className="h-5 w-5 text-white" />
              </div>
              <span className="bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent font-bold text-xl">
                Commit Detail
              </span>
              {selectedCommit && (
                <span className="text-sm font-normal text-gray-600 ml-2 bg-white/70 px-3 py-1 rounded-full">
                  {selectedCommit.commitMessage.substring(0, 50)}...
                </span>
              )}
            </DialogTitle>
          </DialogHeader>
          
          {loadingDetail ? (
            <div className="flex items-center justify-center py-12 bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg">
              <Loader />
              <span className="ml-2 font-semibold text-gray-700">Loading commit details...</span>
            </div>
          ) : commitDetail && commitDetail.length > 0 ? (
            <div className="space-y-6">
              {/* Commit Summary */}
              {selectedCommit && (
                <Card className="bg-gradient-to-r from-gray-50 to-slate-50 border-2 border-purple-200 shadow-lg">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                      Commit Summary
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div className="flex items-center gap-2 bg-white/70 p-3 rounded-lg">
                        <User className="h-4 w-4 text-purple-500" />
                        <span className="font-bold text-gray-800">{selectedCommit.pusher}</span>
                      </div>
                      <div className="flex items-center gap-2 bg-white/70 p-3 rounded-lg">
                        <Clock className="h-4 w-4 text-blue-500" />
                        <span className="font-semibold text-gray-700">{format(new Date(selectedCommit.pushedAt), 'MMM d, yyyy HH:mm')}</span>
                      </div>
                      <div className="flex items-center gap-2 bg-white/70 p-3 rounded-lg">
                        <span className="font-semibold text-gray-700">Status:</span>
                        <Badge className="bg-gradient-to-r from-blue-500 to-cyan-500 text-white border-0">{selectedCommit.status}</Badge>
                      </div>
                      <div className="flex items-center gap-2 bg-white/70 p-3 rounded-lg">
                        <span className="font-semibold text-gray-700">Quality:</span>
                        <Badge className="bg-gradient-to-r from-green-500 to-emerald-500 text-white border-0">{selectedCommit.qualityGateStatus}</Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Issues List with Tabs */}
              <Tabs defaultValue="all" className="w-full">
                <TabsList className="grid w-full grid-cols-4 bg-gradient-to-r from-purple-100 to-blue-100 p-1 rounded-lg">
                  <TabsTrigger value="all" className="flex items-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500 data-[state=active]:to-blue-500 data-[state=active]:text-white font-semibold">
                    All Issues
                    <Badge variant="secondary" className="ml-1 bg-white/70 text-purple-700 font-bold">{commitDetail.length}</Badge>
                  </TabsTrigger>
                  <TabsTrigger value="critical" className="flex items-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-red-500 data-[state=active]:to-orange-500 data-[state=active]:text-white font-semibold">
                    Critical
                    <Badge variant="secondary" className="ml-1 bg-gradient-to-r from-red-100 to-orange-100 text-red-700 font-bold">
                      {commitDetail.filter(item => item.severity === 'BLOCKER' || item.severity === 'CRITICAL').length}
                    </Badge>
                  </TabsTrigger>
                  <TabsTrigger value="major" className="flex items-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-yellow-500 data-[state=active]:to-amber-500 data-[state=active]:text-white font-semibold">
                    Major
                    <Badge variant="secondary" className="ml-1 bg-gradient-to-r from-yellow-100 to-amber-100 text-yellow-700 font-bold">
                      {commitDetail.filter(item => item.severity === 'MAJOR').length}
                    </Badge>
                  </TabsTrigger>
                  <TabsTrigger value="minor" className="flex items-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-cyan-500 data-[state=active]:text-white font-semibold">
                    Minor
                    <Badge variant="secondary" className="ml-1 bg-gradient-to-r from-blue-100 to-cyan-100 text-blue-700 font-bold">
                      {commitDetail.filter(item => item.severity === 'MINOR').length}
                    </Badge>
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="all" className="mt-6">
                  <div className="space-y-4 max-h-96 overflow-y-auto">
                    {commitDetail.map((item: CommitDetail, idx: number) => (
                      <IssueCard key={idx} item={item} />
                    ))}
                  </div>
                </TabsContent>

                <TabsContent value="critical" className="mt-6">
                  <div className="space-y-4 max-h-96 overflow-y-auto">
                    {commitDetail
                      .filter(item => item.severity === 'BLOCKER' || item.severity === 'CRITICAL')
                      .map((item: CommitDetail, idx: number) => (
                        <IssueCard key={idx} item={item} />
                      ))}
                  </div>
                </TabsContent>

                <TabsContent value="major" className="mt-6">
                  <div className="space-y-4 max-h-96 overflow-y-auto">
                    {commitDetail
                      .filter(item => item.severity === 'MAJOR')
                      .map((item: CommitDetail, idx: number) => (
                        <IssueCard key={idx} item={item} />
                      ))}
                  </div>
                </TabsContent>

                <TabsContent value="minor" className="mt-6">
                  <div className="space-y-4 max-h-96 overflow-y-auto">
                    {commitDetail
                      .filter(item => item.severity === 'MINOR')
                      .map((item: CommitDetail, idx: number) => (
                        <IssueCard key={idx} item={item} />
                      ))}
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          ) : (
            <div className="text-center py-12 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border-2 border-green-200">
              <div className="bg-gradient-to-r from-green-400 to-emerald-400 p-4 rounded-full w-fit mx-auto mb-4">
                <FileText className="h-12 w-12 text-white" />
              </div>
              <p className="text-green-800 font-bold text-xl mb-2">No code quality issues found for this commit.</p>
              <p className="text-green-600 font-semibold">This commit passed all quality checks with flying colors! 🎉</p>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}