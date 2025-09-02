import { adminApi } from '@/api/admin'
import AdminLayout from '@/components/admin/AdminLayout'
import AdminPagination from '@/components/admin/AdminPagination'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { useToastContext } from '@/components/ui/ToastContext'
import { useAdmin } from '@/hooks/useAdmin'
import { useAdminTerm } from '@/hooks/useAdminTerm'
import { AdminUser } from '@/types/admin'
import { debounce } from 'lodash'
import {
  Calendar,
  CheckCircle2,
  Filter,
  Loader2,
  RefreshCw,
  Search,
  Shield,
  ShieldOff,
  Sparkles,
  UserCheck,
  Users,
  UserX,
  X
} from 'lucide-react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

export default function AdminUsersPage() {
  const { users, loading, error, pagination, fetchUsers, fetchAllUsers } = useAdmin()
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedRole, setSelectedRole] = useState<string>('all')
  const [selectedStatus, setSelectedStatus] = useState<string>('all')
  const [selectedSemester, setSelectedSemester] = useState<string>('all')
  // Removed showFileUpload and exporting state (no longer needed)
  // Removed uploadTimeout and cachedUsers (no longer needed)
  // Removed lastFetchTime (no longer needed)
  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set())
  const [selectAll, setSelectAll] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [totalUsersCount, setTotalUsersCount] = useState<number | null>(null)
  const [isCountingTotal, setIsCountingTotal] = useState(false)
  const [refreshTrigger, setRefreshTrigger] = useState(0) // Force refresh trigger
  const [totalStats, setTotalStats] = useState({
    total: 0,
    active: 0,
    inactive: 0
  })
  // When user searches, we fetch all users and search that list
  const [allUsersForSearch, setAllUsersForSearch] = useState<AdminUser[] | null>(null)
  const [isSearching, setIsSearching] = useState(false)
  const pageSize = 10
  const { showToast } = useToastContext()

  // Ref for the search input to preserve focus/selection across re-renders
  const searchInputRef = useRef<HTMLInputElement | null>(null)

  // Cache timeout: 30 giây
  // Removed CACHE_TIMEOUT (no longer needed)

  // Lấy danh sách semester (term) từ API
  const { terms, loading: loadingTerms, error: termsError } = useAdminTerm(1, 0)
  
  // Debug logging for terms
  useEffect(() => {
    console.log('Terms loaded:', terms)
    console.log('Terms loading:', loadingTerms)
    console.log('Terms error:', termsError)
  }, [terms, loadingTerms, termsError])

  // Add dialog state
  const [showBanDialog, setShowBanDialog] = useState(false)
  const [showUnbanDialog, setShowUnbanDialog] = useState(false)
  const [pendingAction, setPendingAction] = useState<{
    type: 'ban' | 'unban'
    userCount: number
    users: string[]
  } | null>(null)


  // Check for file upload dialog after refresh
  useEffect(() => {
    // Removed file upload dialog after refresh logic
  }, [])

  // Auto-count total users when page loads
  useEffect(() => {
    const autoCountTotalUsers = async () => {
      try {
        const allUsers = await fetchAllUsers()
        setTotalUsersCount(allUsers.length)
        
        // Tính toán thống kê chính xác từ tất cả users
  const totalActive = allUsers.filter((user) => user.isActive).length
  const totalInactive = allUsers.filter((user) => !user.isActive).length
        
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
  }, [fetchAllUsers, totalUsersCount]) // Chỉ chạy một lần khi component mount

  const handlePageChange = (page: number) => {
    fetchUsers(page, pageSize)
  }

  // Smart search handler - auto search when typing with debounce
  const debouncedSearch = useCallback(
    debounce(async (term: string) => {
      if (term.length === 0) {
        setAllUsersForSearch(null)
        setIsSearching(false)
        fetchUsers(1, pageSize) // Reset to pagination
        return
      }

      if (term.length >= 2) {
        setIsSearching(true)
        try {
          // Auto-fetch all users for complete search
          const all = await fetchAllUsers()
          setAllUsersForSearch(all)
        } catch (err) {
          console.error('Search failed', err)
          setAllUsersForSearch(null)
        } finally {
          setIsSearching(false)
        }
      }
    }, 1000), // 1000ms debounce - reasonable delay
    [fetchAllUsers, fetchUsers, pageSize]
  )

  // Simple text input handler - no auto-search
  const handleSearchChange = (value: string) => {
    setSearchTerm(value)
    // Only update search term, no automatic search
  }

  // Manual search trigger - only way to search
  const handleSearchTrigger = () => {
    if (searchTerm.length >= 2) {
      // Search manually when button clicked
      debouncedSearch(searchTerm)
    }
  }

  // Clear search and reset to pagination
  const handleClearSearch = () => {
    setSearchTerm('')
    debouncedSearch.cancel() // Cancel any pending search
    setIsSearching(false)
    setAllUsersForSearch(null)
    fetchUsers(1, pageSize) // Reset to pagination
  }

  // Handle Enter key press for search
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearchTrigger()
    }
  }

  // Removed complex focus/selection restoration logic for better UX
  // Removed handleFileUpload function (no longer needed)

  // Xử lý filter changes
  const handleFilterChange = async (filterType: string, value: string) => {
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
    
    // If any filter is not 'all', switch to search mode to show all matching results
    const newRole = filterType === 'role' ? value : selectedRole
    const newStatus = filterType === 'status' ? value : selectedStatus
    const newSemester = filterType === 'semester' ? value : selectedSemester
    
    const hasActiveFilter = newRole !== 'all' || newStatus !== 'all' || newSemester !== 'all'
    
    if (hasActiveFilter) {
      // Switch to "view all" mode to show filtered results across all pages
      try {
        const allUsers = await fetchAllUsers()
        setAllUsersForSearch(allUsers)
      } catch (error) {
        console.error('Failed to fetch all users for filtering:', error)
        // Fallback to normal pagination
        fetchUsers(1, pageSize)
      }
    } else {
      // All filters are 'all', switch back to normal pagination
      setAllUsersForSearch(null)
      fetchUsers(1, pageSize)
    }
  }

  // Clear cache khi cần thiết
  const clearCache = () => {
  // cache logic removed
  }

  // Enhanced refresh function
  const handleRefresh = async () => {
    setIsRefreshing(true)
    clearCache()
    try {
      await fetchUsers(1, pageSize)
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
  const totalActive = allUsers.filter((user) => user.isActive).length
  const totalInactive = allUsers.filter((user) => !user.isActive).length
      
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
  const totalActive = allUsers.filter((user) => user.isActive).length
  const totalInactive = allUsers.filter((user) => !user.isActive).length
      
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

  // All file upload logic removed

  // All export excel logic removed

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
  setSelectAll(newSelected.size === memoizedFilteredUsers.length)
  }

  const handleSelectAll = () => {
    if (selectAll) {
      setSelectedUsers(new Set())
      setSelectAll(false)
    } else {
  setSelectedUsers(new Set(memoizedFilteredUsers.map((user) => user.id)))
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
      
      // Always clear selection after successful action
      setSelectedUsers(new Set())
      setSelectAll(false)
      
      // Refresh current page data
      await fetchUsers(pagination.pageNumber, pageSize)
      
      // If we're showing all users (search mode), refresh that too
      if (allUsersForSearch) {
        const freshAllUsers = await fetchAllUsers()
        setAllUsersForSearch(freshAllUsers)
      }
      
      // Auto-refresh total statistics after ban/unban
      await refreshTotalStats()
      
      // Force UI refresh to ensure filtered results update
      setRefreshTrigger(prev => prev + 1)
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
      
      // Always clear selection after successful action
      setSelectedUsers(new Set())
      setSelectAll(false)
      
      // Refresh current page data
      await fetchUsers(pagination.pageNumber, pageSize)
      
      // If we're showing all users (search mode), refresh that too
      if (allUsersForSearch) {
        const freshAllUsers = await fetchAllUsers()
        setAllUsersForSearch(freshAllUsers)
      }
      
      // Auto-refresh total statistics after ban/unban
      await refreshTotalStats()
      
      // Force UI refresh to ensure filtered results update
      setRefreshTrigger(prev => prev + 1)
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
    const user = memoizedFilteredUsers.find(u => u.id === userId)
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

  // Use search results or current page users
  const baseUsers = allUsersForSearch || users
  
  const memoizedFilteredUsers = useMemo(() => {
    // Only apply search filtering when we have search results (allUsersForSearch)
    // For normal pagination (users), don't apply search filter
    if (!allUsersForSearch) {
      return baseUsers.filter((user) => {
        const matchesRole = selectedRole === 'all' || user.role === selectedRole
        const matchesStatus =
          selectedStatus === 'all' ||
          (selectedStatus === 'active' && user.isActive) ||
          (selectedStatus === 'inactive' && !user.isActive)
        // Normalize semesters: current term and any past terms
        const normalizedSelectedSemester = (selectedSemester || '').toString().trim().toLowerCase()
        const currentTerm = user.termSeason && user.termYear ? `${user.termSeason} ${user.termYear}` : ''
        const pastTermsList = typeof user.pastTerms === 'string' && user.pastTerms.length
          ? user.pastTerms
              .split(/[,;\n]/)
              .map((s) => s.trim())
              .filter(Boolean)
          : []
        const userSemesters = [currentTerm, ...pastTermsList].filter(Boolean).map((s) => s.toLowerCase())
        const matchesSemester =
          selectedSemester === 'all' || userSemesters.includes(normalizedSelectedSemester)
        return matchesRole && matchesStatus && matchesSemester
      })
    }
    
    // Apply all filters including search when we have search results
    return baseUsers.filter((user) => {
      const matchesSearch =
        !searchTerm ||
        user.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (user.studentId && user.studentId.toLowerCase().includes(searchTerm.toLowerCase()))
      const matchesRole = selectedRole === 'all' || user.role === selectedRole
      const matchesStatus =
        selectedStatus === 'all' ||
        (selectedStatus === 'active' && user.isActive) ||
        (selectedStatus === 'inactive' && !user.isActive)
      // Normalize semesters: current term and any past terms
      const normalizedSelectedSemester = (selectedSemester || '').toString().trim().toLowerCase()
      const currentTerm = user.termSeason && user.termYear ? `${user.termSeason} ${user.termYear}` : ''
      const pastTermsList = typeof user.pastTerms === 'string' && user.pastTerms.length
        ? user.pastTerms
            .split(/[,;\n]/)
            .map((s) => s.trim())
            .filter(Boolean)
        : []
      const userSemesters = [currentTerm, ...pastTermsList].filter(Boolean).map((s) => s.toLowerCase())
      const matchesSemester =
        selectedSemester === 'all' || userSemesters.includes(normalizedSelectedSemester)
      return matchesSearch && matchesRole && matchesStatus && matchesSemester
    })
  }, [baseUsers, searchTerm, selectedRole, selectedStatus, selectedSemester, allUsersForSearch, refreshTrigger])

  const roles = Array.from(new Set(users.map((user) => user.role)))
  
  // Get semesters from terms API and also from user data as fallback
  const semestersFromTerms = Array.isArray(terms) ? terms.map((term: any) => `${term.season} ${term.year}`) : []
  
  // Extract unique semesters from user data (current terms and past terms)
  const semestersFromUsers = useMemo(() => {
    const allSemesters = new Set<string>()
    
    baseUsers.forEach(user => {
      // Add current term if exists
      if (user.termSeason && user.termYear) {
        allSemesters.add(`${user.termSeason} ${user.termYear}`)
      }
      
      // Add past terms if exists
      if (typeof user.pastTerms === 'string' && user.pastTerms.length) {
        const pastTermsList = user.pastTerms
          .split(/[,;\n]/)
          .map(s => s.trim())
          .filter(Boolean)
        pastTermsList.forEach(term => allSemesters.add(term))
      }
    })
    
    return Array.from(allSemesters).sort()
  }, [baseUsers])
  
  // Combine semesters from API and user data, with API terms taking priority
  const semesters = [...new Set([...semestersFromTerms, ...semestersFromUsers])].sort()

  // When searching across all pages, derive roles from the base list so filters match results
  const rolesFromBase = Array.from(new Set(baseUsers.map((user) => user.role)))

  // Get statistics
  const stats = {
    total: memoizedFilteredUsers.length,
    active: memoizedFilteredUsers.filter((user) => user.isActive).length,
    inactive: memoizedFilteredUsers.filter((user) => !user.isActive).length,
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
      <div className='space-y-6 relative z-0'>
                {/* Enhanced Header with Statistics */}
        <div className='relative overflow-hidden bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 rounded-2xl p-8 border border-blue-100 shadow-lg'>
          <div className='absolute inset-0 bg-white/20 backdrop-blur-3xl z-0'></div>
          <div className='absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-blue-400/10 to-purple-400/10 rounded-full -translate-y-48 translate-x-48 z-0'></div>
          <div className='absolute bottom-0 left-0 w-64 h-64 bg-gradient-to-tr from-indigo-400/10 to-blue-400/10 rounded-full translate-y-32 -translate-x-32 z-0'></div>
          
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
                 <div className='absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50'>
                   <div className='text-center'>
                     <p><strong>Current Page:</strong> {stats.total} users</p>
                     {totalStats.total > 0 ? (
                       <p><strong>All Pages:</strong> {totalStats.total} users</p>
                     ) : (
                       <p><strong>All Pages:</strong> Loading...</p>
                     )}
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
            <div className='flex flex-1 items-center'>
              <div className='relative flex-1 max-w-md'>
                <Input
                  placeholder='Search by name, email, or student ID...'
                  value={searchTerm}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  onKeyPress={handleKeyPress}
                  ref={(el) => (searchInputRef.current = el)}
                  className='pr-10 h-10 border-2 border-gray-200 rounded-l-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200 bg-gray-50 focus:bg-white border-r-0'
                />
                {searchTerm && (
                  <button
                    onClick={handleClearSearch}
                    className='absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-red-500 transition-colors duration-200'
                  >
                    <X className='w-4 h-4' />
                  </button>
                )}
              </div>
              
              {/* Search Button */}
              <Button
                onClick={handleSearchTrigger}
                disabled={searchTerm.length < 2}
                className='h-10 px-4 rounded-r-xl rounded-l-none border-l-0 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors duration-200'
              >
                {isSearching && searchTerm.length >= 2 ? (
                  <Loader2 className='w-4 h-4 animate-spin' />
                ) : (
                  <Search className='w-4 h-4' />
                )}
              </Button>
              
              <div className='flex items-center gap-3 ml-6'>
                <Filter className='text-gray-500 w-5 h-5' />
                
                <select
                  value={selectedRole}
                  onChange={(e) => handleFilterChange('role', e.target.value)}
                  className='px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200 bg-gray-50 focus:bg-white text-sm font-medium min-w-[120px]'
                >
                  <option value='all'>👥 All Roles</option>
                  {(rolesFromBase.length ? rolesFromBase : roles).map((role) => (
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
                  disabled={loadingTerms && semesters.length === 0}
                >
                  <option value='all'>📚 All Semesters</option>
                  {loadingTerms && semesters.length === 0 ? (
                    <option value='' disabled>Loading semesters...</option>
                  ) : (
                    semesters.map((term) => (
                      <option key={term} value={term}>
                        🎓 {term}
                      </option>
                    ))
                  )}
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
              💡 <strong>Tip:</strong> Type to search by name, email, or student ID, then <strong>click the search button or press Enter</strong> to search. Use checkboxes to select multiple users for bulk actions. 
              The system will categorize selected users by status and show appropriate actions.
              Click the header checkbox to select all users on this page.
            </span>
          </div>
        </div>
      )}
      
      {/* Timeout Warning */}

      {error ? (
        <Card className='w-full max-w-md mx-auto'>
          <CardContent className='pt-6'>
            <div className='text-center'>
              <p className='text-destructive mb-4'>{error}</p>
              <Button onClick={() => fetchUsers()}>Retry</Button>
            </div>
          </CardContent>
        </Card>
  ) : memoizedFilteredUsers.length === 0 ? (
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
        <div>
          {/* Show indicator when viewing all filtered results */}
          {allUsersForSearch && (selectedRole !== 'all' || selectedStatus !== 'all' || selectedSemester !== 'all') && (
            <div className='mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg'>
              <div className='flex items-center space-x-2 text-blue-700'>
                <Filter className='h-4 w-4' />
                <span className='text-sm font-medium'>
                  Showing all {memoizedFilteredUsers.length} filtered results across all pages
                </span>
                <button
                  onClick={() => {
                    setSelectedRole('all')
                    setSelectedStatus('all') 
                    setSelectedSemester('all')
                    setAllUsersForSearch(null)
                    fetchUsers(1, pageSize)
                  }}
                  className='ml-auto text-blue-600 hover:text-blue-800 text-sm underline'
                >
                  Clear filters
                </button>
              </div>
            </div>
          )}
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
                <th className='px-4 py-2 text-left text-xs font-medium text-blue-600 uppercase bg-blue-50'>
                  <div className='flex items-center space-x-1'>
                    <svg className='w-4 h-4' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                      <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z' />
                    </svg>
                    <span>Past Semesters</span>
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
              {memoizedFilteredUsers.map((user) => {
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
                      {user.pastTerms ? (
                        <div className='flex flex-wrap gap-1'>
                          {user.pastTerms.split(/[,;\n]/).map((term, index) => (
                            <span key={index} className='inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 border border-blue-200'>
                              <svg className='w-3 h-3 mr-1' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                                <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z' />
                              </svg>
                              {term.trim()}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className='text-gray-500 text-sm'>None</span>
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
        </div>
      )}
      {pagination.totalPages > 1 && !error && !allUsersForSearch && (
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
