import { Button } from '@/components/ui/button'
import { useProjectMembers } from '@/hooks/useProjectMembers'
import { ProjectMember } from '@/types/project'
import { useState } from 'react'

interface ProjectMemberListProps {
  projectId: string
  members: ProjectMember[]
  onMemberRemoved: () => void
  currentUserId: string
  isOwnerOrAdmin: boolean
}

export function ProjectMemberList({
  projectId,
  members,
  onMemberRemoved,
  currentUserId,
  isOwnerOrAdmin
}: ProjectMemberListProps) {
  const { removeMember, loading } = useProjectMembers()
  const [removingId, setRemovingId] = useState<string | null>(null)

  const handleRemove = async (userId: string) => {
    setRemovingId(userId)
    try {
      await removeMember(projectId, userId)
      onMemberRemoved()
    } finally {
      setRemovingId(null)
    }
  }

  return (
    <div className='space-y-2'>
      {members.map((member) => (
        <div key={member.id} className='flex items-center justify-between p-2 bg-gray-50 rounded'>
          <div className='flex items-center gap-2'></div>
          {isOwnerOrAdmin && member.userId !== currentUserId && (
            <Button
              variant='destructive'
              size='sm'
              onClick={() => handleRemove(member.userId)}
              disabled={loading || removingId === member.userId}
            >
              {removingId === member.userId ? 'Đang xóa...' : 'Xóa'}
            </Button>
          )}
        </div>
      ))}
    </div>
  )
}
