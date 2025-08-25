import { useToast } from '@/hooks/use-toast'
import { AlertCircle, CheckCircle, Download, FileText, RefreshCw, Upload, Users, X, Search, Filter } from 'lucide-react'
import React, { useCallback, useEffect, useState } from 'react'
import axiosClient from '../../configs/axiosClient'

interface ImportError {
  row: number
  error: string
}

interface ImportResults {
  totalRecords?: number
  successRecords?: number
  failedRecords?: number
  errors?: ImportError[]
  error?: string
}

interface ProcessedFile {
  id: string
  fileName: string
  note?: string
  urlFile?: string
  statusFile?: string
  createdAt?: string
  updatedAt?: string
}

const AdminUserImport: React.FC = () => {
  const [dragActive, setDragActive] = useState(false)
  const [file, setFile] = useState<File | null>(null)
  const [importing, setImporting] = useState(false)
  const [importResults, setImportResults] = useState<ImportResults | null>(null)

  const [allProcessedFiles, setAllProcessedFiles] = useState<ProcessedFile[]>([])
  const [page, setPage] = useState<number>(1)
  const [totalPages, setTotalPages] = useState<number>(1)
  
  // Search and filter states
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [dateFilter, setDateFilter] = useState('all')
  const [showFilters, setShowFilters] = useState(false)
  
  const { toast } = useToast()

  const handleDrag = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }, [])

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const droppedFile = e.dataTransfer.files[0]
      if (
        droppedFile.type === 'text/csv' ||
        droppedFile.name.endsWith('.csv') ||
        droppedFile.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
        droppedFile.name.endsWith('.xlsx')
      ) {
        setFile(droppedFile)
      }
    }
  }, [])

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0])
    }
  }

  const handleImport = async () => {
    if (!file) return

    setImporting(true)
    setImportResults(null)

    try {
      const formData = new FormData()
      formData.append('file', file)

      const res = await axiosClient.post('/admin/users/import', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })

  // backend returns { code, message, data }
  setImportResults(res.data)

  // show toast success
  toast({ title: 'Upload successful', description: 'File uploaded and queued for processing.' })

  // Refresh processed files list
  await fetchProcessedFiles(page)
  setFile(null)
    } catch (error) {
      console.error('Import error:', error)
  setImportResults({ error: 'Failed to import file. Please try again.' })
  toast({ title: 'Upload failed', description: 'There was a problem uploading the file.' })
    } finally {
      setImporting(false)
    }
  }

  const removeFile = () => {
    setFile(null)
    setImportResults(null)
  }

  const fetchProcessedFiles = async (pageNumber = 1) => {
    try {
      const res = await axiosClient.get(`/admin/users/processing-files?page=${pageNumber}`)
      const payload = res.data && res.data.data ? res.data.data : res.data
      const items: ProcessedFile[] = (payload && payload.items) || []
                      setAllProcessedFiles(items) // Store all files for filtering
      setTotalPages(payload?.totalPages ?? 1)
      setPage(payload?.pageNumber ?? pageNumber)
      return payload
    } catch (error) {
      console.error('Failed to fetch processed files:', error)
      return null
    }
  }

  const goToPage = async (n: number) => {
    if (n < 1) return
    const payload = await fetchProcessedFiles(n)
    if (payload) {
      setPage(payload.pageNumber ?? n)
      setTotalPages(payload.totalPages ?? 1)
    }
  }

  // Note: only using the two allowed APIs. For downloads use the provided urlFile from processing-files.

  // Filter and search logic
  const filteredFiles = React.useMemo(() => {
    return allProcessedFiles.filter((file) => {
      const row = file as unknown as Record<string, unknown>
      const fileName = String(row['fileName'] ?? row['name'] ?? row['filename'] ?? '').toLowerCase()
      const status = String(row['status'] ?? row['statusFile'] ?? row['state'] ?? '').toLowerCase()
      const createdDate = row['createdAt'] ?? row['uploadDate'] ?? row['uploadedAt']
      
      // Search filter
      const matchesSearch = searchTerm === '' || fileName.includes(searchTerm.toLowerCase())
      
      // Status filter
      const matchesStatus = statusFilter === 'all' || status === statusFilter.toLowerCase()
      
      // Date filter
      let matchesDate = true
      if (dateFilter !== 'all' && createdDate) {
        const fileDate = new Date(String(createdDate))
        const today = new Date()
        const yesterday = new Date(today)
        yesterday.setDate(yesterday.getDate() - 1)
        const lastWeek = new Date(today)
        lastWeek.setDate(lastWeek.getDate() - 7)
        const lastMonth = new Date(today)
        lastMonth.setMonth(lastMonth.getMonth() - 1)
        
        switch (dateFilter) {
          case 'today':
            matchesDate = fileDate.toDateString() === today.toDateString()
            break
          case 'yesterday':
            matchesDate = fileDate.toDateString() === yesterday.toDateString()
            break
          case 'lastWeek':
            matchesDate = fileDate >= lastWeek
            break
          case 'lastMonth':
            matchesDate = fileDate >= lastMonth
            break
        }
      }
      
      return matchesSearch && matchesStatus && matchesDate
    })
  }, [allProcessedFiles, searchTerm, statusFilter, dateFilter])

  const clearFilters = () => {
    setSearchTerm('')
    setStatusFilter('all')
    setDateFilter('all')
  }

  useEffect(() => {
    fetchProcessedFiles(page)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div className='space-y-8'>
      {/* Upload Section */}
      <div className='bg-white rounded-xl shadow-sm border border-gray-200 p-6'>
        <div className='flex items-center gap-3 mb-6'>
          <div className='p-2 bg-blue-100 rounded-lg'>
            <Upload className='h-6 w-6 text-blue-600' />
          </div>
          <div>
            <h2 className='text-xl font-semibold text-gray-900'>Upload File</h2>
            <p className='text-gray-600'>Upload CSV or XLSX file to import users</p>
          </div>
        </div>

        <div
          className={`relative border-2 border-dashed rounded-xl p-8 text-center transition-colors ${
            dragActive
              ? 'border-blue-500 bg-blue-50'
              : file
              ? 'border-green-500 bg-green-50'
              : 'border-gray-300 hover:border-gray-400'
          }`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          <input
            type='file'
            accept='.csv,.xlsx'
            onChange={handleFileSelect}
            className='absolute inset-0 w-full h-full opacity-0 cursor-pointer'
          />

          {!file ? (
            <div className='space-y-4'>
              <div className='flex justify-center'>
                <FileText className='h-16 w-16 text-gray-400' />
              </div>
              <div>
                <p className='text-lg font-medium text-gray-900'>
                  Drop your file here, or <span className='text-blue-600'>browse</span>
                </p>
                <p className='text-gray-500 mt-1'>Supports CSV and XLSX files</p>
              </div>
            </div>
          ) : (
            <div className='space-y-4'>
              <div className='flex justify-center'>
                <CheckCircle className='h-16 w-16 text-green-500' />
              </div>
              <div>
                <p className='text-lg font-medium text-gray-900'>{file.name}</p>
                <p className='text-gray-500'>{(file.size / 1024 / 1024).toFixed(2)} MB</p>
              </div>
              <button onClick={removeFile} className='inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-red-600 hover:text-red-700 transition-colors'>
                <X className='h-4 w-4' />
                Remove file
              </button>
            </div>
          )}
        </div>

        {file && (
          <div className='mt-6 flex justify-end'>
            <button
              onClick={handleImport}
              disabled={importing}
              className='inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors'
            >
              {importing ? (
                <>
                  <div className='animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent'></div>
                  Importing...
                </>
              ) : (
                <>
                  <Users className='h-4 w-4' />
                  Import Users
                </>
              )}
            </button>
          </div>
        )}
      </div>

      {/* Import Progress */}
      {importing && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="animate-spin rounded-full h-5 w-5 border-2 border-blue-600 border-t-transparent"></div>
            <h3 className="text-lg font-semibold text-gray-900">Processing Import</h3>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div className="bg-blue-600 h-2 rounded-full animate-pulse" style={{ width: '60%' }}></div>
          </div>
          <p className="text-sm text-gray-600 mt-2">Validating and importing user records...</p>
        </div>
      )}

  {/* Import Results removed as requested */}

      {/* Error Results */}
      {importResults && importResults.error && (
        <div className="bg-white rounded-xl shadow-sm border border-red-200 p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-red-100 rounded-lg">
              <AlertCircle className="h-6 w-6 text-red-600" />
            </div>
            <div>
              <h3 className="text-xl font-semibold text-red-900">Import Failed</h3>
              <p className="text-red-600">{importResults.error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Processed Files History */}
      <div className='bg-white rounded-xl shadow-sm border border-gray-200 p-6'>
        <div className='flex items-center justify-between mb-6'>
          <div className='flex items-center gap-3'>
            <div className='p-2 bg-purple-100 rounded-lg'>
              <FileText className='h-6 w-6 text-purple-600' />
            </div>
            <div>
              <h3 className='text-xl font-semibold text-gray-900'>Import History</h3>
              <p className='text-gray-600'>Previously processed files</p>
            </div>
          </div>
          <div className='flex items-center gap-2'>
            <button
              type='button'
              onClick={() => setShowFilters(!showFilters)}
              className='inline-flex items-center gap-2 px-3 py-2 bg-white border rounded-md text-sm text-gray-600 hover:bg-gray-50'
              title='Toggle filters'
            >
              <Filter className='h-4 w-4' />
              Filters
            </button>
            <button
              type='button'
              onClick={() => fetchProcessedFiles(page)}
              className='inline-flex items-center gap-2 px-3 py-2 bg-white border rounded-md text-sm text-gray-600 hover:bg-gray-50'
              title='Refresh list'
            >
              <RefreshCw className='h-4 w-4' />
            </button>
          </div>
        </div>

        {/* Search and Filter Section */}
        <div className='mb-6 space-y-4'>
          {/* Search Bar */}
          <div className='relative'>
            <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400' />
            <input
              type='text'
              placeholder='Search by file name...'
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className='w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none transition-colors'
            />
          </div>

          {/* Expandable Filters */}
          {showFilters && (
            <div className='bg-gray-50 rounded-lg p-4 space-y-4'>
              <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
                {/* Status Filter */}
                <div>
                  <label className='block text-sm font-medium text-gray-700 mb-2'>Status</label>
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none'
                  >
                    <option value='all'>All Status</option>
                    <option value='success'>Success</option>
                    <option value='failed'>Failed</option>
                    <option value='processing'>Processing</option>
                  </select>
                </div>

                {/* Date Filter */}
                <div>
                  <label className='block text-sm font-medium text-gray-700 mb-2'>Date Range</label>
                  <select
                    value={dateFilter}
                    onChange={(e) => setDateFilter(e.target.value)}
                    className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none'
                  >
                    <option value='all'>All Time</option>
                    <option value='today'>Today</option>
                    <option value='yesterday'>Yesterday</option>
                    <option value='lastWeek'>Last 7 Days</option>
                    <option value='lastMonth'>Last 30 Days</option>
                  </select>
                </div>

                {/* Clear Filters */}
                <div className='flex items-end'>
                  <button
                    onClick={clearFilters}
                    className='w-full px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium'
                  >
                    Clear Filters
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Results Summary */}
          <div className='flex items-center justify-between text-sm text-gray-600'>
            <span>
              Showing {filteredFiles.length} of {allProcessedFiles.length} files
              {(searchTerm || statusFilter !== 'all' || dateFilter !== 'all') && ' (filtered)'}
            </span>
            {filteredFiles.length === 0 && allProcessedFiles.length > 0 && (
              <span className='text-orange-600'>No files match your filters</span>
            )}
          </div>
        </div>

        <div className="overflow-x-auto">
          {filteredFiles.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h4 className="text-lg font-medium text-gray-900 mb-2">
                {allProcessedFiles.length === 0 ? 'No import history' : 'No files match your filters'}
              </h4>
              <p className="text-gray-500">
                {allProcessedFiles.length === 0 
                  ? 'Import your first file to see the history here.' 
                  : 'Try adjusting your search or filters.'
                }
              </p>
            </div>
          ) : (
            <div className='space-y-4'>
              {filteredFiles.map((f) => {
                const row = f as unknown as Record<string, unknown>
                const displayName = String(row['fileName'] ?? row['name'] ?? row['filename'] ?? '—')
                const createdVal = row['createdAt'] ?? row['uploadDate'] ?? row['uploadedAt']
                const displayDate = createdVal ? new Date(String(createdVal)).toLocaleString() : '—'
                const statusVal = String(row['status'] ?? row['statusFile'] ?? row['state'] ?? '—')
                const downloadUrl = String(row['urlFile'] ?? row['url'] ?? row['downloadUrl'] ?? '')

                return (
                  <div key={f.id} className='flex items-start justify-between bg-white rounded-lg border border-gray-100 p-4 shadow-sm'>
                    <div className='flex gap-4'>
                      <div className='p-3 bg-purple-50 rounded-md'>
                        <FileText className='h-6 w-6 text-purple-600' />
                      </div>
                      <div>
                        <div className='text-sm font-semibold text-gray-900'>{displayName}</div>
                        <div
                          className='text-xs text-gray-500 mt-1'
                          dangerouslySetInnerHTML={{ __html: String(row['note'] ?? '') }}
                        />
                        {/* ID hidden by request */}
                      </div>
                    </div>

                    <div className='flex flex-col items-end gap-2'>
                      <div>
                        <span
                          className={`inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full ${
                            statusVal === 'Success' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                          }`}
                        >
                          {statusVal}
                        </span>
                      </div>
                      <div className='text-xs text-gray-500'>{displayDate}</div>
                      <div>
                        {downloadUrl ? (
                          <button
                            type='button'
                            onClick={() => window.open(downloadUrl, '_blank', 'noopener')}
                            className='inline-flex items-center gap-2 px-3 py-2 bg-green-50 text-green-700 rounded-md hover:bg-green-100'
                            title='Open file in new tab'
                          >
                            <Download className='h-4 w-4' />
                            <span className='text-sm'>Open</span>
                          </button>
                        ) : (
                          <span className='text-gray-400'>-</span>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}

              {/* Pagination (simple) */}
              <div className='flex items-center justify-end gap-2'>
                <button
                  onClick={() => goToPage(page - 1)}
                  disabled={page <= 1}
                  className='px-3 py-1 rounded border bg-white text-sm disabled:opacity-50'
                >
                  Prev
                </button>
                <div className='text-sm text-gray-600'>Page {page} / {totalPages}</div>
                <button
                  onClick={() => goToPage(page + 1)}
                  disabled={page >= totalPages}
                  className='px-3 py-1 rounded border bg-white text-sm disabled:opacity-50'
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default AdminUserImport
