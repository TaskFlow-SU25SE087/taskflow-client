import AdminSidebar from '@/components/admin/AdminSidebar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { useAuth } from '@/hooks/useAuth'
import {
    Home,
    LogOut,
    Menu,
    Shield
} from 'lucide-react'
import { ReactNode, useState } from 'react'
import { useNavigate } from 'react-router-dom'

interface AdminLayoutProps {
  children: ReactNode
  title: string
  description?: string
  stats?: {
    label: string
    value: string | number
    icon?: ReactNode
  }[]
}

export default function AdminLayout({ 
  children, 
  title, 
  description,
  stats 
}: AdminLayoutProps) {
  const { logout } = useAuth()
  const navigate = useNavigate()
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <AdminSidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
      <div className="flex-1 flex flex-col lg:ml-0">
        {/* Header */}
        <header className="bg-white border-b border-gray-200">
          <div className="container mx-auto px-4 sm:px-6 py-3 sm:py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2 sm:space-x-4">
                <Button
                  variant="ghost"
                  size="icon"
                  className="lg:hidden h-8 w-8"
                  onClick={() => setIsSidebarOpen(true)}
                >
                  <Menu className="h-5 w-5" />
                </Button>
                <div className="flex items-center space-x-2">
                  <Shield className="h-6 w-6 sm:h-8 sm:w-8 text-primary" />
                  <h1 className="text-lg sm:text-2xl font-bold">Admin Panel</h1>
                </div>
                <Badge variant="outline" className="hidden sm:inline-flex">Administrator</Badge>
              </div>
              <div className="flex items-center space-x-2 sm:space-x-4">
                <Button
                  variant="ghost"
                  onClick={() => navigate('/projects')}
                  className="flex items-center space-x-1 sm:space-x-2 text-sm sm:text-base h-8 sm:h-10 px-2 sm:px-4"
                >
                  <Home className="h-4 w-4" />
                  <span className="hidden sm:inline">Back to App</span>
                  <span className="sm:hidden">App</span>
                </Button>
                <Button
                  variant="outline"
                  onClick={handleLogout}
                  className="flex items-center space-x-1 sm:space-x-2 text-sm sm:text-base h-8 sm:h-10 px-2 sm:px-4"
                >
                  <LogOut className="h-4 w-4" />
                  <span className="hidden sm:inline">Logout</span>
                  <span className="sm:hidden">Out</span>
                </Button>
              </div>
            </div>
          </div>
        </header>
        <div className="container mx-auto px-4 sm:px-6 py-4 sm:py-6 flex-1">
          {/* Page Header */}
          <div className="mb-6 sm:mb-8">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">{title}</h2>
            {description && (
              <p className="mt-2 text-sm sm:text-base text-gray-600">{description}</p>
            )}
          </div>

          {/* Stats Cards */}
          {stats && stats.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6 sm:mb-8">
              {stats.map((stat, index) => (
                <Card key={index}>
                  <CardContent className="pt-4 sm:pt-6 p-4 sm:p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs sm:text-sm font-medium text-gray-600">{stat.label}</p>
                        <p className="text-xl sm:text-2xl font-bold text-gray-900">{stat.value}</p>
                      </div>
                      {stat.icon && (
                        <div className="text-gray-400">
                          {stat.icon}
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Main Content */}
          <main>
            {children}
          </main>
        </div>
      </div>
    </div>
  )
} 