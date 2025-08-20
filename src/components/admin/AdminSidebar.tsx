import { Calendar, ChevronLeft, ChevronRight, Layout, Users, X } from 'lucide-react'
import { NavLink } from 'react-router-dom'

interface AdminSidebarProps {
  isOpen?: boolean
  onClose?: () => void
  isCollapsed?: boolean
  onToggleCollapse?: () => void
}

export default function AdminSidebar({ isOpen = true, onClose, isCollapsed = false, onToggleCollapse }: AdminSidebarProps) {
  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && <div className='fixed inset-0 bg-black bg-opacity-50 z-20 lg:hidden' onClick={onClose} />}

      {/* Sidebar */}
      <div
        className={`
        ${isCollapsed ? 'w-16' : 'w-64'} min-h-screen bg-white border-r border-gray-200 flex flex-col py-4 sm:py-6
        fixed lg:relative z-[9990] lg:z-auto transition-all duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}
      >
        <div className='px-4 sm:px-6 mb-6 sm:mb-8 flex items-center justify-between'>
          <h2 className={`text-lg sm:text-xl font-bold text-gray-800 transition-opacity ${isCollapsed ? 'opacity-0 hidden' : 'opacity-100'}`}>
            Admin Menu
          </h2>
          <div className='flex items-center gap-2'>
            {/* Toggle collapse button - chỉ hiện trên desktop */}
            <button 
              onClick={onToggleCollapse} 
              className='hidden lg:flex p-1 hover:bg-gray-100 rounded transition-colors'
              title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            >
              {isCollapsed ? <ChevronRight className='h-4 w-4' /> : <ChevronLeft className='h-4 w-4' />}
            </button>
            {/* Close button - chỉ hiện trên mobile */}
            <button onClick={onClose} className='lg:hidden p-1 hover:bg-gray-100 rounded'>
              <X className='h-5 w-5' />
            </button>
          </div>
        </div>
        
        <nav className='flex-1 flex flex-col gap-1 sm:gap-2 px-2'>
          <NavLink
            to='/admin/dashboard'
            className={({ isActive }) =>
              `flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-2 rounded-lg text-sm sm:text-base font-medium transition-colors ${
                isActive ? 'bg-blue-100 text-blue-700' : 'text-gray-700 hover:bg-gray-100 hover:text-blue-700'
              }`
            }
            onClick={onClose}
            title={isCollapsed ? 'Dashboard' : undefined}
          >
            <Layout className='h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0' />
            <span className={`transition-opacity ${isCollapsed ? 'opacity-0 hidden' : 'opacity-100'}`}>
              Dashboard
            </span>
          </NavLink>
          
          <NavLink
            to='/admin/users'
            className={({ isActive }) =>
              `flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-2 rounded-lg text-sm sm:text-base font-medium transition-colors ${
                isActive ? 'bg-blue-100 text-blue-700' : 'text-gray-700 hover:bg-gray-100 hover:text-blue-700'
              }`
            }
            onClick={onClose}
            title={isCollapsed ? 'User Management' : undefined}
          >
            <Users className='h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0' />
            <span className={`transition-opacity ${isCollapsed ? 'opacity-0 hidden' : 'opacity-100'}`}>
              User Management
            </span>
          </NavLink>
          
          <NavLink
            to='/admin/terms'
            className={({ isActive }) =>
              `flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-2 rounded-lg text-sm sm:text-base font-medium transition-colors ${
                isActive ? 'bg-blue-100 text-blue-700' : 'text-gray-700 hover:bg-gray-100 hover:text-blue-700'
              }`
            }
            onClick={onClose}
            title={isCollapsed ? 'Term Management' : undefined}
          >
            <Calendar className='h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0' />
            <span className={`transition-opacity ${isCollapsed ? 'opacity-0 hidden' : 'opacity-100'}`}>
              Term Management
            </span>
          </NavLink>

          <NavLink
            to='/admin/projects'
            className={({ isActive }) =>
              `flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-2 rounded-lg text-sm sm:text-base font-medium transition-colors ${
                isActive ? 'bg-blue-100 text-blue-700' : 'text-gray-700 hover:bg-gray-100 hover:text-blue-700'
              }`
            }
            onClick={onClose}
            title={isCollapsed ? 'Projects' : undefined}
          >
            <Layout className='h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0' />
            <span className={`transition-opacity ${isCollapsed ? 'opacity-0 hidden' : 'opacity-100'}`}>
              Projects Management
            </span>
          </NavLink>

          <NavLink
            to='/admin/teams'
            className={({ isActive }) =>
              `flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-2 rounded-lg text-sm sm:text-base font-medium transition-colors ${
                isActive ? 'bg-blue-100 text-blue-700' : 'text-gray-700 hover:bg-gray-100 hover:text-blue-700'
              }`
            }
            onClick={onClose}
            title={isCollapsed ? 'Teams' : undefined}
          >
            <Users className='h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0' />
            <span className={`transition-opacity ${isCollapsed ? 'opacity-0 hidden' : 'opacity-100'}`}>
              Teams Management
            </span>
          </NavLink>
        </nav>
        
        {/* Footer section */}
        <div className={`px-4 sm:px-6 mt-auto pt-4 border-t border-gray-200 transition-opacity ${isCollapsed ? 'opacity-0 hidden' : 'opacity-100'}`}>
          <div className='text-xs text-gray-500 text-center'>
            Admin Panel By  Taskflow
          </div>
        </div>
      </div>
    </>
  )
}
