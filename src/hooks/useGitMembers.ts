import { addGitMemberLocal, getGitMembers, patchGitMemberLocal } from '@/api/gitmembers'
import { useToastContext } from '@/components/ui/ToastContext'
import { GitMemberFull } from '@/types/project'
import { useCallback, useState } from 'react'

export function useGitMembers() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [gitMembers, setGitMembers] = useState<GitMemberFull[]>([])
  const { showToast } = useToastContext()

  const fetchGitMembers = useCallback(async (projectId: string, projectPartId: string) => {
    setLoading(true)
    setError(null)
    try {
      const response = await getGitMembers(projectId, projectPartId)
      if (response.data && Array.isArray(response.data.data)) {
        setGitMembers(response.data.data)
        return response.data.data
      } else {
        throw new Error(response.message || 'Failed to fetch git members')
      }
    } catch (err: any) {
      setGitMembers([])
      return []
    } finally {
      setLoading(false)
    }
  }, [])

  const addGitMember = useCallback(async (
    projectId: string,
    projectPartId: string,
    projectMemberId: string,
    payload: { nameLocal: string; emailLocal: string }
  ) => {
    setLoading(true)
    setError(null)
    try {
      const response = await addGitMemberLocal(projectId, projectPartId, projectMemberId, payload)
      showToast({ title: 'Success', description: 'Git member local added successfully' })
      await fetchGitMembers(projectId, projectPartId)
      return response.data || response
    } catch (err: any) {
      setError('Failed to add git member local')
      showToast({ title: 'Error', description: 'Failed to add git member local', variant: 'destructive' })
      throw err
    } finally {
      setLoading(false)
    }
  }, [fetchGitMembers, showToast])

  const updateGitMember = useCallback(async (
    projectId: string,
    projectPartId: string,
    gitMemberId: string,
    payload: { nameLocal: string; emailLocal: string }
  ) => {
    setLoading(true)
    setError(null)
    try {
      const response = await patchGitMemberLocal(projectId, projectPartId, gitMemberId, payload)
      showToast({ title: 'Success', description: 'Git member local updated successfully' })
      await fetchGitMembers(projectId, projectPartId)
      return response.data || response
    } catch (err: any) {
      setError('Failed to update git member local')
      showToast({ title: 'Error', description: 'Failed to update git member local', variant: 'destructive' })
      throw err
    } finally {
      setLoading(false)
    }
  }, [fetchGitMembers, showToast])

  return {
    loading,
    error,
    gitMembers,
  fetchGitMembers,
  addGitMember,
  updateGitMember,
  gitMembers: gitMembers as GitMemberFull[]
  }
} 