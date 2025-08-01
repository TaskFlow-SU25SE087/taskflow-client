import axiosClient from '../configs/axiosClient'
import {
    CodeQualityResponse,
    CommitsResponse,
    GitHubOAuthCallback,
    GitHubOAuthConnectRequest,
    GitHubOAuthRepositoryResponse,
    GitHubWebhookPayload,
    RepositoryConnection,
    RepositoryConnectionResponse,
    WebhookResponse
} from '../types/webhook'

// GitHub Webhook API (được gọi bởi GitHub, không phải Frontend)
export async function postGithubWebhook(payload: GitHubWebhookPayload): Promise<WebhookResponse> {
  const res = await axiosClient.post('/api/webhooks/github', payload, {
    headers: { 'Content-Type': 'application/json' }
  })
  return res.data
}

// API để lấy danh sách commits của project part
export async function getProjectPartCommits(projectId: string, partId: string): Promise<CommitsResponse> {
  const res = await axiosClient.get(`/projects/${projectId}/parts/${partId}/commits`)
  return res.data
}

// API để lấy code quality results của project part
export async function getProjectPartQuality(projectId: string, partId: string): Promise<CodeQualityResponse> {
  const res = await axiosClient.get(`/projects/${projectId}/parts/${partId}/quality`)
  return res.data
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
  )
  return res.data
}

// API để disconnect repository khỏi project part
export async function disconnectRepositoryFromPart(
  projectId: string,
  partId: string
): Promise<RepositoryConnectionResponse> {
  const res = await axiosClient.delete(`/projects/${projectId}/parts/${partId}/disconnect-repo`)
  return res.data
}

// Note: getRepositoryConnectionStatus endpoint doesn't exist on backend
// Removed: /projects/{projectId}/parts/{partId}/repo-status

// GitHub OAuth APIs
export async function initiateGitHubOAuth(
  projectId: string,
  partId: string,
  returnUrl: string
): Promise<{ code: number; message: string; data: { authUrl: string } }> {
  const res = await axiosClient.post('/api/github/oauth/initiate', {
    projectId,
    partId,
    returnUrl
  })
  return res.data
}

export async function handleGitHubOAuthCallback(callback: GitHubOAuthCallback): Promise<GitHubOAuthRepositoryResponse> {
  const res = await axiosClient.post('/api/github/oauth/callback', callback)
  return res.data
}

export async function connectGitHubRepository(
  request: GitHubOAuthConnectRequest
): Promise<RepositoryConnectionResponse> {
  const res = await axiosClient.post('/api/github/oauth/connect', request)
  return res.data
}

// API mới lấy danh sách commits của project part (có phân trang, chất lượng code)
export async function getProjectPartCommitsV2(projectId: string, partId: string, page: number = 1) {
  const res = await axiosClient.get(`/projects/${projectId}/parts/${partId}/commits`, { params: { page } });
  return res.data;
}

// Lấy chi tiết commit (chất lượng code, rule, file, dòng...)
export async function getProjectPartCommitDetail(projectId: string, partId: string, commitId: string) {
  const res = await axiosClient.get(`/projects/${projectId}/parts/${partId}/commit/${commitId}`);
  return res.data;
}
