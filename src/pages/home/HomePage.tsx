import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import React, { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'

gsap.registerPlugin(ScrollTrigger)

const HomePage: React.FC = () => {
  const headerRef = useRef<HTMLDivElement>(null)
  const heroRef = useRef<HTMLDivElement>(null)
  const featuresRef = useRef<HTMLDivElement>(null)
  const ctaRef = useRef<HTMLDivElement>(null)
  const footerRef = useRef<HTMLDivElement>(null)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  // Header animation
  useEffect(() => {
    if (!headerRef.current) return
    const header = headerRef.current
    const navItems = Array.from(header.querySelectorAll('nav li'))
    const headerButton = header.querySelector('button')
    const logo = header.querySelector('.text-2xl')
    const targets = [logo, ...navItems, headerButton].filter(Boolean)
    const mainTl = gsap.timeline()
    mainTl.from(header, { yPercent: -100, duration: 0.6, ease: 'power2.out' })
    if (targets.length > 0) {
      mainTl.from(targets, { y: -20, opacity: 0, duration: 0.4, stagger: 0.05, ease: 'power2.out' }, '-=0.3')
    }
    return () => {
      mainTl.kill()
    }
  }, [])

  // Hero animation
  useEffect(() => {
    if (!heroRef.current) return
    const hero = heroRef.current
    const heading = hero.querySelector('h1')
    const heroParagraph = hero.querySelector('p')
    const heroButtons = Array.from(hero.querySelectorAll('.flex.space-x-4 a'))
    const heroImage = hero.querySelector('.hero-image')
    const tl = gsap.timeline()
    if (heading) tl.from(heading, { opacity: 0, y: 30, duration: 0.4, ease: 'power2.out' })
    if (heroParagraph) tl.from(heroParagraph, { opacity: 0, y: 20, duration: 0.4, ease: 'power2.out' }, '-=0.2')
    if (heroButtons.length > 0)
      tl.from(heroButtons, { opacity: 0, y: 20, duration: 0.3, stagger: 0.1, ease: 'power2.out' }, '-=0.2')
    if (heroImage) tl.from(heroImage, { opacity: 0, y: 30, duration: 0.5, ease: 'power2.out' }, '-=0.3')
    return () => {
      tl.kill()
    }
  }, [])

  // Features animation
  useEffect(() => {
    if (!featuresRef.current) return
    const features = featuresRef.current
    const featureHeading = features.querySelector('h2')
    const cards = Array.from(features.querySelectorAll('.feature-card'))
    if (featureHeading) {
      gsap.from(featureHeading, {
        scrollTrigger: { trigger: featureHeading, start: 'top 100%' },
        opacity: 0,
        duration: 0.5,
        ease: 'power2.out'
      })
    }
    if (cards.length > 0) {
      gsap.from(cards, {
        scrollTrigger: { trigger: cards, start: 'top 85%' },
        opacity: 0,
        duration: 0.4,
        stagger: 0.1,
        ease: 'power2.out'
      })
    }
    return () => {
      ScrollTrigger.getAll().forEach((trigger) => trigger.kill())
    }
  }, [])

  // CTA animation
  useEffect(() => {
    if (!ctaRef.current) return
    const cta = ctaRef.current
    const ctaHeading = cta.querySelector('h2')
    const ctaParagraph = cta.querySelector('p')
    const ctaButton = cta.querySelector('button')
    const ctaTargets = [ctaHeading, ctaParagraph, ctaButton].filter(Boolean)
    const ctaTl = gsap.timeline({
      scrollTrigger: { trigger: cta, start: 'top 75%' }
    })
    if (ctaTargets.length > 0) {
      ctaTl.from(ctaTargets, {
        opacity: 0,
        y: 30,
        duration: 0.4,
        stagger: 0.1,
        ease: 'power2.out'
      })
    }
    return () => {
      ctaTl.kill()
    }
  }, [])

  // Footer animation
  useEffect(() => {
    if (!footerRef.current) return
    const footer = footerRef.current
    const columns = Array.from(footer.querySelectorAll('.grid > div'))
    const copyright = footer.querySelector('.mt-12')
    if (columns.length > 0) {
      gsap.from(columns, {
        scrollTrigger: { trigger: footer, start: 'top 85%' },
        opacity: 0,
        y: 30,
        duration: 0.4,
        stagger: 0.1,
        ease: 'power2.out'
      })
    }
    if (copyright) {
      gsap.from(copyright, {
        scrollTrigger: { trigger: copyright, start: 'top 95%' },
        opacity: 0,
        y: 20,
        duration: 0.3,
        ease: 'power2.out'
      })
    }
    return () => {
      ScrollTrigger.getAll().forEach((trigger) => trigger.kill())
    }
  }, [])

  return (
    <div className='bg-[url(endless.svg)] text-gray-800 min-h-screen overflow-x-hidden'>
      {/* Header */}
      <header
        ref={headerRef}
        className='fixed top-0 left-0 right-0 z-50 px-2 sm:px-5 bg-white bg-opacity-90 backdrop-blur-sm shadow-md'
      >
        <div className='container mx-auto px-3 sm:px-8 py-3 sm:py-4'>
          <div className='flex items-center justify-between'>
            <div className='text-xl sm:text-2xl font-bold flex flex-row text-lavender-700 items-center gap-2'>
              <img src='/logo.png' alt='TaskFlow logo' className='h-7 w-7 sm:h-8 sm:w-8' />
              TaskFlow
            </div>
            {/* Desktop Nav */}
            <nav className='hidden md:block'>
              <ul className='flex space-x-6'>
                <li>
                  <Link to='/' className='text-gray-600 hover:text-lavender-700 transition-colors'>
                    Home
                  </Link>
                </li>
                <li>
                  <Link to='about' className='text-gray-600 hover:text-lavender-700 transition-colors'>
                    About
                  </Link>
                </li>
                <li>
                  <Link to='contact' className='text-gray-600 hover:text-lavender-700 transition-colors'>
                    Contact
                  </Link>
                </li>
              </ul>
            </nav>
            <button className='hidden md:inline-block bg-lavender-700 text-white px-6 py-2 rounded-full hover:bg-lavender-800 transition-colors'>
              Get Started
            </button>
            {/* Hamburger for mobile */}
            <button
              className='md:hidden flex items-center justify-center p-2 rounded hover:bg-gray-100 transition-colors'
              onClick={() => setMobileMenuOpen((v) => !v)}
              aria-label='Open menu'
            >
              <svg
                className='h-6 w-6 text-lavender-700'
                fill='none'
                stroke='currentColor'
                strokeWidth='2'
                viewBox='0 0 24 24'
              >
                <path strokeLinecap='round' strokeLinejoin='round' d='M4 6h16M4 12h16M4 18h16' />
              </svg>
            </button>
          </div>
          {/* Mobile menu dropdown */}
          {mobileMenuOpen && (
            <div className='md:hidden mt-2 bg-white rounded-lg shadow-lg py-2 px-4'>
              <ul className='flex flex-col gap-2'>
                <li>
                  <Link
                    to='/'
                    className='block py-2 text-gray-600 hover:text-lavender-700'
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Home
                  </Link>
                </li>
                <li>
                  <Link
                    to='about'
                    className='block py-2 text-gray-600 hover:text-lavender-700'
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    About
                  </Link>
                </li>
                <li>
                  <Link
                    to='contact'
                    className='block py-2 text-gray-600 hover:text-lavender-700'
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Contact
                  </Link>
                </li>
                <li>
                  <button
                    className='w-full bg-lavender-700 text-white px-4 py-2 rounded-full hover:bg-lavender-800 transition-colors mt-2'
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Get Started
                  </button>
                </li>
              </ul>
            </div>
          )}
        </div>
      </header>

      {/* Hero Section */}
      <section ref={heroRef} className='pt-32 pb-20 px-8'>
        <div className='container mx-auto flex items-center px-5'>
          <div className='w-1/2 pr-12'>
            <h1 className='text-5xl font-bold mb-6 leading-tight'>
              <span className='text-lavender-700'>Master Your Workflow</span> with TaskFlow
            </h1>
            <p className='text-xl mb-8'>
              TaskFlow combines powerful project management with advanced code testing, tailored for university
              students. Boost your productivity and code quality for free!
            </p>
            <div className='flex space-x-4'>
              <Link
                to='/signup'
                className='bg-lavender-700 text-white px-8 py-3 rounded-full text-lg font-semibold hover:bg-lavender-800 transition-colors flex justify-center items-center'
              >
                Start Now
              </Link>
              <Link
                to='/login'
                className='bg-white text-lavender-700 px-8 py-3 rounded-full text-lg font-semibold hover:bg-gray-100 transition-colors border border-lavender-700 flex justify-center items-center'
              >
                Login
              </Link>
            </div>
          </div>
          <div className='w-1/2'>
            <div className='hero-image relative'>
              <img src='/landing2.png' alt='TaskFlow Pic' className='rounded-lg shadow-2xl' />
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id='features' ref={featuresRef} className='py-20 bg-gradient-to-b from-white to-lavender-50'>
        <div className='container mx-auto px-8'>
          <h2 className='text-4xl font-bold text-center mb-12'>Powerful Features for Student Success</h2>
          <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 px-5 gap-8 md:gap-12'>
            <FeatureCard
              icon='📊'
              title='Intuitive Project Management'
              description='Organize tasks, set deadlines, and collaborate seamlessly with your team.'
            />
            <FeatureCard
              icon='🧪'
              title='Advanced Code Testing'
              description='Integrate automated code quality checks and receive instant feedback.'
            />
            <FeatureCard
              icon='📈'
              title='Performance Analytics'
              description='Track your progress and identify areas for improvement with detailed insights.'
            />
            <FeatureCard
              icon='🔗'
              title='GitHub Integration'
              description='Connect your GitHub repositories for seamless code synchronization.'
            />
            <FeatureCard
              icon='🔍'
              title='Code Review Tools'
              description='Streamline your code review process with built-in collaboration features.'
            />
            <FeatureCard
              icon='🔒'
              title='Secure & Private'
              description='Your data is protected with enterprise-grade security measures.'
            />
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section ref={ctaRef} className='py-20 bg-lavender-700 text-white'>
        <div className='container mx-auto px-8 text-center'>
          <h2 className='text-4xl font-bold mb-6'>Ready to Master Your Workflow?</h2>
          <p className='text-xl mb-8'>
            Join thousands of students already using TaskFlow to streamline their projects.
          </p>
          <button className='bg-white text-lavender-700 px-8 py-3 rounded-full text-lg font-semibold hover:bg-gray-100 transition-colors'>
            Get Started for Free
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer ref={footerRef} className='bg-gray-800 text-white py-12'>
        <div className='container mx-auto px-8'>
          <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 px-5'>
            <div className='min-w-0'>
              <h3 className='text-2xl font-bold mb-4 text-white'>TaskFlow</h3>
              <p className='text-white'>
                Empowering students to achieve more through efficient project management and code quality tools.
              </p>
            </div>
            <div className='min-w-0'>
              <h4 className='text-lg font-semibold mb-4 text-white'>Quick Links</h4>
              <ul className='space-y-2'>
                <li>
                  <a href='#' className='hover:text-lavender-500 transition-colors text-white'>
                    Home
                  </a>
                </li>
                <li>
                  <a href='#features' className='hover:text-lavender-500 transition-colors text-white'>
                    Features
                  </a>
                </li>
                <li>
                  <a href='#about' className='hover:text-lavender-500 transition-colors text-white'>
                    About
                  </a>
                </li>
                <li>
                  <a href='#contact' className='hover:text-lavender-500 transition-colors text-white'>
                    Contact
                  </a>
                </li>
              </ul>
            </div>
            <div className='min-w-0'>
              <h4 className='text-lg font-semibold mb-4 text-white'>Connect</h4>
              <ul className='space-y-2'>
                <li>
                  <a href='#' className='hover:text-lavender-500 transition-colors text-white'>
                    Twitter
                  </a>
                </li>
                <li>
                  <a href='#' className='hover:text-lavender-500 transition-colors text-white'>
                    LinkedIn
                  </a>
                </li>
                <li>
                  <a href='#' className='hover:text-lavender-500 transition-colors text-white'>
                    GitHub
                  </a>
                </li>
              </ul>
            </div>
            <div className='min-w-0'>
              <h4 className='text-lg font-semibold mb-4 text-white'>Newsletter</h4>
              <p className='mb-4 text-white'>Stay updated with our latest features and news.</p>
              <form className='flex'>
                <input
                  type='email'
                  placeholder='Your email'
                  className='px-4 py-2 w-full rounded-l-full focus:outline-none focus:ring-2 focus:ring-lavender-700 text-gray-800'
                />
                <button
                  type='submit'
                  className='bg-lavender-700 text-white px-6 py-2 rounded-r-full hover:bg-lavender-800 transition-colors'
                >
                  Subscribe
                </button>
              </form>
            </div>
          </div>
          <div className='mt-12 text-center'>
            <p className='text-white'>&copy; 2024 TaskFlow. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}

const FeatureCard: React.FC<{ icon: string; title: string; description: string }> = ({ icon, title, description }) => (
  <div className='feature-card bg-white rounded-lg shadow-lg p-6'>
    <div className='text-4xl mb-4'>{icon}</div>
    <h3 className='text-xl font-semibold mb-2'>{title}</h3>
    <p className='text-gray-600'>{description}</p>
  </div>
)

export default HomePage
