import { useCallback, useState } from 'react';
import {
    connectRepositoryToPart,
    disconnectRepositoryFromPart,
    getProjectPartCommits,
    getProjectPartQuality,
    getRepositoryConnectionStatus
} from '../api/webhooks';
import {
    CodeQualityResult,
    CommitRecord,
    CommitStatus,
    RepositoryConnection,
    RepositoryConnectionResponse
} from '../types/webhook';
import { useToast } from './useToast';

export function useWebhooks() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  // Commits state
  const [commits, setCommits] = useState<CommitRecord[]>([]);
  const [commitsLoading, setCommitsLoading] = useState(false);

  // Code quality state
  const [qualityResults, setQualityResults] = useState<CodeQualityResult[]>([]);
  const [qualityLoading, setQualityLoading] = useState(false);

  // Repository connection state
  const [connectionStatus, setConnectionStatus] = useState<RepositoryConnectionResponse['data'] | null>(null);
  const [connectionLoading, setConnectionLoading] = useState(false);

  // Fetch commits for a project part
  const fetchCommits = useCallback(async (projectId: string, partId: string) => {
    setCommitsLoading(true);
    setError(null);
    try {
      const response = await getProjectPartCommits(projectId, partId);
      if (response.code === 0) {
        setCommits(response.data);
      } else {
        throw new Error(response.message);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch commits';
      setError(errorMessage);
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive'
      });
    } finally {
      setCommitsLoading(false);
    }
  }, [toast]);

  // Fetch code quality results for a project part
  const fetchQualityResults = useCallback(async (projectId: string, partId: string) => {
    setQualityLoading(true);
    setError(null);
    try {
      const response = await getProjectPartQuality(projectId, partId);
      if (response.code === 0) {
        setQualityResults(response.data);
      } else {
        throw new Error(response.message);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch quality results';
      setError(errorMessage);
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive'
      });
    } finally {
      setQualityLoading(false);
    }
  }, [toast]);

  // Connect repository to project part
  const connectRepository = useCallback(async (
    projectId: string,
    partId: string,
    connection: RepositoryConnection
  ) => {
    setConnectionLoading(true);
    setError(null);
    try {
      const response = await connectRepositoryToPart(projectId, partId, connection);
      if (response.code === 0) {
        setConnectionStatus(response.data);
        toast({
          title: 'Success',
          description: 'Repository connected successfully!',
          variant: 'default'
        });
        return response.data;
      } else {
        throw new Error(response.message);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to connect repository';
      setError(errorMessage);
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive'
      });
      throw err;
    } finally {
      setConnectionLoading(false);
    }
  }, [toast]);

  // Disconnect repository from project part
  const disconnectRepository = useCallback(async (projectId: string, partId: string) => {
    setConnectionLoading(true);
    setError(null);
    try {
      const response = await disconnectRepositoryFromPart(projectId, partId);
      if (response.code === 0) {
        setConnectionStatus(response.data);
        toast({
          title: 'Success',
          description: 'Repository disconnected successfully!',
          variant: 'default'
        });
        return response.data;
      } else {
        throw new Error(response.message);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to disconnect repository';
      setError(errorMessage);
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive'
      });
      throw err;
    } finally {
      setConnectionLoading(false);
    }
  }, [toast]);

  // Get repository connection status
  const fetchConnectionStatus = useCallback(async (projectId: string, partId: string) => {
    setConnectionLoading(true);
    setError(null);
    try {
      const response = await getRepositoryConnectionStatus(projectId, partId);
      if (response.code === 0) {
        setConnectionStatus(response.data);
      } else {
        throw new Error(response.message);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch connection status';
      setError(errorMessage);
      // Don't show toast for this as it might be called frequently
    } finally {
      setConnectionLoading(false);
    }
  }, []);

  // Get commits by status
  const getCommitsByStatus = useCallback((status: CommitStatus) => {
    return commits.filter(commit => commit.status === status);
  }, [commits]);

  // Get latest commit
  const getLatestCommit = useCallback(() => {
    if (commits.length === 0) return null;
    return commits.sort((a, b) => 
      new Date(b.commitDate).getTime() - new Date(a.commitDate).getTime()
    )[0];
  }, [commits]);

  // Get latest quality result
  const getLatestQualityResult = useCallback(() => {
    if (qualityResults.length === 0) return null;
    return qualityResults.sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )[0];
  }, [qualityResults]);

  return {
    // State
    commits,
    qualityResults,
    connectionStatus,
    loading: commitsLoading || qualityLoading || connectionLoading,
    error,

    // Actions
    fetchCommits,
    fetchQualityResults,
    connectRepository,
    disconnectRepository,
    fetchConnectionStatus,

    // Utilities
    getCommitsByStatus,
    getLatestCommit,
    getLatestQualityResult,

    // Individual loading states
    commitsLoading,
    qualityLoading,
    connectionLoading
  };
} 