import { projectApi } from '@/api/projects'
import { Project } from '@/types/project'
import Cookies from 'js-cookie'
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'

const CURRENT_PROJECT_COOKIE = 'current_project_id'
const CURRENT_PROJECT_LOCAL = 'currentProjectId'

export const useCurrentProject = () => {
  const [currentProject, setCurrentProject] = useState<Project | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
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
      } catch (error) {
        console.error('Failed to fetch project:', error)
        const err = error as any; if (err && err.response) {
          console.error('[useCurrentProject] error.response:', err.response)
          console.error('[useCurrentProject] error.response.data:', err.response.data)
          console.error('[useCurrentProject] error.response.status:', err.response.status)
        }
        // If project fetch fails, clear both cookie and localStorage
        Cookies.remove(CURRENT_PROJECT_COOKIE)
        localStorage.removeItem(CURRENT_PROJECT_LOCAL)
        navigate('/project')
      } finally {
        setIsLoading(false)
      }
    }

    let savedProjectId = Cookies.get(CURRENT_PROJECT_COOKIE)
    if (!savedProjectId) {
      savedProjectId = localStorage.getItem(CURRENT_PROJECT_LOCAL) || undefined
      if (savedProjectId) {
        // Sync cookie if only localStorage has it
        Cookies.set(CURRENT_PROJECT_COOKIE, savedProjectId, { path: '/' })
      }
    }
    console.log('[useCurrentProject] savedProjectId:', savedProjectId)
    if (savedProjectId) {
      setCurrentProject(null) // reset trước khi fetch
      fetchProject(savedProjectId)
    } else {
      setIsLoading(false)
    }
  }, [navigate])

  const setCurrentProjectId = (projectId: string) => {
    Cookies.set(CURRENT_PROJECT_COOKIE, projectId, { path: '/' })
    localStorage.setItem(CURRENT_PROJECT_LOCAL, projectId)
    console.log('[useCurrentProject] setCurrentProjectId:', projectId)
  }

  const refreshCurrentProject = async () => {
    let projectId = Cookies.get(CURRENT_PROJECT_COOKIE)
    if (!projectId) {
      projectId = localStorage.getItem(CURRENT_PROJECT_LOCAL) || undefined
    }
    console.log('[useCurrentProject] refreshCurrentProject, projectId:', projectId)
    if (projectId) {
      // fetchProject logic inline
      try {
        const response = await projectApi.getProjectById(projectId)
        setCurrentProject({
          ...response.data,
          analysisResults: [],
          boards: response.data.boards || [],
          projectMembers: [],
          sprints: [],
          taskPs: []
        })
      } catch (error) {
        console.error('Failed to fetch project:', error)
        const err = error as any; if (err && err.response) {
          console.error('[useCurrentProject] error.response:', err.response)
        }
        Cookies.remove(CURRENT_PROJECT_COOKIE)
        localStorage.removeItem(CURRENT_PROJECT_LOCAL)
        navigate('/project')
      } finally {
        setIsLoading(false)
      }
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
