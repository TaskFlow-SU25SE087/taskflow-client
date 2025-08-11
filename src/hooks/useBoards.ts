import { boardApi } from '@/api/boards'
import { Board } from '@/types/board'
import { useEffect, useState } from 'react'
import { useCurrentProject } from './useCurrentProject'

export const useBoards = () => {
  const [boards, setBoards] = useState<Board[]>([])
  const [isLoading, setIsLoading] = useState(true) // initial load only
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [didInitialLoad, setDidInitialLoad] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  const { currentProject } = useCurrentProject()

  useEffect(() => {
    if (!currentProject?.id) return
    if (!didInitialLoad) {
      setIsLoading(true)
    } else {
      setIsRefreshing(true)
    }
    boardApi
      .getAllBoardsByProjectId(currentProject.id)
      .then((fetchedBoards) => {
        setBoards(fetchedBoards)
        setError(null)
      })
      .catch((error) => {
        setError(error as Error)
        console.error('Failed to fetch boards:', error)
      })
      .finally(() => {
        setIsLoading(false)
        setIsRefreshing(false)
        setDidInitialLoad(true)
      })
  }, [currentProject?.id, didInitialLoad])

  const refreshBoards = async () => {
    if (!currentProject || !currentProject.id) return
    // background refresh
    setIsRefreshing(true)
    try {
      const updatedBoards = await boardApi.getAllBoardsByProjectId(currentProject.id)
      setBoards(updatedBoards)
      setError(null)
    } catch (error) {
      setError(error as Error)
      console.error('Failed to refresh boards:', error)
    } finally {
      setIsRefreshing(false)
    }
  }

  return {
    boards,
    isLoading,
    isRefreshing,
    didInitialLoad,
    error,
    refreshBoards,
    setBoards // thêm setBoards để cập nhật ngay trên FE
  }
}
