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
  const { user } = useAuth()

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        if (!user?.id) {
          throw new Error('User not authenticated')
        }
        const response = await projectApi.getProjects()
        // Map lại để đảm bảo có ownerId
        const mapped = response.data.map((project: any) => ({
          ...project,
          ownerId: project.ownerId ?? '',
        }))
        setProjects(mapped)
      } catch (error) {
        console.error('Error fetching projects:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchProjects()
  }, [user])

  const filteredAndSortedProjects = useMemo(() => {
    let result = [...projects]

    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      result = result.filter((project) => project.title.toLowerCase().includes(query))
    }

    return result
  }, [projects, searchQuery])

  return {
    projects: filteredAndSortedProjects,
    isLoading,
    searchQuery,
    setSearchQuery,
    filterStatus,
    setFilterStatus,
    sortBy,
    setSortBy
  }
}
