import { useSignalR } from '@/contexts/SignalRContext'
import { cn } from '@/lib/utils'
import { Loader2, Wifi, WifiOff } from 'lucide-react'
import React from 'react'

const ConnectionStatus: React.FC = () => {
  const { connectionState } = useSignalR()

  const getStatusInfo = () => {
    switch (connectionState) {
      case 'Connected':
        return {
          icon: Wifi,
          color: 'text-green-500',
          bgColor: 'bg-green-100',
          text: 'Connected'
        }
      case 'Reconnecting':
        return {
          icon: Loader2,
          color: 'text-yellow-500',
          bgColor: 'bg-yellow-100',
          text: 'Reconnecting...'
        }
      case 'Disconnected':
      case 'Failed':
      default:
        return {
          icon: WifiOff,
          color: 'text-red-500',
          bgColor: 'bg-red-100',
          text: 'Disconnected'
        }
    }
  }

  const statusInfo = getStatusInfo()
  const IconComponent = statusInfo.icon

  return (
    <div className={cn('flex items-center gap-2 px-2 py-1 rounded-full text-xs', statusInfo.bgColor, statusInfo.color)}>
      <IconComponent className={cn('h-3 w-3', connectionState === 'Reconnecting' && 'animate-spin')} />
      <span className='font-medium'>{statusInfo.text}</span>
    </div>
  )
}

export default ConnectionStatus
