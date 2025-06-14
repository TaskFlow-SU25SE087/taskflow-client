import axiosClient from '@/configs/axiosClient'
import { Project } from '@/types/project'

const ENDPOINT = '/api/project'

interface ProjectCreateResponse {
  message: string
  projectId: string
}

export const projectApi = {
  getProjects: async (userId: string) => {
    const response = await axiosClient.get<Project[]>(`${ENDPOINT}/uid=${userId}/all`)
    return response.data
  },

  getProjectById: async (projectId: string) => {
    const response = await axiosClient.get<Project>(`${ENDPOINT}/projectId=${projectId}`)
    return response.data
  },

  getProjectByTitle: async (title: string): Promise<Project> => {
    const response = await axiosClient.get<Project>(`${ENDPOINT}/title=${title}`)
    return response.data
  },

  createProject: async (title: string): Promise<ProjectCreateResponse> => {
    const response = await axiosClient.post<ProjectCreateResponse>(`${ENDPOINT}/uid=new`, {
      title
    })
    return response.data
  },

  editProject: async (projectId: string, title: string): Promise<Project> => {
    const response = await axiosClient.put<Project>(`${ENDPOINT}/edit/projectId=${projectId}`, {
      title
    })
    return response.data
  },

  deleteProject: async (projectId: string): Promise<boolean> => {
    const response = await axiosClient.delete<boolean>(`${ENDPOINT}/delete/projectId=${projectId}`)
    return response.data
  }
}
