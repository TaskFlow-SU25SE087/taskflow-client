import { useEffect, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useGitHubProjectPartIntegration } from '../../hooks/useGitHubProjectPartIntegration'
import { Badge } from '../ui/badge'
import { Button } from '../ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog'
import { Input } from '../ui/input'
import { Label } from '../ui/label'
import { Loader } from '../ui/loader'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select'
import { Separator } from '../ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs'

interface GitHubProjectPartIntegrationProps {
  projectId: string
  partId?: string
}

export default function GitHubProjectPartIntegration({ projectId, partId }: GitHubProjectPartIntegrationProps) {
  const location = useLocation()
  const navigate = useNavigate()

  const {
    connectionStatus,
    repositories,
    projectParts,
    loading,
    oauthLoading,
    reposLoading,
    connectingRepo,
    creatingPart,
    checkConnectionStatus,
    startGitHubOAuth,
    handleOAuthCallback,
    fetchRepositories,
    createNewProjectPart,
    connectRepoToPart,
    setProjectPartsData,
    disconnectRepository
  } = useGitHubProjectPartIntegration()

  // Local states
  const [selectedPart, setSelectedPart] = useState<string>('')
  const [selectedRepo, setSelectedRepo] = useState<string>('')
  const [isProcessingCallback, setIsProcessingCallback] = useState(false)
  const [showCreatePartDialog, setShowCreatePartDialog] = useState(false)
  const [newPartData, setNewPartData] = useState({
    name: '',
    programmingLanguage: '',
    framework: ''
  })

  // Use refs to avoid dependency loops
  const checkConnectionStatusRef = useRef(checkConnectionStatus)
  const handleOAuthCallbackRef = useRef(handleOAuthCallback)

  // Update refs when functions change
  useEffect(() => {
    checkConnectionStatusRef.current = checkConnectionStatus
  }, [checkConnectionStatus])

  useEffect(() => {
    handleOAuthCallbackRef.current = handleOAuthCallback
  }, [handleOAuthCallback])

  // Check for OAuth callback parameters
  useEffect(() => {
    const urlParams = new URLSearchParams(location.search)
    const code = urlParams.get('code')
    const state = urlParams.get('state')

    if (code && state) {
      setIsProcessingCallback(true)
      handleOAuthCallbackRef
        .current(code)
        .then(() => {
          // Remove OAuth parameters from URL
          navigate(location.pathname, { replace: true })
        })
        .catch((error) => {
          console.error('OAuth callback error:', error)
        })
        .finally(() => {
          setIsProcessingCallback(false)
        })
    }
  }, [location.search, navigate, location.pathname])

  // Check connection status on mount if partId is provided
  useEffect(() => {
    if (partId) {
      checkConnectionStatusRef.current(projectId, partId)
    }
  }, [projectId, partId])

  // Handle repository selection and connection
  const handleConnectRepository = async () => {
    if (!selectedPart || !selectedRepo) {
      return
    }

    const selectedRepository = repositories.find((r) => r.htmlUrl === selectedRepo)
    if (!selectedRepository) {
      return
    }

    try {
      await connectRepoToPart(projectId, selectedPart, selectedRepo, '')
      // Clear selections after successful connection
      setSelectedPart('')
      setSelectedRepo('')
    } catch (error) {
      console.error('Failed to connect repository:', error)
    }
  }

  // Handle creating new project part
  const handleCreatePart = async () => {
    if (!newPartData.name || !newPartData.programmingLanguage || !newPartData.framework) {
      return
    }

    try {
      const result = await createNewProjectPart(projectId, newPartData)
      if (result) {
        // Add the new part to the local state
        const newPart = {
          id: result.id || `part-${Date.now()}`,
          name: newPartData.name,
          programmingLanguage: newPartData.programmingLanguage,
          framework: newPartData.framework,
          isConnected: false
        }
        setProjectPartsData([...projectParts, newPart])
        setSelectedPart(newPart.id)

        // Reset form
        setNewPartData({ name: '', programmingLanguage: '', framework: '' })
        setShowCreatePartDialog(false)
      }
    } catch (error) {
      console.error('Failed to create project part:', error)
    }
  }

  // Mock project parts for demo (since backend doesn't have GET endpoint)
  const mockProjectParts = [
    { id: 'part-1', name: 'Frontend', programmingLanguage: 'TypeScript', framework: 'React', isConnected: false },
    { id: 'part-2', name: 'Backend', programmingLanguage: 'C#', framework: '.NET', isConnected: false },
    { id: 'part-3', name: 'Database', programmingLanguage: 'SQL', framework: 'Entity Framework', isConnected: false }
  ]

  // Initialize project parts if empty
  useEffect(() => {
    if (projectParts.length === 0) {
      setProjectPartsData(mockProjectParts)
    }
  }, [projectParts.length, setProjectPartsData])

  if (isProcessingCallback) {
    return (
      <Card>
        <CardContent className='flex items-center justify-center p-6'>
          <div className='text-center'>
            <Loader className='mx-auto mb-4' />
            <p>Processing GitHub OAuth callback...</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className='space-y-6'>
      <Card>
        <CardHeader>
          <CardTitle>GitHub Integration</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue='status' className='w-full'>
            <TabsList className='grid w-full grid-cols-3'>
              <TabsTrigger value='status'>Connection Status</TabsTrigger>
              <TabsTrigger value='oauth'>OAuth Setup</TabsTrigger>
              <TabsTrigger value='connect'>Connect Repository</TabsTrigger>
            </TabsList>

            <TabsContent value='status' className='space-y-4'>
              <div className='flex items-center justify-between'>
                <div>
                  <h3 className='text-lg font-medium'>GitHub Connection</h3>
                  <p className='text-sm text-gray-600'>
                    {connectionStatus?.isConnected
                      ? `Connected as ${connectionStatus.username}`
                      : 'Not connected to GitHub'}
                  </p>
                </div>
                <Badge variant={connectionStatus?.isConnected ? 'default' : 'secondary'}>
                  {connectionStatus?.isConnected ? 'Connected' : 'Disconnected'}
                </Badge>
              </div>

              {connectionStatus?.isConnected && (
                <div className='flex items-center gap-3 p-3 bg-green-50 rounded-lg'>
                  <div className='w-8 h-8 bg-green-100 rounded-full flex items-center justify-center'>
                    <span className='text-green-600 text-sm'>✓</span>
                  </div>
                  <div>
                    <p className='font-medium text-green-900'>GitHub Connected</p>
                    <p className='text-sm text-green-700'>You can now connect repositories to your project parts</p>
                  </div>
                </div>
              )}
            </TabsContent>

            <TabsContent value='oauth' className='space-y-4'>
              {!connectionStatus?.isConnected ? (
                <div className='space-y-4'>
                  <div>
                    <h3 className='text-lg font-medium mb-2'>Connect to GitHub</h3>
                    <p className='text-sm text-gray-600 mb-4'>
                      Connect your GitHub account to enable repository integration
                    </p>
                  </div>

                  <Button onClick={startGitHubOAuth} disabled={oauthLoading} className='w-full'>
                    {oauthLoading ? (
                      <>
                        <Loader className='mr-2 h-4 w-4' />
                        Connecting...
                      </>
                    ) : (
                      'Connect with GitHub'
                    )}
                  </Button>
                </div>
              ) : (
                <div className='flex items-center gap-3 p-3 bg-green-50 rounded-lg'>
                  <div className='w-8 h-8 bg-green-100 rounded-full flex items-center justify-center'>
                    <span className='text-green-600 text-sm'>✓</span>
                  </div>
                  <div>
                    <p className='font-medium text-green-900'>Already Connected</p>
                    <p className='text-sm text-green-700'>Your GitHub account is connected and ready to use</p>
                  </div>
                </div>
              )}
            </TabsContent>

            <TabsContent value='connect' className='space-y-4'>
              {!connectionStatus?.isConnected ? (
                <div className='text-center py-8'>
                  <p className='text-gray-600 mb-4'>Please connect to GitHub first to access repositories</p>
                  <Button onClick={startGitHubOAuth} disabled={oauthLoading}>
                    {oauthLoading ? (
                      <>
                        <Loader className='mr-2 h-4 w-4' />
                        Connecting...
                      </>
                    ) : (
                      'Connect with GitHub'
                    )}
                  </Button>
                </div>
              ) : (
                <div className='space-y-4'>
                  <div className='flex items-center justify-between'>
                    <h3 className='text-lg font-medium'>Connect Repository</h3>
                    <Dialog open={showCreatePartDialog} onOpenChange={setShowCreatePartDialog}>
                      <DialogTrigger asChild>
                        <Button variant='outline' size='sm'>
                          Create New Part
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Create New Project Part</DialogTitle>
                        </DialogHeader>
                        <div className='space-y-4'>
                          <div>
                            <Label htmlFor='partName'>Part Name</Label>
                            <Input
                              id='partName'
                              value={newPartData.name}
                              onChange={(e) => setNewPartData((prev) => ({ ...prev, name: e.target.value }))}
                              placeholder='e.g., Frontend, Backend, Database'
                            />
                          </div>
                          <div>
                            <Label htmlFor='programmingLanguage'>Programming Language</Label>
                            <Select
                              value={newPartData.programmingLanguage}
                              onValueChange={(value) =>
                                setNewPartData((prev) => ({ ...prev, programmingLanguage: value }))
                              }
                            >
                              <SelectTrigger>
                                <SelectValue placeholder='Select language' />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value='TypeScript'>TypeScript</SelectItem>
                                <SelectItem value='JavaScript'>JavaScript</SelectItem>
                                <SelectItem value='C#'>C#</SelectItem>
                                <SelectItem value='Java'>Java</SelectItem>
                                <SelectItem value='Python'>Python</SelectItem>
                                <SelectItem value='Go'>Go</SelectItem>
                                <SelectItem value='Rust'>Rust</SelectItem>
                                <SelectItem value='PHP'>PHP</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <Label htmlFor='framework'>Framework</Label>
                            <Select
                              value={newPartData.framework}
                              onValueChange={(value) => setNewPartData((prev) => ({ ...prev, framework: value }))}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder='Select framework' />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value='React'>React</SelectItem>
                                <SelectItem value='Vue'>Vue</SelectItem>
                                <SelectItem value='Angular'>Angular</SelectItem>
                                <SelectItem value='.NET'>.NET</SelectItem>
                                <SelectItem value='Spring'>Spring</SelectItem>
                                <SelectItem value='Django'>Django</SelectItem>
                                <SelectItem value='Express'>Express</SelectItem>
                                <SelectItem value='Laravel'>Laravel</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <Button onClick={handleCreatePart} disabled={creatingPart} className='w-full'>
                            {creatingPart ? (
                              <>
                                <Loader className='mr-2 h-4 w-4' />
                                Creating...
                              </>
                            ) : (
                              'Create Part'
                            )}
                          </Button>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>

                  <Separator />

                  <div className='space-y-4'>
                    <div>
                      <Label htmlFor='projectPart'>Project Part</Label>
                      <Select value={selectedPart} onValueChange={setSelectedPart}>
                        <SelectTrigger>
                          <SelectValue placeholder='Select a project part' />
                        </SelectTrigger>
                        <SelectContent>
                          {projectParts.map((part) => (
                            <SelectItem key={part.id} value={part.id}>
                              {part.name} ({part.programmingLanguage} + {part.framework})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor='repository'>GitHub Repository</Label>
                      <Select value={selectedRepo} onValueChange={setSelectedRepo}>
                        <SelectTrigger>
                          <SelectValue placeholder='Select a repository' />
                        </SelectTrigger>
                        <SelectContent>
                          {repositories.map((repo) => (
                            <SelectItem key={repo.id} value={repo.htmlUrl}>
                              {repo.fullName}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <Button
                      onClick={handleConnectRepository}
                      disabled={!selectedPart || !selectedRepo || connectingRepo}
                      className='w-full'
                    >
                      {connectingRepo ? (
                        <>
                          <Loader className='mr-2 h-4 w-4' />
                          Connecting...
                        </>
                      ) : (
                        'Connect Repository'
                      )}
                    </Button>
                  </div>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}
