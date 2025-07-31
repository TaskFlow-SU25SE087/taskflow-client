import { projectApi } from '@/api/projects'
import gsap from 'gsap'
import { LucideLayoutDashboard } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
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
import GitHubSidebarItem from './github/GitHubSidebarItem'

export const SidebarLogic = ({ projectId, connectionStatus }: { projectId?: string, connectionStatus?: boolean | null }) => {
  const [activeTab, setActiveTab] = useState('board')
  const [hoveredTab, setHoveredTab] = useState<string | null>(null)
  const highlightRef = useRef<HTMLDivElement>(null)
  const navRef = useRef<HTMLDivElement>(null)
  const lastHoveredTabRef = useRef<string | null>(null)
  const navigate = useNavigate()
  const location = useLocation()

  useEffect(() => {
    updateHighlightPosition(activeTab)
  }, [activeTab])

  const navItems = [
    {
      id: 'timeline',
      icon: <FiClock className='h-5 w-5' />,
      label: 'Timeline',
      section: 1,
      path: projectId ? `/projects/${projectId}/timeline` : '/timeline'
    },
    {
      id: 'board',
      icon: <LucideLayoutDashboard className='h-5 w-5' />,
      label: 'Board',
      section: 1,
      path: projectId ? `/projects/${projectId}/board` : '/board'
    },
    {
      id: 'backlog',
      icon: <FiLayers className='h-5 w-5' />,
      label: 'Backlog',
      section: 1,
      path: projectId ? `/projects/${projectId}/backlog` : '/backlog'
    },
    {
      id: 'members',
      icon: <FiUsers className='h-5 w-5' />,
      label: 'Members',
      section: 1,
      path: projectId ? `/projects/${projectId}/members` : '/members'
    },
  
    {
      id: 'reports',
      icon: <FiBarChart2 className='h-5 w-5' />,
      label: 'Reports',
      section: 1,
      path: projectId ? `/projects/${projectId}/reports` : '/reports'
    },
    {
      id: 'sprint-meetings',
      icon: <FiCalendar className='h-5 w-5' />,
      label: 'Sprint Meetings',
      section: 1,
      path: projectId ? `/projects/${projectId}/sprint-meetings` : '/projects'
    },
    // Section 2: GitHub, Commits, Issues
    {
      id: 'github',
      icon: <FiGithub className='h-5 w-5' />,
      label: 'GitHub',
      section: 2,
      path: projectId ? `/projects/${projectId}/github` : '/github'
    },
    {
      id: 'commits',
      icon: <FiGitBranch className='h-5 w-5' />,
      label: 'Commits',
      section: 2,
      path: projectId ? `/projects/${projectId}/commits` : '/commits'
    },
    {
      id: 'issues',
      icon: <FiAlertCircle className='h-5 w-5' />,
      label: 'Issues',
      section: 2,
      path: projectId ? `/projects/${projectId}/issues` : '/issues'
    },
    {
      id: 'allparts',
      icon: <FiLayers className='h-5 w-5' />,
      label: 'All Parts',
      section: 2,
      path: '/all-parts'
    },
    {
      id: 'codequality',
      icon: <FiBarChart2 className='h-5 w-5' />,
      label: 'Code Quality',
      section: 2,
      path: '/code-quality-commits'
    },
    {
      id: 'projects',
      icon: <FiLayers className='h-5 w-5' />,
      label: 'Projects',
      section: 2,
      path: '/projects'
    },
    { id: 'settings', icon: <FiSettings className='h-5 w-5' />, label: 'Settings', section: 3, path: '/settings' }
  ]

  useEffect(() => {
    const currentPath = location.pathname
    const activeItem = navItems.find((item) => item.path === currentPath)
    if (activeItem) {
      setActiveTab(activeItem.id) // Update the activeTab state
      updateHighlightPosition(activeItem.id)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname])

  const updateHighlightPosition = (tabId: string) => {
    const highlight = highlightRef.current
    const navContainer = navRef.current
    if (!highlight || !navContainer) return

    const targetElement = navContainer.querySelector(`[data-tab-id="${tabId}"]`) as HTMLElement
    if (!targetElement) return

    const navRect = navContainer.getBoundingClientRect()
    const targetRect = targetElement.getBoundingClientRect()
    const relativeTop = targetRect.top - navRect.top

    gsap.to(highlight, {
      y: relativeTop,
      duration: 0.5,
      ease: 'elastic.out(1,0.7)'
    })
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
    setActiveTab(tabId)
    const targetTab = navItems.find((item) => item.id === tabId)
    
    if (targetTab) {
      // Special handling for sprint-meetings when no project is selected
      if (tabId === 'sprint-meetings' && !projectId) {
        try {
          // Get the first available project
          const response = await projectApi.getProjects()
          if (response.data && response.data.length > 0) {
            const firstProject = response.data[0]
            navigate(`/projects/${firstProject.id}/sprint-meetings`)
            return
          }
        } catch (error) {
          console.error('Failed to get projects for sprint meetings:', error)
        }
        // Fallback to projects page if no projects available
        navigate('/projects')
        return
      }
      
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

  const renderSection = (sectionNumber: number) => {
    const sectionItems = navItems.filter((item) => item.section === sectionNumber)

    return (
      <div className='relative' onMouseMove={handleMouseMove}>
        {sectionItems.map((item) => {
          // Show all items normally - let them navigate even without project

          // Special handling for GitHub item
          if (item.id === 'github') {
            return (
              <div
                key={item.id}
                data-tab-id={item.id}
                className={`relative flex items-center gap-3 px-2 py-3 cursor-pointer rounded-md transition-colors duration-200 ${getTabStyles(item.id).text}`}
                onClick={() => handleClick(item.id)}
              >
                <GitHubSidebarItem connectionStatus={connectionStatus} />
              </div>
            )
          }

          // Regular items
          return (
            <div
              key={item.id}
              data-tab-id={item.id}
              className={`relative flex items-center gap-3 px-2 py-3 cursor-pointer rounded-md transition-colors duration-200
                ${getTabStyles(item.id).text}`}
              onClick={() => handleClick(item.id)}
            >
              <div className={`transition-colors duration-200 ${getTabStyles(item.id).icon}`}>{item.icon}</div>
              <span className='font-medium'>{item.label}</span>
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
