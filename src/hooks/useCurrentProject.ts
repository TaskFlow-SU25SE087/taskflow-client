import { useCurrentProjectContext } from '@/contexts/CurrentProjectContext'

export const useCurrentProject = () => {
  // Centralized source of truth to avoid duplicate fetches and flashing
  return useCurrentProjectContext()
}
