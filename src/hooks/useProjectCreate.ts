/* eslint-disable @typescript-eslint/no-unused-vars */
import { projectMemberApi } from '@/api/projectMembers'
import { projectApi } from '@/api/projects'
import axiosClient from '@/configs/axiosClient'
import { useToast } from '@/hooks/use-toast'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

export function useProjectCreate() {
  const [step, setStep] = useState(0)
  const [boardName, setBoardName] = useState('')
  const [description, setDescription] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [projectId, setProjectId] = useState<string>('')
  const [memberEmail, setMemberEmail] = useState('')
  const [addedEmails, setAddedEmails] = useState<string[]>([])
  const [isProjectCreated, setIsProjectCreated] = useState(false)
  const [inviteLinks, setInviteLinks] = useState<{email: string, token: string}[]>([])
  const navigate = useNavigate()
  const { toast } = useToast()

  const handleAddMember = async (email: string) => {
    if (!email.trim()) return
    try {
      await axiosClient.post(`/api/projectmember/projectId=${projectId}/add`, {
        email,
        role: 'member'
      })
      setAddedEmails((prev) => [...prev, email])
      setMemberEmail('')
      toast({
        title: 'Member added',
        description: 'Team member has been added successfully.'
      })
    } catch (error) {
      toast({
        title: 'Failed to add member',
        description: 'The email address is not associated with any account.',
        variant: 'destructive'
      })
    }
  }

  const handleContinue = async () => {
    if (step === 0 && boardName.trim()) {
      setIsLoading(true)
      try {
        await projectApi.createProject(boardName.trim(), description.trim()).then(async (response) => {
          console.log('WHEN CREATED: ', response.data.id)
          setProjectId(response.data.id)
          setIsProjectCreated(true)
          setStep(1)
          if (addedEmails.length > 0) {
            const results = await Promise.all(
              addedEmails.map(email => projectMemberApi.addMember(response.data.id, email))
            )
            setInviteLinks(results)
            toast({
              title: 'Đã mời thành viên',
              description: `Đã gửi lời mời cho ${addedEmails.length} thành viên.`
            })
          }
        })
      } catch (error: any) {
        if (error.response?.data?.code === 3004) {
          toast({
            title: 'Project limit reached',
            description: 'You have reached the maximum number of projects allowed. Please delete old projects or contact the administrator for support.',
            variant: 'destructive'
          })
        } else if (error.response?.data?.errors?.description) {
          toast({
            title: 'Validation error',
            description: error.response.data.errors.description[0],
            variant: 'destructive'
          })
        } else {
          toast({
            title: 'Project creation failed',
            description: 'Unable to create the project. Please try again.',
            variant: 'destructive'
          })
        }
      } finally {
        setIsLoading(false)
      }
    } else if (step === 1) {
      navigate('/projects')
    }
  }

  const handleBack = () => {
    if (step > 0 && !isProjectCreated) {
      setStep(step - 1)
    }
  }

  return {
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
  }
}
