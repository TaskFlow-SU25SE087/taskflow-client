import { taskApi } from '@/api/tasks'
import { TaskP } from '@/types/task'
import { useState } from 'react'

interface CreateTaskInput {
  projectId: string
  title: string
  description?: string
  priority: string
  deadline: string
  file?: File | null
}

export function useCreateTask() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [data, setData] = useState<TaskP | null>(null)

  const createTask = async (input: CreateTaskInput) => {
    setLoading(true)
    setError(null)
    setData(null)
    try {
      const formData = new FormData()
      formData.append('Title', input.title)
      if (input.description) formData.append('Description', input.description)
      formData.append('Priority', input.priority)
      formData.append('Deadline', input.deadline)
      if (input.file) formData.append('File', input.file)
      const result = await taskApi.createTask(input.projectId, formData)
      if (typeof result === 'object' && result !== null && 'title' in result && 'description' in result && 'priority' in result) {
        setData(result as unknown as TaskP)
      } else {
        setData(null)
        setError('Failed to create task: unexpected response format')
      }
      return result
    } catch (err: unknown) {
      if (err && typeof err === 'object' && 'response' in err) {
        // @ts-expect-error: err.response is from axios error, type not inferred
        setError(err.response?.data?.message || 'Unknown error')
      } else if (err instanceof Error) {
        setError(err.message)
      } else {
        setError('Unknown error')
      }
      throw err
    } finally {
      setLoading(false)
    }
  }

  return { createTask, loading, error, data }
}
