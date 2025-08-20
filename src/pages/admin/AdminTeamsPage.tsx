import AdminLayout from '@/components/admin/AdminLayout'
import { adminApi } from '@/api/admin'
import { useEffect, useState } from 'react'
import { Search, Users, Calendar, Filter, ChevronDown, User, Mail, Hash } from 'lucide-react'

export default function AdminTeamsPage() {
  const [teams, setTeams] = useState<any[]>([])
  const [filteredTeams, setFilteredTeams] = useState<any[]>([])
  const [selected, setSelected] = useState<any | null>(null)
  const [loading, setLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedSemester, setSelectedSemester] = useState('all')
  const [sortBy, setSortBy] = useState('name')
  const [showFilters, setShowFilters] = useState(false)

  useEffect(() => {
    void loadTeams()
  }, [])

  useEffect(() => {
    filterAndSortTeams()
  }, [teams, searchTerm, selectedSemester, sortBy])

  const loadTeams = async () => {
    try {
      setLoading(true)
      const res = await adminApi.getTeams()
      setTeams(res.data || [])
    } catch (e: any) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  const openTeam = async (projectId: string) => {
    try {
      const res = await adminApi.getTeamById(projectId)
      setSelected(res.data || null)
    } catch (e: any) {
      console.error(e)
    }
  }

  const filterAndSortTeams = () => {
    let filtered = [...teams]

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(team => 
        team.projectTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
        team.projectDescription?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // Apply semester filter
    if (selectedSemester !== 'all') {
      filtered = filtered.filter(team => team.semester === selectedSemester)
    }

    // Apply sorting
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.projectTitle.localeCompare(b.projectTitle)
        case 'members':
          return (b.totalMembers || 0) - (a.totalMembers || 0)
        case 'semester':
          return a.semester.localeCompare(b.semester)
        default:
          return 0
      }
    })

    setFilteredTeams(filtered)
  }

  // Get unique semesters from teams data
  const semesters = [...new Set(teams.map(team => team.semester))].sort()

  return (
    <AdminLayout title='Teams Management' description='Manage project teams and members'>
      <div className='p-6 space-y-6'>
        {/* Header with Stats */}
  <div className='grid grid-cols-1 md:grid-cols-3 gap-4 mb-6'>
          <div className='bg-gradient-to-r from-blue-500 to-blue-600 text-white p-6 rounded-xl shadow-lg'>
            <div className='flex items-center justify-between'>
              <div>
                <p className='text-blue-100 text-sm font-medium'>Total Teams</p>
                <p className='text-2xl font-bold'>{teams.length}</p>
              </div>
              <Users className='h-8 w-8 text-blue-200' />
            </div>
          </div>
          <div className='bg-gradient-to-r from-green-500 to-green-600 text-white p-6 rounded-xl shadow-lg'>
            <div className='flex items-center justify-between'>
              <div>
                <p className='text-green-100 text-sm font-medium'>Total Members</p>
                <p className='text-2xl font-bold'>{teams.reduce((sum, team) => sum + (team.totalMembers || 0), 0)}</p>
              </div>
              <User className='h-8 w-8 text-green-200' />
            </div>
          </div>
          <div className='bg-gradient-to-r from-purple-500 to-purple-600 text-white p-6 rounded-xl shadow-lg'>
            <div className='flex items-center justify-between'>
              <div>
                <p className='text-purple-100 text-sm font-medium'>Active Semesters</p>
                <p className='text-2xl font-bold'>{semesters.length}</p>
              </div>
              <Calendar className='h-8 w-8 text-purple-200' />
            </div>
          </div>
        </div>

        {/* Search and Filters */}
        <div className='bg-white rounded-xl shadow-sm border p-6'>
          <div className='flex flex-col lg:flex-row gap-4 items-center justify-between'>
            {/* Search */}
            <div className='relative flex-1 max-w-md'>
              <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5' />
              <input
                type='text'
                placeholder='Search teams by name or description...'
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className='w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors'
              />
            </div>

            {/* Filter Toggle */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className='flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors'
            >
              <Filter className='h-4 w-4' />
              Filters
              <ChevronDown className={`h-4 w-4 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
            </button>
          </div>

          {/* Expandable Filters */}
          {showFilters && (
            <div className='mt-4 pt-4 border-t flex flex-col sm:flex-row gap-4'>
              <div className='flex-1'>
                <label className='block text-sm font-medium text-gray-700 mb-2'>Semester</label>
                <select
                  value={selectedSemester}
                  onChange={(e) => setSelectedSemester(e.target.value)}
                  className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none'
                >
                  <option value='all'>All Semesters</option>
                  {semesters.map(semester => (
                    <option key={semester} value={semester}>{semester}</option>
                  ))}
                </select>
              </div>
              <div className='flex-1'>
                <label className='block text-sm font-medium text-gray-700 mb-2'>Sort By</label>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none'
                >
                  <option value='name'>Project Name</option>
                  <option value='members'>Member Count</option>
                  <option value='semester'>Semester</option>
                </select>
              </div>
              <div className='flex items-end'>
                <button
                  onClick={() => {
                    setSearchTerm('')
                    setSelectedSemester('all')
                    setSortBy('name')
                  }}
                  className='px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors'
                >
                  Clear All
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Main Content */}
        <div className='grid grid-cols-1 xl:grid-cols-5 gap-6'>
          {/* Teams List */}
          <div className='xl:col-span-2 space-y-4'>
            <div className='flex items-center justify-between mb-4'>
              <h2 className='text-xl font-bold text-gray-900 flex items-center gap-2'>
                <Users className='h-6 w-6 text-blue-600' />
                Teams <span className='text-blue-600'>({filteredTeams.length})</span>
              </h2>
            </div>
            
            <div className='bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden'>
              <div className='bg-gradient-to-r from-gray-50 to-gray-100 px-4 py-3 border-b border-gray-200'>
                <p className='text-sm font-medium text-gray-700'>
                  {filteredTeams.length === 0 ? 'No teams available' : 'Click on a team to view details'}
                </p>
              </div>
              
              <div className='max-h-[65vh] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100'>
                {loading ? (
                  <div className='p-12 text-center'>
                    <div className='inline-block animate-spin rounded-full h-10 w-10 border-4 border-blue-600 border-t-transparent'></div>
                    <p className='mt-4 text-gray-600 font-medium'>Loading teams...</p>
                  </div>
                ) : filteredTeams.length === 0 ? (
                  <div className='p-12 text-center text-gray-500'>
                    <div className='bg-gray-100 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-4'>
                      <Users className='h-10 w-10 text-gray-400' />
                    </div>
                    <h3 className='text-lg font-semibold text-gray-700 mb-2'>No teams found</h3>
                    <p className='text-gray-500'>Try adjusting your search or filters</p>
                  </div>
                ) : (
                  <div className='divide-y divide-gray-100'>
                    {filteredTeams.map((team: any, index: number) => (
                      <div
                        key={team.projectId}
                        className={`group relative p-5 hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 cursor-pointer transition-all duration-300 ${
                          selected?.projectId === team.projectId 
                            ? 'bg-gradient-to-r from-blue-50 to-indigo-50 border-r-4 border-blue-500 shadow-md' 
                            : 'hover:shadow-sm'
                        }`}
                        onClick={() => openTeam(team.projectId)}
                      >
                        {/* Project Number Badge */}
                        <div className='absolute top-3 right-4 opacity-30 group-hover:opacity-50 transition-opacity'>
                          <span className='text-xs font-bold text-gray-400'>#{index + 1}</span>
                        </div>

                        <div className='flex items-start gap-4'>
                          {/* Team Icon */}
                          <div className={`flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center ${
                            selected?.projectId === team.projectId 
                              ? 'bg-blue-600 text-white' 
                              : 'bg-gray-100 text-gray-600 group-hover:bg-blue-100 group-hover:text-blue-600'
                          } transition-colors`}>
                            <Users className='h-6 w-6' />
                          </div>

                          <div className='flex-1 min-w-0'>
                            {/* Project Title */}
                            <h3 className='font-bold text-gray-900 text-lg mb-1 truncate group-hover:text-blue-900 transition-colors'>
                              {team.projectTitle}
                            </h3>
                            
                            {/* Project Description Preview */}
                            {team.projectDescription && (
                              <p className='text-sm text-gray-600 mb-3 line-clamp-2 leading-relaxed'>
                                {team.projectDescription.length > 80 
                                  ? team.projectDescription.substring(0, 80) + '...'
                                  : team.projectDescription
                                }
                              </p>
                            )}

                            {/* Team Info */}
                            <div className='flex flex-wrap items-center gap-3'>
                              <div className='flex items-center gap-1.5 px-3 py-1 bg-white rounded-full shadow-sm border'>
                                <Calendar className='h-3.5 w-3.5 text-purple-500' />
                                <span className='text-xs font-medium text-gray-700'>{team.semester}</span>
                              </div>
                              
                              <div className='flex items-center gap-1.5 px-3 py-1 bg-white rounded-full shadow-sm border'>
                                <Users className='h-3.5 w-3.5 text-green-500' />
                                <span className='text-xs font-medium text-gray-700'>
                                  {team.totalMembers || 0} member{(team.totalMembers || 0) !== 1 ? 's' : ''}
                                </span>
                              </div>

                              {/* Team Size Indicator */}
                              <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                                (team.totalMembers || 0) === 0 
                                  ? 'bg-red-100 text-red-700' 
                                  : (team.totalMembers || 0) <= 3 
                                    ? 'bg-yellow-100 text-yellow-700'
                                    : 'bg-green-100 text-green-700'
                              }`}>
                                {(team.totalMembers || 0) === 0 ? 'Empty' : (team.totalMembers || 0) <= 3 ? 'Small' : 'Active'}
                              </div>
                            </div>
                          </div>

                          {/* Selection Indicator */}
                          {selected?.projectId === team.projectId && (
                            <div className='flex-shrink-0 flex items-center'>
                              <div className='w-3 h-3 bg-blue-500 rounded-full animate-pulse'></div>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Team Details */}
          <div className='xl:col-span-3'>
            <div className='bg-white rounded-xl shadow-sm border min-h-[70vh]'>
              {!selected ? (
                <div className='p-8 text-center text-gray-500'>
                  <Users className='h-16 w-16 mx-auto text-gray-300 mb-4' />
                  <h3 className='text-lg font-medium text-gray-900 mb-2'>Select a team</h3>
                  <p>Choose a team from the list to view details and members</p>
                </div>
              ) : (
                <div className='p-6'>
                  {/* Project Header */}
                  <div className='border-b pb-6 mb-6'>
                    <div className='flex items-start justify-between'>
                      <div className='flex-1'>
                        <h2 className='text-2xl font-bold text-gray-900 mb-2'>
                          {selected.projectTitle}
                        </h2>
                        <p className='text-gray-600 mb-4 leading-relaxed'>
                          {selected.projectDescription}
                        </p>
                        <div className='flex items-center gap-6 text-sm'>
                          <span className='flex items-center gap-2 text-gray-600'>
                            <Calendar className='h-4 w-4' />
                            <span className='font-medium'>Semester:</span>
                            {selected.semester}
                          </span>
                          <span className='flex items-center gap-2 text-gray-600'>
                            <Users className='h-4 w-4' />
                            <span className='font-medium'>Members:</span>
                            {selected.members?.length || 0}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Members Section */}
                  <div>
                    <h3 className='text-lg font-semibold text-gray-900 mb-4'>Team Members</h3>
                    {selected.members && selected.members.length > 0 ? (
                      <div className='space-y-3'>
                        {selected.members.map((member: any) => (
                          <div
                            key={member.id}
                            className='flex items-center gap-4 p-4 border border-gray-200 rounded-lg hover:shadow-md transition-shadow'
                          >
                            <div className='relative'>
                              <img
                                src={member.avatar}
                                alt={member.fullName}
                                className='w-12 h-12 rounded-full object-cover border-2 border-gray-200'
                              />
                              {member.role === 'Leader' && (
                                <div className='absolute -top-1 -right-1 w-4 h-4 bg-yellow-400 rounded-full border-2 border-white'></div>
                              )}
                            </div>
                            <div className='flex-1 min-w-0'>
                              <div className='flex items-center gap-2 mb-1'>
                                <h4 className='font-semibold text-gray-900 truncate'>
                                  {member.fullName}
                                </h4>
                                <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                                  member.role === 'Leader' 
                                    ? 'bg-yellow-100 text-yellow-800'
                                    : 'bg-gray-100 text-gray-700'
                                }`}>
                                  {member.role}
                                </span>
                              </div>
                              <div className='flex items-center gap-4 text-sm text-gray-500'>
                                <span className='flex items-center gap-1'>
                                  <Mail className='h-3 w-3' />
                                  {member.email}
                                </span>
                                <span className='flex items-center gap-1'>
                                  <Hash className='h-3 w-3' />
                                  {member.studentId}
                                </span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className='text-center py-8 text-gray-500'>
                        <User className='h-12 w-12 mx-auto text-gray-300 mb-2' />
                        <p>No members assigned to this team</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  )
}
