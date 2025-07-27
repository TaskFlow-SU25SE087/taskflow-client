import { Button } from '@/components/ui/button'
import { useProjectCreate } from '@/hooks/useProjectCreate'
import { ArrowLeft, ArrowRight, Copy, Layout, Loader2, Trello, Users } from 'lucide-react'
import { useState } from 'react'

export default function ProjectCreate() {
  const {
    step,
    boardName,
    setBoardName,
    description,
    setDescription,
    isLoading,
    memberEmail,
    setMemberEmail,
    addedEmails,
    isProjectCreated,
    handleContinue,
    handleBack,
    handleAddMember,
    inviteLinks,
    projectId
  } = useProjectCreate()

  const [showInvitePopup, setShowInvitePopup] = useState(false)
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null)

  const FE_BASE_URL = window.location.origin

  // Hiển thị popup khi có inviteLinks
  if (isProjectCreated && inviteLinks.length > 0 && !showInvitePopup) {
    setShowInvitePopup(true)
  }

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
            <div className='overflow-hidden'>
              <div
                className='flex transition-transform duration-300 ease-in-out'
                style={{ transform: `translateX(-${step * 100}%)` }}
              >
                {/* Step 1: Board Name */}
                <div className='w-full flex-shrink-0'>
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
                </div>

                {/* Step 2: Add Members */}
                <div className='w-full flex-shrink-0'>
                  <div className='text-center mb-8'>
                    <Users className='h-16 w-16 mx-auto text-lavender-700 mb-4' />
                    <h1 className='text-3xl font-bold'>Add team members</h1>
                    <p className='text-gray-600 mt-2'>Invite members by email to collaborate on this board</p>
                  </div>

                  <div className='space-y-6'>
                    <div>
                      <label htmlFor='memberEmail' className='block text-sm font-medium text-gray-700 mb-1'>
                        Email address
                      </label>
                      <input
                        type='email'
                        id='memberEmail'
                        value={memberEmail}
                        onChange={(e) => setMemberEmail(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault()
                            handleAddMember(memberEmail)
                          }
                        }}
                        placeholder='Enter email address'
                        className={inputStyle}
                      />
                      <p className='text-xs text-gray-500 mt-1'>Press Enter to add a team member</p>
                    </div>

                    {/* Added Members List */}
                    {addedEmails.length > 0 && (
                      <div className='space-y-2 mt-6'>
                        <label className='block text-sm font-medium text-gray-700'>
                          Added members ({addedEmails.length})
                        </label>
                        <div className='space-y-2'>
                          {addedEmails.map((email, index) => (
                            <div key={index} className='flex items-center justify-between p-2 bg-gray-50 rounded'>
                              <div className='flex items-center gap-2'>
                                <div className='h-8 w-8 rounded-full bg-lavender-700 flex items-center justify-center text-white'>
                                  {email[0].toUpperCase()}
                                </div>
                                <p className='text-sm text-gray-500'>{email}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className='mt-6 flex justify-between'>
              {step > 0 && !isProjectCreated && (
                <Button onClick={handleBack} variant='outline' className='flex items-center'>
                  <ArrowLeft className='mr-2 h-4 w-4' /> Back
                </Button>
              )}
              <div className='flex-grow'></div>
              <Button
                onClick={handleContinue}
                disabled={(step === 0 && !boardName.trim()) || isLoading}
                className='bg-lavender-700 hover:bg-lavender-800 text-white flex items-center'
              >
                {isLoading ? (
                  <>
                    <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                    Processing...
                  </>
                ) : (
                  <>
                    {step === 1 ? 'Finish Setup' : 'Create Project'}
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

      {showInvitePopup && (
        <div className='fixed inset-0 flex items-center justify-center bg-black bg-opacity-40 z-50'>
          <div className='bg-white rounded-lg shadow-lg p-6 min-w-[350px] max-w-[90vw]'>
            <h2 className='text-xl font-bold mb-4'>Link mời thành viên</h2>
            <ul className='space-y-2 mb-4'>
              {inviteLinks.map((item, idx) => {
                const link = `${FE_BASE_URL}/activate-account?token=${item.token}&projectId=${projectId}`
                return (
                  <li key={item.email} className='flex items-center gap-2'>
                    <span className='truncate max-w-[180px]' title={item.email}>
                      {item.email}
                    </span>
                    <input className='flex-1 border px-2 py-1 rounded text-xs' value={link} readOnly />
                    <Button
                      size='icon'
                      variant='outline'
                      onClick={() => {
                        navigator.clipboard.writeText(link)
                        setCopiedIndex(idx)
                        setTimeout(() => setCopiedIndex(null), 1200)
                      }}
                    >
                      <Copy className='h-4 w-4' />
                    </Button>
                    {copiedIndex === idx && <span className='text-green-600 text-xs ml-1'>Đã copy!</span>}
                  </li>
                )
              })}
            </ul>
            <Button onClick={() => setShowInvitePopup(false)} className='w-full'>
              Đóng
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
