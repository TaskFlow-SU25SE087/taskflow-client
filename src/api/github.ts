import axiosClient from '../configs/axiosClient'

// Note: getGitHubConnectionStatus endpoint doesn't exist on backend
// Removed: GET /api/github/connection-status?projectId=${projectId}&partId=${partId}

// Step 2.1: Get GitHub OAuth login URL
export async function getGitHubLoginUrl() {
  const res = await axiosClient.get('/api/github/login-url')
  return res.data
}

// Step 2.3: Handle OAuth callback
export async function handleGitHubOAuthCallback(code: string) {
  const res = await axiosClient.post(`/api/github/callback?code=${code}`)
  return res.data
}

// Step 3: Fetch GitHub repositories
export async function getGitHubRepositories() {
  const res = await axiosClient.get('/api/github/repos')
  return res.data
}

// Step 4: Create Project Part
export async function createProjectPart(
  projectId: string,
  partData: {
    name: string
    programmingLanguage: string
    framework: string
  }
) {
  const res = await axiosClient.post(`/projects/${projectId}/parts`, partData)
  return res.data
}

// Step 5: Connect repository to project part
export async function connectRepositoryToPart(
  projectId: string,
  partId: string,
  repoData: {
    repoUrl: string
    accessToken: string
  }
) {
  // Validate that partId is a valid UUID
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(partId)) {
    throw new Error(`Invalid partId format: ${partId}. Expected a valid UUID.`);
  }
  
  // URL encode the partId to handle special characters and spaces
  const encodedPartId = encodeURIComponent(partId)
  const res = await axiosClient.patch(`/projects/${projectId}/parts/${encodedPartId}/connect-repo`, repoData)
  return res.data
}

// Note: getProjectParts endpoint doesn't exist on backend, so we'll remove it
// and handle this differently in the UI
