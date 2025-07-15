import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToastContext } from '@/components/ui/ToastContext'
import { useAuth } from '@/hooks/useAuth'
import { Loader2 } from 'lucide-react'
import { useState } from 'react'

export default function AddUserInfoPage() {
  const [username, setUsername] = useState('')
  const [avatar, setAvatar] = useState<File | null>(null)
  const [phoneNumber, setPhoneNumber] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { addUsername, error } = useAuth()
  const { showToast } = useToastContext()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    console.log('Submitting user info:', { username, avatar, phoneNumber })

    try {
      await addUsername(username, avatar, phoneNumber)
    } catch (err: any) {
      showToast({
        title: 'Error',
        description: err.message || 'Failed to update user information.',
        variant: 'destructive'
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className='min-h-screen flex items-center justify-center bg-gray-50'>
      <div className='max-w-md w-full space-y-8 p-8 bg-white rounded-lg shadow-lg'>
        <div className='text-center'>
          <h2 className='text-3xl font-bold text-gray-900'>Complete Your Profile</h2>
          <p className='mt-2 text-sm text-gray-600'>Please provide your username, avatar, and phone number.</p>
        </div>

        <form onSubmit={handleSubmit} className='mt-8 space-y-6'>
          {error && <div className='p-3 bg-red-100 border border-red-400 text-red-700 rounded'>{error}</div>}
          <div className='space-y-4'>
            <div>
              <Label htmlFor='username' className='text-sm font-medium text-gray-700'>
                Username
              </Label>
              <Input
                id='username'
                type='text'
                placeholder='Enter your username'
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                className='mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-lavender-700 focus:border-lavender-700'
              />
            </div>

            <div>
              <Label htmlFor='avatar' className='text-sm font-medium text-gray-700'>
                Avatar
              </Label>
              <Input
                id='avatar'
                type='file'
                accept='image/*'
                onChange={(e) => setAvatar(e.target.files ? e.target.files[0] : null)}
                className='mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-lavender-700 focus:border-lavender-700'
              />
            </div>

            <div>
              <Label htmlFor='phoneNumber' className='text-sm font-medium text-gray-700'>
                Phone Number
              </Label>
              <Input
                id='phoneNumber'
                type='tel'
                placeholder='Enter your phone number (optional)'
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                className='mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-lavender-700 focus:border-lavender-700'
              />
            </div>
          </div>

          <Button
            type='submit'
            disabled={isSubmitting}
            className='w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-lavender-700 hover:bg-lavender-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-lavender-700'
          >
            {isSubmitting ? (
              <>
                <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                Saving...
              </>
            ) : (
              'Save Profile'
            )}
          </Button>
        </form>
      </div>
    </div>
  )
}
