import HomePage from '@/pages/home/HomePage'
import LoginPage from '@/pages/home/LoginPage'
import { BrowserRouter, Route, Routes, Navigate } from 'react-router-dom'
import SignUpPage from '@/pages/home/SignupPage'
import { AuthProvider } from '@/components/AuthProvider'
import { useAuth } from './hooks/useAuth'
import { ProtectedRoute } from '@/components/ProtectedRoute'
import ProjectCreate from '@/pages/projects/ProjectCreate'
import ProjectList from '@/pages/projects/ProjectList'
import ProjectBoard from './pages/projects/ProjectBoard'
import ProjectBacklog from './pages/projects/ProjectBacklog'
import { Toaster } from '@/components/ui/toaster'
import AboutPage from './pages/home/AboutPage'
import ContactPage from './pages/home/ContactPage'
import GitCommits from './pages/github/GitCommits'
import ProjectTimeline from './pages/projects/ProjectTimeline'
import ProjectReports from './pages/projects/ProjectReports'
import GitIssues from './pages/github/GitIssues'

const AuthRedirect = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated } = useAuth()

  // If user is already authenticated, redirect to projects page
  if (isAuthenticated) {
    return <Navigate to='/projects' replace />
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
            path='signup'
            element={
              <AuthRedirect>
                <SignUpPage />
              </AuthRedirect>
            }
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
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App
