export interface ProjectReportResponse {
  code: number
  message: string
  data: ProjectReport
}

export interface ProjectReport {
  projectId: string
  projectTitle: string
  reportGeneratedAt: string
  startDate: string
  endDate: string
  memberActivities: MemberActivity[]
  summary: ProjectReportSummary
}

export interface MemberActivity {
  userId: string
  projectMemberId: string
  fullName: string
  avatar?: string
  email: string
  role: string
  taskStats: {
    totalAssigned: number
    totalCompleted: number
    totalInProgress: number
    totalTodo: number
    totalOverdue: number
    completionRate: number
    highPriorityTasks: number
    mediumPriorityTasks: number
    lowPriorityTasks: number
    urgentPriorityTasks: number
  }
  commentStats: {
    totalComments: number
    commentsThisWeek: number
    commentsThisMonth: number
    lastCommentDate?: string
    averageCommentsPerTask: number
  }
  effortPointStats: {
    totalAssignedEffortPoints: number
    totalCompletedEffortPoints: number
    totalInProgressEffortPoints: number
    totalTodoEffortPoints: number
    effortPointCompletionRate: number
    averageEffortPointsPerTask: number
    totalTasksWithEffortPoints: number
    totalTasksWithoutEffortPoints: number
  }
  taskActivities: Array<{
    taskId: string
    taskTitle: string
    priority: 'Low' | 'Medium' | 'High' | 'Urgent' | string
    status: string
    assignedAt?: string
    completedAt?: string
    deadline?: string
    isOverdue?: boolean
    sprintName?: string
    taskEffortPoints: number
    assignedEffortPoints: number
  }>
  commentActivities: Array<{
    commentId: string
    taskId: string
    taskTitle: string
    content: string
    createdAt: string
    lastUpdatedAt?: string
    attachmentUrls?: string[]
  }>
}

export interface ProjectReportSummary {
  totalMembers: number
  totalTasks: number
  totalCompletedTasks: number
  totalInProgressTasks: number
  totalTodoTasks: number
  totalOverdueTasks: number
  totalComments: number
  overallCompletionRate: number
  averageTasksPerMember: number
  averageCommentsPerTask: number
  totalAssignedEffortPoints: number
  totalCompletedEffortPoints: number
  totalInProgressEffortPoints: number
  totalTodoEffortPoints: number
  overallEffortPointCompletionRate: number
  averageEffortPointsPerTask: number
  averageEffortPointsPerMember: number
  totalTasksWithEffortPoints: number
  totalTasksWithoutEffortPoints: number
  topContributors: Array<{
    userId: string
    fullName: string
    completedTasks: number
    totalComments: number
    completedEffortPoints: number
    contributionScore: number
  }>
}

export interface BurndownChartResponse {
  code: number
  message: string
  data: BurndownChartData
}

export interface BurndownChartData {
  sprintId: string
  sprintName: string
  startDate: string
  endDate: string
  totalDays: number
  priorityEfforts: Array<{
    priority: string
    priorityName: string
    totalEffortPoints: number
    completedEffortPoints: number
    remainingEffortPoints: number
    completionPercentage: number
  }>
  dailyProgress: Array<{
    date: string
    remainingEffortPoints: number
    completedEffortPoints: number
    totalEffortPoints: number
  }>
  idealBurndown: Array<{
    date: string
    remainingEffortPoints: number
    completedEffortPoints: number
    totalEffortPoints: number
  }>
}
