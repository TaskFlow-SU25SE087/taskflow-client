import { tagApi } from '@/api/projects'
import { Tag } from '@/types/project'
import { useEffect, useState } from 'react'
import { useCurrentProject } from './useCurrentProject'

export const useTags = () => {
  const [tags, setTags] = useState<Tag[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  const { currentProject } = useCurrentProject()

  const fetchTags = async () => {
    if (!currentProject || !currentProject.id) return
    setIsLoading(true)
    try {
      const data = await tagApi.getAllTagsByProjectId(currentProject.id)
      setTags(data)
      setError(null)
    } catch (err) {
      setError(err as Error)
      setTags([])
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchTags()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentProject])

  const refreshTags = fetchTags

  const createTag = async (tag: { name: string; description: string; color: string }) => {
    if (!currentProject || !currentProject.id) return false
    setIsLoading(true)
    try {
      const ok = await tagApi.createTag(currentProject.id, tag)
      if (ok) await fetchTags()
      return ok
    } catch (err) {
      setError(err as Error)
      return false
    } finally {
      setIsLoading(false)
    }
  }

  const updateTag = async (
    tagId: string,
    tag: { name: string; description: string; color: string }
  ) => {
    if (!currentProject || !currentProject.id) return false
    setIsLoading(true)
    try {
      const ok = await tagApi.updateTag(currentProject.id, tagId, tag)
      if (ok) await fetchTags()
      return ok
    } catch (err) {
      setError(err as Error)
      return false
    } finally {
      setIsLoading(false)
    }
  }

  const deleteTag = async (tagId: string) => {
    if (!currentProject || !currentProject.id) return false
    setIsLoading(true)
    try {
      const ok = await tagApi.deleteTag(currentProject.id, tagId)
      if (ok) await fetchTags()
      return ok
    } catch (err) {
      setError(err as Error)
      return false
    } finally {
      setIsLoading(false)
    }
  }

  return {
    tags,
    isLoading,
    error,
    refreshTags,
    createTag,
    updateTag,
    deleteTag
  }
} 