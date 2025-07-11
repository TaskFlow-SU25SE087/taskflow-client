import {
    AlertTriangle,
    CheckCircle,
    Github,
    Loader,
    RefreshCw,
    Settings,
    XCircle
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useWebhooks } from '../../hooks/useWebhooks';
import { GitHubRepository } from '../../types/webhook';
import { Alert, AlertDescription } from '../ui/alert';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Loader as LoaderComponent } from '../ui/loader';

interface GitHubOAuthProps {
  projectId: string;
  partId: string;
  onConnectionSuccess?: () => void;
}

export default function GitHubOAuth({ projectId, partId, onConnectionSuccess }: GitHubOAuthProps) {
  const {
    connectionStatus,
    connectionLoading,
    oauthLoading,
    repositories,
    error,
    fetchConnectionStatus,
    startGitHubOAuth,
    handleOAuthCallback,
    connectOAuthRepository
  } = useWebhooks();

  const location = useLocation();
  const navigate = useNavigate();
  const [isProcessingCallback, setIsProcessingCallback] = useState(false);

  // Check for OAuth callback parameters
  useEffect(() => {
    const urlParams = new URLSearchParams(location.search);
    const code = urlParams.get('code');
    const state = urlParams.get('state');

    if (code && state) {
      setIsProcessingCallback(true);
      handleOAuthCallback({ code, state })
        .then(() => {
          // Remove OAuth parameters from URL
          navigate(location.pathname, { replace: true });
        })
        .catch(() => {
          // Error is already handled in the hook
        })
        .finally(() => {
          setIsProcessingCallback(false);
        });
    }
  }, [location, handleOAuthCallback, navigate]);

  // Fetch connection status on mount
  useEffect(() => {
    fetchConnectionStatus(projectId, partId);
  }, [projectId, partId, fetchConnectionStatus]);

  const handleStartOAuth = async () => {
    const returnUrl = window.location.href;
    try {
      await startGitHubOAuth(projectId, partId, returnUrl);
    } catch (err) {
      // Error is already handled in the hook
    }
  };

  const handleConnectRepository = async (repository: GitHubRepository) => {
    try {
      await connectOAuthRepository({
        projectId,
        partId,
        repositoryId: repository.id,
        repositoryName: repository.name,
        repositoryFullName: repository.full_name
      });
      onConnectionSuccess?.();
    } catch (err) {
      // Error is already handled in the hook
    }
  };

  const isConnected = connectionStatus?.isConnected;

  // Show loading state while processing OAuth callback
  if (isProcessingCallback) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <LoaderComponent className="h-8 w-8 mx-auto mb-4 animate-spin" />
          <h3 className="text-lg font-semibold mb-2">Connecting to GitHub...</h3>
          <p className="text-gray-600">Please wait while we complete the authentication.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold">GitHub OAuth Connection</h2>
        <p className="text-gray-600">Connect your GitHub account to automatically access your repositories</p>
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
            </div>
          </CardContent>
        </Card>
      )}

      {/* OAuth Connection */}
      {!isConnected && !repositories && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Github className="h-5 w-5" />
              Connect with GitHub
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-center py-8">
              <Github className="h-16 w-16 mx-auto mb-4 text-gray-300" />
              <h3 className="text-lg font-semibold mb-2">Connect Your GitHub Account</h3>
              <p className="text-gray-600 mb-6">
                Use GitHub OAuth to securely connect your repositories without manually entering tokens.
              </p>
              <Button
                onClick={handleStartOAuth}
                disabled={oauthLoading}
                size="lg"
                className="w-full max-w-md"
              >
                {oauthLoading ? (
                  <>
                    <Loader className="h-4 w-4 mr-2 animate-spin" />
                    Connecting to GitHub...
                  </>
                ) : (
                  <>
                    <Github className="h-4 w-4 mr-2" />
                    Connect with GitHub
                  </>
                )}
              </Button>
            </div>

            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <strong>Security:</strong> This will redirect you to GitHub to authorize access to your repositories. 
                We only request read access to your repositories and will never modify your code.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      )}

      {/* Repository Selection */}
      {repositories && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Github className="h-5 w-5" />
              Select Repository
            </CardTitle>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <span>Connected as:</span>
              <div className="flex items-center gap-2">
                <img 
                  src={repositories.user.avatar_url} 
                  alt={repositories.user.name}
                  className="w-5 h-5 rounded-full"
                />
                <span className="font-medium">{repositories.user.name || repositories.user.login}</span>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {repositories.repositories.length === 0 ? (
              <div className="text-center py-8">
                <Github className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <h3 className="text-lg font-semibold mb-2">No Repositories Found</h3>
                <p className="text-gray-600 mb-4">
                  You don't have any repositories that can be connected.
                </p>
                <Button
                  onClick={handleStartOAuth}
                  variant="outline"
                  disabled={oauthLoading}
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Refresh
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-sm text-gray-600 mb-4">
                  Select a repository to connect to this project part:
                </p>
                {repositories.repositories.map((repo) => (
                  <div
                    key={repo.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900">{repo.full_name}</h4>
                        {repo.description && (
                          <p className="text-sm text-gray-600 mt-1">{repo.description}</p>
                        )}
                        <div className="flex items-center gap-2 mt-2">
                          <Badge variant={repo.private ? "secondary" : "outline"}>
                            {repo.private ? "Private" : "Public"}
                          </Badge>
                          <span className="text-xs text-gray-500">
                            Default branch: {repo.default_branch}
                          </span>
                        </div>
                      </div>
                    </div>
                    <Button
                      onClick={() => handleConnectRepository(repo)}
                      disabled={connectionLoading}
                      size="sm"
                    >
                      {connectionLoading ? (
                        <Loader className="h-4 w-4 animate-spin" />
                      ) : (
                        "Connect"
                      )}
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Instructions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            How It Works
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <h4 className="font-medium text-gray-900">1. OAuth Authentication</h4>
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
            <AlertTriangle className="h-4 w-4" />
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
          <LoaderComponent />
        </div>
      )}
    </div>
  );
} 