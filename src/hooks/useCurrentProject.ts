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
        setCurrentProject({
          ...response.data,
          analysisResults: [],
          boards: response.data.boards || [],
          projectMembers: [],
          sprints: [],
          taskPs: []
        }) // Sửa: chỉ lấy response.data
      } catch (error) {
        console.error('Failed to fetch project:', error)
        if (error && error.response) {
          console.error('[useCurrentProject] error.response:', error.response)
        }
        // If project fetch fails, clear the cookie
        Cookies.remove(CURRENT_PROJECT_COOKIE)
        navigate('/project')
      } finally {
        setIsLoading(false)
      }
    },
    [navigate]
  )

  useEffect(() => {
    const savedProjectId = Cookies.get(CURRENT_PROJECT_COOKIE)
    console.log('[useCurrentProject] savedProjectId:', savedProjectId)
    if (savedProjectId) {
      fetchProject(savedProjectId)
    } else {
      setIsLoading(false)
    }
  }, [fetchProject])

  const setCurrentProjectId = (projectId: string) => {
    Cookies.set(CURRENT_PROJECT_COOKIE, projectId, { path: '/' })
    console.log('[useCurrentProject] setCurrentProjectId:', projectId)
  }

  const refreshCurrentProject = useCallback(async () => {
    const projectId = Cookies.get(CURRENT_PROJECT_COOKIE)
    console.log('[useCurrentProject] refreshCurrentProject, projectId:', projectId)
    if (projectId) {
      await fetchProject(projectId)
    }
  }, [fetchProject])

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
