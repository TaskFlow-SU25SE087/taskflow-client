'use client'

import type React from 'react'

import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useAuth } from '@/hooks/useAuth'
import { Mail, Eye, EyeOff, CheckCircle, Code, Users, ArrowLeft } from 'lucide-react'
import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { gsap } from 'gsap'

export default function SignUpPage() {
  const { register, error } = useAuth()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [email, setEmail] = useState('')
  const [fullName, setFullName] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [formError, setFormError] = useState<string | null>(null)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const ctx = gsap.context(() => {
      // Hero content animation
      gsap.fromTo(
        '.hero-content > *',
        { y: 30, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.8, stagger: 0.1, ease: 'power2.out' }
      )

      // Form animation
      gsap.fromTo(
        '.form-container',
        { x: 30, opacity: 0 },
        { x: 0, opacity: 1, duration: 0.8, delay: 0.2, ease: 'power2.out' }
      )

      gsap.fromTo(
        '.form-field',
        { y: 20, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.5, stagger: 0.08, delay: 0.5, ease: 'power2.out' }
      )
    }, containerRef)

    return () => ctx.revert()
  }, [])

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
    console.log('Gmail signup attempted')
  }

  const displayError = formError || error

  return (
    <div ref={containerRef} className='min-h-screen flex flex-col md:flex-row'>
      {/* Left Side - Hero */}
      <div className='hidden md:flex md:w-1/2 bg-gradient-to-br from-lavender-600 to-lavender-800 items-center justify-center p-8 relative overflow-hidden'>
        {/* Geometric background pattern */}
        <div className='absolute inset-0 opacity-10'>
          {/* Grid pattern */}
          <div
            className='absolute inset-0'
            style={{
              backgroundImage: `
              linear-gradient(white 1px, transparent 1px),
              linear-gradient(90deg, white 1px, transparent 1px)
            `,
              backgroundSize: '60px 60px'
            }}
          ></div>

          {/* Accent shapes */}
          <div className='absolute top-16 right-20 w-40 h-40 border-2 border-white rounded-lg rotate-12'></div>
          <div className='absolute bottom-20 left-16 w-32 h-32 border-2 border-white rounded-full'></div>
          <div className='absolute top-1/2 right-8 w-24 h-24 border-2 border-white rotate-45'></div>
          <div className='absolute bottom-40 right-1/3 w-20 h-20 border-2 border-white rounded-lg -rotate-12'></div>
        </div>

        <div className='max-w-md w-full hero-content relative z-10'>
          <div className='mb-8'>
            <Link
              to='/'
              className='inline-flex items-center space-x-2 text-white/80 hover:text-white transition-colors mb-6'
            >
              <ArrowLeft className='w-4 h-4' />
              <span>Back to Home</span>
            </Link>
            <h1 className='text-white text-5xl font-bold mb-4 leading-tight'>Join TaskFlow</h1>
            <p className='text-lavender-100 text-xl leading-relaxed'>
              Sign up today and start optimizing your workflow with our powerful project management and code quality
              tools.
            </p>
          </div>

          <div className='space-y-6'>
            <div className='flex items-center space-x-4'>
              <div className='w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm'>
                <CheckCircle className='w-6 h-6 text-white' />
              </div>
              <div>
                <h3 className='text-white font-semibold'>Project Management</h3>
                <p className='text-lavender-200 text-sm'>Organize sprints and track progress</p>
              </div>
            </div>

            <div className='flex items-center space-x-4'>
              <div className='w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm'>
                <Code className='w-6 h-6 text-white' />
              </div>
              <div>
                <h3 className='text-white font-semibold'>Code Quality Analysis</h3>
                <p className='text-lavender-200 text-sm'>Real-time SonarQube-style testing</p>
              </div>
            </div>

            <div className='flex items-center space-x-4'>
              <div className='w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm'>
                <Users className='w-6 h-6 text-white' />
              </div>
              <div>
                <h3 className='text-white font-semibold'>Team Collaboration</h3>
                <p className='text-lavender-200 text-sm'>Built for FPT University teams</p>
              </div>
            </div>
          </div>

          <div className='mt-8 pt-8 border-t border-white/20'>
            <div className='inline-flex items-center px-3 py-1 bg-white/20 rounded-full backdrop-blur-sm'>
              <span className='text-sm font-medium text-white'>Free for FPT University Students</span>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Form */}
      <div className='w-full md:w-1/2 flex flex-col justify-center items-center p-8 bg-white'>
        <div className='w-full max-w-[420px] form-container'>
          <div className='text-center mb-8'>
            <h2 className='text-lavender-700 text-3xl font-bold mb-2'>Create Account</h2>
            <p className='text-gray-600'>Get started with TaskFlow today</p>
          </div>

          <form onSubmit={handleSubmit} className='space-y-6'>
            {displayError && (
              <div className='form-field p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg'>
                {displayError}
              </div>
            )}

            <div className='form-field space-y-2'>
              <Label htmlFor='email' className='text-sm font-medium text-gray-700'>
                Email Address
              </Label>
              <Input
                id='email'
                type='email'
                placeholder='Enter your email'
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className='w-full p-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-lavender-600 focus:border-transparent transition-all'
              />
            </div>

            <div className='form-field space-y-2'>
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
                className='w-full p-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-lavender-600 focus:border-transparent transition-all'
              />
            </div>

            <div className='form-field space-y-2'>
              <Label htmlFor='password' className='text-sm font-medium text-gray-700'>
                Password
              </Label>
              <div className='relative'>
                <Input
                  id='password'
                  type={showPassword ? 'text' : 'password'}
                  placeholder='Create a password'
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className='w-full p-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-lavender-600 focus:border-transparent transition-all pr-12'
                />
                <button
                  type='button'
                  onClick={() => setShowPassword(!showPassword)}
                  className='absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors'
                >
                  {showPassword ? <EyeOff className='w-5 h-5' /> : <Eye className='w-5 h-5' />}
                </button>
              </div>
            </div>

            <div className='form-field space-y-2'>
              <Label htmlFor='confirmPassword' className='text-sm font-medium text-gray-700'>
                Confirm Password
              </Label>
              <div className='relative'>
                <Input
                  id='confirmPassword'
                  type={showConfirmPassword ? 'text' : 'password'}
                  placeholder='Confirm your password'
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  className='w-full p-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-lavender-600 focus:border-transparent transition-all pr-12'
                />
                <button
                  type='button'
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className='absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors'
                >
                  {showConfirmPassword ? <EyeOff className='w-5 h-5' /> : <Eye className='w-5 h-5' />}
                </button>
              </div>
            </div>

            <div className='form-field flex items-start space-x-3'>
              <Checkbox id='terms' required className='mt-1' />
              <label htmlFor='terms' className='text-sm text-gray-700 cursor-pointer leading-relaxed'>
                I agree to TaskFlow's{' '}
                <Link to='/terms' className='text-lavender-600 hover:text-lavender-700 underline'>
                  Terms of Service
                </Link>{' '}
                and{' '}
                <Link to='/privacy' className='text-lavender-600 hover:text-lavender-700 underline'>
                  Privacy Policy
                </Link>
              </label>
            </div>

            <Button
              type='submit'
              disabled={isSubmitting}
              className='w-full bg-lavender-600 hover:bg-lavender-700 text-white font-semibold py-4 px-6 rounded-lg transition-all duration-200 transform hover:scale-[1.02]'
            >
              {isSubmitting ? (
                <div className='flex items-center justify-center gap-2'>
                  <div className='w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin' />
                  Creating Account...
                </div>
              ) : (
                'Create Account'
              )}
            </Button>
          </form>

          <div className='relative my-6'>
            <div className='absolute inset-0 flex items-center'>
              <span className='w-full border-t border-gray-300' />
            </div>
            <div className='relative flex justify-center text-sm'>
              <span className='px-4 bg-white text-gray-500'>Or continue with</span>
            </div>
          </div>

          <Button
            onClick={handleGmailSignUp}
            disabled={isSubmitting}
            className='w-full bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 font-medium py-4 px-6 rounded-lg transition-all duration-200 flex items-center justify-center transform hover:scale-[1.02]'
          >
            <Mail className='w-5 h-5 mr-2' />
            Continue with Gmail
          </Button>

          <div className='text-center mt-8'>
            <p className='text-gray-600'>
              Already have an account?{' '}
              <Link to='/login' className='text-lavender-600 hover:text-lavender-700 font-semibold underline'>
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
