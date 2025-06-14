/* eslint-disable @typescript-eslint/no-explicit-any */
import { Search, Share2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import ProjectCard from '@/components/projects/ProjectCard'
import { useNavigate } from 'react-router-dom'
import { ProjectCardSkeleton } from '@/components/projects/ProjectCardSkeleton'
import { useCurrentProject } from '@/hooks/useCurrentProject'
import { useProjects } from '@/hooks/useProjects'
import { ProjectListFilter } from '@/components/projects/ProjectListFilter'
import { useCallback } from 'react'
import debounce from 'debounce'
import { FiPlus } from 'react-icons/fi'
import { Navbar } from '@/components/Navbar'

export default function ProjectList() {
  const { projects, isLoading, setSearchQuery, filterStatus, setFilterStatus, sortBy, setSortBy } = useProjects()
  const navigate = useNavigate()
  const { setCurrentProjectId } = useCurrentProject()

  const handleSelectProject = (id: string) => {
    setCurrentProjectId(id)
    navigate('/board')
  }

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const debouncedSearch = useCallback(
    debounce((value: string) => {
      setSearchQuery(value)
    }, 300),
    []
  )

  const handleSearch = (value: string) => {
    debouncedSearch(value)
  }

  return (
    <div className='flex h-screen bg-gray-100'>
      <div className='flex-1 overflow-hidden'>
        <Navbar isSidebarOpen={false} toggleSidebar={() => {}} />

        <div className='p-6'>
          <div className='flex items-center justify-between'>
            <div className='flex items-center gap-4'>
              <h1 className='text-4xl font-bold'>Projects</h1>
            </div>
            <div className='flex items-center gap-3'>
              <Button
                onClick={() => {
                  navigate('/projects/new')
                }}
                variant='ghost'
                size='sm'
                className='text-lavender-700 hover:bg-lavender-700/10'
              >
                <FiPlus className='mr-2 h-4 w-4' />
                Add Project
              </Button>
            </div>
          </div>
          <div className='mt-4 flex items-center justify-between'>
            <div className='flex items-center gap-4'>
              <ProjectListFilter value={filterStatus} onValueChange={(value) => setFilterStatus(value as any)} />
              <div className='relative'>
                <Search className='absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 transform text-gray-400' />
                <Input
                  placeholder='Search projects...'
                  onChange={(e) => handleSearch(e.target.value)}
                  className='w-[180px] rounded-md bg-white pl-10 focus-visible:ring-offset-0 focus-visible:ring-0 border-gray-300'
                />
              </div>
            </div>
            <div className='flex gap-2'>
              <Button variant='outline' className='bg-white hover:bg-gray-50 focus:ring-0'>
                <Share2 className='mr-2 h-4 w-4' />
                Share
              </Button>
              <Select value={sortBy} onValueChange={(value) => setSortBy(value as 'newest' | 'oldest' | 'name')}>
                <SelectTrigger className='w-[180px] bg-white focus:ring-offset-0 focus:ring-0'>
                  <SelectValue placeholder='Sort by' />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='newest'>Newest</SelectItem>
                  <SelectItem value='oldest'>Oldest</SelectItem>
                  <SelectItem value='name'>Name</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <ScrollArea className='h-[calc(100vh-220px)]'>
          <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-6 pt-0'>
            {isLoading ? (
              [...Array(6)].map((_, index) => <ProjectCardSkeleton key={index} />)
            ) : projects.length > 0 ? (
              projects.map((project) => (
                <ProjectCard key={project.id} project={project} onSelect={handleSelectProject} />
              ))
            ) : (
              <div className='col-span-full text-center text-gray-500'>No projects found matching your criteria</div>
            )}
          </div>
        </ScrollArea>
      </div>
    </div>
  )
}
