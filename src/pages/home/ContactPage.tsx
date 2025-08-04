import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { Github, Linkedin, LogIn, Mail, MapPin, Phone, Twitter } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'

gsap.registerPlugin(ScrollTrigger)

export default function ContactPage() {
  const containerRef = useRef<HTMLDivElement>(null)
  const heroRef = useRef<HTMLDivElement>(null)
  const contactRef = useRef<HTMLDivElement>(null)
  const [mobileNavOpen, setMobileNavOpen] = useState(false)
  const mobileNavRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const ctx = gsap.context(() => {
      // Hero animations
      gsap.fromTo(
        '.hero-title',
        { y: 50, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.8, ease: 'power2.out', stagger: 0.1 }
      )

      gsap.fromTo(
        '.hero-subtitle',
        { y: 30, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.6, delay: 0.3, ease: 'power2.out' }
      )

      // Contact sections animation
      gsap.fromTo(
        '.info-section',
        { x: -50, opacity: 0 },
        {
          x: 0,
          opacity: 1,
          duration: 0.8,
          ease: 'power2.out',
          scrollTrigger: {
            trigger: contactRef.current,
            start: 'top 80%'
          }
        }
      )

      gsap.fromTo(
        '.form-section',
        { x: 50, opacity: 0 },
        {
          x: 0,
          opacity: 1,
          duration: 0.8,
          ease: 'power2.out',
          scrollTrigger: {
            trigger: contactRef.current,
            start: 'top 80%'
          }
        }
      )
    }, containerRef)

    return () => ctx.revert()
  }, [])

  // GSAP animation for mobile nav
  useEffect(() => {
    if (mobileNavOpen && mobileNavRef.current) {
      gsap.fromTo(
        mobileNavRef.current,
        { y: -20, opacity: 0, display: 'none' },
        { y: 0, opacity: 1, display: 'flex', duration: 0.35, ease: 'power2.out' }
      )
    } else if (mobileNavRef.current) {
      gsap.to(mobileNavRef.current, {
        y: -20,
        opacity: 0,
        duration: 0.25,
        ease: 'power2.in',
        onComplete: () => {
          if (mobileNavRef.current) mobileNavRef.current.style.display = 'none'
        }
      })
    }
  }, [mobileNavOpen])

  return (
    <div ref={containerRef} className='min-h-screen bg-white text-gray-900'>
      {/* Navigation */}
      <nav className='bg-white border-b border-gray-200 sticky top-0 z-50'>
        <div className='max-w-7xl mx-auto px-6 lg:px-12'>
          <div className='flex items-center justify-between h-16'>
            <Link to='/' className='flex items-center space-x-3'>
              <img src='/logo.png' alt='TaskFlow logo' className='h-8 w-8' />
              <span className='text-xl font-semibold text-gray-900'>TaskFlow</span>
            </Link>
            {/* Hamburger for mobile */}
            <button
              className='md:hidden flex flex-col justify-center items-center w-10 h-10 rounded hover:bg-gray-100 transition'
              aria-label='Open menu'
              onClick={() => setMobileNavOpen((v) => !v)}
            >
              <span className='block w-6 h-0.5 bg-gray-800 mb-1 rounded'></span>
              <span className='block w-6 h-0.5 bg-gray-800 mb-1 rounded'></span>
              <span className='block w-6 h-0.5 bg-gray-800 rounded'></span>
            </button>
            {/* Desktop nav */}
            <div className='hidden md:flex items-center space-x-8'>
              <Link to='/' className='text-gray-600 hover:text-gray-900 transition-colors'>
                Home
              </Link>
              <Link to='/about' className='text-gray-600 hover:text-gray-900 transition-colors'>
                About
              </Link>
              <Link to='/contact' className='text-lavender-600 font-medium'>
                Contact
              </Link>
              <button className='bg-lavender-600 text-white px-4 py-2 rounded-lg hover:bg-lavender-700 transition-colors'>
                Get Started
              </button>
            </div>
          </div>
          {/* Mobile nav dropdown with GSAP animation */}
          <div
            ref={mobileNavRef}
            style={{ display: mobileNavOpen ? 'flex' : 'none' }}
            className='md:hidden flex-col gap-2 py-4 bg-white shadow-lg rounded-b-xl'
          >
            {mobileNavOpen && (
              <>
                <Link
                  to='/'
                  className='block px-4 py-2 text-gray-600 hover:text-gray-900 rounded hover:bg-gray-100'
                  onClick={() => setMobileNavOpen(false)}
                >
                  Home
                </Link>
                <Link
                  to='/about'
                  className='block px-4 py-2 text-gray-600 hover:text-gray-900 rounded hover:bg-gray-100'
                  onClick={() => setMobileNavOpen(false)}
                >
                  About
                </Link>
                <Link
                  to='/contact'
                  className='block px-4 py-2 text-lavender-600 font-medium rounded hover:bg-gray-100'
                  onClick={() => setMobileNavOpen(false)}
                >
                  Contact
                </Link>
                {/* <Link
                  to='/signup'
                  className='block px-4 py-2 bg-lavender-600 text-white rounded hover:bg-lavender-700'
                  onClick={() => setMobileNavOpen(false)}
                >
                  Get Started
                </Link> */}
              </>
            )}
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section ref={heroRef} className='px-6 lg:px-12 py-20 bg-lavender-50'>
        <div className='max-w-7xl mx-auto text-center'>
          <div className='space-y-6'>
            <h1 className='hero-title text-5xl lg:text-6xl font-bold leading-tight text-gray-900'>
              Get in <span className='text-lavender-600'>Touch</span>
            </h1>
            <p className='hero-subtitle text-xl text-gray-600 leading-relaxed max-w-3xl mx-auto'>
              Have questions about TaskFlow? We're here to help you succeed in your projects.
            </p>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section ref={contactRef} className='px-6 lg:px-12 py-20'>
        <div className='max-w-7xl mx-auto'>
          <div className='grid lg:grid-cols-2 gap-16'>
            <div className='info-section space-y-8'>
              <div className='bg-white rounded-xl p-8 shadow-sm border border-gray-200'>
                <h2 className='text-2xl font-bold text-gray-900 mb-6'>Contact Information</h2>
                <div className='space-y-6'>
                  <div className='flex items-center space-x-4'>
                    <div className='w-12 h-12 bg-lavender-100 rounded-lg flex items-center justify-center'>
                      <Mail className='w-6 h-6 text-lavender-600' />
                    </div>
                    <div>
                      <p className='text-sm text-gray-500'>Email</p>
                      <p className='font-medium text-gray-900'>info@taskflow.com</p>
                    </div>
                  </div>

                  <div className='flex items-center space-x-4'>
                    <div className='w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center'>
                      <Phone className='w-6 h-6 text-green-600' />
                    </div>
                    <div>
                      <p className='text-sm text-gray-500'>Phone</p>
                      <p className='font-medium text-gray-900'>+84 123 456 789</p>
                    </div>
                  </div>

                  <div className='flex items-center space-x-4'>
                    <div className='w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center'>
                      <MapPin className='w-6 h-6 text-orange-600' />
                    </div>
                    <div>
                      <p className='text-sm text-gray-500'>Address</p>
                      <p className='font-medium text-gray-900'>Lô E2a-7, Đường D1, Long Thạnh Mỹ</p>
                      <p className='text-sm text-gray-500'>Thành Phố Thủ Đức, Hồ Chí Minh</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className='bg-white rounded-xl p-8 shadow-sm border border-gray-200'>
                <h3 className='text-xl font-semibold text-gray-900 mb-6'>Connect With Us</h3>
                <div className='flex space-x-4'>
                  <a
                    href='#'
                    className='w-12 h-12 bg-lavender-100 rounded-lg flex items-center justify-center hover:bg-lavender-200 transition-colors'
                  >
                    <Twitter className='w-6 h-6 text-lavender-600' />
                  </a>
                  <a
                    href='#'
                    className='w-12 h-12 bg-lavender-100 rounded-lg flex items-center justify-center hover:bg-lavender-200 transition-colors'
                  >
                    <Github className='w-6 h-6 text-lavender-600' />
                  </a>
                  <a
                    href='#'
                    className='w-12 h-12 bg-lavender-100 rounded-lg flex items-center justify-center hover:bg-lavender-200 transition-colors'
                  >
                    <Linkedin className='w-6 h-6 text-lavender-600' />
                  </a>
                </div>
              </div>
            </div>

            <div className='form-section'>
              <div className='bg-white rounded-xl shadow-sm border border-gray-200 p-8'>
                <h2 className='text-2xl font-bold text-gray-900 mb-6'>Send us a Message</h2>
                <form className='space-y-6'>
                  <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
                    <div>
                      <label htmlFor='name' className='block text-sm font-medium text-gray-700 mb-2'>
                        Name
                      </label>
                      <input
                        type='text'
                        id='name'
                        name='name'
                        className='w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-lavender-500 focus:border-transparent transition-colors'
                        placeholder='Your name'
                      />
                    </div>
                    <div>
                      <label htmlFor='email' className='block text-sm font-medium text-gray-700 mb-2'>
                        Email
                      </label>
                      <input
                        type='email'
                        id='email'
                        name='email'
                        className='w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-lavender-500 focus:border-transparent transition-colors'
                        placeholder='your@email.com'
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor='subject' className='block text-sm font-medium text-gray-700 mb-2'>
                      Subject
                    </label>
                    <input
                      type='text'
                      id='subject'
                      name='subject'
                      className='w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-lavender-500 focus:border-transparent transition-colors'
                      placeholder='How can we help?'
                    />
                  </div>

                  <div>
                    <label htmlFor='message' className='block text-sm font-medium text-gray-700 mb-2'>
                      Message
                    </label>
                    <textarea
                      id='message'
                      name='message'
                      rows={6}
                      className='w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-lavender-500 focus:border-transparent transition-colors'
                      placeholder='Your message...'
                    ></textarea>
                  </div>

                  <button
                    type='submit'
                    className='w-full bg-lavender-600 text-white py-4 px-6 rounded-lg hover:bg-lavender-700 transition-colors focus:outline-none focus:ring-2 focus:ring-lavender-500 focus:ring-offset-2 font-semibold'
                  >
                    Send Message
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className='bg-lavender-600 px-6 lg:px-12 py-20'>
        <div className='max-w-4xl mx-auto text-center'>
          <h2 className='text-4xl lg:text-5xl font-bold text-white mb-6'>Ready to Transform Your Workflow?</h2>
          <p className='text-xl text-lavender-100 mb-12 max-w-2xl mx-auto'>
            Join the future of project management and code quality. Start building better software today.
          </p>

          <div className='flex flex-col sm:flex-row gap-4 justify-center'>
            {/* <Link
              to='/signup'
              className='bg-white text-lavender-600 px-8 py-4 rounded-lg font-semibold hover:bg-gray-50 transition-colors flex items-center justify-center'
            >
              <Play className='w-5 h-5 mr-2' />
              Get Started Now
            </Link> */}
            <Link
              to='/login'
              className='border-2 border-white text-white px-8 py-4 rounded-lg font-semibold hover:bg-white hover:text-lavender-600 transition-colors flex items-center justify-center'
            >
              <LogIn className='w-5 h-5 mr-2' />
              Login
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className='bg-gray-50 px-6 lg:px-12 py-12 border-t border-gray-200'>
        <div className='max-w-7xl mx-auto'>
          <div className='flex flex-col md:flex-row justify-between items-center'>
            <Link to='/' className='flex items-center space-x-3 mb-4 md:mb-0'>
              <img src='/logo.png' alt='TaskFlow logo' className='h-8 w-8' />
              <span className='text-xl font-semibold text-gray-900'>TaskFlow</span>
            </Link>
            {/* Quick Links: stack and center on mobile */}
            <div className='w-full md:w-auto flex flex-col items-center md:items-start mb-6 md:mb-0'>
              <h4 className='text-lg font-semibold text-gray-900 mb-4'>Quick Links</h4>
              <ul className='flex flex-col items-center md:items-start space-y-2'>
                <li>
                  <Link to='/' className='text-gray-600 hover:text-lavender-600 transition-colors'>
                    Home
                  </Link>
                </li>
                <li>
                  <Link to='/about' className='text-gray-600 hover:text-lavender-600 transition-colors'>
                    About
                  </Link>
                </li>
                <li>
                  <Link to='/contact' className='text-gray-600 hover:text-lavender-600 transition-colors'>
                    Contact
                  </Link>
                </li>
              </ul>
            </div>
            <div className='text-gray-600 text-center md:text-right'>
              <p>© 2025 TaskFlow. Built with ❤️ for FPT university projects.</p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
