import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from './useAuth'
import { useToast } from './useToast'

interface ActivateAccountParams {
  email: string
  username: string
  newPassword: string
  confirmPassword: string
  tokenResetPassword: string
}

export const useActivateAccount = () => {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { activate } = useAuth()
  const { toast } = useToast()
  const navigate = useNavigate()

  const activateAccount = async (params: ActivateAccountParams) => {
    const { email, username, newPassword, confirmPassword, tokenResetPassword } = params

    // Validation
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match')
      return false
    }

    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters long')
      return false
    }

    if (!email || !username || !tokenResetPassword) {
      setError('All fields are required')
      return false
    }

    setIsLoading(true)
    setError(null)

    try {
      await activate(email, username, newPassword, confirmPassword, tokenResetPassword)

      toast({
        title: 'Success',
        description: 'Account activated successfully! You can now login.'
      })

      // Redirect to login page after a short delay
      setTimeout(() => {
        navigate('/login', { replace: true })
      }, 2000)

      return true
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to activate account'
      setError(errorMessage)

      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive'
      })

      return false
    } finally {
      setIsLoading(false)
    }
  }

  const clearError = () => {
    setError(null)
  }

  return {
    activateAccount,
    isLoading,
    error,
    clearError
  }
}
