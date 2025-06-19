import AdminProtectedRoute from '@/components/AdminProtectedRoute'
import { ProtectedRoute } from '@/components/ProtectedRoute'
import { Toaster } from '@/components/ui/toaster'
import { AuthProvider } from '@/hooks/useAuthContext.tsx'
import AdminUsersPage from '@/pages/admin/AdminUsersPage'
import ActivateAccountPage from '@/pages/home/ActivateAccountPage'
import ForgotPasswordPage from '@/pages/home/ForgotPasswordPage'
import HomePage from '@/pages/home/HomePage'
import LoginPage from '@/pages/home/LoginPage'
import SignUpPage from '@/pages/home/SignupPage'
import ProjectBoard from '@/pages/projects/ProjectBoard'
import ProjectCreate from '@/pages/projects/ProjectCreate'
import ProjectList from '@/pages/projects/ProjectList'
import { BrowserRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { useAuth } from './hooks/useAuth'
import GitCommits from './pages/github/GitCommits'
import GitIssues from './pages/github/GitIssues'
import AboutPage from './pages/home/AboutPage'
import AddUserInfoPage from './pages/home/AddUserInfoPage'
import ContactPage from './pages/home/ContactPage'
import OtpPage from './pages/home/OtpPage'
import ResetPasswordPage from './pages/home/ResetPasswordPage'
import UserProfilePage from './pages/home/UserProfilePage'
import VerifyEmailPage from './pages/home/VerifyEmailPage'
import ProjectBacklog from './pages/projects/ProjectBacklog'
import ProjectReports from './pages/projects/ProjectReports'
import ProjectTimeline from './pages/projects/ProjectTimeline'

const AuthRedirect = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, isOtpVerified, user } = useAuth()
  const location = useLocation()

  // Kiểm tra đã hoàn tất hồ sơ (ví dụ: có username và phoneNumber)
  const isProfileCompleted = user && user.fullName && user.phoneNumber

  // Nếu đã xác thực và hoàn tất hồ sơ, redirect sang /projects
  if (isAuthenticated && isOtpVerified && isProfileCompleted && location.pathname !== '/projects') {
    return <Navigate to='/projects' state={{ from: location }} replace />
  }

  return children
}

function App() {
  return (
    <BrowserRouter>
      <Toaster />
      <AuthProvider>
        <Routes>
          <Route
            path='/'
            element={
              <AuthRedirect>
                <HomePage />
              </AuthRedirect>
            }
          />

          <Route
            path='/about'
            element={
              <AuthRedirect>
                <AboutPage />
              </AuthRedirect>
            }
          />

          <Route
            path='/contact'
            element={
              <AuthRedirect>
                <ContactPage />
              </AuthRedirect>
            }
          />

          <Route
            path='login'
            element={
              <AuthRedirect>
                <LoginPage />
              </AuthRedirect>
            }
          />
          <Route
            path='forgot-password'
            element={
              <AuthRedirect>
                <ForgotPasswordPage />
              </AuthRedirect>
            }
          />
          <Route
            path='signup'
            element={
              <AuthRedirect>
                <SignUpPage />
              </AuthRedirect>
            }
          />

          <Route
            path='verify-email'
            element={
              <AuthRedirect>
                <VerifyEmailPage />
              </AuthRedirect>
            }
          />

          <Route
            path='verify-otp'
            element={
              <AuthRedirect>
                <OtpPage />
              </AuthRedirect>
            }
          />

          <Route
            path='activate'
            element={
              <AuthRedirect>
                <ActivateAccountPage />
              </AuthRedirect>
            }
          />

          <Route
            path='/add-info'
            element={
              <AuthRedirect>
                <AddUserInfoPage />
              </AuthRedirect>
            }
          />

          <Route
            path='/reset-password'
            element={<ResetPasswordPage />}
          />

          {/* Protected routes require authentication */}
          <Route
            path='/timeline'
            element={
              <ProtectedRoute>
                <ProjectTimeline />
              </ProtectedRoute>
            }
          />
          <Route
            path='/backlog/'
            element={
              <ProtectedRoute>
                <ProjectBacklog />
              </ProtectedRoute>
            }
          />
          <Route
            path='/projects/new'
            element={
              <ProtectedRoute>
                <ProjectCreate />
              </ProtectedRoute>
            }
          />
          <Route
            path='/projects/'
            element={
              <ProtectedRoute>
                <ProjectList />
              </ProtectedRoute>
            }
          />
          <Route
            path='/board'
            element={
              <ProtectedRoute>
                <ProjectBoard />
              </ProtectedRoute>
            }
          />
          <Route
            path='/reports'
            element={
              <ProtectedRoute>
                <ProjectReports />
              </ProtectedRoute>
            }
          />
          <Route
            path='/commits'
            element={
              <ProtectedRoute>
                <GitCommits />
              </ProtectedRoute>
            }
          />
          <Route
            path='/issues'
            element={
              <ProtectedRoute>
                <GitIssues />
              </ProtectedRoute>
            }
          />

          {/* Admin routes */}
          <Route
            path='/admin/users'
            element={
              <AdminProtectedRoute>
                <AdminUsersPage />
              </AdminProtectedRoute>
            }
          />

          <Route
            path='/profile'
            element={
              <ProtectedRoute>
                <UserProfilePage />
              </ProtectedRoute>
            }
          />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App
