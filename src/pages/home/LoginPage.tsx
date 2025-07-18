import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { EyeClosedIcon, EyeOpenIcon, Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useAuth } from '@/hooks/useAuth'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'

export default function LoginPage() {
  const { login, error } = useAuth()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [rememberMe, setRememberMe] = useState(false)

  // Tự động điền email nếu đã lưu
  useEffect(() => {
    const savedEmail = localStorage.getItem('rememberedEmail')
    if (savedEmail) setUsername(savedEmail)
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    try {
      // Lưu trạng thái rememberMe vào localStorage để useAuthContext biết
      localStorage.setItem('rememberMe', rememberMe ? 'true' : 'false')
      await login(username, password)
      if (rememberMe) {
        localStorage.setItem('rememberedEmail', username)
      } else {
        localStorage.removeItem('rememberedEmail')
      }
    } catch (error) {
      console.error('Login error:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className='min-h-screen flex flex-col md:flex-row bg-gray-50'>
      <div className='md:w-1/2 bg-lavender-700 hidden md:flex items-center justify-center p-8'>
        <div className='max-w-md w-full flex flex-col items-center'>
          <img src="/logo.png" alt="TaskFlow Logo" className="w-50 h-32 mb-2 mt-4" />
          <h1 className='text-white text-5xl font-bold mb-6'>Welcome to TaskFlow</h1>
          <p className='text-white text-xl'>
            Streamline your workflow, boost productivity, and collaborate seamlessly.
          </p>
        </div>
      </div>

      <div className='md:w-1/2 flex flex-col justify-center items-center p-8 bg-white'>
        <div className='w-full max-w-[400px] space-y-8'>
          <div className='text-center'>
            <h2 className='text-lavender-700 text-4xl font-bold'>TaskFlow</h2>
          </div>

          <form onSubmit={handleSubmit} className='space-y-6'>
            {error && <div className='p-3 bg-red-100 border border-red-400 text-red-700 rounded'>{error}</div>}
            <div className='space-y-2'>
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
                disabled={isSubmitting}
                className='w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-lavender-700 focus:border-transparent'
              />
            </div>
            <div className='space-y-2'>
              <div className='flex justify-between items-center'>
                <Label htmlFor='password' className='text-sm font-medium text-gray-700'>
                  Password
                </Label>
                <Link to='/forgot-password' className='text-sm text-lavender-700 hover:underline'>
                  Forgot password?
                </Link>
              </div>
              <div className='relative'>
                <Input
                  id='password'
                  type={showPassword ? 'text' : 'password'}
                  placeholder='Enter your password'
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={isSubmitting}
                  className='w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-lavender-700 focus:border-transparent pr-10'
                />
                <button
                  type='button'
                  tabIndex={-1}
                  className='absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700 focus:outline-none'
                  onClick={() => setShowPassword((v) => !v)}
                >
                  {showPassword ? <EyeOpenIcon width={22} height={22} /> : <EyeClosedIcon width={22} height={22} />}
                </button>
              </div>
            </div>
            <div className='flex items-center space-x-2'>
              <Checkbox id='remember' checked={rememberMe} onCheckedChange={(val) => setRememberMe(val === true)} />
              <label htmlFor='remember' className='text-sm font-medium text-gray-700 cursor-pointer'>
                Remember me
              </label>
            </div>
            <Button
              type='submit'
              disabled={isSubmitting}
              className='w-full bg-lavender-700 hover:bg-lavender-800 text-white font-medium py-3 px-4 rounded-md transition-colors duration-200'
            >
              {isSubmitting ? 'Logging in...' : 'Log in'}
            </Button>
          </form>

          <div className='text-center space-y-4'>
            <div className='text-sm text-gray-600'>
              Don't have an account?{' '}
              <Link to='/signup' className='text-lavender-700 hover:underline font-medium'>
                Sign up
              </Link>
            </div>
            <div className='text-xs text-gray-500'>
              By clicking "Log in" above, you acknowledge that you have read and understood, and agree to TaskFlow's{' '}
              <Link to='/terms' className='text-lavender-700 hover:underline'>
                Terms of Service
              </Link>{' '}
              and{' '}
              <Link to='/privacy' className='text-lavender-700 hover:underline'>
                Privacy Policy
              </Link>
              .
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
