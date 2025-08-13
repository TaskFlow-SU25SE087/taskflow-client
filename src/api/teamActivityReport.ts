import axiosClient from '@/configs/axiosClient'
import { ProjectReportResponse, ProjectReport } from '@/types/report'

export interface TeamActivityReportQuery {
  startDate?: string
  endDate?: string
  memberIds?: string[]
  includeTaskDetails?: boolean
  includeCommentDetails?: boolean
  includeTopContributors?: boolean
  topContributorsCount?: number
}

export const teamActivityReportApi = {
  get: async (projectId: string, query: TeamActivityReportQuery = {}): Promise<ProjectReport> => {
    const params: Record<string, any> = {}
    if (query.startDate) params.StartDate = query.startDate
    if (query.endDate) params.EndDate = query.endDate
    if (query.memberIds?.length) params.MemberIds = query.memberIds
    if (query.includeTaskDetails !== undefined) params.IncludeTaskDetails = query.includeTaskDetails
    if (query.includeCommentDetails !== undefined) params.IncludeCommentDetails = query.includeCommentDetails
    if (query.includeTopContributors !== undefined) params.IncludeTopContributors = query.includeTopContributors
    if (query.topContributorsCount !== undefined) params.TopContributorsCount = query.topContributorsCount

    const res = await axiosClient.get<ProjectReportResponse>(`/api/TeamActivityReport/project/${projectId}`, { params })
    return res.data.data
  }
}
