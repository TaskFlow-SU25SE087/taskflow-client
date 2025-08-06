import { boardApi } from '@/api/boards'
import { projectMemberApi } from '@/api/projectMembers'
import { sprintApi } from '@/api/sprints'
import { taskApi } from '@/api/tasks'
import { Navbar } from '@/components/Navbar'
import ProjectGroupManager from '@/components/ProjectGroupManager'
import { ProjectEditMenu } from '@/components/projects/ProjectEditMenu'
import { ProjectInviteDialog } from '@/components/projects/ProjectInviteDialog'
import { Sidebar } from '@/components/Sidebar'
import { DroppableBoard } from '@/components/tasks/DroppableBoard'
import { SortableBoardColumn, SortableTaskColumn } from '@/components/tasks/SortableTaskColumn'
import TaskBoardCreateMenu from '@/components/tasks/TaskBoardCreateMenu'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Loader } from '@/components/ui/loader'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useToastContext } from '@/components/ui/ToastContext'
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
import {
  CheckCircle,
  ChevronDown,
  Clock,
  Filter,
  Link2,
  Pencil,
  Plus,
  Search,
  Settings,
  TrendingUp
} from 'lucide-react'
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

function MemberAvatar({
  name,
  background,
  textColor,
  className = '',
  avatar
}: MemberAvatarProps & { avatar?: string }) {
  const safeName = name || ''
  const initials = safeName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()

  return (
    <div className={`relative transition-transform hover:scale-110 hover:z-10 ${className}`}>
      <Avatar className='h-10 w-10'>
        {avatar ? (
          <img src={avatar} alt={name} className='h-10 w-10 rounded-full object-cover' />
        ) : (
          <AvatarFallback
            className='text-sm font-semibold tracking-wider absolute inset-0 flex items-center justify-center'
            style={{ background, color: textColor }}
          >
            {initials}
          </AvatarFallback>
        )}
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
        const name = member.fullName || member.email || member.userId
        return (
          <MemberAvatar
            key={member.userId || index}
            name={name}
            background={bg}
            textColor={text}
            avatar={member.avatar}
          />
        )
      })}
      {members.length > 4 && <MemberAvatar name={`+${members.length - 4}`} background='#FFFFFF' textColor='#DFDFDF' />}
    </div>
  )
}

const fetchCurrentSprintAndTasks = async (
  projectId: string | undefined,
  setSelectedSprintId: any,
  setSprintTasks: any
) => {
  if (projectId) {
    try {
      console.log(`🔄 [ProjectBoard] Fetching current sprint for project: ${projectId}`)
      const currentSprint = await sprintApi.getCurrentSprint(projectId)

      if (currentSprint && currentSprint.id) {
        console.log(`✅ [ProjectBoard] Found current sprint: ${currentSprint.name} (${currentSprint.id})`)
        setSelectedSprintId(currentSprint.id)

        console.log(`🔄 [ProjectBoard] Fetching tasks for sprint: ${currentSprint.id}`)
        const tasks = await sprintApi.getSprintTasks(projectId, currentSprint.id)
        console.log(`✅ [ProjectBoard] Successfully fetched ${Array.isArray(tasks) ? tasks.length : 0} tasks`)
        setSprintTasks(Array.isArray(tasks) ? tasks : [])
        return
      } else {
        console.log(`⚠️ [ProjectBoard] No current sprint found for project: ${projectId}`)
        setSprintTasks([])
      }
    } catch (err: any) {
      console.error(`❌ [ProjectBoard] Error fetching sprint data:`, err)
      setSprintTasks([])
    }
  } else {
    console.log(`⚠️ [ProjectBoard] No project ID provided`)
    setSprintTasks([])
  }
}

const calculateBoardProgress = (tasks: TaskP[]) => {
  const total = tasks.length
  const completed = tasks.filter(
    (task: TaskP) => task.status?.toLowerCase() === 'done' || task.status?.toLowerCase() === 'completed'
  ).length
  const inProgress = tasks.filter((task: TaskP) => task.status?.toLowerCase() === 'in progress').length
  const blocked = tasks.filter((task: TaskP) => task.status?.toLowerCase() === 'blocked').length
  const notStarted = tasks.filter(
    (task: TaskP) => task.status?.toLowerCase() === 'not started' || task.status?.toLowerCase() === 'to do'
  ).length
  const completionPercentage = total > 0 ? Math.round((completed / total) * 100) : 0
  return { total, completed, inProgress, blocked, notStarted, completionPercentage }
}

export default function ProjectBoard() {
  const navigate = useNavigate()
  const { boards, isLoading: isBoardLoading, error: boardError, refreshBoards, setBoards } = useBoards()
  const [isSidebarOpen, setIsSidebarOpen] = useState(true)
  const [projectMembers, setProjectMembers] = useState<ProjectMember[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const { currentProject, isLoading } = useCurrentProject()
  const [isInviteOpen, setIsInviteOpen] = useState(false)
  const [isBoardDialogOpen, setIsBoardDialogOpen] = useState(false)
  const { sprints } = useSprints()
  const { tasks } = useTasks()
  const [sprintTasks, setSprintTasks] = useState<TaskP[]>([])
  const [selectedSprintId, setSelectedSprintId] = useState<string | null>(null)
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [isLockDialogOpen, setIsLockDialogOpen] = useState(false)
  const [lockedColumns, setLockedColumns] = useState<string[]>([])
  const [lockAll, setLockAll] = useState(false)
  const [movingTaskId, setMovingTaskId] = useState<string | null>(null)
  const [showStatsCards, setShowStatsCards] = useState(true)

  const { showToast } = useToastContext()
  const { leaveProject, loading: memberLoading, error: memberError } = useProjectMembers()

  useEffect(() => {
    if (movingTaskId) {
      console.log('[TIMING] 🎯 movingTaskId set to:', movingTaskId, 'at:', new Date().toISOString())
    } else if (movingTaskId === null) {
      console.log('[TIMING] ✅ movingTaskId cleared at:', new Date().toISOString())
    }
  }, [movingTaskId])

  useEffect(() => {
    console.log(
      '[TIMING] 🔄 sprintTasks state updated at:',
      new Date().toISOString(),
      'with',
      sprintTasks.length,
      'tasks'
    )
  }, [sprintTasks])

  useEffect(() => {
    if (currentProject?.id) {
      fetchCurrentSprintAndTasks(currentProject?.id, setSelectedSprintId, setSprintTasks)
    }
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
    if (!isLoading && !currentProject) {
      navigate('/projects')
    }
  }, [currentProject, isLoading, navigate])

  const handleCopyProjectId = () => {
    if (!currentProject?.id) return
    navigator.clipboard.writeText(currentProject.id)
    showToast({
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
      showToast({
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
      showToast({
        title: 'Left project successfully',
        description: 'You have left this project.'
      })
      navigate('/projects')
    } catch (err) {
      showToast({
        title: 'Error',
        description: memberError || 'Could not leave the project',
        variant: 'destructive'
      })
    }
  }

  const handleDragEnd = async (event: any) => {
    const dragStartTime = performance.now()
    console.log('[TIMING] 🕐 Drag end started at:', new Date().toISOString())

    const { active, over } = event
    const isBoardDrag = boards.some((b) => b.id === active.id)

    if (isBoardDrag) {
      if (lockedColumns.includes(active.id) || (over && lockedColumns.includes(over.id))) {
        showToast({
          title: 'Column Locked',
          description: 'This column is locked and cannot be moved.',
          variant: 'destructive'
        })
        return
      }
      if (!currentProject?.id) {
        console.log('[DnD] Không có currentProject khi kéo board')
        return
      }
      let oldIndex = boards.findIndex((b) => b.id === active.id)
      let newIndex
      if (over.id === '__dropzone_start__') {
        newIndex = 0
      } else if (over.id === '__dropzone_end__') {
        newIndex = boards.length - 1
      } else {
        newIndex = boards.findIndex((b) => b.id === over.id)
      }
      if (oldIndex === -1 || newIndex === -1) {
        console.log('[DnD] Không tìm thấy oldIndex hoặc newIndex khi kéo board', {
          oldIndex,
          newIndex,
          activeId: active.id,
          overId: over.id
        })
        return
      }
      const newBoards = arrayMove(boards, oldIndex, newIndex)
      setBoards(newBoards)
      const orderPayload = newBoards.map((b, idx) => ({ id: b.id, order: idx }))
      await boardApi.updateBoardOrder(currentProject.id, orderPayload)
      console.log('[DnD] Đã cập nhật thứ tự board', { orderPayload })
      return
    }

    const allTaskIds = filteredBoards.flatMap((b) => b.tasks.map((t) => t.id))
    if (allTaskIds.includes(active.id)) {
      const taskMoveStartTime = performance.now()
      console.log('[TIMING] 🎯 Task move operation started at:', new Date().toISOString())

      if (!currentProject?.id) {
        console.log('[DnD] Không có currentProject khi kéo task')
        return
      }

      const taskId = active.id
      setMovingTaskId(taskId)
      let newBoardId = over.id

      if (allTaskIds.includes(over.id)) {
        const foundBoard = filteredBoards.find((b) => b.tasks.some((t) => t.id === over.id))
        if (foundBoard) newBoardId = foundBoard.id
        console.log('[DnD] over là task, tìm thấy board chứa task', { foundBoard, newBoardId })
      }

      const taskObj = filteredBoards.flatMap((b) => b.tasks).find((t) => t.id === taskId)
      if (taskObj && taskObj.boardId === newBoardId) {
        console.log('[DnD] Task đã ở board này, không cần gọi API')
        return
      }

      console.log('[DnD] moveTaskToBoard', { projectId: currentProject.id, taskId, newBoardId })

      const boardObj = filteredBoards.find((b) => b.id === newBoardId)
      console.log('[DnD] DEBUG taskObj:', taskObj)
      console.log('[DnD] DEBUG boardObj:', boardObj)

      const optimisticUpdateStartTime = performance.now()
      console.log('[TIMING] ⚡ Optimistic update starting at:', new Date().toISOString())

      if (sprintTasks.length > 0) {
        setSprintTasks((prevTasks) =>
          prevTasks.map((task) =>
            task.id === taskId ? { ...task, boardId: newBoardId, status: boardObj?.name || task.status } : task
          )
        )
      }

      setBoards((prevBoards) =>
        prevBoards.map((board) => ({
          ...board,
          tasks: board.tasks.map((task) =>
            task.id === taskId ? { ...task, boardId: newBoardId, status: boardObj?.name || task.status } : task
          )
        }))
      )

      const optimisticUpdateEndTime = performance.now()
      const optimisticUpdateDuration = optimisticUpdateEndTime - optimisticUpdateStartTime
      console.log('[TIMING] ⚡ Optimistic update completed in:', optimisticUpdateDuration.toFixed(2), 'ms')

      await new Promise((resolve) => setTimeout(resolve, 0))
      const uiRenderTime = performance.now()
      const uiRenderDuration = uiRenderTime - optimisticUpdateEndTime
      console.log('[TIMING] 🎨 UI render time after optimistic update:', uiRenderDuration.toFixed(2), 'ms')

      const apiCallStartTime = performance.now()
      console.log('[TIMING] 📡 API call starting at:', new Date().toISOString())

      try {
        await taskApi.moveTaskToBoard(currentProject.id, taskId, newBoardId)

        const apiCallEndTime = performance.now()
        const apiCallDuration = apiCallEndTime - apiCallStartTime
        console.log('[TIMING] 📡 API call completed in:', apiCallDuration.toFixed(2), 'ms')

        showToast({
          title: 'Task moved successfully',
          description: `Task moved to ${boardObj?.name || 'new board'}`,
          variant: 'default'
        })

        const totalTaskMoveTime = performance.now() - taskMoveStartTime
        const totalDragEndTime = performance.now() - dragStartTime

        console.log('[TIMING] 🎯 Task move operation completed in:', totalTaskMoveTime.toFixed(2), 'ms')
        console.log('[TIMING] 🕐 Total drag end operation completed in:', totalDragEndTime.toFixed(2), 'ms')
        console.log(
          '[TIMING] 📊 Breakdown: API call:',
          apiCallDuration.toFixed(2),
          'ms, Optimistic update:',
          optimisticUpdateDuration.toFixed(2),
          'ms'
        )

        console.log('[DnD] Đã chuyển task sang board mới thành công', { taskId, newBoardId })
        setMovingTaskId(null)
      } catch (err) {
        const errorTime = performance.now()
        const errorDuration = errorTime - taskMoveStartTime
        console.log('[TIMING] ❌ Task move failed after:', errorDuration.toFixed(2), 'ms')

        console.log('[TIMING] 🔄 Rolling back optimistic update due to API failure')

        if (sprintTasks.length > 0) {
          setSprintTasks((prevTasks) =>
            prevTasks.map((task) =>
              task.id === taskId
                ? { ...task, boardId: taskObj?.boardId || task.boardId, status: taskObj?.status || task.status }
                : task
            )
          )
        }

        setBoards((prevBoards) =>
          prevBoards.map((board) => ({
            ...board,
            tasks: board.tasks.map((task) =>
              task.id === taskId
                ? { ...task, boardId: taskObj?.boardId || task.boardId, status: taskObj?.status || task.status }
                : task
            )
          }))
        )

        const error = err as any
        if (error.response) {
          console.error('[DnD] API error', error.response.data)
        } else {
          console.error('[DnD] API error', error)
        }

        showToast({
          title: 'Error moving task',
          description: 'Failed to move task to new board. The task has been moved back to its original position.',
          variant: 'destructive'
        })
        setMovingTaskId(null)
      }
      return
    }
    console.log('[DnD] Không phải kéo board hoặc task hợp lệ', { active, over })
  }

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }))

  const handleDragStart = () => {
    console.log('[TIMING] 🎬 Drag start at:', new Date().toISOString())
  }

  console.log('All tasks:', tasks)
  sprints.filter((s) => s.status === 1)

  console.log('DEBUG_BOARDS:', boards)
  console.log(
    'DEBUG_TASKS:',
    boards.flatMap((b) => b.tasks)
  )

  const filteredBoards = boards.map((board) => {
    const boardTasks = sprintTasks.length > 0 ? sprintTasks.filter((task) => task.boardId === board.id) : board.tasks
    const filteredTasks = boardTasks.filter(
      (task) =>
        (!searchQuery ||
          (task.title || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
          (task.description || '').toLowerCase().includes(searchQuery.toLowerCase())) &&
        (filterStatus === 'all' || (task.status || '').toLowerCase() === filterStatus.toLowerCase())
    )
    return { ...board, tasks: filteredTasks }
  })

  const SprintSelector = () => {
    const currentSprint = sprints.find((s) => s.id === selectedSprintId)
    return (
      <div className='flex items-center gap-2 text-gray-600'>
        <span className='font-medium'>Sprint:</span>
        <span className='font-semibold text-gray-800'>{currentSprint ? currentSprint.name : 'No sprint'}</span>
      </div>
    )
  }

  const handleToggleColumnLock = (boardId: string) => {
    setLockedColumns((prev) => (prev.includes(boardId) ? prev.filter((id) => id !== boardId) : [...prev, boardId]))
  }

  const handleLockAll = (checked: boolean) => {
    setLockAll(checked)
    if (checked) {
      setLockedColumns(boards.map((b) => b.id))
    } else {
      setLockedColumns([])
    }
  }

  useEffect(() => {
    const data = localStorage.getItem('board_locked_columns')
    if (data) {
      try {
        const { lockedColumns, lockAll } = JSON.parse(data)
        setLockedColumns(lockedColumns || [])
        setLockAll(lockAll || false)
      } catch {}
    }
  }, [])

  useEffect(() => {
    localStorage.setItem('board_locked_columns', JSON.stringify({ lockedColumns, lockAll }))
  }, [lockedColumns, lockAll])

  if (isLoading || isBoardLoading || !currentProject) {
    return (
      <div className='flex h-screen bg-gray-50'>
        <Sidebar isOpen={isSidebarOpen} onToggle={toggleSidebar} currentProject={currentProject} />
        <div className='flex-1 flex flex-col overflow-hidden'>
          <Navbar isSidebarOpen={isSidebarOpen} toggleSidebar={toggleSidebar} />
          <div className='flex-1 flex items-center justify-center'>
            <div className='text-center'>
              <Loader />
              <p className='mt-4 text-gray-600'>Loading your project board...</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (boardError) {
    return (
      <div className='flex h-screen bg-gray-50'>
        <Sidebar isOpen={isSidebarOpen} onToggle={toggleSidebar} currentProject={currentProject} />
        <div className='flex-1 flex flex-col overflow-hidden'>
          <Navbar isSidebarOpen={isSidebarOpen} toggleSidebar={toggleSidebar} />
          <div className='flex-1 flex items-center justify-center'>
            <div className='text-center p-8 bg-white rounded-lg shadow border border-red-200'>
              <div className='text-red-500 mb-4'>
                <svg className='w-16 h-16 mx-auto' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    strokeWidth={2}
                    d='M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4.5c-.77-.833-2.694-.833-3.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z'
                  />
                </svg>
              </div>
              <h3 className='text-lg font-semibold text-gray-900 mb-2'>Error Loading Boards</h3>
              <p className='text-gray-600 mb-4'>{boardError.message}</p>
              <Button onClick={() => window.location.reload()} className='bg-blue-600 hover:bg-blue-700 text-white'>
                Try Again
              </Button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  console.log('Boards in ProjectBoard:', boards)
  console.log('DEBUG boards:', boards)
  console.log('DEBUG filteredBoards:', filteredBoards)
  console.log('DEBUG sprintTasks:', sprintTasks)
  console.log('DEBUG searchQuery:', searchQuery)
  console.log('DEBUG filterStatus:', filterStatus)

  return (
    <div className='flex bg-gray-50 h-screen overflow-hidden'>
      <Sidebar isOpen={isSidebarOpen} onToggle={toggleSidebar} currentProject={currentProject} />

      <div className='flex-1 flex flex-col overflow-hidden min-h-0'>
        <Navbar isSidebarOpen={isSidebarOpen} toggleSidebar={toggleSidebar} />

        {currentProject?.id && <ProjectGroupManager projectId={currentProject.id} />}

        <div className='flex flex-col flex-1 overflow-hidden min-h-0'>
          {/* Header content */}
          <div className='flex-shrink-0 p-6 pt-6 pb-2 overflow-y-auto max-h-[60vh]'>
            {/* Project name and controls section */}
            <div className='flex items-center justify-between mb-3'>
              <div className='flex items-center gap-3'>
                <h1 className='text-3xl font-bold text-gray-900'>{currentProject.title}</h1>
                <ProjectEditMenu
                  project={currentProject}
                  onProjectUpdated={refreshBoards}
                  trigger={
                    <Button
                      type='button'
                      className='bg-lavender-100 hover:bg-lavender-200 rounded-xl p-2 transition-colors duration-150 shadow-none border-none focus:outline-none'
                      style={{ minWidth: 0, minHeight: 0, height: '32px', width: '32px' }}
                    >
                      <Pencil className='h-5 w-5 text-lavender-600' />
                    </Button>
                  }
                />
                <Button
                  type='button'
                  className='bg-lavender-100 hover:bg-lavender-200 rounded-xl p-2 transition-colors duration-150 shadow-none border-none focus:outline-none'
                  style={{ minWidth: 0, minHeight: 0, height: '32px', width: '32px' }}
                  onClick={handleCopyProjectId}
                >
                  <Link2 className='h-5 w-5 text-lavender-600' />
                </Button>
                <Button
                  type='button'
                  className='bg-lavender-100 hover:bg-lavender-200 rounded-xl p-2 transition-colors duration-150 shadow-none border-none focus:outline-none'
                  style={{ minWidth: 0, minHeight: 0, height: '32px', width: '32px' }}
                  onClick={() => setIsLockDialogOpen(true)}
                  title='Board Column Lock Settings'
                >
                  <Settings className='h-5 w-5 text-lavender-600' />
                </Button>
              </div>

              <div className='flex items-center gap-4'>
                <div className='flex items-center gap-2'>
                  <Button
                    variant='ghost'
                    className='flex items-center gap-2 px-3 py-2 rounded-lg bg-[#ece8fd] hover:bg-[#e0dbfa] text-[#7c3aed]'
                    onClick={() => setIsInviteOpen(true)}
                  >
                    <Plus className='h-4 w-4 text-[#7c3aed]' />
                    <span>Invite</span>
                  </Button>
                  <Button
                    variant='outline'
                    className='text-red-600 border-red-200 hover:bg-red-50'
                    onClick={handleLeaveProject}
                    disabled={memberLoading}
                  >
                    {memberLoading ? 'Leaving...' : 'Leave Project'}
                  </Button>
                </div>
                <MemberAvatarGroup members={projectMembers} />
              </div>
            </div>

            {/* Filter and search section */}
            <div className='flex items-center justify-between mb-3'>
              <div className='flex items-center gap-3'>
                <Button variant='outline' className='hover:bg-gray-50 border-gray-300'>
                  <Filter className='mr-2 h-4 w-4' />
                  Filter
                  <ChevronDown className='ml-2 h-4 w-4' />
                </Button>
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger className='w-[140px] border-gray-300'>
                    <SelectValue placeholder='Filter status' />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value='all'>All</SelectItem>
                    <SelectItem value='in progress'>In Progress</SelectItem>
                    <SelectItem value='done'>Done</SelectItem>
                    <SelectItem value='not started'>Not Started</SelectItem>
                    <SelectItem value='completed'>Completed</SelectItem>
                    <SelectItem value='blocked'>Blocked</SelectItem>
                    <SelectItem value='review'>Review</SelectItem>
                    <SelectItem value='on hold'>On Hold</SelectItem>
                    <SelectItem value='cancelled'>Cancelled</SelectItem>
                  </SelectContent>
                </Select>
                <div className='relative'>
                  <Search className='absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 transform text-gray-400' />
                  <Input
                    placeholder='Search tasks across boards...'
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className='w-[280px] pl-10 border-gray-300'
                  />
                </div>
              </div>
              <TaskBoardCreateMenu
                isOpen={isBoardDialogOpen}
                onOpenChange={setIsBoardDialogOpen}
                projectId={currentProject.id}
                onBoardCreated={refreshBoards}
              />
            </div>

            {/* Sprint section - moved below main controls */}
            <div className='pt-2'>
              <SprintSelector />

              {/* Sprint deadline display */}
              {(() => {
                const currentSprint = sprints.find((s) => s.id === selectedSprintId)
                if (currentSprint && currentSprint.startDate && currentSprint.endDate) {
                  return (
                    <div className='mt-3 flex items-center gap-2 text-sm text-gray-600 bg-gray-50 rounded-lg px-3 py-2 w-fit'>
                      <Clock className='h-4 w-4' />
                      <span>Deadline:</span>
                      <span className='font-medium text-gray-800'>
                        {new Date(currentSprint.startDate).toLocaleDateString()} -{' '}
                        {new Date(currentSprint.endDate).toLocaleDateString()}
                      </span>
                    </div>
                  )
                }
                return null
              })()}

              {/* Stats cards toggle button */}
              <div className='flex items-center justify-between mt-2 mb-2'>
                <Button
                  variant='outline'
                  size='sm'
                  onClick={() => setShowStatsCards(!showStatsCards)}
                  className='flex items-center gap-2 text-gray-600 hover:text-gray-800 border-gray-300'
                >
                  <TrendingUp className='h-4 w-4' />
                  {showStatsCards ? 'Hide Stats' : 'Show Stats'}
                </Button>
              </div>

              {/* Clean stats cards matching Figma design */}
              <div
                className={`transition-all duration-300 ease-in-out overflow-hidden ${
                  showStatsCards ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
                }`}
              >
                <div className='grid grid-cols-1 md:grid-cols-3 gap-3'>
                  {(() => {
                    const stats = calculateBoardProgress(tasks)
                    let timeProgress = 0
                    const currentSprint = sprints.find((s) => s.id === selectedSprintId)
                    if (currentSprint && currentSprint.startDate && currentSprint.endDate) {
                      const now = new Date()
                      const start = new Date(currentSprint.startDate)
                      const end = new Date(currentSprint.endDate)
                      if (now >= start && now <= end) {
                        timeProgress = Math.round(
                          ((now.getTime() - start.getTime()) / (end.getTime() - start.getTime())) * 100
                        )
                      } else if (now > end) {
                        timeProgress = 100
                      } else {
                        timeProgress = 0
                      }
                    }
                    return (
                      <>
                        {/* Completed Card - Clean white design */}
                        <div className='bg-white rounded-lg p-4 border border-gray-200 shadow-sm hover:shadow-md transition-shadow'>
                          <div className='flex items-center justify-between'>
                            <div>
                              <p className='text-gray-600 text-sm font-medium'>Completed</p>
                              <p className='text-2xl font-bold text-gray-900'>{stats.completed}</p>
                            </div>
                            <div className='p-3 bg-green-50 rounded-lg'>
                              <CheckCircle className='h-6 w-6 text-green-600' />
                            </div>
                          </div>
                          <div className='mt-3 flex items-center gap-2'>
                            <div className='flex-1 bg-gray-200 rounded-full h-2'>
                              <div
                                className='bg-green-500 rounded-full h-2 transition-all duration-500'
                                style={{ width: `${stats.completionPercentage}%` }}
                              />
                            </div>
                            <span className='text-xs text-gray-500'>{stats.completionPercentage}%</span>
                          </div>
                        </div>

                        {/* Progress Card - Clean white design */}
                        <div className='bg-white rounded-lg p-4 border border-gray-200 shadow-sm hover:shadow-md transition-shadow'>
                          <div className='flex items-center justify-between'>
                            <div>
                              <p className='text-gray-600 text-sm font-medium'>Progress</p>
                              <p className='text-2xl font-bold text-gray-900'>{stats.completionPercentage}%</p>
                            </div>
                            <div className='p-3 bg-blue-50 rounded-lg'>
                              <TrendingUp className='h-6 w-6 text-blue-600' />
                            </div>
                          </div>
                          <div className='mt-3 flex items-center gap-2'>
                            <div className='flex-1 bg-gray-200 rounded-full h-2'>
                              <div
                                className='bg-blue-500 rounded-full h-2 transition-all duration-500'
                                style={{ width: `${stats.completionPercentage}%` }}
                              />
                            </div>
                            <span className='text-xs text-gray-500'>Completed</span>
                          </div>
                        </div>

                        {/* Time Card - Clean white design */}
                        <div className='bg-white rounded-lg p-4 border border-gray-200 shadow-sm hover:shadow-md transition-shadow'>
                          <div className='flex items-center justify-between'>
                            <div>
                              <p className='text-gray-600 text-sm font-medium'>Time</p>
                              <p className='text-2xl font-bold text-gray-900'>{timeProgress}%</p>
                            </div>
                            <div className='p-3 bg-gray-50 rounded-lg'>
                              <Clock className='h-6 w-6 text-gray-600' />
                            </div>
                          </div>
                          <div className='mt-3 flex items-center gap-2'>
                            <div className='flex-1 bg-gray-200 rounded-full h-2'>
                              <div
                                className='bg-gray-500 rounded-full h-2 transition-all duration-500'
                                style={{ width: `${timeProgress}%` }}
                              />
                            </div>
                            <span className='text-xs text-gray-500'>Sprint Time</span>
                          </div>
                        </div>
                      </>
                    )
                  })()}
                </div>
              </div>
            </div>
          </div>

          {/* Board container */}
          <div className='flex-1 overflow-hidden'>
            <div className='overflow-x-auto overflow-y-auto px-0 pb-2 pt-0 h-full'>
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragStart={handleDragStart}
                onDragEnd={handleDragEnd}
              >
                <SortableContext items={filteredBoards.map((b) => b.id)} strategy={horizontalListSortingStrategy}>
                  <div className='flex flex-row gap-4' style={{ minWidth: 'max-content' }}>
                    {/* Drop zone start */}
                    <div
                      className='w-0 bg-transparent flex-shrink-0' // changed from w-4 to w-0
                      data-dropzone='start'
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={() =>
                        handleDragEnd({ active: { id: '__dropzone_start__' }, over: { id: '__dropzone_start__' } })
                      }
                    />
                    {filteredBoards.map((board) => (
                      <div key={board.id} className='flex-shrink-0' style={{ width: '320px', minWidth: '320px' }}>
                        <SortableBoardColumn id={board.id}>
                          <DroppableBoard boardId={board.id}>
                            <SortableContext
                              items={board.tasks.map((t) => t.id)}
                              strategy={verticalListSortingStrategy}
                            >
                              <SortableTaskColumn
                                id={board.id}
                                title={board.name}
                                description={board.description}
                                tasks={board.tasks}
                                color={getBoardColor(board.name)}
                                onTaskCreated={refreshBoards}
                                status={board.name}
                                boardId={board.id}
                                movingTaskId={movingTaskId}
                              />
                            </SortableContext>
                          </DroppableBoard>
                        </SortableBoardColumn>
                      </div>
                    ))}
                    {/* Drop zone end */}
                    <div
                      className='w-0 bg-transparent flex-shrink-0' // changed from w-4 to w-0
                      data-dropzone='end'
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={() =>
                        handleDragEnd({ active: { id: '__dropzone_end__' }, over: { id: '__dropzone_end__' } })
                      }
                    />
                  </div>
                </SortableContext>
              </DndContext>
            </div>
          </div>
        </div>
      </div>

      <ProjectInviteDialog
        isOpen={isInviteOpen}
        onClose={() => setIsInviteOpen(false)}
        projectId={currentProject.id}
        onMemberAdded={handleMemberAdded}
      />

      {/* Lock dialog */}
      <Dialog open={isLockDialogOpen} onOpenChange={setIsLockDialogOpen}>
        <DialogContent className='max-w-md'>
          <DialogHeader>
            <DialogTitle>Board Column Lock</DialogTitle>
            <DialogDescription>Select columns to lock, or lock all columns to prevent moving them.</DialogDescription>
          </DialogHeader>
          <div className='flex flex-col gap-2 mt-4'>
            <label className='flex items-center gap-2 font-medium'>
              <Checkbox checked={lockAll} onCheckedChange={handleLockAll} />
              Lock all columns
            </label>
            <div className='max-h-48 overflow-y-auto pl-4'>
              {boards.map((b) => (
                <label key={b.id} className='flex items-center gap-2'>
                  <Checkbox
                    checked={lockedColumns.includes(b.id)}
                    onCheckedChange={() => handleToggleColumnLock(b.id)}
                    disabled={lockAll}
                  />
                  {b.name}
                </label>
              ))}
            </div>
          </div>
          <div className='flex justify-end gap-2 mt-6'>
            <Button variant='outline' onClick={() => setIsLockDialogOpen(false)}>
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
