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

  // State for delete dialog
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [deleteSeason, setDeleteSeason] = useState<string>('')
  const [deleteYear, setDeleteYear] = useState<string>('')
  const [deleteLoading, setDeleteLoading] = useState(false)

  // Validation states
  const [validationErrors, setValidationErrors] = useState<{
    season?: string
    year?: string
    startDate?: string
    endDate?: string
  }>({})

  // Date validation functions
  const validateYear = (yearValue: string): string | null => {
    const yearNum = parseInt(yearValue)
    const currentYear = new Date().getFullYear()
    
    if (!yearValue || isNaN(yearNum)) {
      return 'Year is required and must be a number'
    }
    
    // Không cho phép nhập năm từ quá khứ
    if (yearNum < currentYear) {
      return `Year cannot be in the past. Please enter ${currentYear} or a future year`
    }
    
    // Không giới hạn năm tương lai - cho phép nhập bất kỳ năm nào trong tương lai
    
    return null
  }

  const validateDate = (dateValue: string, fieldName: string): string | null => {
    if (!dateValue) {
      return `${fieldName} is required`
    }
    
    const date = new Date(dateValue)
    if (isNaN(date.getTime())) {
      return `${fieldName} must be a valid date`
    }
    
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    if (date < today && fieldName === 'Start Date') {
      return 'Start date cannot be in the past'
    }
    
    return null
  }

  const validateDateRange = (startDateValue: string, endDateValue: string): string | null => {
    if (!startDateValue || !endDateValue) {
      return null // Individual validation will handle this
    }
    
    const startDate = new Date(startDateValue)
    const endDate = new Date(endDateValue)
    
    if (startDate >= endDate) {
      return 'End date must be after start date'
    }
    
    // Check if term duration is reasonable (between 1 day and 2 years)
    const diffTime = Math.abs(endDate.getTime() - startDate.getTime())
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    
    if (diffDays < 1) {
      return 'Term must be at least 1 day long'
    }
    
    if (diffDays > 730) { // 2 years
      return 'Term cannot be longer than 2 years'
    }
    
    return null
  }

  const validateSeason = (seasonValue: string): string | null => {
    if (!seasonValue.trim()) {
      return 'Season is required'
    }
    
    if (seasonValue.length < 2 || seasonValue.length > 20) {
      return 'Season must be between 2 and 20 characters'
    }
    
    return null
  }

  const checkTermOverlap = (startDateValue: string, endDateValue: string, excludeId?: string): string | null => {
    if (!startDateValue || !endDateValue) {
      return null
    }
    
    const newStart = new Date(startDateValue)
    const newEnd = new Date(endDateValue)
    
    for (const term of terms) {
      if (excludeId && term.id === excludeId) continue
      
      const existingStart = new Date(term.startDate)
      const existingEnd = new Date(term.endDate)
      
      // Check for overlap: new term overlaps with existing term
      if (
        (newStart >= existingStart && newStart < existingEnd) ||
        (newEnd > existingStart && newEnd <= existingEnd) ||
        (newStart <= existingStart && newEnd >= existingEnd)
      ) {
        return `Term overlaps with existing term: ${term.season} ${term.year} (${formatDate(term.startDate)} - ${formatDate(term.endDate)})`
      }
    }
    
    return null
  }

  const validateCreateForm = (): boolean => {
    const errors: {
      season?: string
      year?: string
      startDate?: string
      endDate?: string
    } = {}
    
    // Validate individual fields
    const seasonError = validateSeason(season)
    const yearError = validateYear(year)
    const startDateError = validateDate(startDate, 'Start Date')
    const endDateError = validateDate(endDate, 'End Date')
    
    if (seasonError) errors.season = seasonError
    if (yearError) errors.year = yearError
    if (startDateError) errors.startDate = startDateError
    if (endDateError) errors.endDate = endDateError
    
    // Validate date range
    const dateRangeError = validateDateRange(startDate, endDate)
    if (dateRangeError) {
      errors.endDate = dateRangeError
    }
    
    // Validate business rules
    const businessRuleError = validateBusinessRules(startDate, endDate)
    if (businessRuleError) {
      errors.endDate = businessRuleError
    }
    
    // Check for term overlap
    const overlapError = checkTermOverlap(startDate, endDate)
    if (overlapError) {
      errors.endDate = overlapError
    }
    
    setValidationErrors(errors)
    
    // Return true if no errors
    return !Object.values(errors).some(error => error !== undefined)
  }

  const validateEditForm = (): boolean => {
    const errors: {
      season?: string
      year?: string
      startDate?: string
      endDate?: string
    } = {}
    
    // Validate individual fields
    const seasonError = validateSeason(editSeason)
    const yearError = validateYear(editYear)
    const startDateError = validateDate(editStartDate, 'Start Date')
    const endDateError = validateDate(editEndDate, 'End Date')
    
    if (seasonError) errors.season = seasonError
    if (yearError) errors.year = yearError
    if (startDateError) errors.startDate = startDateError
    if (endDateError) errors.endDate = endDateError
    
    // Validate date range
    const dateRangeError = validateDateRange(editStartDate, editEndDate)
    if (dateRangeError) {
      errors.endDate = dateRangeError
    }
    
    // Validate business rules
    const businessRuleError = validateBusinessRules(editStartDate, editEndDate)
    if (businessRuleError) {
      errors.endDate = businessRuleError
    }
    
    // Check for term overlap (exclude current term being edited)
    const overlapError = checkTermOverlap(editStartDate, editEndDate, editingId || undefined)
    if (overlapError) {
      errors.endDate = overlapError
    }
    
    setValidationErrors(errors)
    
    // Return true if no errors
    return !Object.values(errors).some(error => error !== undefined)
  }

  // Clear validation errors when form changes
  const clearValidationErrors = () => {
    setValidationErrors({})
    setCreateError(null)
  }

  // Real-time validation for better UX
  const validateFieldInRealTime = (field: keyof typeof validationErrors, value: string) => {
    let error: string | null = null
    
    switch (field) {
      case 'season':
        error = validateSeason(value)
        break
      case 'year':
        error = validateYear(value)
        break
      case 'startDate':
        error = validateDate(value, 'Start Date')
        if (!error && endDate) {
          error = validateDateRange(value, endDate)
        }
        break
      case 'endDate':
        error = validateDate(value, 'End Date')
        if (!error && startDate) {
          error = validateDateRange(startDate, value)
        }
        if (!error && startDate && endDate) {
          error = checkTermOverlap(startDate, value)
        }
        break
    }
    
    setValidationErrors(prev => ({
      ...prev,
      [field]: error || undefined
    }))
  }

  // Enhanced date validation with business rules
  const validateBusinessRules = (startDateValue: string, endDateValue: string): string | null => {
    if (!startDateValue || !endDateValue) return null
    
    const startDate = new Date(startDateValue)
    const endDate = new Date(endDateValue)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    // Bỏ giới hạn 5 năm trong tương lai - cho phép start date xa hơn
    
    // Check for reasonable term duration (academic terms are usually 3-6 months)
    const diffTime = Math.abs(endDate.getTime() - startDate.getTime())
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    
    if (diffDays < 30) { // Less than 1 month
      return 'Term should be at least 1 month long for academic purposes'
    }
    
    if (diffDays > 365) { // More than 1 year
      return 'Term should not exceed 1 year for academic purposes'
    }
    
    return null
  }

  // Create term
  const handleCreateTerm = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateCreateForm()) {
      showToast({ title: 'Validation Error', description: 'Please fix the errors before submitting', variant: 'destructive' })
      return
    }
    
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
      clearValidationErrors()
      showToast({ title: 'Success', description: 'Term created successfully!', variant: 'success' })
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
    clearValidationErrors()
  }
  
  const handleEditSave = async (id: string) => {
    if (!validateEditForm()) {
      showToast({ title: 'Validation Error', description: 'Please fix the errors before submitting', variant: 'destructive' })
      return
    }
    
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
      clearValidationErrors()
      showToast({ title: 'Success', description: 'Term updated successfully!', variant: 'success' })
    } catch (err: any) {
      showToast({ title: 'Error', description: 'Failed to update term!', variant: 'destructive' })
    } finally {
      setEditLoading(false)
    }
  }

  // Delete term - now handled by dialog
  // const handleDelete = async (id: string) => {
  //   setDeleteId(id)
  //   setDeleteSeason('')
  //   setDeleteYear('')
  //   setDeleteLoading(false)
  //   // This function is now handled by the dialog
  // }

  // Show delete dialog with term info
  const handleDeleteClick = (term: any) => {
    setDeleteId(term.id)
    setDeleteSeason(term.season)
    setDeleteYear(term.year.toString())
    setDeleteLoading(false)
  }

  // Execute delete
  const handleDeleteConfirm = async () => {
    if (!deleteId) return
    
    setDeleteLoading(true)
    try {
      await adminApi.deleteTerm(deleteId)
      setDeleteId(null)
      setPage(1)
      setReloadFlag((f) => f + 1)
      showToast({ title: 'Success', description: 'Term deleted successfully!', variant: 'success' })
    } catch (err: any) {
      showToast({ title: 'Error', description: 'Failed to delete term!', variant: 'destructive' })
    } finally {
      setDeleteLoading(false)
    }
  }

  // Close delete dialog
  const handleDeleteCancel = () => {
    setDeleteId(null)
    setDeleteSeason('')
    setDeleteYear('')
  }

  // Lock term
  const handleLock = async (id: string) => {
    if (!window.confirm('Are you sure you want to lock this term?')) return
    try {
      await adminApi.lockTerm(id)
      setPage(1)
      setReloadFlag((f) => f + 1)
              showToast({ title: 'Success', description: 'Term locked!', variant: 'success' })
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

  // Get current date in YYYY-MM-DD format for min attribute
  const getCurrentDateString = (): string => {
    const today = new Date()
    const year = today.getFullYear()
    const month = String(today.getMonth() + 1).padStart(2, '0')
    const day = String(today.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
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
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <input
              placeholder='Season'
              value={season}
              onChange={(e) => {
                setSeason(e.target.value)
                validateFieldInRealTime('season', e.target.value)
              }}
              onBlur={(e) => validateFieldInRealTime('season', e.target.value)}
              required
              style={{ 
                padding: 6, 
                borderRadius: 4, 
                border: validationErrors.season ? '1px solid #ef4444' : '1px solid #ccc', 
                width: 100 
              }}
            />
            {validationErrors.season && (
              <span style={{ color: '#ef4444', fontSize: '12px' }}>{validationErrors.season}</span>
            )}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <input
              placeholder='Year'
              type='number'
              value={year}
              onChange={(e) => {
                setYear(e.target.value)
                validateFieldInRealTime('year', e.target.value)
              }}
              onBlur={(e) => validateFieldInRealTime('year', e.target.value)}
              required
              style={{ 
                padding: 6, 
                borderRadius: 4, 
                border: validationErrors.year ? '1px solid #ef4444' : '1px solid #ccc', 
                width: 80 
              }}
            />
            {validationErrors.year && (
              <span style={{ color: '#ef4444', fontSize: '12px' }}>{validationErrors.year}</span>
            )}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <input
              placeholder='Start Date'
              type='date'
              value={startDate}
              onChange={(e) => {
                setStartDate(e.target.value)
                validateFieldInRealTime('startDate', e.target.value)
              }}
              onBlur={(e) => validateFieldInRealTime('startDate', e.target.value)}
              min={getCurrentDateString()}
              required
              style={{ 
                padding: 6, 
                borderRadius: 4, 
                border: validationErrors.startDate ? '1px solid #ef4444' : '1px solid #ccc'
              }}
            />
            {validationErrors.startDate && (
              <span style={{ color: '#ef4444', fontSize: '12px' }}>{validationErrors.startDate}</span>
            )}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <input
              placeholder='End Date'
              type='date'
              value={endDate}
              onChange={(e) => {
                setEndDate(e.target.value)
                validateFieldInRealTime('endDate', e.target.value)
              }}
              onBlur={(e) => validateFieldInRealTime('endDate', e.target.value)}
              min={startDate}
              required
              style={{ 
                padding: 6, 
                borderRadius: 4, 
                border: validationErrors.endDate ? '1px solid #ef4444' : '1px solid #ccc'
              }}
            />
            {validationErrors.endDate && (
              <span style={{ color: '#ef4444', fontSize: '12px' }}>{validationErrors.endDate}</span>
            )}
          </div>
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
        
        {/* Validation Summary */}
        {Object.values(validationErrors).some(error => error) && (
          <div style={{
            marginBottom: 16,
            padding: 12,
            background: '#fef2f2',
            border: '1px solid #fecaca',
            borderRadius: 6,
            color: '#dc2626'
          }}>
            <div style={{ fontWeight: 600, marginBottom: 8 }}>Please fix the following errors:</div>
            <ul style={{ margin: 0, paddingLeft: 20 }}>
              {validationErrors.season && <li>{validationErrors.season}</li>}
              {validationErrors.year && <li>{validationErrors.year}</li>}
              {validationErrors.startDate && <li>{validationErrors.startDate}</li>}
              {validationErrors.endDate && <li>{validationErrors.endDate}</li>}
            </ul>
          </div>
        )}
        
      
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
                          onChange={(e) => {
                            setEditSeason(e.target.value)
                            validateFieldInRealTime('season', e.target.value)
                          }}
                          onBlur={(e) => validateFieldInRealTime('season', e.target.value)}
                          style={{ padding: 4, borderRadius: 4, border: validationErrors.season ? '1px solid #ef4444' : '1px solid #ccc', width: 80 }}
                        />
                        {validationErrors.season && (
                          <span style={{ color: '#ef4444', fontSize: '12px' }}>{validationErrors.season}</span>
                        )}
                      </td>
                      <td style={{ padding: 8, border: '1px solid #e5e7eb' }}>
                        <input
                          value={editYear}
                          type='number'
                          onChange={(e) => {
                            setEditYear(e.target.value)
                            validateFieldInRealTime('year', e.target.value)
                          }}
                          onBlur={(e) => validateFieldInRealTime('year', e.target.value)}
                          style={{ padding: 4, borderRadius: 4, border: validationErrors.year ? '1px solid #ef4444' : '1px solid #ccc', width: 60 }}
                        />
                        {validationErrors.year && (
                          <span style={{ color: '#ef4444', fontSize: '12px' }}>{validationErrors.year}</span>
                        )}
                      </td>
                      <td style={{ padding: 8, border: '1px solid #e5e7eb' }}>
                        <input
                          value={editStartDate}
                          type='date'
                          onChange={(e) => {
                            setEditStartDate(e.target.value)
                            validateFieldInRealTime('startDate', e.target.value)
                          }}
                          onBlur={(e) => validateFieldInRealTime('startDate', e.target.value)}
                          min={getCurrentDateString()}
                          style={{ padding: 4, borderRadius: 4, border: validationErrors.startDate ? '1px solid #ef4444' : '1px solid #ccc' }}
                        />
                        {validationErrors.startDate && (
                          <span style={{ color: '#ef4444', fontSize: '12px' }}>{validationErrors.startDate}</span>
                        )}
                      </td>
                      <td style={{ padding: 8, border: '1px solid #e5e7eb' }}>
                        <input
                          value={editEndDate}
                          type='date'
                          onChange={(e) => {
                            setEditEndDate(e.target.value)
                            validateFieldInRealTime('endDate', e.target.value)
                          }}
                          onBlur={(e) => validateFieldInRealTime('endDate', e.target.value)}
                          min={editStartDate}
                          style={{ padding: 4, borderRadius: 4, border: validationErrors.endDate ? '1px solid #ef4444' : '1px solid #ccc' }}
                        />
                        {validationErrors.endDate && (
                          <span style={{ color: '#ef4444', fontSize: '12px' }}>{validationErrors.endDate}</span>
                        )}
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
                          onClick={() => handleDeleteClick(term)}
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
        {/* Delete Confirmation Dialog */}
        {deleteId && (
          <div
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              width: '100vw',
              height: '100vh',
              background: 'rgba(0,0,0,0.2)',
              zIndex: 1001,
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
                maxWidth: 400,
                maxHeight: '80vh',
                overflowY: 'auto'
              }}
            >
              <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 16 }}>Confirm Deletion</h2>
              <p style={{ marginBottom: 16 }}>
                Are you sure you want to delete the term: {deleteSeason} {deleteYear}?
                This action cannot be undone.
              </p>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
                <button
                  onClick={handleDeleteCancel}
                  style={{
                    padding: '6px 16px',
                    borderRadius: 4,
                    background: '#f1f5f9',
                    border: '1px solid #ccc',
                    color: '#333',
                    fontWeight: 600
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteConfirm}
                  disabled={deleteLoading}
                  style={{
                    padding: '6px 16px',
                    borderRadius: 4,
                    background: '#ef4444',
                    color: '#fff',
                    border: 'none',
                    fontWeight: 600
                  }}
                >
                  {deleteLoading ? 'Deleting...' : 'Delete'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  )
}
