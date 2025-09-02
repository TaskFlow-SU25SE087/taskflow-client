import { Navbar } from '@/components/Navbar'
import ProjectPartsList from '@/components/projects/ProjectPartsList'
import { Sidebar } from '@/components/Sidebar'
import { Skeleton } from '@/components/ui/skeleton'
import { useCurrentProject } from '@/hooks/useCurrentProject'
import { Boxes } from 'lucide-react'
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
          <main className='flex-1 overflow-y-auto p-6'>
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
          </main>
        </div>
      </div>
    )
  }

  return (
    <div className='flex h-screen bg-gray-100'>
      <Sidebar isOpen={isSidebarOpen} onToggle={toggleSidebar} currentProject={currentProject} />

      <div className='flex-1 flex flex-col overflow-hidden'>
        <Navbar isSidebarOpen={isSidebarOpen} toggleSidebar={toggleSidebar} />

        <main className='flex-1 overflow-y-auto p-6'>
          <ProjectPartsList projectId={projectId!} />
        </main>
      </div>
    </div>
  )
}
