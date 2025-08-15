import { connectRepoToPart, createProjectPart } from '@/api/projectParts'
import { Navbar } from '@/components/Navbar'
import { Sidebar } from '@/components/Sidebar'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Loader } from '@/components/ui/loader'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useToastContext } from '@/components/ui/ToastContext'
import axiosClient from '@/configs/axiosClient'
import { useGitHubStatus } from '@/contexts/GitHubStatusContext'
import { useCurrentProject } from '@/hooks/useCurrentProject'
import { extractPartId, processPartsData, validatePartId, type ProjectPart } from '@/utils/partIdHelper'
import { ArrowRight, CheckCircle, Github, Plus, XCircle } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'

interface Repo {
  name: string
  fullName: string
  htmlUrl: string
}

export default function ProjectGitHub() {
  const { projectId: urlProjectId } = useParams<{ projectId: string }>()
  const { currentProject, isLoading } = useCurrentProject()
  const { showToast } = useToastContext()
  const { updateConnectionStatus } = useGitHubStatus()

  const projectId = urlProjectId || currentProject?.id

  const [isSidebarOpen, setIsSidebarOpen] = useState(true)
  const [connectionStatus, setConnectionStatus] = useState<boolean | null>(null)
  const [repos, setRepos] = useState<Repo[]>([])
  const [parts, setParts] = useState<ProjectPart[]>([])
  const [loading, setLoading] = useState(true)
  const [oauthLoading, setOauthLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  
  // UI States
  const [showCreatePart, setShowCreatePart] = useState(false)
  const [newPart, setNewPart] = useState({ name: '', programmingLanguage: '', framework: '' })
  const [creatingPart, setCreatingPart] = useState(false)
  const [selectedRepo, setSelectedRepo] = useState<string>('')
  const [selectedPart, setSelectedPart] = useState<string>('')
  const [connecting, setConnecting] = useState(false)
  const [currentStep, setCurrentStep] = useState<'select' | 'create' | 'connect'>('select')
  const [newlyCreatedPartId, setNewlyCreatedPartId] = useState<string | null>(null)

  const fetchData = async () => {
    setLoading(true)
    try {
      const res = await axiosClient.get('/api/github/connection-status')
      const status = res.data.data
      setConnectionStatus(status)
      updateConnectionStatus(status)
      
      if (status) {
        const repoRes = await axiosClient.get('/api/github/repos')
        setRepos(repoRes.data.data)
      }
      
      if (projectId) {
        try {
          const partsRes = await axiosClient.get(`/projects/${projectId}/parts`)
          let partsData = partsRes.data.data || partsRes.data || []
          const processedParts = processPartsData(partsData)
          setParts(processedParts)
        } catch (err) {
          setParts([])
        }
      }
    } catch (err) {
      setError('Error loading data')
      updateConnectionStatus(null)
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
    e.preventDefault()
    if (!newPart.name.trim()) {
      showToast({ title: 'Error', description: 'Please fill in all fields (Name is required)', variant: 'destructive' })
      return
    }
    
    setCreatingPart(true)
    setError(null)
    try {
      const response = await createProjectPart(projectId!, {
        name: newPart.name,
        programmingLanguage: newPart.programmingLanguage || 'None',
        framework: newPart.framework || 'None',
      })
      
      const partId = extractPartId(response.data)
      
      if (!partId && response.data && typeof response.data === 'string' && response.data.includes('successfully')) {
        // Success case - create a temporary part object to show immediately
        const tempPart: ProjectPart = {
          id: `temp-${Date.now()}`, // Temporary ID
          name: newPart.name,
          programmingLanguage: newPart.programmingLanguage || 'None',
          framework: newPart.framework || 'None',
          repoUrl: '',
          ownerId: '',
          ownerName: '',
          avatrarUrl: ''
        }
        
        // Add to parts state immediately
        setParts(prevParts => [tempPart, ...prevParts])
        
        const partName = newPart.name // Store the name before resetting
        setNewPart({ name: '', programmingLanguage: '', framework: '' })
        setShowCreatePart(false)
        showToast({ title: 'Success', description: 'Project part created successfully!' })
        
        // Auto-select the newly created part
        setSelectedPart(tempPart.id)
            setCurrentStep('connect')
        
        // Mark this part as newly created
        setNewlyCreatedPartId(tempPart.id)
        
        setSuccess(`✅ Project part "${partName}" created successfully! Now connect a repository.`)
        
        // Fetch fresh data in background to get the real part ID
        setTimeout(async () => {
          const oldParts = parts // Store current parts before fetch
          await fetchData()
          // After fetching, try to find the newly created part by name
          const realPart = parts.find(part => part.name === partName && !part.id.startsWith('temp-'))
          if (realPart) {
            setNewlyCreatedPartId(realPart.id)
            // Remove temporary part and add real part
            setParts(prevParts => prevParts.filter(p => p.id !== tempPart.id).map(p => p.id === realPart.id ? realPart : p))
          } else {
            // Keep temporary part if real part not found
          }
        }, 500)
        
        return
      }
      
      if (!partId) {
        setError('Failed to create project part. Please try again.')
        setSuccess(null)
        return
      }
      
      // Success with valid partId - create a temporary part object
      const tempPart: ProjectPart = {
        id: partId,
        name: newPart.name,
        programmingLanguage: newPart.programmingLanguage || 'None',
        framework: newPart.framework || 'None',
        repoUrl: '',
        ownerId: '',
        ownerName: '',
        avatrarUrl: ''
      }
      
      // Add to parts state immediately
      setParts(prevParts => [tempPart, ...prevParts])
      
      const partName = newPart.name // Store the name before resetting
      setNewPart({ name: '', programmingLanguage: '', framework: '' })
      setShowCreatePart(false)
      showToast({ title: 'Success', description: 'Project part created successfully!' })
      
      // Auto-select the newly created part
      setSelectedPart(tempPart.id)
          setCurrentStep('connect')
      
      // Mark this part as newly created
      setNewlyCreatedPartId(tempPart.id)
      
      setSuccess(`✅ Project part "${partName}" created successfully! Now connect a repository.`)
      
      // Fetch fresh data in background to ensure consistency
      setTimeout(async () => {
        const oldParts = parts // Store current parts before fetch
        await fetchData()
        // After fetching, try to find the newly created part by name
        const realPart = parts.find(part => part.name === partName && !part.id.startsWith('temp-'))
        if (realPart) {
          setNewlyCreatedPartId(realPart.id)
          // Remove temporary part and add real part
          setParts(prevParts => prevParts.filter(p => p.id !== tempPart.id).map(p => p.id === realPart.id ? realPart : p))
        } else {
          // Keep temporary part if real part not found
        }
      }, 500)
      
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 
                          err.response?.data?.error || 
                          err.message || 
                          'Error creating project part'
      setError(`Error creating project part: ${errorMessage}`)
    } finally {
      setCreatingPart(false)
    }
  }

  const handleConnectRepo = async () => {
    if (!selectedRepo || !selectedPart) {
      setError('Please select both repository and project part')
      return
    }
    
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    if (!uuidRegex.test(selectedPart)) {
      setError('Invalid project part ID format. Please select a valid project part.')
      return
    }
    
    if (!validatePartId(selectedPart, parts)) {
      setError('Invalid project part selected. Please try again.')
      return
    }
    
    setConnecting(true)
    setError(null)
    setSuccess(null)
    try {
      await connectRepoToPart(projectId!, selectedPart, { 
        repoUrl: selectedRepo
      })
      
      setSuccess('Repository connected successfully!')
      setSelectedRepo('')
      setSelectedPart('')
      setCurrentStep('select')
      
      // Reset newly created part ID after successful connection
      setNewlyCreatedPartId(null)
      
      await fetchData()
      
    } catch (err: any) {
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
      <Sidebar isOpen={isSidebarOpen} onToggle={toggleSidebar} currentProject={currentProject} />
      <div className='flex-1 flex flex-col overflow-hidden'>
        <Navbar isSidebarOpen={isSidebarOpen} toggleSidebar={toggleSidebar} />
        <div className='flex-1 overflow-y-auto p-6'>
          <div className='max-w-4xl mx-auto'>
            {/* Header */}
            <div className='text-center mb-8'>
              <h1 className='text-3xl font-bold text-gray-900 mb-2 flex items-center justify-center gap-3'>
                <Github className='h-8 w-8 text-gray-600' />
                GitHub Integration
              </h1>
              <p className='text-gray-600'>Connect your GitHub repositories with project parts</p>
            </div>

            {/* Status Messages */}
            {error && (
              <div className='bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6'>{error}</div>
            )}
            {success && (
              <div className='bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg mb-6'>{success}</div>
            )}

            {/* Recently Created Project Part */}
            {success && success.includes('created successfully') && (() => {
              // Extract project part name from success message
              const match = success.match(/Project part "([^"]+)" created successfully/)
              const projectPartName = match ? match[1] : null
              
              if (!projectPartName) {
                return null
              }
              
              // Find the project part by name (either temporary or real)
              const foundPart = parts.find(part => part.name === projectPartName)
              
              return (
                <Card className='mb-6 border-green-200 bg-green-50'>
                  <CardHeader>
                    <CardTitle className='flex items-center gap-2 text-green-800'>
                      <span className='bg-green-200 text-green-800 rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold'>🎉</span>
                      Recently Created Project Part
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {foundPart ? (
                      // Found the part, display it
                      <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'>
                        <div key={foundPart.id} className='p-4 bg-white rounded-lg border-2 border-green-300 shadow-sm'>
                          <div className='flex items-start gap-3'>
                            <div className='w-12 h-12 bg-green-200 rounded-lg flex items-center justify-center flex-shrink-0'>
                              <span className='text-2xl'>📁</span>
                            </div>
                            <div className='flex-1 min-w-0'>
                              <h4 className='font-bold text-green-900 text-lg mb-2 truncate max-w-full' title={foundPart.name}>{foundPart.name}</h4>
                              <div className='space-y-2'>
                                {foundPart.programmingLanguage !== 'None' && (
                                  <div className='flex items-center gap-2'>
                                    <span className='text-sm text-gray-600 flex items-center gap-2'>
                                      {foundPart.programmingLanguage === 'Java' && (
                                        <img src="https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/java/java-original.svg" alt="Java" className='w-4 h-4' />
                                      )}
                                      {foundPart.programmingLanguage === 'Csharp' && (
                                        <img src="https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/csharp/csharp-original.svg" alt="C#" className='w-4 h-4' />
                                      )}
                                      {foundPart.programmingLanguage === 'JavaScript' && (
                                        <img src="https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/javascript/javascript-original.svg" alt="JavaScript" className='w-4 h-4' />
                                      )}
                                      {foundPart.programmingLanguage === 'TypeScript' && (
                                        <img src="https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/typescript/typescript-original.svg" alt="TypeScript" className='w-4 h-4' />
                                      )}
                                      {foundPart.programmingLanguage === 'Python' && (
                                        <img src="https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/python/python-original.svg" alt="Python" className='w-4 h-4' />
                                      )}
                                      {foundPart.programmingLanguage === 'PHP' && (
                                        <img src="https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/php/php-original.svg" alt="PHP" className='w-4 h-4' />
                                      )}
                                      {foundPart.programmingLanguage === 'Go' && (
                                        <img src="https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/go/go-original.svg" alt="Go" className='w-4 h-4' />
                                      )}
                                      {foundPart.programmingLanguage === 'Ruby' && (
                                        <img src="https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/ruby/ruby-original.svg" alt="Ruby" className='w-4 h-4' />
                                      )}
                                      {foundPart.programmingLanguage === 'CPlusPlus' && (
                                        <img src="https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/cplusplus/cplusplus-original.svg" alt="C++" className='w-4 h-4' />
                                      )}
                                      {foundPart.programmingLanguage === 'Swift' && (
                                        <img src="https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/swift/swift-original.svg" alt="Swift" className='w-4 h-4' />
                                      )}
                                      {foundPart.programmingLanguage === 'Kotlin' && (
                                        <img src="https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/kotlin/kotlin-original.svg" alt="Kotlin" className='w-4 h-4' />
                                      )}
                                      {foundPart.programmingLanguage}
                                    </span>
                                  </div>
                                )}
                                {foundPart.framework !== 'None' && (
                                  <div className='flex items-center gap-2'>
                                    <span className='text-sm text-gray-600 flex items-center gap-2'>
                                      {foundPart.framework === 'React' && (
                                        <img src="https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/react/react-original.svg" alt="React" className='w-4 h-4' />
                                      )}
                                      {foundPart.framework === 'Angular' && (
                                        <img src="https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/angularjs/angularjs-original.svg" alt="Angular" className='w-4 h-4' />
                                      )}
                                      {foundPart.framework === 'VueJs' && (
                                        <img src="https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/vuejs/vuejs-original.svg" alt="Vue.js" className='w-4 h-4' />
                                      )}
                                      {foundPart.framework === 'DotNetCore' && (
                                        <img src="https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/dotnetcore/dotnetcore-original.svg" alt=".NET Core" className='w-4 h-4' />
                                      )}
                                      {foundPart.framework === 'SpringBoot' && (
                                        <img src="https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/spring/spring-original.svg" alt="Spring Boot" className='w-4 h-4' />
                                      )}
                                      {foundPart.framework === 'Django' && (
                                        <img src="https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/django/django-original.svg" alt="Django" className='w-4 h-4' />
                                      )}
                                      {foundPart.framework === 'ExpressJs' && (
                                        <img src="https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/express/express-original.svg" alt="Express.js" className='w-4 h-4' />
                                      )}
                                      {foundPart.framework === 'Laravel' && (
                                        <img src="https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/laravel/laravel-original.svg" alt="Laravel" className='w-4 h-4' />
                                      )}
                                      {foundPart.framework}
                                    </span>
                                  </div>
                                )}
                                <div className='pt-2'>
                                  <Button
                                    size='sm'
                                    onClick={() => {
                                      setSelectedPart(foundPart.id)
                                      setCurrentStep('connect')
                                    }}
                                    className='bg-green-600 hover:bg-green-700 text-white w-full'
                                  >
                                    <span className='flex items-center gap-2'>
                                      <span className='text-sm'>🔗</span>
                                      <span className='truncate'>Connect Repository</span>
                                    </span>
                                  </Button>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ) : (
                      // Part not found yet, show loading state with extracted name
                      <div className='text-center py-8 text-gray-500'>
                        <div className='w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3'>
                          <span className='text-2xl'>⏳</span>
                        </div>
                        <p className='text-sm'>Loading project part: <strong className='truncate block max-w-full' title={projectPartName}>{projectPartName}</strong></p>
                        <p className='text-xs text-gray-400 mt-1'>Please wait while we fetch the latest data</p>
                        <div className='mt-4 p-2 bg-yellow-50 border border-yellow-200 rounded text-xs text-yellow-700'>
                          <p>⏳ Project part name: <span className='truncate block max-w-full' title={projectPartName}>{projectPartName}</span></p>
                          <p>⏳ Waiting for server response...</p>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )
            })()}

            {/* GitHub Connection Status */}
            <Card className='mb-6'>
              <CardHeader>
                <CardTitle className='flex items-center gap-2'>
                  {connectionStatus ? (
                    <>
                      <CheckCircle className='h-5 w-5 text-green-600' />
                      Connected to GitHub
                    </>
                  ) : (
                    <>
                      <XCircle className='h-5 w-5 text-red-600' />
                      Not Connected
                    </>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {!connectionStatus ? (
                  <div className='text-center'>
                    <p className='text-gray-600 mb-4'>Connect your GitHub account to start integrating repositories.</p>
                    <Button
                      onClick={handleConnectGitHub}
                      disabled={oauthLoading}
                      className='bg-gray-900 hover:bg-gray-800'
                    >
                      <Github className='h-4 w-4 mr-2' />
                      {oauthLoading ? 'Connecting...' : 'Connect GitHub'}
                    </Button>
                  </div>
                ) : (
                  <p className='text-green-600 font-medium'>✅ You are connected to GitHub</p>
                )}
              </CardContent>
            </Card>

            {/* Main Content - Only show when GitHub is connected */}
            {connectionStatus && (
              <>
                {/* Step 1: Select or Create Project Part */}
                {currentStep === 'select' && (
                  <Card className='mb-6'>
                    <CardHeader>
                      <CardTitle className='flex items-center gap-2'>
                        <span className='bg-blue-100 text-blue-800 rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold'>1</span>
                        Select or Create Project Part
                      </CardTitle>
                    </CardHeader>
                    <CardContent className='space-y-6'>
                      {parts.length > 0 && (
                        <div>
                          <label className='block text-sm font-medium text-gray-700 mb-3'>Existing Project Parts</label>
                          <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3'>
                            {parts
                              .filter((part) => !(part.repoUrl && part.ownerId && part.ownerName && part.avatrarUrl))
                              .map((part) => (
                                <button
                                  key={part.id}
                                  onClick={() => {
                                    setSelectedPart(part.id)
                                    setCurrentStep('connect')
                                  }}
                                  className='p-4 border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-all text-left group'
                                >
                                  <div className='flex items-start gap-3'>
                                    <div className='w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0'>
                                      <span className='text-blue-600 text-lg font-bold'>📁</span>
                                    </div>
                                    <div className='flex-1 min-w-0 overflow-hidden'>
                                      <h4 className='font-medium text-gray-900 group-hover:text-blue-700 transition-colors truncate max-w-full' title={part.name}>
                                        {part.name}
                                      </h4>
                                      <p className='text-sm text-gray-500 mt-1'>
                                        {part.programmingLanguage !== 'None' && (
                                          <span className='flex items-center gap-1'>
                                            {part.programmingLanguage === 'Java' && (
                                              <img src="https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/java/java-original.svg" alt="Java" className='w-3 h-3' />
                                            )}
                                            {part.programmingLanguage === 'Csharp' && (
                                              <img src="https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/csharp/csharp-original.svg" alt="C#" className='w-3 h-3' />
                                            )}
                                            {part.programmingLanguage === 'JavaScript' && (
                                              <img src="https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/javascript/javascript-original.svg" alt="JavaScript" className='w-3 h-3' />
                                            )}
                                            {part.programmingLanguage === 'TypeScript' && (
                                              <img src="https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/typescript/typescript-original.svg" alt="TypeScript" className='w-3 h-3' />
                                            )}
                                            {part.programmingLanguage === 'Python' && (
                                              <img src="https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/python/python-original.svg" alt="Python" className='w-3 h-3' />
                                            )}
                                            {part.programmingLanguage === 'PHP' && (
                                              <img src="https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/php/php-original.svg" alt="PHP" className='w-3 h-3' />
                                            )}
                                            {part.programmingLanguage === 'Go' && (
                                              <img src="https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/go/go-original.svg" alt="Go" className='w-3 h-3' />
                                            )}
                                            {part.programmingLanguage === 'Ruby' && (
                                              <img src="https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/ruby/ruby-original.svg" alt="Ruby" className='w-3 h-3' />
                                            )}
                                            {part.programmingLanguage === 'CPlusPlus' && (
                                              <img src="https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/cplusplus/cplusplus-original.svg" alt="C++" className='w-3 h-3' />
                                            )}
                                            {part.programmingLanguage === 'Swift' && (
                                              <img src="https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/swift/swift-original.svg" alt="Swift" className='w-3 h-3' />
                                            )}
                                            {part.programmingLanguage === 'Kotlin' && (
                                              <img src="https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/kotlin/kotlin-original.svg" alt="Kotlin" className='w-3 h-3' />
                                            )}
                                            {part.programmingLanguage}
                                          </span>
                                        )}
                                        {part.programmingLanguage !== 'None' && part.framework !== 'None' && ' • '}
                                        {part.framework !== 'None' && (
                                          <span className='flex items-center gap-1'>
                                            {part.framework === 'React' && (
                                              <img src="https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/react/react-original.svg" alt="React" className='w-3 h-3' />
                                            )}
                                            {part.framework === 'Angular' && (
                                              <img src="https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/angularjs/angularjs-original.svg" alt="Angular" className='w-3 h-3' />
                                            )}
                                            {part.framework === 'VueJs' && (
                                              <img src="https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/vuejs/vuejs-original.svg" alt="Vue.js" className='w-3 h-3' />
                                            )}
                                            {part.framework === 'DotNetCore' && (
                                              <img src="https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/dotnetcore/dotnetcore-original.svg" alt=".NET Core" className='w-3 h-3' />
                                            )}
                                            {part.framework === 'SpringBoot' && (
                                              <img src="https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/spring/spring-original.svg" alt="Spring Boot" className='w-3 h-3' />
                                            )}
                                            {part.framework === 'Django' && (
                                              <img src="https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/django/django-original.svg" alt="Django" className='w-3 h-3' />
                                            )}
                                            {part.framework === 'ExpressJs' && (
                                              <img src="https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/express/express-original.svg" alt="Express.js" className='w-3 h-3' />
                                            )}
                                            {part.framework === 'Laravel' && (
                                              <img src="https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/laravel/laravel-original.svg" alt="Laravel" className='w-3 h-3' />
                                            )}
                                            {part.framework}
                                          </span>
                                        )}
                                        {(part.programmingLanguage === 'None' && part.framework === 'None') && 'No tech stack specified'}
                                      </p>
                                    </div>
                                    <ArrowRight className='w-4 h-4 text-gray-400 group-hover:text-blue-500 transition-colors flex-shrink-0' />
                                  </div>
                                </button>
                              ))}
                          </div>
                          {parts.filter((part) => !(part.repoUrl && part.ownerId && part.ownerName && part.avatrarUrl)).length === 0 && (
                            <div className='text-center py-8 text-gray-500'>
                              <div className='w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3'>
                                <span className='text-2xl'>📂</span>
                              </div>
                              <p className='text-sm'>No project parts available</p>
                              <p className='text-xs text-gray-400 mt-1'>Create your first project part to get started</p>
                            </div>
                          )}
                        </div>
                      )}
                      
                      <div className='text-center pt-4 border-t border-gray-200'>
                        <Button
                          onClick={() => setCurrentStep('create')}
                          className='bg-blue-600 hover:bg-blue-700 px-6 py-3'
                        >
                          <Plus className='h-5 w-5 mr-2' />
                          Create New Project Part
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Step 2: Create Project Part */}
                {currentStep === 'create' && (
                  <Card className='mb-6'>
                    <CardHeader>
                      <CardTitle className='flex items-center gap-2'>
                        <span className='bg-blue-100 text-blue-800 rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold'>2</span>
                        Create New Project Part
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <form onSubmit={handleCreatePart} className='space-y-4'>
                        <div>
                          <label className='block text-sm font-medium text-gray-700 mb-1'>Name *</label>
                          <Input
                            value={newPart.name}
                            onChange={(e) => setNewPart({ ...newPart, name: e.target.value })}
                            required
                            placeholder='Enter part name...'
                            className='w-full'
                          />
                        </div>
                        
                        <div className='grid grid-cols-2 gap-4'>
                          <div>
                            <label className='block text-sm font-medium text-gray-700 mb-1'>Programming Language</label>
                            <Select value={newPart.programmingLanguage} onValueChange={(value) => setNewPart({ ...newPart, programmingLanguage: value })}>
                              <SelectTrigger>
                                <SelectValue placeholder="Select language" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="None">None</SelectItem>
                                <SelectItem value="Java">
                                  <div className='flex items-center gap-2'>
                                    <img src="https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/java/java-original.svg" alt="Java" className='w-5 h-5' />
                                    <span>Java</span>
                                  </div>
                                </SelectItem>
                                <SelectItem value="Csharp">
                                  <div className='flex items-center gap-2'>
                                    <img src="https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/csharp/csharp-original.svg" alt="C#" className='w-5 h-5' />
                                    <span>C#</span>
                                  </div>
                                </SelectItem>
                                <SelectItem value="JavaScript">
                                  <div className='flex items-center gap-2'>
                                    <img src="https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/javascript/javascript-original.svg" alt="JavaScript" className='w-5 h-5' />
                                    <span>JavaScript</span>
                                  </div>
                                </SelectItem>
                                <SelectItem value="TypeScript">
                                  <div className='flex items-center gap-2'>
                                    <img src="https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/typescript/typescript-original.svg" alt="TypeScript" className='w-5 h-5' />
                                    <span>TypeScript</span>
                                  </div>
                                </SelectItem>
                                <SelectItem value="Python">
                                  <div className='flex items-center gap-2'>
                                    <img src="https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/python/python-original.svg" alt="Python" className='w-5 h-5' />
                                    <span>Python</span>
                                  </div>
                                </SelectItem>
                                <SelectItem value="PHP">
                                  <div className='flex items-center gap-2'>
                                    <img src="https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/php/php-original.svg" alt="PHP" className='w-5 h-5' />
                                    <span>PHP</span>
                                  </div>
                                </SelectItem>
                                <SelectItem value="Go">
                                  <div className='flex items-center gap-2'>
                                    <img src="https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/go/go-original.svg" alt="Go" className='w-5 h-5' />
                                    <span>Go</span>
                                  </div>
                                </SelectItem>
                                <SelectItem value="Ruby">
                                  <div className='flex items-center gap-2'>
                                    <img src="https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/ruby/ruby-original.svg" alt="Ruby" className='w-5 h-5' />
                                    <span>Ruby</span>
                                  </div>
                                </SelectItem>
                                <SelectItem value="CPlusPlus">
                                  <div className='flex items-center gap-2'>
                                    <img src="https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/cplusplus/cplusplus-original.svg" alt="C++" className='w-5 h-5' />
                                    <span>C++</span>
                                  </div>
                                </SelectItem>
                                <SelectItem value="Swift">
                                  <div className='flex items-center gap-2'>
                                    <img src="https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/swift/swift-original.svg" alt="Swift" className='w-5 h-5' />
                                    <span>Swift</span>
                                  </div>
                                </SelectItem>
                                <SelectItem value="Kotlin">
                                  <div className='flex items-center gap-2'>
                                    <img src="https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/kotlin/kotlin-original.svg" alt="Kotlin" className='w-5 h-5' />
                                    <span>Kotlin</span>
                                  </div>
                                </SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          
                          <div>
                            <label className='block text-sm font-medium text-gray-700 mb-1'>Framework</label>
                            <Select value={newPart.framework} onValueChange={(value) => setNewPart({ ...newPart, framework: value })}>
                              <SelectTrigger>
                                <SelectValue placeholder="Select framework" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="None">None</SelectItem>
                                <SelectItem value="React">
                                  <div className='flex items-center gap-2'>
                                    <img src="https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/react/react-original.svg" alt="React" className='w-5 h-5' />
                                    <span>React</span>
                                  </div>
                                </SelectItem>
                                <SelectItem value="Angular">
                                  <div className='flex items-center gap-2'>
                                    <img src="https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/angularjs/angularjs-original.svg" alt="Angular" className='w-5 h-5' />
                                    <span>Angular</span>
                                  </div>
                                </SelectItem>
                                <SelectItem value="VueJs">
                                  <div className='flex items-center gap-2'>
                                    <img src="https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/vuejs/vuejs-original.svg" alt="Vue.js" className='w-5 h-5' />
                                    <span>Vue.js</span>
                                  </div>
                                </SelectItem>
                                <SelectItem value="DotNetCore">
                                  <div className='flex items-center gap-2'>
                                    <img src="https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/dotnetcore/dotnetcore-original.svg" alt=".NET Core" className='w-5 h-5' />
                                    <span>.NET Core</span>
                                  </div>
                                </SelectItem>
                                <SelectItem value="SpringBoot">
                                  <div className='flex items-center gap-2'>
                                    <img src="https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/spring/spring-original.svg" alt="Spring Boot" className='w-5 h-5' />
                                    <span>Spring Boot</span>
                                  </div>
                                </SelectItem>
                                <SelectItem value="Django">
                                  <div className='flex items-center gap-2'>
                                    <img src="https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/django/django-original.svg" alt="Django" className='w-5 h-5' />
                                    <span>Django</span>
                                  </div>
                                </SelectItem>
                                <SelectItem value="ExpressJs">
                                  <div className='flex items-center gap-2'>
                                    <img src="https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/express/express-original.svg" alt="Express.js" className='w-5 h-5' />
                                    <span>Express.js</span>
                                  </div>
                                </SelectItem>
                                <SelectItem value="Laravel">
                                  <div className='flex items-center gap-2'>
                                    <img src="https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/laravel/laravel-original.svg" alt="Laravel" className='w-5 h-5' />
                                    <span>Laravel</span>
                                  </div>
                                </SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                        
                        <div className='flex gap-3 justify-end pt-4'>
                          <Button
                            type='button'
                            variant='outline'
                            onClick={() => setCurrentStep('select')}
                          >
                            Cancel
                          </Button>
                          <Button
                            type='submit'
                            disabled={creatingPart}
                            className='bg-blue-600 hover:bg-blue-700'
                          >
                            {creatingPart ? 'Creating...' : 'Create Part'}
                          </Button>
                        </div>
                      </form>
                    </CardContent>
                  </Card>
                )}

                {/* Step 3: Connect Repository */}
                {currentStep === 'connect' && (
                  <Card className='mb-6'>
                    <CardHeader>
                      <CardTitle className='flex items-center gap-2'>
                        <span className='bg-green-100 text-green-800 rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold'>3</span>
                        Connect Repository
                      </CardTitle>
                    </CardHeader>
                    <CardContent className='space-y-4'>
                      {/* Selected Part Info */}
                      {selectedPart && (() => {
                        const selectedPartData = parts.find(p => p.id === selectedPart)
                        if (!selectedPartData) return null
                        
                        return (
                        <div className='bg-gray-50 p-4 rounded-lg'>
                          <h4 className='font-medium text-gray-900 mb-2'>Selected Project Part:</h4>
                            <div className='text-gray-700 space-y-2'>
                              <p><strong>Name:</strong> {selectedPartData.name}</p>
                              {selectedPartData.programmingLanguage !== 'None' && (
                                <p className='flex items-center gap-2'>
                                  <strong>Language:</strong> 
                                  <span className='flex items-center gap-2'>
                                    {selectedPartData.programmingLanguage === 'Java' && (
                                      <img src="https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/java/java-original.svg" alt="Java" className='w-4 h-4' />
                                    )}
                                    {selectedPartData.programmingLanguage === 'Csharp' && (
                                      <img src="https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/csharp/csharp-original.svg" alt="C#" className='w-4 h-4' />
                                    )}
                                    {selectedPartData.programmingLanguage === 'JavaScript' && (
                                      <img src="https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/javascript/javascript-original.svg" alt="JavaScript" className='w-4 h-4' />
                                    )}
                                    {selectedPartData.programmingLanguage === 'TypeScript' && (
                                      <img src="https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/typescript/typescript-original.svg" alt="TypeScript" className='w-4 h-4' />
                                    )}
                                    {selectedPartData.programmingLanguage === 'Python' && (
                                      <img src="https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/python/python-original.svg" alt="Python" className='w-4 h-4' />
                                    )}
                                    {selectedPartData.programmingLanguage === 'PHP' && (
                                      <img src="https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/php/php-original.svg" alt="PHP" className='w-4 h-4' />
                                    )}
                                    {selectedPartData.programmingLanguage === 'Go' && (
                                      <img src="https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/go/go-original.svg" alt="Go" className='w-4 h-4' />
                                    )}
                                    {selectedPartData.programmingLanguage === 'Ruby' && (
                                      <img src="https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/ruby/ruby-original.svg" alt="Ruby" className='w-4 h-4' />
                                    )}
                                    {selectedPartData.programmingLanguage === 'CPlusPlus' && (
                                      <img src="https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/cplusplus/cplusplus-original.svg" alt="C++" className='w-4 h-4' />
                                    )}
                                    {selectedPartData.programmingLanguage === 'Swift' && (
                                      <img src="https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/swift/swift-original.svg" alt="Swift" className='w-4 h-4' />
                                    )}
                                    {selectedPartData.programmingLanguage === 'Kotlin' && (
                                      <img src="https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/kotlin/kotlin-original.svg" alt="Kotlin" className='w-4 h-4' />
                                    )}
                                    {selectedPartData.programmingLanguage}
                                  </span>
                                </p>
                              )}
                              {selectedPartData.framework !== 'None' && (
                                <p className='flex items-center gap-2'>
                                  <strong>Framework:</strong> 
                                  <span className='flex items-center gap-2'>
                                    {selectedPartData.framework === 'React' && (
                                      <img src="https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/react/react-original.svg" alt="React" className='w-4 h-4' />
                                    )}
                                    {selectedPartData.framework === 'Angular' && (
                                      <img src="https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/angularjs/angularjs-original.svg" alt="Angular" className='w-4 h-4' />
                                    )}
                                    {selectedPartData.framework === 'VueJs' && (
                                      <img src="https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/vuejs/vuejs-original.svg" alt="Vue.js" className='w-4 h-4' />
                                    )}
                                    {selectedPartData.framework === 'DotNetCore' && (
                                      <img src="https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/dotnetcore/dotnetcore-original.svg" alt=".NET Core" className='w-4 h-4' />
                                    )}
                                    {selectedPartData.framework === 'SpringBoot' && (
                                      <img src="https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/spring/spring-original.svg" alt="Spring Boot" className='w-4 h-4' />
                                    )}
                                    {selectedPartData.framework === 'Django' && (
                                      <img src="https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/django/django-original.svg" alt="Django" className='w-4 h-4' />
                                    )}
                                    {selectedPartData.framework === 'ExpressJs' && (
                                      <img src="https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/express/express-original.svg" alt="Express.js" className='w-4 h-4' />
                                    )}
                                    {selectedPartData.framework === 'Laravel' && (
                                      <img src="https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/laravel/laravel-original.svg" alt="Laravel" className='w-4 h-4' />
                                    )}
                                    {selectedPartData.framework}
                                  </span>
                                </p>
                              )}
                          </div>
                        </div>
                        )
                      })()}
                      
                      {/* Repository Selection */}
                      <div>
                        <label className='block text-sm font-medium text-gray-700 mb-2'>Select Repository *</label>
                        <select
                          className='w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
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
                      
                      {/* Action Buttons */}
                      <div className='flex gap-3 justify-between pt-4'>
                        <Button
                          variant='outline'
                          onClick={() => {
                            setCurrentStep('select')
                            setSelectedPart('')
                            setSelectedRepo('')
                          }}
                        >
                          ← Back to Selection
                        </Button>
                        
                        <Button
                          onClick={handleConnectRepo}
                          disabled={!selectedRepo || connecting}
                          className='bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200'
                        >
                          {connecting ? (
                            <div className='flex items-center gap-2'>
                              <div className='w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin'></div>
                              <span>Connecting...</span>
                            </div>
                          ) : (
                            <>
                              <ArrowRight className='h-4 w-4 mr-2' />
                              Connect Repository
                            </>
                          )}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Connected Parts Summary */}
                {parts.filter(part => part.repoUrl && part.ownerId && part.ownerName && part.avatrarUrl).length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Connected Parts</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className='space-y-3'>
                        {parts
                          .filter(part => part.repoUrl && part.ownerId && part.ownerName && part.avatrarUrl)
                          .map((part) => (
                            <div key={part.id} className='flex items-center justify-between p-3 bg-green-50 rounded-lg'>
                              <div>
                                <p className='font-medium text-gray-900'>{part.name}</p>
                                <p className='text-sm text-gray-600'>{part.repoUrl}</p>
                              </div>
                              <span className='text-green-600 text-sm font-medium'>✓ Connected</span>
                            </div>
                          ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* All Project Parts - Show after creation */}
                {parts.length > 0 && (
                  <Card className='mt-6'>
                    <CardHeader>
                      <CardTitle className='flex items-center gap-2'>
                        <span className='bg-purple-100 text-purple-800 rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold'>📋</span>
                        All Project Parts ({parts.length})
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'>
                        {parts.map((part, index) => (
                          <div key={part.id} className={`p-4 rounded-lg border transition-all ${
                            part.repoUrl && part.ownerId && part.ownerName && part.avatrarUrl
                              ? 'bg-green-50 border-green-200'
                              : 'bg-blue-50 border-blue-200 hover:border-blue-300'
                          } ${index === parts.length - 1 ? 'ring-2 ring-green-300 ring-opacity-50' : ''}`}>
                            <div className='flex items-start gap-3'>
                              <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                                part.repoUrl && part.ownerId && part.ownerName && part.avatrarUrl
                                  ? 'bg-green-100'
                                  : 'bg-blue-100'
                              }`}>
                                <span className={`text-lg ${
                                  part.repoUrl && part.ownerId && part.ownerName && part.avatrarUrl
                                    ? 'text-green-600'
                                    : 'text-blue-600'
                                }`}>
                                  {part.repoUrl && part.ownerId && part.ownerName && part.avatrarUrl ? '🔗' : '📁'}
                                </span>
                              </div>
                              <div className='flex-1 min-w-0 overflow-hidden'>
                                <div className='flex items-center gap-2 mb-1'>
                                  <h4 className='font-medium text-gray-900 truncate max-w-full' title={part.name}>{part.name}</h4>
                                  {newlyCreatedPartId === part.id && (
                                    <span className='bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full font-medium flex-shrink-0'>
                                      NEW
                                    </span>
                                  )}
                                </div>
                                <div className='space-y-1'>
                                  {part.programmingLanguage !== 'None' && (
                                    <div className='flex items-center gap-2'>
                                      <span className='text-sm text-gray-600 flex items-center gap-2'>
                                        {part.programmingLanguage === 'Java' && (
                                          <img src="https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/java/java-original.svg" alt="Java" className='w-4 h-4' />
                                        )}
                                        {part.programmingLanguage === 'Csharp' && (
                                          <img src="https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/csharp/csharp-original.svg" alt="C#" className='w-4 h-4' />
                                        )}
                                        {part.programmingLanguage === 'JavaScript' && (
                                          <img src="https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/javascript/javascript-original.svg" alt="JavaScript" className='w-4 h-4' />
                                        )}
                                        {part.programmingLanguage === 'TypeScript' && (
                                          <img src="https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/typescript/typescript-original.svg" alt="TypeScript" className='w-4 h-4' />
                                        )}
                                        {part.programmingLanguage === 'Python' && (
                                          <img src="https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/python/python-original.svg" alt="Python" className='w-4 h-4' />
                                        )}
                                        {part.programmingLanguage === 'PHP' && (
                                          <img src="https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/php/php-original.svg" alt="PHP" className='w-4 h-4' />
                                        )}
                                        {part.programmingLanguage === 'Go' && (
                                          <img src="https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/go/go-original.svg" alt="Go" className='w-4 h-4' />
                                        )}
                                        {part.programmingLanguage === 'Ruby' && (
                                          <img src="https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/ruby/ruby-original.svg" alt="Ruby" className='w-4 h-4' />
                                        )}
                                        {part.programmingLanguage === 'CPlusPlus' && (
                                          <img src="https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/cplusplus/cplusplus-original.svg" alt="C++" className='w-4 h-4' />
                                        )}
                                        {part.programmingLanguage === 'Swift' && (
                                          <img src="https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/swift/swift-original.svg" alt="Swift" className='w-4 h-4' />
                                        )}
                                        {part.programmingLanguage === 'Kotlin' && (
                                          <img src="https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/kotlin/kotlin-original.svg" alt="Kotlin" className='w-4 h-4' />
                                        )}
                                        {part.programmingLanguage}
                                      </span>
                                    </div>
                                  )}
                                  {part.framework !== 'None' && (
                                    <div className='flex items-center gap-2'>
                                      <span className='text-sm text-gray-600 flex items-center gap-2'>
                                        {part.framework === 'React' && (
                                          <img src="https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/react/react-original.svg" alt="React" className='w-4 h-4' />
                                        )}
                                        {part.framework === 'Angular' && (
                                          <img src="https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/angularjs/angularjs-original.svg" alt="Angular" className='w-4 h-4' />
                                        )}
                                        {part.framework === 'VueJs' && (
                                          <img src="https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/vuejs/vuejs-original.svg" alt="Vue.js" className='w-4 h-4' />
                                        )}
                                        {part.framework === 'DotNetCore' && (
                                          <img src="https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/dotnetcore/dotnetcore-original.svg" alt=".NET Core" className='w-4 h-4' />
                                        )}
                                        {part.framework === 'SpringBoot' && (
                                          <img src="https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/spring/spring-original.svg" alt="Spring Boot" className='w-4 h-4' />
                                        )}
                                        {part.framework === 'Django' && (
                                          <img src="https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/django/django-original.svg" alt="Django" className='w-4 h-4' />
                                        )}
                                        {part.framework === 'ExpressJs' && (
                                          <img src="https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/express/express-original.svg" alt="Express.js" className='w-4 h-4' />
                                        )}
                                        {part.framework === 'Laravel' && (
                                          <img src="https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/laravel/laravel-original.svg" alt="Laravel" className='w-4 h-4' />
                                        )}
                                        {part.framework}
                                      </span>
                                    </div>
                                  )}
                                  {part.repoUrl && (
                                    <p className='text-sm text-green-600 font-medium'>
                                      ✓ Connected to GitHub
                                    </p>
                                  )}
                                  {!part.repoUrl && (
                                    <p className='text-sm text-blue-600 font-medium'>
                                      ⚠️ Not connected
                                    </p>
                                  )}
                                </div>
                                {part.repoUrl && (
                                  <a 
                                    href={part.repoUrl} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className='text-xs text-blue-600 hover:text-blue-800 underline truncate block mt-2'
                                    title={part.repoUrl}
                                  >
                                    🔗 {part.repoUrl}
                                  </a>
                                )}
                              </div>
                            </div>
                            
                            {!part.repoUrl && (
                              <div className='mt-3 pt-3 border-t border-blue-200'>
                                <Button
                                  size='sm'
                                  onClick={(e) => {
                                    e.preventDefault()
                                    e.stopPropagation()
                                    setSelectedPart(part.id)
                                    setCurrentStep('connect')
                                  }}
                                  className='w-full bg-blue-600 hover:bg-blue-700 text-white cursor-pointer'
                                  type='button'
                                >
                                  <span className='flex items-center gap-2'>
                                    <span className='text-sm'>🔗</span>
                                    <span className='truncate'>Connect Repository</span>
                                  </span>
                                </Button>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                      
                      {parts.length === 0 && (
                        <div className='text-center py-8 text-gray-500'>
                          <div className='w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3'>
                            <span className='text-2xl'>📂</span>
                          </div>
                          <p className='text-sm'>No project parts available</p>
                          <p className='text-xs text-gray-400 mt-1'>Create your first project part to get started</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
