// Issue Type Enum
export enum IssueType {
  Bug = 10000,
  FeatureRequest = 20000,
  Improvement = 30000,
  Task = 40000,
  Documentation = 50000,
  Other = 60000
}

// Issue Priority Enum
export enum IssuePriority {
  Low = 0,
  Medium = 10000,
  High = 20000,
  Urgent = 30000
}

// Issue Status Enum
export enum IssueStatus {
  Open = 0,
  InProgress = 10000,
  Resolved = 20000,
  Closed = 30000,
  Reopened = 40000,
  OnHold = 50000,
  Cancelled = 60000
}

export interface Issue {
  id?: string
  title: string
  description: string
  priority: IssuePriority
  explanation?: string
  example?: string
  type: IssueType
  status: IssueStatus
  files?: File[]
  createdAt?: string
  updatedAt?: string
  taskId?: string
  projectId?: string
  // Additional fields from API
  titleTask?: string
  nameCreate?: string
  avatarCreate?: string
  roleCreate?: string
  issueAttachmentUrls?: string[]
  taskAssignees?: any[]
}

export interface CreateIssueRequest {
  title: string
  description: string
  priority: IssuePriority
  explanation?: string
  example?: string
  type: IssueType
  files?: File[]
}

export interface IssueResponse {
  code: number
  message: string
  data: boolean
}
