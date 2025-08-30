import { issueApi } from '@/api/issues'
import { sprintApi } from '@/api/sprints'
import { taskApi } from '@/api/tasks'
import { Issue, IssuePriority, IssueStatus } from '@/types/issue'
import { Sprint } from '@/types/sprint'
import { TaskP } from '@/types/task'
import { useEffect, useState } from 'react'

interface ReportData {
  tasks: TaskP[]
  sprints: Sprint[]
  issues: Issue[]
  stats: {
    totalTasks: number
    completedTasks: number
    inProgressTasks: number
    pendingTasks: number
    totalSprints: number
    activeSprints: number
    completedSprints: number
    totalIssues: number
    openIssues: number
    resolvedIssues: number
    highPriorityIssues: number
    completionRate: number
    averageTaskDuration: number
    tasksByPriority: Record<string, number>
    tasksByStatus: Record<string, number>
    issuesByType: Record<string, number>
    issuesByPriority: Record<string, number>
  }
}

interface UseProjectReportsReturn {
  reportData: ReportData | null
  loading: boolean
  error: string | null
  refetch: () => Promise<void>
}

export const useProjectReports = (projectId: string | undefined): UseProjectReportsReturn => {
  const [reportData, setReportData] = useState<ReportData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const calculateStats = (tasks: TaskP[], sprints: Sprint[], issues: Issue[]) => {
    const normalizeStatus = (statusRaw: string | undefined) => {
      const s = statusRaw?.toLowerCase?.().trim() || ''
      if (s.includes('done') || s.includes('completed')) return 'done'
      if (s.includes('in progress') || s.includes('ongoing') || s.includes('active')) return 'ongoing'
      if (s.includes('to do') || s.includes('todo') || s.includes('not started') || s.includes('pending')) return 'todo'
      return s || 'unknown'
    }

    const normalizePriority = (raw: TaskP['priority']): 'Low' | 'Medium' | 'High' | 'Urgent' | 'Unknown' => {
      if (raw == null) return 'Unknown'
      if (typeof raw === 'number') {
        // Support 1..4 and Jira-like 0/10000/20000/30000
        if ([1, 2, 3, 4].includes(raw)) {
          return raw === 1 ? 'Low' : raw === 2 ? 'Medium' : raw === 3 ? 'High' : 'Urgent'
        }
        if (raw >= 30000) return 'Urgent'
        if (raw >= 20000) return 'High'
        if (raw >= 10000) return 'Medium'
        return 'Low'
      }
      const s = String(raw).toLowerCase().trim()
      if (s === 'low') return 'Low'
      if (s === 'medium') return 'Medium'
      if (s === 'high') return 'High'
      if (s === 'urgent' || s === 'critical') return 'Urgent'
      // numeric string support
      const n = Number(s)
      if (!Number.isNaN(n)) return normalizePriority(n as any)
      return 'Unknown'
    }

    const totalTasks = tasks.length
    const completedTasks = tasks.filter((task) => normalizeStatus(task.status) === 'done').length
    const inProgressTasks = tasks.filter((task) => normalizeStatus(task.status) === 'ongoing').length
    const pendingTasks = tasks.filter((task) => normalizeStatus(task.status) === 'todo').length

    const totalSprints = sprints.length
    const activeSprints = sprints.filter((sprint) => sprint.status === 1).length
    const completedSprints = sprints.filter((sprint) => sprint.status === 2).length

    const totalIssues = issues.length
    const openIssues = issues.filter((issue) => issue.status === IssueStatus.Open).length
    const resolvedIssues = issues.filter((issue) => issue.status === IssueStatus.Resolved).length
    const highPriorityIssues = issues.filter(
      (issue) => issue.priority === IssuePriority.High || issue.priority === IssuePriority.Urgent
    ).length

    const completionRate = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0

    // Calculate average task duration
    const completedTaskDurations = tasks
      .filter((task) => normalizeStatus(task.status) === 'done' && task.created && task.updated)
      .map((task) => {
        const created = new Date(task.created)
        const updated = new Date(task.updated)
        return (updated.getTime() - created.getTime()) / (1000 * 60 * 60 * 24) // days
      })

    const averageTaskDuration =
      completedTaskDurations.length > 0
        ? completedTaskDurations.reduce((sum, duration) => sum + duration, 0) / completedTaskDurations.length
        : 0

    // Group tasks by priority
    const tasksByPriority = tasks.reduce(
      (acc, task) => {
        const key = normalizePriority(task.priority)
        acc[key] = (acc[key] || 0) + 1
        return acc
      },
      {} as Record<string, number>
    )

    // Group tasks by status
    const tasksByStatus = tasks.reduce(
      (acc, task) => {
        const key = normalizeStatus(task.status)
        acc[key] = (acc[key] || 0) + 1
        return acc
      },
      {} as Record<string, number>
    )

    // Group issues by type
    const issuesByType = issues.reduce(
      (acc, issue) => {
        const type = issue.type?.toString() || 'Unknown'
        acc[type] = (acc[type] || 0) + 1
        return acc
      },
      {} as Record<string, number>
    )

    // Group issues by priority
    const issuesByPriority = issues.reduce(
      (acc, issue) => {
        const priority = issue.priority?.toString() || 'Unknown'
        acc[priority] = (acc[priority] || 0) + 1
        return acc
      },
      {} as Record<string, number>
    )

    return {
      totalTasks,
      completedTasks,
      inProgressTasks,
      pendingTasks,
      totalSprints,
      activeSprints,
      completedSprints,
      totalIssues,
      openIssues,
      resolvedIssues,
      highPriorityIssues,
      completionRate,
      averageTaskDuration,
      tasksByPriority,
      tasksByStatus,
      issuesByType,
      issuesByPriority
    }
  }

  const fetchReportData = async () => {
    if (!projectId) return

    try {
      setLoading(true)
      setError(null)

      // Fetch all data in parallel
      const [tasks, sprints, issues] = await Promise.all([
        taskApi.getTasksFromProject(projectId),
        sprintApi.getAllSprintsByProjectId(projectId),
        issueApi.getProjectIssues(projectId)
      ])

      // Calculate statistics
      const stats = calculateStats(tasks, sprints, issues)

      setReportData({
        tasks,
        sprints,
        issues,
        stats
      })
    } catch (err) {
      console.error('Error fetching report data:', err)
      setError('Failed to load report data')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchReportData()
  }, [projectId])

  return {
    reportData,
    loading,
    error,
    refetch: fetchReportData
  }
}
