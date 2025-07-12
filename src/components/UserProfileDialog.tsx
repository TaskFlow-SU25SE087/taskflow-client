import { useUserProfile } from '../hooks/useUserProfile'

interface Props {
  userId: string
  onClose: () => void
}

export default function UserProfileDialog({ userId, onClose }: Props) {
  console.log('UserProfileDialog opened with userId:', userId)
  const { profile, loading } = useUserProfile(userId)

  if (!userId) return null

  return (
    <div className='fixed inset-0 bg-black/40 flex items-center justify-center z-50'>
      <div className='bg-white p-6 rounded shadow-lg min-w-[320px] relative'>
        <button onClick={onClose} className='absolute top-2 right-2 text-xl'>
          ✕
        </button>
        {loading ? (
          <div>Loading...</div>
        ) : profile ? (
          <div className='text-center'>
            <img src={profile.avatar} alt='avatar' className='w-20 h-20 rounded-full mx-auto mb-3 object-cover' />
            <div className='font-bold text-lg mb-1'>{profile.fullName}</div>
            <div className='text-gray-600 mb-2'>{profile.role}</div>
            <div className='mb-1'>
              <b>Email:</b> {profile.email}
            </div>
            <div className='mb-1'>
              <b>Phone:</b> {profile.phoneNumber}
            </div>
            <div className='mb-1'>
              <b>Student ID:</b> {profile.studentId}
            </div>
            <div className='mb-1'>
              <b>Term Season:</b> {profile.termSeason}
            </div>
            <div className='mb-1'>
              <b>Term Year:</b> {profile.termYear}
            </div>
            <div className='mb-1'>
              <b>Past Terms:</b> {profile.pastTerms}
            </div>
          </div>
        ) : (
          <div>User not found.</div>
        )}
      </div>
    </div>
  )
}
