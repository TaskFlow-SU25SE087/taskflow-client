import axiosClient from '@/configs/axiosClient'
import { ProjectMember } from '@/types/project'

const ENDPOINT = '/api/projectmember'

export const projectMemberApi = {
  addMember: (projectId: string, email: string, role: string) =>
    axiosClient.post(`/api/projectmember/projectId=${projectId}/add`, {
      email,
      role
    }),

  getMembersByProjectId: async (projectId: string): Promise<ProjectMember[]> => {
    const response = await axiosClient.get<ProjectMember[]>(`${ENDPOINT}/projectId=${projectId}/all`)
    return response.data
  },

  deleteMemberFromProject: async (userId: string, projectId: string) =>
    axiosClient.delete(`${ENDPOINT}/uid=${userId}/from/projectId=${projectId}/DeleteMemberFromProject`)
}
