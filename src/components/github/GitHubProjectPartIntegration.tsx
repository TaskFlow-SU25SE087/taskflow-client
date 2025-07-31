import { BarChart3, CheckCircle, Github } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useGitHubProjectPartIntegration } from '../../hooks/useGitHubProjectPartIntegration'
import { Button } from '../ui/button'
import { Card, CardContent } from '../ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog'
import { Input } from '../ui/input'
import { Label } from '../ui/label'
import { Loader } from '../ui/loader'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select'

interface GitHubProjectPartIntegrationProps {
  projectId: string
  partId?: string
}

export default function GitHubProjectPartIntegration({ projectId, partId }: GitHubProjectPartIntegrationProps) {
  console.log('!!! FILE LOADED: src/components/github/GitHubProjectPartIntegration.tsx');
  console.log('RENDER GitHubProjectPartIntegration');
  console.log('PROPS projectId:', projectId, 'partId:', partId);
  const location = useLocation()
  const navigate = useNavigate()

  const {
    repositories,
    projectParts,
    connectingRepo,
    creatingPart,
    checkConnectionStatus,
    handleOAuthCallback,
    createNewProjectPart,
    connectRepoToPart,
    setProjectPartsData
  } = useGitHubProjectPartIntegration()

  // Thêm log kiểm tra dữ liệu parts lấy từ hook
  console.log('[DEBUG] projectParts from hook:', projectParts);
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
      checkConnectionStatusRef.current()
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

  // Initialize project parts if empty
  useEffect(() => {
    if (projectParts.length === 0) {
      // Mock project parts for demo (since backend doesn't have GET endpoint)
      const mockProjectParts = [
        { id: 'part-1', name: 'Frontend', programmingLanguage: 'TypeScript', framework: 'React', isConnected: false },
        { id: 'part-2', name: 'Backend', programmingLanguage: 'C#', framework: '.NET', isConnected: false },
        { id: 'part-3', name: 'Database', programmingLanguage: 'SQL', framework: 'Entity Framework', isConnected: false }
      ]
      setProjectPartsData(mockProjectParts)
    }
  }, [projectParts.length, setProjectPartsData])

  // Log khi fetch xong projectParts
  useEffect(() => {
    console.log('EFFECT projectParts:', projectParts);
    projectParts.forEach((p, i) => {
      console.log(`EFFECT Part ${i}:`, p);
    });
  }, [projectParts]);

  // Map lại dữ liệu nếu cần (chuyển các trường viết hoa về đúng định dạng FE)
  const mappedProjectParts = projectParts.map(part => {
    const p = part as any;
    const programmingLanguage = (p.programmingLanguage || p.ProgrammingLanguage || '').trim();
    const framework = (p.framework || p.Framework || '').trim();
    return {
      id: p.id,
      name: (p.name || p.Name || '[No name]').toString().trim(),
      programmingLanguage: programmingLanguage && programmingLanguage !== 'null' ? programmingLanguage : '[No language]',
      framework: framework && framework !== 'null' ? framework : '[No framework]',
    };
  });
  // Thêm log kiểm tra mappedProjectParts
  console.log('[DEBUG] mappedProjectParts:', mappedProjectParts);

  if (isProcessingCallback) {
    return (
      <Card className="shadow-xl rounded-2xl border-0 bg-gradient-to-br from-lavender-50 via-white to-blue-50">
        <CardContent className='flex items-center justify-center p-8'>
          <div className='text-center'>
            <Loader className='mx-auto mb-4 text-lavender-500' />
            <p className='text-lavender-700 font-semibold text-lg'>Processing GitHub OAuth callback...</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] bg-gradient-to-br from-lavender-50 via-white to-blue-50 py-8">
      <div className="flex flex-col items-center mb-8">
        <div className="relative mb-2">
          <Github className="w-16 h-16 text-lavender-500 drop-shadow-lg" />
          <img src="/logo.png" alt="TaskFlow" className="w-10 h-10 absolute -top-4 -right-6 opacity-80 animate-bounce" />
        </div>
        <h1 className="text-4xl font-extrabold text-lavender-700 mb-2 drop-shadow">GitHub Integration</h1>
        <p className="text-lg text-blue-700 font-medium mb-2">Connect your GitHub account to integrate repositories with your project.</p>
      </div>
      <Card className="w-full max-w-2xl shadow-2xl rounded-2xl border-0 bg-white/95">
        <CardContent className="p-10 flex flex-col items-center">
          <div className="flex items-center gap-2 mb-6">
            <CheckCircle className="w-7 h-7 text-green-500 animate-pulse" />
            <span className="text-green-600 font-bold text-xl">Connected to GitHub</span>
          </div>
          <p className="text-lavender-700 mb-6 text-center font-medium">You are connected to GitHub. Select a repository to integrate with your project.</p>
          <div className="flex flex-col md:flex-row gap-8 w-full mb-8">
            <div className="flex-1">
              <Label className="text-lavender-700 font-semibold mb-2 block">Select Repository</Label>
              <Select value={selectedRepo} onValueChange={setSelectedRepo}>
                <SelectTrigger className="w-full bg-lavender-50 border-0 rounded-xl text-lavender-700 font-medium focus:ring-2 focus:ring-lavender-400 placeholder:text-lavender-300">
                  <SelectValue placeholder="-- Select a repository --" />
                </SelectTrigger>
                <SelectContent className="bg-white rounded-xl shadow-lg">
                  {repositories.map((repo) => (
                    <SelectItem key={repo.htmlUrl} value={repo.htmlUrl} className="hover:bg-blue-50 text-blue-700 font-semibold">
                      <Github className="inline-block mr-2 text-lavender-400" />
                      {repo.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex-1">
              <Label className="text-lavender-700 font-semibold mb-2 block">Select Project Part</Label>
              <Select value={selectedPart} onValueChange={setSelectedPart}>
                <SelectTrigger className="w-full bg-lavender-50 border-0 rounded-xl text-lavender-700 font-medium focus:ring-2 focus:ring-lavender-400 placeholder:text-lavender-300">
                  <SelectValue placeholder="-- Select a part --" />
                </SelectTrigger>
                <SelectContent className="bg-white rounded-xl shadow-lg">
                  {mappedProjectParts.map((part) => (
                    <SelectItem key={part.id} value={part.id} className="hover:bg-purple-50 text-purple-700 font-semibold">
                      <BarChart3 className="inline-block mr-2 text-blue-400" />
                      {part.name} ({part.programmingLanguage}, {part.framework})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <button
                className="mt-2 text-blue-600 hover:underline text-sm font-semibold"
                type="button"
                onClick={() => setShowCreatePartDialog(true)}
              >
                + Create new part
              </button>
            </div>
          </div>
          <Button
            className="w-full bg-gradient-to-r from-lavender-500 to-blue-400 hover:from-lavender-600 hover:to-blue-500 text-white font-bold shadow-lg rounded-2xl py-4 text-lg disabled:opacity-60 disabled:cursor-not-allowed tracking-wide"
            onClick={handleConnectRepository}
            disabled={!selectedRepo || !selectedPart || connectingRepo}
          >
            <Github className="inline-block mr-2 text-white" />
            Connect Repository to Project Part
          </Button>
        </CardContent>
      </Card>
      <Dialog open={showCreatePartDialog} onOpenChange={setShowCreatePartDialog}>
        <DialogContent className="max-w-md rounded-2xl border-0 shadow-2xl bg-white/95 p-8">
          <DialogHeader>
            <DialogTitle className="text-2xl font-extrabold text-lavender-700 mb-4 drop-shadow">Create Project Part</DialogTitle>
          </DialogHeader>
          <div className="space-y-5">
            <div>
              <Label htmlFor='partName' className="text-lavender-700 font-semibold mb-1 block">Name</Label>
              <Input
                id='partName'
                value={newPartData.name}
                onChange={(e) => setNewPartData((prev) => ({ ...prev, name: e.target.value }))}
                placeholder='Enter part name...'
                className="bg-lavender-50 border-2 border-lavender-200 rounded-xl focus:ring-2 focus:ring-lavender-400 placeholder:text-lavender-300 text-lavender-700 font-medium"
              />
            </div>
            <div>
              <Label htmlFor='programmingLanguage' className="text-lavender-700 font-semibold mb-1 block">Programming Language</Label>
              <Select value={newPartData.programmingLanguage} onValueChange={(value) => setNewPartData((prev) => ({ ...prev, programmingLanguage: value }))}>
                <SelectTrigger className="w-full bg-lavender-50 border-2 border-lavender-200 rounded-xl text-lavender-700 font-medium focus:ring-2 focus:ring-lavender-400">
                  <SelectValue placeholder="Select programming language" />
                </SelectTrigger>
                <SelectContent className="bg-white rounded-xl shadow-lg">
                  <SelectItem value="">None</SelectItem>
                  <SelectItem value="Java">
                    <div className='flex items-center gap-2'>
                      <img src="https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/java/java-original.svg" alt="Java" className='w-5 h-5' />
                      <span>Java</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="C#">
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
                  <SelectItem value="Go">
                    <div className='flex items-center gap-2'>
                      <img src="https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/go/go-original.svg" alt="Go" className='w-5 h-5' />
                      <span>Go</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="PHP">
                    <div className='flex items-center gap-2'>
                      <img src="https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/php/php-original.svg" alt="PHP" className='w-5 h-5' />
                      <span>PHP</span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor='framework' className="text-lavender-700 font-semibold mb-1 block">Framework</Label>
              <Select value={newPartData.framework} onValueChange={(value) => setNewPartData((prev) => ({ ...prev, framework: value }))}>
                <SelectTrigger className="w-full bg-lavender-50 border-2 border-lavender-200 rounded-xl text-lavender-700 font-medium focus:ring-2 focus:ring-lavender-400">
                  <SelectValue placeholder="Select framework" />
                </SelectTrigger>
                <SelectContent className="bg-white rounded-xl shadow-lg">
                  <SelectItem value="">None</SelectItem>
                  <SelectItem value="React">
                    <div className='flex items-center gap-2'>
                      <img src="https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/react/react-original.svg" alt="React" className='w-5 h-5' />
                      <span>React</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="Vue">
                    <div className='flex items-center gap-2'>
                      <img src="https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/vuejs/vuejs-original.svg" alt="Vue" className='w-5 h-5' />
                      <span>Vue</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="Angular">
                    <div className='flex items-center gap-2'>
                      <img src="https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/angularjs/angularjs-original.svg" alt="Angular" className='w-5 h-5' />
                      <span>Angular</span>
                    </div>
                  </SelectItem>
                  <SelectItem value=".NET">
                    <div className='flex items-center gap-2'>
                      <img src="https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/dotnetcore/dotnetcore-original.svg" alt=".NET" className='w-5 h-5' />
                      <span>.NET</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="Spring">
                    <div className='flex items-center gap-2'>
                      <img src="https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/spring/spring-original.svg" alt="Spring" className='w-5 h-5' />
                      <span>Spring</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="Django">
                    <div className='flex items-center gap-2'>
                      <img src="https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/django/django-original.svg" alt="Django" className='w-5 h-5' />
                      <span>Django</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="Express">
                    <div className='flex items-center gap-2'>
                      <img src="https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/express/express-original.svg" alt="Express" className='w-5 h-5' />
                      <span>Express</span>
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
            <div className="flex items-center justify-end gap-4 mt-6">
              <button
                type="button"
                className="text-blue-600 hover:underline font-semibold text-base bg-transparent border-0 shadow-none px-0"
                onClick={() => setShowCreatePartDialog(false)}
              >
                Cancel
              </button>
              <Button
                onClick={handleCreatePart}
                disabled={creatingPart || !newPartData.name || !newPartData.programmingLanguage || !newPartData.framework}
                className="bg-gradient-to-r from-lavender-500 to-blue-400 hover:from-lavender-600 hover:to-blue-500 text-white font-bold shadow-lg rounded-2xl px-8 py-3 text-lg disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {creatingPart ? 'Creating...' : 'Create Part'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
