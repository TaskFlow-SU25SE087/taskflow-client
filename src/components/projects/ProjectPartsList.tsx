import { projectApi } from '@/api/projects'
import { useProjectParts } from '@/hooks/useProjectParts'
import { ProjectMember } from '@/types/project'
import { Boxes, CheckCircle, ExternalLink, Github, Plus, Settings, Users, XCircle } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import GitHubProjectPartIntegration from '../github/GitHubProjectPartIntegration'
import { Badge } from '../ui/badge'
import { Button } from '../ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog'
import { Skeleton } from '../ui/skeleton'
import { GitMemberLocalDialog } from './GitMemberLocalDialog'

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
  const [projectMembers, setProjectMembers] = useState<ProjectMember[]>([])
  const [showGitMemberDialog, setShowGitMemberDialog] = useState(false)
  const [selectedPartForGitMembers, setSelectedPartForGitMembers] = useState<string | null>(null)
  const { fetchParts } = useProjectParts()

  const fetchPartsFromApi = useCallback(async () => {
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
  }, [projectId, fetchParts])

  const fetchProjectMembers = useCallback(async () => {
    try {
      const members = await projectApi.getProjectMembers(projectId)
      setProjectMembers(members)
    } catch (error) {
      console.error('Error fetching project members:', error)
    }
  }, [projectId])

  useEffect(() => {
    fetchPartsFromApi()
    fetchProjectMembers()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId])

  const handleGitMemberDialogOpen = (partId: string) => {
    setSelectedPartForGitMembers(partId)
    setShowGitMemberDialog(true)
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
      <div className='space-y-6'>
        {/* Header */}
        <div className='mb-6'>
          <div className='flex items-center space-x-3 mb-2'>
            <div className='p-2 bg-lavender-100 rounded-lg'>
              <Boxes className='h-6 w-6 text-lavender-600' />
            </div>
            <h1 className='text-2xl font-semibold text-gray-900'>Project Parts</h1>
          </div>
          <p className='text-gray-600'>Manage your project components and their GitHub connections</p>
        </div>

        {/* Actions skeleton */}
        <div className='flex justify-end mb-6 space-x-2'>
          <Skeleton className='h-10 w-40' />
          <Skeleton className='h-10 w-24' />
        </div>

        {/* Parts grid skeleton */}
        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className='bg-white rounded-lg border border-gray-200 p-6 shadow-sm'>
              <Skeleton className='h-6 w-3/4 mb-4' />
              <div className='flex gap-2 mb-4'>
                <Skeleton className='h-6 w-20' />
                <Skeleton className='h-6 w-24' />
              </div>
              <Skeleton className='h-4 w-full mb-2' />
              <div className='flex justify-between items-center pt-4'>
                <div className='flex gap-2'>
                  <Skeleton className='h-8 w-20' />
                  <Skeleton className='h-8 w-24' />
                </div>
                <Skeleton className='h-8 w-8' />
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className='space-y-6'>
      {/* Header */}
      <div className='mb-6'>
        <div className='flex items-center space-x-3 mb-2'>
          <div className='p-2 bg-lavender-100 rounded-lg'>
            <Boxes className='h-6 w-6 text-lavender-600' />
          </div>
          <h1 className='text-2xl font-semibold text-gray-900'>Project Parts</h1>
        </div>
        <p className='text-gray-600'>Manage your project components and their GitHub connections</p>
      </div>

      {/* Actions */}
      <div className='flex items-center justify-end space-x-2'>
        <Dialog open={showGitHubIntegration} onOpenChange={setShowGitHubIntegration}>
          <DialogTrigger asChild>
            <Button className='bg-lavender-600 hover:bg-lavender-700 text-white'>
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

        <Button variant='outline' className='border-lavender-200 text-lavender-700 hover:bg-lavender-50'>
          <Plus className='h-4 w-4 mr-2' />
          Add Part
        </Button>
      </div>

      {/* Parts Grid */}
      <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
        {parts.map((part) => (
          <Card key={part.id} className='bg-white border-gray-200 shadow-sm hover:shadow-md transition-shadow'>
            <CardHeader className='pb-4'>
              <div className='flex items-start justify-between'>
                <CardTitle className='text-lg font-semibold text-gray-900'>{part.name}</CardTitle>
                <div className='flex items-center gap-1'>
                  {part.isConnected ? (
                    <div className='flex items-center space-x-1'>
                      <CheckCircle className='h-4 w-4 text-emerald-500' />
                      <span className='text-xs text-emerald-600 font-medium'>Connected</span>
                    </div>
                  ) : (
                    <div className='flex items-center space-x-1'>
                      <XCircle className='h-4 w-4 text-gray-400' />
                      <span className='text-xs text-gray-500 font-medium'>Disconnected</span>
                    </div>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent className='space-y-4'>
              <div className='flex flex-wrap gap-2'>
                <Badge variant='secondary' className={getProgrammingLanguageColor(part.programmingLanguage)}>
                  {part.programmingLanguage}
                </Badge>
                <Badge variant='secondary' className={getFrameworkColor(part.framework)}>
                  {part.framework}
                </Badge>
              </div>

              {part.repoUrl && (
                <div className='flex items-center gap-2 p-2 bg-gray-50 rounded-md'>
                  <Github className='h-4 w-4 text-gray-500' />
                  <span className='text-sm text-gray-600 truncate flex-1'>{part.repoUrl}</span>
                  <Button variant='ghost' size='sm' className='h-6 w-6 p-0 hover:bg-gray-200'>
                    <ExternalLink className='h-3 w-3' />
                  </Button>
                </div>
              )}

              <div className='flex items-center justify-between pt-2 border-t border-gray-100'>
                <div className='flex items-center gap-2'>
                  <Button
                    variant='outline'
                    size='sm'
                    onClick={() => {
                      setSelectedPartId(part.id)
                      setShowGitHubIntegration(true)
                    }}
                    className='text-xs border-lavender-200 text-lavender-700 hover:bg-lavender-50'
                  >
                    <Github className='h-3 w-3 mr-1' />
                    {part.isConnected ? 'Manage' : 'Connect'}
                  </Button>

                  <Button
                    variant='outline'
                    size='sm'
                    onClick={() => handleGitMemberDialogOpen(part.id)}
                    className='text-xs'
                  >
                    <Users className='h-3 w-3 mr-1' />
                    Git Members
                  </Button>
                </div>

                <Button variant='ghost' size='sm' className='h-8 w-8 p-0'>
                  <Settings className='h-3 w-3' />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Empty State */}
      {parts.length === 0 && (
        <Card className='bg-white border-gray-200 shadow-sm'>
          <CardContent className='text-center py-12'>
            <div className='p-3 bg-gray-100 rounded-full w-fit mx-auto mb-4'>
              <Boxes className='h-8 w-8 text-gray-400' />
            </div>
            <h3 className='text-lg font-semibold text-gray-900 mb-2'>No Project Parts</h3>
            <p className='text-gray-600 mb-6 max-w-md mx-auto'>
              Create your first project part and connect it to a GitHub repository to start managing your codebase.
            </p>
            <Button
              onClick={() => setShowGitHubIntegration(true)}
              className='bg-lavender-600 hover:bg-lavender-700 text-white'
            >
              <Github className='h-4 w-4 mr-2' />
              Connect with GitHub
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Git Member Local Dialog */}
      {selectedPartForGitMembers && (
        <GitMemberLocalDialog
          projectId={projectId}
          projectPartId={selectedPartForGitMembers}
          projectMembers={projectMembers}
          isOpen={showGitMemberDialog}
          onOpenChange={setShowGitMemberDialog}
        />
      )}
    </div>
  )
}
