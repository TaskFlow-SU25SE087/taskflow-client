import AdminLayout from '@/components/admin/AdminLayout'
import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

export default function AdminNotFoundPage() {
  const navigate = useNavigate()
  useEffect(() => {
    const timer = setTimeout(() => {
      navigate('/admin/dashboard', { replace: true })
    }, 2000)
    return () => clearTimeout(timer)
  }, [navigate])
  return (
    <AdminLayout title="404 Not Found" description="This admin page does not exist.">
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
        <h1 className="text-6xl font-extrabold text-blue-600 mb-4">404</h1>
        <h2 className="text-2xl font-bold mb-2">Page Not Found</h2>
  <p className="text-gray-500 mb-6">You will be redirected to the Admin Dashboard shortly...</p>
  <a href="/admin/dashboard" className="px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold shadow hover:bg-blue-700 transition">Go to Admin Dashboard now</a>
      </div>
    </AdminLayout>
  )
}
