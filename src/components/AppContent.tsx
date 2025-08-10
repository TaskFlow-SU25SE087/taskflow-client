import AdminProtectedRoute from '@/components/AdminProtectedRoute'
import { ProtectedRoute } from '@/components/ProtectedRoute'
import { useAuth } from '@/hooks/useAuth'
import { useNavigationError } from '@/hooks/useNavigationError'
import AdminDashboard from '@/pages/admin/AdminDashboard'
import AdminTermPage from '@/pages/admin/AdminTermPage'
import AdminUsersPage from '@/pages/admin/AdminUsersPage'
import CodeQualityCommits from '@/pages/github/CodeQualityCommits'
import GitCommits from '@/pages/github/GitCommits'
import GitHubOAuthCallback from '@/pages/github/GitHubOAuthCallback'
import GitIssues from '@/pages/github/GitIssues'
import AboutPage from '@/pages/home/AboutPage'
import ActivateAccountPage from '@/pages/home/ActivateAccountPage'
import AddUserInfoPage from '@/pages/home/AddUserInfoPage'
import ContactPage from '@/pages/home/ContactPage'
import ForgotPasswordPage from '@/pages/home/ForgotPasswordPage'
import HomePage from '@/pages/home/HomePage'
import LoginPage from '@/pages/home/LoginPage'
import OtpPage from '@/pages/home/OtpPage'
import ResetPasswordPage from '@/pages/home/ResetPasswordPage'
// import SignUpPage from '@/pages/home/SignupPage'
import UserProfilePage from '@/pages/home/UserProfilePage'
import VerifyEmailPage from '@/pages/home/VerifyEmailPage'
import NotFoundPage from '@/pages/NotFoundPage'
import AllProjectParts from '@/pages/projects/AllProjectParts'
import LegacyProjectMemberVerify from '@/pages/projects/LegacyProjectMemberVerify'
import ProjectBacklog from '@/pages/projects/ProjectBacklog'
import ProjectBoard from '@/pages/projects/ProjectBoard'
import ProjectCreate from '@/pages/projects/ProjectCreate'
import ProjectGitHub from '@/pages/projects/ProjectGitHub'
import ProjectGitMembers from '@/pages/projects/ProjectGitMembers'
import { ProjectIssues } from '@/pages/projects/ProjectIssues'
import ProjectList from '@/pages/projects/ProjectList'
import ProjectMembers from '@/pages/projects/ProjectMembers'
import ProjectMemberVerify from '@/pages/projects/ProjectMemberVerify'
import ProjectReports from '@/pages/projects/ProjectReports'
import ProjectTimeline from '@/pages/projects/ProjectTimeline'
import SimpleReports from '@/pages/projects/SimpleReports'
import SprintMeetings from '@/pages/projects/SprintMeetings'
import TestReports from '@/pages/projects/TestReports'
import React from 'react'
import { Navigate, Route, Routes, useLocation } from 'react-router-dom'

const AuthRedirect = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated } = useAuth()
  const location = useLocation()

  // When authenticated, don't auto-redirect on landing or login page; otherwise, go to /projects
  if (
    isAuthenticated &&
    location.pathname !== '/projects' &&
    location.pathname !== '/' &&
    location.pathname !== '/login'
  ) {
    return <Navigate to='/projects' state={{ from: location }} replace />
  }

  return children
}

const AppContent: React.FC = () => {
  // Handle navigation errors - now inside Router context
  useNavigationError()

  return (
    <>
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
        {/* <Route
        path='signup'
        element={
          <AuthRedirect>
            <SignUpPage />
          </AuthRedirect>
        }
      /> */}

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

        <Route path='/reset-password' element={<ResetPasswordPage />} />

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

        <Route
          path='/github'
          element={
            <ProtectedRoute>
              <ProjectGitHub />
            </ProtectedRoute>
          }
        />
        <Route
          path='/members'
          element={
            <ProtectedRoute>
              <Navigate to='/projects' replace />
            </ProtectedRoute>
          }
        />
        <Route
          path='/sprint-meetings'
          element={
            <ProtectedRoute>
              <Navigate to='/projects?view=sprint-meetings' replace />
            </ProtectedRoute>
          }
        />

        {/* GitHub OAuth Callback */}
        <Route path='/github/callback' element={<GitHubOAuthCallback />} />

        {/* Dynamic project routes */}
        <Route
          path='/projects/:projectId/board'
          element={
            <ProtectedRoute>
              <ProjectBoard />
            </ProtectedRoute>
          }
        />
        <Route
          path='/projects/:projectId/timeline'
          element={
            <ProtectedRoute>
              <ProjectTimeline />
            </ProtectedRoute>
          }
        />
        <Route
          path='/projects/:projectId/backlog'
          element={
            <ProtectedRoute>
              <ProjectBacklog />
            </ProtectedRoute>
          }
        />
        <Route
          path='/projects/:projectId/reports'
          element={
            <ProtectedRoute>
              <ProjectReports />
            </ProtectedRoute>
          }
        />
        <Route
          path='/projects/:projectId/test-reports'
          element={
            <ProtectedRoute>
              <TestReports />
            </ProtectedRoute>
          }
        />
        <Route
          path='/projects/:projectId/simple-reports'
          element={
            <ProtectedRoute>
              <SimpleReports />
            </ProtectedRoute>
          }
        />
        <Route
          path='/projects/:projectId/members'
          element={
            <ProtectedRoute>
              <ProjectMembers />
            </ProtectedRoute>
          }
        />
        <Route
          path='/projects/:projectId/github'
          element={
            <ProtectedRoute>
              <ProjectGitHub />
            </ProtectedRoute>
          }
        />
        <Route
          path='/projects/:projectId/git-members'
          element={
            <ProtectedRoute>
              <ProjectGitMembers />
            </ProtectedRoute>
          }
        />
        <Route
          path='/projects/:projectId/commits'
          element={
            <ProtectedRoute>
              <GitCommits />
            </ProtectedRoute>
          }
        />
        <Route
          path='/projects/:projectId/issues'
          element={
            <ProtectedRoute>
              <ProjectIssues />
            </ProtectedRoute>
          }
        />
        <Route
          path='/projects/:projectId/sprint-meetings'
          element={
            <ProtectedRoute>
              <SprintMeetings />
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
          path='/admin/dashboard'
          element={
            <AdminProtectedRoute>
              <AdminDashboard />
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

        {/* Project member verification routes */}
        <Route path='/projects/:projectId/members/verify-join' element={<ProjectMemberVerify />} />
        <Route path='/project/:projectId/members/verify-join' element={<ProjectMemberVerify />} />
        <Route path='/project/memberss/verify-join' element={<LegacyProjectMemberVerify />} />

        {/* Admin routes */}
        <Route
          path='/admin/terms'
          element={
            <AdminProtectedRoute>
              <AdminTermPage />
            </AdminProtectedRoute>
          }
        />

        {/* Legacy redirects */}
        <Route path='/project' element={<Navigate to='/projects/' />} />

        {/* Additional protected routes */}
        <Route
          path='/all-parts'
          element={
            <ProtectedRoute>
              <AllProjectParts />
            </ProtectedRoute>
          }
        />
        <Route
          path='/code-quality-commits'
          element={
            <ProtectedRoute>
              <CodeQualityCommits />
            </ProtectedRoute>
          }
        />

        {/* 404 page route */}
        <Route path='/404' element={<NotFoundPage />} />

        {/* Catch all route - must be last */}
        <Route path='*' element={<NotFoundPage />} />
      </Routes>
    </>
  )
}

export default AppContent
