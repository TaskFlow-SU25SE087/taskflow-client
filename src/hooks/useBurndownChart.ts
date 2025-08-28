import { useState, useEffect } from 'react'
import { teamActivityReportApi } from '@/api/teamActivityReport'
import { BurndownChartData } from '@/types/report'

export const useBurndownChart = (projectId?: string, sprintId?: string) => {
  const [burndownData, setBurndownData] = useState<BurndownChartData | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchBurndownChart = async (pid: string, sid: string) => {
    setLoading(true)
    setError(null)
    try {
      const data = await teamActivityReportApi.getBurndownChart(pid, sid)
      setBurndownData(data)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch burndown chart'
      setError(errorMessage)
      setBurndownData(null)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (projectId && sprintId) {
      fetchBurndownChart(projectId, sprintId)
    }
  }, [projectId, sprintId])

  const refetch = () => {
    if (projectId && sprintId) {
      fetchBurndownChart(projectId, sprintId)
    }
  }

  return {
    burndownData,
    loading,
    error,
    refetch
  }
}
