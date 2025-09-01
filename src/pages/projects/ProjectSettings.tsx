import { projectApi } from '@/api/projects'
import { Navbar } from '@/components/Navbar'
import { Sidebar } from '@/components/Sidebar'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import { Textarea } from '@/components/ui/textarea'
import { useToastContext } from '@/components/ui/ToastContext'
import { useCurrentProject } from '@/hooks/useCurrentProject'
import { Copy, Loader2, Save, Settings as SettingsIcon } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'

export default function ProjectSettings() {
  const navigate = useNavigate()
  const { projectId: urlProjectId } = useParams<{ projectId: string }>()
  const { currentProject, isLoading: isProjectLoading, refreshCurrentProject } = useCurrentProject()
  const { showToast } = useToastContext()

  const [isSidebarOpen, setIsSidebarOpen] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [hasHydrated, setHasHydrated] = useState(false)

  // Initialize form data when project loads - use useMemo to prevent unnecessary recalculations
  const initialFormData = useMemo(() => {
    if (!currentProject) return { title: '', description: '' }
    return {
      title: currentProject.title || '',
      description: currentProject.description || ''
    }
  }, [currentProject])

  const [title, setTitle] = useState(initialFormData.title)
  const [description, setDescription] = useState(initialFormData.description)

  // Update form data when project changes
  useEffect(() => {
    setTitle(initialFormData.title)
    setDescription(initialFormData.description)
  }, [initialFormData])

  // Track changes to enable/disable save button - use useMemo for performance
  const hasChanges = useMemo(() => {
    if (!currentProject) return false
    const titleChanged = title !== (currentProject.title || '')
    const descriptionChanged = description !== (currentProject.description || '')
    return titleChanged || descriptionChanged
  }, [title, description, currentProject])

  // Determine when initial page data has fully hydrated
  useEffect(() => {
    if (!hasHydrated && currentProject && !isProjectLoading) {
      setHasHydrated(true)
    }
  }, [hasHydrated, currentProject, isProjectLoading])

  // Reset hydration flag when navigating to a different project
  useEffect(() => {
    if (hasHydrated && !isProjectLoading && currentProject?.id !== urlProjectId) {
      setHasHydrated(false)
    }
  }, [urlProjectId, currentProject?.id, hasHydrated, isProjectLoading])

  // Redirect if no project (only after loading is complete)
  useEffect(() => {
    if (!isProjectLoading && !currentProject) {
      navigate('/projects')
    }
  }, [currentProject, isProjectLoading, navigate])

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen)
  }

  const handleCopyProjectId = async () => {
    if (!currentProject?.id) return

    try {
      await navigator.clipboard.writeText(currentProject.id)
      showToast({
        title: 'Success',
        description: 'Project ID copied to clipboard',
        variant: 'success'
      })
    } catch {
      showToast({
        title: 'Error',
        description: 'Failed to copy project ID',
        variant: 'destructive'
      })
    }
  }

  const handleSaveProject = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!currentProject?.id || isSubmitting) return

    setIsSubmitting(true)

    try {
      await projectApi.updateProject(currentProject.id, title, description)

      showToast({
        title: 'Success',
        description: 'Project settings updated successfully',
        variant: 'success'
      })

      // Refresh the current project to get updated data
      await refreshCurrentProject()
    } catch (error: unknown) {
      console.error('Update project error:', error)

      const errorMessage = error instanceof Error ? error.message : 'Failed to update project'

      showToast({
        title: 'Error',
        description: `Update failed: ${errorMessage}`,
        variant: 'destructive'
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleReset = () => {
    if (currentProject) {
      setTitle(currentProject.title || '')
      setDescription(currentProject.description || '')
    }
  }

  // Loading state - show skeleton until hydrated
  if (!hasHydrated) {
    return (
      <div className='flex h-screen bg-gray-50'>
        <Sidebar isOpen={isSidebarOpen} onToggle={toggleSidebar} currentProject={currentProject} />
        <div className='flex-1 flex flex-col overflow-hidden min-h-0'>
          <Navbar isSidebarOpen={isSidebarOpen} toggleSidebar={toggleSidebar} />

          <div className='flex-none w-full p-6 pb-4 bg-transparent'>
            <div className='flex items-center gap-3 mb-6'>
              <Skeleton className='h-10 w-10 rounded-lg' />
              <div className='space-y-2'>
                <Skeleton className='h-8 w-48' />
                <Skeleton className='h-4 w-64' />
              </div>
            </div>
          </div>

          <div className='flex-1 px-6 pb-6'>
            <div className='max-w-4xl mx-auto space-y-6'>
              <Card>
                <CardHeader>
                  <Skeleton className='h-6 w-40' />
                  <Skeleton className='h-4 w-64' />
                </CardHeader>
                <CardContent className='space-y-4'>
                  <div className='space-y-2'>
                    <Skeleton className='h-4 w-20' />
                    <Skeleton className='h-10 w-full' />
                  </div>
                  <div className='space-y-2'>
                    <Skeleton className='h-4 w-32' />
                    <Skeleton className='h-24 w-full' />
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className='flex h-screen bg-gray-50'>
      <Sidebar isOpen={isSidebarOpen} onToggle={toggleSidebar} currentProject={currentProject} />

      <div className='flex-1 flex flex-col overflow-hidden min-h-0'>
        <Navbar isSidebarOpen={isSidebarOpen} toggleSidebar={toggleSidebar} />

        <div className='flex flex-col flex-1 min-h-0 overflow-y-auto'>
          {/* Header */}
          <div className='flex-none w-full p-6 pb-4 bg-transparent'>
            <div className='flex items-center gap-3 mb-6'>
              <div className='p-2 bg-lavender-100 rounded-lg'>
                <SettingsIcon className='h-6 w-6 text-lavender-600' />
              </div>
              <div>
                <h1 className='text-3xl font-bold text-gray-900'>Project Settings</h1>
                <p className='text-sm text-gray-600'>Manage your project configuration and details</p>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className='flex-1 px-6 pb-6'>
            <div className='max-w-4xl mx-auto space-y-6'>
              {/* Project Information Card */}
              <Card className='border border-gray-200 shadow-sm'>
                <CardHeader>
                  <CardTitle className='text-xl text-gray-900'>Project Information</CardTitle>
                  <CardDescription>Update your project's basic information and description.</CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSaveProject} className='space-y-6'>
                    <div className='space-y-2'>
                      <Label htmlFor='project-title' className='text-sm font-medium text-gray-700'>
                        Project Name *
                      </Label>
                      <Input
                        id='project-title'
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder='Enter project name'
                        required
                        disabled={isSubmitting}
                        className='border-gray-300 focus:border-lavender-500 focus:ring-lavender-500'
                      />
                    </div>

                    <div className='space-y-2'>
                      <Label htmlFor='project-description' className='text-sm font-medium text-gray-700'>
                        Project Description
                      </Label>
                      <Textarea
                        id='project-description'
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder='Enter project description (optional)'
                        disabled={isSubmitting}
                        rows={4}
                        className='border-gray-300 focus:border-lavender-500 focus:ring-lavender-500 resize-none'
                      />
                    </div>

                    <div className='flex justify-end gap-3'>
                      <Button
                        type='button'
                        variant='outline'
                        onClick={handleReset}
                        disabled={isSubmitting || !hasChanges}
                        className='border-gray-300 text-gray-700 hover:bg-gray-50'
                      >
                        Reset
                      </Button>
                      <Button
                        type='submit'
                        disabled={isSubmitting || !hasChanges || !title.trim()}
                        className='bg-lavender-600 hover:bg-lavender-700 text-white'
                      >
                        {isSubmitting ? (
                          <>
                            <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                            Saving...
                          </>
                        ) : (
                          <>
                            <Save className='mr-2 h-4 w-4' />
                            Save Changes
                          </>
                        )}
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>

              <Separator className='my-6' />

              {/* Project Details Card */}
              <Card className='border border-gray-200 shadow-sm'>
                <CardHeader>
                  <CardTitle className='text-xl text-gray-900'>Project Details</CardTitle>
                  <CardDescription>View and copy important project information.</CardDescription>
                </CardHeader>
                <CardContent className='space-y-4'>
                  <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
                    <div className='space-y-2'>
                      <Label className='text-sm font-medium text-gray-700'>Project ID</Label>
                      <div className='flex items-center gap-2'>
                        <Input
                          value={currentProject?.id || ''}
                          readOnly
                          className='bg-gray-50 border-gray-300 text-gray-600 cursor-default font-mono text-sm'
                        />
                        <Button
                          type='button'
                          variant='outline'
                          size='sm'
                          onClick={handleCopyProjectId}
                          className='border-gray-300 text-gray-700 hover:bg-gray-50 flex-shrink-0'
                        >
                          <Copy className='h-4 w-4' />
                        </Button>
                      </div>
                      <p className='text-xs text-gray-500'>
                        This unique identifier is used for project integration and API access.
                      </p>
                    </div>

                    <div className='space-y-2'>
                      <Label className='text-sm font-medium text-gray-700'>Created Date</Label>
                      <Input
                        value={
                          currentProject?.createdAt
                            ? new Date(currentProject.createdAt).toLocaleDateString('en-US', {
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric'
                              })
                            : 'Unknown'
                        }
                        readOnly
                        className='bg-gray-50 border-gray-300 text-gray-600 cursor-default'
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
