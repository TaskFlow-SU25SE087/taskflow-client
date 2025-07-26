import { projectApi } from '@/api/projects'
import { Navbar } from '@/components/Navbar'
import { Sidebar } from '@/components/Sidebar'
import { GitMemberLocalDialog } from '@/components/projects/GitMemberLocalDialog'
import { useCurrentProject } from '@/hooks/useCurrentProject'
import { ProjectMember } from '@/types/project'
import { Users } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { Button } from '../../components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card'

export default function ProjectGitMembers() {
  const { currentProject } = useCurrentProject()
  const params = useParams()
  const projectId = currentProject?.id || params.projectId
  const [projectMembers, setProjectMembers] = useState<ProjectMember[]>([])
  const [loading, setLoading] = useState(true)
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [showGitMemberDialog, setShowGitMemberDialog] = useState(false)
  const [selectedPartId, setSelectedPartId] = useState<string | null>(null)

  // Mock project parts for demonstration
  const projectParts = [
    { id: 'part-1', name: 'Frontend', programmingLanguage: 'TypeScript', framework: 'React' },
    { id: 'part-2', name: 'Backend', programmingLanguage: 'C#', framework: '.NET' },
    { id: 'part-3', name: 'Database', programmingLanguage: 'SQL', framework: 'Entity Framework' }
  ]

  const fetchProjectMembers = async () => {
    if (!projectId) return
    setLoading(true)
    try {
      const members = await projectApi.getProjectMembers(projectId)
      setProjectMembers(members)
    } catch (error) {
      console.error('Error fetching project members:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchProjectMembers()
  }, [projectId])

  const handleGitMemberDialogOpen = (partId: string) => {
    setSelectedPartId(partId)
    setShowGitMemberDialog(true)
  }

  if (loading) {
    return (
      <div className="flex h-screen bg-gray-100">
        <Sidebar isOpen={sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)} />
        <div className="flex-1 flex flex-col overflow-hidden">
          <Navbar isSidebarOpen={sidebarOpen} toggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-lavender-700 mx-auto"></div>
              <p className="mt-4 text-gray-600">Loading project members...</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-slate-50 via-white to-lavender-50">
      <Sidebar isOpen={sidebarOpen} onToggle={() => setSidebarOpen((v) => !v)} />
      <div className="flex-1 flex flex-col">
        <Navbar isSidebarOpen={sidebarOpen} toggleSidebar={() => setSidebarOpen((v) => !v)} />
        <main className="flex-1 max-w-6xl mx-auto p-4 sm:p-8">
          <div className="bg-white/70 backdrop-blur-lg rounded-3xl shadow-xl p-6 sm:p-10">
            <h1 className="text-3xl font-bold mb-6 text-gray-800 tracking-tight flex items-center gap-2">
              <Users className="h-8 w-8" />
              Git Member Local Management
            </h1>
            
            <p className="text-gray-600 mb-8">
              Manage local Git configuration for project members in each project part. 
              This allows you to set custom names and emails for Git commits within specific project components.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {projectParts.map((part) => (
                <Card key={part.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg">{part.name}</CardTitle>
                    <div className="text-sm text-gray-500">
                      {part.programmingLanguage} • {part.framework}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="text-sm text-gray-600">
                      <p><strong>Project Members:</strong> {projectMembers.length}</p>
                      <p><strong>Status:</strong> Ready to configure</p>
                    </div>
                    
                    <Button
                      onClick={() => handleGitMemberDialogOpen(part.id)}
                      className="w-full"
                      variant="outline"
                    >
                      <Users className="h-4 w-4 mr-2" />
                      Manage Git Members
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>

            {projectParts.length === 0 && (
              <Card>
                <CardContent className="text-center py-12">
                  <Users className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <h3 className="text-lg font-medium mb-2">No Project Parts</h3>
                  <p className="text-gray-600 mb-4">
                    Create project parts first to manage Git member local configurations
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </main>
      </div>

      {/* Git Member Local Dialog */}
      {selectedPartId && (
        <GitMemberLocalDialog
          projectId={projectId!}
          projectPartId={selectedPartId}
          projectMembers={projectMembers}
          isOpen={showGitMemberDialog}
          onOpenChange={setShowGitMemberDialog}
        />
      )}
    </div>
  )
} 