import { useSignalR } from '@/contexts/SignalRContext'
import React, { useEffect } from 'react'

interface ProjectGroupManagerProps {
  projectId: string
}

const ProjectGroupManager: React.FC<ProjectGroupManagerProps> = ({ projectId }) => {
  const { signalRService, isConnected } = useSignalR()

  useEffect(() => {
    if (projectId && isConnected) {
      // Join project group when component mounts
      const joinGroup = async () => {
        try {
          await signalRService.joinProjectGroup(projectId)
        } catch (error) {
          console.error(`❌ Failed to join project group ${projectId}:`, error)
        }
      }

      joinGroup()

      return () => {
        // Leave project group when component unmounts
        const leaveGroup = async () => {
          try {
            await signalRService.leaveProjectGroup(projectId)
          } catch (error) {
            console.error(`❌ Failed to leave project group ${projectId}:`, error)
          }
        }

        leaveGroup()
      }
    }
  }, [projectId, signalRService, isConnected])

  // This component doesn't render anything visible
  return null
}

export default ProjectGroupManager
