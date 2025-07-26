import { projectApi } from '@/api/projects'
import { ProjectListItem } from '@/types/project'
import { useEffect, useMemo, useState, useCallback } from 'react'
import { useAuth } from './useAuth'

export function useProjects() {
  const [projects, setProjects] = useState<ProjectListItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'name'>('newest')
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'archived'>('all')
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalItems, setTotalItems] = useState(0)
  const { user } = useAuth()

  const fetchProjects = useCallback(async (): Promise<void> => {
    try {
      if (!user?.id) {
        throw new Error('User not authenticated')
      }
      const response = await projectApi.getProjects()
      const mapped = response.data.map((project: Partial<ProjectListItem>) => ({
        id: project.id || '',
        title: project.title || '',
        description: project.description || '',
        ownerId: project.ownerId || '',
        lastUpdate: project.lastUpdate || '',
        role: project.role || '',
        createdAt: project.lastUpdate || '' // Use lastUpdate as createdAt if not available
      }))
      setProjects(mapped)
      setTotalItems(mapped.length)
      setTotalPages(Math.ceil(mapped.length / 6)) // 6 items per page
    } catch (error) {
      console.error('Error fetching projects:', error)
    } finally {
      setIsLoading(false)
    }
  }, [user?.id])

  useEffect(() => {
    void fetchProjects()
  }, [fetchProjects])

  const filteredAndSortedProjects = useMemo(() => {
    let result = [...projects]

    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      result = result.filter((project) => project.title.toLowerCase().includes(query))
    }

      // Apply sorting
    result.sort((a, b) => {
      switch (sortBy) {
        case 'newest':
          return new Date(b.lastUpdate || '').getTime() - new Date(a.lastUpdate || '').getTime()
        case 'oldest':
          return new Date(a.lastUpdate || '').getTime() - new Date(b.lastUpdate || '').getTime()
        case 'name':
          return a.title.localeCompare(b.title)
        default:
          return 0
      }
    })

    return result
  }, [projects, searchQuery, sortBy])

  // Paginate the results
  const paginatedProjects = useMemo(() => {
    const itemsPerPage = 6
    const startIndex = (currentPage - 1) * itemsPerPage
    const endIndex = startIndex + itemsPerPage
    return filteredAndSortedProjects.slice(startIndex, endIndex)
  }, [filteredAndSortedProjects, currentPage])

  const goToPage = (page: number) => {
    setCurrentPage(page)
  }

  // Update total pages when filtered results change
  useEffect(() => {
    setTotalPages(Math.ceil(filteredAndSortedProjects.length / 6))
    setTotalItems(filteredAndSortedProjects.length)
    if (currentPage > Math.ceil(filteredAndSortedProjects.length / 6)) {
      setCurrentPage(1)
    }
  }, [filteredAndSortedProjects, currentPage])

  return {
    projects: paginatedProjects,
    isLoading,
    searchQuery,
    setSearchQuery,
    sortBy,
    setSortBy,
    filterStatus,
    setFilterStatus,
    currentPage,
    totalPages,
    totalItems,
    goToPage,
    fetchProjects
  }
}
