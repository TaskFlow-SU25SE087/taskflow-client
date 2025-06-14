import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronDown, Filter, Link2, Pencil, Plus, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useCurrentProject } from '@/hooks/useCurrentProject'
import { useBoards } from '@/hooks/useBoards'
import { Sidebar } from '@/components/Sidebar'
import { Navbar } from '@/components/Navbar'
import { TaskColumn } from '@/components/tasks/TaskColumn'
import { useToast } from '@/hooks/use-toast'
import { projectMemberApi } from '@/api/projectMembers'
import { ProjectMember } from '@/types/project'
import { ProjectEditMenu } from '@/components/projects/ProjectEditMenu'
import { ProjectInviteDialog } from '@/components/projects/ProjectInviteDialog'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Loader } from '@/components/ui/loader'
import { TaskP } from '@/types/task'
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area'
import TaskBoardCreateMenu from '@/components/tasks/TaskBoardCreateMenu'

interface MemberAvatarProps {
  name: string
  background: string
  textColor: string
  className?: string
}

const boardColors: { [key: string]: string } = {
  'To-Do': '#5030E5',
  'In Progress': '#FFA500',
  Done: '#8BC34A',
  Backlog: '#E84393',
  'In Review': '#00B894',
  Blocked: '#FF4757',
  Testing: '#9B59B6',
  Deployed: '#27AE60'
}

const getBoardColor = (status: string): string => {
  return boardColors[status] || '#5030E5' // fallback to default color
}

function MemberAvatar({ name, background, textColor, className = '' }: MemberAvatarProps) {
  const initials = name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()

  return (
    <div className={`relative transition-transform hover:scale-110 hover:z-10 ${className}`}>
      <Avatar className='h-10 w-10'>
        <AvatarFallback
          className='text-sm font-semibold tracking-wider absolute inset-0 flex items-center justify-center'
          style={{ background, color: textColor }}
        >
          {initials}
        </AvatarFallback>
      </Avatar>
    </div>
  )
}

const avatarColors = [
  { bg: 'linear-gradient(135deg, #FF6B6B 0%, #FF8E8E 100%)', text: '#FFFFFF' },
  { bg: 'linear-gradient(135deg, #4ECDC4 0%, #45B7AF 100%)', text: '#FFFFFF' },
  { bg: 'linear-gradient(135deg, #FFD93D 0%, #FFE566 100%)', text: '#000000' },
  { bg: 'linear-gradient(135deg, #6C5CE7 0%, #8480E9 100%)', text: '#FFFFFF' },
  { bg: 'linear-gradient(135deg, #A8E6CF 0%, #DCEDC1 100%)', text: '#000000' },
  { bg: 'linear-gradient(135deg, #FF8B94 0%, #FFC2C7 100%)', text: '#000000' },
  { bg: 'linear-gradient(135deg, #98ACFF 0%, #6C63FF 100%)', text: '#FFFFFF' },
  { bg: 'linear-gradient(135deg, #FFA62B 0%, #FFB85C 100%)', text: '#000000' }
]

const getAvatarColor = (index: number) => avatarColors[index % avatarColors.length]

interface MemberAvatarGroupProps {
  members: ProjectMember[]
}

function MemberAvatarGroup({ members }: MemberAvatarGroupProps) {
  if (!members || members.length === 0) {
    return (
      <div className='flex items-center justify-center h-10 px-3 rounded-md bg-gray-100'>
        <span className='text-sm text-gray-500'>No members</span>
      </div>
    )
  }

  return (
    <div className='flex -space-x-3'>
      {members.slice(0, 4).map((member, index) => {
        const { bg, text } = getAvatarColor(index)
        return <MemberAvatar key={member.userId} name={member.user.name} background={bg} textColor={text} />
      })}
      {members.length > 4 && <MemberAvatar name={`+${members.length - 4}`} background='#FFFFFF' textColor='#DFDFDF' />}
    </div>
  )
}

export default function ProjectBoard() {
  const navigate = useNavigate()
  const { boards, isLoading: isBoardLoading, error: boardError, refreshBoards } = useBoards()
  const [isSidebarOpen, setIsSidebarOpen] = useState(true)
  const [projectMembers, setProjectMembers] = useState<ProjectMember[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const { currentProject, isLoading } = useCurrentProject()
  const [filteredTasks, setFilteredTasks] = useState<TaskP[]>([])
  const [isInviteOpen, setIsInviteOpen] = useState(false)
  const [isBoardDialogOpen, setIsBoardDialogOpen] = useState(false)

  const { toast } = useToast()

  console.log(boards)

  useEffect(() => {
    if (!currentProject) {
      return navigate('/board')
    }
    const fetchMembers = async () => {
      try {
        const members = await projectMemberApi.getMembersByProjectId(currentProject.id)
        setProjectMembers(members || [])
      } catch (error) {
        console.log(error)
        setProjectMembers([])
      }
    }
    fetchMembers()
  }, [currentProject, navigate])

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen)
  }

  useEffect(() => {
    if (searchQuery && boards) {
      const filtered = boards.flatMap((board) =>
        board.taskPs.filter((task) => task.description.toLowerCase().includes(searchQuery.toLowerCase()))
      )
      setFilteredTasks(filtered)
    } else {
      setFilteredTasks(boards?.flatMap((board) => board.taskPs) || [])
    }
  }, [searchQuery, boards])

  useEffect(() => {
    if (!isLoading && !currentProject) {
      navigate('/projects')
    }
  }, [currentProject, isLoading, navigate])

  const handleCopyProjectId = () => {
    if (!currentProject?.id) return
    navigator.clipboard.writeText(currentProject.id)
    toast({
      title: 'Success',
      description: 'Project ID copied to clipboard'
    })
  }

  const handleMemberAdded = async () => {
    if (!currentProject?.id) return
    try {
      const members = await projectMemberApi.getMembersByProjectId(currentProject.id)
      setProjectMembers(members || [])
    } catch (error) {
      console.log(error)
      toast({
        title: 'Error',
        description: 'Failed to refresh member list',
        variant: 'destructive'
      })
    }
  }

  if (isLoading || isBoardLoading || !currentProject) {
    return (
      <div className='flex h-screen bg-gray-100'>
        <Sidebar isOpen={isSidebarOpen} onToggle={toggleSidebar} />
        <div className='flex-1 flex flex-col overflow-hidden'>
          <Navbar isSidebarOpen={isSidebarOpen} toggleSidebar={toggleSidebar} />
          <Loader />
        </div>
      </div>
    )
  }

  if (boardError) {
    return <div>Error loading boards: {boardError.message}</div>
  }

  return (
    <div className='flex h-screen bg-gray-100'>
      <Sidebar isOpen={isSidebarOpen} onToggle={toggleSidebar} />

      <div className='flex-1 flex flex-col overflow-hidden'>
        <Navbar isSidebarOpen={isSidebarOpen} toggleSidebar={toggleSidebar} />

        <div className='flex flex-col h-full p-6'>
          <div className='flex-none w-full flex items-center justify-between pb-4'>
            <div className='flex items-center gap-2'>
              <h1 className='text-4xl font-bold pr-2'>{currentProject.title}</h1>
              <ProjectEditMenu
                project={currentProject}
                onProjectUpdated={refreshBoards}
                trigger={
                  <Button variant='ghost' size='icon' className='h-8 w-8 rounded-xl bg-violet-100 hover:bg-violet-200'>
                    <Pencil className='h-4 w-4 text-violet-600' />
                  </Button>
                }
              />
              <Button
                variant='ghost'
                size='icon'
                className='h-8 w-8 rounded-xl bg-violet-100 hover:bg-violet-200'
                onClick={handleCopyProjectId}
              >
                <Link2 className='h-4 w-4 text-violet-600' />
              </Button>
            </div>

            <div className='flex items-center gap-4'>
              <div className='flex items-center gap-2'>
                <Button
                  variant='ghost'
                  className='flex items-center gap-2 px-3 py-2 rounded-lg bg-violet-100 hover:bg-violet-200 text-violet-600'
                  onClick={() => setIsInviteOpen(true)}
                >
                  <Plus className='h-4 w-4' />
                  <span className='font-medium'>Invite</span>
                </Button>
              </div>

              <MemberAvatarGroup members={projectMembers} />
            </div>
          </div>

          <div className='pb-6 flex items-center justify-between'>
            <div className='flex items-center gap-4'>
              <Button variant='outline' className='bg-white hover:bg-gray-50 focus:ring-0'>
                <Filter className='mr-2 h-4 w-4' />
                Filter
                <ChevronDown className='ml-2 h-4 w-4' />
              </Button>
              <div className='relative'>
                <Search className='absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 transform text-gray-400' />
                <Input
                  placeholder='Search tasks...'
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className='w-[180px] rounded-md bg-white pl-10 focus-visible:ring-offset-0 focus-visible:ring-0 border-gray-300'
                />
              </div>
            </div>
            <div className='flex gap-2'>
              <TaskBoardCreateMenu
                isOpen={isBoardDialogOpen}
                onOpenChange={setIsBoardDialogOpen}
                projectId={currentProject.id}
                onBoardCreated={refreshBoards}
              />
            </div>
          </div>

          <div className='min-h-0 flex-1'>
            <ScrollArea className='w-full whitespace-nowrap rounded-md'>
              <div className='inline-flex gap-6 p-1'>
                {boards.map((board) => (
                  <TaskColumn
                    key={board.status}
                    title={board.status}
                    tasks={searchQuery ? filteredTasks.filter((task) => task.status === board.status) : board.taskPs}
                    color={getBoardColor(board.status)}
                    onTaskCreated={refreshBoards}
                    status={board.status}
                    boardId={board.id}
                  />
                ))}
              </div>
              <ScrollBar orientation='horizontal' />
            </ScrollArea>
          </div>
        </div>
      </div>

      <ProjectInviteDialog
        isOpen={isInviteOpen}
        onClose={() => setIsInviteOpen(false)}
        projectId={currentProject.id}
        onMemberAdded={handleMemberAdded}
      />
    </div>
  )
}
