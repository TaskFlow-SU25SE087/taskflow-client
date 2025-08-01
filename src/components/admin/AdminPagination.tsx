import { Button } from '@/components/ui/button'
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react'

interface AdminPaginationProps {
  currentPage: number
  totalPages: number
  onPageChange: (page: number) => void
  className?: string
}

export default function AdminPagination({
  currentPage,
  totalPages,
  onPageChange,
  className = ''
}: AdminPaginationProps) {
  const canGoPrevious = currentPage > 1
  const canGoNext = currentPage < totalPages

  const getPageNumbers = () => {
    const pages = []
    const maxVisiblePages = 5

    if (totalPages <= maxVisiblePages) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i)
      }
    } else {
      if (currentPage <= 3) {
        for (let i = 1; i <= 4; i++) {
          pages.push(i)
        }
        pages.push('...')
        pages.push(totalPages)
      } else if (currentPage >= totalPages - 2) {
        pages.push(1)
        pages.push('...')
        for (let i = totalPages - 3; i <= totalPages; i++) {
          pages.push(i)
        }
      } else {
        pages.push(1)
        pages.push('...')
        for (let i = currentPage - 1; i <= currentPage + 1; i++) {
          pages.push(i)
        }
        pages.push('...')
        pages.push(totalPages)
      }
    }

    return pages
  }

  return (
    <div className={`flex items-center justify-between ${className}`}>
      <div className='flex items-center space-x-2'>
        <Button variant='outline' size='sm' onClick={() => onPageChange(1)} disabled={!canGoPrevious}>
          <ChevronsLeft className='h-4 w-4' />
        </Button>
        <Button variant='outline' size='sm' onClick={() => onPageChange(currentPage - 1)} disabled={!canGoPrevious}>
          <ChevronLeft className='h-4 w-4' />
        </Button>
      </div>

      <div className='flex items-center space-x-1'>
        {getPageNumbers().map((page, index) => (
          <div key={index}>
            {page === '...' ? (
              <span className='px-3 py-2 text-sm text-muted-foreground'>...</span>
            ) : (
              <Button
                variant={currentPage === page ? 'default' : 'outline'}
                size='sm'
                onClick={() => onPageChange(page as number)}
                className='w-8 h-8'
              >
                {page}
              </Button>
            )}
          </div>
        ))}
      </div>

      <div className='flex items-center space-x-2'>
        <Button variant='outline' size='sm' onClick={() => onPageChange(currentPage + 1)} disabled={!canGoNext}>
          <ChevronRight className='h-4 w-4' />
        </Button>
        <Button variant='outline' size='sm' onClick={() => onPageChange(totalPages)} disabled={!canGoNext}>
          <ChevronsRight className='h-4 w-4' />
        </Button>
      </div>
    </div>
  )
}
