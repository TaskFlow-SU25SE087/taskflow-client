import { LayoutDashboard } from 'lucide-react'
import { Card, CardHeader, CardContent } from '@/components/ui/card'

export const ProjectCardSkeleton = () => {
  return (
    <Card className='bg-white'>
      <CardHeader className='p-5 pb-0'>
        <div className='flex justify-between items-center'>
          <div className='flex items-center gap-2'>
            <div className='h-10 w-10 rounded-lg bg-lavender-700/10 flex items-center justify-center'>
              <LayoutDashboard className='h-6 w-6 text-lavender-700/30' />
            </div>
            <div className='space-y-2'>
              <div className='h-5 w-32 bg-gray-200 rounded animate-pulse' />
              <div className='h-4 w-40 bg-gray-200 rounded animate-pulse' />
            </div>
          </div>
          <div className='h-8 w-8 rounded-lg bg-gray-200 animate-pulse' />
        </div>
      </CardHeader>
      <CardContent className='p-5'>
        <div className='flex items-center justify-between'>
          <div className='flex items-center gap-2'>
            <div className='h-4 w-4 rounded bg-gray-200 animate-pulse' />
            <div className='h-4 w-24 bg-gray-200 rounded animate-pulse' />
          </div>
          <div className='h-6 w-16 rounded-full bg-gray-200 animate-pulse' />
        </div>
        {/* Project lead skeleton */}
        <div className='flex items-center gap-2 mt-4 pt-4 border-t border-gray-100'>
          <div className='h-8 w-8 rounded-full bg-gray-200 animate-pulse' />
          <div className='h-4 w-24 bg-gray-200 rounded animate-pulse' />
        </div>
      </CardContent>
    </Card>
  )
}
