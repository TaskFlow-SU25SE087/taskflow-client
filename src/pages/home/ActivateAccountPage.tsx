import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Loader } from '@/components/ui/loader'
import { useActivateAccount } from '@/hooks/useActivateAccount'
import { useProjectMembers } from '@/hooks/useProjectMembers'
import { Eye, EyeOff, Loader2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom'

export default function ActivateAccountPage() {
  const [email, setEmail] = useState('')
  const [username, setUsername] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [tokenResetPassword, setTokenResetPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  const { activateAccount, isLoading, error, clearError } = useActivateAccount()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const location = useLocation()
  const { verifyJoin, loading } = useProjectMembers()
  // Get token from URL params if available
  const tokenFromUrl = searchParams.get('token')
  const emailFromUrl = searchParams.get('email')

  useEffect(() => {
    if (tokenFromUrl) {
      setTokenResetPassword(tokenFromUrl)
    }
    if (emailFromUrl) {
      setEmail(emailFromUrl)
    }
  }, [tokenFromUrl, emailFromUrl])

  useEffect(() => {
    const params = new URLSearchParams(location.search)
    const token = params.get('token')
    const projectId = params.get('projectId')
    if (token && projectId) {
      verifyJoin(projectId)
        .then(() => {
          setTimeout(() => navigate(`/projects/${projectId}`), 2000)
        })
        .catch(() => {}) // Catch block to prevent unhandled promise rejection
    }
  }, [location, navigate, verifyJoin])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    clearError()

    const activationSuccess = await activateAccount({
      email,
      username,
      newPassword,
      confirmPassword,
      tokenResetPassword
    })

    if (activationSuccess) {
      // Form will be reset and user will be redirected by the hook
      setEmail('')
      setUsername('')
      setNewPassword('')
      setConfirmPassword('')
      setTokenResetPassword('')
    }
  }

  if (loading) return <Loader />

  return (
    <div className='min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4'>
      <Card className='w-full max-w-md'>
        <CardHeader className='text-center'>
          <CardTitle className='text-2xl font-bold text-gray-900'>Activate Account</CardTitle>
          <CardDescription>Complete your account setup by providing your information</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className='space-y-4'>
            <div className='space-y-2'>
              <Label htmlFor='email'>Email</Label>
              <Input
                id='email'
                type='email'
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder='Enter your email'
                required
                disabled={!!emailFromUrl}
              />
            </div>

            <div className='space-y-2'>
              <Label htmlFor='username'>Username</Label>
              <Input
                id='username'
                type='text'
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder='Choose a username'
                required
              />
            </div>

            <div className='space-y-2'>
              <Label htmlFor='newPassword'>New Password</Label>
              <div className='relative'>
                <Input
                  id='newPassword'
                  type={showPassword ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder='Enter new password'
                  required
                />
                <Button
                  type='button'
                  variant='ghost'
                  size='sm'
                  className='absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent'
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff className='h-4 w-4' /> : <Eye className='h-4 w-4' />}
                </Button>
              </div>
            </div>

            <div className='space-y-2'>
              <Label htmlFor='confirmPassword'>Confirm Password</Label>
              <div className='relative'>
                <Input
                  id='confirmPassword'
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder='Confirm new password'
                  required
                />
                <Button
                  type='button'
                  variant='ghost'
                  size='sm'
                  className='absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent'
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? <EyeOff className='h-4 w-4' /> : <Eye className='h-4 w-4' />}
                </Button>
              </div>
            </div>

            <div className='space-y-2'>
              <Label htmlFor='token'>Activation Token</Label>
              <Input
                id='token'
                type='text'
                value={tokenResetPassword}
                onChange={(e) => setTokenResetPassword(e.target.value)}
                placeholder='Enter activation token'
                required
                disabled={!!tokenFromUrl}
              />
            </div>

            {error && <div className='text-sm text-red-600 bg-red-50 p-3 rounded-md'>{error}</div>}

            <Button type='submit' className='w-full' disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                  Activating...
                </>
              ) : (
                'Activate Account'
              )}
            </Button>
          </form>

          <div className='mt-4 text-center text-sm text-gray-600'>
            <p>
              Already have an account?{' '}
              <Button variant='link' className='p-0 h-auto font-semibold' onClick={() => navigate('/login')}>
                Sign in
              </Button>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
