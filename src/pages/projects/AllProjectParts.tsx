import { getGitMembers } from '@/api/gitmembers'
import { getProjectParts } from '@/api/projectParts'
import { projectApi } from '@/api/projects'
import { Navbar } from '@/components/Navbar'
import { GitMemberLocalDialog } from '@/components/projects/GitMemberLocalDialog'
import { Sidebar } from '@/components/Sidebar'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Loader } from '@/components/ui/loader'
import { ProjectMember } from '@/types/project'
import { Code2, Github, Users, Zap } from 'lucide-react'
import { useEffect, useState } from 'react'

import { GitMemberFull } from '@/types/project'

type GitMember = GitMemberFull

interface ProjectPart {
  id: string
  name: string
  programmingLanguage: string
  framework: string
  repoUrl?: string
  isConnected?: boolean
  projectId: string
  gitMembers?: GitMember[]
}

export default function AllProjectParts() {
  const [parts, setParts] = useState<ProjectPart[]>([])
  const [loading, setLoading] = useState(true)
  const [showGitMemberDialog, setShowGitMemberDialog] = useState(false)
  const [selectedPart, setSelectedPart] = useState<ProjectPart | null>(null)
  const [projectMembers, setProjectMembers] = useState<ProjectMember[]>([])
  const [isSidebarOpen, setIsSidebarOpen] = useState(true)

  useEffect(() => {
    const fetchAllParts = async () => {
      setLoading(true)
      try {
        // Lấy danh sách tất cả projects
        const projectsRes = await projectApi.getProjects()
        const projects = projectsRes.data || []
        // Lấy parts của từng project
        const allParts: ProjectPart[] = []
        for (const project of projects) {
          try {
            const partsRes = await getProjectParts(project.id)
            const partsData = partsRes.data || []
            for (const part of partsData) {
              // Lấy git members cho từng part
              let gitMembers: GitMember[] = []
              try {
                const gitRes = await getGitMembers(project.id, part.id)
                gitMembers = gitRes.data.data || []
              } catch {
                gitMembers = []
              }
              allParts.push({ ...part, projectId: project.id, gitMembers })
            }
          } catch (err) {
            // Bỏ qua lỗi từng project
            console.warn(`Failed to fetch parts for project ${project.id}:`, err)
          }
        }
        setParts(allParts)
      } catch (err) {
        console.error('Failed to fetch projects:', err)
        setParts([])
      } finally {
        setLoading(false)
      }
    }

    fetchAllParts()
  }, [])

  const handleOpenGitMemberDialog = async (part: ProjectPart) => {
    setSelectedPart(part)
    setShowGitMemberDialog(true)

    // Lấy project members thật từ API
    try {
      const membersRes = await projectApi.getProjectMembers(part.projectId)
      setProjectMembers(
        Array.isArray(membersRes)
          ? membersRes
          : membersRes && typeof membersRes === 'object' && 'data' in membersRes
            ? // eslint-disable-next-line @typescript-eslint/no-explicit-any
              (membersRes as any).data
            : []
      )
    } catch (err) {
      console.error('Failed to fetch project members:', err)
      setProjectMembers([])
    }
  }

  const handleCloseGitMemberDialog = () => {
    setShowGitMemberDialog(false)
    setSelectedPart(null)
    setProjectMembers([])
  }

  const getLanguageIcon = (language: string) => {
    const lang = language.toLowerCase()
    if (lang.includes('javascript') || lang.includes('js')) {
      return (
        <img
          src='https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/javascript/javascript-original.svg'
          alt='JavaScript'
          className='w-6 h-6'
        />
      )
    }
    if (lang.includes('typescript') || lang.includes('ts')) {
      return (
        <img
          src='https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/typescript/typescript-original.svg'
          alt='TypeScript'
          className='w-6 h-6'
        />
      )
    }
    if (lang.includes('python')) {
      return (
        <img
          src='https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/python/python-original.svg'
          alt='Python'
          className='w-6 h-6'
        />
      )
    }
    if (lang.includes('java')) {
      return (
        <img
          src='https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/java/java-original.svg'
          alt='Java'
          className='w-6 h-6'
        />
      )
    }
    if (lang.includes('c#')) {
      return (
        <img
          src='https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/csharp/csharp-original.svg'
          alt='C#'
          className='w-6 h-6'
        />
      )
    }
    if (lang.includes('php')) {
      return (
        <img
          src='https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/php/php-original.svg'
          alt='PHP'
          className='w-6 h-6'
        />
      )
    }
    if (lang.includes('go')) {
      return (
        <img
          src='https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/go/go-original.svg'
          alt='Go'
          className='w-6 h-6'
        />
      )
    }
    if (lang.includes('rust')) {
      return (
        <img
          src='https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/rust/rust-plain.svg'
          alt='Rust'
          className='w-6 h-6'
        />
      )
    }
    if (lang.includes('swift')) {
      return (
        <img
          src='https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/swift/swift-original.svg'
          alt='Swift'
          className='w-6 h-6'
        />
      )
    }
    if (lang.includes('kotlin')) {
      return (
        <img
          src='https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/kotlin/kotlin-original.svg'
          alt='Kotlin'
          className='w-6 h-6'
        />
      )
    }
    return (
      <img
        src='https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/c/c-original.svg'
        alt='Code'
        className='w-6 h-6'
      />
    )
  }

  const getLanguageColor = (language: string) => {
    const lang = language.toLowerCase()
    if (lang.includes('javascript') || lang.includes('js')) return 'bg-yellow-100 text-yellow-800'
    if (lang.includes('typescript') || lang.includes('ts')) return 'bg-blue-100 text-blue-800'
    if (lang.includes('python')) return 'bg-green-100 text-green-800'
    if (lang.includes('java')) return 'bg-orange-100 text-orange-800'
    if (lang.includes('c#')) return 'bg-purple-100 text-purple-800'
    if (lang.includes('php')) return 'bg-indigo-100 text-indigo-800'
    if (lang.includes('go')) return 'bg-cyan-100 text-cyan-800'
    if (lang.includes('rust')) return 'bg-red-100 text-red-800'
    if (lang.includes('swift')) return 'bg-pink-100 text-pink-800'
    if (lang.includes('kotlin')) return 'bg-orange-100 text-orange-800'
    return 'bg-gray-100 text-gray-800'
  }

  return (
    <div className='flex min-h-screen bg-gray-50'>
      <Sidebar isOpen={isSidebarOpen} onToggle={() => setIsSidebarOpen((v) => !v)} />
      <div className='flex-1'>
        <Navbar isSidebarOpen={isSidebarOpen} toggleSidebar={() => setIsSidebarOpen((v) => !v)} />
        <div className='max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8'>
          {/* Header Section */}
          <div className='mb-8'>
            <div className='flex items-center gap-3 mb-4'>
              <div className='p-3 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl'>
                <Code2 className='h-8 w-8 text-white' />
              </div>
              <div>
                <h1 className='text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent'>
                  All Project Parts
                </h1>
                <p className='text-gray-600 mt-1'>Manage and configure Git members for all your project components</p>
              </div>
            </div>

            {/* Stats */}
            <div className='grid grid-cols-1 md:grid-cols-3 gap-4 mb-6'>
              <div className='bg-white rounded-xl p-4 shadow-sm border border-gray-100'>
                <div className='flex items-center gap-3'>
                  <div className='p-2 bg-blue-100 rounded-lg'>
                    <Code2 className='h-5 w-5 text-blue-600' />
                  </div>
                  <div>
                    <p className='text-sm text-gray-600'>Total Parts</p>
                    <p className='text-2xl font-bold text-gray-900'>{parts.length}</p>
                  </div>
                </div>
              </div>
              <div className='bg-white rounded-xl p-4 shadow-sm border border-gray-100'>
                <div className='flex items-center gap-3'>
                  <div className='p-2 bg-purple-100 rounded-lg'>
                    <Github className='h-5 w-5 text-purple-600' />
                  </div>
                  <div>
                    <p className='text-sm text-gray-600'>GitHub</p>
                    <p className='text-2xl font-bold text-gray-900'>{parts.filter((p) => p.repoUrl).length}</p>
                  </div>
                </div>
              </div>
              <div className='bg-white rounded-xl p-4 shadow-sm border border-gray-100'>
                <div className='flex items-center gap-3'>
                  <div className='p-2 bg-orange-100 rounded-lg'>
                    <Zap className='h-5 w-5 text-orange-600' />
                  </div>
                  <div>
                    <p className='text-sm text-gray-600'>Active</p>
                    <p className='text-2xl font-bold text-gray-900'>{parts.length}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Content */}
          {loading ? (
            <div className='flex items-center justify-center py-20'>
              <div className='text-center'>
                <Loader className='mx-auto mb-4' />
                <p className='text-gray-600'>Loading project parts...</p>
              </div>
            </div>
          ) : parts.length === 0 ? (
            <div className='text-center py-20'>
              <div className='p-8 bg-white rounded-2xl shadow-sm border border-gray-100 max-w-md mx-auto'>
                <div className='p-4 bg-gray-100 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center'>
                  <Code2 className='h-8 w-8 text-gray-400' />
                </div>
                <h3 className='text-lg font-semibold text-gray-900 mb-2'>No Project Parts Found</h3>
                <p className='text-gray-600 mb-6'>
                  Create your first project part to get started with Git member management.
                </p>
                <Button className='bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700'>
                  <Code2 className='h-4 w-4 mr-2' />
                  Create Project Part
                </Button>
              </div>
            </div>
          ) : (
            <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
              {parts.map((part) => (
                <Card
                  key={part.id}
                  className='group hover:shadow-lg transition-all duration-300 border-0 shadow-sm bg-white/80 backdrop-blur-sm'
                >
                  <CardHeader className='pb-4'>
                    <div className='flex items-start justify-between'>
                      <div className='flex items-center gap-3'>
                        <div className='p-2 bg-gradient-to-r from-blue-100 to-purple-100 rounded-lg'>
                          <Code2 className='h-5 w-5 text-blue-600' />
                        </div>
                        <div>
                          <CardTitle className='text-lg font-semibold text-gray-900 group-hover:text-blue-600 transition-colors'>
                            {part.name}
                          </CardTitle>
                        </div>
                      </div>
                      {part.isConnected && (
                        <div className='p-1 bg-green-100 rounded-full'>
                          <Github className='h-4 w-4 text-green-600' />
                        </div>
                      )}
                    </div>
                  </CardHeader>

                  <CardContent className='space-y-4'>
                    <div className='space-y-3'>
                      <div className='flex items-center gap-2'>
                        <span className='text-2xl'>{getLanguageIcon(part.programmingLanguage)}</span>
                        <span
                          className={`px-3 py-1 rounded-full text-sm font-medium ${getLanguageColor(part.programmingLanguage)}`}
                        >
                          {part.programmingLanguage}
                        </span>
                      </div>

                      {part.framework && part.framework !== 'None' && (
                        <div className='flex items-center gap-2'>
                          <div className='w-2 h-2 bg-purple-400 rounded-full'></div>
                          <span className='text-sm text-gray-600 font-medium'>{part.framework}</span>
                        </div>
                      )}

                      {part.repoUrl && (
                        <div className='flex items-center gap-2 text-sm text-gray-500'>
                          <Github className='h-4 w-4' />
                          <a
                            href={part.repoUrl}
                            target='_blank'
                            rel='noopener noreferrer'
                            className='truncate text-blue-600 hover:text-blue-800 hover:underline cursor-pointer'
                            title={part.repoUrl}
                          >
                            {part.repoUrl}
                          </a>
                        </div>
                      )}
                    </div>

                    <div className='pt-4 border-t border-gray-100'>
                      <div className='mb-2 font-semibold text-gray-700 flex items-center gap-2'>
                        <Users className='h-4 w-4' /> Git Members
                      </div>
                      {part.gitMembers && part.gitMembers.length > 0 ? (
                        <ul className='mb-2 space-y-1'>
                          {part.gitMembers.map((member) => (
                            <li
                              key={member.id}
                              className='flex items-center gap-3 text-sm text-gray-700 py-2 border-b last:border-b-0'
                            >
                              {member.gitAvatarUrl ? (
                                <img
                                  src={member.gitAvatarUrl}
                                  alt='avatar'
                                  className='w-9 h-9 rounded-full border-2 border-blue-300 shadow'
                                />
                              ) : (
                                <div className='w-9 h-9 rounded-full bg-gray-200 flex items-center justify-center text-gray-400 font-bold border-2 border-gray-200'>
                                  ?
                                </div>
                              )}
                              <div className='flex flex-col'>
                                <span className='font-semibold'>{member.gitName || member.nameLocal || '-'}</span>
                                {member.gitEmail && (
                                  <span className='text-xs text-gray-500'>Git Email: {member.gitEmail}</span>
                                )}
                                {member.nameLocal && (
                                  <span className='text-xs text-gray-500'>Local Name: {member.nameLocal}</span>
                                )}
                                {member.emailLocal && (
                                  <span className='text-xs text-gray-500'>Local Email: {member.emailLocal}</span>
                                )}
                              </div>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <div className='text-gray-400 text-sm italic'>No Git Members Configured</div>
                      )}
                      <Button
                        variant='outline'
                        size='sm'
                        className='w-full bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200 hover:from-blue-100 hover:to-purple-100 hover:border-blue-300 transition-all duration-200 mt-2'
                        onClick={() => handleOpenGitMemberDialog(part)}
                      >
                        <Users className='h-4 w-4 mr-2' />
                        Manage Git Members
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>

      <GitMemberLocalDialog
        isOpen={showGitMemberDialog}
        onOpenChange={(open) => {
          if (!open) handleCloseGitMemberDialog()
        }}
        projectId={selectedPart?.projectId || ''}
        projectPartId={selectedPart?.id || ''}
        projectMembers={projectMembers}
      />
    </div>
  )
}
