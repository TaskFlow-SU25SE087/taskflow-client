import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { Play, LogIn } from 'lucide-react'

gsap.registerPlugin(ScrollTrigger)

export default function AboutPage() {
  const containerRef = useRef<HTMLDivElement>(null)
  const storyRef = useRef<HTMLDivElement>(null)
  const valuesRef = useRef<HTMLDivElement>(null)
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

      // Story scroll animations
      gsap.fromTo(
        '.story-image',
        { x: -50, opacity: 0 },
        {
          x: 0,
          opacity: 1,
          duration: 0.8,
          ease: 'power2.out',
          scrollTrigger: {
            trigger: storyRef.current,
            start: 'top 80%'
          }
        }
      )

      gsap.fromTo(
        '.story-content',
        { x: 50, opacity: 0 },
        {
          x: 0,
          opacity: 1,
          duration: 0.8,
          ease: 'power2.out',
          scrollTrigger: {
            trigger: storyRef.current,
            start: 'top 80%'
          }
        }
      )

      // Values cards animation
      gsap.fromTo(
        '.value-card',
        { y: 40, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.6,
          ease: 'power2.out',
          stagger: 0.1,
          scrollTrigger: {
            trigger: valuesRef.current,
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
        <div className='max-w-7xl mx-auto px-6 lg:px-12 relative'>
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
              <Link to='/about' className='text-lavender-600 font-medium'>
                About
              </Link>
              <Link to='/contact' className='text-gray-600 hover:text-gray-900 transition-colors'>
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
            className='md:hidden flex-col gap-2 py-4 bg-white shadow-lg rounded-b-xl absolute left-0 right-0 top-full z-50'
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
                  className='block px-4 py-2 text-lavender-600 font-medium rounded hover:bg-gray-100'
                  onClick={() => setMobileNavOpen(false)}
                >
                  About
                </Link>
                <Link
                  to='/contact'
                  className='block px-4 py-2 text-gray-600 hover:text-gray-900 rounded hover:bg-gray-100'
                  onClick={() => setMobileNavOpen(false)}
                >
                  Contact
                </Link>
                <Link
                  to='/signup'
                  className='block px-4 py-2 bg-lavender-600 text-white rounded hover:bg-lavender-700'
                  onClick={() => setMobileNavOpen(false)}
                >
                  Get Started
                </Link>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* Story Section */}
      <section ref={storyRef} className='px-6 lg:px-12 py-20'>
        <div className='max-w-7xl mx-auto'>
          <div className='grid lg:grid-cols-2 gap-16 items-center'>
            <div className='story-image'>
              <img
                src='https://mayphuongthao.com/wp-content/uploads/2022/12/dong-phuc-dai-hoc-fpt-4.jpg'
                alt='FPT University Campus'
                className='rounded-xl shadow-lg object-cover h-[500px] w-full'
              />
            </div>
            <div className='story-content space-y-6'>
              <h2 className='text-4xl font-bold text-gray-900'>Our Story</h2>
              <div className='space-y-6 text-lg text-gray-600 leading-relaxed'>
                <p>
                  TaskFlow was created by and for students at FPT University, Vietnam. What began as a student project
                  has grown into a platform designed specifically to help FPT students manage their projects and test
                  their code more efficiently.
                </p>
                <p>
                  The idea for TaskFlow came from recognizing a gap in the tools available to computer science students
                  at our university. We needed a solution that could bring together project management and code quality
                  assurance in one place—so we built it ourselves.
                </p>
                <p>
                  TaskFlow is meant to be used by FPT University students to streamline teamwork, improve code quality,
                  and make project management simpler and more effective.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section ref={valuesRef} className='bg-gray-50 px-6 lg:px-12 py-20'>
        <div className='max-w-7xl mx-auto'>
          <div className='text-center mb-16'>
            <h2 className='text-4xl lg:text-5xl font-bold text-gray-900 mb-4'>Our Core Values</h2>
            <p className='text-xl text-gray-600'>The principles that guide everything we do</p>
          </div>

          <div className='grid md:grid-cols-3 gap-8'>
            <div className='value-card bg-white rounded-xl p-8 shadow-sm border border-gray-200 hover:shadow-md transition-shadow'>
              <div className='w-12 h-12 bg-lavender-100 rounded-lg flex items-center justify-center mb-6'>
                <svg className='w-6 h-6 text-lavender-600' fill='currentColor' viewBox='0 0 20 20'>
                  <path
                    fillRule='evenodd'
                    d='M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z'
                    clipRule='evenodd'
                  />
                </svg>
              </div>
              <h3 className='text-xl font-semibold text-gray-900 mb-4'>Innovation</h3>
              <p className='text-gray-600 leading-relaxed'>
                Pushing boundaries and exploring new ways to make project management and code testing more efficient.
              </p>
            </div>

            <div className='value-card bg-white rounded-xl p-8 shadow-sm border border-gray-200 hover:shadow-md transition-shadow'>
              <div className='w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-6'>
                <svg className='w-6 h-6 text-green-600' fill='currentColor' viewBox='0 0 20 20'>
                  <path d='M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z' />
                </svg>
              </div>
              <h3 className='text-xl font-semibold text-gray-900 mb-4'>Collaboration</h3>
              <p className='text-gray-600 leading-relaxed'>
                Building tools that foster teamwork and communication, essential skills for modern software development.
              </p>
            </div>

            <div className='value-card bg-white rounded-xl p-8 shadow-sm border border-gray-200 hover:shadow-md transition-shadow'>
              <div className='w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-6'>
                <svg className='w-6 h-6 text-purple-600' fill='currentColor' viewBox='0 0 20 20'>
                  <path
                    fillRule='evenodd'
                    d='M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z'
                    clipRule='evenodd'
                  />
                </svg>
              </div>
              <h3 className='text-xl font-semibold text-gray-900 mb-4'>Excellence</h3>
              <p className='text-gray-600 leading-relaxed'>
                Committed to delivering the highest quality tools and maintaining exceptional standards in everything we
                do.
              </p>
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
            <Link
              to='/signup'
              className='bg-white text-lavender-600 px-8 py-4 rounded-lg font-semibold hover:bg-gray-50 transition-colors flex items-center justify-center'
            >
              <Play className='w-5 h-5 mr-2' />
              Get Started Now
            </Link>
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
