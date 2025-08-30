import axiosClient from '@/configs/axiosClient'
import { ProjectReport, ProjectReportResponse } from '@/types/report'

export const reportsApi = {
  // Fetch project report; adjust path if backend differs
  getProjectReport: async (projectId: string): Promise<ProjectReport> => {
    // Try a conventional path
    const response = await axiosClient.get<ProjectReportResponse>(`/projects/${projectId}/reports`)
    return response.data.data
  }
}
