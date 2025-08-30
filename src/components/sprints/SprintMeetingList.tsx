import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { SprintMeeting } from '@/types/sprint'
import { canUpdateSprintMeeting, formatLastUpdateTime } from '@/utils/sprintMeetingUtils'
import { format } from 'date-fns'
import { Calendar, Clock, Lock, SortAsc, SortDesc } from 'lucide-react'
import React, { useMemo, useState } from 'react'

interface SprintMeetingListProps {
  sprintMeetings: SprintMeeting[]
  onViewDetail: (meetingId: string) => void
  loading?: boolean
}

export const SprintMeetingList: React.FC<SprintMeetingListProps> = ({
  sprintMeetings,
  onViewDetail,
  loading = false
}) => {
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest'>('newest')
  
  // Sort meetings based on selected order
  const sortedMeetings = useMemo(() => {
    return [...sprintMeetings].sort((a, b) => {
      const dateA = new Date(a.updatedAt).getTime()
      const dateB = new Date(b.updatedAt).getTime()
      
      return sortOrder === 'newest' ? dateB - dateA : dateA - dateB
    })
  }, [sprintMeetings, sortOrder])

  if (loading) {
    return (
      <div className='space-y-4'>
        {[...Array(3)].map((_, index) => (
          <Card key={index} className='animate-pulse'>
            <CardContent className='p-6'>
              <div className='h-4 bg-gray-200 rounded w-3/4 mb-2'></div>
              <div className='h-3 bg-gray-200 rounded w-1/2'></div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  if (sprintMeetings.length === 0) {
    return (
      <Card>
        <CardContent className='p-8 text-center'>
          <Calendar className='h-12 w-12 text-gray-400 mx-auto mb-4' />
          <h3 className='text-lg font-medium text-gray-900 mb-2'>No Sprint Meetings</h3>
          <p className='text-gray-500'>No sprint meetings have been created yet.</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className='space-y-4'>
      {/* Filter Controls */}
      <div className='flex items-center justify-between'>
        <div className='flex items-center gap-2'>
          <span className='text-sm font-medium text-gray-700'>Sort by:</span>
          <Select value={sortOrder} onValueChange={(value: 'newest' | 'oldest') => setSortOrder(value)}>
            <SelectTrigger className='w-[140px]'>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='newest'>
                <div className='flex items-center gap-2'>
                  <SortDesc className='h-4 w-4' />
                  Newest First
                </div>
              </SelectItem>
              <SelectItem value='oldest'>
                <div className='flex items-center gap-2'>
                  <SortAsc className='h-4 w-4' />
                  Oldest First
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className='text-sm text-gray-500'>
          {sortedMeetings.length} meeting{sortedMeetings.length !== 1 ? 's' : ''}
        </div>
      </div>
      
      {/* Meetings List */}
      {sortedMeetings.map((meeting) => {
        const canUpdate = canUpdateSprintMeeting(meeting)
        
        return (
          <Card key={meeting.id} className='hover:shadow-md transition-shadow'>
            <CardHeader className='pb-3'>
              <div className='flex items-center justify-between'>
                <div className='flex items-center space-x-3'>
                  <Calendar className='h-5 w-5 text-blue-600' />
                  <CardTitle className='text-lg'>{meeting.sprintName}</CardTitle>
                  <Badge variant='secondary'>Sprint Meeting</Badge>
                  <Badge variant={canUpdate ? 'secondary' : 'destructive'}>
                    {canUpdate ? 'Updatable' : 'Read Only'}
                  </Badge>
                </div>
                <Button variant='outline' size='sm' onClick={() => onViewDetail(meeting.id)}>
                  {canUpdate ? (
                    'View Details'
                  ) : (
                    <>
                      <Lock className='h-4 w-4 mr-2' />
                      View Details
                    </>
                  )}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className='grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600'>
                <div className='flex items-center space-x-2'>
                  <Clock className='h-4 w-4' />
                  <span>Created: {format(new Date(meeting.createdAt), 'MMM dd, yyyy HH:mm')}</span>
                </div>
                <div className='flex items-center space-x-2'>
                  <Clock className='h-4 w-4' />
                  <span>Last Updated: {formatLastUpdateTime(meeting)}</span>
                </div>
              </div>
              
              {!canUpdate && (
                <div className='mt-3 p-2 bg-orange-50 border border-orange-200 rounded-md'>
                  <p className='text-sm text-orange-700'>
                    This meeting cannot be updated as it was last modified more than 7 days ago.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}