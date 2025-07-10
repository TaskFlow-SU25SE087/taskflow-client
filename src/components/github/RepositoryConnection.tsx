import {
    AlertTriangle,
    CheckCircle,
    Eye,
    EyeOff,
    Github,
    Link,
    Settings,
    Unlink,
    XCircle
} from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { useToast } from '../../hooks/useToast';
import { useWebhooks } from '../../hooks/useWebhooks';
import { RepositoryConnection as RepoConnection } from '../../types/webhook';
import { Alert, AlertDescription } from '../ui/alert';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Loader } from '../ui/loader';

interface RepositoryConnectionProps {
  projectId: string;
  partId: string;
}

export default function RepositoryConnection({ projectId, partId }: RepositoryConnectionProps) {
  const {
    connectionStatus,
    connectionLoading,
    error,
    connectRepository,
    disconnectRepository,
    fetchConnectionStatus
  } = useWebhooks();
  
  const { toast } = useToast();
  const [isConnecting, setIsConnecting] = useState(false);
  const [showToken, setShowToken] = useState(false);
  
  // Form state
  const [repoUrl, setRepoUrl] = useState('');
  const [accessToken, setAccessToken] = useState('');

  // Fetch connection status on mount
  useEffect(() => {
    fetchConnectionStatus(projectId, partId);
  }, [projectId, partId, fetchConnectionStatus]);

  const handleConnect = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!repoUrl.trim() || !accessToken.trim()) {
      toast({
        title: 'Validation Error',
        description: 'Please fill in all fields',
        variant: 'destructive'
      });
      return;
    }

    setIsConnecting(true);
    try {
      const connection: RepoConnection = {
        projectId,
        partId,
        repoUrl: repoUrl.trim(),
        accessToken: accessToken.trim()
      };
      
      await connectRepository(projectId, partId, connection);
      
      // Clear form on success
      setRepoUrl('');
      setAccessToken('');
      setShowToken(false);
      
    } catch (err) {
      // Error is already handled in the hook
    } finally {
      setIsConnecting(false);
    }
  };

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

            {isConnected && connectionStatus.webhookUrl && (
              <div className="mt-4 p-3 bg-white rounded-lg border">
                <div className="flex items-center gap-2 mb-2">
                  <Link className="h-4 w-4 text-gray-500" />
                  <span className="text-sm font-medium text-gray-700">Webhook URL</span>
                </div>
                <code className="text-sm text-gray-600 break-all">
                  {connectionStatus.webhookUrl}
                </code>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Error */}
      {error && (
        <Alert variant="destructive">
          <XCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Connection Form */}
      {!isConnected && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Github className="h-5 w-5" />
              Connect GitHub Repository
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleConnect} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="repoUrl">Repository URL</Label>
                <Input
                  id="repoUrl"
                  type="url"
                  placeholder="https://github.com/username/repository"
                  value={repoUrl}
                  onChange={(e) => setRepoUrl(e.target.value)}
                  required
                />
                <p className="text-sm text-gray-500">
                  Enter the full URL of your GitHub repository
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="accessToken">GitHub Access Token</Label>
                <div className="relative">
                  <Input
                    id="accessToken"
                    type={showToken ? 'text' : 'password'}
                    placeholder="ghp_xxxxxxxxxxxxxxxxxxxx"
                    value={accessToken}
                    onChange={(e) => setAccessToken(e.target.value)}
                    required
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3"
                    onClick={() => setShowToken(!showToken)}
                  >
                    {showToken ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                </div>
                <p className="text-sm text-gray-500">
                  Create a personal access token with repo permissions
                </p>
              </div>

              <Button
                type="submit"
                disabled={isConnecting || connectionLoading}
                className="w-full"
              >
                {isConnecting ? (
                  <>
                    <Loader className="h-4 w-4 mr-2 animate-spin" />
                    Connecting...
                  </>
                ) : (
                  <>
                    <Link className="h-4 w-4 mr-2" />
                    Connect Repository
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Instructions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Setup Instructions
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <h4 className="font-medium text-gray-900">1. Create GitHub Access Token</h4>
            <ol className="list-decimal list-inside space-y-1 text-sm text-gray-600">
              <li>Go to GitHub Settings → Developer settings → Personal access tokens</li>
              <li>Click "Generate new token (classic)"</li>
              <li>Select scopes: <code className="bg-gray-100 px-1 rounded">repo</code></li>
              <li>Copy the generated token</li>
            </ol>
          </div>

          <div className="space-y-3">
            <h4 className="font-medium text-gray-900">2. Connect Repository</h4>
            <ol className="list-decimal list-inside space-y-1 text-sm text-gray-600">
              <li>Enter your repository URL (e.g., https://github.com/username/repo)</li>
              <li>Paste your access token</li>
              <li>Click "Connect Repository"</li>
            </ol>
          </div>

          <div className="space-y-3">
            <h4 className="font-medium text-gray-900">3. Automatic Analysis</h4>
            <p className="text-sm text-gray-600">
              Once connected, every push to your repository will automatically trigger code quality analysis. 
              You can view the results in the Commit History and Code Quality Dashboard.
            </p>
          </div>

          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <strong>Security Note:</strong> Your access token is encrypted and stored securely. 
              Never share your token publicly. You can revoke it anytime from GitHub settings.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      {/* Loading State */}
      {connectionLoading && (
        <div className="flex items-center justify-center py-8">
          <Loader />
        </div>
      )}
    </div>
  );
} 