import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useAuth } from '@/hooks/useAuth'
import { Mail } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router-dom'

export default function SignUpPage() {
  const { register, error } = useAuth()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const [email, setEmail] = useState('')
  const [fullName, setFullName] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [formError, setFormError] = useState<string | null>(null)

  const validateForm = () => {
    if (!email) {
      setFormError('Email is required')
      return false
    }

    if (!email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
      setFormError('Invalid email address format')
      return false
    }

    if (!fullName) {
      setFormError('Full name is required')
      return false
    }

    if (!password) {
      setFormError('Password is required')
      return false
    }

    if (password.length < 6 || password.length > 100) {
      setFormError('Password must be between 6 and 100 characters')
      return false
    }

    if (!confirmPassword) {
      setFormError('Confirm password is required')
      return false
    }

    if (password !== confirmPassword) {
      setFormError('Passwords do not match')
      return false
    }

    return true
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setFormError(null)

    if (!validateForm()) {
      setIsSubmitting(false)
      return
    }
    try {
      await register(email, fullName, password, confirmPassword)
    } catch (error: any) {
      setFormError(error.message || 'Failed to register')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleGmailSignUp = () => {
    // No gmail yet
    console.log('Gmail signup attempted')
  }

  const displayError = formError || error

  return (
    <div className='min-h-screen flex flex-col md:flex-row bg-gray-50'>
      <div className='md:w-1/2 bg-lavender-700 hidden md:flex items-center justify-center p-8'>
        <div className='max-w-md w-full'>
          <h1 className='text-white text-5xl font-bold mb-6'>Join TaskFlow</h1>
          <p className='text-white text-xl'>
            Sign up today and start optimizing your workflow with our powerful tools.
          </p>
        </div>
      </div>

      <div className='md:w-1/2 flex flex-col justify-center items-center p-8 bg-white'>
        <div className='w-full max-w-[400px] space-y-8'>
          <div className='text-center'>
            <h2 className='text-lavender-700 text-4xl font-bold'>TaskFlow</h2>
          </div>

          <form onSubmit={handleSubmit} className='space-y-6'>
            {displayError && (
              <div className='p-3 bg-red-100 border border-red-400 text-red-700 rounded'>{displayError}</div>
            )}

            <div className='space-y-2'>
              <Label htmlFor='email' className='text-sm font-medium text-gray-700'>
                Email
              </Label>
              <Input
                id='email'
                type='email'
                placeholder='Enter your email'
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className='w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-lavender-700 focus:border-transparent'
              />
            </div>

            <div className='space-y-2'>
              <Label htmlFor='fullName' className='text-sm font-medium text-gray-700'>
                Full Name
              </Label>
              <Input
                id='fullName'
                type='text'
                placeholder='Enter your full name'
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
                className='w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-lavender-700 focus:border-transparent'
              />
            </div>

            <div className='space-y-2'>
              <Label htmlFor='password' className='text-sm font-medium text-gray-700'>
                Password
              </Label>
              <Input
                id='password'
                type='password'
                placeholder='Enter your password'
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className='w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-lavender-700 focus:border-transparent'
              />
            </div>

            <div className='space-y-2'>
              <Label htmlFor='confirmPassword' className='text-sm font-medium text-gray-700'>
                Confirm Password
              </Label>
              <Input
                id='confirmPassword'
                type='password'
                placeholder='Confirm your password'
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                className='w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-lavender-700 focus:border-transparent'
              />
            </div>

            <div className='flex items-center space-x-2'>
              <Checkbox id='terms' required />
              <label htmlFor='terms' className='text-sm font-medium text-gray-700 cursor-pointer'>
                I agree to TaskFlow's{' '}
                <Link to='/terms' className='text-lavender-700 hover:underline'>
                  Terms of Service
                </Link>{' '}
                and{' '}
                <Link to='/privacy' className='text-lavender-700 hover:underline'>
                  Privacy Policy
                </Link>
                .
              </label>
            </div>

            <Button
              type='submit'
              disabled={isSubmitting}
              className='w-full bg-lavender-700 hover:bg-lavender-800 text-white font-medium py-3 px-4 rounded-md transition-colors duration-200'
            >
              {isSubmitting ? 'Creating Account...' : 'Sign Up'}
            </Button>
          </form>

          <div className='relative'>
            <div className='absolute inset-0 flex items-center'>
              <span className='w-full border-t border-gray-300' />
            </div>
            <div className='relative flex justify-center text-sm'>
              <span className='px-2 bg-white text-gray-500'>Or continue with</span>
            </div>
          </div>

          <Button
            onClick={handleGmailSignUp}
            disabled={isSubmitting}
            className='w-full bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 font-medium py-3 px-4 rounded-md transition-colors duration-200 flex items-center justify-center'
          >
            <Mail className='w-5 h-5 mr-2' />
            Sign up with Gmail
          </Button>

          <div className='text-center space-y-4'>
            <div className='text-sm text-gray-600'>
              Already have an account?{' '}
              <Link to='/login' className='text-lavender-700 hover:underline font-medium'>
                Log in
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
