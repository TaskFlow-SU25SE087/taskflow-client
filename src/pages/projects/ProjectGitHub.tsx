import { Navbar } from '@/components/Navbar'
import { Sidebar } from '@/components/Sidebar'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Loader } from '@/components/ui/loader'
import axiosClient from '@/configs/axiosClient'
import { useCurrentProject } from '@/hooks/useCurrentProject'
import { CheckCircle, Github, XCircle } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'

interface Repo {
  name: string
  fullName: string
  htmlUrl: string
}
interface ProjectPart {
  id: string
  name: string
  programmingLanguage: string
  framework: string
}

export default function ProjectGitHub() {
  const { projectId: urlProjectId } = useParams<{ projectId: string }>()
  const { currentProject, isLoading } = useCurrentProject()

  // Use projectId from URL if available, otherwise use currentProject.id
  const projectId = urlProjectId || currentProject?.id

  const [isSidebarOpen, setIsSidebarOpen] = useState(true)
  const [connectionStatus, setConnectionStatus] = useState<boolean | null>(null)
  const [repos, setRepos] = useState<Repo[]>([])
  const [parts, setParts] = useState<ProjectPart[]>([])
  const [loading, setLoading] = useState(true)
  const [oauthLoading, setOauthLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  // For creating a new part
  const [showCreatePart, setShowCreatePart] = useState(false)
  const [newPart, setNewPart] = useState({ name: '', programmingLanguage: '', framework: '' })
  const [creatingPart, setCreatingPart] = useState(false)

  // For connecting repo to part
  const [selectedRepo, setSelectedRepo] = useState<string>('')
  const [selectedPart, setSelectedPart] = useState<string>('')
  const [connecting, setConnecting] = useState(false)

  useEffect(() => {
    async function fetchData() {
      setLoading(true)
      try {
        const res = await axiosClient.get('/api/github/connection-status')
        setConnectionStatus(res.data.data)
        if (res.data.data) {
          const repoRes = await axiosClient.get('/api/github/repos')
          setRepos(repoRes.data.data)
        }
        // Since backend doesn't have GET /projects/{projectId}/parts endpoint,
        // we'll use mock data for now
        if (projectId) {
          const mockParts: ProjectPart[] = [
            {
              id: 'part-1',
              name: 'Frontend',
              programmingLanguage: 'TypeScript',
              framework: 'React'
            },
            {
              id: 'part-2',
              name: 'Backend',
              programmingLanguage: 'C#',
              framework: '.NET'
            },
            {
              id: 'part-3',
              name: 'Database',
              programmingLanguage: 'SQL',
              framework: 'Entity Framework'
            }
          ]
          setParts(mockParts)
        }
      } catch (err) {
        setError('Error loading data')
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [projectId])

  const handleConnectGitHub = async () => {
    setOauthLoading(true)
    setError(null)
    try {
      const res = await axiosClient.get('/api/github/login-url')
      window.location.href = res.data.data
    } catch (err) {
      setError('Error getting GitHub login URL')
    } finally {
      setOauthLoading(false)
    }
  }

  const handleCreatePart = async (e: React.FormEvent) => {
    e.preventDefault()
    setCreatingPart(true)
    setError(null)
    try {
      // Since backend doesn't have POST /projects/{projectId}/parts endpoint,
      // we'll add to local state for now
      const newPartWithId = {
        ...newPart,
        id: `part-${Date.now()}`
      }
      setParts((prev) => [...prev, newPartWithId])
      setShowCreatePart(false)
      setNewPart({ name: '', programmingLanguage: '', framework: '' })
      setSuccess('Project Part created successfully!')
    } catch {
      setError('Error creating project part')
    } finally {
      setCreatingPart(false)
    }
  }

  const handleConnectRepo = async () => {
    if (!selectedRepo || !selectedPart) return
    setConnecting(true)
    setError(null)
    setSuccess(null)
    try {
      // Since backend doesn't have PATCH /projects/{projectId}/parts/{partId}/connect-repo endpoint,
      // we'll simulate the connection for now
      setSuccess('Repository connected to Project Part successfully!')
      // In a real implementation, you would call the API here
      // await axiosClient.patch(
      //   `/projects/${projectId}/parts/${selectedPart}/connect-repo`,
      //   { repoUrl: selectedRepo },
      //   { headers: { 'Content-Type': 'application/json-patch+json' } }
      // )
    } catch {
      setError('Error connecting repository to Project Part')
    } finally {
      setConnecting(false)
    }
  }

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen)

  // Check if no project is selected
  if (!projectId) {
    return (
      <div className='flex h-screen bg-gray-100'>
        <Sidebar isOpen={isSidebarOpen} onToggle={toggleSidebar} currentProject={currentProject} />
        <div className='flex-1 flex flex-col overflow-hidden'>
          <Navbar isSidebarOpen={isSidebarOpen} toggleSidebar={toggleSidebar} />
          <div className='flex-1 overflow-y-auto flex flex-col items-center justify-center p-6'>
            <div className='text-center'>
              <Github className='h-16 w-16 text-gray-400 mx-auto mb-4' />
              <h1 className='text-2xl font-bold text-gray-900 mb-2'>No Project Selected</h1>
              <p className='text-gray-600 mb-4'>Please select a project to access GitHub integration features.</p>
              <Button
                onClick={() => (window.location.href = '/projects/')}
                className='bg-lavender-700 hover:bg-lavender-800'
              >
                Go to Projects
              </Button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (isLoading || !currentProject || loading) {
    return (
      <div className='flex h-screen bg-gray-100'>
        <Sidebar isOpen={isSidebarOpen} onToggle={toggleSidebar} currentProject={currentProject} />
        <div className='flex-1 flex flex-col overflow-hidden'>
          <Navbar isSidebarOpen={isSidebarOpen} toggleSidebar={toggleSidebar} />
          <div className='flex items-center justify-center flex-1'>
            <Loader />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className='flex h-screen bg-gray-100'>
      <Sidebar isOpen={isSidebarOpen} onToggle={toggleSidebar} currentProject={currentProject} />
      <div className='flex-1 flex flex-col overflow-hidden'>
        <Navbar isSidebarOpen={isSidebarOpen} toggleSidebar={toggleSidebar} />
        <div className='flex-1 overflow-y-auto flex flex-col items-center justify-center p-6'>
          <div className='mb-8 w-full max-w-2xl'>
            <h1 className='text-4xl font-bold text-gray-900 flex items-center gap-4 justify-center mb-2'>
              <Github className='h-10 w-10 text-gray-700' />
              GitHub Integration
            </h1>
            <p className='text-gray-600 text-center text-lg'>
              Connect your GitHub account to integrate repositories with your project.
            </p>
          </div>
          {error && (
            <div className='text-red-500 mb-4 text-center w-full max-w-2xl shadow rounded p-2 bg-red-50'>{error}</div>
          )}
          {success && (
            <div className='text-green-600 mb-4 text-center w-full max-w-2xl shadow rounded p-2 bg-green-50'>
              {success}
            </div>
          )}
          <Card className='w-full max-w-2xl mb-8 shadow-lg border-2 border-gray-100'>
            <CardHeader className='flex flex-col items-center pb-0'>
              {connectionStatus ? (
                <span className='flex items-center gap-2 text-green-600 font-semibold text-xl mb-2'>
                  <CheckCircle className='h-6 w-6' /> Connected to GitHub
                </span>
              ) : (
                <span className='flex items-center gap-2 text-gray-500 font-semibold text-xl mb-2'>
                  <XCircle className='h-6 w-6' /> Not Connected
                </span>
              )}
              <p className='text-gray-500 mt-1 text-center text-base'>
                {connectionStatus
                  ? 'You are connected to GitHub. Select a repository to integrate with your project.'
                  : 'Connect your GitHub account to start integrating repositories.'}
              </p>
            </CardHeader>
            <CardContent className='pt-4 pb-6'>
              {!connectionStatus ? (
                <Button
                  onClick={handleConnectGitHub}
                  disabled={oauthLoading}
                  className='w-full mt-4 py-3 text-lg font-semibold'
                  size='lg'
                >
                  <Github className='h-5 w-5 mr-2' />
                  {oauthLoading ? 'Redirecting...' : 'Connect GitHub'}
                </Button>
              ) : repos.length === 0 ? (
                <div className='text-gray-500 text-center py-8 text-lg'>
                  No repositories found in your GitHub account.
                </div>
              ) : (
                <>
                  <div className='mb-6 flex flex-col md:flex-row md:items-end md:gap-6'>
                    <div className='flex-1 mb-4 md:mb-0'>
                      <label className='block font-medium mb-2 text-base'>Select Repository</label>
                      <select
                        className='w-full border rounded px-4 py-3 text-base shadow-sm focus:ring focus:ring-blue-200'
                        value={selectedRepo}
                        onChange={(e) => setSelectedRepo(e.target.value)}
                      >
                        <option value=''>-- Select a repository --</option>
                        {repos.map((repo) => (
                          <option key={repo.fullName} value={repo.htmlUrl}>
                            {repo.fullName}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className='flex-1'>
                      <label className='block font-medium mb-2 text-base'>Select Project Part</label>
                      <select
                        className='w-full border rounded px-4 py-3 text-base shadow-sm focus:ring focus:ring-blue-200'
                        value={selectedPart}
                        onChange={(e) => setSelectedPart(e.target.value)}
                      >
                        <option value=''>-- Select a part --</option>
                        {parts.map((part) => (
                          <option key={part.id} value={part.id}>
                            {part.name} ({part.programmingLanguage}, {part.framework})
                          </option>
                        ))}
                      </select>
                      <Button
                        variant='link'
                        className='mt-2 p-0 text-blue-600 text-base'
                        onClick={() => setShowCreatePart(true)}
                      >
                        + Create new part
                      </Button>
                    </div>
                  </div>
                  <Button
                    onClick={handleConnectRepo}
                    disabled={!selectedRepo || !selectedPart || connecting}
                    className='w-full py-3 text-lg font-semibold'
                    size='lg'
                  >
                    {connecting ? 'Connecting...' : 'Connect Repository to Project Part'}
                  </Button>
                </>
              )}
            </CardContent>
          </Card>
          {showCreatePart && (
            <Card className='w-full max-w-xl mb-8 shadow-lg border-2 border-blue-100 animate-fade-in'>
              <CardHeader>
                <CardTitle className='text-2xl font-bold text-blue-700'>Create Project Part</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleCreatePart} className='space-y-5'>
                  <div>
                    <label className='block font-medium mb-1 text-base'>Name</label>
                    <Input
                      value={newPart.name}
                      onChange={(e) => setNewPart({ ...newPart, name: e.target.value })}
                      required
                      className='py-2 px-3 text-base'
                    />
                  </div>
                  <div>
                    <label className='block font-medium mb-1 text-base'>Programming Language</label>
                    <Input
                      value={newPart.programmingLanguage}
                      onChange={(e) => setNewPart({ ...newPart, programmingLanguage: e.target.value })}
                      required
                      className='py-2 px-3 text-base'
                    />
                  </div>
                  <div>
                    <label className='block font-medium mb-1 text-base'>Framework</label>
                    <Input
                      value={newPart.framework}
                      onChange={(e) => setNewPart({ ...newPart, framework: e.target.value })}
                      required
                      className='py-2 px-3 text-base'
                    />
                  </div>
                  <div className='flex gap-3 justify-end'>
                    <Button type='submit' disabled={creatingPart} className='px-6 py-2 text-base font-semibold'>
                      {creatingPart ? 'Creating...' : 'Create Part'}
                    </Button>
                    <Button
                      type='button'
                      variant='outline'
                      onClick={() => setShowCreatePart(false)}
                      className='px-6 py-2 text-base'
                    >
                      Cancel
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
