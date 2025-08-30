import { projectApi } from '@/api/projects'
import { useToastContext } from '@/components/ui/ToastContext'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

export function useProjectCreate() {
  const [step, setStep] = useState(0)
  const [boardName, setBoardName] = useState('')
  const [description, setDescription] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [projectId, setProjectId] = useState<string>('')
  const [isProjectCreated, setIsProjectCreated] = useState(false)
  const navigate = useNavigate()
  const { showToast } = useToastContext()

  const handleContinue = async () => {
    if (step === 0 && boardName.trim()) {
      setIsLoading(true)
      try {
        await projectApi.createProject(boardName.trim(), description.trim()).then(async (response) => {
          console.log('WHEN CREATED: ', response.data.id)
          setProjectId(response.data.id)
          setIsProjectCreated(true)
          showToast({ title: 'Success', description: 'Project created successfully!' })
          // Navigate directly to projects page after creation
          navigate('/projects')
        })
      } catch (error: any) {
        if (error.response?.data?.code === 3004) {
          showToast({ 
            title: 'Project limit reached', 
            description: 'You have reached the maximum number of projects allowed. Please delete old projects or contact the administrator for support.', 
            variant: 'destructive' 
          })
        } else if (error.response?.data?.errors) {
          // Hiển thị tất cả lỗi validation từ API
          const errors = error.response.data.errors
          const errorMessages = Object.entries(errors)
            .map(([field, messages]) => `${field}: ${(messages as string[]).join(', ')}`)
            .join('\n')
          showToast({ title: 'Validation error', description: errorMessages, variant: 'destructive' })
        } else {
          showToast({ 
            title: 'Project creation failed', 
            description: 'Unable to create the project. Please try again.', 
            variant: 'destructive' 
          })
        }
      } finally {
        setIsLoading(false)
      }
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
    isProjectCreated,
    handleContinue,
    handleBack,
    projectId
  }
}
