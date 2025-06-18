import axiosClient from '@/configs/axiosClient'
import { Project } from '@/types/project'

const ENDPOINT = '/project'

interface ProjectCreateResponse {
  code: number
  message: string
  data: {
    id: string
    title: string
    description: string
  }
}

interface ProjectUpdateResponse {
  code: number
  message: string
  data: {
    id: string
    title: string
    description: string
  }
}

interface ProjectListResponse {
  code: number
  message: string
  data: {
    items: Array<{
      id: string
      title: string
      description: string
      ownerId: string
      lastUpdate: string
      role: string
    }>
    totalItems: number
    totalPages: number
    pageNumber: number
    pageSize: number
  }
}

interface ProjectDetailResponse {
  code: number
  message: string
  data: {
    id: string
    title: string
    description: string
    ownerId: string
    createdAt: string
    lastUpdate: string
    boards: Array<{
      id: string
      projectId: string
      name: string
      description: string
      order: number
      isActive: boolean
      tasks: Array<{
        id: string
        title: string
        description: string
        priority: string
        createdAt: string
        updatedAt: string
        isActive: boolean
        sprintName: string
        comments: Array<{
          id: string
          content: string
          createdAt: string
          userId: string
        }>
        tags: Array<{
          id: string
          name: string
          description: string
        }>
      }>
    }>
  }
}

export const projectApi = {
  getProjects: async (userId: string) => {
    const response = await axiosClient.get<Project[]>(`${ENDPOINT}/uid=${userId}/all`)
    return response.data
  },

  getProjectList: async (page: number = 1): Promise<ProjectListResponse> => {
    const response = await axiosClient.get<ProjectListResponse>(`${ENDPOINT}/list?page=${page}`)
    return response.data
  },

  getProjectById: async (projectId: string): Promise<ProjectDetailResponse> => {
    const response = await axiosClient.get<ProjectDetailResponse>(`${ENDPOINT}/${projectId}`)
    return response.data
  },

  getProjectByTitle: async (title: string): Promise<Project> => {
    const response = await axiosClient.get<Project>(`${ENDPOINT}/title=${title}`)
    return response.data
  },

  createProject: async (title: string, description: string = ''): Promise<ProjectCreateResponse> => {
    const response = await axiosClient.post<ProjectCreateResponse>(`${ENDPOINT}`, {
      title,
      description
    })
    return response.data
  },

  updateProject: async (projectId: string, title: string, description?: string): Promise<ProjectUpdateResponse> => {
    const requestData = {
      projectId,
      title
    }
    
    console.log('Sending update request (title only):', requestData)
    
    const response = await axiosClient.put<ProjectUpdateResponse>(`${ENDPOINT}/update`, requestData)
    
    console.log('Update response received:', response.data)
    
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
