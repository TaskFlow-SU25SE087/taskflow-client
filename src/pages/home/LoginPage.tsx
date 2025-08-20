'use client'

import type React from 'react'

import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useAuth } from '@/hooks/useAuth'
import { gsap } from 'gsap'
import { ArrowLeft, Eye, EyeOff, Shield, Users, Zap } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'

export default function LoginPage() {
  const { login, error } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [rememberMe, setRememberMe] = useState(false)

  const containerRef = useRef<HTMLDivElement>(null)

  // Auto-fill email if saved
  useEffect(() => {
  const savedEmail = localStorage.getItem('rememberedEmail')
  if (savedEmail) setEmail(savedEmail)
  }, [])

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    e.stopPropagation() // Prevent event bubbling

    if (isSubmitting) return // Prevent double submission

    setIsSubmitting(true)

    // Save rememberMe state to localStorage for useAuthContext
    localStorage.setItem('rememberMe', rememberMe ? 'true' : 'false')

    try {
      await login(email, password)
      // Only handle success case for remember me
      if (rememberMe) {
        localStorage.setItem('rememberedEmail', email)
      } else {
        localStorage.removeItem('rememberedEmail')
      }
    } catch (error) {
      console.error('Login submission error:', error)
      // Error is already handled in the login function, don't do anything here
    } finally {
      setIsSubmitting(false)
    }
  }

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
            <h2 className='text-white text-3xl font-bold mb-4 leading-tight'>Welcome Back!</h2>
            <p className='text-lavender-100 text-xl leading-relaxed'>
              Sign in to continue managing your projects and analyzing code quality with our powerful tools.
            </p>
          </div>

          <div className='space-y-6'>
            <div className='flex items-center space-x-4'>
              <div className='w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm'>
                <Zap className='w-6 h-6 text-white' />
              </div>
              <div>
                <h3 className='text-white font-semibold'>Quick Access</h3>
                <p className='text-lavender-200 text-sm'>Jump right back into your projects</p>
              </div>
            </div>

            <div className='flex items-center space-x-4'>
              <div className='w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm'>
                <Shield className='w-6 h-6 text-white' />
              </div>
              <div>
                <h3 className='text-white font-semibold'>Secure Login</h3>
                <p className='text-lavender-200 text-sm'>Your data is protected and encrypted</p>
              </div>
            </div>

            <div className='flex items-center space-x-4'>
              <div className='w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm'>
                <Users className='w-6 h-6 text-white' />
              </div>
              <div>
                <h3 className='text-white font-semibold'>Team Sync</h3>
                <p className='text-lavender-200 text-sm'>Stay connected with your team</p>
              </div>
            </div>
          </div>

          <div className='mt-8 pt-8 border-t border-white/20'>
            <div className='inline-flex items-center px-3 py-1 bg-white/20 rounded-full backdrop-blur-sm'>
              <span className='text-sm font-medium text-white'>Trusted by FPT University Students</span>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Form */}
      <div className='w-full md:w-1/2 flex-1 flex justify-center items-center bg-white min-h-screen md:min-h-0 p-0 md:p-8'>
        <div className='w-full max-w-[420px] px-4 form-container'>
          <div className='text-center mb-8'>
            <h2 className='text-lavender-700 text-3xl font-bold mb-2'>Sign In</h2>
            <p className='text-gray-600'>Welcome back to TaskFlow</p>
          </div>

          <form onSubmit={handleSubmit} className='space-y-6'>
            {error && (
              <div className='form-field p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg'>{error}</div>
            )}

            <div className='form-field space-y-2'>
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
                disabled={isSubmitting}
                autoComplete='email'
                className='w-full p-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-lavender-600 focus:border-transparent transition-all'
              />
            </div>

            <div className='form-field space-y-2'>
              <div className='flex justify-between items-center'>
                <Label htmlFor='password' className='text-sm font-medium text-gray-700'>
                  Password
                </Label>
                <Link to='/forgot-password' className='text-sm text-lavender-600 hover:text-lavender-700 underline'>
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
                  autoComplete='current-password'
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

            <div className='form-field flex items-center space-x-3'>
              <Checkbox
                id='remember'
                checked={rememberMe}
                onCheckedChange={(val) => setRememberMe(val === true)}
                className='mt-0.5'
              />
              <label htmlFor='remember' className='text-sm text-gray-700 cursor-pointer'>
                Remember me
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
                  Signing in...
                </div>
              ) : (
                'Sign In'
              )}
            </Button>
          </form>

          <div className='text-center mt-8'>
            {/* <p className='text-gray-600 mb-4'>
              Don't have an account?{' '}
              <Link to='/signup' className='text-lavender-600 hover:text-lavender-700 font-semibold underline'>
                Sign up
              </Link>
            </p> */}
            <p className='text-xs text-gray-500 leading-relaxed'>
              By signing in, you acknowledge that you have read and agree to TaskFlow's{' '}
              <Link to='/terms' className='text-lavender-600 hover:text-lavender-700 underline'>
                Terms of Service
              </Link>{' '}
              and{' '}
              <Link to='/privacy' className='text-lavender-600 hover:text-lavender-700 underline'>
                Privacy Policy
              </Link>
              .
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
