import { projectApi } from '@/api/projects'
import { Project } from '@/types/project'
import Cookies from 'js-cookie'
import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'

const CURRENT_PROJECT_COOKIE = 'current_project_id'
const CURRENT_PROJECT_LOCAL = 'currentProjectId'

export const useCurrentProject = () => {
  const [currentProject, setCurrentProject] = useState<Project | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const navigate = useNavigate()
  const { projectId: urlProjectId } = useParams<{ projectId: string }>()

  const fetchProject = async (projectId: string) => {
    try {
      console.log('[useCurrentProject] Calling API with projectId:', projectId)
      const response = await projectApi.getProjectById(projectId)
      console.log('[useCurrentProject] API response:', response)
      console.log('[useCurrentProject] response.data:', response.data)

      if (!response.data) {
        console.error('[useCurrentProject] No data in response')
        throw new Error('No data received from API')
      }

      setCurrentProject({
        ...response.data,
        analysisResults: [],
        boards: response.data.boards || [],
        projectMembers: [],
        sprints: [],
        taskPs: []
      })

      // Save to cookie/localStorage for next visit
      Cookies.set(CURRENT_PROJECT_COOKIE, projectId, { path: '/' })
      localStorage.setItem(CURRENT_PROJECT_LOCAL, projectId)
    } catch (error) {
      console.error('Failed to fetch project:', error)
      const err = error as any
      if (err && err.response) {
        console.error('[useCurrentProject] error.response:', err.response)
        console.error('[useCurrentProject] error.response.data:', err.response.data)
        console.error('[useCurrentProject] error.response.status:', err.response.status)
      }
      if (err?.response?.status === 404) {
        Cookies.remove(CURRENT_PROJECT_COOKIE)
        localStorage.removeItem(CURRENT_PROJECT_LOCAL)
        navigate('/projects')
      }
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (urlProjectId) {
      // URL has project ID - use it (Jira-style)
      setCurrentProject(null)
      fetchProject(urlProjectId)
    } else {
      // No URL project ID, try to load from cookie and redirect
      let savedProjectId = Cookies.get(CURRENT_PROJECT_COOKIE)
      if (!savedProjectId) {
        savedProjectId = localStorage.getItem(CURRENT_PROJECT_LOCAL) || undefined
      }

      if (savedProjectId) {
        // Redirect to project URL instead of loading
        navigate(`/projects/${savedProjectId}/board`)
      } else {
        setIsLoading(false)
      }
    }
  }, [urlProjectId, navigate])

  const setCurrentProjectId = (projectId: string) => {
    // Navigate to project URL instead of just saving
    navigate(`/projects/${projectId}/board`)
  }

  const refreshCurrentProject = async () => {
    if (urlProjectId) {
      fetchProject(urlProjectId)
    }
  }

  useEffect(() => {
    console.log('[useCurrentProject] currentProject:', currentProject)
  }, [currentProject])

  return {
    currentProject,
    setCurrentProjectId,
    isLoading,
    refreshCurrentProject
  }
}
