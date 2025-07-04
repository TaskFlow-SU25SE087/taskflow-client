import { Skeleton } from '@/components/ui/skeleton'

export const BacklogSkeleton = () => {
  return (
    <div className="space-y-6">
      {/* Header skeleton */}
      <div className="flex items-center justify-between pb-4">
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-32" />
          <Skeleton className="h-8 w-24" />
        </div>
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-32" />
          <Skeleton className="h-10 w-40" />
        </div>
      </div>

      {/* Search and filter skeleton */}
      <div className="pb-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-24" />
          <div className="flex gap-4">
            <Skeleton className="h-10 w-[280px]" />
            <Skeleton className="h-10 w-[280px]" />
          </div>
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-10 w-20" />
          <Skeleton className="h-10 w-[180px]" />
        </div>
      </div>

      {/* Backlog section skeleton */}
      <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
        <div className="p-4 flex items-center justify-between border-b border-gray-200">
          <div className="flex items-center gap-2">
            <Skeleton className="h-6 w-6" />
            <div>
              <Skeleton className="h-6 w-32 mb-1" />
              <Skeleton className="h-4 w-48" />
            </div>
          </div>
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="p-4">
          {Array.from({ length: 8 }).map((_, index) => (
            <div key={index} className="flex items-center border border-gray-200 rounded px-2 py-1 text-xs bg-white min-h-[36px] mb-2">
              <Skeleton className="h-4 w-4 mx-3" />
              <div className="flex gap-1 min-w-[60px] max-w-[80px]">
                <Skeleton className="h-5 w-8 rounded" />
                <Skeleton className="h-5 w-10 rounded" />
              </div>
              <Skeleton className="h-4 w-32 min-w-[100px] max-w-[140px]" />
              <Skeleton className="h-5 w-16 min-w-[90px] max-w-[110px]" />
              <Skeleton className="h-5 w-5 w-8" />
              <Skeleton className="h-4 w-6 w-10" />
              <Skeleton className="h-4 w-6 w-10" />
              <Skeleton className="h-4 w-12 w-16" />
              <Skeleton className="h-6 w-12 ml-2" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
} 