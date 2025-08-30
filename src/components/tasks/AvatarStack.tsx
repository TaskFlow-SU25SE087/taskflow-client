import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar'
import { User } from 'lucide-react'
import React from 'react'

const avatarColors = [
  { bg: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', text: '#FFFFFF' },
  { bg: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)', text: '#FFFFFF' },
  { bg: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)', text: '#FFFFFF' },
  { bg: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)', text: '#000000' },
  { bg: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)', text: '#000000' },
  { bg: 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)', text: '#000000' },
  { bg: 'linear-gradient(135deg, #d299c2 0%, #fef9d7 100%)', text: '#000000' },
  { bg: 'linear-gradient(135deg, #89f7fe 0%, #66a6ff 100%)', text: '#000000' }
]

const getAvatarColor = (index: number) => avatarColors[index % avatarColors.length]

interface Assignee {
  projectMemberId?: string
  avatar?: string
  executor?: string
}

function AvatarStackComponent({ assignees }: { assignees: Assignee[] }) {
  if (!assignees || assignees.length === 0) {
    return (
      <div className='flex items-center gap-2 -ml-0.5'>
        <Avatar className='h-8 w-8 border-2 border-white shadow-sm'>
          <AvatarFallback className='bg-gray-200 text-gray-400 flex items-center justify-center'>
            <User className='w-4 h-4' />
          </AvatarFallback>
        </Avatar>
        <span className='text-xs font-medium text-gray-500'>No assignee</span>
      </div>
    )
  }
  return (
    <div className='flex -space-x-2 -ml-1'>
      {assignees.slice(0, 3).map((assignee, idx) => {
        const { bg, text } = getAvatarColor(idx)
        return (
          <Avatar
            key={assignee.projectMemberId || idx}
            className='h-8 w-8 border-2 border-white shadow-md ring-2 ring-white/50'
          >
            {assignee.avatar ? (
              <AvatarImage src={assignee.avatar} alt={assignee.executor} />
            ) : (
              <AvatarFallback style={{ background: bg, color: text }} className='text-xs font-medium'>
                {assignee.executor?.[0]?.toUpperCase() || '?'}
              </AvatarFallback>
            )}
          </Avatar>
        )
      })}
      {assignees.length > 3 && (
        <Avatar className='h-8 w-8 border-2 border-white shadow-md ring-2 ring-white/50'>
          <AvatarFallback className='bg-gradient-to-br from-gray-100 to-gray-200 text-gray-600 text-xs font-medium'>
            +{assignees.length - 3}
          </AvatarFallback>
        </Avatar>
      )}
    </div>
  )
}

export const AvatarStack = React.memo(AvatarStackComponent)
