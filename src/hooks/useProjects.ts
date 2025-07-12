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
  const [totalPages, setTotalPages] = useState(1)
  const [totalItems, setTotalItems] = useState(0)
  const { user } = useAuth()

  // Đưa fetchProjects ra ngoài để có thể gọi lại
  const fetchProjects = async () => {
    try {
      if (!user?.id) {
        throw new Error('User not authenticated')
      }
      const response = await projectApi.getProjects()
      const mapped = response.data.map((project: any) => ({
        ...project,
        ownerId: project.ownerId ?? ''
      }))
      setProjects(mapped)
      setTotalItems(mapped.length)
      setTotalPages(Math.ceil(mapped.length / 6)) // 6 items per page
    } catch (error) {
      console.error('Error fetching projects:', error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchProjects()
  }, [user])

  const filteredAndSortedProjects = useMemo(() => {
    let result = [...projects]

    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      result = result.filter((project) => project.title.toLowerCase().includes(query))
    }

    // Apply status filter
    if (filterStatus !== 'all') {
      result = result.filter((project) => project.status === filterStatus)
    }

    // Apply sorting
    result.sort((a, b) => {
      switch (sortBy) {
        case 'newest':
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        case 'oldest':
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        case 'name':
          return a.title.localeCompare(b.title)
        default:
          return 0
      }
    })

    return result
  }, [projects, searchQuery, filterStatus, sortBy])

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
    filterStatus,
    setFilterStatus,
    sortBy,
    setSortBy,
    currentPage,
    totalPages,
    totalItems,
    goToPage,
    fetchProjects
  }
}
