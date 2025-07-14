import { useProjectParts } from '@/hooks/useProjectParts'
import { CheckCircle, ExternalLink, Github, Plus, Settings, XCircle } from 'lucide-react'
import { useEffect, useState } from 'react'
import GitHubProjectPartIntegration from '../github/GitHubProjectPartIntegration'
import { Badge } from '../ui/badge'
import { Button } from '../ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog'

interface ProjectPart {
  id: string
  name: string
  programmingLanguage: string
  framework: string
  repoUrl?: string
  isConnected?: boolean
}

interface ProjectPartsListProps {
  projectId: string
}

export default function ProjectPartsList({ projectId }: ProjectPartsListProps) {
  const [parts, setParts] = useState<ProjectPart[]>([])
  const [loading, setLoading] = useState(true)
  const [showGitHubIntegration, setShowGitHubIntegration] = useState(false)
  const [selectedPartId, setSelectedPartId] = useState<string | null>(null)
  const { fetchParts } = useProjectParts()

  const fetchPartsFromApi = async () => {
    try {
      setLoading(true)
      const res = await fetchParts(projectId)
      // Giả sử API trả về { code, message, data }, lấy data là mảng parts
      setParts(res.data || [])
    } catch (error) {
      console.error('Error fetching project parts:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchPartsFromApi()
  }, [projectId])

  const handleGitHubIntegrationSuccess = () => {
    fetchPartsFromApi() // Refresh the list after successful integration
    setShowGitHubIntegration(false)
  }

  const getProgrammingLanguageColor = (language: string) => {
    const colors: { [key: string]: string } = {
      Java: 'bg-orange-100 text-orange-700',
      'C#': 'bg-purple-100 text-purple-700',
      JavaScript: 'bg-yellow-100 text-yellow-700',
      TypeScript: 'bg-blue-100 text-blue-700',
      Python: 'bg-green-100 text-green-700',
      Go: 'bg-cyan-100 text-cyan-700',
      Rust: 'bg-red-100 text-red-700',
      PHP: 'bg-indigo-100 text-indigo-700',
      SQL: 'bg-gray-100 text-gray-700'
    }
    return colors[language] || 'bg-gray-100 text-gray-700'
  }

  const getFrameworkColor = (framework: string) => {
    const colors: { [key: string]: string } = {
      React: 'bg-blue-100 text-blue-700',
      Vue: 'bg-green-100 text-green-700',
      Angular: 'bg-red-100 text-red-700',
      '.NET': 'bg-purple-100 text-purple-700',
      Spring: 'bg-green-100 text-green-700',
      Django: 'bg-green-100 text-green-700',
      Express: 'bg-gray-100 text-gray-700',
      Laravel: 'bg-red-100 text-red-700',
      'Entity Framework': 'bg-purple-100 text-purple-700'
    }
    return colors[framework] || 'bg-gray-100 text-gray-700'
  }

  if (loading) {
    return (
      <div className='space-y-4'>
        <div className='flex items-center justify-between'>
          <h2 className='text-2xl font-bold'>Project Parts</h2>
          <Button disabled>
            <Plus className='h-4 w-4 mr-2' />
            Add Part
          </Button>
        </div>
        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'>
          {[1, 2, 3].map((i) => (
            <Card key={i} className='animate-pulse'>
              <CardHeader className='pb-3'>
                <div className='h-6 bg-gray-200 rounded w-3/4'></div>
              </CardHeader>
              <CardContent className='space-y-3'>
                <div className='flex gap-2'>
                  <div className='h-6 bg-gray-200 rounded w-20'></div>
                  <div className='h-6 bg-gray-200 rounded w-24'></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className='space-y-6'>
      <div className='flex items-center justify-between'>
        <div>
          <h2 className='text-2xl font-bold'>Project Parts</h2>
          <p className='text-gray-600'>Manage your project components and their GitHub connections</p>
        </div>

        <div className='flex items-center gap-2'>
          <Dialog open={showGitHubIntegration} onOpenChange={setShowGitHubIntegration}>
            <DialogTrigger asChild>
              <Button>
                <Github className='h-4 w-4 mr-2' />
                Connect with GitHub
              </Button>
            </DialogTrigger>
            <DialogContent className='max-w-4xl max-h-[80vh] overflow-y-auto'>
              <DialogHeader>
                <DialogTitle>GitHub Integration</DialogTitle>
              </DialogHeader>
              <GitHubProjectPartIntegration projectId={projectId} partId={selectedPartId || undefined} />
            </DialogContent>
          </Dialog>

          <Button variant='outline'>
            <Plus className='h-4 w-4 mr-2' />
            Add Part
          </Button>
        </div>
      </div>

      <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'>
        {parts.map((part) => (
          <Card key={part.id} className='hover:shadow-lg transition-shadow'>
            <CardHeader className='pb-3'>
              <div className='flex items-start justify-between'>
                <CardTitle className='text-lg'>{part.name}</CardTitle>
                <div className='flex items-center gap-1'>
                  {part.isConnected ? (
                    <CheckCircle className='h-4 w-4 text-green-500' />
                  ) : (
                    <XCircle className='h-4 w-4 text-gray-400' />
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent className='space-y-3'>
              <div className='flex flex-wrap gap-2'>
                <Badge className={getProgrammingLanguageColor(part.programmingLanguage)}>
                  {part.programmingLanguage}
                </Badge>
                <Badge className={getFrameworkColor(part.framework)}>{part.framework}</Badge>
              </div>

              {part.repoUrl && (
                <div className='flex items-center gap-2 text-sm text-gray-600'>
                  <Github className='h-4 w-4' />
                  <span className='truncate'>{part.repoUrl}</span>
                  <Button variant='ghost' size='sm' className='h-6 w-6 p-0'>
                    <ExternalLink className='h-3 w-3' />
                  </Button>
                </div>
              )}

              <div className='flex items-center justify-between pt-2'>
                <div className='flex items-center gap-2'>
                  <Button
                    variant='outline'
                    size='sm'
                    onClick={() => {
                      setSelectedPartId(part.id)
                      setShowGitHubIntegration(true)
                    }}
                  >
                    <Github className='h-3 w-3 mr-1' />
                    {part.isConnected ? 'Manage' : 'Connect'}
                  </Button>
                </div>

                <Button variant='ghost' size='sm'>
                  <Settings className='h-3 w-3' />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {parts.length === 0 && (
        <Card>
          <CardContent className='text-center py-12'>
            <Github className='h-12 w-12 mx-auto mb-4 text-gray-300' />
            <h3 className='text-lg font-medium mb-2'>No Project Parts</h3>
            <p className='text-gray-600 mb-4'>Create your first project part and connect it to a GitHub repository</p>
            <Button onClick={() => setShowGitHubIntegration(true)}>
              <Github className='h-4 w-4 mr-2' />
              Connect with GitHub
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
