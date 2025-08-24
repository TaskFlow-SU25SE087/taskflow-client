import { adminApi } from '@/api/admin'
import { Term } from '@/types/admin'
import { useEffect, useState } from 'react'

export function useAdminTerm(page: number, reloadFlag: number) {
  const [terms, setTerms] = useState<Term[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setLoading(true)
    setError(null)
    adminApi
      .getTermList(page)
      .then((res) => {
        const termsData = res?.data?.data
        setTerms(Array.isArray(termsData) ? termsData : [])
      })
      .catch((err) => {
        setError(err.message || 'Failed to fetch terms')
        setTerms([])
      })
      .finally(() => setLoading(false))
  }, [page, reloadFlag])

  return { terms, loading, error }
}
