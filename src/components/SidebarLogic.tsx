import { projectApi } from '@/api/projects'
import { useGitHubStatus } from '@/contexts/GitHubStatusContext'
import gsap from 'gsap'
import { CheckCircle, LucideLayoutDashboard, Loader2, XCircle } from 'lucide-react'
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import {
  FiAlertCircle,
  FiBarChart2,
  FiCalendar,
  FiClock,
  FiGitBranch,
  FiGithub,
  FiLayers,
  FiSettings,
  FiUsers
} from 'react-icons/fi'
import { useLocation, useNavigate } from 'react-router-dom'

export const SidebarLogic = ({ projectId }: { projectId?: string }) => {
  const navigate = useNavigate()
  const location = useLocation()
  const [hoveredTab, setHoveredTab] = useState<string | null>(null)
  const highlightRef = useRef<HTMLDivElement>(null)
  const navRef = useRef<HTMLDivElement>(null)
  const lastHoveredTabRef = useRef<string | null>(null)
  const initializedRef = useRef(false)

  // Use hook to get global GitHub status
  const { connectionStatus, isLoading } = useGitHubStatus()

  // Extract project ID from URL to ensure we always have it when on project routes
  const currentPath = location.pathname
  const projectIdMatch = currentPath.match(/\/projects\/([^/]+)/)
  const urlProjectId = projectIdMatch ? projectIdMatch[1] : null
  const activeProjectId = projectId || urlProjectId

  const navItems = useMemo(
    () => [
      {
        id: 'timeline',
        icon: <FiClock className='h-5 w-5' />,
        label: 'Timeline',
        section: 1,
        path: activeProjectId ? `/projects/${activeProjectId}/timeline` : '/timeline'
      },
      {
        id: 'board',
        icon: <LucideLayoutDashboard className='h-5 w-5' />,
        label: 'Board',
        section: 1,
        path: activeProjectId ? `/projects/${activeProjectId}/board` : '/board'
      },
      {
        id: 'backlog',
        icon: <FiLayers className='h-5 w-5' />,
        label: 'Backlog',
        section: 1,
        path: activeProjectId ? `/projects/${activeProjectId}/backlog` : '/backlog'
      },
      {
        id: 'members',
        icon: <FiUsers className='h-5 w-5' />,
        label: 'Members',
        section: 1,
        path: activeProjectId ? `/projects/${activeProjectId}/members` : '/members'
      },
      {
        id: 'reports',
        icon: <FiBarChart2 className='h-5 w-5' />,
        label: 'Reports',
        section: 1,
        path: activeProjectId ? `/projects/${activeProjectId}/reports` : '/reports'
      },
      {
        id: 'sprint-meetings',
        icon: <FiCalendar className='h-5 w-5' />,
        label: 'Sprint Meetings',
        section: 1,
        path: activeProjectId ? `/projects/${activeProjectId}/sprint-meetings` : '/projects'
      },
      // Section 2: GitHub, Commits, Issues
      {
        id: 'github',
        icon: <FiGithub className='h-5 w-5' />,
        label: 'GitHub',
        section: 2,
        path: activeProjectId ? `/projects/${activeProjectId}/github` : '/github'
      },
      {
        id: 'commits',
        icon: <FiGitBranch className='h-5 w-5' />,
        label: 'Commits',
        section: 2,
        path: activeProjectId ? `/projects/${activeProjectId}/commits` : '/commits'
      },
      {
        id: 'issues',
        icon: <FiAlertCircle className='h-5 w-5' />,
        label: 'Issues',
        section: 2,
        path: activeProjectId ? `/projects/${activeProjectId}/issues` : '/issues'
      },
      {
        id: 'allparts',
        icon: <FiLayers className='h-5 w-5' />,
        label: 'All Parts',
        section: 2,
        path: '/all-parts'
      },
      { id: 'settings', icon: <FiSettings className='h-5 w-5' />, label: 'Settings', section: 3, path: '/settings' }
    ],
    [activeProjectId]
  )

  // Helper to derive active tab from current URL and navItems
  const deriveActiveTabFromPath = (): string | null => {
    const path = location.pathname
    const searchParams = new URLSearchParams(location.search)
    const viewParam = searchParams.get('view')

    // Try exact path match first
    let activeItem = navItems.find((item) => item.path === path)

    // If in project context, match by route segment
    if (!activeItem && path.includes('/projects/')) {
      const lastSegment = path.split('/').pop() || ''
      activeItem = navItems.find((item) => {
        const itemLastSegment = item.path.split('/').pop() || ''
        return itemLastSegment === lastSegment
      })
    }

    // Special handling for /projects root
    if (!activeItem) {
      if (path === '/projects' && viewParam === 'sprint-meetings') {
        activeItem = navItems.find((item) => item.id === 'sprint-meetings')
      } else if (path !== '/projects') {
        // Try to match by id inferred from path ending
        const pathEnd = path.split('/').pop() || ''
        // Map special slugs to ids
        const slugToId: Record<string, string> = {
          'all-parts': 'allparts'
        }
        const candidateId = slugToId[pathEnd] ?? pathEnd
        activeItem = navItems.find((item) => item.id === candidateId)
      }
    }

    return activeItem?.id ?? null
  }

  // Initialize active tab from current location to avoid a temporary jump to the default
  const [activeTab, setActiveTab] = useState<string>(() => deriveActiveTabFromPath() ?? 'board')

  // Position the highlight for the current active tab. On first layout pass, set instantly to avoid flicker.
  useLayoutEffect(() => {
    updateHighlightPosition(activeTab, { animate: initializedRef.current })
    if (!initializedRef.current) initializedRef.current = true
  }, [activeTab])

  useEffect(() => {
    const derived = deriveActiveTabFromPath()
    if (derived && derived !== activeTab) {
      setActiveTab(derived)
    } else if (!derived) {
      // Keep highlight in sync when no derivation possible (e.g., /projects root)
      updateHighlightPosition(activeTab)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname, location.search, activeProjectId, navItems])

  const updateHighlightPosition = (tabId: string, opts?: { animate?: boolean }) => {
    const highlight = highlightRef.current
    const navContainer = navRef.current
    if (!highlight || !navContainer) return

    const targetElement = navContainer.querySelector(`[data-tab-id="${tabId}"]`) as HTMLElement
    if (!targetElement) return

    const navRect = navContainer.getBoundingClientRect()
    const targetRect = targetElement.getBoundingClientRect()
    const relativeTop = targetRect.top - navRect.top

    // Avoid conflicting tweens
    gsap.killTweensOf(highlight)

    if (opts?.animate ?? true) {
      gsap.to(highlight, {
        y: relativeTop,
        duration: 0.5,
        ease: 'elastic.out(1,0.7)'
      })
    } else {
      gsap.set(highlight, { y: relativeTop })
    }
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    const navContainer = navRef.current
    if (!navContainer) return

    const tabElements = Array.from(navContainer.querySelectorAll('[data-tab-id]')) as HTMLElement[]

    const navRect = navContainer.getBoundingClientRect()
    const mouseY = e.clientY - navRect.top

    let closestTab = null
    let closestDistance = Infinity

    tabElements.forEach((tab) => {
      const tabRect = tab.getBoundingClientRect()
      const tabCenter = (tabRect.top + tabRect.bottom) / 2 - navRect.top
      const distance = Math.abs(mouseY - tabCenter)

      if (distance < closestDistance) {
        closestDistance = distance
        closestTab = tab.getAttribute('data-tab-id')
      }
    })

    if (closestTab && closestTab !== hoveredTab) {
      lastHoveredTabRef.current = closestTab
      setHoveredTab(closestTab)
      updateHighlightPosition(closestTab)
    }
  }

  const handleMouseLeave = () => {
    setHoveredTab(null)
    updateHighlightPosition(activeTab)
  }

  const handleClick = async (tabId: string) => {
    console.log('[SidebarLogic] handleClick called with tabId:', tabId)

    // Set active tab immediately for better UX
    setActiveTab(tabId)
    setHoveredTab(null)

    const targetTab = navItems.find((item) => item.id === tabId)
    console.log('[SidebarLogic] targetTab found:', targetTab)

    if (targetTab) {
      console.log('[SidebarLogic] navigating to path:', targetTab.path)

      // Special handling for sprint-meetings when no project is selected
      if (tabId === 'sprint-meetings' && !activeProjectId) {
        try {
          const response = await projectApi.getProjects()
          if (response.data && response.data.length > 0) {
            const firstProject = response.data[0]
            navigate(`/projects/${firstProject.id}/sprint-meetings`)
            return
          }
        } catch (error) {
          console.error('Failed to get projects for sprint meetings:', error)
        }
        navigate('/projects')
        return
      }

      // Simply navigate to the pre-computed path
      navigate(targetTab.path)
    }
  }

  const getTabStyles = (tabId: string) => {
    if (activeTab === tabId) {
      return {
        background: 'bg-lavender-700/15',
        text: 'text-lavender-700',
        icon: 'text-lavender-700'
      }
    } else if (hoveredTab === tabId) {
      return {
        background: 'bg-lavender-700/5',
        text: 'text-lavender-500',
        icon: 'text-lavender-500'
      }
    }
    return {
      background: '',
      text: 'text-gray-600',
      icon: 'text-gray-500'
    }
  }

  // GitHub status badge component that matches your sidebar styling
  const GitHubStatusBadge = () => {
    if (isLoading) {
      return (
        <div className='ml-auto flex items-center gap-1'>
          <Loader2 className='h-4 w-4 animate-spin text-gray-500' />
          <span className='text-xs text-gray-500 font-normal'>Checking</span>
        </div>
      )
    }

    if (connectionStatus === true) {
      return (
        <div className='ml-auto flex items-center gap-1 bg-green-50 px-2 py-1 rounded-full border border-green-200'>
          <CheckCircle className='h-4 w-4 text-green-600' />
          <span className='text-xs text-green-700 font-medium'>Connected</span>
        </div>
      )
    }

    if (connectionStatus === false) {
      return (
        <div className='ml-auto flex items-center gap-1 bg-orange-50 px-2 py-1 rounded-full border border-orange-200'>
          <XCircle className='h-4 w-4 text-orange-600' />
          <span className='text-xs text-orange-700 font-medium'>Unlinked</span>
        </div>
      )
    }

    // connectionStatus === null
    return (
      <div className='ml-auto flex items-center gap-1 bg-gray-50 px-2 py-1 rounded-full border border-gray-200'>
        <span className='text-xs text-gray-600 font-medium'>Unknown</span>
      </div>
    )
  }

  const renderSection = (sectionNumber: number) => {
    const sectionItems = navItems.filter((item) => item.section === sectionNumber)
    console.log(
      `[SidebarLogic] renderSection ${sectionNumber} - items:`,
      sectionItems.map((item) => item.id)
    )

    return (
      <div className='relative' onMouseMove={handleMouseMove}>
        {sectionItems.map((item) => {
          return (
            <div
              key={item.id}
              data-tab-id={item.id}
              className={`relative flex items-center gap-3 px-2 py-3 cursor-pointer rounded-md transition-colors duration-200 ${getTabStyles(item.id).text}`}
              onClick={() => {
                console.log(`[SidebarLogic] ${item.id} item clicked`)
                handleClick(item.id)
              }}
            >
              <div className={`transition-colors duration-200 ${getTabStyles(item.id).icon}`}>{item.icon}</div>
              <span className='font-medium'>{item.label}</span>
              {/* Add GitHub status badge only for GitHub item */}
              {item.id === 'github' && <GitHubStatusBadge />}
            </div>
          )
        })}
      </div>
    )
  }

  return (
    <div className='relative' ref={navRef} onMouseLeave={handleMouseLeave}>
      <div
        ref={highlightRef}
        className={`absolute left-0 right-0 h-12 rounded-md transition-colors duration-200
          ${hoveredTab && hoveredTab !== activeTab ? 'bg-lavender-700/5' : 'bg-lavender-700/15'}`}
        style={{ pointerEvents: 'none' }}
      />

      {renderSection(1)}
      <div className='border-b border-gray-300 my-4' />
      {renderSection(2)}
      <div className='border-b border-gray-300 my-4' />
      {renderSection(3)}
    </div>
  )
}
