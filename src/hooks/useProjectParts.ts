import { useState } from 'react'
import { connectRepoToPart, createProjectPart } from '../api/projectParts'

export function useProjectParts() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<any>(null)
  const [result, setResult] = useState<any>(null)

  const createPart = async (
    projectId: string,
    payload: { name: string; programmingLanguage: number; framework: number }
  ) => {
    setLoading(true)
    setError(null)
    try {
      const data = await createProjectPart(projectId, payload)
      setResult(data)
      return data
    } catch (err) {
      setError(err)
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
      return data
    } catch (err) {
      setError(err)
      throw err
    } finally {
      setLoading(false)
    }
  }

  return { createPart, connectRepo, loading, error, result }
}
