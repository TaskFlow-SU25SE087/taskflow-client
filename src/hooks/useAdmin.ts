import { adminApi } from '@/api/admin'
import { AdminUser, AdminUsersResponse } from '@/types/admin'
import { useEffect, useState } from 'react'
import { useToast } from './useToast'

export const useAdmin = () => {
  const [users, setUsers] = useState<AdminUser[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [pagination, setPagination] = useState({
    totalItems: 0,
    totalPages: 0,
    pageNumber: 1,
    pageSize: 0
  })
  const { toast } = useToast()

  const fetchUsers = async (page: number = 1) => {
    setLoading(true)
    setError(null)
    try {
      const response: AdminUsersResponse = await adminApi.getUsers({ page })
      if (response.code === 0 || response.code === 200) {
        setUsers(response.data.items)
        setPagination({
          totalItems: response.data.totalItems,
          totalPages: response.data.totalPages,
          pageNumber: response.data.pageNumber,
          pageSize: response.data.pageSize
        })
      } else {
        setError(response.message || 'Failed to fetch users')
        toast({
          title: 'Error',
          description: response.message || 'Failed to fetch users',
          variant: 'destructive'
        })
      }
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || err.message || 'Failed to fetch users'
      setError(errorMessage)
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  const addFileAccount = async (file: File) => {
    try {
      const result = await adminApi.addFileAccount(file)
      toast({
        title: 'Success',
        description: 'File uploaded successfully. Users will be imported.',
        variant: 'default'
      })
      await fetchUsers(pagination.pageNumber)
      return result
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || err.message || 'Failed to upload file'
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive'
      })
      throw err
    }
  }

  useEffect(() => {
    fetchUsers()
  }, [])

  return {
    users,
    loading,
    error,
    pagination,
    fetchUsers,
    addFileAccount,
    refetch: () => fetchUsers(pagination.pageNumber)
  }
} 