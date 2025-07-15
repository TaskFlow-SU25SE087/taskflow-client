import { Button } from '@/components/ui/button'
import { useToastContext } from '@/components/ui/ToastContext'
import { useAuth } from '@/hooks/useAuth'
import { Loader2, Mail } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'

export default function VerifyEmailPage() {
  const [isSending, setIsSending] = useState(false)
  const [isVerifying, setIsVerifying] = useState(false)
  const { resendVerificationEmail, verifyEmail } = useAuth()
  const { showToast } = useToastContext()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token')

  useEffect(() => {
    const verifyEmailToken = async () => {
      if (token) {
        setIsVerifying(true)
        try {
          await verifyEmail(token)
          showToast({
            title: 'Success',
            description: 'Email verified successfully',
            variant: 'default'
          })
          navigate('/login')
        } catch (error: any) {
          showToast({
            title: 'Error',
            description: error.message || 'Failed to verify email',
            variant: 'destructive'
          })
        } finally {
          setIsVerifying(false)
        }
      }
    }

    verifyEmailToken()
  }, [token, verifyEmail, showToast, navigate])

  const handleResendEmail = async () => {
    setIsSending(true)
    try {
      await resendVerificationEmail()
      showToast({
        title: 'Success',
        description: 'Verification email sent successfully',
        variant: 'default'
      })
    } catch (error: any) {
      showToast({
        title: 'Error',
        description: error.message || 'Failed to send verification email',
        variant: 'destructive'
      })
    } finally {
      setIsSending(false)
    }
  }

  if (isVerifying) {
    return (
      <div className='min-h-screen flex items-center justify-center bg-gray-50'>
        <div className='text-center'>
          <Loader2 className='h-8 w-8 animate-spin mx-auto mb-4' />
          <h2 className='text-xl font-semibold'>Verifying your email...</h2>
        </div>
      </div>
    )
  }

  return (
    <div className='min-h-screen flex items-center justify-center bg-gray-50'>
      <div className='max-w-md w-full space-y-8 p-8 bg-white rounded-lg shadow-lg'>
        <div className='text-center'>
          <Mail className='mx-auto h-12 w-12 text-lavender-700' />
          <h2 className='mt-6 text-3xl font-bold text-gray-900'>Verify your email</h2>
          <p className='mt-2 text-sm text-gray-600'>
            We've sent you a verification email. Please check your inbox and click the verification link.
          </p>
          <p className='mt-2 text-sm text-gray-500'>If you don't see the email, please check your spam folder.</p>
        </div>

        <div className='mt-8'>
          <Button
            onClick={handleResendEmail}
            disabled={isSending}
            className='w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-lavender-700 hover:bg-lavender-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-lavender-700'
          >
            {isSending ? (
              <>
                <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                Sending...
              </>
            ) : (
              'Resend verification email'
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}
