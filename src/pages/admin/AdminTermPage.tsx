import { adminApi } from '@/api/admin'
import AdminLayout from '@/components/admin/AdminLayout'
import { useToastContext } from '@/components/ui/ToastContext'
import { AlertCircle, Calendar, CheckCircle, Clock, Edit2, Filter, Lock, Plus, Save, Search, Trash2, X } from 'lucide-react'
import { useEffect, useState } from 'react'

interface Term {
  id: string
  season: string
  year: number
  startDate: string
  endDate: string
  isActive: boolean
  isLocked: boolean
}

interface ValidationErrors {
  season?: string
  year?: string
  startDate?: string
  endDate?: string
}

export default function TermManagement() {
  const [terms, setTerms] = useState<Term[]>([])
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
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

  // State for delete dialog
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [deleteSeason, setDeleteSeason] = useState('')
  const [deleteYear, setDeleteYear] = useState('')
  const [deleteLoading, setDeleteLoading] = useState(false)

  // Filtering
  const [filterSeason, setFilterSeason] = useState('')
  const [filterYear, setFilterYear] = useState('')
  const [showFilters, setShowFilters] = useState(false)

  // Validation states
  const [validationErrors, setValidationErrors] = useState<ValidationErrors>({})

  const { showToast } = useToastContext()

  // Load terms data on component mount
  useEffect(() => {
    loadTerms()
  }, [page])

  const loadTerms = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await adminApi.getTermList(page)
      setTerms(response.data.data || [])
    } catch (err: any) {
      setError(err.message || 'Failed to load terms')
      showToast({ 
        title: 'Error', 
        description: 'Failed to load terms', 
        variant: 'destructive' 
      })
    } finally {
      setLoading(false)
    }
  }

  const validateYear = (yearValue: string): string | null => {
    const yearNum = parseInt(yearValue)
    const currentYear = new Date().getFullYear()

    if (!yearValue || isNaN(yearNum)) {
      return 'Year is required and must be a number'
    }

    if (yearNum < currentYear) {
      return `Year cannot be in the past. Please enter ${currentYear} or a future year`
    }

    return null
  }

  const validateDate = (dateValue: string, fieldName: string): string | null => {
    if (!dateValue) {
      return `${fieldName} is required`
    }

    const datePattern = /^(0[1-9]|[12][0-9]|3[01])\/(0[1-9]|1[0-2])\/\d{2}$/
    if (!datePattern.test(dateValue)) {
      return `${fieldName} must be in dd/mm/yy format (e.g., 21/08/25)`
    }

    const [day, month, yearStr] = dateValue.split('/')
    const year = 2000 + parseInt(yearStr)
    const date = new Date(year, parseInt(month) - 1, parseInt(day))
    
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

  const validateSeason = (seasonValue: string): string | null => {
    if (!seasonValue.trim()) {
      return 'Season is required'
    }

    if (seasonValue.length < 2 || seasonValue.length > 20) {
      return 'Season must be between 2 and 20 characters'
    }

    return null
  }

  const validateForm = (): boolean => {
    const errors: ValidationErrors = {}

    const seasonError = validateSeason(season)
    const yearError = validateYear(year)
    const startDateError = validateDate(startDate, 'Start Date')
    const endDateError = validateDate(endDate, 'End Date')

    if (seasonError) errors.season = seasonError
    if (yearError) errors.year = yearError
    if (startDateError) errors.startDate = startDateError
    if (endDateError) errors.endDate = endDateError

    setValidationErrors(errors)
    return Object.keys(errors).length === 0
  }

  const fillTermTemplate = (termType: 'spring' | 'summer' | 'fall'): void => {
    const currentYear = new Date().getFullYear()
    let startMonth: number, endMonth: number, seasonName: string

    switch (termType) {
      case 'spring':
        startMonth = 0
        endMonth = 4
        seasonName = 'Spring'
        break
      case 'summer':
        startMonth = 4
        endMonth = 8
        seasonName = 'Summer'
        break
      case 'fall':
        startMonth = 8
        endMonth = 11
        seasonName = 'Fall'
        break
    }

    const startDate = new Date(Date.UTC(currentYear, startMonth, 1))
    const endDate = new Date(Date.UTC(currentYear, endMonth + 1, 0))

    const formatDateForInput = (date: Date): string => {
      const day = String(date.getUTCDate()).padStart(2, '0')
      const month = String(date.getUTCMonth() + 1).padStart(2, '0')
      const year = String(date.getUTCFullYear()).slice(-2)
      return `${day}/${month}/${year}`
    }

    setSeason(seasonName)
    setYear(currentYear.toString())
    setStartDate(formatDateForInput(startDate))
    setEndDate(formatDateForInput(endDate))
    setValidationErrors({})
  }

  const handleCreateTerm = async (): Promise<void> => {
    if (!validateForm()) {
      return
    }

    setCreating(true)
    setCreateError(null)
    
    try {
      // Convert dd/mm/yy to YYYY-MM-DD for API
      const convertToApiFormat = (dateStr: string): string => {
        const [day, month, yearStr] = dateStr.split('/')
        const year = 2000 + parseInt(yearStr) // Assume 20xx for years
        return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`
      }

      await adminApi.createTerm({
        season,
        year: Number(year),
        startDate: convertToApiFormat(startDate),
        endDate: convertToApiFormat(endDate)
      })

      showToast({ 
        title: 'Success', 
        description: 'Term created successfully!', 
        variant: 'success' 
      })

      // Reload terms and reset form
      await loadTerms()
      setSeason('')
      setYear('')
      setStartDate('')
      setEndDate('')
      setValidationErrors({})
    } catch (err: any) {
      setCreateError(err.message || 'Failed to create term')
      showToast({ 
        title: 'Error', 
        description: 'Failed to create term', 
        variant: 'destructive' 
      })
    } finally {
      setCreating(false)
    }
  }

  const handleEditClick = (term: Term): void => {
    setEditingId(term.id)
    setEditSeason(term.season)
    setEditYear(term.year.toString())
    
    const formatDateForEdit = (dateStr: string): string => {
      const date = new Date(dateStr)
      const day = String(date.getDate()).padStart(2, '0')
      const month = String(date.getMonth() + 1).padStart(2, '0')
      const year = String(date.getFullYear()).slice(-2)
      return `${day}/${month}/${year}`
    }
    
    setEditStartDate(formatDateForEdit(term.startDate))
    setEditEndDate(formatDateForEdit(term.endDate))
    setValidationErrors({})
  }

  const handleEditSave = async (id: string): Promise<void> => {
    setEditLoading(true)
    
    try {
      // Convert dd/mm/yy to YYYY-MM-DD for API
      const convertToApiFormat = (dateStr: string): string => {
        const [day, month, yearStr] = dateStr.split('/')
        const year = 2000 + parseInt(yearStr) // Assume 20xx for years
        return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`
      }

      await adminApi.updateTerm(id, {
        season: editSeason,
        year: Number(editYear),
        startDate: convertToApiFormat(editStartDate),
        endDate: convertToApiFormat(editEndDate)
      })

      showToast({ 
        title: 'Success', 
        description: 'Term updated successfully!', 
        variant: 'success' 
      })

      // Reload terms and reset edit mode
      await loadTerms()
      setEditingId(null)
    } catch (err: any) {
      showToast({ 
        title: 'Error', 
        description: 'Failed to update term', 
        variant: 'destructive' 
      })
    } finally {
      setEditLoading(false)
    }
  }

  const handleDeleteClick = (term: Term): void => {
    setDeleteId(term.id)
    setDeleteSeason(term.season)
    setDeleteYear(term.year.toString())
    setDeleteLoading(false)
  }

  const handleDeleteConfirm = async (): Promise<void> => {
    if (!deleteId) return
    
    setDeleteLoading(true)
    
    try {
      await adminApi.deleteTerm(deleteId)
      
      showToast({ 
        title: 'Success', 
        description: 'Term deleted successfully!', 
        variant: 'success' 
      })

      // Reload terms and close modal
      await loadTerms()
      setDeleteId(null)
    } catch (err: any) {
      showToast({ 
        title: 'Error', 
        description: 'Failed to delete term', 
        variant: 'destructive' 
      })
    } finally {
      setDeleteLoading(false)
    }
  }

  const formatDateForDisplay = (dateStr: string): string => {
    if (!dateStr) return ''
    const d = new Date(dateStr)
    const day = String(d.getDate()).padStart(2, '0')
    const month = String(d.getMonth() + 1).padStart(2, '0')
    const year = String(d.getFullYear()).slice(-2)
    return `${day}/${month}/${year}`
  }

  const filteredTerms = terms.filter((term: Term) => {
    return (
      (!filterSeason || term.season.toLowerCase().includes(filterSeason.toLowerCase())) &&
      (!filterYear || term.year.toString() === filterYear)
    )
  })

  const getStatusColor = (term: Term): string => {
    if (term.isLocked) return 'text-amber-600 bg-amber-50'
    if (term.isActive) return 'text-emerald-600 bg-emerald-50'
    return 'text-slate-600 bg-slate-50'
  }

  const getStatusIcon = (term: Term) => {
    if (term.isLocked) return <Lock className="w-4 h-4" />
    if (term.isActive) return <CheckCircle className="w-4 h-4" />
    return <Clock className="w-4 h-4" />
  }

  return (
    <AdminLayout title="Semester Management">
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
        <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-blue-500 rounded-lg">
              <Calendar className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-slate-800">Semester Management</h1>
          </div>
          <p className="text-slate-600">Manage academic Semesters and schedules</p>
        </div>

        {/* Quick Templates */}
        <div className="mb-8 p-6 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-200">
          <h3 className="text-lg font-semibold text-blue-900 mb-4 flex items-center gap-2">
            <Plus className="w-5 h-5" />
            Quick Semester Templates
          </h3>
          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => fillTermTemplate('spring')}
              className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg font-medium transition-colors shadow-sm hover:shadow-md"
            >
              🌸 Spring: January → May
            </button>
            <button
              onClick={() => fillTermTemplate('summer')}
              className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-lg font-medium transition-colors shadow-sm hover:shadow-md"
            >
              ☀️ Summer: May → September
            </button>
            <button
              onClick={() => fillTermTemplate('fall')}
              className="px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-lg font-medium transition-colors shadow-sm hover:shadow-md"
            >
              🍂 Fall: September → December
            </button>
          </div>
        </div>

        {/* Create Form */}
        <div className="mb-8 bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="bg-gradient-to-r from-blue-500 to-indigo-500 p-4">
            <h2 className="text-xl font-semibold text-white flex items-center gap-2">
              <Plus className="w-5 h-5" />
              Create New Semester
            </h2>
          </div>
          
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="space-y-2">
                <label className="block text-sm font-medium text-slate-700">Semester</label>
                <input
                  type="text"
                  placeholder="e.g., Spring"
                  value={season}
                  onChange={(e) => setSeason(e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
                    validationErrors.season ? 'border-red-300 bg-red-50' : 'border-slate-300'
                  }`}
                />
                {validationErrors.season && (
                  <p className="text-sm text-red-600 flex items-center gap-1">
                    <AlertCircle className="w-4 h-4" />
                    {validationErrors.season}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-slate-700">Year</label>
                <input
                  type="number"
                  placeholder="2025"
                  value={year}
                  onChange={(e) => {
                    const newYear = e.target.value
                    setYear(newYear)
                    // Tự động cập nhật ngày tháng khi năm thay đổi
                    if (newYear && startDate && endDate) {
                      const updateDateWithNewYear = (dateStr: string, newYear: string) => {
                        const [day, month] = dateStr.split('/')
                        return `${day}/${month}/${newYear.slice(-2)}`
                      }
                      setStartDate(updateDateWithNewYear(startDate, newYear))
                      setEndDate(updateDateWithNewYear(endDate, newYear))
                    }
                  }}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
                    validationErrors.year ? 'border-red-300 bg-red-50' : 'border-slate-300'
                  }`}
                />
                {validationErrors.year && (
                  <p className="text-sm text-red-600 flex items-center gap-1">
                    <AlertCircle className="w-4 h-4" />
                    {validationErrors.year}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-slate-700">Start Date</label>
                <input
                  type="text"
                  placeholder="dd/mm/yy"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
                    validationErrors.startDate ? 'border-red-300 bg-red-50' : 'border-slate-300'
                  }`}
                />
                {validationErrors.startDate && (
                  <p className="text-sm text-red-600 flex items-center gap-1">
                    <AlertCircle className="w-4 h-4" />
                    {validationErrors.startDate}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-slate-700">End Date</label>
                <input
                  type="text"
                  placeholder="dd/mm/yy"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
                    validationErrors.endDate ? 'border-red-300 bg-red-50' : 'border-slate-300'
                  }`}
                />
                {validationErrors.endDate && (
                  <p className="text-sm text-red-600 flex items-center gap-1">
                    <AlertCircle className="w-4 h-4" />
                    {validationErrors.endDate}
                  </p>
                )}
              </div>
            </div>

            <div className="mt-6">
              <button
                onClick={handleCreateTerm}
                disabled={creating}
                className="px-6 py-2 bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300 text-white rounded-lg font-medium transition-colors shadow-sm hover:shadow-md flex items-center gap-2"
              >
                {creating ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Creating...
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4" />
                    Create Semester
                  </>
                )}
              </button>
            </div>

            {createError && (
              <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-600 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4" />
                  {createError}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Filters */}
        <div className="mb-6 bg-white rounded-lg shadow-sm border border-slate-200 p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-slate-800 flex items-center gap-2">
              <Search className="w-5 h-5" />
              Search & Filter
            </h3>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="px-3 py-1 text-sm bg-slate-100 hover:bg-slate-200 rounded-md transition-colors flex items-center gap-1"
            >
              <Filter className="w-4 h-4" />
              {showFilters ? 'Hide' : 'Show'} Filters
            </button>
          </div>
          
          {showFilters && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Filter by Semester</label>
                <input
                  type="text"
                  placeholder="e.g., Spring"
                  value={filterSeason}
                  onChange={(e) => setFilterSeason(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Filter by Year</label>
                <input
                  type="text"
                  placeholder="e.g., 2025"
                  value={filterYear}
                  onChange={(e) => setFilterYear(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
          )}
        </div>

        {/* Terms Table */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            {loading ? (
              <div className="p-8 text-center">
                <div className="inline-flex items-center gap-2">
                  <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                  <span className="text-slate-600">Loading terms...</span>
                </div>
              </div>
            ) : error ? (
              <div className="p-8 text-center">
                <div className="text-red-600 flex items-center justify-center gap-2">
                  <AlertCircle className="w-5 h-5" />
                  <span>{error}</span>
                </div>
                <button
                  onClick={loadTerms}
                  className="mt-4 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium transition-colors"
                >
                  Retry
                </button>
              </div>
            ) : filteredTerms.length === 0 ? (
              <div className="p-8 text-center text-slate-500">
                No terms found. Create your first term above!
              </div>
            ) : (
              <table className="w-full">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">Semester</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">Year</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">Start Date</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">End Date</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">Status</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                                    {filteredTerms.map((term) => (
                    <tr key={term.id} className="hover:bg-slate-50 transition-colors">
                      {editingId === term.id ? (
                        <>
                          <td className="px-6 py-4">
                            <input
                              value={editSeason}
                              onChange={(e) => setEditSeason(e.target.value)}
                              className="px-2 py-1 border border-slate-300 rounded text-sm focus:ring-2 focus:ring-blue-500"
                            />
                          </td>
                          <td className="px-6 py-4">
                            <input
                              type="number"
                              value={editYear}
                              onChange={(e) => setEditYear(e.target.value)}
                              className="px-2 py-1 border border-slate-300 rounded text-sm focus:ring-2 focus:ring-blue-500 w-20"
                            />
                          </td>
                          <td className="px-6 py-4">
                            <input
                              value={editStartDate}
                              onChange={(e) => setEditStartDate(e.target.value)}
                              placeholder="dd/mm/yy"
                              className="px-2 py-1 border border-slate-300 rounded text-sm focus:ring-2 focus:ring-blue-500"
                            />
                          </td>
                          <td className="px-6 py-4">
                            <input
                              value={editEndDate}
                              onChange={(e) => setEditEndDate(e.target.value)}
                              placeholder="dd/mm/yy"
                              className="px-2 py-1 border border-slate-300 rounded text-sm focus:ring-2 focus:ring-blue-500"
                            />
                          </td>
                          <td className="px-6 py-4" colSpan={2}>
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => handleEditSave(term.id)}
                                disabled={editLoading}
                                className="px-3 py-1 bg-emerald-500 hover:bg-emerald-600 disabled:bg-emerald-300 text-white rounded text-sm font-medium transition-colors flex items-center gap-1"
                              >
                                {editLoading ? (
                                  <div className="w-3 h-3 border border-white border-t-transparent rounded-full animate-spin"></div>
                                ) : (
                                  <Save className="w-3 h-3" />
                                )}
                                Save
                              </button>
                              <button
                                onClick={() => setEditingId(null)}
                                className="px-3 py-1 bg-slate-500 hover:bg-slate-600 text-white rounded text-sm font-medium transition-colors flex items-center gap-1"
                              >
                                <X className="w-3 h-3" />
                                Cancel
                              </button>
                            </div>
                          </td>
                        </>
                      ) : (
                        <>
                          <td className="px-6 py-4 font-medium text-slate-900">{term.season}</td>
                          <td className="px-6 py-4 text-slate-700">{term.year}</td>
                          <td className="px-6 py-4 text-slate-700">{formatDateForDisplay(term.startDate)}</td>
                          <td className="px-6 py-4 text-slate-700">{formatDateForDisplay(term.endDate)}</td>
                          <td className="px-6 py-4">
                            <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(term)}`}>
                              {getStatusIcon(term)}
                              {term.isLocked ? 'Locked' : term.isActive ? 'Active' : 'Inactive'}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => handleEditClick(term)}
                                className="p-1 text-amber-600 hover:bg-amber-50 rounded transition-colors"
                                title="Edit term"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDeleteClick(term)}
                                className="p-1 text-red-600 hover:bg-red-50 rounded transition-colors"
                                title="Delete term"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Pagination */}
        <div className="mt-6 flex items-center justify-center gap-4">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-4 py-2 bg-white border border-slate-300 disabled:border-slate-200 disabled:text-slate-400 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors font-medium"
          >
            Previous
          </button>
          <span className="px-4 py-2 bg-blue-50 text-blue-700 rounded-lg font-medium">
            Page {page}
          </span>
          <button
            onClick={() => setPage((p) => p + 1)}
            className="px-4 py-2 bg-white border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors font-medium"
          >
            Next
          </button>
        </div>

        {/* Delete Confirmation Modal */}
        {deleteId && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-red-100 rounded-lg">
                  <Trash2 className="w-6 h-6 text-red-600" />
                </div>
                <h3 className="text-lg font-semibold text-slate-900">Confirm Deletion</h3>
              </div>
              
              <p className="text-slate-600 mb-6">
                Are you sure you want to delete the term <strong>{deleteSeason} {deleteYear}</strong>? 
                This action cannot be undone.
              </p>
              
              <div className="flex items-center gap-3 justify-end">
                <button
                  onClick={() => setDeleteId(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteConfirm}
                  disabled={deleteLoading}
                  className="px-4 py-2 bg-red-500 hover:bg-red-600 disabled:bg-red-300 text-white rounded-lg font-medium transition-colors flex items-center gap-2"
                >
                  {deleteLoading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Deleting...
                    </>
                  ) : (
                    <>
                      <Trash2 className="w-4 h-4" />
                      Delete
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
                 )}
       </div>
     </div>
    </AdminLayout>
  )
}
