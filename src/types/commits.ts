export interface ProjectPart {
  id: string
  name: string
  programmingLanguage: string
  framework: string
}

export interface CommitListItem {
  commitId: string
  pusher: string
  pushedAt: string
  commitMessage: string
  status: string
  qualityGateStatus: string
  bugs: number
  vulnerabilities: number
  codeSmells: number
  duplicatedLines: number
  coverage: number
  resultSummary: string
  commitUrl?: string
  expectedFinishAt?: string
  securityHotspots: number
  duplicatedBlocks: number
  duplicatedLinesDensity: number
  scanDuration: string
  qualityScore: number
  result: boolean
}

export interface CommitDetail {
  rule: string
  severity: string
  message: string
  filePath: string
  line: number
  lineContent: string
  blamedGitEmail: string
  blamedGitName: string
}
