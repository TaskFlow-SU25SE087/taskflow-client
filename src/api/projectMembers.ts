import axiosClient from '@/configs/axiosClient'
import { ProjectMember } from '@/types/project'

const ENDPOINT = '/api/projectmember'

export const projectMemberApi = {
  addMember: async (projectId: string, email: string) => {
    const response = await axiosClient.post(`/projects/${projectId}/members/add`, { email })
    // Trả về { email, token } từ response.data.data
    return response.data.data
  },

  leaveProject: (projectId: string) => axiosClient.post(`/projects/${projectId}/members/leave`),

  removeMember: (projectId: string, userId: string) =>
    axiosClient.delete(`/projects/${projectId}/members/remove/${userId}`),

  verifyJoin: (projectId: string, token: string) =>
    axiosClient.get(`/projects/${projectId}/members/verify-join`, { params: { token } }),

  getMembersByProjectId: async (projectId: string): Promise<ProjectMember[]> => {
    // Try /members first, fallback to /members/list if needed
    const response = await axiosClient.get(`/projects/${projectId}/members`)
    return response.data.data
  },

  deleteMemberFromProject: async (userId: string, projectId: string) =>
    axiosClient.delete(`${ENDPOINT}/uid=${userId}/from/projectId=${projectId}/DeleteMemberFromProject`)
}
