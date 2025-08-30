import { SidebarLogic } from '@/components/SidebarLogic'
import { Button } from '@/components/ui/button'
import { FiChevronLeft } from 'react-icons/fi'
import { Link } from 'react-router-dom'

interface MainSidebarProps {
  isOpen: boolean
  onToggle: () => void
  currentProject?: any
}

export const Sidebar = ({ isOpen, onToggle, currentProject }: MainSidebarProps) => {
  console.log('[Sidebar] currentProject:', currentProject)
  console.log('[Sidebar] currentProject?.id:', currentProject?.id)
  console.log('[Sidebar] currentProject type:', typeof currentProject)
  console.log('[Sidebar] currentProject keys:', currentProject ? Object.keys(currentProject) : 'null')
  
  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && <div className='fixed inset-0 bg-black bg-opacity-50 z-20 lg:hidden' onClick={onToggle} />}

      {/* Sidebar */}
      <div
        className={`transition-all duration-300 ease-in-out ${
          isOpen ? 'w-64' : 'w-0'
        } border-r border-gray-300 bg-white overflow-hidden fixed lg:sticky lg:top-0 lg:self-start h-full min-h-screen z-[9991] lg:z-auto`}
      >
        <div className='p-3 sm:p-4 h-full flex flex-col'>
          <div className='flex items-center justify-between pb-3 sm:pb-4 border-b border-gray-300 mb-4 sm:mb-6'>
            <div className='flex items-center gap-2'>
              <Link to='/' className='flex items-center gap-2'>
                <img src='/logo.png' alt='TaskFlow logo' className='h-6 w-6 sm:h-8 sm:w-8' />
                <span className='text-lg sm:text-xl font-semibold text-gray-800'>TaskFlow</span>
              </Link>
            </div>
            <Button variant='ghost' size='icon' className='h-6 w-6 hover:bg-transparent lg:hidden' onClick={onToggle}>
              <FiChevronLeft className='h-4 w-4' />
            </Button>
          </div>
          <div className='flex-1 overflow-y-auto'>
            <SidebarLogic projectId={currentProject?.id} />
          </div>
        </div>
      </div>
    </>
  )
}
