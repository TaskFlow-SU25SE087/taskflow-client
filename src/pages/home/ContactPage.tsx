import React, { useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

const ContactPage: React.FC = () => {
  const headerRef = useRef<HTMLDivElement>(null)
  const heroRef = useRef<HTMLDivElement>(null)
  const contactRef = useRef<HTMLDivElement>(null)
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

    if (contactRef.current) {
      const contact = contactRef.current
      const infoSection = contact.querySelector('.info-section')
      const formSection = contact.querySelector('.form-section')

      gsap.from(infoSection, {
        scrollTrigger: {
          trigger: infoSection,
          start: 'top 80%'
        },
        x: -50,
        opacity: 0,
        duration: 0.8,
        ease: 'power2.out'
      })

      gsap.from(formSection, {
        scrollTrigger: {
          trigger: formSection,
          start: 'top 80%'
        },
        x: 50,
        opacity: 0,
        duration: 0.8,
        ease: 'power2.out'
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
          <h1 className='text-5xl font-bold mb-6 text-lavender-900'>Get in Touch</h1>
          <p className='subtitle text-xl text-gray-600 max-w-3xl mx-auto'>
            Have questions about TaskFlow? We're here to help you succeed in your projects.
          </p>
        </div>
      </section>

      {/* Contact Section */}
      <section ref={contactRef} className='py-20 bg-white'>
        <div className='container mx-auto px-8'>
          <div className='flex flex-col lg:flex-row gap-12'>
            <div className='lg:w-1/2 info-section space-y-8'>
              <div className='bg-lavender-50 rounded-xl p-8 shadow-lg'>
                <h2 className='text-2xl font-bold mb-6 text-lavender-900'>Contact Information</h2>
                <div className='space-y-4'>
                  <div className='flex items-center space-x-4'>
                    <div className='w-10 h-10 bg-lavender-200 rounded-full flex items-center justify-center'>
                      <svg className='w-5 h-5 text-lavender-700' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                        <path
                          strokeLinecap='round'
                          strokeLinejoin='round'
                          strokeWidth={2}
                          d='M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z'
                        />
                      </svg>
                    </div>
                    <div>
                      <p className='text-sm text-gray-600'>Email</p>
                      <p className='font-medium'>info@taskflow.com</p>
                    </div>
                  </div>
                  <div className='flex items-center space-x-4'>
                    <div className='w-10 h-10 bg-lavender-200 rounded-full flex items-center justify-center'>
                      <svg className='w-5 h-5 text-lavender-700' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                        <path
                          strokeLinecap='round'
                          strokeLinejoin='round'
                          strokeWidth={2}
                          d='M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z'
                        />
                      </svg>
                    </div>
                    <div>
                      <p className='text-sm text-gray-600'>Phone</p>
                      <p className='font-medium'>+84 123 456 789</p>
                    </div>
                  </div>
                  <div className='flex items-center space-x-4'>
                    <div className='w-10 h-10 bg-lavender-200 rounded-full flex items-center justify-center'>
                      <svg className='w-5 h-5 text-lavender-700' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                        <path
                          strokeLinecap='round'
                          strokeLinejoin='round'
                          strokeWidth={2}
                          d='M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z'
                        />
                        <path
                          strokeLinecap='round'
                          strokeLinejoin='round'
                          strokeWidth={2}
                          d='M15 11a3 3 0 11-6 0 3 3 0 016 0z'
                        />
                      </svg>
                    </div>
                    <div>
                      <p className='text-sm text-gray-600'>Address</p>
                      <p className='font-medium'>Lô E2a-7, Đường D1, Long Thạnh Mỹ</p>
                      <p className='text-sm text-gray-600'>Thành Phố Thủ Đức, Hồ Chí Minh</p>
                    </div>
                  </div>
                </div>
              </div>
              <div className='bg-white rounded-xl p-8 shadow-lg'>
                <h3 className='text-xl font-semibold mb-4 text-lavender-900'>Connect With Us</h3>
                <div className='flex space-x-4'>
                  <a
                    href='#'
                    className='w-10 h-10 bg-lavender-100 rounded-full flex items-center justify-center hover:bg-lavender-200 transition-colors'
                  >
                    <svg className='w-5 h-5 text-lavender-700' fill='currentColor' viewBox='0 0 24 24'>
                      <path d='M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84' />
                    </svg>
                  </a>
                  <a
                    href='#'
                    className='w-10 h-10 bg-lavender-100 rounded-full flex items-center justify-center hover:bg-lavender-200 transition-colors'
                  >
                    <svg className='w-5 h-5 text-lavender-700' fill='currentColor' viewBox='0 0 24 24'>
                      <path
                        fillRule='evenodd'
                        d='M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0  .688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z'
                        clipRule='evenodd'
                      />
                    </svg>
                  </a>
                  <a
                    href='#'
                    className='w-10 h-10 bg-lavender-100 rounded-full flex items-center justify-center hover:bg-lavender-200 transition-colors'
                  >
                    <svg className='w-5 h-5 text-lavender-700' fill='currentColor' viewBox='0 0 24 24'>
                      <path d='M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z' />
                    </svg>
                  </a>
                </div>
              </div>
            </div>
            <div className='lg:w-1/2 form-section'>
              <div className='bg-white rounded-xl shadow-lg p-8'>
                <h2 className='text-2xl font-bold mb-6 text-lavender-900'>Send us a Message</h2>
                <form className='space-y-6'>
                  <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
                    <div>
                      <label htmlFor='name' className='block text-sm font-medium text-gray-700 mb-1'>
                        Name
                      </label>
                      <input
                        type='text'
                        id='name'
                        name='name'
                        className='w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-lavender-500 focus:border-transparent transition-colors'
                        placeholder='Your name'
                      />
                    </div>
                    <div>
                      <label htmlFor='email' className='block text-sm font-medium text-gray-700 mb-1'>
                        Email
                      </label>
                      <input
                        type='email'
                        id='email'
                        name='email'
                        className='w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-lavender-500 focus:border-transparent transition-colors'
                        placeholder='your@email.com'
                      />
                    </div>
                  </div>
                  <div>
                    <label htmlFor='subject' className='block text-sm font-medium text-gray-700 mb-1'>
                      Subject
                    </label>
                    <input
                      type='text'
                      id='subject'
                      name='subject'
                      className='w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-lavender-500 focus:border-transparent transition-colors'
                      placeholder='How can we help?'
                    />
                  </div>
                  <div>
                    <label htmlFor='message' className='block text-sm font-medium text-gray-700 mb-1'>
                      Message
                    </label>
                    <textarea
                      id='message'
                      name='message'
                      rows={6}
                      className='w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-lavender-500 focus:border-transparent transition-colors'
                      placeholder='Your message...'
                    ></textarea>
                  </div>
                  <button
                    type='submit'
                    className='w-full bg-lavender-700 text-white py-3 px-6 rounded-lg hover:bg-lavender-800 transition-colors focus:outline-none focus:ring-2 focus:ring-lavender-500 focus:ring-offset-2'
                  >
                    Send Message
                  </button>
                </form>
              </div>
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

export default ContactPage
