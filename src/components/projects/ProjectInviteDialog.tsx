import { projectMemberApi } from '@/api/projectMembers'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { useToastContext } from '@/components/ui/ToastContext'
import { AxiosError } from 'axios'
import { Loader2, Users } from 'lucide-react'
import { useState } from 'react'

interface ProjectInviteDialogProps {
  isOpen: boolean
  onClose: () => void
  projectId: string
  onMemberAdded: () => void
}

export function ProjectInviteDialog({ isOpen, onClose, projectId, onMemberAdded }: ProjectInviteDialogProps) {
  const [memberEmail, setMemberEmail] = useState('')
  const [addedEmails, setAddedEmails] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const { showToast } = useToastContext()

  const handleAddMember = async (email: string) => {
    const trimmedEmail = email.trim()
    if (!trimmedEmail) return

    if (!trimmedEmail.includes('@')) {
      showToast({
        title: 'Invalid email',
        description: 'Please enter a valid email address',
        variant: 'destructive'
      })
      return
    }

    if (addedEmails.includes(trimmedEmail)) {
      showToast({
        title: 'Duplicate email',
        description: 'This email has already been added',
        variant: 'destructive'
      })
      return
    }

    setAddedEmails([...addedEmails, trimmedEmail])
    setMemberEmail('')
  }

  const handleFinish = async () => {
    if (addedEmails.length === 0) {
      showToast({
        title: 'No members added',
        description: 'Please add at least one member to invite',
        variant: 'destructive'
      })
      return
    }

    setIsLoading(true)
    try {
      await Promise.all(
        addedEmails.map(async (email) => {
          await projectMemberApi.addMember(projectId, email)
        })
      )
      showToast({
        title: 'Success',
        description: `Invited ${addedEmails.length} member${addedEmails.length > 1 ? 's' : ''}`
      })
      onMemberAdded()
      onClose()
    } catch (error) {
      let errorMessage = 'Failed to invite members. Please try again.'

      if (error instanceof AxiosError && error.response?.data?.message) {
        if (error.response.data.code === 3004) {
          errorMessage =
            'You have reached the maximum number of projects allowed. Please remove a project or contact support.'
        } else {
          errorMessage = error.response.data.message
        }
      }

      showToast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive'
      })
    } finally {
      setIsLoading(false)
    }
  }

  const inputStyle = `w-full bg-transparent text-foreground placeholder-gray-400 text-lg 
    border-b-2 border-gray-200 focus:border-lavender-700 
    transition-colors duration-300 focus:outline-none focus:ring-0`

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className='sm:max-w-md'>
        <DialogHeader>
          <DialogTitle className='text-center'>
            <div className='flex flex-col items-center gap-4'>
              <Users className='h-12 w-12 text-lavender-700' />
              <div>
                <h2 className='text-2xl font-bold'>Invite team members</h2>
                <p className='text-sm text-gray-500 mt-1'>Add members to collaborate on this project</p>
              </div>
            </div>
          </DialogTitle>
        </DialogHeader>
        <DialogDescription>
          Enter the email addresses of the members you want to invite to this project. You can add multiple emails,
          press Enter to add each one.
        </DialogDescription>

        <div className='space-y-6 py-4'>
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

          {addedEmails.length > 0 && (
            <div className='space-y-2'>
              <label className='block text-sm font-medium text-gray-700'>Added members ({addedEmails.length})</label>
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

        <div className='flex justify-end gap-2'>
          <Button variant='outline' onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={handleFinish}
            disabled={isLoading}
            className='bg-lavender-700 hover:bg-lavender-800 text-white'
          >
            {isLoading ? (
              <>
                <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                Inviting...
              </>
            ) : (
              'Send Invites'
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
