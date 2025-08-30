import AdminLayout from '@/components/admin/AdminLayout'
import AdminUserImport from '@/components/admin/AdminUserImport'

export default function AdminUserImportPage() {
  return (
    <AdminLayout title='Import Users' description='Upload CSV/XLSX to import users and manage processed files'>
      <AdminUserImport />
    </AdminLayout>
  )
}
