import { connectRepoToPart, createProjectPart } from '@/api/projectParts'
import { Navbar } from '@/components/Navbar'
import { Sidebar } from '@/components/Sidebar'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Loader } from '@/components/ui/loader'
import { useToastContext } from '@/components/ui/ToastContext'
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
  id: string;
  name: string;
  programmingLanguage: string;
  framework: string;
  repoUrl?: string;
  ownerId?: string;
  ownerName?: string;
  avatrarUrl?: string;
}

export default function ProjectGitHub() {
  const { projectId: urlProjectId } = useParams<{ projectId: string }>()
  const { currentProject, isLoading } = useCurrentProject()
  const { showToast } = useToastContext()

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
  const [lastConnectedPartId, setLastConnectedPartId] = useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true)
    try {
      const res = await axiosClient.get('/api/github/connection-status')
      setConnectionStatus(res.data.data)
      if (res.data.data) {
        const repoRes = await axiosClient.get('/api/github/repos')
        setRepos(repoRes.data.data)
      }
      // Lấy parts từ backend nếu có API
      if (projectId) {
        try {
          const partsRes = await axiosClient.get(`/projects/${projectId}/parts`)
          setParts(partsRes.data.data)
        } catch (err) {
          setParts([])
        }
      }
    } catch (err) {
      setError('Error loading data')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
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
    e.preventDefault();
    if (!newPart.name.trim()) {
      showToast({ title: 'Error', description: 'Please fill in all fields (Name is required)', variant: 'destructive' });
      return;
    }
    setCreatingPart(true);
    setError(null);
    try {
      const response = await createProjectPart(projectId!, {
        name: newPart.name,
        programmingLanguage: newPart.programmingLanguage || 'None',
        framework: newPart.framework || 'None',
      });
      let partId = response.data;
      if (typeof partId === 'object' && partId.id) {
        partId = partId.id;
      }
      const newPartWithId = {
        id: partId,
        name: newPart.name,
        programmingLanguage: newPart.programmingLanguage,
        framework: newPart.framework
      };
      setParts((prev) => [...prev, newPartWithId]);
      setShowCreatePart(false);
      setNewPart({ name: '', programmingLanguage: '', framework: '' });
      showToast({ title: 'Success', description: 'Project Part created successfully!' });
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || err.response?.data?.error || err.message || 'Error creating project part';
      showToast({ title: 'Error', description: errorMessage, variant: 'destructive' });
    } finally {
      setCreatingPart(false);
    }
  }

  const handleConnectRepo = async () => {
    if (!selectedRepo || !selectedPart) {
      setError('Please select both repository and project part')
      return
    }
    setConnecting(true)
    setError(null)
    setSuccess(null)
    try {
      await connectRepoToPart(projectId!, selectedPart, { 
        repoUrl: selectedRepo
      })
      setSuccess('Repository connected to Project Part successfully!')
      setSelectedRepo('')
      setSelectedPart('')
      setLastConnectedPartId(selectedPart)
      await fetchData();
    } catch (err: any) {
      console.error('Error connecting repository:', err)
      const errorMessage = err.response?.data?.message || 
                          err.response?.data?.error || 
                          err.message || 
                          'Error connecting repository to Project Part'
      setError(errorMessage)
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
      <Sidebar isOpen={isSidebarOpen} onToggle={toggleSidebar} currentProject={currentProject} connectionStatus={connectionStatus} />
      <div className='flex-1 flex flex-col overflow-hidden'>
        <Navbar isSidebarOpen={isSidebarOpen} toggleSidebar={toggleSidebar} />
        <div className='flex-1 overflow-y-auto flex flex-col items-center justify-center p-6'>
          <div className='mb-8 w-full max-w-2xl'>
            <h1 className='text-4xl font-extrabold text-lavender-700 flex items-center gap-4 justify-center mb-2 drop-shadow'>
              <Github className='h-10 w-10 text-lavender-500' />
              GitHub Integration
            </h1>
            <p className='text-blue-700 text-center text-lg font-medium'>
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
          <Card className='w-full max-w-2xl mb-8 shadow-2xl border-0 bg-white/95 rounded-2xl'>
            <CardHeader className='flex flex-col items-center pb-0'>
              {connectionStatus ? (
                <span className='flex items-center gap-2 text-green-600 font-bold text-xl mb-2'>
                  <CheckCircle className='h-6 w-6' /> Connected to GitHub
                </span>
              ) : (
                <span className='flex items-center gap-2 text-lavender-400 font-bold text-xl mb-2'>
                  <XCircle className='h-6 w-6' /> Not Connected
                </span>
              )}
              <p className='text-lavender-700 mt-1 text-center text-base font-medium'>
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
                <div className='text-lavender-400 text-center py-8 text-lg font-semibold'>
                  No repositories found in your GitHub account.
                </div>
              ) : (
                <>
                  <div className='mb-6 space-y-4'>
                    <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                      <div>
                        <label className='block font-semibold mb-2 text-lavender-700'>Select Repository</label>
                        <select
                          className='w-full bg-lavender-50 border-2 border-lavender-200 rounded-xl px-4 py-3 text-base text-lavender-700 font-medium focus:ring-2 focus:ring-lavender-400 placeholder:text-lavender-300 shadow-none'
                          value={selectedRepo}
                          onChange={(e) => setSelectedRepo(e.target.value)}
                        >
                          <option value=''>-- Select a repository --</option>
                          {repos.map((repo) => (
                            <option key={repo.fullName} value={repo.htmlUrl} className='text-blue-700'>
                              {repo.fullName}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className='block font-semibold mb-2 text-lavender-700'>Select Project Part</label>
                        <select
                          className='w-full bg-lavender-50 border-2 border-lavender-200 rounded-xl px-4 py-3 text-base text-lavender-700 font-medium focus:ring-2 focus:ring-lavender-400 placeholder:text-lavender-300 shadow-none'
                          value={selectedPart}
                          onChange={(e) => setSelectedPart(e.target.value)}
                        >
                          <option value=''>-- Select a part --</option>
                          {parts
                            .filter((part) => !(part.repoUrl && part.ownerId && part.ownerName && part.avatrarUrl))
                            .map((part) => (
                              <option key={part.id} value={part.id} className='text-purple-700'>
                                {part.name} ({part.programmingLanguage}, {part.framework})
                              </option>
                            ))}
                        </select>
                        <Button
                          variant='link'
                          className='mt-2 p-0 text-blue-600 text-base font-semibold'
                          onClick={() => setShowCreatePart(true)}
                        >
                          + Create new part
                        </Button>
                      </div>
                    </div>
                    <div>
                      {/* Đã xoá input accessToken ở đây */}
                    </div>
                  </div>
                  <Button
                    onClick={handleConnectRepo}
                    disabled={!selectedRepo || !selectedPart || connecting}
                    className='w-full py-4 text-lg font-bold bg-gradient-to-r from-lavender-500 to-blue-400 hover:from-lavender-600 hover:to-blue-500 text-white shadow-lg rounded-2xl disabled:opacity-60 disabled:cursor-not-allowed mt-4'
                    size='lg'
                  >
                    {connecting ? (
                      <>
                        <Loader className='mr-2 h-5 w-5 animate-spin' />
                        Connecting...
                      </>
                    ) : (
                      'Connect Repository to Project Part'
                    )}
                  </Button>
                </>
              )}
            </CardContent>
          </Card>
          {showCreatePart && (
            <Card className='w-full max-w-xl mb-8 shadow-2xl border-0 bg-white/95 rounded-2xl animate-fade-in'>
              <CardHeader>
                <CardTitle className='text-2xl font-extrabold text-lavender-700 mb-2 drop-shadow'>Create Project Part</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleCreatePart} className='space-y-6'>
                  <div>
                    <label className='block font-semibold mb-1 text-lavender-700'>Name</label>
                    <Input
                      value={newPart.name}
                      onChange={(e) => setNewPart({ ...newPart, name: e.target.value })}
                      required
                      placeholder='Enter part name...'
                      className='py-3 px-4 text-base bg-lavender-50 border-2 border-lavender-200 rounded-xl focus:ring-2 focus:ring-lavender-400 placeholder:text-lavender-300 text-lavender-700 font-medium'
                    />
                  </div>
                  <div>
                    <label className='block font-semibold mb-1 text-lavender-700'>Programming Language</label>
                    <select
                      value={newPart.programmingLanguage}
                      onChange={e => setNewPart({ ...newPart, programmingLanguage: e.target.value })}
                      required
                      className='py-3 px-4 text-base w-full bg-lavender-50 border-2 border-lavender-200 rounded-xl text-lavender-700 font-medium focus:ring-2 focus:ring-lavender-400'
                    >
                      <option value='None'>🟣 None</option>
                      <option value='Csharp'>⚙️ C#</option>
                      <option value='Java'>☕ Java</option>
                      <option value='JavaScript'>🟨 JavaScript</option>
                      <option value='TypeScript'>🟦 TypeScript</option>
                      <option value='Python'>🐍 Python</option>
                      <option value='PHP'>🐘 PHP</option>
                      <option value='Go'>💙 Go</option>
                      <option value='Ruby'>💎 Ruby</option>
                      <option value='CPlusPlus'>🔵 C++</option>
                      <option value='Swift'>🦅 Swift</option>
                      <option value='Kotlin'>🟪 Kotlin</option>
                    </select>
                  </div>
                  <div>
                    <label className='block font-semibold mb-1 text-lavender-700'>Framework</label>
                    <select
                      value={newPart.framework}
                      onChange={e => setNewPart({ ...newPart, framework: e.target.value })}
                      required
                      className='py-3 px-4 text-base w-full bg-lavender-50 border-2 border-lavender-200 rounded-xl text-lavender-700 font-medium focus:ring-2 focus:ring-lavender-400'
                    >
                      <option value='None'>🟣 None</option>
                      <option value='ASPNETCore'>🌐 ASP.NET Core</option>
                      <option value='DotNetCore'>⚙️ .NET Core</option>
                      <option value='SpringBoot'>🌱 Spring Boot</option>
                      <option value='ExpressJs'>🚂 Express.js</option>
                      <option value='NestJs'>🦉 NestJS</option>
                      <option value='React'>⚛️ React</option>
                      <option value='Angular'>🅰️ Angular</option>
                      <option value='VueJs'>🟩 Vue.js</option>
                      <option value='NextJs'>⏭️ Next.js</option>
                      <option value='NuxtJs'>🟩 Nuxt.js</option>
                      <option value='Django'>🌿 Django</option>
                      <option value='Flask'>🍶 Flask</option>
                      <option value='FastAPI'>⚡ FastAPI</option>
                      <option value='Laravel'>🟥 Laravel</option>
                      <option value='RubyOnRails'>🚄 Ruby on Rails</option>
                      <option value='Ktor'>🦄 Ktor</option>
                    </select>
                  </div>
                  <div className='flex gap-4 justify-end mt-6'>
                    <button
                      type='button'
                      onClick={() => setShowCreatePart(false)}
                      className='text-blue-600 hover:underline font-semibold text-base bg-transparent border-0 shadow-none px-0'
                    >
                      Cancel
                    </button>
                    <Button
                      type='submit'
                      disabled={creatingPart}
                      className='px-8 py-3 text-lg font-bold bg-gradient-to-r from-lavender-500 to-blue-400 hover:from-lavender-600 hover:to-blue-500 text-white shadow-lg rounded-2xl disabled:opacity-60 disabled:cursor-not-allowed'
                    >
                      {creatingPart ? 'Creating...' : 'Create Part'}
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
