import { projectMemberApi } from '@/api/projectMembers'
import { AxiosError } from 'axios'
import { useState } from 'react'

export function useProjectMembers() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const addMember = async (projectId: string, email: string) => {
    setLoading(true)
    setError(null)
    try {
      await projectMemberApi.addMember(projectId, email)
    } catch (err) {
      if (err instanceof AxiosError && err.response?.data?.message) {
        setError(err.response.data.message)
      } else {
        setError('Failed to add member')
      }
      throw err
    } finally {
      setLoading(false)
    }
  }

  const leaveProject = async (projectId: string) => {
    setLoading(true)
    setError(null)
    try {
      await projectMemberApi.leaveProject(projectId)
    } catch (err) {
      setError('Failed to leave project')
      throw err
    } finally {
      setLoading(false)
    }
  }

  const removeMember = async (projectId: string, userId: string) => {
    setLoading(true)
    setError(null)
    try {
      await projectMemberApi.removeMember(projectId, userId)
    } catch (err) {
      setError('Failed to remove member')
      throw err
    } finally {
      setLoading(false)
    }
  }

  const verifyJoin = async (projectId: string, token: string) => {
    setLoading(true)
    setError(null)
    try {
      await projectMemberApi.verifyJoin(projectId, token)
    } catch (err) {
      setError('Failed to verify join')
      throw err
    } finally {
      setLoading(false)
    }
  }

  return {
    addMember,
    leaveProject,
    removeMember,
    verifyJoin,
    loading,
    error
  }
} 