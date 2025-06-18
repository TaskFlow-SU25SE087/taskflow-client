import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useAuth } from '@/hooks/useAuth'
import { AlertTriangle, Shield } from 'lucide-react'
import { ReactNode } from 'react'
import { Navigate } from 'react-router-dom'

interface AdminProtectedRouteProps {
  children: ReactNode
}

export default function AdminProtectedRoute({ children }: AdminProtectedRouteProps) {
  const { isAuthenticated, user, authLoading } = useAuth()

  console.log('[AdminProtectedRoute] user:', user)
  console.log('[AdminProtectedRoute] authLoading:', authLoading)

  if (authLoading) {
    return <div>Loading...</div>
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  // Check if user has admin role (0 = admin, 1 = regular user, or "Admin" = admin)
  const isAdmin = user?.role === 'Admin' || user?.role === 'admin' || user?.role === 0 || user?.role === '0'

  if (!isAdmin) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
              <AlertTriangle className="h-6 w-6 text-red-600" />
            </div>
            <CardTitle className="text-xl">Access Denied</CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-muted-foreground mb-4">
              You don't have permission to access the admin panel. 
              Only administrators can view this page.
            </p>
            <div className="flex items-center justify-center space-x-2 text-sm text-muted-foreground">
              <Shield className="h-4 w-4" />
              <span>Admin access required</span>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return <>{children}</>
} 