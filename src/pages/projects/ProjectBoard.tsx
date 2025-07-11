import { boardApi } from '@/api/boards'
import { projectMemberApi } from '@/api/projectMembers'
import { sprintApi } from '@/api/sprints'
import { taskApi } from '@/api/tasks'
import { Navbar } from '@/components/Navbar'
import ProjectGroupManager from '@/components/ProjectGroupManager'
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
import { useEffect, useRef, useState } from 'react'
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
        return <MemberAvatar key={member.userId || index} name={name} background={bg} textColor={text} />
      })}
      {members.length > 4 && <MemberAvatar name={`+${members.length - 4}`} background='#FFFFFF' textColor='#DFDFDF' />}
    </div>
  )
}

// Đưa hàm fetchCurrentSprintAndTasks ra ngoài scope ProjectBoard
const fetchCurrentSprintAndTasks = async (projectId: string | undefined, setSelectedSprintId: any, setSprintTasks: any) => {
  if (projectId) {
    try {
      const currentSprint = await sprintApi.getCurrentSprint(projectId)
      if (currentSprint && currentSprint.id) {
        setSelectedSprintId(currentSprint.id)
        // Lấy task của current sprint và set luôn
        const tasks = await sprintApi.getSprintTasks(projectId, currentSprint.id)
        setSprintTasks(Array.isArray(tasks) ? tasks : [])
        return;
      }
    } catch (err) {
      setSprintTasks([])
    }
  } else {
    setSprintTasks([])
  }
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
  const { sprints, isLoading: isSprintsLoading, refreshSprints, getSprintTasks } = useSprints()
  const { tasks, isTaskLoading, refreshTasks } = useTasks()
  const [sprintTasks, setSprintTasks] = useState<TaskP[]>([])
  const [selectedSprintId, setSelectedSprintId] = useState<string | null>(null)

  const toast = useToast().toast
  const { leaveProject, loading: memberLoading, error: memberError } = useProjectMembers()
  const { user } = useAuth()

  const boardContainerRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);
  const startX = useRef(0);
  const scrollLeft = useRef(0);

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    isDragging.current = true;
    startX.current = e.pageX - (boardContainerRef.current?.offsetLeft || 0);
    scrollLeft.current = boardContainerRef.current?.scrollLeft || 0;
  };

  const handleMouseLeave = () => {
    isDragging.current = false;
  };

  const handleMouseUp = () => {
    isDragging.current = false;
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDragging.current) return;
    e.preventDefault();
    const x = e.pageX - (boardContainerRef.current?.offsetLeft || 0);
    const walk = x - startX.current;
    if (boardContainerRef.current) {
      boardContainerRef.current.scrollLeft = scrollLeft.current - walk;
    }
  };

  // Lấy sprint hiện tại (in progress) khi vào trang
  useEffect(() => {
    fetchCurrentSprintAndTasks(currentProject?.id, setSelectedSprintId, setSprintTasks)
  }, [currentProject])

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
      const taskObj = boards.flatMap(b => b.tasks).find(t => t.id === taskId);
      if (taskObj && taskObj.boardId === newBoardId) {
        console.log('[DnD] Task đã ở board này, không cần gọi API');
        return;
      }
      console.log('[DnD] moveTaskToBoard', { projectId: currentProject.id, taskId, newBoardId })
      try {
        const boardObj = boards.find(b => b.id === newBoardId);
        console.log('[DnD] DEBUG taskObj:', taskObj);
        console.log('[DnD] DEBUG boardObj:', boardObj);
        await taskApi.moveTaskToBoard(currentProject.id, taskId, newBoardId)
        await fetchCurrentSprintAndTasks(currentProject?.id, setSelectedSprintId, setSprintTasks)
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

  // Lọc sprint đang active (IN_PROGRESS/status=1)
  const activeSprints = sprints.filter(s => s.status === 1);
  // Chọn sprint active có startDate mới nhất
  const latestActiveSprint = activeSprints.length
    ? activeSprints.reduce((latest, curr) =>
        new Date(curr.startDate) > new Date(latest.startDate) ? curr : latest
      )
    : null;

  // Lọc task thuộc sprint active này (ưu tiên sprintId, fallback sang sprintName nếu chưa có sprintId)
 

  // DEBUG: Log toàn bộ boards và tasks
  console.log('DEBUG_BOARDS:', boards);
  console.log('DEBUG_TASKS:', boards.flatMap(b => b.tasks));

  // Hiển thị task của từng board theo sprint (nếu có sprintTasks)
  const filteredBoards = boards.map((board) => ({
    ...board,
    tasks: sprintTasks.filter((task) => task.boardId === board.id)
  }))

  // UI chọn sprint (không còn dropdown)
  const SprintSelector = () => {
    const currentSprint = sprints.find(s => s.id === selectedSprintId);
    return (
      <div className='mb-4 flex items-center gap-2'>
        <span className='font-medium'>Sprint:</span>
        <span className='text-base font-semibold'>{currentSprint ? currentSprint.name : 'No sprint'}</span>
      </div>
    );
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

  // Log giá trị boards để debug
  console.log('Boards in ProjectBoard:', boards)

  return (
    <div className='flex h-screen bg-gray-100'>
      <Sidebar isOpen={isSidebarOpen} onToggle={toggleSidebar} />

      <div className='flex-1 flex flex-col overflow-hidden'>
        <Navbar isSidebarOpen={isSidebarOpen} toggleSidebar={toggleSidebar} />

        {/* SignalR Project Group Manager */}
        {currentProject?.id && <ProjectGroupManager projectId={currentProject.id} />}

        <div className='flex flex-col h-full p-3 sm:p-6'>
          <SprintSelector />
          <div className='flex-none w-full flex flex-col sm:flex-row sm:items-center justify-between pb-4 gap-4'>
            <div className='flex items-center gap-2 flex-wrap'>
              <h1 className='text-2xl sm:text-4xl font-bold pr-2'>{currentProject.title}</h1>
              <ProjectEditMenu
                project={currentProject}
                onProjectUpdated={refreshBoards}
                trigger={
                  <Button variant='ghost' size='icon' className='h-7 w-7 sm:h-8 sm:w-8 rounded-xl bg-violet-100 hover:bg-violet-200'>
                    <Pencil className='h-3 w-3 sm:h-4 sm:w-4 text-violet-600' />
                  </Button>
                }
              />
              <Button
                variant='ghost'
                size='icon'
                className='h-7 w-7 sm:h-8 sm:w-8 rounded-xl bg-violet-100 hover:bg-violet-200'
                onClick={handleCopyProjectId}
              >
                <Link2 className='h-3 w-3 sm:h-4 sm:w-4 text-violet-600' />
              </Button>
            </div>

            <div className='flex items-center gap-2 sm:gap-4 flex-wrap'>
              <div className='flex items-center gap-2'>
                <Button
                  variant='ghost'
                  className='flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-2 rounded-lg bg-violet-100 hover:bg-violet-200 text-violet-600 text-sm'
                  onClick={() => setIsInviteOpen(true)}
                >
                  <Plus className='h-3 w-3 sm:h-4 sm:w-4' />
                  <span className='font-medium hidden sm:inline'>Invite</span>
                </Button>
                <Button
                  variant='outline'
                  className='ml-2 text-red-600 border-red-200 hover:bg-red-50 text-sm px-2 sm:px-3'
                  onClick={handleLeaveProject}
                  disabled={memberLoading}
                >
                  {memberLoading ? 'Leaving...' : <span className='hidden sm:inline'>Leave Project</span>}
                </Button>
              </div>
              <div className='hidden sm:block'>
                <MemberAvatarGroup members={projectMembers} />
              </div>
            </div>
            <div className='mt-4 sm:hidden'>
              <ProjectMemberList
                projectId={currentProject.id}
                members={projectMembers}
                onMemberRemoved={handleMemberAdded}
                currentUserId={user?.id || ''}
                isOwnerOrAdmin={['Owner', 'Admin', '0', '0'].includes(String(currentProject.role || ''))}
              />
            </div>
          </div>

          <div className='pb-4 sm:pb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4'>
            <div className='flex items-center gap-2 sm:gap-4 flex-wrap'>
              <Button variant='outline' className='bg-white hover:bg-gray-50 focus:ring-0 text-sm'>
                <Filter className='mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4' />
                <span className='hidden sm:inline'>Filter</span>
                <ChevronDown className='ml-1 sm:ml-2 h-3 w-3 sm:h-4 sm:w-4' />
              </Button>
              <div className='relative'>
                <Search className='absolute left-2 sm:left-3 top-1/2 h-3 w-3 sm:h-4 sm:w-4 -translate-y-1/2 transform text-gray-400' />
                <Input
                  placeholder='Search tasks...'
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className='w-[140px] sm:w-[180px] rounded-md bg-white pl-7 sm:pl-10 focus-visible:ring-offset-0 focus-visible:ring-0 border-gray-300 text-sm'
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
              <SortableContext items={filteredBoards.map((b) => b.id)} strategy={horizontalListSortingStrategy}>
                <div
                  ref={boardContainerRef}
                  className='w-full h-full overflow-x-auto overflow-y-hidden cursor-grab select-none'
                  onMouseDown={handleMouseDown}
                  onMouseLeave={handleMouseLeave}
                  onMouseUp={handleMouseUp}
                  onMouseMove={handleMouseMove}
                >
                  <div className='inline-flex gap-6 p-1 h-full'>
                    {filteredBoards && filteredBoards.length > 0 ? (
                      filteredBoards.map((board) => (
                        <div key={board.id} className='...'>
                          <SortableBoardColumn id={board.id}>
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
                        </div>
                      ))
                    ) : (
                      <div className='text-gray-400 text-lg p-8'>No boards found for this project.</div>
                    )}
                  </div>
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
