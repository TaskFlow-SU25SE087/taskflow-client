import { Skeleton } from '@/components/ui/skeleton'

export const BacklogTaskRowSkeleton = () => {
  return (
    <div className='flex items-center border border-gray-200 rounded px-2 py-1 text-xs bg-white min-h-[36px] mb-2'>
      {/* Checkbox skeleton */}
      <div className='flex-shrink-0 w-6 flex justify-center'>
        <Skeleton className='h-4 w-4 rounded' />
      </div>

      {/* Tags skeleton */}
      <div className='flex-shrink-0 min-w-[60px] max-w-[80px]'>
        <div className='flex gap-1'>
          <Skeleton className='h-5 w-8 rounded' />
          <Skeleton className='h-5 w-10 rounded' />
        </div>
      </div>

      {/* Title skeleton */}
      <div className='flex-shrink-0 min-w-[100px] max-w-[140px]'>
        <Skeleton className='h-4 w-32 rounded' />
      </div>

      {/* Status skeleton */}
      <div className='flex-shrink-0 min-w-[90px] max-w-[110px]'>
        <Skeleton className='h-5 w-16 rounded' />
      </div>

      {/* Meta info skeletons */}
      <div className='flex-shrink-0 w-8 flex justify-center'>
        <Skeleton className='h-5 w-5 rounded-full' />
      </div>
      <div className='flex-shrink-0 w-10 flex items-center justify-center'>
        <Skeleton className='h-4 w-6 rounded' />
      </div>
      <div className='flex-shrink-0 w-10 flex items-center justify-center'>
        <Skeleton className='h-4 w-6 rounded' />
      </div>
      <div className='flex-shrink-0 w-16 flex items-center justify-center'>
        <Skeleton className='h-4 w-12 rounded' />
      </div>

      {/* Delete button skeleton */}
      <div className='ml-2'>
        <Skeleton className='h-6 w-12 rounded' />
      </div>
    </div>
  )
}
