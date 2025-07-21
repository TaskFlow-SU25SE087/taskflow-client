import { useAuth } from '@/hooks/useAuth'
import { Navigate, useLocation } from 'react-router-dom'

export function ProtectedRoute({ children }: { children: JSX.Element }) {
  const { user, authLoading } = useAuth()
  const location = useLocation()


  if (authLoading) {
    return <div>Loading...</div>
  }

  // If not logged in, redirect to login
  if (!user) {
    return <Navigate to='/login' state={{ from: location }} replace />
  }

  // If logged in but OTP not verified, redirect to OTP page
  // Only redirect if not already on the OTP page to prevent infinite loop
  // if (!isOtpVerified && location.pathname !== '/verify-otp') {
  //   return <Navigate to='/verify-otp' state={{ from: location }} replace />
  // }

  return children
}
