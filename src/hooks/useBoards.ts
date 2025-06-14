import { useState, useEffect } from 'react'
import { Board } from '@/types/board'
import { boardApi } from '@/api/boards'
import { useCurrentProject } from './useCurrentProject'

export const useBoards = () => {
  const [boards, setBoards] = useState<Board[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const { currentProject } = useCurrentProject()

  useEffect(() => {
    const fetchBoards = async () => {
      if (!currentProject) return
      setIsLoading(true)
      try {
        const fetchedBoards = await boardApi.getAllBoardsByProjectId(currentProject.id)
        setBoards(fetchedBoards)
        setError(null)
      } catch (error) {
        setError(error as Error)
        console.error('Failed to fetch boards:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchBoards()
  }, [currentProject])

  const refreshBoards = async () => {
    if (!currentProject) return
    setIsLoading(true)
    try {
      const updatedBoards = await boardApi.getAllBoardsByProjectId(currentProject.id)
      setBoards(updatedBoards)
      setError(null)
    } catch (error) {
      setError(error as Error)
      console.error('Failed to refresh boards:', error)
    } finally {
      setIsLoading(false)
    }
  }

  return {
    boards,
    isLoading,
    error,
    refreshBoards
  }
}
