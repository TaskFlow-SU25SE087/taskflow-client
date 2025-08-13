import { adminApi } from '@/api/admin'
import { useToastContext } from '@/components/ui/ToastContext'
import { AdminUser, AdminUsersResponse } from '@/types/admin'
import { useEffect, useState } from 'react'

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
  const { showToast } = useToastContext()

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
        showToast({
          title: 'Error',
          description: response.message || 'Failed to fetch users',
          variant: 'destructive'
        })
      }
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || err.message || 'Failed to fetch users'
      setError(errorMessage)
      showToast({
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
      showToast({
        title: 'Success',
        description: 'File uploaded successfully. Users will be imported.',
        variant: 'success'
      })
      await fetchUsers(1)
      return result
    } catch (err: any) {
      let errorMessage = 'Failed to upload file'
      
      // Xử lý các loại lỗi khác nhau
      if (err.isTimeout) {
        errorMessage = 'Upload timeout. File might still be processing on server. Please check the user list in a few minutes.'
        showToast({
          title: 'Upload Timeout',
          description: errorMessage,
          variant: 'warning'
        })
        
        // Vẫn refresh danh sách users để kiểm tra xem có thành công không
        try {
          await fetchUsers(1)
        } catch (refreshError) {
          console.error('Failed to refresh users after timeout:', refreshError)
        }
        
        // Không throw error để user có thể đóng dialog
        return false
      } else if (err.response?.data?.message) {
        errorMessage = err.response.data.message
      } else if (err.message) {
        errorMessage = err.message
      }
      
      showToast({
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
    const maxLoop = 100 // Prevent infinite loop
    try {
      do {
        const response: AdminUsersResponse = await adminApi.getUsers({ page })
        if (response.code === 0 || response.code === 200) {
          if (!response.data.items.length) break // Stop if no more users
          allUsers = allUsers.concat(response.data.items)
          totalPages = response.data.totalPages
          page++
          if (page > maxLoop) break // Prevent infinite loop
        } else {
          setError(response.message || 'Failed to fetch users')
          showToast({
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
      showToast({
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
