/* eslint-disable @typescript-eslint/no-explicit-any */
import { Navbar } from '@/components/Navbar'
import ProjectCard from '@/components/projects/ProjectCard'
import { ProjectCardSkeleton } from '@/components/projects/ProjectCardSkeleton'
import { ProjectListFilter } from '@/components/projects/ProjectListFilter'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useCurrentProject } from '@/hooks/useCurrentProject'
import { useProjects } from '@/hooks/useProjects'
import debounce from 'debounce'
import { ChevronLeft, ChevronRight, Search, Share2 } from 'lucide-react'
import { useCallback } from 'react'
import { FiPlus } from 'react-icons/fi'
import { Navigate, useNavigate, useSearchParams } from 'react-router-dom'

export default function ProjectList() {
  const [searchParams] = useSearchParams()
  const viewParam = searchParams.get('view')
  
  const {
    projects,
    isLoading,
    setSearchQuery,
    filterStatus,
    setFilterStatus,
    sortBy,
    setSortBy,
    currentPage,
    totalPages,
    totalItems,
    goToPage,
    fetchProjects
  } = useProjects()
  
  // If view=sprint-meetings, redirect to first project's sprint-meetings
  if (viewParam === 'sprint-meetings' && !isLoading && projects && projects.length > 0) {
    return <Navigate to={`/projects/${projects[0].id}/sprint-meetings`} replace />
  }
  const navigate = useNavigate()
  const { setCurrentProjectId } = useCurrentProject()

  const handleSelectProject = (id: string) => {
    setCurrentProjectId(id)
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

  const renderPagination = () => {
    if (totalPages <= 1) return null

    const pages = []
    const maxVisiblePages = 5
    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2))
    const endPage = Math.min(totalPages, startPage + maxVisiblePages - 1)

    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1)
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(
        <Button
          key={i}
          variant={i === currentPage ? 'default' : 'outline'}
          size='sm'
          onClick={() => goToPage(i)}
          className={i === currentPage ? 'bg-lavender-700 hover:bg-lavender-800' : ''}
        >
          {i}
        </Button>
      )
    }

    return (
      <div className='flex items-center justify-center gap-2 mt-6'>
        <Button variant='outline' size='sm' onClick={() => goToPage(currentPage - 1)} disabled={currentPage === 1}>
          <ChevronLeft className='h-4 w-4' />
        </Button>
        {pages}
        <Button
          variant='outline'
          size='sm'
          onClick={() => goToPage(currentPage + 1)}
          disabled={currentPage === totalPages}
        >
          <ChevronRight className='h-4 w-4' />
        </Button>
      </div>
    )
  }

  return (
    <div className='flex h-screen bg-gray-100'>
      <div className='flex-1 overflow-hidden'>
        <Navbar isSidebarOpen={false} toggleSidebar={() => {}} />

        <div className='p-6'>
          <div className='flex items-center justify-between'>
            <div className='flex items-center gap-4'>
              <h1 className='text-4xl font-bold'>Projects</h1>
              {totalItems > 0 && <span className='text-sm text-gray-500'>({totalItems} projects)</span>}
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
                <ProjectCard
                  key={project.id}
                  project={project}
                  onSelect={handleSelectProject}
                  onProjectUpdated={() => {
                    if (typeof fetchProjects === 'function') fetchProjects()
                  }}
                />
              ))
            ) : (
              <div className='col-span-full text-center text-gray-500'>No projects found matching your criteria</div>
            )}
          </div>
          {renderPagination()}
        </ScrollArea>
      </div>
    </div>
  )
}
