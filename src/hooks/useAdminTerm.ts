import { adminApi } from '@/api/admin'
import { useEffect, useState } from 'react'

export function useAdminTerm(page: number, reloadFlag: number) {
  const [terms, setTerms] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setLoading(true)
    setError(null)
    adminApi
      .getTermList(page)
      .then((res) => setTerms(res.data.data))
      .catch((err) => setError(err.message || 'Failed to fetch terms'))
      .finally(() => setLoading(false))
  }, [page, reloadFlag])

  return { terms, loading, error }
}
