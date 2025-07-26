import { adminApi } from '@/api/admin'
import AdminLayout from '@/components/admin/AdminLayout'
import { useToastContext } from '@/components/ui/ToastContext'
import { useAdminTerm } from '@/hooks/useAdminTerm'
import { useState } from 'react'

export default function AdminTermPage() {
  const [page, setPage] = useState(1)
  const [reloadFlag, setReloadFlag] = useState(0)
  const { terms, loading, error } = useAdminTerm(page, reloadFlag)

  // State for create form
  const [season, setSeason] = useState('')
  const [year, setYear] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [creating, setCreating] = useState(false)
  const [createError, setCreateError] = useState<string | null>(null)

  // State for edit
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editSeason, setEditSeason] = useState('')
  const [editYear, setEditYear] = useState('')
  const [editStartDate, setEditStartDate] = useState('')
  const [editEndDate, setEditEndDate] = useState('')
  const [editLoading, setEditLoading] = useState(false)

  // State for detail modal
  const [detailId, setDetailId] = useState<string | null>(null)
  const [detail, setDetail] = useState<any>(null)
  const [detailLoading, setDetailLoading] = useState(false)

  // Create term
  const handleCreateTerm = async (e: React.FormEvent) => {
    e.preventDefault()
    setCreating(true)
    setCreateError(null)
    try {
      await adminApi.createTerm({
        season,
        year: Number(year),
        startDate,
        endDate
      })
      setSeason('')
      setYear('')
      setStartDate('')
      setEndDate('')
      setPage(1)
      setReloadFlag((f) => f + 1)
      showToast({ title: 'Success', description: 'Term created successfully!', variant: 'default' })
    } catch (err: any) {
      setCreateError(err.message || 'Create term failed')
      showToast({ title: 'Error', description: 'Failed to create term!', variant: 'destructive' })
    } finally {
      setCreating(false)
    }
  }

  // Edit term
  const handleEditClick = (term: any) => {
    setEditingId(term.id)
    setEditSeason(term.season)
    setEditYear(term.year.toString())
    setEditStartDate(term.startDate.slice(0, 10))
    setEditEndDate(term.endDate.slice(0, 10))
  }
  const handleEditSave = async (id: string) => {
    setEditLoading(true)
    try {
      await adminApi.updateTerm(id, {
        season: editSeason,
        year: Number(editYear),
        startDate: editStartDate,
        endDate: editEndDate
      })
      setEditingId(null)
      setPage(1)
      setReloadFlag((f) => f + 1)
      showToast({ title: 'Success', description: 'Term updated successfully!', variant: 'default' })
    } catch (err: any) {
      showToast({ title: 'Error', description: 'Failed to update term!', variant: 'destructive' })
    } finally {
      setEditLoading(false)
    }
  }

  // Delete term
  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this term?')) return
    try {
      await adminApi.deleteTerm(id)
      setPage(1)
      setReloadFlag((f) => f + 1)
      showToast({ title: 'Success', description: 'Term deleted successfully!', variant: 'default' })
    } catch (err: any) {
      showToast({ title: 'Error', description: 'Failed to delete term!', variant: 'destructive' })
    }
  }

  // Lock term
  const handleLock = async (id: string) => {
    if (!window.confirm('Are you sure you want to lock this term?')) return
    try {
      await adminApi.lockTerm(id)
      setPage(1)
      setReloadFlag((f) => f + 1)
      showToast({ title: 'Success', description: 'Term locked!', variant: 'default' })
    } catch (err: any) {
      showToast({ title: 'Error', description: 'Failed to lock term!', variant: 'destructive' })
    }
  }

  // Show term detail
  const handleShowDetail = async (id: string) => {
    setDetailLoading(true)
    setDetailId(id)
    try {
      const res = await adminApi.getTermDetail(id)
      setDetail(res.data.data)
    } catch (err) {
      setDetail(null)
      showToast({ title: 'Error', description: 'Failed to fetch term detail!', variant: 'destructive' })
    } finally {
      setDetailLoading(false)
    }
  }
  const handleCloseDetail = () => {
    setDetailId(null)
    setDetail(null)
  }

  // Filtering
  const [filterSeason, setFilterSeason] = useState('')
  const [filterYear, setFilterYear] = useState('')
  const filteredTerms = terms.filter((term: any) => {
    return (
      (!filterSeason || term.season.toLowerCase().includes(filterSeason.toLowerCase())) &&
      (!filterYear || term.year.toString() === filterYear)
    )
  })

  function formatDate(dateStr: string) {
    if (!dateStr) return ''
    const d = new Date(dateStr)
    const day = String(d.getDate()).padStart(2, '0')
    const month = String(d.getMonth() + 1).padStart(2, '0')
    const year = String(d.getFullYear()).slice(-2)
    return `${day}/${month}/${year}`
  }

  const { showToast } = useToastContext()

  return (
    <AdminLayout title='Term Management'>
      <div style={{ maxWidth: 900, margin: '0 auto', padding: 24 }}>
        <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 16 }}>Term Management</h1>
        <form
          onSubmit={handleCreateTerm}
          style={{
            marginBottom: 24,
            display: 'flex',
            gap: 12,
            alignItems: 'center',
            flexWrap: 'wrap',
            background: '#f9f9f9',
            padding: 16,
            borderRadius: 8
          }}
        >
          <span style={{ fontWeight: 600, fontSize: 18 }}>Create New Term</span>
          <input
            placeholder='Season'
            value={season}
            onChange={(e) => setSeason(e.target.value)}
            required
            style={{ padding: 6, borderRadius: 4, border: '1px solid #ccc', width: 100 }}
          />
          <input
            placeholder='Year'
            type='number'
            value={year}
            onChange={(e) => setYear(e.target.value)}
            required
            style={{ padding: 6, borderRadius: 4, border: '1px solid #ccc', width: 80 }}
          />
          <input
            placeholder='Start Date'
            type='date'
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            required
            style={{ padding: 6, borderRadius: 4, border: '1px solid #ccc' }}
          />
          <input
            placeholder='End Date'
            type='date'
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            required
            style={{ padding: 6, borderRadius: 4, border: '1px solid #ccc' }}
          />
          <button
            type='submit'
            disabled={creating}
            style={{
              padding: '6px 16px',
              borderRadius: 4,
              background: '#2563eb',
              color: '#fff',
              border: 'none',
              fontWeight: 600
            }}
          >
            {creating ? 'Creating...' : 'Create Term'}
          </button>
          {createError && <span style={{ color: 'red', marginLeft: 8 }}>{createError}</span>}
        </form>
        <div style={{ marginBottom: 16, display: 'flex', gap: 12 }}>
          <input
            placeholder='Filter by season'
            value={filterSeason}
            onChange={(e) => setFilterSeason(e.target.value)}
            style={{ padding: 6, borderRadius: 4, border: '1px solid #ccc', width: 160 }}
          />
          <input
            placeholder='Filter by year'
            value={filterYear}
            onChange={(e) => setFilterYear(e.target.value)}
            style={{ padding: 6, borderRadius: 4, border: '1px solid #ccc', width: 120 }}
          />
        </div>
        {loading && <div>Loading...</div>}
        {error && <div style={{ color: 'red' }}>{error}</div>}
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', background: '#fff' }}>
            <thead>
              <tr style={{ background: '#f1f5f9' }}>
                <th style={{ padding: 8, border: '1px solid #e5e7eb' }}>Season</th>
                <th style={{ padding: 8, border: '1px solid #e5e7eb' }}>Year</th>
                <th style={{ padding: 8, border: '1px solid #e5e7eb' }}>Start Date</th>
                <th style={{ padding: 8, border: '1px solid #e5e7eb' }}>End Date</th>
                <th style={{ padding: 8, border: '1px solid #e5e7eb' }}>Status</th>
                <th style={{ padding: 8, border: '1px solid #e5e7eb' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredTerms.map((term: any) => (
                <tr key={term.id} style={{ borderBottom: '1px solid #e5e7eb' }}>
                  {editingId === term.id ? (
                    <>
                      <td style={{ padding: 8, border: '1px solid #e5e7eb' }}>
                        <input
                          value={editSeason}
                          onChange={(e) => setEditSeason(e.target.value)}
                          style={{ padding: 4, borderRadius: 4, border: '1px solid #ccc', width: 80 }}
                        />
                      </td>
                      <td style={{ padding: 8, border: '1px solid #e5e7eb' }}>
                        <input
                          value={editYear}
                          type='number'
                          onChange={(e) => setEditYear(e.target.value)}
                          style={{ padding: 4, borderRadius: 4, border: '1px solid #ccc', width: 60 }}
                        />
                      </td>
                      <td style={{ padding: 8, border: '1px solid #e5e7eb' }}>
                        <input
                          value={editStartDate}
                          type='date'
                          onChange={(e) => setEditStartDate(e.target.value)}
                          style={{ padding: 4, borderRadius: 4, border: '1px solid #ccc' }}
                        />
                      </td>
                      <td style={{ padding: 8, border: '1px solid #e5e7eb' }}>
                        <input
                          value={editEndDate}
                          type='date'
                          onChange={(e) => setEditEndDate(e.target.value)}
                          style={{ padding: 4, borderRadius: 4, border: '1px solid #ccc' }}
                        />
                      </td>
                      <td style={{ padding: 8, border: '1px solid #e5e7eb' }} colSpan={2}>
                        <button
                          onClick={() => handleEditSave(term.id)}
                          disabled={editLoading}
                          style={{
                            padding: '4px 12px',
                            borderRadius: 4,
                            background: '#22c55e',
                            color: '#fff',
                            border: 'none',
                            fontWeight: 600
                          }}
                        >
                          {editLoading ? 'Saving...' : 'Save'}
                        </button>
                        <button
                          onClick={() => setEditingId(null)}
                          style={{
                            marginLeft: 8,
                            padding: '4px 12px',
                            borderRadius: 4,
                            background: '#f1f5f9',
                            border: '1px solid #ccc'
                          }}
                        >
                          Cancel
                        </button>
                      </td>
                    </>
                  ) : (
                    <>
                      <td style={{ padding: 8, border: '1px solid #e5e7eb' }}>{term.season}</td>
                      <td style={{ padding: 8, border: '1px solid #e5e7eb' }}>{term.year}</td>
                      <td style={{ padding: 8, border: '1px solid #e5e7eb' }}>{formatDate(term.startDate)}</td>
                      <td style={{ padding: 8, border: '1px solid #e5e7eb' }}>{formatDate(term.endDate)}</td>
                      <td style={{ padding: 8, border: '1px solid #e5e7eb' }}>
                        {term.isLocked ? (
                          <span style={{ color: '#f59e42', fontWeight: 600 }}>Locked</span>
                        ) : term.isActive ? (
                          <span style={{ color: '#22c55e', fontWeight: 600 }}>Active</span>
                        ) : (
                          <span style={{ color: '#ef4444', fontWeight: 600 }}>Inactive</span>
                        )}
                      </td>
                      <td style={{ padding: 8, border: '1px solid #e5e7eb' }}>
                        <button
                          onClick={() => handleEditClick(term)}
                          style={{
                            padding: '4px 10px',
                            borderRadius: 4,
                            background: '#fbbf24',
                            color: '#fff',
                            border: 'none',
                            fontWeight: 600,
                            marginRight: 4
                          }}
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(term.id)}
                          style={{
                            padding: '4px 10px',
                            borderRadius: 4,
                            background: '#ef4444',
                            color: '#fff',
                            border: 'none',
                            fontWeight: 600,
                            marginRight: 4
                          }}
                        >
                          Delete
                        </button>
                        <button
                          onClick={() => handleLock(term.id)}
                          style={{
                            padding: '4px 10px',
                            borderRadius: 4,
                            background: '#6366f1',
                            color: '#fff',
                            border: 'none',
                            fontWeight: 600,
                            marginRight: 4
                          }}
                        >
                          Lock
                        </button>
                        <button
                          onClick={() => handleShowDetail(term.id)}
                          style={{
                            padding: '4px 10px',
                            borderRadius: 4,
                            background: '#2563eb',
                            color: '#fff',
                            border: 'none',
                            fontWeight: 600
                          }}
                        >
                          Detail
                        </button>
                      </td>
                    </>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div style={{ marginTop: 16, display: 'flex', alignItems: 'center', gap: 12 }}>
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            style={{ padding: '6px 16px', borderRadius: 4, background: '#f1f5f9', border: '1px solid #ccc' }}
          >
            Prev
          </button>
          <span style={{ fontWeight: 600 }}>Page {page}</span>
          <button
            onClick={() => setPage((p) => p + 1)}
            style={{ padding: '6px 16px', borderRadius: 4, background: '#f1f5f9', border: '1px solid #ccc' }}
          >
            Next
          </button>
        </div>
        {/* Detail Modal */}
        {detailId && (
          <div
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              width: '100vw',
              height: '100vh',
              background: 'rgba(0,0,0,0.2)',
              zIndex: 1000,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <div
              style={{
                background: '#fff',
                padding: 24,
                borderRadius: 8,
                minWidth: 320,
                maxWidth: 600,
                maxHeight: '80vh',
                overflowY: 'auto'
              }}
            >
              <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 12 }}>Term Detail</h2>
              {detailLoading ? (
                <div>Loading...</div>
              ) : detail ? (
                <pre style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-all', fontSize: 15 }}>
                  {JSON.stringify(detail, null, 2)}
                </pre>
              ) : (
                <div>No data</div>
              )}
              <button
                onClick={handleCloseDetail}
                style={{
                  marginTop: 16,
                  padding: '6px 16px',
                  borderRadius: 4,
                  background: '#2563eb',
                  color: '#fff',
                  border: 'none',
                  fontWeight: 600
                }}
              >
                Close
              </button>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  )
}
