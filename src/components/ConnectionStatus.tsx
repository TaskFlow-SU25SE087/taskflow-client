import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { RefreshCw, Wifi, WifiOff } from 'lucide-react'
import { useEffect, useState } from 'react'

interface ConnectionStatusProps {
  className?: string
}

export const ConnectionStatus: React.FC<ConnectionStatusProps> = ({ className = '' }) => {
  const [isOnline, setIsOnline] = useState(navigator.onLine)
  const [showAlert, setShowAlert] = useState(false)
  const [, setConnectionIssues] = useState<string[]>([])

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true)
      setShowAlert(false)
      setConnectionIssues([])
    }

    const handleOffline = () => {
      setIsOnline(false)
      setShowAlert(true)
      setConnectionIssues(['No internet connection'])
    }

    // Listen for online/offline events
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    // Check for connection issues immediately
    const checkConnectionIssues = () => {
      const issues: string[] = []
      
      // Check if we're offline
      if (!navigator.onLine) {
        issues.push('No internet connection')
      }

      // Check for recent SignalR errors in console
      // const _signalRErrors = [
      //   'WebSocket connection to',
      //   'Failed to start the transport',
      //   '401 (Unauthorized)',
      //   'SignalR connection failed'
      // ]

      // Check for API timeout errors
      // const _apiErrors = [
      //   'timeout of',
      //   'ECONNABORTED',
      //   'Request timeout'
      // ]

      // For now, we'll show the alert if we're offline or if there are obvious connection issues
      if (issues.length > 0) {
        setConnectionIssues(issues)
        setShowAlert(true)
      }
    }

    // Check immediately and then every 10 seconds
    checkConnectionIssues()
    const interval = setInterval(checkConnectionIssues, 10000)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
      clearInterval(interval)
    }
  }, [])

  const handleRefresh = () => {
    window.location.reload()
  }

  const handleDismiss = () => {
    setShowAlert(false)
  }

  if (!showAlert) return null

  return (
    <div className={`fixed top-4 right-4 z-50 max-w-sm ${className}`}>
      <Alert className={`border-l-4 ${isOnline ? 'border-green-500 bg-green-50' : 'border-red-500 bg-red-50'}`}>
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0">
            {isOnline ? (
              <Wifi className="h-5 w-5 text-green-600" />
            ) : (
              <WifiOff className="h-5 w-5 text-red-600" />
            )}
          </div>
          <div className="flex-1">
            <AlertDescription className="text-sm">
              {isOnline ? (
                'Connection restored! Your app should work normally now.'
              ) : (
                <div>
                  <p className="font-medium mb-2">Connection Issues Detected</p>
                  <ul className="text-xs space-y-1 text-gray-600">
                    <li>• Check your internet connection</li>
                    <li>• Server may be temporarily down</li>
                    <li>• Try refreshing the page</li>
                  </ul>
                </div>
              )}
            </AlertDescription>
          </div>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={handleRefresh}
              className="h-8 px-2"
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={handleDismiss}
              className="h-8 px-2"
            >
              ×
            </Button>
          </div>
        </div>
      </Alert>
    </div>
  )
}
