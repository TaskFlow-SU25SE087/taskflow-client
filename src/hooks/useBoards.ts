import { boardApi } from '@/api/boards'
import { Board } from '@/types/board'
import { useEffect, useState } from 'react'
import { useCurrentProject } from './useCurrentProject'

export const useBoards = () => {
  const [boards, setBoards] = useState<Board[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const { currentProject } = useCurrentProject()

  useEffect(() => {
    console.log('useBoards useEffect: currentProject', currentProject)
    if (!currentProject?.id) return
    setIsLoading(true)
    boardApi.getAllBoardsByProjectId(currentProject.id)
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
      })
  }, [currentProject?.id])

  const refreshBoards = async () => {
    if (!currentProject || !currentProject.id) return
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

  console.log('Boards in useBoards hook:', boards);

  return {
    boards,
    isLoading,
    error,
    refreshBoards,
    setBoards // thêm setBoards để cập nhật ngay trên FE
  }
}
