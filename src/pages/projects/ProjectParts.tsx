import { Navbar } from '@/components/Navbar'
import ProjectPartsList from '@/components/projects/ProjectPartsList'
import { Sidebar } from '@/components/Sidebar'
import { Loader } from '@/components/ui/loader'
import { useCurrentProject } from '@/hooks/useCurrentProject'
import React from 'react'
import { useParams } from 'react-router-dom'

export default function ProjectParts() {
  const { projectId } = useParams<{ projectId: string }>()
  const { currentProject, isLoading } = useCurrentProject()
  const [isSidebarOpen, setIsSidebarOpen] = React.useState(true)

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen)
  }

  if (isLoading || !currentProject) {
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
          <ProjectPartsList projectId={projectId!} />
        </div>
      </div>
    </div>
  )
}
