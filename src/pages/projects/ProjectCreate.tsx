import { Button } from '@/components/ui/button'
import { useProjectCreate } from '@/hooks/useProjectCreate'
import { ArrowRight, Layout, Loader2, Trello } from 'lucide-react'

export default function ProjectCreate() {
  const { boardName, setBoardName, description, setDescription, isLoading, handleContinue } = useProjectCreate()

  const inputStyle = `w-full bg-transparent text-foreground placeholder-gray-400 text-lg 
    border-b-2 border-gray-200 focus:border-lavender-700 
    transition-colors duration-300 focus:outline-none focus:ring-0`

  const textareaStyle = `w-full bg-transparent text-foreground placeholder-gray-400 text-lg 
    border-b-2 border-gray-200 focus:border-lavender-700 
    transition-colors duration-300 focus:outline-none focus:ring-0 resize-none`

  return (
    <div className='min-h-screen bg-background flex flex-col'>
      <nav className='bg-lavender-700 p-4'>
        <div className='container mx-auto flex items-center'>
          <div className='flex items-center text-white'>
            <Trello className='h-6 w-6 mr-2' />
            <span className='text-xl font-bold'>TaskFlow</span>
          </div>
        </div>
      </nav>

      <div className='flex-grow flex flex-col lg:flex-row'>
        <div className='w-full lg:w-[45%] p-6 md:p-8 lg:p-0 flex items-center justify-center'>
          <div className='max-w-md w-full'>
            {/* Project Creation Form */}
            <div className='text-center mb-8'>
              <Layout className='h-16 w-16 mx-auto text-lavender-700 mb-4' />
              <h1 className='text-3xl font-bold'>Let's build a project</h1>
              <p className='text-gray-600 mt-2'>
                Boost your productivity by making it easier for everyone to access boards in one location.
              </p>
            </div>
            <div className='space-y-6'>
              <div>
                <label htmlFor='boardName' className='block text-sm font-medium text-gray-700 mb-1'>
                  Project name
                </label>
                <input
                  type='text'
                  id='boardName'
                  value={boardName}
                  onChange={(e) => setBoardName(e.target.value)}
                  placeholder="Taco's Co. Leadership"
                  className={inputStyle}
                />
                <p className='text-xs text-gray-500 mt-1'>
                  👋 Project names can include letters, numbers, and special characters.
                </p>
              </div>
              <div>
                <label htmlFor='description' className='block text-sm font-medium text-gray-700 mb-1'>
                  Project description
                </label>
                <textarea
                  id='description'
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder='Describe your project goals and objectives...'
                  className={textareaStyle}
                  rows={3}
                />
                <p className='text-xs text-gray-500 mt-1'>
                  📝 Optional: Add a description to help team members understand the project.
                </p>
              </div>
            </div>

            <div className='mt-6 flex justify-end'>
              <Button
                onClick={handleContinue}
                disabled={!boardName.trim() || isLoading}
                className='bg-lavender-700 hover:bg-lavender-800 text-white flex items-center'
              >
                {isLoading ? (
                  <>
                    <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                    Creating...
                  </>
                ) : (
                  <>
                    Create Project
                    <ArrowRight className='ml-2 h-4 w-4' />
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>

        <div className='hidden lg:block lg:w-[55%] bg-muted'>
          <div className='h-full w-full relative'>
            <img src='/bg.jpg' alt='TaskFlow Board Preview' className='h-full w-full object-cover' />
          </div>
        </div>
      </div>
    </div>
  )
}