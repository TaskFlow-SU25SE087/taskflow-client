/* eslint-disable @typescript-eslint/no-unused-vars */
import { useState } from 'react'
import { useToast } from '@/hooks/use-toast'
import { projectApi } from '@/api/projects'
import { useNavigate } from 'react-router-dom'
import axiosClient from '@/configs/axiosClient'

export function useProjectCreate() {
  const [step, setStep] = useState(0)
  const [boardName, setBoardName] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [projectId, setProjectId] = useState<string>('')
  const [memberEmail, setMemberEmail] = useState('')
  const [addedEmails, setAddedEmails] = useState<string[]>([])
  const [isProjectCreated, setIsProjectCreated] = useState(false)
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
        await projectApi.createProject(boardName.trim()).then((project) => {
          console.log('WHEN CREATED: ', project.projectId)
          setProjectId(project.projectId)
          setIsProjectCreated(true)
          setStep(1)
        })
      } catch (error) {
        toast({
          title: 'Project creation failed',
          description: 'Unable to create the project. Please try again.',
          variant: 'destructive'
        })
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
    isLoading,
    memberEmail,
    setMemberEmail,
    addedEmails,
    isProjectCreated,
    handleContinue,
    handleBack,
    handleAddMember
  }
}
