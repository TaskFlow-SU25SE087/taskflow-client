import { useToastContext } from '@/components/ui/ToastContext'
import { useState } from 'react'
import { connectRepoToPart, createProjectPart, getProjectParts } from '../api/projectParts'

export function useProjectParts() {
  const { showToast } = useToastContext()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<any>(null)
  const [result, setResult] = useState<any>(null)

  const createPart = async (
    projectId: string,
    payload: { name: string; programmingLanguage: string; framework: string }
  ) => {
    setLoading(true)
    setError(null)
    try {
      const data = await createProjectPart(projectId, payload)
      setResult(data)
      showToast({ title: data?.code === 200 ? 'Success' : 'Error', description: data?.message || 'Project part created successfully', variant: data?.code === 200 ? 'default' : 'destructive' })
      return data
    } catch (err) {
      const error = err as any
      showToast({ title: 'Error', description: error?.response?.data?.message || error?.message || 'Failed to create project part', variant: 'destructive' })
      throw err
    } finally {
      setLoading(false)
    }
  }

  const connectRepo = async (projectId: string, partId: string, payload: { repoUrl: string; accessToken: string }) => {
    setLoading(true)
    setError(null)
    try {
      const data = await connectRepoToPart(projectId, partId, payload)
      setResult(data)
      showToast({ title: data?.code === 200 ? 'Success' : 'Error', description: data?.message || 'Repository connected successfully', variant: data?.code === 200 ? 'default' : 'destructive' })
      return data
    } catch (err) {
      const error = err as any
      showToast({ title: 'Error', description: error?.response?.data?.message || error?.message || 'Failed to connect repository', variant: 'destructive' })
      throw err
    } finally {
      setLoading(false)
    }
  }

  // Lấy danh sách parts
  const fetchParts = async (projectId: string) => {
    setLoading(true)
    setError(null)
    try {
      const data = await getProjectParts(projectId)
      setResult(data)
      return data
    } catch (err) {
      setError(err)
      throw err
    } finally {
      setLoading(false)
    }
  }

  return { createPart, connectRepo, fetchParts, loading, error, result }
}
