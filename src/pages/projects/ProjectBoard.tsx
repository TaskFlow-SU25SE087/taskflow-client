import { boardApi } from '@/api/boards'
import { projectMemberApi } from '@/api/projectMembers'
import { taskApi } from '@/api/tasks'
import { Navbar } from '@/components/Navbar'
import { ProjectEditMenu } from '@/components/projects/ProjectEditMenu'
import { ProjectInviteDialog } from '@/components/projects/ProjectInviteDialog'
import { ProjectMemberList } from '@/components/projects/ProjectMemberList'
import { Sidebar } from '@/components/Sidebar'
import { DroppableBoard } from '@/components/tasks/DroppableBoard'
import { SortableBoardColumn, SortableTaskColumn } from '@/components/tasks/SortableTaskColumn'
import TaskBoardCreateMenu from '@/components/tasks/TaskBoardCreateMenu'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Loader } from '@/components/ui/loader'
import { useToast } from '@/hooks/use-toast'
import { useAuth } from '@/hooks/useAuth'
import { useBoards } from '@/hooks/useBoards'
import { useCurrentProject } from '@/hooks/useCurrentProject'
import { useProjectMembers } from '@/hooks/useProjectMembers'
import { useSprints } from '@/hooks/useSprints'
import { useTasks } from '@/hooks/useTasks'
import { ProjectMember } from '@/types/project'
import { TaskP } from '@/types/task'
import { closestCenter, DndContext, PointerSensor, useSensor, useSensors } from '@dnd-kit/core'
import {
  arrayMove,
  horizontalListSortingStrategy,
  SortableContext,
  verticalListSortingStrategy
} from '@dnd-kit/sortable'
import { ChevronDown, Filter, Link2, Pencil, Plus, Search } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'

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
  const safeName = name || '';
  const initials = safeName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase();

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
  );
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
        const name = member.fullName || member.email || member.userId;
        return <MemberAvatar key={member.userId} name={name} background={bg} textColor={text} />
      })}
      {members.length > 4 && <MemberAvatar name={`+${members.length - 4}`} background='#FFFFFF' textColor='#DFDFDF' />}
    </div>
  )
}

export default function ProjectBoard() {
  const navigate = useNavigate()
  const { boards, isLoading: isBoardLoading, error: boardError, refreshBoards, setBoards } = useBoards()
  const [isSidebarOpen, setIsSidebarOpen] = useState(true)
  const [projectMembers, setProjectMembers] = useState<ProjectMember[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const { currentProject, isLoading } = useCurrentProject()
  const [filteredTasks, setFilteredTasks] = useState<TaskP[]>([])
  const [isInviteOpen, setIsInviteOpen] = useState(false)
  const [isBoardDialogOpen, setIsBoardDialogOpen] = useState(false)
  const { sprints, isLoading: isSprintsLoading, refreshSprints } = useSprints();
  const { tasks, isTaskLoading, refreshTasks } = useTasks();

  const toast = useToast().toast
  const {
    addMember,
    leaveProject,
    removeMember,
    verifyJoin,
    loading: memberLoading,
    error: memberError
  } = useProjectMembers()
  const { user } = useAuth()

  console.log(boards)

  useEffect(() => {
    if (!currentProject || !currentProject.id) return
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
        board.tasks.filter((task) => task.description.toLowerCase().includes(searchQuery.toLowerCase()))
      )
      setFilteredTasks(filtered)
    } else {
      setFilteredTasks(boards?.flatMap((board) => board.tasks) || [])
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

  const handleLeaveProject = async () => {
    if (!currentProject?.id) return
    try {
      await leaveProject(currentProject.id)
      toast({
        title: 'Left project successfully',
        description: 'You have left this project.'
      })
      navigate('/projects')
    } catch (err) {
      toast({
        title: 'Error',
        description: memberError || 'Could not leave the project',
        variant: 'destructive'
      })
    }
  }

  // Hàm xử lý kéo thả chung cho cả board và task
  const handleDragEnd = async (event: any) => {
    const { active, over } = event
    console.log('DnD handleDragEnd', { active, over, overId: over?.id })
    if (!active || !over || active.id === over.id) {
      console.log('[DnD] Không có active, over hoặc kéo thả cùng vị trí', { active, over })
      return
    }

    // Nếu kéo board (id của board nằm trong boards)
    const isBoardDrag = boards.some((b) => b.id === active.id)
    if (isBoardDrag) {
      if (!currentProject?.id) {
        console.log('[DnD] Không có currentProject khi kéo board')
        return;
      }
      const oldIndex = boards.findIndex((b) => b.id === active.id)
      const newIndex = boards.findIndex((b) => b.id === over.id)
      if (oldIndex === -1 || newIndex === -1) {
        console.log('[DnD] Không tìm thấy oldIndex hoặc newIndex khi kéo board', { oldIndex, newIndex, activeId: active.id, overId: over.id })
        return
      }
      const newBoards = arrayMove(boards, oldIndex, newIndex)
      setBoards(newBoards)
      const orderPayload = newBoards.map((b, idx) => ({ id: b.id, order: idx }))
      await boardApi.updateBoardOrder(currentProject.id, orderPayload)
      refreshBoards()
      console.log('[DnD] Đã cập nhật thứ tự board', { orderPayload })
      return
    }

    // Nếu kéo task (id của task nằm trong bất kỳ board.tasks)
    const allTaskIds = boards.flatMap((b) => b.tasks.map((t) => t.id))
    if (allTaskIds.includes(active.id)) {
      if (!currentProject?.id) {
        console.log('[DnD] Không có currentProject khi kéo task')
        return;
      }
      const taskId = active.id
      let newBoardId = over.id
      // Nếu over là taskId, tìm board chứa task đó
      if (allTaskIds.includes(over.id)) {
        const foundBoard = boards.find((b) => b.tasks.some((t) => t.id === over.id))
        if (foundBoard) newBoardId = foundBoard.id
        console.log('[DnD] over là task, tìm thấy board chứa task', { foundBoard, newBoardId })
      }
      console.log('[DnD] moveTaskToBoard', { projectId: currentProject.id, taskId, newBoardId })
      try {
        const taskObj = boards.flatMap(b => b.tasks).find(t => t.id === taskId);
        const boardObj = boards.find(b => b.id === newBoardId);
        console.log('[DnD] DEBUG taskObj:', taskObj);
        console.log('[DnD] DEBUG boardObj:', boardObj);
        await taskApi.moveTaskToBoard(currentProject.id, taskId, newBoardId)
        refreshBoards()
        console.log('[DnD] Đã chuyển task sang board mới thành công', { taskId, newBoardId })
      } catch (err) {
        // Log chi tiết lỗi trả về từ backend
        const error = err as any;
        if (error.response) {
          console.error('[DnD] API error', error.response.data)
        } else {
          console.error('[DnD] API error', error)
        }
      }
      return
    }
    console.log('[DnD] Không phải kéo board hoặc task hợp lệ', { active, over })
  }

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }))

  console.log('All tasks:', tasks);

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

  // Log giá trị boards để debug
  console.log('Boards in ProjectBoard:', boards)

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
                <Button
                  variant='outline'
                  className='ml-2 text-red-600 border-red-200 hover:bg-red-50'
                  onClick={handleLeaveProject}
                  disabled={memberLoading}
                >
                  {memberLoading ? 'Leaving...' : 'Leave Project'}
                </Button>
              </div>
              <MemberAvatarGroup members={projectMembers} />
            </div>
            <div className='mt-4'>
              <ProjectMemberList
                projectId={currentProject.id}
                members={projectMembers}
                onMemberRemoved={handleMemberAdded}
                currentUserId={user?.id || ''}
                isOwnerOrAdmin={['Owner', 'Admin', '0', '0'].includes(String(currentProject.role || ''))}
              />
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
            {/* DndContext chung cho cả board và task */}
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
              <SortableContext items={boards.map((b) => b.id)} strategy={horizontalListSortingStrategy}>
                <div className='inline-flex gap-6 p-1'>
                  {boards && boards.length > 0 ? (
                    boards.map((board) => (
                      <SortableBoardColumn key={board.id} id={board.id}>
                        <DroppableBoard boardId={board.id}>
                          <SortableContext items={board.tasks.map((t) => t.id)} strategy={verticalListSortingStrategy}>
                            <SortableTaskColumn
                              id={board.id}
                              title={board.name}
                              description={board.description}
                              tasks={board.tasks}
                              color={getBoardColor(board.name)}
                              onTaskCreated={refreshBoards}
                              status={board.name}
                              boardId={board.id}
                            />
                          </SortableContext>
                        </DroppableBoard>
                      </SortableBoardColumn>
                    ))
                  ) : (
                    <div className='text-gray-400 text-lg p-8'>No boards found for this project.</div>
                  )}
                </div>
              </SortableContext>
            </DndContext>
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
