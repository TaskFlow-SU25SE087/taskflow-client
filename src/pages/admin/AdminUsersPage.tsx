import { adminApi } from '@/api/admin'
import AdminLayout from '@/components/admin/AdminLayout'
import AdminPagination from '@/components/admin/AdminPagination'
import FileUpload from '@/components/admin/FileUpload'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { useToastContext } from '@/components/ui/ToastContext'
import { useAdmin } from '@/hooks/useAdmin'
import { useAdminTerm } from '@/hooks/useAdminTerm'
import { debounce } from 'lodash'
import { Loader2, RefreshCw, Users } from 'lucide-react'
import { useCallback, useState } from 'react'
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
  const pageSize = 10
  const { showToast } = useToastContext()

  // Cache timeout: 30 giây
  const CACHE_TIMEOUT = 30000

  // Lấy danh sách semester (term) từ API
  const { terms, loading: loadingTerms } = useAdminTerm(1, 0)

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
    try {
      await adminApi.banUser(userId)
      await fetchUsers(pagination.pageNumber, pageSize)
    } catch (err) {
      console.error('Ban user failed', err)
    }
  }

  const handleUnbanUser = async (userId: string) => {
    try {
      await adminApi.unbanUser(userId)
      await fetchUsers(pagination.pageNumber, pageSize)
    } catch (err) {
      console.error('Unban user failed', err)
    }
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

  if (loading) {
    return (
      <AdminLayout title='User Management' description='Manage all users in the system'>
        <div className='flex flex-col md:flex-row md:items-center md:justify-between mb-6 gap-4'>
          <div className='flex flex-1 gap-2 items-center'>
            <Input
              placeholder='Search by name or email'
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className='max-w-xs'
              disabled
            />
            <select disabled className='border rounded px-2 py-1 text-sm'>
              <option>All Roles</option>
            </select>
            <select disabled className='border rounded px-2 py-1 text-sm'>
              <option>All Status</option>
            </select>
            <select disabled className='border rounded px-2 py-1 text-sm'>
              <option>All Semesters</option>
            </select>
          </div>
          <div>
            <Button variant='outline' disabled>
              <span className='hidden md:inline'>Import Users</span>
              <span className='md:hidden'>Import</span>
            </Button>
            <Button variant='outline' className='ml-2' disabled>
              Export Excel
            </Button>
          </div>
        </div>
        <div className='flex items-center justify-center min-h-64'>
          <div className='flex items-center space-x-2'>
            <Loader2 className='h-6 w-6 animate-spin' />
            <span>Loading users...</span>
          </div>
        </div>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout title='User Management' description='Manage all users in the system'>
      {/* Semester Header - Hiển thị semester hiện tại */}
      <div className='mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg'>
        <div className='flex items-center justify-between'>
          <div className='flex items-center space-x-3'>
            <div className='p-2 bg-blue-100 rounded-full'>
              <svg className='w-5 h-5 text-blue-600' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z' />
              </svg>
            </div>
            <div>
              <h3 className='text-lg font-semibold text-blue-900'>Current Semester</h3>
              <p className='text-blue-700'>
                {selectedSemester !== 'all' ? selectedSemester : 'All Semesters'}
              </p>
            </div>
          </div>
          <div className='text-right'>
            <div className='flex items-center space-x-4'>
              <div className='text-right'>
                <p className='text-sm text-blue-600'>Total Users: {filteredUsers.length}</p>
                <p className='text-xs text-blue-500'>Filtered by selected criteria</p>
                {isCacheValid() && (
                  <p className='text-xs text-green-500'>🔄 Using cached data</p>
                )}
              </div>
              
            </div>
          </div>
        </div>
      </div>

      <div className='flex flex-col md:flex-row md:items-center md:justify-between mb-6 gap-4'>
        <div className='flex flex-1 gap-2 items-center'>
          <Input
            placeholder='Search by name or email'
            value={searchTerm}
            onChange={(e) => handleSearchChange(e.target.value)}
            className='max-w-xs'
          />
          <select
            value={selectedRole}
            onChange={(e) => handleFilterChange('role', e.target.value)}
            className='border rounded px-2 py-1 text-sm'
          >
            <option value='all'>All Roles</option>
            {roles.map((role) => (
              <option key={role} value={role}>
                {role}
              </option>
            ))}
          </select>
          <select
            value={selectedStatus}
            onChange={(e) => handleFilterChange('status', e.target.value)}
            className='border rounded px-2 py-1 text-sm'
          >
            <option value='all'>All Status</option>
            <option value='active'>Active</option>
            <option value='inactive'>Inactive</option>
          </select>
          <select
            value={selectedSemester}
            onChange={(e) => handleFilterChange('semester', e.target.value)}
            className='border rounded px-3 py-2 text-sm bg-white shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
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
        <div>
          <Button variant='outline' onClick={() => setShowFileUpload((v) => !v)}>
            <RefreshCw className='h-4 w-4 mr-2' />
            <span className='hidden md:inline'>Import Users</span>
            <span className='md:hidden'>Import</span>
          </Button>
          <Button variant='outline' className='ml-2' onClick={handleExportExcel} disabled={exporting}>
            <RefreshCw className='h-4 w-4 mr-2' />
            {exporting ? 'Exporting...' : 'Export Excel'}
          </Button>
          <Button 
            variant='outline' 
            className='ml-2' 
            onClick={() => {
              clearCache()
              fetchUsersWithCache(1, pageSize)
            }}
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>
      {showFileUpload && (
        <div className='mb-6'>
          <FileUpload onFileUpload={handleFileUpload} />
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
                    <span>Term</span>
                  </div>
                </th>
                <th className='px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase'>Status</th>
                <th className='px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase'>Role</th>
                <th className='px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase'>Action</th>
              </tr>
            </thead>
            <tbody className='divide-y divide-gray-200'>
              {filteredUsers.map((user) => {
                const userSemester = user.termSeason && user.termYear
                  ? `${user.termSeason} ${user.termYear}`
                  : user.pastTerms || 'Not provided'
                return (
                  <tr key={user.id}>
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
                      {user.isActive ? (
                        <Button size='sm' variant='destructive' onClick={() => handleBanUser(user.id)}>
                          Ban
                        </Button>
                      ) : (
                        <Button size='sm' variant='default' onClick={() => handleUnbanUser(user.id)}>
                          Unban
                        </Button>
                      )}
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
    </AdminLayout>
  )
}
