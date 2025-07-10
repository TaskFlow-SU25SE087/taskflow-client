import axiosClient from '../configs/axiosClient';
import {
    CodeQualityResponse,
    CommitsResponse,
    GitHubWebhookPayload,
    RepositoryConnection,
    RepositoryConnectionResponse,
    WebhookResponse
} from '../types/webhook';

// GitHub Webhook API (được gọi bởi GitHub, không phải Frontend)
export async function postGithubWebhook(payload: GitHubWebhookPayload): Promise<WebhookResponse> {
  const res = await axiosClient.post(
    '/api/webhooks/github',
    payload,
    { headers: { 'Content-Type': 'application/json' } }
  );
  return res.data;
}

// API để lấy danh sách commits của project part
export async function getProjectPartCommits(
  projectId: string, 
  partId: string
): Promise<CommitsResponse> {
  const res = await axiosClient.get(`/projects/${projectId}/parts/${partId}/commits`);
  return res.data;
}

// API để lấy code quality results của project part
export async function getProjectPartQuality(
  projectId: string, 
  partId: string
): Promise<CodeQualityResponse> {
  const res = await axiosClient.get(`/projects/${projectId}/parts/${partId}/quality`);
  return res.data;
}

// API để kết nối repository với project part
export async function connectRepositoryToPart(
  projectId: string,
  partId: string,
  connection: RepositoryConnection
): Promise<RepositoryConnectionResponse> {
  const res = await axiosClient.patch(
    `/projects/${projectId}/parts/${partId}/connect-repo`,
    {
      repoUrl: connection.repoUrl,
      accessToken: connection.accessToken
    },
    { headers: { 'Content-Type': 'application/json' } }
  );
  return res.data;
}

// API để disconnect repository khỏi project part
export async function disconnectRepositoryFromPart(
  projectId: string,
  partId: string
): Promise<RepositoryConnectionResponse> {
  const res = await axiosClient.delete(`/projects/${projectId}/parts/${partId}/disconnect-repo`);
  return res.data;
}

// API để lấy thông tin repository connection status
export async function getRepositoryConnectionStatus(
  projectId: string,
  partId: string
): Promise<RepositoryConnectionResponse> {
  const res = await axiosClient.get(`/projects/${projectId}/parts/${partId}/repo-status`);
  return res.data;
} 