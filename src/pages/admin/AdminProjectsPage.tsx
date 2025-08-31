import { adminApi } from '@/api/admin'
import AdminLayout from '@/components/admin/AdminLayout'
import { useEffect, useMemo, useState } from 'react'

interface AdminProjectListItem {
  id: string
  title: string
  description: string
  lastUpdate: string
  role: string | null
  semester: string
  termId: string
  termName: string
  createdAt: string
  isActive: boolean
}

interface TermItem {
  id: string
  season: string
  year: number
}

export default function AdminProjectsPage() {
  const [projects, setProjects] = useState<AdminProjectListItem[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)
  const [terms, setTerms] = useState<TermItem[]>([])
  const [selectedTermId, setSelectedTermId] = useState<string>('')
  const [searchQuery, setSearchQuery] = useState<string>('')
  const [sortBy, setSortBy] = useState<string>('lastUpdate')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  const [termsLoading, setTermsLoading] = useState<boolean>(true)

  useEffect(() => {
    void loadTerms()
    void loadAllProjects()
  }, [])

  useEffect(() => {
    if (!selectedTermId) {
      void loadAllProjects()
      return
    }
    void loadProjectsByTerm(selectedTermId)
  }, [selectedTermId])

  // Extract terms from projects if API terms are empty
  useEffect(() => {
    if (terms.length === 0 && projects.length > 0 && !termsLoading) {
      const uniqueTerms = new Map<string, TermItem>()
      projects.forEach((project: AdminProjectListItem) => {
        if (project.termId && project.termName) {
          // Extract season and year from termName (e.g., "Summer 2025")
          const match = project.termName.match(/^(.+?)\s+(\d{4})$/)
          if (match) {
            const [, season, year] = match
            uniqueTerms.set(project.termId, {
              id: project.termId,
              season: season,
              year: parseInt(year)
            })
          } else {
            // Fallback if parsing fails
            uniqueTerms.set(project.termId, {
              id: project.termId,
              season: project.termName,
              year: new Date().getFullYear()
            })
          }
        }
      })
      const extractedTerms = Array.from(uniqueTerms.values())
      console.log('Extracted terms from projects:', extractedTerms)
      if (extractedTerms.length > 0) {
        setTerms(extractedTerms)
      }
    }
  }, [projects, terms.length, termsLoading])

  const loadTerms = async () => {
    try {
      setTermsLoading(true)
      const res = await adminApi.getTermList(1)
      console.log('Terms API response:', res)
      const termsData = res?.data?.data
      console.log('Terms data:', termsData)
      const list = Array.isArray(termsData) ? termsData as Array<{ id: string; season: string; year: number }> : []
      console.log('Processed terms list:', list)
      setTerms(list)
    } catch (e: any) {
      console.error('Error loading terms:', e)
      setTerms([])
    } finally {
      setTermsLoading(false)
    }
  }

  const loadAllProjects = async () => {
    try {
      setLoading(true)
      setError(null)
      const res = await adminApi.getAllProjects()
      const projectsData = res.data || []
      setProjects(projectsData)
    } catch (e: any) {
      setError(e?.message || 'Failed to load projects')
    } finally {
      setLoading(false)
    }
  }

  const loadProjectsByTerm = async (termId: string) => {
    try {
      setLoading(true)
      setError(null)
      const res = await adminApi.getProjectsByTerm(termId)
      setProjects(res.data || [])
    } catch (e: any) {
      setError(e?.message || 'Failed to load projects by term')
    } finally {
      setLoading(false)
    }
  }

  const filteredAndSortedProjects = useMemo(() => {
    let filtered = projects
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim()
      filtered = filtered.filter((project) =>
        project.title.toLowerCase().includes(query) ||
        project.description.toLowerCase().includes(query) ||
        project.termName?.toLowerCase().includes(query) ||
        project.semester.toLowerCase().includes(query)
      )
    }

    const sorted = [...filtered].sort((a, b) => {
      let aValue: any = a[sortBy as keyof AdminProjectListItem]
      let bValue: any = b[sortBy as keyof AdminProjectListItem]

      if (sortBy === 'lastUpdate' || sortBy === 'createdAt') {
        aValue = new Date(aValue).getTime()
        bValue = new Date(bValue).getTime()
      }

      if (typeof aValue === 'string') {
        aValue = aValue.toLowerCase()
        bValue = bValue.toLowerCase()
      }

      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1
      }
      return aValue < bValue ? 1 : -1
    })

    return sorted
  }, [projects, searchQuery, sortBy, sortOrder])

  const stats = useMemo(() => {
    const total = filteredAndSortedProjects.length
    const active = filteredAndSortedProjects.filter((p) => p.isActive).length
    return [
      { label: 'Total Projects', value: total },
      { label: 'Active', value: active }
    ]
  }, [filteredAndSortedProjects])

  const handleSort = (field: string) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setSortBy(field)
      setSortOrder('desc')
    }
  }

  const SortIcon = ({ field }: { field: string }) => {
    if (sortBy !== field) {
      return (
        <svg className='w-4 h-4 text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
          <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4' />
        </svg>
      )
    }
    return (
      <svg className={`w-4 h-4 transition-transform duration-200 ${sortOrder === 'desc' ? 'rotate-180' : ''} ${sortBy === field ? 'text-blue-600' : 'text-slate-400'}`} fill='none' stroke='currentColor' viewBox='0 0 24 24'>
        <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M5 15l7-7 7 7' />
      </svg>
    )
  }

  return (
    <AdminLayout title='Projects' description='View all projects and filter by semester' stats={stats}>
      <div className='p-6 space-y-6 min-h-screen bg-gradient-to-br from-slate-50 to-blue-50'>
        <div className='relative'>
          <div className='absolute inset-0 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl blur opacity-20'></div>
          <div className='relative bg-white/80 backdrop-blur-xl rounded-2xl shadow-xl border border-white/20 p-6'>
            <div className='flex flex-col lg:flex-row gap-6 items-start lg:items-end'>
              <div className='flex-1 space-y-2'>
                <label className='block text-sm font-semibold text-slate-800 tracking-wide'>🔍 Search Projects</label>
                <div className='relative group'>
                  <div className='absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none transition-all group-focus-within:scale-110'>
                    <svg className='h-5 w-5 text-slate-400 group-focus-within:text-blue-500 transition-colors' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                      <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z' />
                    </svg>
                  </div>
                  <input
                    type='text'
                    placeholder='Search by title, description, or term...'
                    className='block w-full pl-12 pr-4 py-3.5 border-2 border-slate-200 rounded-xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-300 text-sm bg-white/50 backdrop-blur placeholder-slate-400 hover:border-slate-300'
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                  {searchQuery && (
                    <button onClick={() => setSearchQuery('')} className='absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-slate-600 transition-colors'>
                      <svg className='h-4 w-4' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                        <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M6 18L18 6M6 6l12 12' />
                      </svg>
                    </button>
                  )}
                </div>
              </div>
              <div className='space-y-2 min-w-[220px]'>
                <label className='block text-sm font-semibold text-slate-800 tracking-wide'>📅 Filter by Semester</label>
                <select
                  className='block w-full px-4 py-3.5 border-2 border-slate-200 rounded-xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-300 text-sm bg-white/50 backdrop-blur hover:border-slate-300'
                  value={selectedTermId}
                  onChange={(e) => setSelectedTermId(e.target.value)}
                  disabled={termsLoading}
                >
                  <option value=''>✨ All semesters</option>
                  {termsLoading ? (
                    <option value='' disabled>Loading semesters...</option>
                  ) : Array.isArray(terms) && terms.length > 0 ? (
                    terms.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.season} {t.year}
                      </option>
                    ))
                  ) : (
                    <option value='' disabled>No semesters available</option>
                  )}
                </select>
              </div>
              {(searchQuery || selectedTermId) && (
                <button
                  onClick={() => {
                    setSearchQuery('')
                    setSelectedTermId('')
                  }}
                  className='group px-6 py-3.5 text-sm font-medium text-slate-600 hover:text-white border-2 border-slate-300 hover:border-red-500 rounded-xl hover:bg-gradient-to-r hover:from-red-500 hover:to-pink-500 transition-all duration-300 transform hover:scale-105 hover:shadow-lg'
                >
                  <span className='flex items-center gap-2'>
                    <svg className='h-4 w-4 transition-transform group-hover:rotate-90' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                      <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M6 18L18 6M6 6l12 12' />
                    </svg>
                    Clear All
                  </span>
                </button>
              )}
            </div>
            {(searchQuery || selectedTermId) && (
              <div className='mt-6 pt-6 border-t border-slate-200'>
                <div className='flex flex-wrap gap-3'>
                  {searchQuery && (
                    <div className='animate-fadeIn'>
                      <span className='inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-full text-sm font-medium shadow-lg transform hover:scale-105 transition-all duration-200'>
                        🔍 "{searchQuery}"
                        <button onClick={() => setSearchQuery('')} className='hover:bg-white/20 rounded-full p-1 transition-colors'>
                          <svg className='h-3 w-3' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                            <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M6 18L18 6M6 6l12 12' />
                          </svg>
                        </button>
                      </span>
                    </div>
                  )}
                  {selectedTermId && (
                    <div className='animate-fadeIn'>
                      <span className='inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-full text-sm font-medium shadow-lg transform hover:scale-105 transition-all duration-200'>
                        📅 {Array.isArray(terms) ? terms.find(t => t.id === selectedTermId)?.season : ''} {Array.isArray(terms) ? terms.find(t => t.id === selectedTermId)?.year : ''}
                        <button onClick={() => setSelectedTermId('')} className='hover:bg-white/20 rounded-full p-1 transition-colors'>
                          <svg className='h-3 w-3' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                            <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M6 18L18 6M6 6l12 12' />
                          </svg>
                        </button>
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {loading ? (
          <div className='relative'>
            <div className='absolute inset-0 bg-gradient-to-r from-blue-600/10 to-purple-600/10 rounded-2xl blur'></div>
            <div className='relative bg-white/70 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/30 p-16 text-center'>
              <div className='inline-flex items-center justify-center w-16 h-16 mb-6'>
                <div className='relative'>
                  <div className='animate-spin rounded-full h-16 w-16 border-4 border-blue-200'></div>
                  <div className='animate-spin rounded-full h-16 w-16 border-4 border-blue-600 border-t-transparent absolute top-0 left-0'></div>
                </div>
              </div>
              <div className='space-y-2'>
                <p className='text-slate-800 font-medium text-lg'>Loading your projects</p>
                <p className='text-slate-500 text-sm'>Please wait while we gather the latest data...</p>
              </div>
            </div>
          </div>
        ) : error ? (
          <div className='relative group'>
            <div className='absolute inset-0 bg-gradient-to-r from-red-500/20 to-pink-500/20 rounded-2xl blur-sm'></div>
            <div className='relative bg-white/80 backdrop-blur-xl rounded-2xl shadow-2xl border border-red-200/50 p-12 text-center'>
              <div className='inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-red-500 to-pink-500 rounded-full mb-6 shadow-lg'>
                <svg className='h-8 w-8 text-white' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                  <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z' />
                </svg>
              </div>
              <div className='space-y-4'>
                <h3 className='text-xl font-bold text-slate-800'>Oops! Something went wrong</h3>
                <p className='text-red-600 font-medium'>{error}</p>
                <button
                  onClick={() => selectedTermId ? loadProjectsByTerm(selectedTermId) : loadAllProjects()}
                  className='inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-red-500 to-pink-500 text-white rounded-xl hover:from-red-600 hover:to-pink-600 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl font-medium'
                >
                  <svg className='h-4 w-4' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                    <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15' />
                  </svg>
                  Try Again
                </button>
              </div>
            </div>
          </div>
        ) : filteredAndSortedProjects.length === 0 ? (
          <div className='relative'>
            <div className='absolute inset-0 bg-gradient-to-r from-slate-400/10 to-slate-600/10 rounded-2xl blur'></div>
            <div className='relative bg-white/70 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/30 p-16 text-center'>
              <div className='inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r from-slate-400 to-slate-600 rounded-full mb-6 shadow-lg'>
                <svg className='h-10 w-10 text-white' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                  <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' />
                </svg>
              </div>
              <div className='space-y-3'>
                <h3 className='text-2xl font-bold text-slate-800'>No Projects Found</h3>
                <p className='text-slate-500 max-w-md mx-auto'>
                  {searchQuery || selectedTermId ? 'Try adjusting your search criteria or filters to discover more projects.' : 'No projects have been created yet. Start by creating your first project!'}
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className='relative group'>
            <div className='absolute inset-0 bg-gradient-to-r from-blue-500/5 to-purple-500/5 rounded-2xl blur-sm'></div>
            <div className='relative bg-white/90 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/50 overflow-hidden'>
              <div className='px-8 py-6 bg-gradient-to-r from-slate-50 to-blue-50 border-b border-slate-200/50'>
                <div className='flex items-center justify-between'>
                  <div className='space-y-1'>
                    <h3 className='text-xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent'>Project Results</h3>
                    <p className='text-sm text-slate-600'>
                      Showing <span className='font-bold text-blue-600'>{filteredAndSortedProjects.length}</span> {filteredAndSortedProjects.length !== projects.length && (<span> of <span className='font-medium'>{projects.length}</span></span>)} project{filteredAndSortedProjects.length === 1 ? '' : 's'} {searchQuery && (<span className='text-blue-600'> matching your search</span>)}
                    </p>
                  </div>
                  <div className='text-xs text-slate-400 bg-slate-100 px-3 py-1 rounded-full'>
                    Last synced: {new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              </div>
              <div className='overflow-x-auto'>
                <table className='min-w-full'>
                  <thead>
                    <tr className='bg-gradient-to-r from-slate-100 to-slate-50'>
                      <th className='group text-left px-8 py-5 font-bold text-slate-800 text-sm uppercase tracking-wider cursor-pointer hover:bg-slate-200/50 transition-all duration-200' onClick={() => handleSort('title')}>
                        <div className='flex items-center gap-2'>
                          Project
                          <SortIcon field='title' />
                        </div>
                      </th>
                      <th className='text-left px-8 py-5 font-bold text-slate-800 text-sm uppercase tracking-wider'>Description</th>
                      <th className='group text-left px-8 py-5 font-bold text-slate-800 text-sm uppercase tracking-wider cursor-pointer hover:bg-slate-200/50 transition-all duration-200' onClick={() => handleSort('termName')}>
                        <div className='flex items-center gap-2'>
                          Semester
                          <SortIcon field='termName' />
                        </div>
                      </th>
                      <th className='group text-left px-8 py-5 font-bold text-slate-800 text-sm uppercase tracking-wider cursor-pointer hover:bg-slate-200/50 transition-all duration-200' onClick={() => handleSort('createdAt')}>
                        <div className='flex items-center gap-2'>
                          Created
                          <SortIcon field='createdAt' />
                        </div>
                      </th>
                      <th className='group text-left px-8 py-5 font-bold text-slate-800 text-sm uppercase tracking-wider cursor-pointer hover:bg-slate-200/50 transition-all duration-200' onClick={() => handleSort('lastUpdate')}>
                        <div className='flex items-center gap-2'>
                          Last Update
                          <SortIcon field='lastUpdate' />
                        </div>
                      </th>
                      <th className='group text-left px-8 py-5 font-bold text-slate-800 text-sm uppercase tracking-wider cursor-pointer hover:bg-slate-200/50 transition-all duration-200' onClick={() => handleSort('isActive')}>
                        <div className='flex items-center gap-2'>
                          Status
                          <SortIcon field='isActive' />
                        </div>
                      </th>
                    </tr>
                  </thead>
                  <tbody className='divide-y divide-slate-200/50'>
                    {filteredAndSortedProjects.map((p, index) => (
                      <tr key={p.id} className={`group hover:bg-gradient-to-r hover:from-blue-50/50 hover:to-purple-50/50 transition-all duration-300 transform hover:scale-[1.01] ${index % 2 === 0 ? 'bg-white/50' : 'bg-slate-50/30'}`} style={{ animationDelay: `${index * 50}ms` }}>
                        <td className='px-8 py-6'>
                          <div className='space-y-2'>
                            <div className='font-bold text-slate-900 group-hover:text-blue-700 transition-colors duration-200 text-lg'>{p.title}</div>
                            {p.role && (
                              <div className='inline-flex items-center px-2 py-1 bg-gradient-to-r from-purple-100 to-pink-100 text-purple-800 rounded-md text-xs font-medium'>
                                👤 {p.role}
                              </div>
                            )}
                          </div>
                        </td>
                        <td className='px-8 py-6'>
                          <div className='text-slate-600 max-w-md'>
                            <p className='text-sm leading-relaxed line-clamp-3 group-hover:text-slate-800 transition-colors'>{p.description}</p>
                          </div>
                        </td>
                        <td className='px-8 py-6'>
                          <div className='inline-flex items-center px-4 py-2 rounded-xl text-sm font-bold bg-gradient-to-r from-indigo-500 to-blue-600 text-white shadow-lg group-hover:shadow-xl transition-all duration-200 transform group-hover:scale-105'>
                            📚 {p.termName || p.semester}
                          </div>
                        </td>
                        <td className='px-8 py-6 text-sm'>
                          <div className='space-y-1'>
                            <div className='font-semibold text-slate-800'>{new Date(p.createdAt).toLocaleDateString('vi-VN')}</div>
                            <div className='text-xs text-slate-500 bg-slate-100 px-2 py-1 rounded-md inline-block'>
                              {new Date(p.createdAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                            </div>
                          </div>
                        </td>
                        <td className='px-8 py-6 text-sm'>
                          <div className='space-y-1'>
                            <div className='font-semibold text-slate-800'>{new Date(p.lastUpdate).toLocaleDateString('vi-VN')}</div>
                            <div className='text-xs text-slate-500 bg-slate-100 px-2 py-1 rounded-md inline-block'>
                              {new Date(p.lastUpdate).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                            </div>
                          </div>
                        </td>
                        <td className='px-8 py-6'>
                          <div className='flex items-center space-x-3'>
                            <span className={`inline-flex items-center px-4 py-2 rounded-xl text-sm font-bold transition-all duration-200 transform group-hover:scale-105 shadow-lg ${p.isActive ? 'bg-gradient-to-r from-emerald-500 to-green-600 text-white shadow-emerald-200' : 'bg-gradient-to-r from-slate-400 to-slate-500 text-white shadow-slate-200'}`}>
                              <div className={`w-2.5 h-2.5 rounded-full mr-2 shadow-sm ${p.isActive ? 'bg-white animate-pulse' : 'bg-slate-200'}`}></div>
                              {p.isActive ? '✅ Active' : '⏸️ Inactive'}
                            </span>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className='px-8 py-6 bg-gradient-to-r from-slate-50 to-blue-50 border-t border-slate-200/50'>
                <div className='flex items-center justify-between'>
                  <div className='flex items-center gap-4'>
                    <div className='text-sm font-medium text-slate-700'>
                      📊 {filteredAndSortedProjects.length} result{filteredAndSortedProjects.length === 1 ? '' : 's'}
                      {searchQuery && (<span className='text-blue-600 ml-1'>for "{searchQuery}"</span>)}
                    </div>
                    {filteredAndSortedProjects.length > 0 && (
                      <div className='flex items-center gap-2 text-xs text-slate-500'>
                        <div className='w-2 h-2 bg-emerald-500 rounded-full animate-pulse'></div>
                        <span>{filteredAndSortedProjects.filter(p => p.isActive).length} active</span>
                        <div className='w-1 h-1 bg-slate-300 rounded-full'></div>
                        <div className='w-2 h-2 bg-slate-400 rounded-full'></div>
                        <span>{filteredAndSortedProjects.filter(p => !p.isActive).length} inactive</span>
                      </div>
                    )}
                  </div>
                  <div className='text-xs text-slate-400 bg-white/50 px-3 py-1.5 rounded-full border border-slate-200'>
                    🕒 Updated: {new Date().toLocaleString('vi-VN')}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
      <style>{`
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        .animate-fadeIn { animation: fadeIn 0.3s ease-out; }
        .line-clamp-2 { display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
        .line-clamp-3 { display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden; }
      `}</style>
    </AdminLayout>
  )
}

