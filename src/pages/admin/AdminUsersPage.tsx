import { adminApi } from '@/api/admin'
import AdminLayout from '@/components/admin/AdminLayout'
import AdminPagination from '@/components/admin/AdminPagination'
import FileUpload from '@/components/admin/FileUpload'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { useToastContext } from '@/components/ui/ToastContext'
import { useAdmin } from '@/hooks/useAdmin'
import { useAdminTerm } from '@/hooks/useAdminTerm'
import { debounce } from 'lodash'
import {
  Calendar,
  CheckCircle2,
  Clock,
  Download,
  Filter,
  Loader2,
  RefreshCw,
  Search,
  Shield,
  ShieldOff,
  Sparkles,
  Upload,
  UserCheck,
  Users,
  UserX
} from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import * as XLSX from 'xlsx'

export default function AdminUsersPage() {
  const { users, loading, error, pagination, fetchUsers, importUsers, fetchAllUsers } = useAdmin()
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedRole, setSelectedRole] = useState<string>('all')
  const [selectedStatus, setSelectedStatus] = useState<string>('all')
  const [selectedSemester, setSelectedSemester] = useState<string>('all')
  const [showFileUpload, setShowFileUpload] = useState(false)
  const [exporting, setExporting] = useState(false)
  const [uploadTimeout, setUploadTimeout] = useState(false)
  const [cachedUsers, setCachedUsers] = useState<any[]>([])
  const [lastFetchTime, setLastFetchTime] = useState<number>(0)
  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set())
  const [selectAll, setSelectAll] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [totalUsersCount, setTotalUsersCount] = useState<number | null>(null)
  const [isCountingTotal, setIsCountingTotal] = useState(false)
  const [totalStats, setTotalStats] = useState({
    total: 0,
    active: 0,
    inactive: 0
  })
  const pageSize = 10
  const { showToast } = useToastContext()

  // Cache timeout: 30 giây
  const CACHE_TIMEOUT = 30000

  // Lấy danh sách semester (term) từ API
  const { terms, loading: loadingTerms } = useAdminTerm(1, 0)

  // Add dialog state
  const [showBanDialog, setShowBanDialog] = useState(false)
  const [showUnbanDialog, setShowUnbanDialog] = useState(false)
  const [pendingAction, setPendingAction] = useState<{
    type: 'ban' | 'unban'
    userCount: number
    users: string[]
  } | null>(null)

  // Auto-refresh effect for upload timeout
  useEffect(() => {
    if (uploadTimeout) {
      const interval = setInterval(() => {
        window.location.reload()
      }, 3000)
      return () => clearInterval(interval)
    }
  }, [uploadTimeout])

  // Check for file upload dialog after refresh
  useEffect(() => {
    const shouldShowUpload = localStorage.getItem('showFileUploadAfterRefresh')
    if (shouldShowUpload === 'true') {
      setShowFileUpload(true)
      localStorage.removeItem('showFileUploadAfterRefresh')
    }
  }, [])

  // Auto-count total users when page loads
  useEffect(() => {
    const autoCountTotalUsers = async () => {
      try {
        const allUsers = await fetchAllUsers()
        setTotalUsersCount(allUsers.length)
        
        // Tính toán thống kê chính xác từ tất cả users
        const totalActive = allUsers.filter(user => user.isActive).length
        const totalInactive = allUsers.filter(user => !user.isActive).length
        
        // Cập nhật totalStats để hiển thị số liệu từ tất cả các trang
        setTotalStats({
          total: allUsers.length,
          active: totalActive,
          inactive: totalInactive
        })
      } catch (err) {
        console.error('Failed to auto-count total users:', err)
        // Không hiển thị toast lỗi để tránh spam
      }
    }

    // Chỉ đếm tự động nếu chưa có số liệu
    if (totalUsersCount === null) {
      autoCountTotalUsers()
    }
  }, []) // Chỉ chạy một lần khi component mount

  const handlePageChange = (page: number) => {
    fetchUsers(page, pageSize)
  }

  // Kiểm tra cache có còn hợp lệ không
  const isCacheValid = () => {
    return Date.now() - lastFetchTime < CACHE_TIMEOUT && cachedUsers.length > 0
  }

  // Fetch users với cache
  const fetchUsersWithCache = async (page: number, size: number) => {
    // Nếu cache còn hợp lệ và đang ở page 1, sử dụng cache
    if (page === 1 && isCacheValid()) {
      return cachedUsers
    }
    
    // Nếu không có cache hoặc cache hết hạn, fetch từ server
    await fetchUsers(page, size)
    
    // Cache kết quả nếu fetch thành công và đang ở page 1
    if (page === 1) {
      setCachedUsers(users)
      setLastFetchTime(Date.now())
    }
  }

  // Debounced search để tránh fetch quá nhiều
  const debouncedSearch = useCallback(
    debounce((term: string) => {
      if (term.length >= 2 || term.length === 0) {
        // Reset về page 1 khi search
        fetchUsersWithCache(1, pageSize)
      }
    }, 300),
    []
  )

  // Xử lý search với debounce
  const handleSearchChange = (value: string) => {
    setSearchTerm(value)
    debouncedSearch(value)
  }

  // Xử lý filter changes
  const handleFilterChange = (filterType: string, value: string) => {
    switch (filterType) {
      case 'role':
        setSelectedRole(value)
        break
      case 'status':
        setSelectedStatus(value)
        break
      case 'semester':
        setSelectedSemester(value)
        break
    }
    
    // Reset về page 1 khi thay đổi filter
    fetchUsersWithCache(1, pageSize)
  }

  // Clear cache khi cần thiết
  const clearCache = () => {
    setCachedUsers([])
    setLastFetchTime(0)
  }

  // Enhanced refresh function
  const handleRefresh = async () => {
    setIsRefreshing(true)
    clearCache()
    try {
      await fetchUsersWithCache(1, pageSize)
      // Also refresh total statistics
      await refreshTotalStats()
    } finally {
      setTimeout(() => setIsRefreshing(false), 500) // Small delay for smooth animation
    }
  }

  // Function to count total users across all pages
  const handleCountTotalUsers = async () => {
    setIsCountingTotal(true)
    try {
      const allUsers = await fetchAllUsers()
      setTotalUsersCount(allUsers.length)
      
      // Tính toán thống kê chính xác từ tất cả users
      const totalActive = allUsers.filter(user => user.isActive).length
      const totalInactive = allUsers.filter(user => !user.isActive).length
      
      // Cập nhật totalStats để hiển thị số liệu từ tất cả các trang
      setTotalStats({
        total: allUsers.length,
        active: totalActive,
        inactive: totalInactive
      })
      
      showToast({
        title: 'Total Users Updated',
        description: `Updated total users count: ${allUsers.length} users (${totalActive} active, ${totalInactive} inactive) across all pages.`,
        variant: 'success'
      })
    } catch (err) {
      console.error('Failed to count total users:', err)
      showToast({
        title: 'Update Failed',
        description: 'Failed to update total users count. Please try again.',
        variant: 'destructive'
      })
    } finally {
      setIsCountingTotal(false)
    }
  }

  // Function to refresh total statistics (used after ban/unban operations)
  const refreshTotalStats = async () => {
    try {
      const allUsers = await fetchAllUsers()
      setTotalUsersCount(allUsers.length)
      
      // Tính toán thống kê chính xác từ tất cả users
      const totalActive = allUsers.filter(user => user.isActive).length
      const totalInactive = allUsers.filter(user => !user.isActive).length
      
      // Cập nhật totalStats để hiển thị số liệu từ tất cả các trang
      setTotalStats({
        total: allUsers.length,
        active: totalActive,
        inactive: totalInactive
      })
    } catch (err) {
      console.error('Failed to refresh total stats:', err)
      // Không hiển thị toast để tránh spam
    }
  }

  const handleFileUpload = async (file: File, onProgress?: (progress: number) => void) => {
    console.log('🚀 Starting file upload...')
    try {
      let result: boolean | undefined
      
      // Simulate progress updates if progress callback is provided
      if (onProgress) {
        // Start with 5% progress
        onProgress(5)
        
        // Simulate realistic progress updates
        const progressSteps = [15, 25, 35, 45, 55, 65, 75, 85, 95]
        let currentStep = 0
        
        const progressInterval = setInterval(() => {
          if (currentStep < progressSteps.length) {
            onProgress(progressSteps[currentStep])
            currentStep++
          } else {
            // If we've shown all steps but upload is still going, show 95%
            onProgress(95)
          }
        }, 300) // Update every 300ms for smoother progress
        
        result = await importUsers(file)
        
        // Clear interval and smoothly go to 100%
        clearInterval(progressInterval)
        onProgress(100)
      } else {
        result = await importUsers(file)
      }
      
      console.log('🔍 Upload result:', result, 'Type:', typeof result)
      
      if (result === false) {
        // Upload thất bại hoặc timeout
        console.log('❌ Upload failed or timeout...')
        
        // Upload thất bại
        console.log('❌ Upload failed, no toast shown as requested.')
        
        // Clear cache vì dữ liệu có thể đã thay đổi
        clearCache()
        
        // Lưu trạng thái để hiện dialog sau khi refresh
        localStorage.setItem('showFileUploadAfterRefresh', 'true')
        
        // Đợi toast hiển thị xong rồi mới refresh
        console.log('⏰ Waiting 3 seconds before refresh...')
        setTimeout(() => {
          console.log('🔄 Refreshing page...')
          window.location.reload()
        }, 3000)
        
      } else if (result === true) {
        // Upload thành công (result === true)
        setUploadTimeout(false)
        console.log('🚀 Upload successful! Showing success toast...')
        showToast({
          title: 'Upload Successful',
          description: 'File uploaded and users imported successfully! Refreshing page to show new data...',
          variant: 'success'
        })
        
        // Clear cache vì dữ liệu đã thay đổi
        clearCache()
        
        // Refresh total statistics before page reload
        await refreshTotalStats()
        
        // Lưu trạng thái để hiện dialog sau khi refresh
        localStorage.setItem('showFileUploadAfterRefresh', 'true')
        
        // Đợi toast hiển thị xong rồi mới refresh
        console.log('⏰ Waiting 3 seconds before refresh...')
        setTimeout(() => {
          console.log('🔄 Refreshing page...')
          window.location.reload()
        }, 3000)
        
      } else {
        // Upload thành công (result === undefined hoặc truthy khác)
        setUploadTimeout(false)
        console.log('🚀 Upload successful (undefined/truthy)! Showing success toast...')
        showToast({
          title: 'Upload Successful',
          description: 'File uploaded and users imported successfully! Refreshing page to show new data...',
          variant: 'success'
        })
        
        // Clear cache vì dữ liệu đã thay đổi
        clearCache()
        
        // Refresh total statistics before page reload
        await refreshTotalStats()
        
        // Lưu trạng thái để hiện dialog sau khi refresh
        localStorage.setItem('showFileUploadAfterRefresh', 'true')
        
        // Đợi toast hiển thị xong rồi mới refresh
        console.log('⏰ Waiting 3 seconds before refresh...')
        setTimeout(() => {
          console.log('🔄 Refreshing page...')
          window.location.reload()
        }, 3000)
      }
      
      // Đóng dialog upload
      console.log('✅ Upload completed, closing dialog...')
      setShowFileUpload(false)
      
    } catch (error) {
      console.error('Error uploading file:', error)
      // Error đã được xử lý trong useAdmin hook
      
             // Không hiển thị toast lỗi theo yêu cầu
       console.log('❌ Upload error caught, no toast shown as requested.')
      
      // Clear cache vì có thể có lỗi
      clearCache()
      
      // Refresh total statistics before page reload
      await refreshTotalStats()
      
      // Lưu trạng thái để hiện dialog sau khi refresh
      localStorage.setItem('showFileUploadAfterRefresh', 'true')
      
      // Đợi một chút rồi mới refresh để user có thể thấy error
      console.log('⏰ Waiting 2 seconds before refresh...')
      setTimeout(() => {
        console.log('🔄 Refreshing page...')
        window.location.reload()
      }, 2000)
    }
  }

  const handleExportExcel = async () => {
    setExporting(true)
    try {
      const allUsers = await fetchAllUsers()
      if (allUsers.length === 0) {
        setExporting(false)
        return
      }
      const filteredAllUsers = allUsers.filter((user) => {
        const matchesSearch =
          user.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          user.email.toLowerCase().includes(searchTerm.toLowerCase())
        const matchesRole = selectedRole === 'all' || user.role === selectedRole
        const matchesStatus =
          selectedStatus === 'all' ||
          (selectedStatus === 'active' && user.isActive) ||
          (selectedStatus === 'inactive' && !user.isActive)
        // So sánh semester theo định dạng `${term.season} ${term.year}`
        const userSemester = user.term ? user.term : ''
        const matchesSemester =
          selectedSemester === 'all' || userSemester === selectedSemester
        return matchesSearch && matchesRole && matchesStatus && matchesSemester
      })
      if (filteredAllUsers.length === 0) {
        setExporting(false)
        return
      }
      const data = filteredAllUsers.map((user) => ({
        ID: user.id,
        'Full Name': user.fullName,
        Email: user.email,
        'Phone Number': user.phoneNumber,
        'Student ID': user.studentId,
        Term: user.term,
        Role: user.role,
        Status: user.isActive ? 'Active' : 'Inactive'
      }))
      const worksheet = XLSX.utils.json_to_sheet(data)
      const workbook = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Users')
      XLSX.writeFile(workbook, 'users.xlsx')
    } finally {
      setExporting(false)
    }
  }

  const handleBanUser = async (userId: string) => {
    setPendingAction({
      type: 'ban',
      userCount: 1,
      users: [userId]
    })
    setShowBanDialog(true)
  }

  const handleUnbanUser = async (userId: string) => {
    setPendingAction({
      type: 'unban',
      userCount: 1,
      users: [userId]
    })
    setShowUnbanDialog(true)
  }

  // Multi-select functions
  const handleSelectUser = (userId: string) => {
    const newSelected = new Set(selectedUsers)
    if (newSelected.has(userId)) {
      newSelected.delete(userId)
    } else {
      newSelected.add(userId)
    }
    setSelectedUsers(newSelected)
    setSelectAll(newSelected.size === filteredUsers.length)
  }

  const handleSelectAll = () => {
    if (selectAll) {
      setSelectedUsers(new Set())
      setSelectAll(false)
    } else {
      setSelectedUsers(new Set(filteredUsers.map(user => user.id)))
      setSelectAll(true)
    }
  }

  const handleBulkBan = async () => {
    if (selectedUsers.size === 0) return
    
    const { activeUsers } = getSelectedUsersByStatus()
    if (activeUsers.length === 0) {
      showToast({
        title: 'No Active Users',
        description: 'No active users selected to ban.',
        variant: 'destructive'
      })
      return
    }
    
    const userCount = activeUsers.length
    setPendingAction({
      type: 'ban',
      userCount,
      users: activeUsers
    })
    setShowBanDialog(true)
  }

  const confirmBulkBan = async () => {
    if (!pendingAction) return
    
    try {
      const promises = pendingAction.users.map(userId => adminApi.banUser(userId))
      await Promise.all(promises)
      
      const actionText = pendingAction.userCount > 1 ? 'Bulk Ban' : 'Ban'
      const userText = pendingAction.userCount > 1 ? 'users' : 'user'
      const haveText = pendingAction.userCount > 1 ? 'have' : 'has'
      
      showToast({
        title: `${actionText} Successful`,
        description: `${pendingAction.userCount} active ${userText} ${haveText} been successfully banned from the system.`,
        variant: 'success'
      })
      
      // Clear selection if it was a bulk action
      if (pendingAction.userCount > 1) {
        setSelectedUsers(new Set())
        setSelectAll(false)
      }
      
      // Refresh current page data
      await fetchUsers(pagination.pageNumber, pageSize)
      
      // Auto-refresh total statistics after ban/unban
      await refreshTotalStats()
    } catch (err) {
      console.error('Ban failed', err)
      const actionText = pendingAction.userCount > 1 ? 'Bulk Ban' : 'Ban'
      showToast({
        title: `${actionText} Failed`,
        description: 'Failed to ban user(s). Please try again.',
        variant: 'destructive'
      })
    } finally {
      setShowBanDialog(false)
      setPendingAction(null)
    }
  }

  const handleBulkUnban = async () => {
    if (selectedUsers.size === 0) return
    
    const { inactiveUsers } = getSelectedUsersByStatus()
    if (inactiveUsers.length === 0) {
      showToast({
        title: 'No Inactive Users',
        description: 'No inactive users selected to unban.',
        variant: 'destructive'
      })
      return
    }
    
    const userCount = inactiveUsers.length
    setPendingAction({
      type: 'unban',
      userCount,
      users: inactiveUsers
    })
    setShowUnbanDialog(true)
  }

  const confirmBulkUnban = async () => {
    if (!pendingAction) return
    
    try {
      const promises = pendingAction.users.map(userId => adminApi.unbanUser(userId))
      await Promise.all(promises)
      
      const actionText = pendingAction.userCount > 1 ? 'Bulk Unban' : 'Unban'
      const userText = pendingAction.userCount > 1 ? 'users' : 'user'
      const haveText = pendingAction.userCount > 1 ? 'have' : 'has'
      
      showToast({
        title: `${actionText} Successful`,
        description: `${pendingAction.userCount} inactive ${userText} ${haveText} been successfully unbanned and can access the system again.`,
        variant: 'success'
      })
      
      // Clear selection if it was a bulk action
      if (pendingAction.userCount > 1) {
        setSelectedUsers(new Set())
        setSelectAll(false)
      }
      
      // Refresh current page data
      await fetchUsers(pagination.pageNumber, pageSize)
      
      // Auto-refresh total statistics after ban/unban
      await refreshTotalStats()
    } catch (err) {
      console.error('Unban failed', err)
      const actionText = pendingAction.userCount > 1 ? 'Bulk Unban' : 'Unban'
      showToast({
        title: `${actionText} Failed`,
        description: 'Failed to unban user(s). Please try again.',
        variant: 'destructive'
      })
    } finally {
      setShowUnbanDialog(false)
      setPendingAction(null)
    }
  }

  const clearSelection = () => {
    setSelectedUsers(new Set())
    setSelectAll(false)
  }

  // Phân loại users đã chọn theo trạng thái
  const getSelectedUsersByStatus = () => {
    const activeUsers: string[] = []
    const inactiveUsers: string[] = []
    
    selectedUsers.forEach(userId => {
      const user = filteredUsers.find(u => u.id === userId)
      if (user) {
        if (user.isActive) {
          activeUsers.push(userId)
        } else {
          inactiveUsers.push(userId)
        }
      }
    })
    
    return { activeUsers, inactiveUsers }
  }

  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      user.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesRole = selectedRole === 'all' || user.role === selectedRole
    const matchesStatus =
      selectedStatus === 'all' ||
      (selectedStatus === 'active' && user.isActive) ||
      (selectedStatus === 'inactive' && !user.isActive)
    // So sánh semester theo định dạng `${termSeason} ${termYear}` hoặc pastTerms
    const userSemester = user.termSeason && user.termYear
      ? `${user.termSeason} ${user.termYear}`
      : user.pastTerms || ''
    const matchesSemester =
      selectedSemester === 'all' || userSemester === selectedSemester
    return matchesSearch && matchesRole && matchesStatus && matchesSemester
  })

  const roles = Array.from(new Set(users.map((user) => user.role)))
  const semesters = terms.map((term: any) => `${term.season} ${term.year}`)

  // Get statistics
  const stats = {
    total: filteredUsers.length,
    active: filteredUsers.filter(user => user.isActive).length,
    inactive: filteredUsers.filter(user => !user.isActive).length,
    selected: selectedUsers.size
  }

  if (loading) {
    return (
      <AdminLayout title='User Management' description='Manage all users in the system'>
        <div className='space-y-6'>
          {/* Loading Skeleton */}
          <div className='bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 rounded-2xl p-8 border border-blue-100 shadow-sm'>
            <div className='animate-pulse space-y-4'>
              <div className='flex items-center space-x-4'>
                <div className='w-16 h-16 bg-blue-200 rounded-full'></div>
                <div className='space-y-2 flex-1'>
                  <div className='h-6 bg-blue-200 rounded w-1/3'></div>
                  <div className='h-4 bg-blue-100 rounded w-1/2'></div>
                </div>
                <div className='space-y-2'>
                  <div className='h-6 bg-blue-200 rounded w-24'></div>
                  <div className='h-4 bg-blue-100 rounded w-32'></div>
                </div>
              </div>
            </div>
          </div>

          <div className='flex flex-col md:flex-row md:items-center md:justify-between gap-4'>
            <div className='flex flex-1 gap-3 items-center animate-pulse'>
              <div className='h-10 bg-gray-200 rounded-lg w-64'></div>
              <div className='h-10 bg-gray-200 rounded-lg w-32'></div>
              <div className='h-10 bg-gray-200 rounded-lg w-32'></div>
              <div className='h-10 bg-gray-200 rounded-lg w-40'></div>
            </div>
            <div className='flex gap-2 animate-pulse'>
              <div className='h-10 bg-gray-200 rounded-lg w-28'></div>
              <div className='h-10 bg-gray-200 rounded-lg w-32'></div>
              <div className='h-10 bg-gray-200 rounded-lg w-24'></div>
            </div>
          </div>

          <div className='flex items-center justify-center min-h-96 bg-white rounded-2xl shadow-sm border border-gray-100'>
            <div className='flex flex-col items-center space-y-4'>
              <div className='relative'>
                <Loader2 className='h-12 w-12 animate-spin text-blue-600' />
                <div className='absolute inset-0 h-12 w-12 animate-ping rounded-full bg-blue-400 opacity-20'></div>
              </div>
              <div className='text-center space-y-2'>
                <h3 className='text-lg font-semibold text-gray-900'>Loading users...</h3>
                <p className='text-gray-600'>Please wait while we fetch the user data</p>
              </div>
            </div>
          </div>
        </div>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout title='User Management' description='Manage all users in the system'>
      <div className='space-y-6'>
                {/* Enhanced Header with Statistics */}
        <div className='relative overflow-hidden bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 rounded-2xl p-8 border border-blue-100 shadow-lg'>
          <div className='absolute inset-0 bg-white/20 backdrop-blur-3xl'></div>
          <div className='absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-blue-400/10 to-purple-400/10 rounded-full -translate-y-48 translate-x-48'></div>
          <div className='absolute bottom-0 left-0 w-64 h-64 bg-gradient-to-tr from-indigo-400/10 to-blue-400/10 rounded-full translate-y-32 -translate-x-32'></div>
          
          <div className='relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6'>
            <div className='flex items-center space-x-6'>
              <div className='relative'>
                <div className='flex items-center justify-center w-20 h-20 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl shadow-lg'>
                  <Calendar className='w-10 h-10 text-white' />
                </div>
                <div className='absolute -top-2 -right-2 w-6 h-6 bg-green-400 rounded-full flex items-center justify-center shadow-lg'>
                  <CheckCircle2 className='w-3 h-3 text-white' />
                </div>
              </div>
              <div className='space-y-1'>
                <h3 className='text-2xl font-bold text-gray-900'>Current Semester</h3>
                <p className='text-lg font-semibold text-blue-700'>
                  {selectedSemester !== 'all' ? selectedSemester : 'All Semesters'}
                </p>
                <div className='flex items-center space-x-2 text-sm text-gray-600'>
                  <Sparkles className='w-4 h-4 text-yellow-500' />
                  <span>Real-time data management</span>
                  {isCacheValid() && (
                    <>
                      <span className='w-1 h-1 bg-gray-400 rounded-full'></span>
                      <Clock className='w-4 h-4 text-green-500' />
                      <span className='text-green-600 font-medium'>Cached data active</span>
                    </>
                  )}
                  {totalUsersCount !== null && (
                    <>
                      <span className='w-1 h-1 bg-gray-400 rounded-full'></span>
                      <Users className='w-4 h-4 text-purple-500' />
                      <span className='text-purple-600 font-medium'>Total users: {totalUsersCount}</span>
                    </>
                  )}
                </div>
              </div>
            </div>
            
            <div className='grid grid-cols-2 lg:grid-cols-4 gap-4'>
              <div className='text-center bg-white/60 backdrop-blur-sm rounded-xl p-4 shadow-sm border border-white/20 relative group'>
                <div className='flex items-center justify-center w-12 h-12 bg-blue-100 rounded-xl mx-auto mb-2'>
                  <Users className='w-6 h-6 text-blue-600' />
                </div>
                <p className='text-2xl font-bold text-gray-900'>{totalStats.total || stats.total}</p>
                <p className='text-sm font-medium text-gray-600'>Total Users</p>
                {totalUsersCount !== null && (
                  <p className='text-xs text-blue-600 font-medium mt-1'>
                    All Pages: {totalUsersCount}
                  </p>
                )}
                                 {/* Tooltip */}
                 <div className='absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-10'>
                   <div className='text-center'>
                     <p><strong>Current Page:</strong> {stats.total} users</p>
                     {totalStats.total > 0 ? (
                       <p><strong>All Pages:</strong> {totalStats.total} users</p>
                     ) : (
                       <p><strong>All Pages:</strong> Loading...</p>
                     )}
                     <p className='text-gray-300 text-xs mt-1'>Click button to refresh count</p>
                   </div>
                   <div className='absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900'></div>
                 </div>
              </div>
              
              <div className='text-center bg-white/60 backdrop-blur-sm rounded-xl p-4 shadow-sm border border-white/20'>
                <div className='flex items-center justify-center w-12 h-12 bg-green-100 rounded-xl mx-auto mb-2'>
                  <UserCheck className='w-6 h-6 text-green-600' />
                </div>
                <p className='text-2xl font-bold text-gray-900'>{totalStats.active || stats.active}</p>
                <p className='text-sm font-medium text-gray-600'>Active</p>
              </div>
              
              <div className='text-center bg-white/60 backdrop-blur-sm rounded-xl p-4 shadow-sm border border-white/20'>
                <div className='flex items-center justify-center w-12 h-12 bg-red-100 rounded-xl mx-auto mb-2'>
                  <UserX className='w-6 h-6 text-red-600' />
                </div>
                <p className='text-2xl font-bold text-gray-900'>{totalStats.inactive || stats.inactive}</p>
                <p className='text-sm font-medium text-gray-600'>Inactive</p>
              </div>
              
              <div className='text-center bg-white/60 backdrop-blur-sm rounded-xl p-4 shadow-sm border border-white/20'>
                <div className='flex items-center justify-center w-12 h-12 bg-purple-100 rounded-xl mx-auto mb-2'>
                  <CheckCircle2 className='w-6 h-6 text-purple-600' />
                </div>
                <p className='text-2xl font-bold text-gray-900'>{stats.selected}</p>
                <p className='text-sm font-medium text-gray-600'>Selected</p>
              </div>
            </div>
          </div>
        </div>

        {/* Enhanced Search and Filter Bar */}
        <div className='bg-white rounded-2xl p-6 shadow-lg border border-gray-100'>
          <div className='flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6'>
            <div className='flex flex-1 gap-4 items-center'>
              <div className='relative flex-1 max-w-md'>
                <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5' />
                <Input
                  placeholder='Search by name or email...'
                  value={searchTerm}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  className='pl-10 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200 bg-gray-50 focus:bg-white'
                />
              </div>
              
              <div className='flex items-center gap-3'>
                <Filter className='text-gray-500 w-5 h-5' />
                
                <select
                  value={selectedRole}
                  onChange={(e) => handleFilterChange('role', e.target.value)}
                  className='px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200 bg-gray-50 focus:bg-white text-sm font-medium min-w-[120px]'
                >
                  <option value='all'>👥 All Roles</option>
                  {roles.map((role) => (
                    <option key={role} value={role}>
                      {role === 'admin' ? '🔧' : role === 'teacher' ? '👨‍🏫' : '👨‍🎓'} {role}
                    </option>
                  ))}
                </select>
                
                <select
                  value={selectedStatus}
                  onChange={(e) => handleFilterChange('status', e.target.value)}
                  className='px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200 bg-gray-50 focus:bg-white text-sm font-medium min-w-[120px]'
                >
                  <option value='all'>📊 All Status</option>
                  <option value='active'>✅ Active</option>
                  <option value='inactive'>❌ Inactive</option>
                </select>
                
                <select
                  value={selectedSemester}
                  onChange={(e) => handleFilterChange('semester', e.target.value)}
                  className='px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200 bg-gray-50 focus:bg-white text-sm font-medium min-w-[160px]'
                  disabled={loadingTerms}
                >
                  <option value='all'>📚 All Semesters</option>
                  {semesters.map((term) => (
                    <option key={term} value={term}>
                      🎓 {term}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            
            <div className='flex items-center gap-3'>
              <Button 
                variant='outline' 
                onClick={handleCountTotalUsers}
                disabled={isCountingTotal}
                className='px-6 py-3 border-2 border-purple-200 text-purple-600 hover:bg-purple-50 hover:border-purple-300 transition-all duration-200 rounded-xl font-semibold shadow-sm hover:shadow-md disabled:opacity-50'
              >
                <Users className={`h-5 w-5 mr-2 ${isCountingTotal ? 'animate-spin' : ''}`} />
                {isCountingTotal ? 'Refreshing...' : totalUsersCount !== null ? `Total: ${totalUsersCount}` : 'Loading...'}
              </Button>
              
              <Button 
                variant='outline' 
                onClick={() => setShowFileUpload((v) => !v)}
                className='px-6 py-3 border-2 border-blue-200 text-blue-600 hover:bg-blue-50 hover:border-blue-300 transition-all duration-200 rounded-xl font-semibold shadow-sm hover:shadow-md'
              >
                <Upload className='h-5 w-5 mr-2' />
                <span className='hidden md:inline'>Import Users</span>
                <span className='md:hidden'>Import</span>
              </Button>
              
              <Button 
                variant='outline' 
                onClick={handleExportExcel} 
                disabled={exporting}
                className='px-6 py-3 border-2 border-green-200 text-green-600 hover:bg-green-50 hover:border-green-300 transition-all duration-200 rounded-xl font-semibold shadow-sm hover:shadow-md disabled:opacity-50'
              >
                <Download className={`h-5 w-5 mr-2 ${exporting ? 'animate-bounce' : ''}`} />
                {exporting ? 'Exporting...' : 'Export Excel'}
              </Button>
              
              <Button 
                variant='outline' 
                onClick={handleRefresh}
                disabled={loading || isRefreshing}
                className='px-6 py-3 border-2 border-gray-200 text-gray-600 hover:bg-gray-200 transition-all duration-200 rounded-xl font-semibold shadow-sm hover:shadow-md disabled:opacity-50'
              >
                <RefreshCw className={`h-5 w-5 mr-2 ${(loading || isRefreshing) ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>
          </div>
        </div>
              {/* Enhanced File Upload Section */}
        {showFileUpload && (
          <div className='bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-6 border-2 border-blue-200 shadow-lg'>
            <div className='flex items-center space-x-4 mb-4'>
              <div className='flex items-center justify-center w-12 h-12 bg-blue-500 rounded-xl'>
                <Upload className='w-6 h-6 text-white' />
              </div>
              <div>
                <h3 className='text-lg font-semibold text-blue-900'>Import Users</h3>
                <p className='text-blue-700'>Upload an Excel file to import multiple users at once</p>
              </div>
            </div>
            <FileUpload onFileUpload={handleFileUpload} />
          </div>
        )}
        
        {/* Enhanced Bulk Actions */}
        {selectedUsers.size > 0 && (
          <div className='bg-gradient-to-r from-purple-50 via-blue-50 to-indigo-50 rounded-2xl p-6 border-2 border-purple-200 shadow-lg'>
            <div className='flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6'>
              <div className='flex items-center space-x-6'>
                <div className='relative'>
                  <div className='flex items-center justify-center w-16 h-16 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-2xl shadow-lg'>
                    <Users className='w-8 h-8 text-white' />
                  </div>
                  <div className='absolute -top-2 -right-2 w-8 h-8 bg-orange-400 rounded-full flex items-center justify-center shadow-lg'>
                    <span className='text-white text-sm font-bold'>{selectedUsers.size}</span>
                  </div>
                </div>
                <div className='space-y-2'>
                  <h3 className='text-xl font-bold text-purple-900'>Bulk Actions</h3>
                  <p className='text-purple-700 font-semibold'>
                    {selectedUsers.size} user{selectedUsers.size > 1 ? 's' : ''} selected
                  </p>
                  {(() => {
                    const { activeUsers, inactiveUsers } = getSelectedUsersByStatus()
                    return (
                      <div className='flex items-center gap-3'>
                        {activeUsers.length > 0 && (
                          <span className='inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200 shadow-sm'>
                            <div className='w-2 h-2 bg-emerald-500 rounded-full mr-2 animate-pulse'></div>
                            {activeUsers.length} Active
                          </span>
                        )}
                        {inactiveUsers.length > 0 && (
                          <span className='inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold bg-red-100 text-red-800 border border-red-200 shadow-sm'>
                            <div className='w-2 h-2 bg-red-500 rounded-full mr-2'></div>
                            {inactiveUsers.length} Inactive
                          </span>
                        )}
                      </div>
                    )
                  })()}
                </div>
              </div>
              
              <div className='flex items-center gap-3'>
                <Button 
                  variant='outline' 
                  size='sm'
                  onClick={clearSelection}
                  className='px-4 py-2 text-gray-600 hover:text-gray-800 border-2 border-gray-200 hover:border-gray-300 rounded-xl transition-all duration-200'
                >
                  Clear Selection
                </Button>
                {(() => {
                  const { activeUsers, inactiveUsers } = getSelectedUsersByStatus()
                  return (
                    <>
                      {activeUsers.length > 0 && (
                        <Button 
                          variant='destructive' 
                          size='sm'
                          onClick={handleBulkBan}
                          className='flex items-center gap-2 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105'
                        >
                          <ShieldOff className='h-4 w-4' />
                          Ban Active ({activeUsers.length})
                        </Button>
                      )}
                      {inactiveUsers.length > 0 && (
                        <Button 
                          variant='default' 
                          size='sm'
                          onClick={handleBulkUnban}
                          className='flex items-center gap-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105'
                        >
                          <Shield className='h-4 w-4' />
                          Unban Inactive ({inactiveUsers.length})
                        </Button>
                      )}
                    </>
                  )
                })()}
              </div>
            </div>
            
            {/* Enhanced Warning for mixed status */}
            {(() => {
              const { activeUsers, inactiveUsers } = getSelectedUsersByStatus()
              if (activeUsers.length > 0 && inactiveUsers.length > 0) {
                return (
                  <div className='mt-6 p-4 bg-gradient-to-r from-amber-50 to-orange-50 border-2 border-amber-200 rounded-xl shadow-sm'>
                    <div className='flex items-center space-x-3'>
                      <div className='flex items-center justify-center w-10 h-10 bg-amber-100 rounded-xl'>
                        <svg className='w-5 h-5 text-amber-600' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                          <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z' />
                        </svg>
                      </div>
                      <div className='text-sm text-amber-800 leading-relaxed'>
                        <span className='font-semibold'>Mixed Status Detected:</span> You have selected both active and inactive users. 
                        Use "Ban Active" to ban active users and "Unban Inactive" to unban inactive users.
                      </div>
                    </div>
                  </div>
                )
              }
              return null
            })()}
          </div>
        )}

      {/* Multi-select Info */}
      {selectedUsers.size === 0 && (
        <div className='mb-4 p-3 bg-gray-50 border border-gray-200 rounded-lg'>
          <div className='flex items-center space-x-2 text-sm text-gray-600'>
            <Users className='h-4 w-4' />
            <span>
              💡 <strong>Tip:</strong> Use checkboxes to select multiple users for bulk actions. 
              The system will automatically categorize selected users by status and show appropriate actions.
              Click the header checkbox to select all users on this page.
            </span>
          </div>
        </div>
      )}
      
      {/* Timeout Warning */}
      {uploadTimeout && (
        <div className='mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg'>
          <div className='flex items-center justify-between'>
            <div className='flex items-center space-x-3'>
              <div className='p-2 bg-yellow-100 rounded-full'>
                <svg className='w-5 h-5 text-yellow-600' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                  <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z' />
                </svg>
              </div>
              <div>
                <h3 className='text-lg font-semibold text-yellow-900'>Upload Timeout</h3>
                <p className='text-yellow-700'>
                  Your file upload timed out, but the file may still be processing on the server. 
                  The page is now automatically refreshing every 3 seconds to monitor progress.
                </p>
              </div>
            </div>
            <Button 
              variant='outline' 
              size='sm'
              onClick={() => window.location.reload()}
              className='bg-yellow-100 border-yellow-300 text-yellow-800 hover:bg-yellow-200'
            >
              Refresh Now
            </Button>
          </div>
        </div>
      )}

      {error ? (
        <Card className='w-full max-w-md mx-auto'>
          <CardContent className='pt-6'>
            <div className='text-center'>
              <p className='text-destructive mb-4'>{error}</p>
              <Button onClick={() => fetchUsers()}>Retry</Button>
            </div>
          </CardContent>
        </Card>
      ) : filteredUsers.length === 0 ? (
        <Card>
          <CardContent className='pt-6'>
            <div className='text-center py-8'>
              <Users className='h-12 w-12 mx-auto text-muted-foreground mb-4' />
              <h3 className='text-lg font-semibold mb-2'>No users found</h3>
              <p className='text-muted-foreground'>
                {searchTerm || selectedRole !== 'all' || selectedStatus !== 'all' || selectedSemester !== 'all'
                  ? 'Try adjusting your filters'
                  : 'No users available'}
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className='overflow-x-auto'>
          <table className='min-w-full divide-y divide-gray-200 bg-white'>
            <thead className='bg-gray-50'>
              <tr>
                <th className='px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase'>
                  <input
                    type='checkbox'
                    checked={selectAll}
                    onChange={handleSelectAll}
                    className='rounded border-gray-300 text-blue-600 focus:ring-blue-500'
                  />
                </th>
                <th className='px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase'>Avatar</th>
                <th className='px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase'>Full Name</th>
                <th className='px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase'>Email</th>
                <th className='px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase'>Phone</th>
                <th className='px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase'>Student ID</th>
                <th className='px-4 py-2 text-left text-xs font-medium text-green-600 uppercase bg-green-50'>
                  <div className='flex items-center space-x-1'>
                    <svg className='w-4 h-4' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                      <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z' />
                    </svg>
                    <span>Semester</span>
                  </div>
                </th>
                <th className='px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase'>Status</th>
                <th className='px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase'>Role</th>
                <th className='px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase'>
                  <div className='flex items-center space-x-1'>
                    <Shield className='w-4 h-4' />
                    <span>Ban/Unban</span>
                  </div>
                </th>
              </tr>
            </thead>
            <tbody className='divide-y divide-gray-200'>
              {filteredUsers.map((user) => {
                const userSemester = user.termSeason && user.termYear
                  ? `${user.termSeason} ${user.termYear}`
                  : user.pastTerms || 'Not provided'
                return (
                  <tr key={user.id} className={selectedUsers.has(user.id) ? 'bg-blue-50' : ''}>
                    <td className='px-4 py-2'>
                      <input
                        type='checkbox'
                        checked={selectedUsers.has(user.id)}
                        onChange={() => handleSelectUser(user.id)}
                        className='rounded border-gray-300 text-blue-600 focus:ring-blue-500'
                      />
                    </td>
                    <td className='px-4 py-2'>
                      <img src={user.avatar} alt={user.fullName} className='h-10 w-10 rounded-full object-cover' />
                    </td>
                    <td className='px-4 py-2 font-semibold'>{user.fullName}</td>
                    <td className='px-4 py-2'>{user.email}</td>
                    <td className='px-4 py-2'>{user.phoneNumber || 'Not provided'}</td>
                    <td className='px-4 py-2'>{user.studentId || 'Not provided'}</td>
                    <td className='px-4 py-2'>
                      {userSemester !== 'Not provided' ? (
                        <span className='inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800 border border-green-200'>
                          <svg className='w-3 h-3 mr-1' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                            <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z' />
                          </svg>
                          {userSemester}
                        </span>
                      ) : (
                        <span className='text-gray-500 text-sm'>Not provided</span>
                      )}
                    </td>
                    <td className='px-4 py-2'>
                      {user.isActive ? (
                        <span className='inline-block px-2 py-1 rounded text-green-600 bg-green-100 text-xs font-semibold'>Active</span>
                      ) : (
                        <span className='inline-block px-2 py-1 rounded text-red-600 bg-red-100 text-xs font-semibold'>Inactive</span>
                      )}
                    </td>
                    <td className='px-4 py-2'>{user.role}</td>
                    <td className='px-4 py-2'>
                      <Button 
                        size='sm' 
                        variant={user.isActive ? 'outline' : 'default'}
                        onClick={() => user.isActive ? handleBanUser(user.id) : handleUnbanUser(user.id)}
                        className={`flex items-center gap-2 transition-all duration-200 ${
                          user.isActive 
                            ? 'text-red-600 border-red-300 hover:bg-red-50 hover:border-red-400' 
                            : 'text-green-600 bg-green-100 hover:bg-green-200'
                        }`}
                      >
                        {user.isActive ? (
                          <>
                            <ShieldOff className='h-4 w-4' />
                            Ban User
                          </>
                        ) : (
                          <>
                            <Shield className='h-4 w-4' />
                            Unban User
                          </>
                        )}
                      </Button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
      {pagination.totalPages > 1 && !error && (
        <div className='flex justify-center mt-8'>
          <AdminPagination
            currentPage={pagination.pageNumber}
            totalPages={pagination.totalPages}
            onPageChange={handlePageChange}
          />
        </div>
      )}
      
             {/* Confirmation Dialogs */}
       <Dialog open={showBanDialog} onOpenChange={setShowBanDialog}>
         <DialogContent>
           <DialogHeader>
             <DialogTitle>
               {pendingAction?.userCount && pendingAction.userCount > 1 ? 'Confirm Ban Users' : 'Confirm Ban User'}
             </DialogTitle>
             <DialogDescription>
               Are you sure you want to ban {pendingAction?.userCount} active user{pendingAction?.userCount && pendingAction.userCount > 1 ? 's' : ''}? They will not be able to access the system.
             </DialogDescription>
           </DialogHeader>
           <DialogFooter>
             <Button variant="outline" onClick={() => setShowBanDialog(false)}>
               Cancel
             </Button>
             <Button 
               variant="destructive" 
               onClick={confirmBulkBan}
               className="bg-red-600 hover:bg-red-700"
             >
               {pendingAction?.userCount && pendingAction.userCount > 1 ? 'Ban Users' : 'Ban User'}
             </Button>
           </DialogFooter>
         </DialogContent>
       </Dialog>

             <Dialog open={showUnbanDialog} onOpenChange={setShowUnbanDialog}>
         <DialogContent>
           <DialogHeader>
             <DialogTitle>
               {pendingAction?.userCount && pendingAction.userCount > 1 ? 'Confirm Unban Users' : 'Confirm Unban User'}
             </DialogTitle>
             <DialogDescription>
               Are you sure you want to unban {pendingAction?.userCount} inactive user{pendingAction?.userCount && pendingAction.userCount > 1 ? 's' : ''}? They will be able to access the system again.
             </DialogDescription>
           </DialogHeader>
           <DialogFooter>
             <Button variant="outline" onClick={() => setShowUnbanDialog(false)}>
               Cancel
             </Button>
             <Button 
               onClick={confirmBulkUnban}
               className="bg-green-600 hover:bg-green-700"
             >
               {pendingAction?.userCount && pendingAction.userCount > 1 ? 'Unban Users' : 'Unban User'}
             </Button>
           </DialogFooter>
         </DialogContent>
               </Dialog>
      </div>
    </AdminLayout>
  )
}
