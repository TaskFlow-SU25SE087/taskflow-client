import { FiChevronLeft, FiChevronRight } from 'react-icons/fi'
import { Button } from '@/components/ui/button'
import { SidebarLogic } from '@/components/SidebarLogic'
import { Link } from 'react-router-dom'

interface MainSidebarProps {
  isOpen: boolean
  onToggle: () => void
}

export const Sidebar = ({ isOpen, onToggle }: MainSidebarProps) => {
  return (
    <div
      className={`transition-all duration-300 ease-in-out ${
        isOpen ? 'w-64' : 'w-0'
      } border-r border-gray-300 bg-white overflow-hidden`}
    >
      <div className='p-4'>
        <div className='flex items-center justify-between pb-4 border-b border-gray-300 mb-6'>
          <div className='flex items-center gap-2'>
            <Link to='/' className='flex items-center gap-2'>
              <img src='/logo.png' alt='TaskFlow logo' className='h-8 w-8' />
              <span className='text-xl font-semibold text-gray-800'>TaskFlow</span>
            </Link>
          </div>
          <Button variant='ghost' size='icon' className='h-6 w-6 hover:bg-transparent' onClick={onToggle}>
            {isOpen ? <FiChevronLeft className='h-4 w-4' /> : <FiChevronRight className='h-4 w-4' />}
          </Button>
        </div>
        <SidebarLogic />
      </div>
    </div>
  )
}
