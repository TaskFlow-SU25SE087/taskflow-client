import { adminApi } from '@/api/admin'
import AdminLayout from '@/components/admin/AdminLayout'
import AdminPagination from '@/components/admin/AdminPagination'
import AdminUserCard from '@/components/admin/AdminUserCard'
import FileUpload from '@/components/admin/FileUpload'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { useAdmin } from '@/hooks/useAdmin'
import { Loader2, Users } from 'lucide-react'
import { useState } from 'react'
import * as XLSX from 'xlsx'

export default function AdminUsersPage() {
  const { users, loading, error, pagination, fetchUsers, addFileAccount, fetchAllUsers, refetch } = useAdmin()
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedRole, setSelectedRole] = useState<string>('all')
  const [selectedStatus, setSelectedStatus] = useState<string>('all')
  const [selectedSemester, setSelectedSemester] = useState<string>('all')
  const [showFileUpload, setShowFileUpload] = useState(false)
  const [exporting, setExporting] = useState(false)

  const handlePageChange = (page: number) => {
    fetchUsers(page)
  }

  const handleFileUpload = async (file: File) => {
    try {
      await addFileAccount(file)
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
      const filteredAllUsers = allUsers.filter(user => {
        const matchesSearch = user.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                             user.email.toLowerCase().includes(searchTerm.toLowerCase())
        const matchesRole = selectedRole === 'all' || user.role === selectedRole
        const matchesStatus = selectedStatus === 'all' || 
                             (selectedStatus === 'active' && user.isActive) ||
                             (selectedStatus === 'inactive' && !user.isActive)
        const matchesSemester = selectedSemester === 'all' || user.term === selectedSemester
        return matchesSearch && matchesRole && matchesStatus && matchesSemester
      })
      if (filteredAllUsers.length === 0) {
        setExporting(false)
        return
      }
      const data = filteredAllUsers.map(user => ({
        ID: user.id,
        'Full Name': user.fullName,
        Email: user.email,
        'Phone Number': user.phoneNumber,
        'Student ID': user.studentId,
        Term: user.term,
        Role: user.role,
        Status: user.isActive ? 'Active' : 'Inactive',
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
      await refetch()
    } catch (err) {
      console.error('Ban user failed', err)
    }
  }

  const handleUnbanUser = async (userId: string) => {
    try {
      await adminApi.unbanUser(userId)
      await refetch()
    } catch (err) {
      console.error('Unban user failed', err)
    }
  }

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesRole = selectedRole === 'all' || user.role === selectedRole
    const matchesStatus = selectedStatus === 'all' || 
                         (selectedStatus === 'active' && user.isActive) ||
                         (selectedStatus === 'inactive' && !user.isActive)
    const matchesSemester = selectedSemester === 'all' || user.term === selectedSemester
    return matchesSearch && matchesRole && matchesStatus && matchesSemester
  })

  const roles = Array.from(new Set(users.map(user => user.role)))
  const semesters = Array.from(new Set(users.map(user => user.term).filter(Boolean)))

  if (loading) {
    return (
      <AdminLayout title="User Management" description="Manage all users in the system">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6 gap-4">
          <div className="flex flex-1 gap-2 items-center">
            <Input
              placeholder="Search by name or email"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="max-w-xs"
              disabled
            />
            <select disabled className="border rounded px-2 py-1 text-sm">
              <option>All Roles</option>
            </select>
            <select disabled className="border rounded px-2 py-1 text-sm">
              <option>All Status</option>
            </select>
            <select disabled className="border rounded px-2 py-1 text-sm">
              <option>All Semesters</option>
            </select>
          </div>
          <div>
            <Button variant="outline" disabled>
              <span className="hidden md:inline">Import Users</span>
              <span className="md:hidden">Import</span>
            </Button>
            <Button variant="outline" className="ml-2" disabled>
              Export Excel
            </Button>
          </div>
        </div>
        <div className="flex items-center justify-center min-h-64">
          <div className="flex items-center space-x-2">
            <Loader2 className="h-6 w-6 animate-spin" />
            <span>Loading users...</span>
          </div>
        </div>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout title="User Management" description="Manage all users in the system">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6 gap-4">
        <div className="flex flex-1 gap-2 items-center">
          <Input
            placeholder="Search by name or email"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="max-w-xs"
          />
          <select
            value={selectedRole}
            onChange={e => setSelectedRole(e.target.value)}
            className="border rounded px-2 py-1 text-sm"
          >
            <option value="all">All Roles</option>
            {roles.map(role => (
              <option key={role} value={role}>{role}</option>
            ))}
          </select>
          <select
            value={selectedStatus}
            onChange={e => setSelectedStatus(e.target.value)}
            className="border rounded px-2 py-1 text-sm"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
          <select
            value={selectedSemester}
            onChange={e => setSelectedSemester(e.target.value)}
            className="border rounded px-2 py-1 text-sm"
          >
            <option value="all">All Semesters</option>
            {semesters.map(term => (
              <option key={term} value={term as string}>{term}</option>
            ))}
          </select>
        </div>
        <div>
          <Button variant="outline" onClick={() => setShowFileUpload(v => !v)}>
            <span className="hidden md:inline">Import Users</span>
            <span className="md:hidden">Import</span>
          </Button>
          <Button variant="outline" className="ml-2" onClick={handleExportExcel} disabled={exporting}>
            {exporting ? 'Exporting...' : 'Export Excel'}
          </Button>
        </div>
      </div>
      {showFileUpload && (
        <div className="mb-6">
          <FileUpload onFileUpload={handleFileUpload} />
        </div>
      )}
      {error ? (
        <Card className="w-full max-w-md mx-auto">
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-destructive mb-4">{error}</p>
              <Button onClick={() => fetchUsers()}>Retry</Button>
            </div>
          </CardContent>
        </Card>
      ) : filteredUsers.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No users found</h3>
              <p className="text-muted-foreground">
                {searchTerm || selectedRole !== 'all' || selectedStatus !== 'all' || selectedSemester !== 'all'
                  ? 'Try adjusting your filters'
                  : 'No users available'}
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredUsers.map(user => (
            <AdminUserCard
              key={user.id}
              user={user}
              onBan={handleBanUser}
              onUnban={handleUnbanUser}
            />
          ))}
        </div>
      )}
      {pagination.totalPages > 1 && !error && (
        <div className="flex justify-center mt-8">
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