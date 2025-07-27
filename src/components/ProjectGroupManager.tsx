import { useSignalR } from '@/contexts/SignalRContext'
import React, { useEffect } from 'react'

interface ProjectGroupManagerProps {
  projectId: string
}

const ProjectGroupManager: React.FC<ProjectGroupManagerProps> = ({ projectId }) => {
  const { signalRService, isConnected } = useSignalR()

  useEffect(() => {
    // Đã comment logic join/leave group vì backend không hỗ trợ
    // if (projectId && isConnected) {
    //   // Join project group when component mounts
    //   const joinGroup = async () => {
    //     try {
    //       await signalRService.joinProjectGroup(projectId)
    //       console.log(`✅ Joined project group: ${projectId}`)
    //     } catch (error) {
    //       console.error(`❌ Failed to join project group ${projectId}:`, error)
    //     }
    //   }
    //   joinGroup()
    //   return () => {
    //     // Leave project group when component unmounts
    //     const leaveGroup = async () => {
    //       try {
    //         await signalRService.leaveProjectGroup(projectId)
    //         console.log(`✅ Left project group: ${projectId}`)
    //       } catch (error) {
    //         console.error(`❌ Failed to leave project group ${projectId}:`, error)
    //       }
    //     }
    //     leaveGroup()
    //   }
    // }
  }, [projectId, signalRService, isConnected])

  // This component doesn't render anything visible
  return null
}

export default ProjectGroupManager
