import AdminLayout from '@/components/admin/AdminLayout'
import { useAdmin } from '@/hooks/useAdmin'
import type { AdminUser } from '@/types/admin'
import { Ban, CheckCircle, Users, UserX } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'

export default function AdminDashboard() {
  const { fetchAllUsers, loading } = useAdmin()
  const [allUsers, setAllUsers] = useState<AdminUser[]>([])
  const [fetching, setFetching] = useState(true)
  const fetchedRef = useRef(false)

  useEffect(() => {
    if (fetchedRef.current) return
    fetchedRef.current = true
    setFetching(true)
    fetchAllUsers().then((users) => {
      setAllUsers(users)
      setFetching(false)
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const totalUsers = allUsers.length
  const bannedUsers = allUsers.filter((u) => u.isPermanentlyBanned).length
  const activeUsers = allUsers.filter((u) => u.isActive && !u.isPermanentlyBanned).length
  const inactiveUsers = allUsers.filter((u) => !u.isActive && !u.isPermanentlyBanned).length

  const stats = [
    {
      label: 'Total Users',
      value: totalUsers,
      icon: <Users className='h-6 w-6' />
    },
    {
      label: 'Active Users',
      value: activeUsers,
      icon: <CheckCircle className='h-6 w-6 text-green-600' />
    },
    {
      label: 'Banned Users',
      value: bannedUsers,
      icon: <Ban className='h-6 w-6 text-red-600' />
    },
    {
      label: 'Inactive Users',
      value: inactiveUsers,
      icon: <UserX className='h-6 w-6 text-gray-400' />
    }
  ]

  return (
    <AdminLayout title='Admin Dashboard' description='Account status statistics' stats={stats}>
      {loading || fetching ? (
        <div className='flex items-center justify-center min-h-64'>
          <span>Loading dashboard...</span>
        </div>
      ) : null}
    </AdminLayout>
  )
}
