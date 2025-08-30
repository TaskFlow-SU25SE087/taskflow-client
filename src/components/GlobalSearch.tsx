import { Command, CommandEmpty, CommandGroup, CommandItem, CommandList } from '@/components/ui/command'
import { useCurrentProject } from '@/hooks/useCurrentProject'
import { useProjects } from '@/hooks/useProjects'
import { useSprints } from '@/hooks/useSprints'
import { useTasks } from '@/hooks/useTasks'
import { Calendar, CheckSquare, FolderKanban, Search } from 'lucide-react'
import React, { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'

interface SearchResult {
  id: string
  title: string
  type: 'project' | 'task' | 'user' | 'issue' | 'sprint' | 'commit'
  description?: string
  url: string
  icon: React.ReactNode
}

export function GlobalSearch() {
  const [open, setOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const searchRef = useRef<HTMLDivElement>(null)

  const navigate = useNavigate()
  const { projects } = useProjects()
  const { currentProject } = useCurrentProject()
  const { tasks } = useTasks()
  const { sprints } = useSprints()

  // Debounced search
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (searchQuery.trim()) {
        performSearch(searchQuery.trim())
      } else {
        setResults([])
        setIsLoading(false)
      }
    }, 300)

    return () => clearTimeout(timeoutId)
  }, [searchQuery, projects, tasks, sprints, currentProject])

  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  const performSearch = async (query: string) => {
    try {
      setIsLoading(true)
      const searchResults: SearchResult[] = []

      const lowerQuery = query.toLowerCase()

    // Search projects
    if (projects && Array.isArray(projects)) {
      projects.forEach(project => {
        if (project.title.toLowerCase().includes(lowerQuery) ||
            project.description?.toLowerCase().includes(lowerQuery)) {
          searchResults.push({
            id: project.id,
            title: project.title,
            type: 'project',
            description: project.description,
            url: `/projects/${project.id}/board`,
            icon: <FolderKanban className="h-4 w-4" />
          })
        }
      })
    }

    // Search tasks (only if in a project context)
    if (currentProject && tasks && Array.isArray(tasks)) {
      tasks.forEach(task => {
        if (task.title.toLowerCase().includes(lowerQuery) ||
            task.description?.toLowerCase().includes(lowerQuery)) {
          searchResults.push({
            id: task.id,
            title: task.title,
            type: 'task',
            description: task.description,
            url: `/projects/${currentProject.id}/board`,
            icon: <CheckSquare className="h-4 w-4" />
          })
        }
      })
    }

    // Search users/members - temporarily disabled
    // TODO: Implement when useProjectMembers hook is available

    // Search issues - temporarily disabled  
    // TODO: Implement when useIssues hook is available

    // Search sprints
    if (sprints && Array.isArray(sprints)) {
      sprints.forEach(sprint => {
        if (sprint.name.toLowerCase().includes(lowerQuery) ||
            sprint.description?.toLowerCase().includes(lowerQuery)) {
          searchResults.push({
            id: sprint.id,
            title: sprint.name,
            type: 'sprint',
            description: sprint.description,
            url: `/projects/${currentProject?.id}/backlog`,
            icon: <Calendar className="h-4 w-4" />
          })
        }
      })
    }

      setResults(searchResults)
    } catch (error) {
      console.error('Search error:', error)
      setResults([])
    } finally {
      setIsLoading(false)
    }
  }

  const handleSelect = (result: SearchResult) => {
    // Navigate to the result URL
    navigate(result.url)
    
    // Close popover and clear search immediately
    setOpen(false)
    setSearchQuery('')
  }

  const getTypeLabel = (type: SearchResult['type']) => {
    switch (type) {
      case 'project': return 'Project'
      case 'task': return 'Task'
      case 'user': return 'Member'
      case 'issue': return 'Issue'
      case 'sprint': return 'Sprint'
      case 'commit': return 'Commit'
      default: return 'Unknown'
    }
  }

  return (
    <div ref={searchRef} className="relative w-[300px] xl:w-[400px]">
      {/* Main Search Input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 transform text-gray-400" />
        <input
          type="text"
          placeholder="Search for anything..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onFocus={() => setOpen(true)}
          className="w-full rounded-lg bg-gray-100 pl-10 pr-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
        />
      </div>

      {/* Search Results Dropdown */}
      {open && (searchQuery.trim() || results.length > 0) && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-[9983]">
          <Command>
            <CommandList className="max-h-[300px] overflow-y-auto">
            {isLoading && (
              <CommandEmpty>Searching...</CommandEmpty>
            )}
            {!isLoading && results.length === 0 && searchQuery && (
              <CommandEmpty>No results found.</CommandEmpty>
            )}
            {!isLoading && results.length > 0 && (
              <>
                {['project', 'task', 'sprint'].map(type => {
                  const typeResults = results.filter(r => r.type === type)
                  if (typeResults.length === 0) return null

                  return (
                    <CommandGroup key={type} heading={getTypeLabel(type as SearchResult['type'])}>
                      {typeResults.map(result => (
                        <CommandItem
                          key={result.id}
                          onSelect={() => handleSelect(result)}
                          className="flex items-center gap-2 cursor-pointer hover:bg-gray-100"
                        >
                          {result.icon}
                          <div className="flex flex-col flex-1 min-w-0">
                            <span className="font-medium truncate">{result.title}</span>
                            {result.description && (
                              <span className="text-xs text-gray-500 truncate">
                                {result.description}
                              </span>
                            )}
                          </div>
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  )
                })}
              </>
            )}
          </CommandList>
        </Command>
      </div>
    )}
    </div>
  )
} 