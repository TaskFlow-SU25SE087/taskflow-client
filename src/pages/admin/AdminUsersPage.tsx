import { adminApi } from '@/api/admin'
import AdminLayout from '@/components/admin/AdminLayout'
import AdminPagination from '@/components/admin/AdminPagination'
import FileUpload from '@/components/admin/FileUpload'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { useAdmin } from '@/hooks/useAdmin'
import { useAdminTerm } from '@/hooks/useAdminTerm'
import { Loader2, Users } from 'lucide-react'
import { useState } from 'react'
import * as XLSX from 'xlsx'

export default function AdminUsersPage() {
  const { users, loading, error, pagination, fetchUsers, importUsers, fetchAllUsers, refetch } = useAdmin()
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedRole, setSelectedRole] = useState<string>('all')
  const [selectedStatus, setSelectedStatus] = useState<string>('all')
  const [selectedSemester, setSelectedSemester] = useState<string>('all')
  const [showFileUpload, setShowFileUpload] = useState(false)
  const [exporting, setExporting] = useState(false)
  const [pageSize, setPageSize] = useState(10)

  // Lấy danh sách semester (term) từ API
  const { terms, loading: loadingTerms } = useAdminTerm(1, 0)

  const handlePageChange = (page: number) => {
    fetchUsers(page, pageSize)
  }

  const handleFileUpload = async (file: File) => {
    try {
      await importUsers(file)
    } catch (error) {
      console.error('Error uploading file:', error)
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
      <div className='flex flex-col md:flex-row md:items-center md:justify-between mb-6 gap-4'>
        <div className='flex flex-1 gap-2 items-center'>
          <Input
            placeholder='Search by name or email'
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className='max-w-xs'
          />
          <select
            value={selectedRole}
            onChange={(e) => setSelectedRole(e.target.value)}
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
            onChange={(e) => setSelectedStatus(e.target.value)}
            className='border rounded px-2 py-1 text-sm'
          >
            <option value='all'>All Status</option>
            <option value='active'>Active</option>
            <option value='inactive'>Inactive</option>
          </select>
          <select
            value={selectedSemester}
            onChange={(e) => setSelectedSemester(e.target.value)}
            className='border rounded px-2 py-1 text-sm'
            disabled={loadingTerms}
          >
            <option value='all'>All Semesters</option>
            {semesters.map((term) => (
              <option key={term} value={term}>
                {term}
              </option>
            ))}
          </select>
        </div>
        <div>
          <Button variant='outline' onClick={() => setShowFileUpload((v) => !v)}>
            <span className='hidden md:inline'>Import Users</span>
            <span className='md:hidden'>Import</span>
          </Button>
          <Button variant='outline' className='ml-2' onClick={handleExportExcel} disabled={exporting}>
            {exporting ? 'Exporting...' : 'Export Excel'}
          </Button>
        </div>
      </div>
      {showFileUpload && (
        <div className='mb-6'>
          <FileUpload onFileUpload={handleFileUpload} />
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
                <th className='px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase'>Term</th>
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
                    <td className='px-4 py-2'>{userSemester}</td>
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
