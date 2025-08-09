import { projectApi } from '@/api/projects'
import Cookies from 'js-cookie'
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import type { Project } from '@/types/project'

type Ctx = {
  currentProject: Project | null
  isLoading: boolean
  setCurrentProjectId: (projectId: string) => void
  refreshCurrentProject: () => Promise<void>
}

const CurrentProjectContext = createContext<Ctx | undefined>(undefined)

const CURRENT_PROJECT_COOKIE = 'current_project_id'
const CURRENT_PROJECT_LOCAL = 'currentProjectId'

export const CurrentProjectProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentProject, setCurrentProject] = useState<Project | null>(null)
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const navigate = useNavigate()
  const location = useLocation()

  // Extract projectId from URL path manually; useParams cannot be used reliably outside matched routes
  const activeProjectId = useMemo(() => {
    const match = location.pathname.match(/\/projects\/([^/]+)/)
    return match ? match[1] : undefined
  }, [location.pathname])

  const fetchProject = useCallback(
    async (projectId: string) => {
      try {
        setIsLoading(true)
        const response = await projectApi.getProjectById(projectId)
        if (!response?.data) throw new Error('No data received from API')

        // Normalize minimal fields used around the app
        setCurrentProject({
          ...response.data,
          analysisResults: [],
          boards: response.data.boards || [],
          projectMembers: [],
          sprints: [],
          taskPs: []
        })

        Cookies.set(CURRENT_PROJECT_COOKIE, projectId, { path: '/' })
        localStorage.setItem(CURRENT_PROJECT_LOCAL, projectId)
      } catch (err: any) {
        // On 404 or HTML response, clear and navigate away
        if (err?.response?.status === 404 || err?.isHtmlResponse) {
          Cookies.remove(CURRENT_PROJECT_COOKIE)
          localStorage.removeItem(CURRENT_PROJECT_LOCAL)
          setCurrentProject(null)
          navigate('/projects')
        }
        console.error('[CurrentProjectProvider] Fetch error:', err)
      } finally {
        setIsLoading(false)
      }
    },
    [navigate]
  )

  // Bootstrap on route changes
  useEffect(() => {
    // On /projects list page, do not auto-redirect/fetch
    if (location.pathname === '/projects') {
      setIsLoading(false)
      return
    }

    if (activeProjectId) {
      fetchProject(activeProjectId)
      return
    }

    // If no project in URL, only auto-redirect on legacy project routes or home
    const legacyProjectRoutes = new Set([
      '/',
      '/timeline',
      '/backlog',
      '/board',
      '/members',
      '/reports',
      '/commits',
      '/issues',
      '/github',
      '/sprint-meetings'
    ])

    if (legacyProjectRoutes.has(location.pathname)) {
      const saved = Cookies.get(CURRENT_PROJECT_COOKIE) || localStorage.getItem(CURRENT_PROJECT_LOCAL) || undefined
      if (saved) {
        navigate(`/projects/${saved}/board`)
        return
      }
    }

    // Nothing to do
    setIsLoading(false)
  }, [activeProjectId, location.pathname, fetchProject, navigate])

  const setCurrentProjectId = useCallback(
    (projectId: string) => {
      navigate(`/projects/${projectId}/board`)
    },
    [navigate]
  )

  const refreshCurrentProject = useCallback(async () => {
    if (activeProjectId) await fetchProject(activeProjectId)
  }, [activeProjectId, fetchProject])

  const value = useMemo(
    () => ({ currentProject, isLoading, setCurrentProjectId, refreshCurrentProject }),
    [currentProject, isLoading, setCurrentProjectId, refreshCurrentProject]
  )

  return <CurrentProjectContext.Provider value={value}>{children}</CurrentProjectContext.Provider>
}

export const useCurrentProjectContext = () => {
  const ctx = useContext(CurrentProjectContext)
  if (!ctx) throw new Error('useCurrentProjectContext must be used within CurrentProjectProvider')
  return ctx
}
