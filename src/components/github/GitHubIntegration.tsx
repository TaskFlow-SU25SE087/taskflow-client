import { BarChart3, CheckCircle, ExternalLink, GitCommit, Github, Settings, XCircle } from 'lucide-react'
import { useState } from 'react'
import { useToast } from '../../hooks/useToast'
import { useWebhooks } from '../../hooks/useWebhooks'
import { Badge } from '../ui/badge'
import { Button } from '../ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs'
import CodeQualityDashboard from './CodeQualityDashboard'
import CommitHistory from './CommitHistory'
import RepositoryConnection from './RepositoryConnection'

interface GitHubIntegrationProps {
  projectId: string
  partId: string
}

export default function GitHubIntegration({ projectId, partId }: GitHubIntegrationProps) {
  const { connectionStatus, getLatestCommit, getLatestQualityResult } = useWebhooks()
  const { toast } = useToast()
  const [activeTab, setActiveTab] = useState('overview')

  const isConnected = connectionStatus?.isConnected
  const latestCommit = getLatestCommit()
  const latestQuality = getLatestQualityResult()

  const handleTabChange = (value: string) => {
    setActiveTab(value)
  }

  const getConnectionStatusBadge = () => {
    if (!connectionStatus) {
      return <Badge variant='outline'>Unknown</Badge>
    }

    return isConnected ? (
      <Badge variant='default' className='bg-green-100 text-green-700'>
        <CheckCircle className='h-3 w-3 mr-1' />
        Connected
      </Badge>
    ) : (
      <Badge variant='secondary'>
        <XCircle className='h-3 w-3 mr-1' />
        Not Connected
      </Badge>
    )
  }

  return (
    <div className='space-y-6'>
      {/* Header */}
      <div className='flex items-center justify-between'>
        <div>
          <h1 className='text-3xl font-bold'>GitHub Integration</h1>
          <p className='text-gray-600'>Connect your repository and monitor code quality</p>
        </div>

        <div className='flex items-center gap-2'>
          {getConnectionStatusBadge()}
          <Button variant='outline' size='sm'>
            <ExternalLink className='h-4 w-4 mr-2' />
            GitHub Docs
          </Button>
        </div>
      </div>

      {/* Overview Cards */}
      {isConnected && (
        <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
          <Card>
            <CardContent className='p-6'>
              <div className='flex items-center gap-3'>
                <div className='p-2 bg-blue-100 rounded-lg'>
                  <GitCommit className='h-5 w-5 text-blue-600' />
                </div>
                <div>
                  <p className='text-sm text-gray-600'>Latest Commit</p>
                  <p className='text-lg font-semibold'>
                    {latestCommit ? latestCommit.commitHash.substring(0, 8) : 'None'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className='p-6'>
              <div className='flex items-center gap-3'>
                <div className='p-2 bg-green-100 rounded-lg'>
                  <BarChart3 className='h-5 w-5 text-green-600' />
                </div>
                <div>
                  <p className='text-sm text-gray-600'>Quality Score</p>
                  <p className='text-lg font-semibold'>{latestQuality ? `${latestQuality.overallScore}/100` : 'N/A'}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className='p-6'>
              <div className='flex items-center gap-3'>
                <div className='p-2 bg-purple-100 rounded-lg'>
                  <Github className='h-5 w-5 text-purple-600' />
                </div>
                <div>
                  <p className='text-sm text-gray-600'>Repository</p>
                  <p className='text-lg font-semibold truncate'>
                    {connectionStatus?.webhookUrl
                      ? new URL(connectionStatus.webhookUrl).pathname.split('/').slice(-2).join('/')
                      : 'Connected'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={handleTabChange} className='space-y-4'>
        <TabsList className='grid w-full grid-cols-4'>
          <TabsTrigger value='overview' className='flex items-center gap-2'>
            <Github className='h-4 w-4' />
            Overview
          </TabsTrigger>
          <TabsTrigger value='commits' className='flex items-center gap-2'>
            <GitCommit className='h-4 w-4' />
            Commits
          </TabsTrigger>
          <TabsTrigger value='quality' className='flex items-center gap-2'>
            <BarChart3 className='h-4 w-4' />
            Quality
          </TabsTrigger>
          <TabsTrigger value='settings' className='flex items-center gap-2'>
            <Settings className='h-4 w-4' />
            Settings
          </TabsTrigger>
        </TabsList>

        <TabsContent value='overview' className='space-y-4'>
          {!isConnected ? (
            <Card>
              <CardContent className='p-8'>
                <div className='text-center'>
                  <Github className='h-16 w-16 mx-auto mb-4 text-gray-300' />
                  <h3 className='text-lg font-semibold mb-2'>Connect Your Repository</h3>
                  <p className='text-gray-600 mb-4'>
                    Connect your GitHub repository to start monitoring code quality and commit history.
                  </p>
                  <Button onClick={() => setActiveTab('settings')}>
                    <Settings className='h-4 w-4 mr-2' />
                    Go to Settings
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className='space-y-6'>
              {/* Quick Stats */}
              <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
                <Card>
                  <CardHeader>
                    <CardTitle className='flex items-center gap-2'>
                      <GitCommit className='h-5 w-5' />
                      Recent Commits
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className='space-y-3'>
                      {latestCommit ? (
                        <div className='p-3 bg-gray-50 rounded-lg'>
                          <div className='flex items-center justify-between mb-1'>
                            <span className='font-medium text-sm'>{latestCommit.commitMessage}</span>
                            <Badge variant='outline' className='text-xs'>
                              {latestCommit.status}
                            </Badge>
                          </div>
                          <div className='text-xs text-gray-500'>
                            {latestCommit.authorName} • {new Date(latestCommit.commitDate).toLocaleDateString()}
                          </div>
                        </div>
                      ) : (
                        <p className='text-gray-500 text-sm'>No commits yet</p>
                      )}
                    </div>
                    <Button variant='outline' size='sm' className='mt-3 w-full' onClick={() => setActiveTab('commits')}>
                      View All Commits
                    </Button>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className='flex items-center gap-2'>
                      <BarChart3 className='h-5 w-5' />
                      Quality Overview
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {latestQuality ? (
                      <div className='space-y-3'>
                        <div className='flex items-center justify-between'>
                          <span className='text-sm text-gray-600'>Overall Score</span>
                          <span className='text-lg font-semibold'>{latestQuality.overallScore}/100</span>
                        </div>
                        <div className='grid grid-cols-2 gap-2 text-xs'>
                          <div>Bugs: {latestQuality.bugs}</div>
                          <div>Vulnerabilities: {latestQuality.vulnerabilities}</div>
                          <div>Code Smells: {latestQuality.codeSmells}</div>
                          <div>Coverage: {latestQuality.coverage}%</div>
                        </div>
                      </div>
                    ) : (
                      <p className='text-gray-500 text-sm'>No quality data available</p>
                    )}
                    <Button variant='outline' size='sm' className='mt-3 w-full' onClick={() => setActiveTab('quality')}>
                      View Quality Dashboard
                    </Button>
                  </CardContent>
                </Card>
              </div>

              {/* Quick Actions */}
              <Card>
                <CardHeader>
                  <CardTitle>Quick Actions</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className='flex gap-2'>
                    <Button variant='outline' onClick={() => setActiveTab('commits')}>
                      <GitCommit className='h-4 w-4 mr-2' />
                      View Commits
                    </Button>
                    <Button variant='outline' onClick={() => setActiveTab('quality')}>
                      <BarChart3 className='h-4 w-4 mr-2' />
                      Quality Dashboard
                    </Button>
                    <Button variant='outline' onClick={() => setActiveTab('settings')}>
                      <Settings className='h-4 w-4 mr-2' />
                      Repository Settings
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>

        <TabsContent value='commits'>
          <CommitHistory projectId={projectId} partId={partId} />
        </TabsContent>

        <TabsContent value='quality'>
          <CodeQualityDashboard projectId={projectId} partId={partId} />
        </TabsContent>

        <TabsContent value='settings'>
          <RepositoryConnection projectId={projectId} partId={partId} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
