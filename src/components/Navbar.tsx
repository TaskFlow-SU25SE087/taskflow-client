import { Button } from '@/components/ui/button'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuGroup,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
import { useAuth } from '@/hooks/useAuth'
import { useCurrentProject } from '@/hooks/useCurrentProject'
import { useProjects } from '@/hooks/useProjects'
import Avatar from 'boring-avatars'
import {
    ChevronDown,
    FolderKanban,
    HelpCircle,
    Layout,
    LogOut,
    Plus,
    Settings,
    Shield,
    User
} from 'lucide-react'
import { useState } from 'react'
import { FiMenu, FiX } from 'react-icons/fi'
import { useNavigate } from 'react-router-dom'
import { GlobalSearch } from './GlobalSearch'
import NotificationCenter from './NotificationCenter'
import SearchErrorBoundary from './SearchErrorBoundary'
import { TutorialModal } from './TutorialModal'

interface NavbarProps {
  isSidebarOpen: boolean
  toggleSidebar: () => void
}

export function Navbar({ isSidebarOpen, toggleSidebar }: NavbarProps) {
  const { projects } = useProjects()
  const { currentProject, setCurrentProjectId } = useCurrentProject()
  const navigate = useNavigate()
  const { logout } = useAuth()
  const { user } = useAuth()
  const [isTutorialOpen, setIsTutorialOpen] = useState(false)

  console.log('user in Navbar:', user)

  const handleProjectSelect = (projectId: string) => {
    setCurrentProjectId(projectId)
    navigate('/board')
  }

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  return (
    <div className='sticky top-0 z-10 w-full bg-white border-b border-gray-300'>
      <div className='px-2 sm:px-4 py-2 sm:py-3 flex items-center justify-between'>
        <div className='flex items-center gap-1 sm:gap-2 flex-1'>
          <Button
            variant='ghost'
            size='icon'
            className='text-gray-500 hover:bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 h-8 w-8 sm:h-10 sm:w-10'
            onClick={toggleSidebar}
          >
            {isSidebarOpen ? (
              <FiX className='h-4 w-4 sm:h-5 sm:w-5' />
            ) : (
              <FiMenu className='h-4 w-4 sm:h-5 sm:w-5' />
            )}
          </Button>

          {/* Projects Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant='ghost'
                className='gap-1 sm:gap-2 font-medium focus-visible:ring-0 focus-visible:ring-offset-0 focus:outline-none text-sm sm:text-base h-8 sm:h-10 px-2 sm:px-4'
              >
                <span className='hidden sm:inline'>Projects</span>
                <span className='sm:hidden'>Proj</span>
                <ChevronDown className='h-3 w-3 sm:h-4 sm:w-4 text-gray-500' />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className='w-56 sm:w-64'>
              <DropdownMenuLabel className='text-base sm:text-lg'>Your Projects</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuGroup>
                {projects.map((project) => (
                  <DropdownMenuItem
                    key={project.id}
                    onClick={() => handleProjectSelect(project.id)}
                    className={`cursor-pointer gap-2 ${currentProject?.id === project.id ? 'bg-gray-100' : ''}`}
                  >
                    <Layout className='h-4 w-4' />
                    <span className={currentProject?.id === project.id ? 'font-medium' : ''}>{project.title}</span>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuGroup>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => navigate('/projects')}
                className='gap-2 text-gray-600 hover:text-gray-900'
              >
                <FolderKanban className='h-4 w-4 cursor-pointer' />
                View all projects
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => navigate('/projects/new')}
                className='gap-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50'
              >
                <Plus className='h-4 w-4 cursor-pointer' />
                Create new project
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Teams Dropdown - Hidden on mobile */}
          {/* <div className='hidden md:block'>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant='ghost'
                  className='gap-2 focus-visible:ring-0 focus-visible:ring-offset-0 focus:outline-none'
                >
                  Teams
                  <ChevronDown className='h-4 w-4' />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className='w-56'>
                <DropdownMenuItem className='cursor-not-allowed opacity-50'>Coming soon...</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div> */}
        </div>
        {/* Global Search Bar ở giữa */}
        <div className='flex-1 flex justify-center'>
          <SearchErrorBoundary>
            <GlobalSearch />
          </SearchErrorBoundary>
        </div>

        <div className='flex items-center gap-2 sm:gap-4'>
          {/* Help Icon - Hidden on mobile */}
          <div 
            className='hidden md:block text-gray-500 px-2 hover:bg-transparent cursor-pointer hover:text-blue-600 transition-colors'
            onClick={() => setIsTutorialOpen(true)}
          >
            <HelpCircle className='h-5 w-5' />
          </div>

          {/* Notification Center */}
          <NotificationCenter />

          {/* Profile Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <div className='cursor-pointer relative h-8 w-fit flex items-center gap-1 sm:gap-2 px-0 hover:bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 focus:outline-none'>
                {user?.avatar ? (
                  <img src={user.avatar} alt='avatar' className='w-7 h-7 sm:w-8 sm:h-8 rounded-full object-cover' />
                ) : (
                  <Avatar size='28px' variant='beam' name={user?.id || 'unknown'} className='sm:w-8 sm:h-8' />
                )}
                {/* Ẩn tên và mũi tên */}
                {/* <span className='hidden sm:block ml-2 font-medium text-black text-sm'>
                  {user?.fullName || user?.email || 'No name'}
                </span>
                <ChevronDown className='hidden sm:block h-4 w-4 text-gray-500' /> */}
              </div>
            </DropdownMenuTrigger>
            <DropdownMenuContent className='w-56' align='end'>
              <DropdownMenuItem
                onClick={() => navigate('/profile')}
                className='gap-2 text-gray-600 hover:text-gray-900'
              >
                <User className='h-4 w-4' />
                Profile
              </DropdownMenuItem>
              <DropdownMenuItem className='gap-2 text-gray-600 hover:text-gray-900'>
                <Settings className='h-4 w-4' />
                Settings
              </DropdownMenuItem>
              {(user?.role === 'Admin' || user?.role === 'admin' || user?.role === 0 || user?.role === '0') && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => navigate('/admin/dashboard')}
                    className='gap-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50'
                  >
                    <Layout className='h-4 w-4' />
                    Admin Dashboard
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => navigate('/admin/users')}
                    className='gap-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50'
                  >
                    <Shield className='h-4 w-4' />
                    Admin Panel
                  </DropdownMenuItem>
                </>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={handleLogout}
                className='gap-2 text-red-600 hover:text-red-700 hover:bg-red-50'
              >
                <LogOut className='h-4 w-4' />
                Log out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Tutorial Modal */}
      <TutorialModal 
        isOpen={isTutorialOpen} 
        onClose={() => setIsTutorialOpen(false)} 
      />
    </div>
  )
}
