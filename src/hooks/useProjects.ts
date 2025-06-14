import { useState, useEffect, useMemo } from 'react'
import { Project } from '@/types/project'
import { projectApi } from '@/api/projects'
import { useAuth } from './useAuth'

type FilterStatus = 'all' | 'active' | 'completed' | 'archived' // Placeholder

export function useProjects() {
  const [projects, setProjects] = useState<Project[]>([])
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
        const data = await projectApi.getProjects(user.id)
        setProjects(data)
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
