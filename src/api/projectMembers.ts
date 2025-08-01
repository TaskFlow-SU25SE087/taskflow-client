import axiosClient from '@/configs/axiosClient'
import { ProjectMember } from '@/types/project'

const ENDPOINT = '/api/projectmember'

export const projectMemberApi = {
  addMember: async (projectId: string, email: string) => {
    const response = await axiosClient.post(`/project/${projectId}/members/add`, { email }, {
      headers: { 'Content-Type': 'application/json-patch+json' }
    })
    // Trả về { email, token } từ response.data.data
    return response.data.data
  },

  leaveProject: (projectId: string) => axiosClient.post(`/project/${projectId}/members/leave`),

  removeMember: (projectId: string, userId: string) =>
    axiosClient.delete(`/project/${projectId}/members/remove/${userId}`),

  verifyJoin: (projectId: string, token: string) =>
    axiosClient.get(`/project/${projectId}/members/verify-join`, { params: { token } }),

  getMembersByProjectId: async (projectId: string): Promise<ProjectMember[]> => {
    const response = await axiosClient.get(`/project/${projectId}/members/list`)
    return response.data.data
  },

  deleteMemberFromProject: async (userId: string, projectId: string) =>
    axiosClient.delete(`${ENDPOINT}/uid=${userId}/from/projectId=${projectId}/DeleteMemberFromProject`),

  /**
   * Add a system user to the project (for automation/system actions)
   * @param projectId Project UUID
   * @returns { code: number, message: string, data: boolean }
   */
  addSystemUserToProject: async (projectId: string): Promise<{ code: number; message: string; data: boolean }> => {
    const response = await axiosClient.post(`/project/${projectId}/members/add-system-user`)
    return response.data
  },

  joinProject: async (projectId: string) => {
    const response = await axiosClient.post(`/project/${projectId}/members/join`)
    return response.data
  }
}
