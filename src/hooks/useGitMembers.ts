import { addGitMemberLocal, getGitMembersLocal, updateGitMemberLocal } from '@/api/projectParts'
import { useToastContext } from '@/components/ui/ToastContext'
import { GitMemberLocal } from '@/types/project'
import { useCallback, useState } from 'react'

export function useGitMembers() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [gitMembers, setGitMembers] = useState<GitMemberLocal[]>([])
  const { showToast } = useToastContext()

  const fetchGitMembers = useCallback(async (projectId: string, projectPartId: string) => {
    setLoading(true)
    setError(null)
    try {
      // Thử gọi GET endpoint nếu có
      const response = await getGitMembersLocal(projectId, projectPartId)
      if (response.code === 0) {
        setGitMembers(response.data || [])
        return response.data || []
      } else {
        throw new Error(response.message || 'Failed to fetch git members')
      }
    } catch (err: any) {
      // Nếu GET endpoint không tồn tại, hiển thị thông báo
      console.warn('GET endpoint may not exist, starting with empty list:', err.message)
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
      console.log('Calling addGitMemberLocal API with:', { projectId, projectPartId, projectMemberId, payload })
      const response = await addGitMemberLocal(projectId, projectPartId, projectMemberId, payload)
      console.log('API Response:', response)
      
      // Kiểm tra response format linh hoạt
      const isSuccess = response && (
        response.code === 0 || 
        response.code === 200 || 
        response.status === 200 ||
        response.statusCode === 200 ||
        (typeof response === 'string' && response.includes('success')) ||
        (response.data && (response.data.code === 0 || response.data.code === 200))
      )
      
      if (isSuccess) {
        showToast({ title: 'Success', description: 'Git member local added successfully' })
        // Refresh the list after adding
        await fetchGitMembers(projectId, projectPartId)
        return response.data || response
      } else {
        throw new Error(response?.message || response?.data?.message || 'Failed to add git member local')
      }
    } catch (err: any) {
      console.error('Error in addGitMember:', err)
      const errorMessage = err instanceof Error ? err.message : 'Failed to add git member local'
      setError(errorMessage)
      showToast({ title: 'Error', description: errorMessage, variant: 'destructive' })
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
      console.log('Calling updateGitMemberLocal API with:', { projectId, projectPartId, gitMemberId, payload })
      const response = await updateGitMemberLocal(projectId, projectPartId, gitMemberId, payload)
      console.log('API Response:', response)
      
      // Kiểm tra response format linh hoạt
      const isSuccess = response && (
        response.code === 0 || 
        response.code === 200 || 
        response.status === 200 ||
        response.statusCode === 200 ||
        (typeof response === 'string' && response.includes('success')) ||
        (response.data && (response.data.code === 0 || response.data.code === 200))
      )
      
      if (isSuccess) {
        showToast({ title: 'Success', description: 'Git member local updated successfully' })
        // Refresh the list after updating
        await fetchGitMembers(projectId, projectPartId)
        return response.data || response
      } else {
        throw new Error(response?.message || response?.data?.message || 'Failed to update git member local')
      }
    } catch (err: any) {
      console.error('Error in updateGitMember:', err)
      const errorMessage = err instanceof Error ? err.message : 'Failed to update git member local'
      setError(errorMessage)
      showToast({ title: 'Error', description: errorMessage, variant: 'destructive' })
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
    updateGitMember
  }
} 