import { projectMemberApi } from '@/api/projectMembers'
import { taskApi } from '@/api/tasks'
import ProjectTagManager from '@/components/projects/ProjectTagManager'
import { IssueCreateMenu } from '@/components/tasks/IssueCreateMenu'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useToastContext } from '@/components/ui/ToastContext'

import { useAuth } from '@/hooks/useAuth'

import { useCurrentProject } from '@/hooks/useCurrentProject'
import { useSignalRIntegration } from '@/hooks/useSignalRIntegration'
import { useTags } from '@/hooks/useTags'
import { cn } from '@/lib/utils'
import { ProjectMember } from '@/types/project'
import { TaskP } from '@/types/task'
import { formatDistanceToNow } from 'date-fns'
import {
  Calendar,
  Check,
  ChevronDown,
  ChevronsDown,
  ChevronsUp,
  ChevronUp,
  Eye,
  Filter,
  Link,
  ListTodo,
  Loader2,
  LogOut,
  MessageCircle,
  Paperclip,
  Pencil,
  Plus,
  Settings,
  UserPlus,
  X
} from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { projectApi } from '../../api/projects'
import { extractBackendErrorMessage, getErrorTitle, getErrorVariant } from '../../utils/errorHandler'
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '../ui/dialog'
interface ProjectListItem {
  id: string
  title: string
  description: string
  lastUpdate: string
  role: string
}

interface TaskDetailMenuProps {
  task: TaskP
  isOpen: boolean
  onClose: () => void
  onTaskUpdated: () => void
}

export function TaskDetailMenu({ task, isOpen, onClose, onTaskUpdated }: TaskDetailMenuProps) {
  const { currentProject } = useCurrentProject()
  const { user } = useAuth()
  const { showToast } = useToastContext()

  const navigate = useNavigate()
  const { listenForTaskUpdates } = useSignalRIntegration()

  const [assignee, setAssignee] = useState<ProjectMember | null>(null)
  const [projectMembers, setProjectMembers] = useState<ProjectMember[]>([])
  const [projectLeader, setProjectLeader] = useState<ProjectMember | null>(null)
  const { tags } = useTags()

  const [isTagSelectOpen, setIsTagSelectOpen] = useState(false)
  const [isPrioritySelectOpen, setIsPrioritySelectOpen] = useState(false)

  const [comment, setComment] = useState('')
  const [commentFiles, setCommentFiles] = useState<File[]>([])
  const [isCommentLoading, setIsCommentLoading] = useState(false)
  const [isUpdating, setIsUpdating] = useState(false)
  const [editTitle, setEditTitle] = useState(task.title)
  const [editDescription, setEditDescription] = useState(task.description)
  const [editPriority, setEditPriority] = useState<number>(normalizePriority(task.priority))
  const [editDeadline, setEditDeadline] = useState<string>(task.deadline ? task.deadline.split('T')[0] : '')
  const [editEffortPoints, setEditEffortPoints] = useState<string>(task.effortPoints?.toString() || '')
  const [effortPointsError, setEffortPointsError] = useState<string>('')
  const [isTagManagerOpen, setIsTagManagerOpen] = useState(false)

  // State cho edit mode
  const [isEditingTitle, setIsEditingTitle] = useState(false)
  const [isEditingDescription, setIsEditingDescription] = useState(false)

  // Normalize various priority representations to internal scale 1..4
  function normalizePriority(raw: unknown): number {
    if (typeof raw === 'number') {
      if ([1, 2, 3, 4].includes(raw)) return raw
      switch (raw) {
        case 0:
          return 1
        case 10000:
          return 2
        case 20000:
          return 3
        case 30000:
          return 4
        default:
          if (raw >= 30000) return 4
          if (raw >= 20000) return 3
          if (raw >= 10000) return 2
          return 1
      }
    }
    if (typeof raw === 'string') {
      const s = raw.trim().toLowerCase()
      if (s === 'low') return 1
      if (s === 'medium') return 2
      if (s === 'high') return 3
      if (s === 'urgent' || s === 'critical') return 4
      const n = Number(s)
      if (!Number.isNaN(n)) return normalizePriority(n)
      return 1
    }
    return 1
  }

  // Priority mapping
  const PRIORITY_MAP: Record<number, string> = {
    1: 'Low',
    2: 'Medium',
    3: 'High',
    4: 'Urgent'
  }

  // State for each assignee
  const [removeLoadingMap, setRemoveLoadingMap] = useState<{ [id: string]: boolean }>({})
  const [leaveLoadingMap, setLeaveLoadingMap] = useState<{ [id: string]: boolean }>({})
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false)
  const [showRemoveConfirm, setShowRemoveConfirm] = useState(false)
  const [selectedAssignee, setSelectedAssignee] = useState<string | null>(null)
  const [localTaskData, setLocalTaskData] = useState<TaskP>(task)

  const getPriorityChevron = (priority: number) => {
    switch (priority) {
      case 1:
        return <ChevronDown className='h-8 w-8 text-blue-500' />
      case 2:
        return (
          <div className='flex flex-col'>
            <ChevronsDown className='h-8 w-8 text-orange-400' />
          </div>
        )
      case 3:
        return <ChevronUp className='h-8 w-8 text-red-500' />
      case 4:
        return (
          <div className='flex flex-col'>
            <ChevronsUp className='h-8 w-8 text-red-600' />
          </div>
        )
      default:
        return <ChevronDown className='h-8 w-8 text-gray-400' />
    }
  }

  // Tạo function riêng để có thể gọi từ nhiều nơi
  const fetchAssigneeAndMembers = async () => {
    if (!currentProject || isRefreshing) {
      return
    }
    setIsRefreshing(true)
    try {
      const members = await projectMemberApi.getMembersByProjectId(currentProject.id)
      if (!members) {
        throw new Error('Failed to fetch project members')
      }

      setProjectMembers(members)

      // Kiểm tra nhiều trường hợp role Leader
      const leader = members.find(
        (member) =>
          member.role === 'Leader' ||
          member.role === 'leader' ||
          member.role === 'ProjectLeader' ||
          member.role === 'projectLeader'
      )
      console.log('Debug members and leader:', {
        members: members.map((m) => ({
          userId: m.userId,
          id: (m as ProjectMember).id || m.userId,
          role: m.role,
          fullName: m.fullName
        })),
        leader,
        currentUser: user?.id
      })

      // Kiểm tra role của user hiện tại trong members list
      const currentUserMember = members.find(
        (member) => member.userId === user?.id || (member as ProjectMember).id === user?.id
      )
      console.log('Current user member:', currentUserMember)
      console.log('Current user role in members:', currentUserMember?.role)
      if (leader) {
        setProjectLeader(leader)
      }

      const tasks = await taskApi.getTasksFromProject(currentProject.id)
      const taskDetails = tasks?.find((t) => t.id === task.id)
      if (taskDetails?.taskAssignees) {
        console.log('Task assignees:', taskDetails.taskAssignees)
        // Lấy assignee đầu tiên từ taskDetails.taskAssignees
        const assigneeFromTask =
          Array.isArray(taskDetails.taskAssignees) && taskDetails.taskAssignees.length > 0
            ? taskDetails.taskAssignees[0]
            : null
        console.log('Found assignee:', assigneeFromTask)
        if (assigneeFromTask) {
          setAssignee({
            userId: assigneeFromTask.projectMemberId,
            fullName: assigneeFromTask.executor,
            avatar: assigneeFromTask.avatar,
            role: assigneeFromTask.role
          })
        } else {
          console.log('Assignee not found in members list')
          console.log(
            'Available members:',
            members.map((m) => ({
              userId: m.userId,
              id: m.id || m.userId,
              fullName: m.fullName
            }))
          )
        }
      }

      // Update local task data with fresh server data
      if (taskDetails) {
        setLocalTaskData(taskDetails)
      }
    } catch (error) {
      console.error('Error fetching data:', error)
      showToast({
        title: 'Error',
        description: 'Failed to load task details. Please try again.',
        variant: 'destructive'
      })
    } finally {
      setIsRefreshing(false)
    }
  }

  // useEffect để fetch data ban đầu
  useEffect(() => {
    fetchAssigneeAndMembers()
  }, [currentProject, navigate, task.id, showToast, user?.id])

  // Thêm useEffect để refresh khi dialog mở
  useEffect(() => {
    if (isOpen && currentProject) {
      // Force refresh data khi dialog mở để đảm bảo data mới nhất
      console.log('🔄 Dialog opened, force refreshing data...')
      const refreshOnOpen = async () => {
        try {
          // Refresh task data từ server
          const updatedTasks = await taskApi.getTasksFromProject(currentProject.id)
          const updatedTask = updatedTasks?.find((t) => t.id === task.id)

          if (updatedTask) {
            // Cập nhật task assignees từ server data
            if (updatedTask.taskAssignees) {
              const assigneeFromTask =
                Array.isArray(updatedTask.taskAssignees) && updatedTask.taskAssignees.length > 0
                  ? updatedTask.taskAssignees[0]
                  : null

              if (assigneeFromTask) {
                const newAssignee = {
                  userId: assigneeFromTask.projectMemberId,
                  fullName: assigneeFromTask.executor,
                  avatar: assigneeFromTask.avatar,
                  role: assigneeFromTask.role
                }
                console.log('✅ Setting assignee from server on dialog open:', newAssignee)
                setAssignee(newAssignee)
              } else {
                console.log('❌ No assignee found in server data on dialog open')
                setAssignee(null)
              }
            }

            // Update local task data with fresh server data
            setLocalTaskData(updatedTask)

            // Refresh comments từ server
            setComments(updatedTask.commnets || [])
          }

          // Refresh members list từ server
          const updatedMembers = await projectMemberApi.getMembersByProjectId(currentProject.id)
          setProjectMembers(updatedMembers)

          console.log('✅ Dialog data refreshed on open')
        } catch (error) {
          console.error('❌ Error refreshing dialog data on open:', error)
        }
      }

      refreshOnOpen()
    }
  }, [isOpen, currentProject?.id, task.id])

  // SignalR: Listen for task updates
  useEffect(() => {
    if (!isOpen || !task.id) return

    const cleanup = listenForTaskUpdates(task.id, (notification) => {
      console.log('Task updated via SignalR:', notification)
      // Refresh task data when we receive a notification
      const refreshData = async () => {
        try {
          const members = await projectMemberApi.getMembersByProjectId(currentProject?.id || '')
          setProjectMembers(members)

          const tasks = await taskApi.getTasksFromProject(currentProject?.id || '')
          const taskDetails = tasks?.find((t) => t.id === task.id)
          if (taskDetails) {
            // Update local task data with fresh server data
            setLocalTaskData(taskDetails)

            // Cập nhật task tags để hiển thị màu sắc realtime
            if (taskDetails.taskAssignees) {
              const assigneeFromTask =
                Array.isArray(taskDetails.taskAssignees) && taskDetails.taskAssignees.length > 0
                  ? taskDetails.taskAssignees[0]
                  : null
              if (assigneeFromTask) {
                setAssignee({
                  userId: assigneeFromTask.projectMemberId,
                  fullName: assigneeFromTask.executor,
                  avatar: assigneeFromTask.avatar,
                  role: assigneeFromTask.role
                })
              } else {
                setAssignee(null)
              }
            }
          }
          onTaskUpdated()
        } catch (error) {
          console.error('Error refreshing task data:', error)
        }
      }
      refreshData()
    })

    return cleanup
  }, [isOpen, task.id, listenForTaskUpdates, onTaskUpdated, currentProject?.id])

  console.log('projectMembers:', projectMembers)
  console.log('current user:', user)

  // State để lưu role của user trong project hiện tại
  const [myProjectRole, setMyProjectRole] = useState<string | undefined>(undefined)

  useEffect(() => {
    const fetchMyRole = async () => {
      try {
        const res = await projectApi.getProjects() // gọi GET /project
        console.log('[TaskDetailMenu] Project API response:', res)
        if (res?.data && currentProject) {
          const myProject = res.data.find((p: ProjectListItem) => p.id === currentProject.id)
          console.log('[TaskDetailMenu] My project:', myProject)
          console.log('[TaskDetailMenu] My role:', myProject?.role)
          console.log('[TaskDetailMenu] Current project ID:', currentProject.id)
          console.log(
            '[TaskDetailMenu] All projects:',
            res.data.map((p: ProjectListItem) => ({ id: p.id, role: p.role }))
          )
          setMyProjectRole(myProject?.role)
        } else {
          console.log('[TaskDetailMenu] No data or currentProject:', {
            hasData: !!res?.data,
            currentProject: !!currentProject
          })
        }
      } catch (e) {
        console.error('[TaskDetailMenu] Error fetching role:', e)
        setMyProjectRole(undefined)
      }
    }
    fetchMyRole()
  }, [currentProject])

  // Kiểm tra role từ members list để so sánh
  const currentUserMember = projectMembers.find(
    (member) => member.userId === user?.id || (member.id || member.userId) === user?.id
  )

  // Logic phân quyền: xác định quyền dựa trên myProjectRole hoặc fallback về members list
  const effectiveRole = myProjectRole || currentUserMember?.role
  const isUserLeader = effectiveRole === 'Leader' || effectiveRole === 'leader'
  const isUserOwnerOrAdmin =
    effectiveRole === 'Owner' ||
    effectiveRole === 'Admin' ||
    effectiveRole === 'owner' ||
    effectiveRole === 'admin' ||
    effectiveRole === '0'
  const canAssignTask = isUserLeader || isUserOwnerOrAdmin

  console.log('[TaskDetailMenu] Role check:', {
    myProjectRole,
    effectiveRole,
    isUserLeader,
    isUserOwnerOrAdmin,
    canAssignTask,
    currentUserMemberRole: currentUserMember?.role,
    currentUserMember
  })

  // Cải thiện hàm handleAssignMember để refresh ngay lập tức
  const handleAssignMember = async (memberId: string) => {
    console.log('🎯 Assign memberId:', memberId)
    console.log('📋 Available projectMembers:', projectMembers)

    // Tìm member bằng userId hoặc id (để xử lý cả hai trường hợp)
    const member = projectMembers.find((m) => m.userId === memberId || (m.id || m.userId) === memberId)
    console.log('👤 Assign member object:', member)
    console.log('🔑 Member keys:', member ? Object.keys(member) : 'No member found')

    if (!member) {
      console.error('❌ Member not found for ID:', memberId)
      console.log(
        '📝 Available member IDs:',
        projectMembers.map((m) => ({
          userId: m.userId,
          id: m.id || m.userId,
          fullName: m.fullName
        }))
      )
      return
    }

    // Sử dụng member.userId hoặc member.id cho implementerId
    const implementerId = member.userId || member.id || ''
    console.log('🆔 Assign implementerId:', implementerId)

    try {
      // 1. Thực hiện assign task API trước
      console.log('🚀 Calling assignTask API...')
      await taskApi.assignTask(currentProject!.id, task.id, implementerId)
      console.log('✅ API call successful')

      // 2. Force reload toàn bộ dialog data từ server
      console.log('🔄 Force reloading all dialog data...')

      // Refresh task data từ server
      const updatedTasks = await taskApi.getTasksFromProject(currentProject!.id)
      const updatedTask = updatedTasks?.find((t) => t.id === task.id)
      console.log('📋 Updated task data:', updatedTask)

      if (updatedTask) {
        // Cập nhật local task data từ server
        setLocalTaskData(updatedTask)

        // Cập nhật task assignees từ server data
        if (updatedTask.taskAssignees) {
          const assigneeFromTask =
            Array.isArray(updatedTask.taskAssignees) && updatedTask.taskAssignees.length > 0
              ? updatedTask.taskAssignees[0]
              : null

          if (assigneeFromTask) {
            const newAssignee = {
              userId: assigneeFromTask.projectMemberId,
              fullName: assigneeFromTask.executor,
              avatar: assigneeFromTask.avatar,
              role: assigneeFromTask.role
            }
            console.log('✅ Setting new assignee from server:', newAssignee)
            setAssignee(newAssignee)
          } else {
            console.log('❌ No assignee found in server data')
            setAssignee(null)
          }
        }

        // Refresh comments từ server
        setComments(updatedTask.commnets || [])
      }

      // Refresh members list từ server
      const updatedMembers = await projectMemberApi.getMembersByProjectId(currentProject!.id)
      setProjectMembers(updatedMembers)

      // 3. Refresh parent component ngay lập tức
      onTaskUpdated()

      // 4. Force refresh parent component sau 500ms
      setTimeout(() => {
        console.log('🔄 Force refreshing parent component...')
        onTaskUpdated()
      }, 500)

      // 5. Trigger một reload bổ sung sau 1s để đảm bảo
      setTimeout(async () => {
        console.log('🔄 Additional reload after 1s...')
        const finalTasks = await taskApi.getTasksFromProject(currentProject!.id)
        const finalTask = finalTasks?.find((t) => t.id === task.id)
        if (finalTask?.taskAssignees) {
          const finalAssignee =
            Array.isArray(finalTask.taskAssignees) && finalTask.taskAssignees.length > 0
              ? finalTask.taskAssignees[0]
              : null
          if (finalAssignee) {
            setAssignee({
              userId: finalAssignee.projectMemberId,
              fullName: finalAssignee.executor,
              avatar: finalAssignee.avatar,
              role: finalAssignee.role
            })
          }
        }
        onTaskUpdated()
      }, 1000)

      showToast({
        title: 'Success',
        description: `Task assigned to ${member.fullName || member.email || member.userId || member.id}`,
        variant: 'success'
      })
    } catch (error) {
      console.error('❌ Error in assign task:', error)
      const message = error instanceof Error ? error.message : 'Failed to assign task.'
      showToast({ title: 'Error', description: message, variant: 'destructive' })
    }
  }

  const handleAttach = () => {
    // Trigger file input for attachment
    attachFileInputRef.current?.click()
  }

  const handleAttachFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!currentProject || !e.target.files || e.target.files.length === 0) return

    const files = Array.from(e.target.files)
    setIsUpdating(true)

    try {
      const res = await taskApi.completeTaskWithUpload(currentProject.id, task.id, files)
      showToast({
        title: res ? 'Success' : 'Error',
        description: res ? 'Files attached successfully!' : 'Failed to attach files',
        variant: res ? 'success' : 'destructive'
      })

      if (res) {
        // Refresh task data to show new attachments
        onTaskUpdated && onTaskUpdated()
      }
    } catch (error) {
      const errorMessage = extractBackendErrorMessage(error)
      const errorTitle = getErrorTitle(error)
      const errorVariant = getErrorVariant(error)

      showToast({
        title: errorTitle,
        description: errorMessage,
        variant: errorVariant
      })
    } finally {
      setIsUpdating(false)
      // Clear the file input
      if (e.target) {
        e.target.value = ''
      }
    }
  }

  const handleTagSelect = async (tagId: string) => {
    if (!currentProject) return
    try {
      await taskApi.addTagToTask(currentProject.id, task.id, tagId)
      // Tag added successfully
      showToast({
        title: 'Success',
        description: 'Tag added to task!',
        variant: 'success'
      })
      // Inform parent so lists refresh immediately
      try {
        onTaskUpdated && onTaskUpdated()
      } catch {}
      setIsTagSelectOpen(false)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to add tag'
      showToast({
        title: 'Error',
        description: message,
        variant: 'destructive'
      })
    }
  }

  const handleCommentFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setCommentFiles(Array.from(e.target.files))
    }
  }

  const handleAddComment = async () => {
    if (!currentProject || !comment.trim()) return
    setIsCommentLoading(true)
    try {
      await taskApi.addTaskComment(currentProject.id, task.id, comment, commentFiles)
      showToast({ title: 'Success', description: 'Comment added!', variant: 'success' })
      setComment('')
      setCommentFiles([])
      // TODO: reload comments/activity if needed
      await fetchComments()
    } catch (error) {
      const errorMessage = extractBackendErrorMessage(error)
      const errorTitle = getErrorTitle(error)
      const errorVariant = getErrorVariant(error)

      showToast({
        title: errorTitle,
        description: errorMessage,
        variant: errorVariant
      })
    } finally {
      setIsCommentLoading(false)
    }
  }

  useEffect(() => {
    setEditTitle(task.title)
    setEditDescription(task.description)
    setEditPriority(normalizePriority(task.priority))
    setEditDeadline(task.deadline ? task.deadline.split('T')[0] : '')
    setEditEffortPoints(task.effortPoints?.toString() || '')
    setLocalTaskData(task)
    // Task data updated
  }, [task])

  // Update edit fields when localTaskData changes (for real-time updates)
  useEffect(() => {
    setEditTitle(localTaskData.title)
    setEditDescription(localTaskData.description)
    setEditPriority(normalizePriority(localTaskData.priority))
    setEditDeadline(localTaskData.deadline ? localTaskData.deadline.split('T')[0] : '')
    setEditEffortPoints(localTaskData.effortPoints?.toString() || '')
  }, [localTaskData])

  // Validation function for effort points
  const validateEffortPoints = (value: string): string => {
    if (!value.trim()) return '' // Empty is valid (optional field)
    const num = Number(value)
    if (isNaN(num) || !/^\d+$/.test(value) || num < 0) {
      return 'Effort points must be a positive integer'
    }
    return ''
  }

  // Handle effort points change with validation
  const handleEffortPointsChange = (value: string) => {
    setEditEffortPoints(value)
    const error = validateEffortPoints(value)
    setEffortPointsError(error)
  }

  // Handle effort points blur for validation
  const handleEffortPointsBlur = () => {
    const error = validateEffortPoints(editEffortPoints)
    setEffortPointsError(error)
  }

  const handleUpdateTask = async () => {
    if (!currentProject) return
    setIsUpdating(true)
    try {
      const effortPointsValue = editEffortPoints.trim() ? Number(editEffortPoints) : null
      const res = await taskApi.updateTask(currentProject.id, task.id, {
        title: editTitle,
        description: editDescription,
        priority: editPriority.toString(),
        deadline: editDeadline || null,
        effortPoints: effortPointsValue
      })
      if (typeof res === 'object' && res !== null && 'code' in res && 'message' in res) {
        showToast({
          title: res.code === 200 ? 'Success' : 'Error',
          description: res.message || 'Task updated!',
          variant: res.code === 200 ? 'success' : 'destructive'
        })
      } else {
        showToast({
          title: res === true ? 'Success' : 'Error',
          description: res === true ? 'Task updated!' : 'Failed to update task',
          variant: res === true ? 'success' : 'destructive'
        })
      }
      // Ask parent to refresh and reflect changes immediately
      onTaskUpdated && onTaskUpdated()
    } catch (error) {
      const errorMessage = extractBackendErrorMessage(error)
      const errorTitle = getErrorTitle(error)
      const errorVariant = getErrorVariant(error)

      showToast({
        title: errorTitle,
        description: errorMessage,
        variant: errorVariant
      })
    } finally {
      setIsUpdating(false)
    }
  }

  // Activity Section
  const [comments, setComments] = useState<
    {
      commenter: string
      content: string
      avatar: string
      attachmentUrls: string[]
      lastUpdate: string
    }[]
  >([])

  const fetchComments = async () => {
    if (!currentProject) return
    try {
      const tasks = await taskApi.getTasksFromProject(currentProject.id)
      const currentTask = tasks.find((t: TaskP) => t.id === task.id)
      setComments(currentTask?.commnets || [])
    } catch {
      setComments([])
    }
  }

  useEffect(() => {
    fetchComments()
    // eslint-disable-next-line
  }, [isOpen, task.id])

  const allAttachmentUrls: string[] = [
    ...(localTaskData.attachmentUrl ? [localTaskData.attachmentUrl] : []),
    ...(localTaskData.commnets || []).flatMap((c) => c.attachmentUrls || [])
  ]

  const priorityDropdownRef = useRef<HTMLDivElement>(null)
  const tagDropdownRef = useRef<HTMLDivElement>(null)
  const attachFileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        isPrioritySelectOpen &&
        priorityDropdownRef.current &&
        !priorityDropdownRef.current.contains(event.target as Node)
      ) {
        setIsPrioritySelectOpen(false)
      }
      if (isTagSelectOpen && tagDropdownRef.current && !tagDropdownRef.current.contains(event.target as Node)) {
        setIsTagSelectOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isPrioritySelectOpen, isTagSelectOpen])

  // Tìm project member hiện tại dựa trên email (vì userId không trùng id)
  const myProjectMember = projectMembers.find((m) => m.email === user?.email)
  const myProjectMemberId = myProjectMember?.id

  // Debug chi tiết mapping
  console.log('projectMembers:', projectMembers)
  console.log('current user:', user)
  console.log('myProjectMember:', myProjectMember)
  console.log('myProjectMemberId:', myProjectMemberId)
  console.log('taskAssignees:', task.taskAssignees)

  // Hỗ trợ nhiều assignee
  const assigneeProjectMemberIds = task.taskAssignees?.map((a) => a.projectMemberId) || []
  const isUserAssignee =
    !!myProjectMemberId &&
    Array.isArray(task.taskAssignees) &&
    task.taskAssignees.some((a) => a.projectMemberId === myProjectMemberId)

  // Debug chi tiết
  console.log('myProjectMember:', myProjectMember)
  console.log('myProjectMemberId:', myProjectMemberId)
  console.log('assigneeProjectMemberIds:', assigneeProjectMemberIds)

  const isTaskAccepted = !!task.assignmentAccepted

  // Kiểm tra role từ currentProject và projectLeader

  // Debug info
  console.log('Debug assignment logic:', {
    user: user?.id,
    myProjectRole,
    effectiveRole,
    currentProjectRole: currentProject?.role,
    projectLeader: projectLeader ? ('id' in projectLeader ? projectLeader.id : projectLeader.userId) : null,
    isUserLeader,
    isUserOwnerOrAdmin,
    canAssignTask,
    assignee: assignee ? ('id' in assignee ? assignee.id : assignee.userId) : null,
    isUserAssignee,
    isTaskAccepted
  })

  // Debug logs for Leave button visibility
  console.log('[TaskDetailMenu] isUserAssignee:', isUserAssignee)
  console.log('[TaskDetailMenu] myProjectMember:', myProjectMember)
  console.log('[TaskDetailMenu] myProjectMemberId:', myProjectMemberId)
  console.log('[TaskDetailMenu] assigneeProjectMemberIds:', assigneeProjectMemberIds)

  const handleLeaveTask = async (projectMemberId: string) => {
    setLeaveLoadingMap((prev) => ({ ...prev, [projectMemberId]: true }))
    try {
      await taskApi.leaveTaskAssignment(currentProject!.id, task.id, {
        reason: 'User voluntarily left the task'
      })
      showToast({ title: 'Success', description: 'You have left this task!' })
      setAssignee(null)

      // Refresh data immediately using the optimized function
      await fetchAssigneeAndMembers()
      onTaskUpdated()

      // Force reload dialog data
      await reloadDialogData()
    } catch (error) {
      const errorMessage = extractBackendErrorMessage(error)
      const errorTitle = getErrorTitle(error)
      const errorVariant = getErrorVariant(error)

      showToast({
        title: errorTitle,
        description: errorMessage,
        variant: errorVariant
      })
    } finally {
      setLeaveLoadingMap((prev) => ({ ...prev, [projectMemberId]: false }))
      setShowLeaveConfirm(false)
      setSelectedAssignee(null)
    }
  }

  // Function chung để reload dialog data
  const reloadDialogData = async () => {
    try {
      console.log('🔄 Reloading dialog data from server...')

      // Refresh task data từ server
      const updatedTasks = await taskApi.getTasksFromProject(currentProject!.id)
      const updatedTask = updatedTasks?.find((t) => t.id === task.id)

      if (updatedTask) {
        console.log('📋 Updated task data from server:', updatedTask)

        // Update local task data to reflect real-time changes
        setLocalTaskData(updatedTask)

        // Refresh assignee data
        if (updatedTask.taskAssignees) {
          const assigneeFromTask =
            Array.isArray(updatedTask.taskAssignees) && updatedTask.taskAssignees.length > 0
              ? updatedTask.taskAssignees[0]
              : null

          if (assigneeFromTask) {
            const newAssignee = {
              userId: assigneeFromTask.projectMemberId,
              fullName: assigneeFromTask.executor,
              avatar: assigneeFromTask.avatar,
              role: assigneeFromTask.role
            }
            setAssignee(newAssignee)
          } else {
            setAssignee(null)
          }
        }

        // Refresh comments
        setComments(updatedTask.commnets || [])

        // Log completion status and files
        console.log('✅ Task completion status:', updatedTask.status)
        console.log('📁 Task completion files:', updatedTask.completionAttachmentUrls)
        console.log('📎 Task attachment URL:', updatedTask.attachmentUrl)

        // Show real-time update notification
        if (updatedTask.status === 'done' || updatedTask.status === 'completed') {
          console.log('🎉 Task is now completed!')
        }
      } else {
        console.warn('⚠️ Task not found in updated data')
      }

      // Refresh members list
      const updatedMembers = await projectMemberApi.getMembersByProjectId(currentProject!.id)
      setProjectMembers(updatedMembers)

      console.log('✅ Dialog data reloaded successfully')
    } catch (error) {
      console.error('❌ Error reloading dialog data:', error)
    }
  }

  const handleRemoveAssignee = async (projectMemberId: string) => {
    setRemoveLoadingMap((prev) => ({ ...prev, [projectMemberId]: true }))
    try {
      await taskApi.removeTaskAssignment(currentProject!.id, task.id, {
        implementId: projectMemberId,
        reason: 'Assignee removed by project leader'
      })
      showToast({ title: 'Success', description: 'Assignee removed from task!' })

      // Force refresh task data từ server ngay lập tức
      console.log('🔄 Force refreshing task data after remove...')
      const updatedTasks = await taskApi.getTasksFromProject(currentProject!.id)
      const updatedTask = updatedTasks?.find((t) => t.id === task.id)

      if (updatedTask) {
        console.log('📋 Updated task data after remove:', updatedTask)
        console.log('📋 Task assignees after remove:', updatedTask.taskAssignees)

        // Cập nhật local task data từ server
        setLocalTaskData(updatedTask)

        // Cập nhật assignee state từ server data
        if (updatedTask.taskAssignees) {
          const assigneeFromTask =
            Array.isArray(updatedTask.taskAssignees) && updatedTask.taskAssignees.length > 0
              ? updatedTask.taskAssignees[0]
              : null

          if (assigneeFromTask) {
            const newAssignee = {
              userId: assigneeFromTask.projectMemberId,
              fullName: assigneeFromTask.executor,
              avatar: assigneeFromTask.avatar,
              role: assigneeFromTask.role
            }
            console.log('✅ Setting new assignee after remove:', newAssignee)
            setAssignee(newAssignee)
          } else {
            console.log('❌ No assignee found after remove')
            setAssignee(null)
          }
        } else {
          console.log('❌ No taskAssignees found after remove')
          setAssignee(null)
        }

        // Refresh comments từ server
        setComments(updatedTask.commnets || [])
      }

      // Refresh members list từ server
      const updatedMembers = await projectMemberApi.getMembersByProjectId(currentProject!.id)
      setProjectMembers(updatedMembers)

      // Refresh parent component ngay lập tức
      onTaskUpdated()

      // Force refresh parent component sau 500ms
      setTimeout(() => {
        console.log('🔄 Force refreshing parent component after remove...')
        onTaskUpdated()
      }, 500)

      // Trigger một reload bổ sung sau 1s để đảm bảo
      setTimeout(async () => {
        console.log('🔄 Additional reload after 1s for remove...')
        const finalTasks = await taskApi.getTasksFromProject(currentProject!.id)
        const finalTask = finalTasks?.find((t) => t.id === task.id)
        console.log('📋 Final task data after remove:', finalTask)
        if (finalTask?.taskAssignees) {
          const finalAssignee =
            Array.isArray(finalTask.taskAssignees) && finalTask.taskAssignees.length > 0
              ? finalTask.taskAssignees[0]
              : null
          if (finalAssignee) {
            setAssignee({
              userId: finalAssignee.projectMemberId,
              fullName: finalAssignee.executor,
              avatar: finalAssignee.avatar,
              role: finalAssignee.role
            })
          } else {
            setAssignee(null)
          }
        } else {
          setAssignee(null)
        }
        onTaskUpdated()
      }, 1000)
    } catch (error) {
      const errorMessage = extractBackendErrorMessage(error)
      const errorTitle = getErrorTitle(error)
      const errorVariant = getErrorVariant(error)

      showToast({
        title: errorTitle,
        description: errorMessage,
        variant: errorVariant
      })
    } finally {
      setRemoveLoadingMap((prev) => ({ ...prev, [projectMemberId]: false }))
      setShowRemoveConfirm(false)
      setSelectedAssignee(null)
    }
  }

  if (!currentProject) {
    return null
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogDescription className='hidden'>Description</DialogDescription>
      <DialogContent className='max-w-[95vw] sm:max-w-[90vw] md:max-w-[80vw] lg:max-w-[70vw] xl:max-w-[60vw] 2xl:max-w-[50vw] w-full max-h-[90vh] sm:max-h-[85vh] overflow-y-auto [&>button]:hidden scrollbar-transparent mx-2 sm:mx-4'>
        <DialogTitle className='hidden'>Title</DialogTitle>

        {/* Header */}
        <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-3'>
          <div className='flex items-center gap-2'>
            <span className='text-lg font-semibold'>Task Details</span>
            <button className='p-1 rounded-lg bg-lavender-200 text-lavender-500 hover:bg-lavender-300/60 hover:text-lavender-800'>
              <Link className='h-4 w-4' />
            </button>
          </div>
          <button onClick={onClose} className='text-gray-400 hover:text-gray-600 self-end sm:self-auto'>
            <X className='h-4 w-4' />
          </button>
        </div>

        {/* Completion Banner - Show when task is completed */}
        {(localTaskData.status === 'done' || localTaskData.status === 'completed') && (
          <div className='mb-3 p-3 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg shadow-sm'>
            <div className='flex flex-col sm:flex-row sm:items-center gap-2'>
              <div className='flex items-center gap-2 flex-shrink-0'>
                <div className='w-8 h-8 bg-green-100 rounded-full flex items-center justify-center'>
                  <Check className='h-5 w-5 text-green-600' />
                </div>
                <div className='flex-1'>
                  <h3 className='text-base font-semibold text-green-800'>Task Completed Successfully!</h3>
                  <p className='text-green-700 text-xs'>
                    This task has been marked as complete. You can continue viewing details or close the dialog when
                    ready.
                  </p>
                </div>
              </div>
              <div className='flex-shrink-0 self-start sm:self-auto'>
                <span className='inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800'>
                  {localTaskData.status}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Task Name and Priority */}
        <div className='mb-3'>
          <div className='flex items-center gap-2 mb-1'>
            <span className='text-sm text-gray-500'>Board</span>
            <span className='text-gray-900 cursor-pointer hover:underline font-medium'>{localTaskData.status}</span>
            {/* Completion Status Indicator */}
            {(localTaskData.status === 'done' || localTaskData.status === 'completed') && (
              <div className='flex items-center gap-1 px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium'>
                <Check className='h-3 w-3' />
                <span className='hidden sm:inline'>Completed</span>
                <span className='sm:hidden'>Done</span>
              </div>
            )}
          </div>
          <div className='flex flex-col sm:flex-row sm:items-center gap-2'>
            <div className='flex items-center gap-2 flex-1'>
              <ListTodo className='h-4 w-4 flex-shrink-0' />
              <div className='relative flex-grow'>
                {isEditingTitle ? (
                  <Input
                    className='text-lg sm:text-xl font-semibold pr-10 w-full'
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    onBlur={() => setIsEditingTitle(false)}
                    autoFocus
                    disabled={isUpdating}
                  />
                ) : (
                  <div
                    className='text-lg sm:text-xl font-semibold pr-10 w-full flex items-center group cursor-pointer rounded hover:bg-gray-50 transition'
                    onClick={() => setIsEditingTitle(true)}
                  >
                    <span className='flex-1 truncate'>{editTitle}</span>
                    <Pencil className='h-4 w-4 ml-2 text-gray-400 opacity-0 group-hover:opacity-100 transition' />
                  </div>
                )}
              </div>
            </div>
            <div className='flex items-center gap-2 flex-shrink-0'>
              <div className='relative' ref={priorityDropdownRef}>
                <button
                  type='button'
                  className={`w-28 sm:w-32 flex items-center justify-between border rounded px-2 py-1 text-center bg-lavender-50 font-medium text-lavender-700 hover:bg-lavender-100 transition-colors duration-150 shadow-sm focus:outline-none focus:ring-2 focus:ring-lavender-300 ${isUpdating ? 'opacity-60 cursor-not-allowed' : ''}`}
                  onClick={() => setIsPrioritySelectOpen((v) => !v)}
                  disabled={isUpdating}
                  aria-label='Priority'
                >
                  <span className='flex items-center gap-1 whitespace-nowrap text-xs sm:text-sm'>
                    {getPriorityChevron(editPriority as number)}
                    <span className='hidden sm:inline'>{PRIORITY_MAP[editPriority as number] || 'Set Priority'}</span>
                    <span className='sm:hidden'>{PRIORITY_MAP[editPriority as number]?.slice(0, 3) || 'Set'}</span>
                  </span>
                  <ChevronDown className='h-3 w-3 ml-1 text-lavender-400' />
                </button>
                {isPrioritySelectOpen && (
                  <div className='absolute left-0 top-10 z-[9993] bg-white border rounded shadow-lg min-w-[140px] max-h-48 overflow-y-auto animate-fade-in'>
                    {[1, 2, 3, 4].map((priority) => (
                      <button
                        key={priority}
                        className={`w-full flex items-center gap-2 px-3 py-1.5 text-left text-xs font-medium hover:bg-lavender-50 transition-colors duration-100 ${editPriority === priority ? 'bg-lavender-100 text-lavender-700' : 'text-gray-700'}`}
                        onClick={() => {
                          setEditPriority(priority)
                          setIsPrioritySelectOpen(false)
                        }}
                        disabled={isUpdating}
                      >
                        {getPriorityChevron(priority)}
                        <span className='hidden sm:inline'>{PRIORITY_MAP[priority]}</span>
                        <span className='sm:hidden'>{PRIORITY_MAP[priority]?.slice(0, 3)}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
          <div className='flex items-center gap-2 mt-1'>
            <Calendar className='h-3 w-3 text-gray-400' />
            <span className='text-xs text-gray-600'>Deadline:</span>
            <input
              type='date'
              className='border rounded px-1 py-0.5 text-xs focus:outline-none focus:ring-1 focus:ring-lavender-400'
              value={editDeadline}
              onChange={(e) => setEditDeadline(e.target.value)}
              disabled={isUpdating}
            />
            {localTaskData.deadline && !editDeadline && (
              <button
                type='button'
                onClick={() => setEditDeadline(localTaskData.deadline ? localTaskData.deadline.split('T')[0] : '')}
                className='text-[10px] text-blue-500 underline'
              >
                revert
              </button>
            )}
            {editDeadline && (
              <button type='button' onClick={() => setEditDeadline('')} className='text-[10px] text-red-500 underline'>
                clear
              </button>
            )}
          </div>
          <div className='flex items-center gap-2 mt-1'>
            <span className='text-xs text-gray-600'>Effort Points:</span>
            <div className='relative'>
              <input
                type='text'
                className={`border rounded px-2 py-0.5 text-xs focus:outline-none focus:ring-1 focus:ring-lavender-400 w-20 ${
                  effortPointsError ? 'border-red-500 focus:ring-red-400' : ''
                }`}
                value={editEffortPoints}
                onChange={(e) => handleEffortPointsChange(e.target.value)}
                onBlur={handleEffortPointsBlur}
                placeholder='0'
                disabled={isUpdating}
              />
              {effortPointsError && (
                <div className='absolute top-full left-0 mt-1 text-xs text-red-600 bg-white border border-red-200 rounded px-2 py-1 shadow-sm z-10'>
                  {effortPointsError}
                </div>
              )}
            </div>
            {localTaskData.effortPoints !== null && localTaskData.effortPoints !== undefined && !editEffortPoints && (
              <button
                type='button'
                onClick={() => setEditEffortPoints(localTaskData.effortPoints?.toString() || '')}
                className='text-[10px] text-blue-500 underline'
              >
                revert
              </button>
            )}
            {editEffortPoints && (
              <button
                type='button'
                onClick={() => {
                  setEditEffortPoints('')
                  setEffortPointsError('')
                }}
                className='text-[10px] text-red-500 underline'
              >
                clear
              </button>
            )}
          </div>
          <div className='mt-2 text-gray-600'>
            <div className='relative'>
              {isEditingDescription ? (
                <textarea
                  className='w-full border rounded p-2 pr-10 font-medium text-sm'
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  onBlur={() => setIsEditingDescription(false)}
                  autoFocus
                  disabled={isUpdating}
                />
              ) : (
                <div className='w-full min-h-[40px] flex items-center rounded px-2 py-1.5 bg-gray-50'>
                  <span className={`flex-1 text-sm ${!editDescription ? 'text-gray-400 italic' : ''} font-medium`}>
                    {editDescription || 'No detailed description for this task.'}
                  </span>
                  <Button
                    variant='ghost'
                    size='icon'
                    className='ml-2 text-gray-400 hover:text-blue-500 h-6 w-6'
                    onClick={() => setIsEditingDescription(true)}
                  >
                    <Pencil className='h-3 w-3' />
                  </Button>
                </div>
              )}
            </div>
          </div>
          <div className='flex justify-end mt-2'>
            <Button
              onClick={handleUpdateTask}
              disabled={
                isUpdating ||
                !editTitle.trim() ||
                (editTitle === task.title &&
                  editDescription === task.description &&
                  editPriority === task.priority &&
                  (task.deadline ? task.deadline.split('T')[0] : '') === editDeadline &&
                  (task.effortPoints?.toString() || '') === editEffortPoints) ||
                !!effortPointsError
              }
              className='px-4 py-1.5 bg-lavender-500 hover:bg-lavender-700 text-white font-semibold border-0 text-sm'
              style={{ boxShadow: 'none' }}
            >
              {isUpdating ? (
                <>
                  <Loader2 className='mr-1 h-3 w-3 animate-spin' />
                  Saving...
                </>
              ) : (
                'Save'
              )}
            </Button>
          </div>
        </div>

        {/* Attachments */}
        {allAttachmentUrls.length > 0 && (
          <div className='mt-3'>
            <div className='font-semibold mb-2 text-sm'>Attachments:</div>
            <div className='grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2'>
              {allAttachmentUrls.map((url: string, idx: number) => {
                if (url.match(/\.(jpg|jpeg|png|gif)$/i)) {
                  // Image
                  return (
                    <a key={url || idx} href={url} target='_blank' rel='noopener noreferrer'>
                      <img
                        src={url}
                        alt={`attachment-${idx}`}
                        className='w-full h-16 sm:h-20 object-cover rounded border'
                      />
                    </a>
                  )
                } else if (url.match(/\.pdf$/i)) {
                  // PDF
                  return (
                    <div key={url || idx} className='w-full h-32 sm:h-40 md:h-56 border rounded overflow-hidden'>
                      <iframe src={url} title={`pdf-${idx}`} className='w-full h-full' />
                      <a
                        href={url}
                        target='_blank'
                        rel='noopener noreferrer'
                        className='block text-blue-600 underline text-center mt-1 font-medium text-xs'
                      >
                        View PDF
                      </a>
                    </div>
                  )
                } else {
                  // Other file
                  return (
                    <a
                      key={url || idx}
                      href={url}
                      target='_blank'
                      rel='noopener noreferrer'
                      className='text-blue-600 underline flex items-center gap-1 font-medium text-sm p-2 border rounded hover:bg-gray-50'
                    >
                      📎 File {idx + 1}
                    </a>
                  )
                }
              })}
            </div>
          </div>
        )}

        {/* Completion Files - Special section for files uploaded when completing task */}
        {Array.isArray(localTaskData.completionAttachmentUrls) && localTaskData.completionAttachmentUrls.length > 0 && (
          <div className='mt-3 p-3 bg-green-50 border border-green-200 rounded-lg'>
            <div className='flex flex-col sm:flex-row sm:items-center gap-2 mb-2'>
              <div className='flex items-center gap-2'>
                <Check className='h-4 w-4 text-green-600' />
                <span className='font-semibold text-green-800 text-sm'>Completion Files</span>
              </div>
              <span className='text-xs text-green-600'>Files uploaded when completing this task</span>
            </div>
            <div className='grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2'>
              {localTaskData.completionAttachmentUrls.map((url: string, idx: number) => {
                if (url.match(/\.(jpg|jpeg|png|gif)$/i)) {
                  // Image
                  return (
                    <a key={url || idx} href={url} target='_blank' rel='noopener noreferrer'>
                      <img
                        src={url}
                        alt={`completion-file-${idx}`}
                        className='w-full h-16 sm:h-20 object-cover rounded border border-green-300'
                      />
                    </a>
                  )
                } else if (url.match(/\.pdf$/i)) {
                  // PDF
                  return (
                    <div
                      key={url || idx}
                      className='w-full h-32 sm:h-40 md:h-56 border border-green-300 rounded overflow-hidden'
                    >
                      <iframe src={url} title={`completion-pdf-${idx}`} className='w-full h-full' />
                      <a
                        href={url}
                        target='_blank'
                        rel='noopener noreferrer'
                        className='block text-green-600 underline text-center mt-1 font-medium text-xs'
                      >
                        View PDF
                      </a>
                    </div>
                  )
                } else {
                  // Other file
                  return (
                    <a
                      key={url || idx}
                      href={url}
                      target='_blank'
                      rel='noopener noreferrer'
                      className='text-green-600 underline flex items-center gap-1 font-medium text-sm p-2 border border-green-300 rounded hover:bg-green-100'
                    >
                      📎 Completion File {idx + 1}
                    </a>
                  )
                }
              })}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className='flex flex-wrap gap-2 mb-4'>
          <button
            onClick={handleAttach}
            disabled={isUpdating}
            className='flex items-center gap-1 px-2 py-1 text-gray-600 rounded-lg border hover:bg-gray-50 text-sm disabled:opacity-50 disabled:cursor-not-allowed'
          >
            {isUpdating ? <Loader2 className='h-3 w-3 animate-spin' /> : <Paperclip className='h-3 w-3' />}
            <span>{isUpdating ? 'Attaching...' : 'Attach'}</span>
          </button>

          {/* Hidden file input for attachments */}
          <input
            type='file'
            multiple
            ref={attachFileInputRef}
            style={{ display: 'none' }}
            onChange={handleAttachFileChange}
          />

          {currentProject && (
            <IssueCreateMenu projectId={currentProject.id} taskId={task.id} onIssueCreated={onTaskUpdated} />
          )}
        </div>

        {/* Assignee and Tags - Layout responsive */}
        <div className='grid grid-cols-1 xl:grid-cols-2 gap-3 lg:gap-4 mb-4'>
          {/* Assignee Section - Cột trái */}
          <div>
            <h1 className='text-sm font-semibold mb-2 flex items-center gap-2'>Assignee</h1>
            <div className='flex flex-col gap-2 lg:gap-3 p-2 lg:p-3 bg-white rounded-lg shadow-sm border'>
              {/* Debug info */}
              <div className='text-xs text-gray-500 mb-1'>
                {/* Debug: Task ID: {localTaskData.id} | Assignees: {Array.isArray(localTaskData.taskAssignees) ? localTaskData.taskAssignees.length : 0} */}
              </div>

              {/* Danh sách tất cả assignees */}
              {Array.isArray(localTaskData.taskAssignees) && localTaskData.taskAssignees.length > 0 ? (
                localTaskData.taskAssignees.map((a, idx) => {
                  const isCurrentUser = String(myProjectMemberId) === String(a.projectMemberId)
                  const isLeader = isUserLeader
                  console.log(
                    'DEBUG: myProjectMemberId =',
                    myProjectMemberId,
                    '| assignee.projectMemberId =',
                    a.projectMemberId,
                    '| isCurrentUser =',
                    isCurrentUser,
                    '| isLeader =',
                    isLeader
                  )
                  const leaveLoading = leaveLoadingMap[a.projectMemberId] || false
                  return (
                    <div
                      key={a.projectMemberId || idx}
                      className='flex flex-col sm:flex-row sm:items-center justify-between p-2 border-b last:border-b-0 bg-gray-50 rounded-lg gap-2'
                    >
                      <div className='flex items-center gap-2 min-w-0 flex-1'>
                        <Avatar className='w-8 h-8 lg:w-10 lg:h-10 border border-gray-200 shadow flex-shrink-0'>
                          <AvatarImage src={a.avatar} alt={a.executor} />
                          <AvatarFallback>{a.executor?.[0] || '?'}</AvatarFallback>
                        </Avatar>
                        <div className='flex flex-col min-w-0 flex-1'>
                          <span className='font-semibold text-gray-800 text-xs lg:text-sm truncate'>{a.executor}</span>
                          <span className='text-xs text-gray-500 truncate'>{a.role}</span>
                        </div>
                      </div>
                      {/* Action buttons - hiển thị icon thay vì nút */}
                      <div className='flex items-center gap-1 flex-shrink-0'>
                        {/* Leave task - chỉ hiển thị cho assignee hiện tại */}
                        {isCurrentUser && (
                          <button
                            onClick={() => {
                              setSelectedAssignee(a.projectMemberId)
                              setShowLeaveConfirm(true)
                            }}
                            disabled={leaveLoading}
                            title='Rời khỏi task'
                            className='p-1 rounded-full hover:bg-orange-50 hover:text-orange-600 text-gray-400 transition-all duration-200 hover:scale-110'
                          >
                            {leaveLoading ? (
                              <Loader2 className='w-3 h-3 animate-spin' />
                            ) : (
                              <LogOut className='w-3 h-3' />
                            )}
                          </button>
                        )}

                        {/* Remove assignee - chỉ hiển thị cho leader và không phải chính mình */}
                        {isLeader && !isCurrentUser && (
                          <button
                            onClick={() => {
                              setSelectedAssignee(a.projectMemberId)
                              setShowRemoveConfirm(true)
                            }}
                            disabled={removeLoadingMap[a.projectMemberId] || false}
                            title='Xóa assignee khỏi task'
                            className='p-1 rounded-full hover:bg-red-50 hover:text-red-600 text-gray-400 transition-all duration-200 hover:scale-110'
                          >
                            {removeLoadingMap[a.projectMemberId] ? (
                              <Loader2 className='w-3 h-3 animate-spin' />
                            ) : (
                              <X className='w-3 h-3' />
                            )}
                          </button>
                        )}
                      </div>
                    </div>
                  )
                })
              ) : (
                <span className='text-gray-400 italic text-sm'>Chưa có assignee</span>
              )}
              {/* Dropdown chọn assignee (nếu là leader) */}
              {isUserLeader && (
                <div className='mt-3 p-2 bg-blue-50 rounded-lg border border-blue-200'>
                  <div className='text-xs font-medium text-blue-800 mb-2'>Assign new member</div>
                  <Select
                    onValueChange={async (memberId) => {
                      await handleAssignMember(memberId)
                      setTimeout(() => {
                        onTaskUpdated()
                      }, 500)
                    }}
                    value={assignee ? ('id' in assignee ? assignee.id : assignee.userId) || '' : ''}
                    disabled={!user?.id}
                  >
                    <SelectTrigger
                      className={cn(
                        'flex items-center gap-2 px-2 py-1 text-gray-600 rounded-lg border hover:bg-gray-50 text-sm',
                        'focus:ring-0 focus:ring-offset-0 h-auto',
                        '[&>span]:flex [&>span]:items-center [&>span]:gap-2 [&>span]:m-0 [&>span]:p-0',
                        '[&>svg]:hidden',
                        !canAssignTask && 'opacity-50 cursor-not-allowed'
                      )}
                    >
                      <SelectValue
                        placeholder={
                          <div className='flex items-center gap-2 text-gray-500 text-sm'>
                            <UserPlus className='h-3 w-3' />
                            <span>Assign member</span>
                          </div>
                        }
                      >
                        {assignee ? (
                          <div style={{ display: 'flex', alignItems: 'center' }}>
                            <img
                              src={assignee.avatar}
                              alt={assignee.fullName}
                              style={{ width: 20, height: 20, borderRadius: '50%', marginRight: 6 }}
                            />
                            <span className='text-sm'>{assignee.fullName}</span>
                          </div>
                        ) : (
                          <span className='text-sm'>Assign member</span>
                        )}
                      </SelectValue>
                    </SelectTrigger>
                    {user?.id && (
                      <SelectContent className='p-0' position='popper'>
                        {projectMembers.map((member) => {
                          const memberId = ('id' in member ? member.id : member.userId) || ''
                          const displayName =
                            member.fullName?.trim() ||
                            member.email?.trim() ||
                            (memberId ? memberId.slice(0, 6) : 'Unknown')
                          const avatarChar = (
                            member.fullName?.[0] ||
                            member.email?.[0] ||
                            memberId?.[0] ||
                            '?'
                          ).toUpperCase()
                          return (
                            <SelectItem
                              key={memberId}
                              value={memberId}
                              className='focus:bg-gray-100 focus:text-gray-900 py-1.5 px-2'
                            >
                              <div className='flex items-center pl-4 gap-2'>
                                <Avatar className='w-6 h-6'>
                                  <AvatarImage src={member.avatar} alt={displayName} />
                                  <AvatarFallback className='text-xs'>{avatarChar}</AvatarFallback>
                                </Avatar>
                                <span className='text-sm'>{displayName}</span>
                              </div>
                            </SelectItem>
                          )
                        })}
                      </SelectContent>
                    )}
                  </Select>
                </div>
              )}
            </div>
          </div>

          {/* Tags Section - Cột phải */}
          <div>
            <h1 className='text-sm font-semibold mb-2 flex items-center gap-2'>
              Tags
              <button
                type='button'
                className='ml-1 p-1 rounded-full hover:bg-gray-100 text-gray-500 hover:text-gray-700 transition'
                onClick={() => setIsTagManagerOpen(true)}
                title='Manage tags'
              >
                <Settings className='w-3 h-3' />
              </button>
            </h1>
            <div className='p-3 bg-white rounded-lg shadow-sm border'>
              <div className='flex items-center gap-2 flex-wrap'>
                {(task.tags || []).map((tag, idx) => (
                  <span
                    key={tag.id || idx}
                    style={{
                      backgroundColor: tag.color || '#eee',
                      color: '#fff',
                      borderRadius: '6px',
                      padding: '4px 12px',
                      fontWeight: 500,
                      fontSize: '0.875em',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px'
                    }}
                  >
                    {tag.name}
                  </span>
                ))}
                <div
                  className='flex items-center gap-1 cursor-pointer relative group'
                  ref={tagDropdownRef}
                  onClick={() => setIsTagSelectOpen((v) => !v)}
                  tabIndex={0}
                  role='button'
                  aria-label='Add tag'
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') setIsTagSelectOpen((v) => !v)
                  }}
                >
                  <Button
                    variant='ghost'
                    size='icon'
                    className='h-5 w-5 rounded-lg bg-lavender-200 group-hover:bg-lavender-300/60 transition-colors duration-150 pointer-events-none'
                    aria-label='Add tag icon'
                  >
                    <Plus className='h-3 w-3 text-lavender-500 group-hover:text-lavender-800 transition-colors duration-150' />
                  </Button>
                  <span className='font-medium text-lavender-500 group-hover:text-lavender-800 transition-colors duration-150 text-sm'>
                    Add
                  </span>
                  {isTagSelectOpen && (
                    <div className='absolute left-0 top-10 z-[9993] bg-white border rounded shadow-lg min-w-[180px] max-h-48 overflow-y-auto'>
                      {tags.filter((t) => !(task.tags || []).some((tag) => tag.id === t.id || tag.name === t.name))
                        .length === 0 ? (
                        <div className='px-3 py-1.5 text-gray-400 text-xs'>No tags available</div>
                      ) : (
                        tags
                          .filter((t) => !(task.tags || []).some((tag) => tag.id === t.id || tag.name === t.name))
                          .map((tag) => (
                            <button
                              key={tag.id}
                              className='w-full text-left px-3 py-1.5 hover:bg-lavender-50 text-xs font-medium flex items-center gap-2'
                              onClick={async () => {
                                await handleTagSelect(tag.id)
                                setIsTagSelectOpen(false)
                              }}
                            >
                              <span
                                className='px-2 py-0.5 rounded-full text-white font-medium text-xs'
                                style={{ backgroundColor: tag.color || '#eee' }}
                              >
                                {tag.name}
                              </span>
                            </button>
                          ))
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
            <ProjectTagManager
              isOpen={isTagManagerOpen}
              onClose={() => setIsTagManagerOpen(false)}
              onTagUpdated={() => {
                // Khi tag được cập nhật, refresh task data để hiển thị tên tag mới
                if (currentProject) {
                  taskApi.getTasksFromProject(currentProject.id).then((tasks) => {
                    const updatedTask = tasks.find((t) => t.id === task.id)
                    if (updatedTask) {
                      // Task tags updated
                      // Thông báo cho component cha biết task đã được cập nhật
                      onTaskUpdated && onTaskUpdated()
                    }
                  })
                }
              }}
            />
          </div>
        </div>

        {/* Activity Section */}
        <div>
          <div className='flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4'>
            <div className='flex items-center gap-2'>
              <MessageCircle className='h-5 w-5' />
              <h1 className='text-xl sm:text-2xl font-semibold'>Activity</h1>
            </div>
            <div className='flex flex-wrap items-center gap-2'>
              <div className='flex items-center gap-2'>
                <span className='text-gray-500 text-sm'>Show:</span>
                <button className='flex items-center gap-2 px-2 sm:px-3 py-1.5 text-gray-600 rounded-lg border hover:bg-gray-50 font-medium text-sm'>
                  <Filter className='h-4 w-4' />
                  <span className='hidden sm:inline'>All</span>
                </button>
              </div>
              <button className='flex items-center gap-2 px-2 sm:px-3 py-1.5 text-gray-600 rounded-lg border hover:bg-gray-50 font-medium text-sm'>
                <Eye className='h-4 w-4' />
                <span className='hidden sm:inline'>Hide Details</span>
              </button>
              <button className='flex items-center gap-2 px-2 sm:px-3 py-1.5 text-gray-600 rounded-lg border hover:bg-gray-50 font-medium text-sm'>
                <Calendar className='h-4 w-4' />
                <span className='hidden sm:inline'>Today</span>
              </button>
            </div>
          </div>

          {/* Comment Input */}
          <div className='flex flex-col sm:flex-row gap-3 mb-6'>
            <div className='flex items-center gap-3'>
              <Avatar>
                <AvatarImage
                  src={user?.avatar}
                  alt={user?.fullName || user?.username || user?.email || user?.id || 'Unknown'}
                />
                <AvatarFallback>
                  {(
                    user?.fullName?.[0] ||
                    user?.username?.[0] ||
                    user?.email?.[0] ||
                    user?.id?.[0] ||
                    '?'
                  ).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <input
                type='text'
                placeholder='Write a comment...'
                className='flex-1 px-3 sm:px-4 py-2 focus-visible:ring-0 focus-visible:ring-offset-0 focus:outline-none rounded-lg border border-gray-200 font-medium text-sm'
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                disabled={isCommentLoading}
              />
            </div>
            <div className='flex flex-col sm:flex-row gap-2 sm:gap-3'>
              <input
                type='file'
                multiple
                onChange={handleCommentFileChange}
                className='block text-sm text-gray-500 font-medium file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-lavender-100 file:text-lavender-700 hover:file:bg-lavender-200 file:transition-colors file:duration-150 file:cursor-pointer'
                disabled={isCommentLoading}
              />
              <Button
                onClick={async () => {
                  await handleAddComment()
                  await fetchComments()
                }}
                disabled={isCommentLoading || !comment.trim()}
                className='px-4 py-2 bg-lavender-500 text-white hover:bg-lavender-700 font-semibold text-sm'
              >
                {isCommentLoading ? 'Sending...' : 'Send'}
              </Button>
            </div>
          </div>

          {/* Comments List */}
          <div className='space-y-2'>
            {comments.length === 0 ? (
              <div className='text-center text-gray-500 py-4 font-medium'>No activity yet</div>
            ) : (
              comments.map((c, idx) => (
                <div key={`${c.commenter}-${c.lastUpdate}-${idx}`} className='flex items-start gap-2'>
                  <Avatar>
                    <AvatarImage src={c.avatar} alt={c.commenter || 'Unknown'} />
                    <AvatarFallback>{(c.commenter?.[0] || '?').toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <div className='flex-1'>
                    <div className='flex items-center gap-2'>
                      <div className='font-medium'>{c.commenter}</div>
                      {c.lastUpdate && (
                        <span className='text-xs text-gray-400'>
                          {formatDistanceToNow(new Date(c.lastUpdate), { addSuffix: true })}
                        </span>
                      )}
                    </div>
                    <div className='text-gray-700 mb-1 font-medium'>{c.content}</div>
                    {Array.isArray(c.attachmentUrls) && c.attachmentUrls.length > 0 && (
                      <div className='flex flex-wrap gap-2 mb-1'>
                        {c.attachmentUrls.map((url: string, i: number) => {
                          if (url.match(/\.(jpg|jpeg|png|gif)$/i)) {
                            return (
                              <img
                                key={url || i}
                                src={url}
                                alt={`attachment-${i}`}
                                className='w-24 h-24 object-cover rounded border'
                              />
                            )
                          } else if (url.match(/\.pdf$/i)) {
                            return (
                              <div key={url || i} className='w-48 h-64 border rounded overflow-hidden'>
                                <iframe src={url} title={`pdf-${i}`} className='w-full h-full' />
                                <a
                                  href={url}
                                  target='_blank'
                                  rel='noopener noreferrer'
                                  className='block text-blue-600 underline text-center mt-1 font-medium'
                                >
                                  View PDF
                                </a>
                              </div>
                            )
                          } else {
                            return (
                              <a
                                key={url || i}
                                href={url}
                                target='_blank'
                                rel='noopener noreferrer'
                                className='text-blue-600 underline flex items-center gap-1 font-medium'
                              >
                                📎 File {i + 1}
                              </a>
                            )
                          }
                        })}
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </DialogContent>

      {/* Leave Task Confirmation Dialog */}
      <Dialog open={showLeaveConfirm} onOpenChange={setShowLeaveConfirm}>
        <DialogContent className='max-w-md'>
          <DialogTitle>Xác nhận rời task</DialogTitle>
          <DialogDescription>
            Bạn có chắc chắn muốn rời khỏi task này? Hành động này sẽ gỡ bỏ bạn khỏi danh sách assignee.
          </DialogDescription>
          <div className='flex justify-end gap-2 mt-4'>
            <Button
              variant='outline'
              onClick={() => {
                setShowLeaveConfirm(false)
                setSelectedAssignee(null)
              }}
            >
              Hủy
            </Button>
            <Button
              variant='destructive'
              onClick={() => selectedAssignee && handleLeaveTask(selectedAssignee)}
              disabled={selectedAssignee ? leaveLoadingMap[selectedAssignee] : false}
            >
              {selectedAssignee && leaveLoadingMap[selectedAssignee] ? 'Đang xử lý...' : 'Rời task'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Remove Assignee Confirmation Dialog */}
      <Dialog open={showRemoveConfirm} onOpenChange={setShowRemoveConfirm}>
        <DialogContent className='max-w-md'>
          <DialogTitle>Xác nhận xóa assignee</DialogTitle>
          <DialogDescription>
            Bạn có chắc chắn muốn xóa assignee này khỏi task? Hành động này sẽ gỡ bỏ họ khỏi danh sách assignee.
          </DialogDescription>
          <div className='flex justify-end gap-2 mt-4'>
            <Button
              variant='outline'
              onClick={() => {
                setShowRemoveConfirm(false)
                setSelectedAssignee(null)
              }}
            >
              Hủy
            </Button>
            <Button
              variant='destructive'
              onClick={() => selectedAssignee && handleRemoveAssignee(selectedAssignee)}
              disabled={selectedAssignee ? removeLoadingMap[selectedAssignee] : false}
            >
              {selectedAssignee && removeLoadingMap[selectedAssignee] ? 'Đang xử lý...' : 'Xóa assignee'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </Dialog>
  )
}
