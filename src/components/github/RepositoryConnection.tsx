import {
  CheckCircle,
  Settings,
  Unlink,
  XCircle
} from 'lucide-react';
import { useEffect } from 'react';
import { useWebhooks } from '../../hooks/useWebhooks';
import { Alert, AlertDescription } from '../ui/alert';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import GitHubOAuth from './GitHubOAuth';

interface RepositoryConnectionProps {
  projectId: string;
  partId: string;
}

export default function RepositoryConnection({ projectId, partId }: RepositoryConnectionProps) {
  const {
    connectionStatus,
    connectionLoading,
    error,
    disconnectRepository,
    fetchConnectionStatus
  } = useWebhooks();

  // Fetch connection status on mount
  useEffect(() => {
    fetchConnectionStatus(projectId, partId);
  }, [projectId, partId, fetchConnectionStatus]);

  const handleDisconnect = async () => {
    if (!window.confirm('Are you sure you want to disconnect this repository? This will stop receiving webhook notifications.')) {
      return;
    }

    try {
      await disconnectRepository(projectId, partId);
    } catch (err) {
      // Error is already handled in the hook
    }
  };

  const handleConnectionSuccess = () => {
    // Refresh connection status after successful OAuth connection
    fetchConnectionStatus(projectId, partId);
  };

  const isConnected = connectionStatus?.isConnected;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold">Repository Connection</h2>
        <p className="text-gray-600">Connect your GitHub repository to enable automatic code analysis</p>
      </div>

      {/* Connection Status */}
      {connectionStatus && (
        <Card className={isConnected ? 'border-green-200 bg-green-50' : 'border-gray-200'}>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${isConnected ? 'bg-green-100' : 'bg-gray-100'}`}>
                  {isConnected ? (
                    <CheckCircle className="h-5 w-5 text-green-600" />
                  ) : (
                    <XCircle className="h-5 w-5 text-gray-600" />
                  )}
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">
                    {isConnected ? 'Repository Connected' : 'No Repository Connected'}
                  </h3>
                  <p className="text-sm text-gray-600">
                    {isConnected 
                      ? 'Your repository is connected and receiving webhook notifications'
                      : 'Connect a repository to enable automatic code analysis'
                    }
                  </p>
                </div>
              </div>
              
              {isConnected && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleDisconnect}
                  disabled={connectionLoading}
                >
                  <Unlink className="h-4 w-4 mr-2" />
                  Disconnect
                </Button>
              )}
            </div>

            {error && (
              <Alert className="mt-4">
                <XCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      )}

      {/* OAuth Connection */}
      {!isConnected && (
        <GitHubOAuth 
          projectId={projectId} 
          partId={partId} 
          onConnectionSuccess={handleConnectionSuccess}
        />
      )}

      {/* Instructions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            How OAuth Works
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <h4 className="font-medium text-gray-900">1. Secure Authentication</h4>
            <p className="text-sm text-gray-600">
              Click "Connect with GitHub" to securely authenticate with your GitHub account using OAuth.
            </p>
          </div>

          <div className="space-y-3">
            <h4 className="font-medium text-gray-900">2. Repository Selection</h4>
            <p className="text-sm text-gray-600">
              After authentication, you'll see a list of your repositories. Select the one you want to connect.
            </p>
          </div>

          <div className="space-y-3">
            <h4 className="font-medium text-gray-900">3. Automatic Setup</h4>
            <p className="text-sm text-gray-600">
              We'll automatically set up webhooks and configure the connection for code quality analysis.
            </p>
          </div>

          <Alert>
            <XCircle className="h-4 w-4" />
            <AlertDescription>
              <strong>Benefits:</strong> OAuth is more secure than personal access tokens and doesn't require 
              manual token management. You can revoke access anytime from your GitHub settings.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      {/* Loading State */}
      {connectionLoading && (
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
        </div>
      )}
    </div>
  );
} 