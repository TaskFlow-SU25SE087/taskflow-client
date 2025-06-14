import React, { useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

const AboutPage: React.FC = () => {
  const headerRef = useRef<HTMLDivElement>(null)
  const heroRef = useRef<HTMLDivElement>(null)
  const storyRef = useRef<HTMLDivElement>(null)
  const valuesRef = useRef<HTMLDivElement>(null)
  const footerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const mainTl = gsap.timeline()

    if (headerRef.current) {
      // Header animations
      const header = headerRef.current
      const navItems = header.querySelectorAll('nav li')
      const headerButton = header.querySelector('button')
      const logo = header.querySelector('.text-2xl')

      mainTl
        .from(header, {
          yPercent: -100,
          duration: 0.6,
          ease: 'power2.out'
        })
        .from(
          [logo, ...navItems, headerButton],
          {
            y: -20,
            opacity: 0,
            duration: 0.4,
            stagger: 0.05,
            ease: 'power2.out'
          },
          '-=0.3'
        )
    }

    if (heroRef.current) {
      const hero = heroRef.current
      const title = hero.querySelector('h1')
      const subtitle = hero.querySelector('.subtitle')

      mainTl
        .from(title, {
          y: 30,
          opacity: 0,
          duration: 0.6,
          ease: 'power2.out'
        })
        .from(
          subtitle,
          {
            y: 20,
            opacity: 0,
            duration: 0.4,
            ease: 'power2.out'
          },
          '-=0.3'
        )
    }

    if (storyRef.current) {
      const story = storyRef.current
      const image = story.querySelector('.story-image')
      const content = story.querySelector('.story-content')

      gsap.from(image, {
        scrollTrigger: {
          trigger: image,
          start: 'top 80%'
        },
        x: -50,
        opacity: 0,
        duration: 0.8,
        ease: 'power2.out'
      })

      gsap.from(content, {
        scrollTrigger: {
          trigger: content,
          start: 'top 80%'
        },
        x: 50,
        opacity: 0,
        duration: 0.8,
        ease: 'power2.out'
      })
    }

    if (valuesRef.current) {
      const values = valuesRef.current
      const cards = values.querySelectorAll('.value-card')

      gsap.from(cards, {
        scrollTrigger: {
          trigger: values,
          start: 'top 75%'
        },
        y: 50,
        opacity: 0,
        duration: 0.6
      })
    }

    if (footerRef.current) {
      const footer = footerRef.current
      const columns = footer.querySelectorAll('.grid > div')
      const copyright = footer.querySelector('.mt-12')

      gsap.from(columns, {
        scrollTrigger: {
          trigger: footer,
          start: 'top 85%'
        },
        y: 30,
        opacity: 0,
        duration: 0.4,
        stagger: 0.1,
        ease: 'power2.out'
      })

      gsap.from(copyright, {
        scrollTrigger: {
          trigger: copyright,
          start: 'top 95%'
        },
        opacity: 0,
        y: 20,
        duration: 0.3,
        ease: 'power2.out'
      })
    }

    return () => {
      ScrollTrigger.getAll().forEach((trigger) => trigger.kill())
      mainTl.kill()
    }
  }, [])

  return (
    <div className='bg-[url(endless.svg)] text-gray-800 min-h-screen overflow-x-hidden'>
      {/* Header */}
      <header
        ref={headerRef}
        className='fixed top-0 left-0 right-0 z-50 px-5 bg-white bg-opacity-90 backdrop-blur-sm shadow-md'
      >
        <div className='container mx-auto px-8 py-4'>
          <div className='flex items-center justify-between'>
            <div className='text-2xl font-bold flex flex-row text-lavender-700'>
              <img src='/logo.png' alt='TaskFlow logo' className='h-8 w-8' />
              TaskFlow
            </div>
            <nav>
              <ul className='flex space-x-6'>
                <li>
                  <Link to='/' className='text-gray-600 hover:text-lavender-700 transition-colors'>
                    Home
                  </Link>
                </li>
                <li>
                  <Link to='/about' className='text-gray-600 hover:text-lavender-700 transition-colors'>
                    About
                  </Link>
                </li>
                <li>
                  <Link to='/contact' className='text-gray-600 hover:text-lavender-700 transition-colors'>
                    Contact
                  </Link>
                </li>
              </ul>
            </nav>
            <button className='bg-lavender-700 text-white px-6 py-2 rounded-full hover:bg-lavender-800 transition-colors'>
              Get Started
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section ref={heroRef} className='pt-32 pb-20 px-8 bg-gradient-to-b from-lavender-50 to-white'>
        <div className='container mx-auto text-center'>
          <h1 className='text-5xl font-bold mb-6 text-lavender-900'>About TaskFlow</h1>
          <p className='subtitle text-xl text-gray-600 max-w-3xl mx-auto'>
            Discover how we're revolutionizing project management and code testing for university students worldwide
          </p>
        </div>
      </section>

      {/* Story Section */}
      <section ref={storyRef} className='py-20 bg-white'>
        <div className='container mx-auto px-8'>
          <div className='flex flex-col lg:flex-row items-center gap-12'>
            <div className='lg:w-1/2 story-image'>
              <img
                src='https://mayphuongthao.com/wp-content/uploads/2022/12/dong-phuc-dai-hoc-fpt-4.jpg'
                alt='FPT University Campus'
                className='rounded-lg shadow-2xl object-cover h-[500px] w-full'
              />
            </div>
            <div className='lg:w-1/2 story-content'>
              <h2 className='text-4xl font-bold mb-6 text-lavender-900'>Our Story</h2>
              <div className='space-y-6 text-lg text-gray-700'>
                <p>
                  TaskFlow emerged from the innovative spirit of FPT University, Vietnam. What began as a student
                  project has evolved into a comprehensive platform that's transforming how university students approach
                  project management and code testing.
                </p>
                <p>
                  Our journey started when we recognized a crucial gap in the tools available to computer science
                  students. We needed something that could seamlessly integrate project management with code quality
                  assurance - so we built it ourselves.
                </p>
                <p>
                  Today, TaskFlow is used by thousands of students across multiple universities, helping them deliver
                  better code and manage their projects more effectively.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section ref={valuesRef} className='py-20 bg-gradient-to-b from-white to-lavender-50'>
        <div className='container mx-auto px-8'>
          <h2 className='text-4xl font-bold text-center mb-16 text-lavender-900'>Our Core Values</h2>
          <div className='grid grid-cols-1 md:grid-cols-3 gap-8'>
            <div className='value-card bg-white rounded-xl shadow-xl p-8 transform hover:-translate-y-2 transition-all duration-300'>
              <div className='w-16 h-16 bg-lavender-100 rounded-full flex items-center justify-center mb-6 mx-auto'>
                <svg className='w-8 h-8 text-lavender-600' fill='currentColor' viewBox='0 0 20 20'>
                  <path
                    fillRule='evenodd'
                    d='M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z'
                    clipRule='evenodd'
                  />
                </svg>
              </div>
              <h3 className='text-xl font-semibold text-center mb-4'>Innovation</h3>
              <p className='text-gray-600 text-center'>
                Pushing boundaries and exploring new ways to make project management and code testing more efficient.
              </p>
            </div>
            <div className='value-card bg-white rounded-xl shadow-xl p-8 transform hover:-translate-y-2 transition-all duration-300'>
              <div className='w-16 h-16 bg-lavender-100 rounded-full flex items-center justify-center mb-6 mx-auto'>
                <svg className='w-8 h-8 text-lavender-600' fill='currentColor' viewBox='0 0 20 20'>
                  <path d='M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z' />
                </svg>
              </div>
              <h3 className='text-xl font-semibold text-center mb-4'>Collaboration</h3>
              <p className='text-gray-600 text-center'>
                Building tools that foster teamwork and communication, essential skills for modern software development.
              </p>
            </div>
            <div className='value-card bg-white rounded-xl shadow-xl p-8 transform hover:-translate-y-2 transition-all duration-300'>
              <div className='w-16 h-16 bg-lavender-100 rounded-full flex items-center justify-center mb-6 mx-auto'>
                <svg className='w-8 h-8 text-lavender-600' fill='currentColor' viewBox='0 0 20 20'>
                  <path
                    fillRule='evenodd'
                    d='M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z'
                    clipRule='evenodd'
                  />
                </svg>
              </div>
              <h3 className='text-xl font-semibold text-center mb-4'>Excellence</h3>
              <p className='text-gray-600 text-center'>
                Committed to delivering the highest quality tools and maintaining exceptional standards in everything we
                do.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer ref={footerRef} className='bg-gray-800 text-white py-12'>
        <div className='container mx-auto px-8'>
          <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 px-5'>
            <div>
              <h3 className='text-2xl font-bold mb-4'>TaskFlow</h3>
              <p>Empowering students to achieve more through efficient project management and code quality tools.</p>
            </div>
            <div>
              <h4 className='text-lg font-semibold mb-4'>Quick Links</h4>
              <ul className='space-y-2'>
                <li>
                  <Link to='/' className='hover:text-lavender-500 transition-colors'>
                    Home
                  </Link>
                </li>
                <li>
                  <Link to='/about' className='hover:text-lavender-500 transition-colors'>
                    About
                  </Link>
                </li>
                <li>
                  <Link to='/contact' className='hover:text-lavender-500 transition-colors'>
                    Contact
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h4 className='text-lg font-semibold mb-4'>Connect</h4>
              <ul className='space-y-2'>
                <li>
                  <a href='#' className='hover:text-lavender-500 transition-colors'>
                    Twitter
                  </a>
                </li>
                <li>
                  <a href='#' className='hover:text-lavender-500 transition-colors'>
                    LinkedIn
                  </a>
                </li>
                <li>
                  <a href='#' className='hover:text-lavender-500 transition-colors'>
                    GitHub
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h4 className='text-lg font-semibold mb-4'>Newsletter</h4>
              <p className='mb-4'>Stay updated with our latest features and news.</p>
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
            <p>&copy; 2024 TaskFlow. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default AboutPage
