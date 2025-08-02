import { ToastContainer } from '@/components/ui/ToastContainer'
import { ToastProvider } from '@/components/ui/ToastContext'
import { updateAxiosBaseURL } from '@/configs/axiosClient'
import { SignalRProvider } from '@/contexts/SignalRContext'
import { AuthProvider } from '@/hooks/useAuthContext.tsx'
import UrlManager from '@/services/urlManager'
import React from 'react'
import { BrowserRouter } from 'react-router-dom'
import AppContent from './components/AppContent'
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
        <ToastContainer />
        <AuthProvider>
          <SignalRProvider>
            <ErrorBoundary>
              <AppContent />
            </ErrorBoundary>
          </SignalRProvider>
        </AuthProvider>
      </ToastProvider>
    </BrowserRouter>
  )
}

export default App
