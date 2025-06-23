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

  const fetchUsers = async (page: number = 1, pageSize: number = 10) => {
    setLoading(true)
    setError(null)
    try {
      const response: AdminUsersResponse = await adminApi.getUsers({ page, pageSize })
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

  const importUsers = async (file: File) => {
    try {
      const result = await adminApi.importUsers(file)
      toast({
        title: 'Success',
        description: 'File uploaded successfully. Users will be imported.',
        variant: 'default'
      })
      await fetchUsers(1)
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

  // Fetch all users across all pages
  const fetchAllUsers = async (): Promise<AdminUser[]> => {
    setLoading(true)
    setError(null)
    let allUsers: AdminUser[] = []
    let page = 1
    let totalPages = 1
    let maxLoop = 100; // Prevent infinite loop
    try {
      do {
        const response: AdminUsersResponse = await adminApi.getUsers({ page })
        if (response.code === 0 || response.code === 200) {
          if (!response.data.items.length) break; // Stop if no more users
          allUsers = allUsers.concat(response.data.items)
          totalPages = response.data.totalPages
          page++
          if (page > maxLoop) break; // Prevent infinite loop
        } else {
          setError(response.message || 'Failed to fetch users')
          toast({
            title: 'Error',
            description: response.message || 'Failed to fetch users',
            variant: 'destructive'
          })
          break
        }
      } while (page <= totalPages)
      return allUsers
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || err.message || 'Failed to fetch users'
      setError(errorMessage)
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive'
      })
      return []
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchUsers(1, 10)
  }, [])

  return {
    users,
    loading,
    error,
    pagination,
    fetchUsers,
    importUsers,
    refetch: () => fetchUsers(pagination.pageNumber, pagination.pageSize || 10),
    fetchAllUsers
  }
} 