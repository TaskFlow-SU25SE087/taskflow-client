import axiosClient from '@/configs/axiosClient'
import { Project, Tag } from '@/types/project'

const ENDPOINT = '/project'

interface AdminProjectListItem {
  id: string
  title: string
  description: string
  lastUpdate: string
  role: string | null
  semester: string
  termId: string
  termName: string
  createdAt: string
  isActive: boolean
}

interface AdminProjectListResponse {
  code: number
  message: string
  data: AdminProjectListItem[]
}

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

interface ProjectListItem {
  id: string
  title: string
  description: string
  lastUpdate: string
  role: string
}

interface ProjectListResponse {
  code: number
  message: string
  data: ProjectListItem[]
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
  getProjects: async (): Promise<ProjectListResponse> => {
    const response = await axiosClient.get<ProjectListResponse>(`${ENDPOINT}`)
    return response.data
  },

  getProjectList: async (page: number = 1): Promise<ProjectListResponse> => {
    const response = await axiosClient.get<ProjectListResponse>(`${ENDPOINT}/list?page=${page}`)
    return response.data
  },

  getProjectById: async (projectId: string): Promise<ProjectDetailResponse> => {
    console.log('[projectApi] getProjectById called with projectId:', projectId)
    console.log('[projectApi] Full URL:', `${axiosClient.defaults.baseURL}${ENDPOINT}/${projectId}`)
    const response = await axiosClient.get<ProjectDetailResponse>(`${ENDPOINT}/${projectId}`)
    console.log('[projectApi] Response received:', response)
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

  updateProject: async (projectId: string, title: string, description: string): Promise<ProjectUpdateResponse> => {
    const formData = new FormData()
    formData.append('ProjectId', projectId)
    formData.append('Title', title)
    formData.append('Description', description)
    const response = await axiosClient.put<ProjectUpdateResponse>(`${ENDPOINT}/${projectId}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
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
    const response = await axiosClient.delete<{ code: number; message: string; data: boolean }>(`${ENDPOINT}/${projectId}`)
    return response.data.data
  },

  addMemberToProject: async (projectId: string, email: string): Promise<boolean> => {
    const response = await axiosClient.post(`/project/${projectId}/members/add`, { email }, {
      headers: { 'Content-Type': 'application/json-patch+json' }
    })
    return response.data.data
  },

  leaveProject: async (projectId: string): Promise<boolean> => {
    const response = await axiosClient.post(`/project/${projectId}/members/leave`)
    return response.data.data
  },

  removeProjectMember: async (projectId: string, userId: string): Promise<{ code: number, message: string, data: boolean }> => {
    const response = await axiosClient.delete(`/project/${projectId}/members/remove/${userId}`)
    return response.data
  },

  verifyJoinProject: async (projectId: string, token: string): Promise<boolean> => {
    const response = await axiosClient.get(`/project/${projectId}/members/verify-join`, { params: { token } })
    return response.data.data
  },

  // Legacy: verify join by token only, return projectId
  verifyJoinProjectLegacy: async (token: string): Promise<{ projectId: string } | null> => {
    // Giả sử backend có endpoint /project/members/verify-join?token=...
    const response = await axiosClient.get(`/project/members/verify-join`, { params: { token } })
    // Backend nên trả về { code, message, data: { projectId } }
    if (response.data && response.data.data && response.data.data.projectId) {
      return { projectId: response.data.data.projectId }
    }
    return null
  },

  getProjectMembers: async (projectId: string): Promise<any[]> => {
    const response = await axiosClient.get(`/project/${projectId}/members/list`)
    return response.data.data
  }
}

export const tagApi = {
  getAllTagsByProjectId: async (projectId: string): Promise<Tag[]> => {
    const response = await axiosClient.get(`/projects/${projectId}/tags`)
    return response.data.data
  },

  createTag: async (projectId: string, tag: { name: string; description: string; color: string }): Promise<Tag> => {
    const response = await axiosClient.post(`/projects/${projectId}/tags`, tag)
    return response.data.data
  },

  updateTag: async (
    projectId: string,
    tagId: string,
    tag: { name: string; description: string; color: string }
  ): Promise<Tag> => {
    const response = await axiosClient.put(`/projects/${projectId}/tags/${tagId}`, tag)
    return response.data.data
  },

  deleteTag: async (projectId: string, tagId: string): Promise<boolean> => {
    const response = await axiosClient.delete(`/projects/${projectId}/tags/${tagId}`)
    return response.data.data
  }
}
