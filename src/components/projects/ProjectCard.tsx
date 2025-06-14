import { Project } from '@/types/project'
import { ProjectMember } from '@/types/project'
import { useEffect, useState } from 'react'
import { MoreHorizontal, LayoutDashboard, ExternalLink, Archive, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
import { projectMemberApi } from '@/api/projectMembers'
import Avatar from 'boring-avatars'

export default function ProjectCard({ project, onSelect }: { project: Project; onSelect: (id: string) => void }) {
  const [projectLeader, setProjectLeader] = useState<ProjectMember | null>(null)

  useEffect(() => {
    const fetchProjectMembers = async () => {
      try {
        const members = await projectMemberApi.getMembersByProjectId(project.id)
        const leader = members.find((member) => member.role === 'Leader')
        if (leader) {
          setProjectLeader(leader)
        }
      } catch (error) {
        console.error('Error fetching project members:', error)
      }
    }

    fetchProjectMembers()
  }, [project.id])

  return (
    <Card className='bg-white group'>
      <CardHeader className='p-5 pb-0'>
        <div className='flex justify-between items-center'>
          <div className='flex items-center gap-2 cursor-pointer' onClick={() => onSelect(project.id)}>
            <div className='h-10 w-10 rounded-lg bg-lavender-700/10 flex items-center justify-center'>
              <LayoutDashboard className='h-6 w-6 text-lavender-700' />
            </div>
            <div>
              <CardTitle className='text-lg font-semibold group-hover:text-lavender-700 transition-colors'>
                {project.title}
              </CardTitle>
            </div>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant='ghost' size='icon' className='h-8 w-8 -mt-6 rounded-lg text-gray-500 hover:bg-gray-100'>
                <MoreHorizontal className='h-5 w-5' />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align='end' className='bg-white shadow-md rounded-md p-2'>
              <DropdownMenuItem onClick={() => onSelect(project.id)} className='hover:bg-gray-100 rounded-sm'>
                <ExternalLink className='mr-2 h-4 w-4' />
                <span>Open Project</span>
              </DropdownMenuItem>
              <DropdownMenuItem className='hover:bg-gray-100 rounded-sm'>
                <Archive className='mr-2 h-4 w-4' />
                <span>Archive</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator className='my-1 bg-gray-200' />
              <DropdownMenuItem className='text-red-600 hover:!text-red-500 hover:bg-gray-100 rounded-sm'>
                <Trash2 className='mr-2 h-4 w-4' />
                <span>Delete</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>
      <CardContent className='p-5'>
        {projectLeader && (
          <div className='flex items-center gap-2 pt-4 border-t border-gray-100'>
            <Avatar size='32px' variant='beam' name={projectLeader.userId} />
            <div className='flex flex-col'>
              <span className='text-sm text-gray-600 font-medium'>{projectLeader.user.name}</span>
              <span className='text-xs text-gray-400'>Project Leader</span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
