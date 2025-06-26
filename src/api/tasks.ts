import axiosClient from '@/configs/axiosClient'
import { TaskP } from '@/types/task'

export const taskApi = {
  // Get all tasks for a project
  getTasksFromProject: async (projectId: string): Promise<TaskP[]> => {
    const response = await axiosClient.get(`/projects/${projectId}/tasks`)
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
    const response = await axiosClient.post(`/projects/${projectId}/tasks`, formData, {
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
    }
  ) => {
    const response = await axiosClient.put(`/projects/${projectId}/tasks/update/${taskId}`, data)
    return response.data.data
  },

  // Delete a task
  deleteTask: async (projectId: string, taskId: string): Promise<void> => {
    await axiosClient.delete(`/projects/${projectId}/tasks/${taskId}`)
  },

  // Get all tasks of a sprint
  getSprintTasks: async (projectId: string, sprintId: string): Promise<TaskP[]> => {
    const response = await axiosClient.get(`/projects/${projectId}/sprint/${sprintId}/tasks`)
    return response.data.data
  },

  // Add a tag to a task
  addTagToTask: async (projectId: string, taskId: string, tagId: string): Promise<boolean> => {
    const response = await axiosClient.post(`/projects/${projectId}/tasks/${taskId}/tags/${tagId}`)
    return response.data.data === true
  },

  // Mark a task as complete with optional files
  completeTask: async (projectId: string, taskId: string, files?: File[]): Promise<boolean> => {
    const formData = new FormData()
    if (files && files.length > 0) {
      files.forEach((file) => {
        formData.append('Files', file)
      })
    }
    const response = await axiosClient.post(
      `/projects/${projectId}/tasks/${taskId}/complete`,
      formData,
      { headers: { 'Content-Type': 'multipart/form-data' } }
    )
    return response.data.data === true
  },

  // Accept a task assignment
  acceptTaskAssignment: async (projectId: string, taskId: string): Promise<boolean> => {
    const response = await axiosClient.post(`/projects/${projectId}/tasks/${taskId}/assignments/accept`)
    return response.data.data === true
  },

  // Assign a task to a user
  assignTask: async (projectId: string, taskId: string, assignerId: string): Promise<boolean> => {
    const formData = new FormData()
    formData.append('AssignerId', assignerId)
    const response = await axiosClient.post(
      `/projects/${projectId}/tasks/${taskId}/assignments/assign`,
      formData,
      { headers: { 'Content-Type': 'multipart/form-data' } }
    )
    return response.data.data === true
  },

  // Remove an assignment from a task
  removeTaskAssignment: async (
    projectId: string,
    taskId: string,
    body: { assigneeId: string; reason: string }
  ): Promise<boolean> => {
    const response = await axiosClient.delete(
      `/projects/${projectId}/tasks/${taskId}/assignments/remove`,
      { data: body }
    )
    return response.data.data === true
  },

  // Leave an assignment from a task
  leaveTaskAssignment: async (projectId: string, taskId: string, body: { reason: string }): Promise<boolean> => {
    const response = await axiosClient.delete(
      `/projects/${projectId}/tasks/${taskId}/assignments/leave`,
      { data: body }
    )
    return response.data.data === true
  },

  // Add a comment to a task
  addTaskComment: async (projectId: string, taskId: string, content: string, files?: File[]): Promise<boolean> => {
    const formData = new FormData()
    formData.append('Content', content)
    if (files && files.length > 0) {
      files.forEach((file) => {
        formData.append('Files', file)
      })
    }
    const response = await axiosClient.post(
      `/projects/${projectId}/tasks/${taskId}/comments/comment/add`,
      formData,
      { headers: { 'Content-Type': 'multipart/form-data' } }
    )
    return response.data.data === true
  }
}
