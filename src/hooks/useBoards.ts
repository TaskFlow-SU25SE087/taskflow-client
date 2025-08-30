/* eslint-disable @typescript-eslint/no-explicit-any */
import { boardApi } from '@/api/boards'
import { Board } from '@/types/board'
import { useEffect, useState, useCallback } from 'react'
import { useCurrentProject } from './useCurrentProject'

export const useBoards = () => {
  const [boards, setBoardsState] = useState<Board[]>([])
  const [isLoading, setIsLoading] = useState(true) // initial load only
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [didInitialLoad, setDidInitialLoad] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  const { currentProject } = useCurrentProject()

  const normalizeBoard = (b: unknown): Board => {
    const boardLike = (b as Board) || ({} as Board)
    const tasks =
      boardLike && 'tasks' in (boardLike as any) && Array.isArray((boardLike as any).tasks)
        ? (boardLike as any).tasks
        : []
    return { ...boardLike, tasks }
  }

  // Safe setBoards wrapper that normalizes incoming boards and supports updater functions
  const setBoards = useCallback((value: Board[] | ((prev: Board[]) => Board[])) => {
    if (typeof value === 'function') {
      setBoardsState((prev) => {
        const result = (value as (p: Board[]) => Board[])(prev)
        return Array.isArray(result) ? result.map(normalizeBoard) : prev
      })
    } else {
      setBoardsState(Array.isArray(value) ? value.map(normalizeBoard) : [])
    }
  }, [])

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
        // Ensure boards always have a tasks array to avoid runtime errors
        setBoards(Array.isArray(fetchedBoards) ? fetchedBoards.map(normalizeBoard) : [])
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
  }, [currentProject?.id, didInitialLoad, setBoards])

  const refreshBoards = async () => {
    if (!currentProject || !currentProject.id) return
    // background refresh
    setIsRefreshing(true)
    try {
      console.log('🔄 [useBoards] Refreshing boards...')
      const updatedBoards = await boardApi.getAllBoardsByProjectId(currentProject.id)
      console.log(
        '✅ [useBoards] Boards refreshed successfully:',
        Array.isArray(updatedBoards) ? updatedBoards.length : 0,
        'boards'
      )
      setBoards(Array.isArray(updatedBoards) ? updatedBoards.map(normalizeBoard) : [])
      setError(null)
    } catch (error) {
      setError(error as Error)
      console.error('❌ [useBoards] Failed to refresh boards:', error)
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
    setBoards // safe setter that normalizes boards/tasks
  }
}
