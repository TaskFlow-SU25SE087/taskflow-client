import axiosClient from '@/configs/axiosClient'
import { TaskP } from '@/types/task'

export const taskApi = {
  // Get all tasks for a project
  getTasksFromProject: async (projectId: string): Promise<TaskP[]> => {
    const response = await axiosClient.get(`/projects/${projectId}/task`)
    return response.data.data
  },

  // Get a single task by ID (if needed, adjust endpoint as per backend)
  getTaskById: async (projectId: string, taskId: string): Promise<TaskP> => {
    const response = await axiosClient.get(`/projects/${projectId}/task/${taskId}`)
    return response.data.data
  },

  // Create a new task for a project
  createTask: async (
    projectId: string,
    data: {
      title: string
      description?: string
      priority: string
      deadline: string
      file?: File | null
    }
  ) => {
    const formData = new FormData()
    formData.append('Title', data.title)
    if (data.description) formData.append('Description', data.description)
    formData.append('Priority', data.priority)
    formData.append('Deadline', data.deadline)
    if (data.file) formData.append('File', data.file)
    const response = await axiosClient.post(`/projects/${projectId}/task`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
    return response.data.data
  },

  // Update a task
  updateTask: async (
    projectId: string,
    taskId: string,
    data: {
      title?: string
      description?: string
      priority?: string
      deadline?: string
      status?: string
      file?: File | null
    }
  ) => {
    const formData = new FormData()
    if (data.title) formData.append('Title', data.title)
    if (data.description) formData.append('Description', data.description)
    if (data.priority) formData.append('Priority', data.priority)
    if (data.deadline) formData.append('Deadline', data.deadline)
    if (data.status) formData.append('Status', data.status)
    if (data.file) formData.append('File', data.file)
    const response = await axiosClient.put(`/projects/${projectId}/task/update/${taskId}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
    return response.data.data
  },

  // Delete a task
  deleteTask: async (projectId: string, taskId: string): Promise<void> => {
    await axiosClient.delete(`/projects/${projectId}/task/delete/${taskId}`)
  },

  // Get all tasks of a sprint
  getSprintTasks: async (projectId: string, sprintId: string): Promise<TaskP[]> => {
    const response = await axiosClient.get(`/projects/${projectId}/sprint/${sprintId}/tasks`)
    return response.data.data
  }
}
