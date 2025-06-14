import { cn } from '@/lib/utils'

interface LoaderProps {
  className?: string
}

export function Loader({ className }: LoaderProps) {
  return (
    <div className={cn('flex items-center justify-center h-full w-full', className)}>
      <div className='loader' />
    </div>
  )
}
