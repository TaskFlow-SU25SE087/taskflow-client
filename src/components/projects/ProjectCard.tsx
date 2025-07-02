import { projectMemberApi } from '@/api/projectMembers'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
import { ProjectListItem, ProjectMember } from '@/types/project'
import Avatar from 'boring-avatars'
import { Archive, Clock, Edit, ExternalLink, LayoutDashboard, MoreHorizontal, Trash2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import { ProjectEditMenu } from './ProjectEditMenu'

interface ProjectCardProps {
  project: ProjectListItem
  onSelect: (id: string) => void
  onProjectUpdated?: () => void
}

export default function ProjectCard({ project, onSelect, onProjectUpdated }: ProjectCardProps) {
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

  const formatLastUpdate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60))
    
    if (diffInHours < 1) return 'Just now'
    if (diffInHours < 24) return `${diffInHours}h ago`
    if (diffInHours < 168) return `${Math.floor(diffInHours / 24)}d ago`
    return date.toLocaleDateString()
  }

  // Convert ProjectListItem to Project for ProjectEditMenu
  const projectForEdit = {
    id: project.id,
    title: project.title,
    description: project.description,
    ownerId: project.ownerId,
    createdAt: project.lastUpdate,
    lastUpdate: project.lastUpdate,
    role: project.role,
    analysisResults: [],
    boards: [],
    projectMembers: [],
    sprints: [],
    taskPs: []
  }

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
          <div className='flex items-center gap-2'>
            {/* Edit Button */}
            <ProjectEditMenu
              project={projectForEdit}
              onProjectUpdated={onProjectUpdated || (() => {})}
              trigger={
                <Button
                  variant='ghost'
                  size='icon'
                  className='h-8 w-8 rounded-lg text-gray-500 hover:bg-gray-100 hover:text-lavender-700'
                  title='Edit Project'
                >
                  <Edit className='h-4 w-4' />
                </Button>
              }
            />
            
            {/* More Options Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant='ghost' size='icon' className='h-8 w-8 rounded-lg text-gray-500 hover:bg-gray-100'>
                  <MoreHorizontal className='h-5 w-5' />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align='end' className='bg-white shadow-md rounded-md p-2'>
                <DropdownMenuItem onClick={() => onSelect(project.id)} className='hover:bg-gray-100 rounded-sm'>
                  <ExternalLink className='mr-2 h-4 w-4' />
                  <span>Open Project</span>
                </DropdownMenuItem>
                <DropdownMenuItem className='hover:bg-gray-100 rounded-sm'>
                  <Edit className='mr-2 h-4 w-4' />
                  <span>Edit Project</span>
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
        </div>
      </CardHeader>
      <CardContent className='p-5'>
        {project.description && (
          <div className='mb-4'>
            <p className='text-sm text-gray-600 line-clamp-2'>{project.description}</p>
          </div>
        )}
        
        <div className='flex items-center justify-between mb-4'>
          <div className='flex items-center gap-2'>
            <span className='inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-lavender-100 text-lavender-800'>
              {project.role}
            </span>
          </div>
          <div className='flex items-center gap-1 text-xs text-gray-500'>
            <Clock className='h-3 w-3' />
            <span>{formatLastUpdate(project.lastUpdate)}</span>
          </div>
        </div>

        {projectLeader && (
          <div className='flex items-center gap-2 pt-4 border-t border-gray-100'>
            {projectLeader.avatar ? (
              <img
                src={projectLeader.avatar}
                alt={projectLeader.fullName}
                className="h-8 w-8 rounded-full object-cover border"
                onError={e => (e.currentTarget.src = '/public/logo.png')}
              />
            ) : (
              <Avatar size='32px' variant='beam' name={projectLeader.fullName || projectLeader.userId} />
            )}
            <div className='flex flex-col'>
              <span className='text-sm text-gray-600 font-medium'>{projectLeader.fullName || 'No name'}</span>
              <span className='text-xs text-gray-400'>Project Leader</span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
