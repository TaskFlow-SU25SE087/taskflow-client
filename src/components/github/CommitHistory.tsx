import { format } from 'date-fns'
import { AlertCircle, CheckCircle, Clock, GitCommit, Loader2, RefreshCw } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useWebhooks } from '../../hooks/useWebhooks'
import { CommitRecord, CommitStatus } from '../../types/webhook'
import { Avatar, AvatarFallback } from '../ui/avatar'
import { Badge } from '../ui/badge'
import { Button } from '../ui/button'
import { Card, CardContent } from '../ui/card'
import { Skeleton } from '../ui/skeleton'

interface CommitHistoryProps {
  projectId: string
  partId: string
}

interface CommitCardProps {
  commit: CommitRecord
}

function CommitCardSkeleton() {
  return (
    <Card className='hover:shadow-md transition-shadow'>
      <CardContent className='p-4'>
        <div className='flex items-start gap-4'>
          <Skeleton className='h-10 w-10 rounded-full' />

          <div className='flex-1 min-w-0'>
            <div className='flex items-center gap-2 mb-2'>
              <Skeleton className='h-4 w-32' />
              <Skeleton className='h-4 w-16' />
              <Skeleton className='h-4 w-24' />
              <Skeleton className='h-4 w-4' />
            </div>

            <Skeleton className='h-5 w-3/4 mb-2' />

            <div className='flex items-center gap-4 text-sm'>
              <div className='flex items-center gap-1.5'>
                <Skeleton className='h-4 w-4' />
                <Skeleton className='h-4 w-16' />
              </div>

              <Skeleton className='h-5 w-16 rounded-full' />

              <div className='flex items-center gap-1'>
                <Skeleton className='h-4 w-20' />
                <Skeleton className='h-4 w-8' />
              </div>

              <div className='flex items-center gap-1'>
                <Skeleton className='h-4 w-12' />
                <Skeleton className='h-4 w-6' />
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function CommitCard({ commit }: CommitCardProps) {
  const getStatusIcon = (status: CommitStatus) => {
    switch (status) {
      case CommitStatus.Done:
        return <CheckCircle className='h-4 w-4 text-green-500' />
      case CommitStatus.Failed:
        return <AlertCircle className='h-4 w-4 text-red-500' />
      case CommitStatus.Checking:
        return <Loader2 className='h-4 w-4 text-blue-500 animate-spin' />
      default:
        return <Clock className='h-4 w-4 text-gray-500' />
    }
  }

  const getStatusBadge = (status: CommitStatus) => {
    switch (status) {
      case CommitStatus.Done:
        return (
          <Badge variant='default' className='bg-green-100 text-green-700'>
            Done
          </Badge>
        )
      case CommitStatus.Failed:
        return <Badge variant='destructive'>Failed</Badge>
      case CommitStatus.Checking:
        return (
          <Badge variant='secondary' className='bg-blue-100 text-blue-700'>
            Checking
          </Badge>
        )
      default:
        return <Badge variant='outline'>Unknown</Badge>
    }
  }

  const initials = commit.authorName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()

  return (
    <Card className='hover:shadow-md transition-shadow'>
      <CardContent className='p-4'>
        <div className='flex items-start gap-4'>
          <Avatar className='h-10 w-10'>
            <AvatarFallback className='bg-lavender-100 text-lavender-700'>{initials}</AvatarFallback>
          </Avatar>

          <div className='flex-1 min-w-0'>
            <div className='flex items-center gap-2 mb-2'>
              <span className='font-medium text-gray-900'>{commit.authorName}</span>
              <span className='text-gray-500'>committed</span>
              <span className='text-sm text-gray-500'>{format(new Date(commit.commitDate), 'MMM d, yyyy HH:mm')}</span>
              {getStatusIcon(commit.status)}
            </div>

            <p className='text-gray-900 font-medium mb-2'>{commit.commitMessage}</p>

            <div className='flex items-center gap-4 text-sm'>
              <div className='flex items-center gap-1.5 text-gray-500'>
                <GitCommit className='h-4 w-4' />
                <span className='font-mono'>{commit.commitHash.substring(0, 8)}</span>
              </div>

              {getStatusBadge(commit.status)}

              {commit.qualityScore && (
                <div className='flex items-center gap-1 text-gray-500'>
                  <span>Quality Score:</span>
                  <span className='font-medium'>{commit.qualityScore}</span>
                </div>
              )}

              {commit.issuesCount !== undefined && (
                <div className='flex items-center gap-1 text-gray-500'>
                  <span>Issues:</span>
                  <span className='font-medium'>{commit.issuesCount}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export default function CommitHistory({ projectId, partId }: CommitHistoryProps) {
  const { commits, commitsLoading, error, fetchCommits, getCommitsByStatus, getLatestCommit } = useWebhooks()

  const [filterStatus, setFilterStatus] = useState<CommitStatus | 'all'>('all')
  const [autoRefresh, setAutoRefresh] = useState(true)

  // Auto-refresh every 30 seconds
  useEffect(() => {
    if (!autoRefresh) return

    const interval = setInterval(() => {
      fetchCommits(projectId, partId)
    }, 30000)

    return () => clearInterval(interval)
  }, [autoRefresh, projectId, partId, fetchCommits])

  // Initial fetch
  useEffect(() => {
    fetchCommits(projectId, partId)
  }, [projectId, partId, fetchCommits])

  const handleRefresh = () => {
    fetchCommits(projectId, partId)
  }

  const filteredCommits = filterStatus === 'all' ? commits : getCommitsByStatus(filterStatus as CommitStatus)

  const latestCommit = getLatestCommit()

  if (commitsLoading && commits.length === 0) {
    return (
      <div className='space-y-6'>
        {/* Header skeleton */}
        <div className='flex items-center justify-between'>
          <div>
            <Skeleton className='h-8 w-48 mb-2' />
            <Skeleton className='h-4 w-64' />
          </div>

          <div className='flex items-center gap-2'>
            <Skeleton className='h-9 w-24 rounded-md' />
          </div>
        </div>

        {/* Stats skeleton */}
        <div className='grid grid-cols-1 md:grid-cols-4 gap-4'>
          {Array.from({ length: 4 }, (_, i) => (
            <Card key={i}>
              <CardContent className='p-4'>
                <div className='flex items-center gap-2'>
                  <Skeleton className='h-5 w-5' />
                  <div>
                    <Skeleton className='h-4 w-20 mb-1' />
                    <Skeleton className='h-8 w-12' />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Filter skeleton */}
        <div className='flex items-center gap-4'>
          <Skeleton className='h-4 w-32' />
          <div className='flex gap-2'>
            {Array.from({ length: 4 }, (_, i) => (
              <Skeleton key={i} className='h-8 w-16 rounded-md' />
            ))}
          </div>
        </div>

        {/* Commits list skeleton */}
        <div className='space-y-4'>
          {Array.from({ length: 3 }, (_, i) => (
            <CommitCardSkeleton key={i} />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className='space-y-6'>
      {/* Header */}
      <div className='flex items-center justify-between'>
        <div>
          <h2 className='text-2xl font-bold'>Commit History</h2>
          <p className='text-gray-600'>Track code changes and quality analysis</p>
        </div>

        <div className='flex items-center gap-2'>
          <Button variant='outline' size='sm' onClick={handleRefresh} disabled={commitsLoading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${commitsLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>

          <Button variant={autoRefresh ? 'default' : 'outline'} size='sm' onClick={() => setAutoRefresh(!autoRefresh)}>
            Auto-refresh {autoRefresh ? 'ON' : 'OFF'}
          </Button>
        </div>
      </div>

      {/* Stats */}
      {latestCommit && (
        <div className='grid grid-cols-1 md:grid-cols-4 gap-4'>
          <Card>
            <CardContent className='p-4'>
              <div className='flex items-center gap-2'>
                <GitCommit className='h-5 w-5 text-blue-500' />
                <div>
                  <p className='text-sm text-gray-600'>Total Commits</p>
                  <p className='text-2xl font-bold'>{commits.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className='p-4'>
              <div className='flex items-center gap-2'>
                <CheckCircle className='h-5 w-5 text-green-500' />
                <div>
                  <p className='text-sm text-gray-600'>Completed</p>
                  <p className='text-2xl font-bold'>{getCommitsByStatus(CommitStatus.Done).length}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className='p-4'>
              <div className='flex items-center gap-2'>
                <Loader2 className='h-5 w-5 text-blue-500' />
                <div>
                  <p className='text-sm text-gray-600'>Processing</p>
                  <p className='text-2xl font-bold'>{getCommitsByStatus(CommitStatus.Checking).length}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className='p-4'>
              <div className='flex items-center gap-2'>
                <AlertCircle className='h-5 w-5 text-red-500' />
                <div>
                  <p className='text-sm text-gray-600'>Failed</p>
                  <p className='text-2xl font-bold'>{getCommitsByStatus(CommitStatus.Failed).length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filter */}
      <div className='flex items-center gap-4'>
        <span className='text-sm font-medium text-gray-700'>Filter by status:</span>
        <div className='flex gap-2'>
          {(['all', CommitStatus.Done, CommitStatus.Checking, CommitStatus.Failed] as const).map((status) => (
            <Button
              key={status}
              variant={filterStatus === status ? 'default' : 'outline'}
              size='sm'
              onClick={() => setFilterStatus(status)}
            >
              {status === 'all' ? 'All' : status}
            </Button>
          ))}
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className='bg-red-50 border border-red-200 rounded-lg p-4'>
          <div className='flex items-center gap-2'>
            <AlertCircle className='h-5 w-5 text-red-500' />
            <span className='text-red-700'>{error}</span>
          </div>
        </div>
      )}

      {/* Commits List */}
      <div className='space-y-4'>
        {filteredCommits.length === 0 ? (
          <div className='text-center py-8 text-gray-500'>
            <GitCommit className='h-12 w-12 mx-auto mb-4 text-gray-300' />
            <p>No commits found</p>
            {filterStatus !== 'all' && (
              <p className='text-sm'>Try changing the filter or check if the repository is connected</p>
            )}
          </div>
        ) : (
          filteredCommits.map((commit) => <CommitCard key={commit.id} commit={commit} />)
        )}
      </div>

      {/* Loading indicator for refresh */}
      {commitsLoading && commits.length > 0 && (
        <div className='flex items-center justify-center py-4'>
          <Loader2 className='h-6 w-6 animate-spin text-blue-500' />
          <span className='ml-2 text-gray-600'>Updating commits...</span>
        </div>
      )}
    </div>
  )
}
