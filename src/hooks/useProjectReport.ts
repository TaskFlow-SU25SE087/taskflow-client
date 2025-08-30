import { useEffect, useState } from 'react'
import { reportsApi } from '@/api/reports'
import { ProjectReport } from '@/types/report'

interface UseProjectReportReturn {
  report: ProjectReport | null
  loading: boolean
  error: string | null
  refetch: () => Promise<void>
}

export const useProjectReport = (projectId: string | undefined): UseProjectReportReturn => {
  const [report, setReport] = useState<ProjectReport | null>(null)
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)

  const fetchReport = async () => {
    if (!projectId) return
    try {
      setLoading(true)
      setError(null)
      const data = await reportsApi.getProjectReport(projectId)
      setReport(data)
    } catch (err: any) {
      console.error('[useProjectReport] Error fetching project report:', err)
      setError(err?.message || 'Failed to load project report')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchReport()
  }, [projectId])

  return { report, loading, error, refetch: fetchReport }
}
