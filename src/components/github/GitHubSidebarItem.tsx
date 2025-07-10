import { CheckCircle, XCircle } from 'lucide-react';
import { useEffect, useState } from 'react';
import { FiGithub } from 'react-icons/fi';
import { useWebhooks } from '../../hooks/useWebhooks';
import { Badge } from '../ui/badge';

interface GitHubSidebarItemProps {
  projectId: string;
  partId: string;
  isActive: boolean;
  onClick: () => void;
}

export default function GitHubSidebarItem({ 
  projectId, 
  partId, 
  isActive, 
  onClick 
}: GitHubSidebarItemProps) {
  const { connectionStatus, fetchConnectionStatus } = useWebhooks();
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkConnection = async () => {
      try {
        await fetchConnectionStatus(projectId, partId);
        setIsConnected(connectionStatus?.isConnected || false);
      } catch (error) {
        setIsConnected(false);
      } finally {
        setIsLoading(false);
      }
    };

    checkConnection();
  }, [projectId, partId, fetchConnectionStatus, connectionStatus]);

  const getStatusIcon = () => {
    if (isLoading) {
      return null;
    }
    
    return isConnected ? (
      <CheckCircle className="h-3 w-3 text-green-500" />
    ) : (
      <XCircle className="h-3 w-3 text-gray-400" />
    );
  };

  const getStatusBadge = () => {
    if (isLoading) {
      return (
        <Badge variant="outline" className="text-xs px-1 py-0">
          ...
        </Badge>
      );
    }
    
    return isConnected ? (
      <Badge variant="default" className="bg-green-100 text-green-700 text-xs px-1 py-0">
        Connected
      </Badge>
    ) : (
      <Badge variant="secondary" className="text-xs px-1 py-0">
        Not Connected
      </Badge>
    );
  };

  return (
    <div
      className={`relative flex items-center gap-3 px-2 py-3 cursor-pointer rounded-md transition-colors duration-200
        ${isActive ? 'text-lavender-700' : 'text-gray-600'}`}
      onClick={onClick}
    >
      <div className={`transition-colors duration-200 ${isActive ? 'text-lavender-700' : 'text-gray-500'}`}>
        <FiGithub className="h-5 w-5" />
      </div>
      <span className="font-medium">GitHub</span>
      
      {/* Status indicator */}
      <div className="ml-auto flex items-center gap-1">
        {getStatusIcon()}
        {getStatusBadge()}
      </div>
    </div>
  );
} 