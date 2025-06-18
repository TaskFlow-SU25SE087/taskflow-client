import { projectApi } from '@/api/projects'
import { Project } from '@/types/project'
import Cookies from 'js-cookie'
import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'

const CURRENT_PROJECT_COOKIE = 'current_project_id'

export const useCurrentProject = () => {
  const [currentProject, setCurrentProject] = useState<Project | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const navigate = useNavigate()

  const fetchProject = useCallback(
    async (projectId: string) => {
      try {
        const response = await projectApi.getProjectById(projectId)
        // Convert ProjectDetail to Project format for backward compatibility
        const project: Project = {
          id: response.data.id,
          title: response.data.title,
          description: response.data.description,
          ownerId: response.data.ownerId,
          createdAt: response.data.createdAt,
          lastUpdate: response.data.lastUpdate,
          analysisResults: [],
          boards: response.data.boards,
          projectMembers: [],
          sprints: [],
          taskPs: []
        }
        setCurrentProject(project)
      } catch (error) {
        console.error('Failed to fetch project:', error)
        // If project fetch fails, clear the cookie
        Cookies.remove(CURRENT_PROJECT_COOKIE)
        navigate('/projects')
      } finally {
        setIsLoading(false)
      }
    },
    [navigate]
  )

  useEffect(() => {
    const savedProjectId = Cookies.get(CURRENT_PROJECT_COOKIE)
    if (savedProjectId) {
      fetchProject(savedProjectId)
    } else {
      setIsLoading(false)
    }
  }, [fetchProject])

  const setCurrentProjectId = (projectId: string) => {
    Cookies.set(CURRENT_PROJECT_COOKIE, projectId, { path: '/' })
  }

  const refreshCurrentProject = useCallback(async () => {
    const projectId = Cookies.get(CURRENT_PROJECT_COOKIE)
    if (projectId) {
      await fetchProject(projectId)
    }
  }, [fetchProject])

  return {
    currentProject,
    setCurrentProjectId,
    isLoading,
    refreshCurrentProject
  }
}
