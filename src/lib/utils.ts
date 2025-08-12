import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Per-user last project storage helpers
const LAST_PROJECT_KEY = 'lastProjectByUser'

type LastProjectMap = Record<string, string>

export function getLastProjectIdForUser(userId: string | undefined | null): string | undefined {
  if (!userId) return undefined
  try {
    const raw = localStorage.getItem(LAST_PROJECT_KEY)
    if (!raw) return undefined
    const map = JSON.parse(raw) as LastProjectMap
    return map[userId]
  } catch {
    return undefined
  }
}

export function setLastProjectIdForUser(userId: string | undefined | null, projectId: string) {
  if (!userId || !projectId) return
  try {
    const raw = localStorage.getItem(LAST_PROJECT_KEY)
    const map: LastProjectMap = raw ? JSON.parse(raw) : {}
    map[userId] = projectId
    localStorage.setItem(LAST_PROJECT_KEY, JSON.stringify(map))
  } catch {
    // ignore
  }
}

export function clearLastProjectForUser(userId: string | undefined | null) {
  if (!userId) return
  try {
    const raw = localStorage.getItem(LAST_PROJECT_KEY)
    if (!raw) return
    const map: LastProjectMap = JSON.parse(raw)
    if (map[userId]) {
      delete map[userId]
      localStorage.setItem(LAST_PROJECT_KEY, JSON.stringify(map))
    }
  } catch {
    // ignore
  }
}
