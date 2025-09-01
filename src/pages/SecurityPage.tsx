import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Navbar } from '@/components/Navbar'
import { userApi, type ChangePasswordRequest } from '@/api/user'
import { useAuth } from '@/hooks/useAuth'
import { Shield, Eye, EyeOff, ArrowLeft } from 'lucide-react'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useToastContext } from '@/components/ui/ToastContext'

export default function SecurityPage() {
  const navigate = useNavigate()
  const { showToast } = useToastContext()
  const { logout } = useAuth()
  const [passwords, setPasswords] = useState({
    currentPassword: '',
    newPassword: '',
    confirmNewPassword: ''
  })
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  })
  const [isLoading, setIsLoading] = useState(false)
  const [errors, setErrors] = useState({
    currentPassword: '',
    newPassword: '',
    confirmNewPassword: ''
  })
  const [touched, setTouched] = useState({
    currentPassword: false,
    newPassword: false,
    confirmNewPassword: false
  })

  // Validation functions
  const validateCurrentPassword = (value: string) => {
    if (!value.trim()) {
      return 'Current password is required'
    }
    return ''
  }

  const validateNewPassword = (value: string) => {
    if (!value.trim()) {
      return 'New password is required'
    }
    if (value.length < 6) {
      return 'Password must be at least 6 characters long'
    }
    if (!/(?=.*[a-z])/.test(value)) {
      return 'Password must contain at least one lowercase letter'
    }
    if (!/(?=.*[A-Z])/.test(value)) {
      return 'Password must contain at least one uppercase letter'
    }
    if (!/(?=.*\d)/.test(value)) {
      return 'Password must contain at least one number'
    }
    if (value === passwords.currentPassword) {
      return 'New password must be different from current password'
    }
    return ''
  }

  const validateConfirmPassword = (value: string) => {
    if (!value.trim()) {
      return 'Please confirm your new password'
    }
    if (value !== passwords.newPassword) {
      return 'Password confirmation does not match'
    }
    return ''
  }

  // Validate all fields and update errors
  const validateField = (field: keyof typeof passwords, value: string) => {
    let error = ''
    switch (field) {
      case 'currentPassword':
        error = validateCurrentPassword(value)
        break
      case 'newPassword':
        error = validateNewPassword(value)
        break
      case 'confirmNewPassword':
        error = validateConfirmPassword(value)
        break
    }
    
    setErrors((prev) => ({
      ...prev,
      [field]: error
    }))
    
    return error
  }

  const handlePasswordChange = (field: keyof typeof passwords) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setPasswords((prev) => ({
      ...prev,
      [field]: value
    }))

    // Mark field as touched
    setTouched((prev) => ({
      ...prev,
      [field]: true
    }))

    // Validate the field
    validateField(field, value)

    // If we're updating newPassword, also re-validate confirmPassword
    if (field === 'newPassword' && passwords.confirmNewPassword && touched.confirmNewPassword) {
      validateField('confirmNewPassword', passwords.confirmNewPassword)
    }
  }

  const handleBlur = (field: keyof typeof passwords) => {
    setTouched((prev) => ({
      ...prev,
      [field]: true
    }))
    validateField(field, passwords[field])
  }

  const togglePasswordVisibility = (field: keyof typeof showPasswords) => {
    setShowPasswords((prev) => ({
      ...prev,
      [field]: !prev[field]
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Mark all fields as touched
    setTouched({
      currentPassword: true,
      newPassword: true,
      confirmNewPassword: true
    })

    // Validate all fields
    const currentPasswordError = validateField('currentPassword', passwords.currentPassword)
    const newPasswordError = validateField('newPassword', passwords.newPassword)
    const confirmPasswordError = validateField('confirmNewPassword', passwords.confirmNewPassword)

    // Check if there are any validation errors
    if (currentPasswordError || newPasswordError || confirmPasswordError) {
      showToast({
        title: 'Validation Error',
        description: 'Please fix the errors below before submitting.',
        variant: 'error'
      })
      return
    }

    setIsLoading(true)
    try {
      const passwordData: ChangePasswordRequest = {
        currentPassword: passwords.currentPassword,
        newPassword: passwords.newPassword,
        confirmNewPassword: passwords.confirmNewPassword
      }

      const response = await userApi.changePassword(passwordData)
      
      console.log('🎯 [SECURITY PAGE] API Response received:', response) // Debug log
      console.log('🎯 [SECURITY PAGE] Response type:', typeof response) // Debug log
      console.log('🎯 [SECURITY PAGE] Response code:', response.code) // Debug log
      console.log('🎯 [SECURITY PAGE] Response message:', response.message) // Debug log
      console.log('🎯 [SECURITY PAGE] Response data:', response.data) // Debug log
      console.log('🎯 [SECURITY PAGE] Code === 200?', response.code === 200) // Debug log
      console.log('🎯 [SECURITY PAGE] Code === 0?', response.code === 0) // Debug log
      console.log('🎯 [SECURITY PAGE] Data truthy?', !!response.data) // Debug log
      
      // Check for success: code 200 (HTTP success) or code 0 (some APIs use 0 for success)
      if ((response.code === 200 || response.code === 0) && response.data) {
        console.log('🎉 [SECURITY PAGE] SUCCESS - Showing success toast') // Debug log
        showToast({
          title: 'Success',
          description: 'Password changed successfully. You will be logged out for security.',
          variant: 'success'
        })
        
        // Reset form
        setPasswords({
          currentPassword: '',
          newPassword: '',
          confirmNewPassword: ''
        })

        // Logout after password change for security
        setTimeout(() => {
          console.log('🔓 [SECURITY PAGE] Auto-logout after password change') // Debug log
          logout()
          navigate('/login')
        }, 2000) // Wait 2 seconds to show the success toast
      } else {
        console.log('❌ [SECURITY PAGE] ERROR - Processing error response') // Debug log
        // Handle specific error codes
        let errorMessage = 'Failed to change password.'
        
        console.log('🎯 [SECURITY PAGE] Error code:', response.code) // Debug log
        
        if (response.code === 9021) {
          errorMessage = 'Current password is incorrect. Please check and try again.'
          console.log('🔑 [SECURITY PAGE] Setting 9021 error message:', errorMessage) // Debug log
        } else if (response.message) {
          errorMessage = response.message
          console.log('📝 [SECURITY PAGE] Using response message:', errorMessage) // Debug log
        }
        
        console.log('🎯 [SECURITY PAGE] Final error message:', errorMessage) // Debug log
        console.log('🍞 [SECURITY PAGE] About to show error toast...') // Debug log
        
        showToast({
          title: 'Error',
          description: errorMessage,
          variant: 'error'
        })
        
        console.log('🍞 [SECURITY PAGE] Toast called successfully!') // Debug log
      }
    } catch (error) {
      console.log('🚨 [SECURITY PAGE] Caught exception:', error) // Debug log
      console.log('🚨 [SECURITY PAGE] Error type:', typeof error) // Debug log
      console.log('🚨 [SECURITY PAGE] Error instanceof Error:', error instanceof Error) // Debug log
      
      // Handle network errors or other exceptions
      let errorMessage = 'Failed to change password. Please try again.'
      
      if (error instanceof Error) {
        console.log('🚨 [SECURITY PAGE] Error is instance of Error:', error.message) // Debug log
        // Try to parse the error message if it contains API response
        try {
          const errorResponse = JSON.parse(error.message)
          console.log('Parsed error response:', errorResponse) // Debug log
          if (errorResponse.code === 9021) {
            errorMessage = 'Current password is incorrect. Please check and try again.'
          } else if (errorResponse.message) {
            errorMessage = errorResponse.message
          }
        } catch {
          // If parsing fails, use the original error message
          console.log('Could not parse error message, using original:', error.message) // Debug log
          errorMessage = error.message
        }
      }
      
      console.log('Final error message:', errorMessage) // Debug log
      
      showToast({
        title: 'Error',
        description: errorMessage,
        variant: 'error'
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className='flex min-h-screen bg-gray-100'>
      <div className='flex-1'>
        <Navbar
          isSidebarOpen={false}
          toggleSidebar={() => {}}
          customLeft={
            <a href='/' className='flex items-center gap-2'>
              <img src='/logo.png' alt='TaskFlow logo' className='h-6 w-6 sm:h-8 sm:w-8' />
              <span className='text-lg sm:text-xl font-semibold text-gray-800'>TaskFlow</span>
            </a>
          }
        />

        <div className='container mx-auto py-6 max-w-4xl overflow-y-auto'>
          <div className='space-y-6'>
            {/* Back Button */}
            <button
              type='button'
              onClick={() => navigate(-1)}
              className='flex items-center gap-2 text-gray-600 hover:text-blue-600 mb-4'
            >
              <ArrowLeft className='w-5 h-5' />
              Back
            </button>

            {/* Header */}
            <div className='flex items-center gap-3'>
              <Shield className='h-6 w-6 text-blue-600' />
              <div>
                <h1 className='text-2xl font-bold text-gray-900'>Security Settings</h1>
                <p className='text-gray-600'>Manage your account security and password</p>
              </div>
            </div>

            <Separator />

            {/* Change Password Section */}
            <Card>
              <CardHeader>
                <CardTitle>Change Password</CardTitle>
                <CardDescription>
                  Update your password to keep your account secure. Make sure to use a strong password.
                </CardDescription>
              </CardHeader>
              <form onSubmit={handleSubmit}>
                <CardContent className='space-y-4'>
                  {/* Current Password */}
                  <div className='space-y-2'>
                    <Label htmlFor='currentPassword'>Current Password</Label>
                    <div className='relative'>
                      <Input
                        id='currentPassword'
                        type={showPasswords.current ? 'text' : 'password'}
                        value={passwords.currentPassword}
                        onChange={handlePasswordChange('currentPassword')}
                        onBlur={() => handleBlur('currentPassword')}
                        placeholder='Enter your current password'
                        className={`pr-10 ${errors.currentPassword && touched.currentPassword ? 'border-red-500' : ''}`}
                      />
                      <Button
                        type='button'
                        variant='ghost'
                        size='sm'
                        className='absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent'
                        onClick={() => togglePasswordVisibility('current')}
                      >
                        {showPasswords.current ? (
                          <EyeOff className='h-4 w-4 text-gray-500' />
                        ) : (
                          <Eye className='h-4 w-4 text-gray-500' />
                        )}
                      </Button>
                    </div>
                    {errors.currentPassword && touched.currentPassword && (
                      <p className='text-sm text-red-600'>{errors.currentPassword}</p>
                    )}
                  </div>

                  {/* New Password */}
                  <div className='space-y-2'>
                    <Label htmlFor='newPassword'>New Password</Label>
                    <div className='relative'>
                      <Input
                        id='newPassword'
                        type={showPasswords.new ? 'text' : 'password'}
                        value={passwords.newPassword}
                        onChange={handlePasswordChange('newPassword')}
                        onBlur={() => handleBlur('newPassword')}
                        placeholder='Enter your new password'
                        className={`pr-10 ${errors.newPassword && touched.newPassword ? 'border-red-500' : ''}`}
                      />
                      <Button
                        type='button'
                        variant='ghost'
                        size='sm'
                        className='absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent'
                        onClick={() => togglePasswordVisibility('new')}
                      >
                        {showPasswords.new ? (
                          <EyeOff className='h-4 w-4 text-gray-500' />
                        ) : (
                          <Eye className='h-4 w-4 text-gray-500' />
                        )}
                      </Button>
                    </div>
                    {errors.newPassword && touched.newPassword && (
                      <p className='text-sm text-red-600'>{errors.newPassword}</p>
                    )}
                  </div>

                  {/* Confirm New Password */}
                  <div className='space-y-2'>
                    <Label htmlFor='confirmNewPassword'>Confirm New Password</Label>
                    <div className='relative'>
                      <Input
                        id='confirmNewPassword'
                        type={showPasswords.confirm ? 'text' : 'password'}
                        value={passwords.confirmNewPassword}
                        onChange={handlePasswordChange('confirmNewPassword')}
                        onBlur={() => handleBlur('confirmNewPassword')}
                        placeholder='Confirm your new password'
                        className={`pr-10 ${errors.confirmNewPassword && touched.confirmNewPassword ? 'border-red-500' : ''}`}
                      />
                      <Button
                        type='button'
                        variant='ghost'
                        size='sm'
                        className='absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent'
                        onClick={() => togglePasswordVisibility('confirm')}
                      >
                        {showPasswords.confirm ? (
                          <EyeOff className='h-4 w-4 text-gray-500' />
                        ) : (
                          <Eye className='h-4 w-4 text-gray-500' />
                        )}
                      </Button>
                    </div>
                    {errors.confirmNewPassword && touched.confirmNewPassword && (
                      <p className='text-sm text-red-600'>{errors.confirmNewPassword}</p>
                    )}
                  </div>

                  {/* Password Requirements */}
                  <div className='text-sm bg-gray-50 p-3 rounded-md'>
                    <p className='font-medium mb-2 text-gray-700'>Password requirements:</p>
                    <ul className='space-y-1'>
                      <li className={`flex items-center gap-2 ${passwords.newPassword.length >= 6 ? 'text-green-600' : 'text-gray-600'}`}>
                        <span className={`w-2 h-2 rounded-full ${passwords.newPassword.length >= 6 ? 'bg-green-500' : 'bg-gray-400'}`} />
                        At least 6 characters long
                      </li>
                      <li className={`flex items-center gap-2 ${/(?=.*[a-z])/.test(passwords.newPassword) ? 'text-green-600' : 'text-gray-600'}`}>
                        <span className={`w-2 h-2 rounded-full ${/(?=.*[a-z])/.test(passwords.newPassword) ? 'bg-green-500' : 'bg-gray-400'}`} />
                        At least one lowercase letter
                      </li>
                      <li className={`flex items-center gap-2 ${/(?=.*[A-Z])/.test(passwords.newPassword) ? 'text-green-600' : 'text-gray-600'}`}>
                        <span className={`w-2 h-2 rounded-full ${/(?=.*[A-Z])/.test(passwords.newPassword) ? 'bg-green-500' : 'bg-gray-400'}`} />
                        At least one uppercase letter
                      </li>
                      <li className={`flex items-center gap-2 ${/(?=.*\d)/.test(passwords.newPassword) ? 'text-green-600' : 'text-gray-600'}`}>
                        <span className={`w-2 h-2 rounded-full ${/(?=.*\d)/.test(passwords.newPassword) ? 'bg-green-500' : 'bg-gray-400'}`} />
                        At least one number
                      </li>
                    </ul>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button type='submit' disabled={isLoading} className='w-full bg-blue-600 hover:bg-blue-700 text-white'>
                    {isLoading ? 'Changing Password...' : 'Change Password'}
                  </Button>
                </CardFooter>
              </form>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
