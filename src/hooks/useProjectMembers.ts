import { projectMemberApi } from '@/api/projectMembers'
import { useToastContext } from '@/components/ui/ToastContext'
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
      showToast({ title: 'Success', description: (res as any)?.message || 'Member added successfully' })
    } catch (err) {
      const error = err as any
      showToast({ title: 'Error', description: error?.response?.data?.message || error?.message || 'Failed to add member', variant: 'destructive' })
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
      showToast({ title: 'Success', description: (res as any)?.message || 'Left project successfully' })
    } catch (err) {
      const error = err as any
      showToast({ title: 'Error', description: error?.response?.data?.message || error?.message || 'Failed to leave project', variant: 'destructive' })
      throw err
    } finally {
      setLoading(false)
    }
  }

  const removeMember = async (projectId: string, memberId: string) => {
    setLoading(true)
    setError(null)
    try {
      const res = await projectMemberApi.removeMember(projectId, memberId)
      showToast({ title: 'Success', description: (res as any)?.message || 'Member removed successfully', variant: 'success' })
    } catch (err) {
      const error = err as any
      showToast({ title: 'Error', description: error?.response?.data?.message || error?.message || 'Failed to remove member', variant: 'destructive' })
      throw err
    } finally {
      setLoading(false)
    }
  }

  const verifyJoin = async (projectId: string) => {
    setLoading(true)
    setError(null)
    try {
      const res = await projectMemberApi.joinProject(projectId)
      showToast({ title: 'Success', description: (res as any)?.message || 'Joined project successfully' })
    } catch (err) {
      const error = err as any
      showToast({ title: 'Error', description: error?.response?.data?.message || error?.message || 'Failed to join project', variant: 'destructive' })
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
