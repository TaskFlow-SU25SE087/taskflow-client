import { Layout, Users, X } from 'lucide-react'
import { NavLink } from 'react-router-dom'

interface AdminSidebarProps {
  isOpen?: boolean
  onClose?: () => void
}

export default function AdminSidebar({ isOpen = true, onClose }: AdminSidebarProps) {
  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && <div className='fixed inset-0 bg-black bg-opacity-50 z-20 lg:hidden' onClick={onClose} />}

      {/* Sidebar */}
      <div
        className={`
        w-64 h-full bg-white border-r border-gray-200 flex flex-col py-4 sm:py-6
        fixed lg:relative z-30 lg:z-auto transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}
      >
        <div className='px-4 sm:px-6 mb-6 sm:mb-8 flex items-center justify-between'>
          <h2 className='text-lg sm:text-xl font-bold text-gray-800'>Admin Menu</h2>
          <button onClick={onClose} className='lg:hidden p-1 hover:bg-gray-100 rounded'>
            <X className='h-5 w-5' />
          </button>
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
          >
            <Layout className='h-4 w-4 sm:h-5 sm:w-5' />
            Dashboard
          </NavLink>
          <NavLink
            to='/admin/users'
            className={({ isActive }) =>
              `flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-2 rounded-lg text-sm sm:text-base font-medium transition-colors ${
                isActive ? 'bg-blue-100 text-blue-700' : 'text-gray-700 hover:bg-gray-100 hover:text-blue-700'
              }`
            }
            onClick={onClose}
          >
            <Users className='h-4 w-4 sm:h-5 sm:w-5' />
            User Management
          </NavLink>
          <NavLink
            to='/admin/terms'
            className={({ isActive }) =>
              `flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-2 rounded-lg text-sm sm:text-base font-medium transition-colors ${
                isActive ? 'bg-blue-100 text-blue-700' : 'text-gray-700 hover:bg-gray-100 hover:text-blue-700'
              }`
            }
            onClick={onClose}
          >
            <span className='h-4 w-4 sm:h-5 sm:w-5'>📅</span>
            Term Management
          </NavLink>
        </nav>
      </div>
    </>
  )
}
