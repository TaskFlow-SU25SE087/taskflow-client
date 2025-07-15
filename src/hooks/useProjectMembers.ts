import { projectMemberApi } from '@/api/projectMembers'
import { useToastContext } from '@/components/ui/ToastContext'
import { AxiosError } from 'axios'
import { useState } from 'react'

export function useProjectMembers() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { showToast } = useToastContext()

  const addMember = async (projectId: string, email: string) => {
    setLoading(true)
    setError(null)
    try {
      const res = await projectMemberApi.addMember(projectId, email)
      showToast({ title: 'Success', description: res?.message || 'Member added successfully' })
    } catch (err) {
      if (err instanceof AxiosError && err.response?.data?.message) {
        setError(err.response.data.message)
        showToast({ title: 'Error', description: err.response.data.message, variant: 'destructive' })
      } else {
        setError('Failed to add member')
        showToast({ title: 'Error', description: err.response?.data?.message || err.message || 'Failed to add member', variant: 'destructive' })
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
      const res = await projectMemberApi.leaveProject(projectId)
      showToast({ title: 'Success', description: res?.message || 'Left project successfully' })
    } catch (err) {
      setError('Failed to leave project')
      showToast({ title: 'Error', description: err.response?.data?.message || err.message || 'Failed to leave project', variant: 'destructive' })
      throw err
    } finally {
      setLoading(false)
    }
  }

  const removeMember = async (projectId: string, userId: string) => {
    setLoading(true)
    setError(null)
    try {
      const res = await projectMemberApi.removeMember(projectId, userId)
      showToast({ title: 'Success', description: res?.message || 'Member removed successfully' })
    } catch (err) {
      setError('Failed to remove member')
      showToast({ title: 'Error', description: err.response?.data?.message || err.message || 'Failed to remove member', variant: 'destructive' })
      throw err
    } finally {
      setLoading(false)
    }
  }

  const verifyJoin = async (projectId: string, token: string) => {
    setLoading(true)
    setError(null)
    try {
      const res = await projectMemberApi.verifyJoin(projectId, token)
      showToast({ title: 'Success', description: res?.message || 'Joined project successfully' })
    } catch (err) {
      setError('Failed to verify join')
      showToast({ title: 'Error', description: err.response?.data?.message || err.message || 'Failed to join project', variant: 'destructive' })
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
