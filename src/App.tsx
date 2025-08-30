import { ToastContainer } from '@/components/ui/ToastContainer'
import { ToastProvider } from '@/components/ui/ToastContext'
import { updateAxiosBaseURL } from '@/configs/axiosClient'
import { CurrentProjectProvider } from '@/contexts/CurrentProjectContext'
import { GitHubStatusProvider } from '@/contexts/GitHubStatusContext'
import { SignalRProvider } from '@/contexts/SignalRContext'
import { AuthProvider } from '@/hooks/useAuthContext.tsx'
import UrlManager from '@/services/urlManager'
import React from 'react'
import { BrowserRouter } from 'react-router-dom'
import AppContent from './components/AppContent'
import { ConnectionStatus } from './components/ConnectionStatus'
import ErrorBoundary from './components/ErrorBoundary'

function App() {
  // Initialize URL Manager on app startup
  React.useEffect(() => {
    const initializeUrlManager = async () => {
      try {
        await UrlManager.getInstance().initialize()
        // Update axios baseURL after URL manager is initialized
        updateAxiosBaseURL()
      } catch (error) {
        console.error('[App] Failed to initialize URL manager:', error)
      }
    }

    initializeUrlManager()
  }, [])

  return (
    <BrowserRouter>
      <ToastProvider>
        <AuthProvider>
          <SignalRProvider>
            <GitHubStatusProvider>
              <CurrentProjectProvider>
                <ErrorBoundary>
                  <AppContent />
                  <ConnectionStatus />
                  <ToastContainer />
                </ErrorBoundary>
              </CurrentProjectProvider>
            </GitHubStatusProvider>
          </SignalRProvider>
        </AuthProvider>
      </ToastProvider>
    </BrowserRouter>
  )
}

export default App
