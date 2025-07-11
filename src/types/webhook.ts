// GitHub Webhook Types
export interface GitHubWebhookPayload {
  ref: string
  before: string
  after: string
  repository: GitHubRepository
  pusher: GitHubPusher
  sender: GitHubSender
  created: boolean
  deleted: boolean
  forced: boolean
  base_ref: string | null
  compare: string
  commits: GitHubCommit[]
  head_commit: GitHubCommit
}

export interface GitHubRepository {
  id: number
  node_id: string
  name: string
  full_name: string
  private: boolean
  owner: GitHubOwner
  html_url: string
  description: string
  fork: boolean
  url: string
  created_at: number
  updated_at: string
  pushed_at: number
  git_url: string
  ssh_url: string
  clone_url: string
  default_branch: string
}

export interface GitHubOwner {
  name: string
  email: string
  login: string
  id: number
  node_id: string
  avatar_url: string
  url: string
  html_url: string
  type: string
  site_admin: boolean
}

export interface GitHubPusher {
  name: string
  email: string
}

export interface GitHubSender {
  login: string
  id: number
  node_id: string
  avatar_url: string
  url: string
  html_url: string
  type: string
  site_admin: boolean
}

export interface GitHubCommit {
  id: string
  tree_id: string
  distinct: boolean
  message: string
  timestamp: string
  url: string
  author: GitHubCommitAuthor
  committer: GitHubCommitAuthor
  added: string[]
  removed: string[]
  modified: string[]
}

export interface GitHubCommitAuthor {
  name: string
  email: string
}

// Commit Record Types (from backend)
export interface CommitRecord {
  id: string
  projectId: string
  partId: string
  commitHash: string
  commitMessage: string
  authorName: string
  authorEmail: string
  commitDate: string
  status: CommitStatus
  qualityScore?: number
  issuesCount?: number
  createdAt: string
  updatedAt: string
}

export enum CommitStatus {
  Checking = 'Checking',
  Done = 'Done',
  Failed = 'Failed'
}

// Code Quality Types
export interface CodeQualityResult {
  id: string
  projectId: string
  partId: string
  commitHash: string
  overallScore: number
  maintainability: number
  reliability: number
  security: number
  securityHotspots: number
  bugs: number
  vulnerabilities: number
  codeSmells: number
  coverage: number
  duplicatedLines: number
  createdAt: string
}

// API Response Types
export interface WebhookResponse {
  code: number
  message: string
  data: string | null
}

export interface CommitsResponse {
  code: number
  message: string
  data: CommitRecord[]
}

export interface CodeQualityResponse {
  code: number
  message: string
  data: CodeQualityResult[]
}

// Repository Connection Types
export interface RepositoryConnection {
  projectId: string
  partId: string
  repoUrl: string
  accessToken: string
}

export interface RepositoryConnectionResponse {
  code: number
  message: string
  data: {
    webhookUrl: string
    isConnected: boolean
  }
}

// GitHub OAuth Types
export interface GitHubOAuthConfig {
  clientId: string
  redirectUri: string
  scope: string
}

export interface GitHubOAuthState {
  projectId: string
  partId: string
  returnUrl: string
}

export interface GitHubOAuthCallback {
  code: string
  state: string
}

export interface GitHubOAuthTokenResponse {
  access_token: string
  token_type: string
  scope: string
}

export interface GitHubUser {
  id: number
  login: string
  avatar_url: string
  name: string
  email: string
  html_url: string
}

export interface GitHubRepository {
  id: number
  name: string
  full_name: string
  private: boolean
  html_url: string
  description: string
  default_branch: string
  owner: {
    login: string
    avatar_url: string
  }
}

export interface GitHubOAuthRepositoryResponse {
  code: number
  message: string
  data: {
    repositories: GitHubRepository[]
    user: GitHubUser
  }
}

export interface GitHubOAuthConnectRequest {
  projectId: string
  partId: string
  repositoryId: number
  repositoryName: string
  repositoryFullName: string
} 