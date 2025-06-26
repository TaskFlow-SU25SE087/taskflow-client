import { useState } from 'react'
import { taskApi } from '@/api/tasks'
import { TaskP } from '@/types/task'

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
      const result = await taskApi.createTask(input.projectId, {
        title: input.title,
        description: input.description,
        priority: input.priority,
        deadline: input.deadline,
        file: input.file
      })
      setData(result)
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
