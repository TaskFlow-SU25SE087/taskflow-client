import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { useAuth } from '@/hooks/useAuth'
import {
    Home,
    LogOut,
    Shield
} from 'lucide-react'
import { ReactNode } from 'react'
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

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Shield className="h-8 w-8 text-primary" />
                <h1 className="text-2xl font-bold">Admin Panel</h1>
              </div>
              <Badge variant="outline">Administrator</Badge>
            </div>
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                onClick={() => navigate('/projects')}
                className="flex items-center space-x-2"
              >
                <Home className="h-4 w-4" />
                <span>Back to App</span>
              </Button>
              <Button
                variant="outline"
                onClick={handleLogout}
                className="flex items-center space-x-2"
              >
                <LogOut className="h-4 w-4" />
                <span>Logout</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-6 py-6">
        {/* Page Header */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900">{title}</h2>
          {description && (
            <p className="mt-2 text-gray-600">{description}</p>
          )}
        </div>

        {/* Stats Cards */}
        {stats && stats.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {stats.map((stat, index) => (
              <Card key={index}>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">{stat.label}</p>
                      <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
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
  )
} 