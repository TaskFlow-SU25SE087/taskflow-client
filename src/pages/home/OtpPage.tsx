import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useAuth } from '@/hooks/useAuth'
import { useToast } from '@/hooks/useToast'
import { Loader2, RefreshCw } from 'lucide-react'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

export default function OtpPage() {
  const [otp, setOtp] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isResending, setIsResending] = useState(false)
  const { verifyOtp, resendVerificationEmail } = useAuth()
  const { toast } = useToast()
  const navigate = useNavigate()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      await verifyOtp(otp)
      toast({
        title: 'Success',
        description: 'OTP verified successfully',
        variant: 'default'
      })
      setTimeout(() => {
        navigate('/add-info')
      }, 200)
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to verify OTP',
        variant: 'destructive'
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleResendOtp = async () => {
    setIsResending(true)
    try {
      await resendVerificationEmail()
      toast({
        title: 'Success',
        description: 'OTP has been resent to your email',
        variant: 'default'
      })
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to resend OTP',
        variant: 'destructive'
      })
    } finally {
      setIsResending(false)
    }
  }

  return (
    <div className='min-h-screen flex items-center justify-center bg-gray-50'>
      <div className='max-w-md w-full space-y-8 p-8 bg-white rounded-lg shadow-lg'>
        <div className='text-center'>
          <h2 className='text-3xl font-bold text-gray-900'>Enter OTP</h2>
          <p className='mt-2 text-sm text-gray-600'>Please enter the OTP sent to your email</p>
        </div>

        <form onSubmit={handleSubmit} className='mt-8 space-y-6'>
          <div className='space-y-4'>
            <div>
              <Label htmlFor='otp' className='text-sm font-medium text-gray-700'>
                OTP Code
              </Label>
              <Input
                id='otp'
                type='text'
                placeholder='Enter OTP'
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                required
                className='mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-lavender-700 focus:border-lavender-700'
              />
            </div>
          </div>

          <div className='flex flex-col space-y-4'>
            <Button
              type='submit'
              disabled={isSubmitting}
              className='w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-lavender-700 hover:bg-lavender-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-lavender-700'
            >
              {isSubmitting ? (
                <>
                  <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                  Verifying...
                </>
              ) : (
                'Verify OTP'
              )}
            </Button>

            <Button
              type='button'
              variant='outline'
              disabled={isResending}
              onClick={handleResendOtp}
              className='w-full flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-lavender-700'
            >
              {isResending ? (
                <>
                  <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                  Resending...
                </>
              ) : (
                <>
                  <RefreshCw className='mr-2 h-4 w-4' />
                  Resend OTP
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
