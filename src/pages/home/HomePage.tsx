import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import {
  CheckCircle,
  Code,
  GitBranch,
  Users,
  Shield,
  BarChart3,
  Rocket,
  Play,
  Star,
  Calendar,
  Bug,
  Target,
  LogIn
} from 'lucide-react'

gsap.registerPlugin(ScrollTrigger)

export default function HomePage() {
  const containerRef = useRef<HTMLDivElement>(null)
  const heroRef = useRef<HTMLDivElement>(null)
  const featuresRef = useRef<HTMLDivElement>(null)
  const statsRef = useRef<HTMLDivElement>(null)
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

      gsap.fromTo(
        '.hero-cta',
        { y: 20, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.5, delay: 0.5, ease: 'power2.out' }
      )

      // Features scroll animations
      gsap.fromTo(
        '.feature-card',
        { y: 40, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.6,
          ease: 'power2.out',
          stagger: 0.1,
          scrollTrigger: {
            trigger: featuresRef.current,
            start: 'top 80%',
            end: 'bottom 20%'
          }
        }
      )

      // Stats counter animation
      gsap.fromTo(
        '.stat-number',
        { textContent: 0 },
        {
          textContent: (_i: any, target: { getAttribute: (arg0: string) => any }) => target.getAttribute('data-value'),
          duration: 1.5,
          ease: 'power2.out',
          snap: { textContent: 1 },
          scrollTrigger: {
            trigger: statsRef.current,
            start: 'top 80%'
          }
        }
      )
    }, containerRef)

    return () => ctx.revert()
  }, [])

  // Animate mobile nav dropdown
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
              <Link to='/' className='text-lavender-600 font-medium'>
                Home
              </Link>
              <Link to='/about' className='text-gray-600 hover:text-gray-900 transition-colors'>
                About
              </Link>
              <Link to='/contact' className='text-gray-600 hover:text-gray-900 transition-colors'>
                Contact
              </Link>
              <Link
                to='/signup'
                className='bg-lavender-600 text-white px-4 py-2 rounded-lg hover:bg-lavender-700 transition-colors'
              >
                Get Started
              </Link>
            </div>
          </div>
          {/* Mobile nav dropdown with GSAP animation - now positioned absolutely */}
          <div
            ref={mobileNavRef}
            style={{ display: mobileNavOpen ? 'flex' : 'none' }}
            className='md:hidden absolute left-0 right-0 top-16 flex-col gap-2 py-4 bg-white shadow-lg rounded-b-xl border-t border-gray-200 z-40'
          >
            {mobileNavOpen && (
              <>
                <Link
                  to='/'
                  className='block px-6 py-2 text-lavender-600 font-medium rounded hover:bg-gray-100 mx-2'
                  onClick={() => setMobileNavOpen(false)}
                >
                  Home
                </Link>
                <Link
                  to='/about'
                  className='block px-6 py-2 text-gray-600 hover:text-gray-900 rounded hover:bg-gray-100 mx-2'
                  onClick={() => setMobileNavOpen(false)}
                >
                  About
                </Link>
                <Link
                  to='/contact'
                  className='block px-6 py-2 text-gray-600 hover:text-gray-900 rounded hover:bg-gray-100 mx-2'
                  onClick={() => setMobileNavOpen(false)}
                >
                  Contact
                </Link>
                <Link
                  to='/signup'
                  className='block px-6 py-2 bg-lavender-600 text-white rounded hover:bg-lavender-700 mx-2'
                  onClick={() => setMobileNavOpen(false)}
                >
                  Get Started
                </Link>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section ref={heroRef} className='px-6 lg:px-12 py-20'>
        <div className='max-w-7xl mx-auto'>
          <div className='grid lg:grid-cols-2 gap-16 items-center'>
            <div className='space-y-8'>
              <div className='space-y-6'>
                <div className='hero-title inline-flex items-center px-3 py-1 bg-orange-50 rounded-full border border-orange-200'>
                  <Star className='w-4 h-4 mr-2 text-orange-600' />
                  <span className='text-sm font-medium text-orange-700'>FPT University Project</span>
                </div>
                <h1 className='hero-title text-5xl lg:text-6xl font-bold leading-tight text-gray-900'>
                  Project Management
                  <span className='block text-lavender-600'>Meets Code Quality</span>
                </h1>
                <p className='hero-subtitle text-xl text-gray-600 leading-relaxed'>
                  TaskFlow combines powerful project management with advanced code testing, tailored for FPT university
                  students. Boost your productivity and code quality for free!
                </p>
              </div>

              <div className='hero-cta flex flex-col sm:flex-row gap-4'>
                <Link
                  to='/signup'
                  className='bg-lavender-600 text-white px-8 py-3 rounded-lg font-medium hover:bg-lavender-700 transition-colors flex items-center justify-center'
                >
                  <Play className='w-5 h-5 mr-2' />
                  Start Building
                </Link>
                <Link
                  to='/login'
                  className='border border-gray-300 text-gray-700 px-8 py-3 rounded-lg font-medium hover:border-gray-400 hover:bg-gray-50 transition-colors flex items-center justify-center'
                >
                  <LogIn className='w-5 h-5 mr-2' />
                  Login
                </Link>
              </div>

              <div className='flex items-center space-x-12 pt-8'>
                <div>
                  <div className='text-2xl font-bold text-lavender-600'>100%</div>
                  <div className='text-sm text-gray-500'>Open Source</div>
                </div>
                <div>
                  <div className='text-2xl font-bold text-green-600'>24/7</div>
                  <div className='text-sm text-gray-500'>Code Analysis</div>
                </div>
                <div>
                  <div className='text-2xl font-bold text-gray-900'>∞</div>
                  <div className='text-sm text-gray-500'>Possibilities</div>
                </div>
              </div>
            </div>

            <div className='relative'>
              <div className='bg-white rounded-xl shadow-lg border border-gray-200 p-6'>
                <div className='space-y-6'>
                  <div className='flex items-center justify-between'>
                    <h3 className='text-lg font-semibold text-gray-900'>Active Sprint</h3>
                    <div className='flex items-center space-x-2'>
                      <div className='w-2 h-2 bg-green-500 rounded-full'></div>
                      <span className='text-sm text-gray-500'>Live</span>
                    </div>
                  </div>

                  <div className='space-y-3'>
                    <div className='flex items-center justify-between p-3 bg-gray-50 rounded-lg'>
                      <div className='flex items-center space-x-3'>
                        <CheckCircle className='w-5 h-5 text-green-600' />
                        <span className='text-gray-900'>Authentication System</span>
                      </div>
                      <span className='text-sm text-green-600 font-medium'>Done</span>
                    </div>

                    <div className='flex items-center justify-between p-3 bg-lavender-50 rounded-lg'>
                      <div className='flex items-center space-x-3'>
                        <Code className='w-5 h-5 text-lavender-600' />
                        <span className='text-gray-900'>API Integration</span>
                      </div>
                      <span className='text-sm text-lavender-600 font-medium'>In Progress</span>
                    </div>

                    <div className='flex items-center justify-between p-3 bg-yellow-50 rounded-lg'>
                      <div className='flex items-center space-x-3'>
                        <Bug className='w-5 h-5 text-yellow-600' />
                        <span className='text-gray-900'>Code Quality Check</span>
                      </div>
                      <span className='text-sm text-yellow-600 font-medium'>Review</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className='absolute -bottom-4 -right-4 bg-white rounded-lg shadow-lg border border-gray-200 p-4'>
                <div className='flex items-center space-x-3'>
                  <div className='w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center'>
                    <BarChart3 className='w-5 h-5 text-green-600' />
                  </div>
                  <div>
                    <div className='text-sm text-gray-500'>Code Quality</div>
                    <div className='text-xl font-bold text-green-600'>98.5%</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section ref={featuresRef} id='features' className='bg-gray-50 px-6 lg:px-12 py-20'>
        <div className='max-w-7xl mx-auto'>
          <div className='text-center mb-16'>
            <h2 className='text-4xl lg:text-5xl font-bold text-gray-900 mb-4'>Why Choose TaskFlow?</h2>
            <p className='text-xl text-gray-600 max-w-3xl mx-auto'>
              Experience the perfect fusion of project management and code quality analysis in one powerful platform.
            </p>
          </div>

          <div className='grid md:grid-cols-2 lg:grid-cols-3 gap-8'>
            <div className='feature-card bg-white rounded-xl p-8 shadow-sm border border-gray-200 hover:shadow-md transition-shadow'>
              <div className='w-12 h-12 bg-lavender-100 rounded-lg flex items-center justify-center mb-6'>
                <Calendar className='w-6 h-6 text-lavender-600' />
              </div>
              <h3 className='text-xl font-semibold text-gray-900 mb-4'>Sprint Management</h3>
              <p className='text-gray-600 leading-relaxed'>
                Organize your work with intuitive sprint planning, backlog management, and real-time progress tracking.
              </p>
            </div>

            <div className='feature-card bg-white rounded-xl p-8 shadow-sm border border-gray-200 hover:shadow-md transition-shadow'>
              <div className='w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-6'>
                <Shield className='w-6 h-6 text-green-600' />
              </div>
              <h3 className='text-xl font-semibold text-gray-900 mb-4'>Code Quality Analysis</h3>
              <p className='text-gray-600 leading-relaxed'>
                Integrated SonarQube-style analysis ensures your code meets the highest quality standards automatically.
              </p>
            </div>

            <div className='feature-card bg-white rounded-xl p-8 shadow-sm border border-gray-200 hover:shadow-md transition-shadow'>
              <div className='w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-6'>
                <GitBranch className='w-6 h-6 text-purple-600' />
              </div>
              <h3 className='text-xl font-semibold text-gray-900 mb-4'>Git Integration</h3>
              <p className='text-gray-600 leading-relaxed'>
                Seamlessly connect with your Git repositories for automated code analysis and deployment tracking.
              </p>
            </div>

            <div className='feature-card bg-white rounded-xl p-8 shadow-sm border border-gray-200 hover:shadow-md transition-shadow'>
              <div className='w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mb-6'>
                <Users className='w-6 h-6 text-orange-600' />
              </div>
              <h3 className='text-xl font-semibold text-gray-900 mb-4'>Team Collaboration</h3>
              <p className='text-gray-600 leading-relaxed'>
                Built-in communication tools, code reviews, and team dashboards keep everyone aligned and productive.
              </p>
            </div>

            <div className='feature-card bg-white rounded-xl p-8 shadow-sm border border-gray-200 hover:shadow-md transition-shadow'>
              <div className='w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center mb-6'>
                <Target className='w-6 h-6 text-red-600' />
              </div>
              <h3 className='text-xl font-semibold text-gray-900 mb-4'>Smart Analytics</h3>
              <p className='text-gray-600 leading-relaxed'>
                Advanced metrics and insights help you understand team performance and code quality trends over time.
              </p>
            </div>

            <div className='feature-card bg-white rounded-xl p-8 shadow-sm border border-gray-200 hover:shadow-md transition-shadow'>
              <div className='w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center mb-6'>
                <Rocket className='w-6 h-6 text-indigo-600' />
              </div>
              <h3 className='text-xl font-semibold text-gray-900 mb-4'>Continuous Integration</h3>
              <p className='text-gray-600 leading-relaxed'>
                Automated workflows trigger quality checks and deployment processes based on your project milestones.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section ref={statsRef} id='stats' className='px-6 lg:px-12 py-20'>
        <div className='max-w-7xl mx-auto'>
          <div className='bg-white rounded-xl shadow-sm border border-gray-200 p-12'>
            <div className='text-center mb-12'>
              <h2 className='text-4xl lg:text-5xl font-bold text-gray-900 mb-4'>Built for Excellence</h2>
              <p className='text-xl text-gray-600'>
                Empowering FPT University teams to build, collaborate, and deliver with confidence.
              </p>
            </div>

            <div className='grid md:grid-cols-4 gap-8'>
              <div className='text-center'>
                <div className='text-4xl font-bold text-lavender-600 mb-2'>
                  <span className='stat-number' data-value='50'>
                    0
                  </span>
                  +
                </div>
                <div className='text-gray-600 font-medium'>Active Projects</div>
              </div>

              <div className='text-center'>
                <div className='text-4xl font-bold text-green-600 mb-2'>
                  <span className='stat-number' data-value='1000'>
                    0
                  </span>
                  +
                </div>
                <div className='text-gray-600 font-medium'>Code Reviews</div>
              </div>

              <div className='text-center'>
                <div className='text-4xl font-bold text-purple-600 mb-2'>
                  <span className='stat-number' data-value='99'>
                    0
                  </span>
                  %
                </div>
                <div className='text-gray-600 font-medium'>Uptime</div>
              </div>

              <div className='text-center'>
                <div className='text-4xl font-bold text-orange-600 mb-2'>
                  <span className='stat-number' data-value='24'>
                    0
                  </span>
                  /7
                </div>
                <div className='text-gray-600 font-medium'>Support</div>
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
