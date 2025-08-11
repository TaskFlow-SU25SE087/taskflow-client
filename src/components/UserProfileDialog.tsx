import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Skeleton } from '@/components/ui/skeleton'
import { useUserProfile } from '../hooks/useUserProfile'

interface Props {
  userId: string
  onClose: () => void
  open?: boolean
}

export default function UserProfileDialog({ userId, onClose, open = true }: Props) {
  const { profile, loading } = useUserProfile(userId)
  if (!userId) return null

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className='sm:max-w-md'>
        <DialogHeader>
          <DialogTitle>User Profile</DialogTitle>
        </DialogHeader>
        {loading ? (
          <div className='flex items-center gap-4'>
            <Skeleton className='h-16 w-16 rounded-full' />
            <div className='space-y-2 w-full'>
              <Skeleton className='h-5 w-40' />
              <Skeleton className='h-4 w-56' />
            </div>
          </div>
        ) : profile ? (
          <div className='flex items-center gap-4'>
            <Avatar className='h-16 w-16'>
              {profile.avatar ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={profile.avatar} alt='avatar' className='h-16 w-16 rounded-full object-cover' />
              ) : (
                <AvatarFallback className='text-lg font-semibold'>
                  {profile.fullName?.[0]?.toUpperCase() || '?'}
                </AvatarFallback>
              )}
            </Avatar>
            <div className='flex-1 min-w-0'>
              <div className='font-semibold text-lg truncate'>{profile.fullName}</div>
              <div className='text-sm text-gray-600 truncate'>{profile.email}</div>
              <div className='grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2 mt-3 text-sm'>
                <div>
                  <span className='text-gray-500'>Role:</span> {profile.role || '—'}
                </div>
                <div>
                  <span className='text-gray-500'>Phone:</span> {profile.phoneNumber || '—'}
                </div>
                <div>
                  <span className='text-gray-500'>Student ID:</span> {profile.studentId || '—'}
                </div>
                <div>
                  <span className='text-gray-500'>Term:</span> {profile.termSeason || '—'} {profile.termYear || ''}
                </div>
                <div className='sm:col-span-2'>
                  <span className='text-gray-500'>Past Terms:</span> {profile.pastTerms || '—'}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className='text-sm text-gray-600'>User not found.</div>
        )}
      </DialogContent>
    </Dialog>
  )
}
