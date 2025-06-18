import { projectApi } from '@/api/projects'
import { ProjectListItem } from '@/types/project'
import { useEffect, useMemo, useState } from 'react'
import { useAuth } from './useAuth'

type FilterStatus = 'all' | 'active' | 'completed' | 'archived' // Placeholder

export function useProjects() {
  const [projects, setProjects] = useState<ProjectListItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all')
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'name'>('newest')
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(0)
  const [totalItems, setTotalItems] = useState(0)
  const { user } = useAuth()

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        if (!user?.id) {
          throw new Error('User not authenticated')
        }
        const response = await projectApi.getProjectList(currentPage)
        setProjects(response.data.items)
        setTotalPages(response.data.totalPages)
        setTotalItems(response.data.totalItems)
      } catch (error) {
        console.error('Error fetching projects:', error)
        // Fallback to old API if new one fails
        try {
          const data = await projectApi.getProjects(user.id)
          setProjects(data.map(project => ({
            id: project.id,
            title: project.title,
            description: project.description,
            ownerId: project.ownerId || '',
            lastUpdate: project.lastUpdate || new Date().toISOString(),
            role: 'Member' // Default role
          })))
        } catch (fallbackError) {
          console.error('Fallback API also failed:', fallbackError)
        }
      } finally {
        setIsLoading(false)
      }
    }

    fetchProjects()
  }, [user, currentPage])

  const filteredAndSortedProjects = useMemo(() => {
    let result = [...projects]

    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      result = result.filter((project) => project.title.toLowerCase().includes(query))
    }

    return result
  }, [projects, searchQuery])

  const goToPage = (page: number) => {
    setCurrentPage(page)
  }

  return {
    projects: filteredAndSortedProjects,
    isLoading,
    searchQuery,
    setSearchQuery,
    filterStatus,
    setFilterStatus,
    sortBy,
    setSortBy,
    currentPage,
    totalPages,
    totalItems,
    goToPage
  }
}
