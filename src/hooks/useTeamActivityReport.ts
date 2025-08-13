import { useCallback, useEffect, useRef, useState } from 'react'
import { ProjectReport } from '@/types/report'
import { teamActivityReportApi, TeamActivityReportQuery } from '@/api/teamActivityReport'

interface UseTeamActivityReportReturn {
  report: ProjectReport | null
  loading: boolean
  error: string | null
  refetch: (override?: TeamActivityReportQuery) => Promise<void>
  setQuery: React.Dispatch<React.SetStateAction<TeamActivityReportQuery>>
  query: TeamActivityReportQuery
}

const defaultQuery: TeamActivityReportQuery = {
  includeTaskDetails: true,
  includeCommentDetails: true,
  includeTopContributors: true,
  topContributorsCount: 5
}

export const useTeamActivityReport = (
  projectId: string | undefined,
  initialQuery: TeamActivityReportQuery = {}
): UseTeamActivityReportReturn => {
  const [report, setReport] = useState<ProjectReport | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [query, setQuery] = useState<TeamActivityReportQuery>({ ...defaultQuery, ...initialQuery })

  const lastProjectIdRef = useRef<string | undefined>(projectId)

  // When project changes, clear previous data immediately to avoid showing stale content
  useEffect(() => {
    if (lastProjectIdRef.current !== projectId) {
      lastProjectIdRef.current = projectId
      setReport(null)
      if (projectId) setLoading(true)
    }
  }, [projectId])

  const fetchReport = useCallback(
    async (override?: TeamActivityReportQuery) => {
      if (!projectId) return
      try {
        setLoading(true)
        setError(null)
        const q = { ...query, ...(override || {}) }
        const data = await teamActivityReportApi.get(projectId, q)
        setReport(data)
      } catch (err: any) {
        console.error('[useTeamActivityReport] fetch error', err)
        setError(err?.message || 'Failed to load team activity report')
      } finally {
        setLoading(false)
      }
    },
    [projectId, query]
  )

  useEffect(() => {
    fetchReport()
  }, [fetchReport])

  return { report, loading, error, refetch: fetchReport, setQuery, query }
}
