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
  ListTodo,
  Loader2,
  LogOut,
  MessageCircle,
  Paperclip,
  Pencil,
  Plus,
  Settings,
  Tag,
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
  // Separate effort points input for the "assign member" section so it doesn't
  // interfere with the main editEffortPoints field. It uses the same
  // validation logic but maintains independent state and error.
  const [assignEffortPoints, setAssignEffortPoints] = useState<string>('')
  const [assignEffortPointsError, setAssignEffortPointsError] = useState<string>('')
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
  // Keep a short-lived map of recent optimistic assignments to prevent transient
  // server-side zeros from overwriting the UI immediately after assign.
  const [recentAssignments, setRecentAssignments] = useState<Record<string, { points: number; ts: number }>>({})

  const getPriorityChevron = (priority: number) => {
    switch (priority) {
      case 1:
        return (
          <div className='flex flex-col'>
            <ChevronsDown className='h-4 w-4 text-blue-500' />
          </div>
        )
      case 2:
        // Use a single chevron for Medium to keep a logical progression
        return <ChevronDown className='h-4 w-4 text-orange-400' />
      case 3:
        return <ChevronUp className='h-4 w-4 text-red-500' />
      case 4:
        return (
          <div className='flex flex-col'>
            <ChevronsUp className='h-4 w-4 text-red-600' />
          </div>
        )
      default:
        return <ChevronDown className='h-4 w-4 text-gray-400' />
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
  }, [isOpen, currentProject?.id, task.id, currentProject])

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
  const handleAssignMember = async (memberId: string, assignedEffortPoints?: number | null) => {
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
      const points =
        assignedEffortPoints !== undefined && assignedEffortPoints !== null ? Number(assignedEffortPoints) : undefined
      await taskApi.assignTask(currentProject!.id, task.id, implementerId, points ?? null)
      console.log('✅ API call successful')

      // Optimistic UI update: immediately reflect assigned effort points so the user sees it
      try {
        setLocalTaskData((prev) => {
          if (!prev) return prev
          const prevAssignees = Array.isArray(prev.taskAssignees) ? prev.taskAssignees.slice() : []

          const updatedAssignees = (() => {
            const foundIndex = prevAssignees.findIndex((x) => x.projectMemberId === implementerId)
            if (foundIndex !== -1) {
              // Update existing assignee's assignedEffortPoints
              type AssigneeWithPoints = { assignedEffortPoints?: number | null }
              const prevAssigned = (prevAssignees[foundIndex] as AssigneeWithPoints).assignedEffortPoints
              const a = {
                ...prevAssignees[foundIndex],
                assignedEffortPoints: points ?? prevAssigned
              }
              const copy = prevAssignees.slice()
              copy[foundIndex] = a
              return copy
            }
            // If not found, add a minimal assignee entry so UI shows points immediately
            const newAssignee = {
              projectMemberId: implementerId,
              executor: member?.fullName || member?.email || implementerId,
              avatar: member?.avatar || '',
              role: member?.role || 'Member',
              assignedEffortPoints: points ?? null
            }
            return [...prevAssignees, newAssignee]
          })()

          return { ...prev, taskAssignees: updatedAssignees }
        })
        // Remember this optimistic assignment briefly so we can prefer it over
        // a transient server 0 that might arrive in the next immediate refresh.
        if (typeof points === 'number') {
          setRecentAssignments((prev) => ({ ...prev, [implementerId]: { points: points!, ts: Date.now() } }))
          // Auto-clear after 3s
          setTimeout(() => {
            setRecentAssignments((prev) => {
              const copy = { ...prev }
              delete copy[implementerId]
              return copy
            })
          }, 3000)
        }
      } catch (e) {
        console.warn('Optimistic UI update failed:', e)
      }

      // 2. Force reload toàn bộ dialog data từ server
      console.log('🔄 Force reloading all dialog data...')

      // Refresh task data từ server
      const updatedTasks = await taskApi.getTasksFromProject(currentProject!.id)
      const updatedTask = updatedTasks?.find((t) => t.id === task.id)
      console.log('📋 Updated task data:', updatedTask)

      if (updatedTask) {
        // Merge server response with optimistic local data so we don't overwrite
        // recently-set assignedEffortPoints with a transient server value.
        setLocalTaskData((prev) => {
          // If no previous local data, just use server task
          if (!prev) return updatedTask

          // Define a richer assignee type that matches our UI usage
          type AssigneeFull = {
            projectMemberId: string
            executor: string
            avatar: string
            role: string
            assignedEffortPoints?: number | null
          }

          // Build a map of previous assignedEffortPoints by projectMemberId
          const prevMap: Record<string, number | null | undefined> = {}
          ;((prev.taskAssignees || []) as AssigneeFull[]).forEach((pa) => {
            prevMap[pa.projectMemberId] = pa.assignedEffortPoints
          })

          const mergedAssignees = ((updatedTask.taskAssignees || []) as AssigneeFull[]).map((sa) => {
            const serverVal = sa.assignedEffortPoints
            const prevVal = prevMap[sa.projectMemberId]

            // If we just assigned points to this implementer, prefer that optimistic value
            // to avoid temporary server-side zeroes overwriting the UI.
            if (sa.projectMemberId === implementerId && typeof points === 'number') {
              return { ...sa, assignedEffortPoints: points }
            }

            // If we have a recent optimistic assignment recorded and the server
            // value is 0 (or missing) within a short window, prefer the
            // optimistic value.
            const recent = recentAssignments[sa.projectMemberId]
            if (
              recent &&
              Date.now() - recent.ts < 3000 &&
              (serverVal === 0 || serverVal === null || serverVal === undefined)
            ) {
              return { ...sa, assignedEffortPoints: recent.points }
            }

            let assignedEffortPoints: number | null

            // If server didn't provide a value, fall back to previous optimistic value
            if (serverVal === null || serverVal === undefined) {
              assignedEffortPoints = typeof prevVal === 'number' ? prevVal : (serverVal ?? null)
            } else if (typeof serverVal === 'number') {
              // Server provided a number (could be 0). Prefer server unless we have a
              // previous optimistic value that is different and appears more accurate
              // (e.g. optimistic assignment > server's transient 0).
              if (typeof prevVal === 'number' && prevVal !== serverVal && prevVal > serverVal) {
                assignedEffortPoints = prevVal
              } else {
                assignedEffortPoints = serverVal
              }
            } else {
              assignedEffortPoints = serverVal ?? null
            }

            return { ...sa, assignedEffortPoints }
          })

          const merged = { ...updatedTask, taskAssignees: mergedAssignees }
          return merged as TaskP
        })

        // Cập nhật task assignees từ server data (keep single-assignee state in sync)
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
      const message = extractBackendErrorMessage(error)
      showToast({ title: 'Error', description: message, variant: 'destructive' })
    }
  }

  // Bulk assign effort points to selected assignees (does not change assignments)
  const [selectedAssigneeIds, setSelectedAssigneeIds] = useState<string[]>([])
  const [bulkEffortPoints, setBulkEffortPoints] = useState<string>('')

  const handleToggleAssigneeSelection = (id: string) => {
    setSelectedAssigneeIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]))
  }

  const validateBulkEffort = (v: string) => {
    if (!v.trim()) return 'Effort is required'
    if (!/^\d+$/.test(v)) return 'Must be a positive integer'
    return ''
  }

  const handleApplyBulkEffort = async () => {
    if (!currentProject) return
    const err = validateBulkEffort(bulkEffortPoints)
    if (err) {
      showToast({ title: 'Error', description: err, variant: 'destructive' })
      return
    }
    if (selectedAssigneeIds.length === 0) {
      showToast({ title: 'Error', description: 'No assignees selected', variant: 'destructive' })
      return
    }

    try {
      const points = Number(bulkEffortPoints)
      const payload = selectedAssigneeIds.map((id) => ({ implementerId: id, assignedEffortPoints: points }))
      await taskApi.bulkAssignEffortPoints(currentProject.id, task.id, payload)
      showToast({ title: 'Success', description: 'Effort points applied to selected assignees', variant: 'success' })
      // Refresh data
      await reloadDialogData()
      onTaskUpdated()
      setSelectedAssigneeIds([])
      setBulkEffortPoints('')
    } catch (error) {
      const errorMessage = extractBackendErrorMessage(error)
      showToast({ title: 'Error', description: errorMessage, variant: 'destructive' })
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
        if (onTaskUpdated) onTaskUpdated()
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
        if (onTaskUpdated) onTaskUpdated()
      } catch {
        /* empty */
      }
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [task])

  // Update edit fields when localTaskData changes (for real-time updates)
  useEffect(() => {
    setEditTitle(localTaskData.title)
    setEditDescription(localTaskData.description)
    setEditPriority(normalizePriority(localTaskData.priority))
    setEditDeadline(localTaskData.deadline ? localTaskData.deadline.split('T')[0] : '')
    setEditEffortPoints(localTaskData.effortPoints?.toString() || '')
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

  // Handle assign-section effort points change with same validation but
  // independent state so editing it won't change the main editEffortPoints.
  const handleAssignEffortPointsChange = (value: string) => {
    setAssignEffortPoints(value)
    const error = validateEffortPoints(value)
    setAssignEffortPointsError(error)
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
      if (onTaskUpdated) onTaskUpdated()
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

  // Compute avatar to display in comment input: prefer auth user avatar, fallback to project member avatar
  const currentUserAvatar =
    user?.avatar ||
    myProjectMember?.avatar ||
    projectMembers.find((m) => m.userId === user?.id || (m.id || m.userId) === user?.id)?.avatar

  const currentUserInitial = (
    (user?.fullName && user.fullName[0]) ||
    (user?.username && user.username[0]) ||
    (user?.email && user.email[0]) ||
    (user?.id && String(user.id)[0]) ||
    myProjectMember?.fullName?.[0] ||
    myProjectMember?.email?.[0] ||
    '?'
  ).toUpperCase()

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
        <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2'>
          <span className='text-lg font-bold text-gray-900'>Task Details</span>
          <button
            onClick={onClose}
            className='text-gray-400 hover:text-gray-600 self-end sm:self-auto p-2 rounded-lg hover:bg-gray-100 transition-colors duration-200'
          >
            <X className='h-5 w-5' />
          </button>
        </div>

        {/* Completion Banner - Show when task is completed */}
        {(localTaskData.status === 'done' || localTaskData.status === 'completed') && (
          <div className='mb-2 p-2 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg shadow-sm'>
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
        <div className='mb-4'>
          <div className='flex items-center gap-3 mb-3'>
            <span className='text-sm font-medium text-gray-600 uppercase tracking-wide'>Board</span>
            <span className='text-gray-900 cursor-pointer hover:underline font-medium text-sm'>
              {localTaskData.status}
            </span>
            {/* Completion Status Indicator */}
            {(localTaskData.status === 'done' || localTaskData.status === 'completed') && (
              <div className='flex items-center gap-2 px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium'>
                <Check className='h-4 w-4' />
                <span>Completed</span>
              </div>
            )}
          </div>
          <div className='flex flex-col sm:flex-row sm:items-center gap-4'>
            <div className='flex items-center gap-3 flex-1'>
              <ListTodo className='h-5 w-5 text-gray-600 flex-shrink-0' />
              <div className='relative flex-grow'>
                {isEditingTitle ? (
                  <Input
                    className='text-xl font-bold pr-10 w-full border-gray-300 focus:border-lavender-500 focus:ring-lavender-500'
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    onBlur={() => setIsEditingTitle(false)}
                    autoFocus
                    disabled={isUpdating}
                  />
                ) : (
                  <div
                    className='text-xl font-bold pr-10 w-full flex items-center group cursor-pointer rounded-lg hover:bg-gray-50 transition-colors duration-200 px-3 py-2'
                    onClick={() => setIsEditingTitle(true)}
                  >
                    <span className='flex-1 truncate text-gray-900'>{editTitle}</span>
                    <Pencil className='h-4 w-4 ml-2 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity duration-200' />
                  </div>
                )}
              </div>
            </div>
            <div className='flex items-center gap-3 flex-shrink-0'>
              <div className='relative' ref={priorityDropdownRef}>
                <button
                  type='button'
                  className='w-32 flex items-center justify-between border border-gray-300 rounded-lg px-3 py-2 text-center bg-white font-medium text-gray-700 hover:bg-gray-50 transition-colors duration-200 shadow-sm focus:outline-none focus:ring-2 focus:ring-lavender-500 focus:border-lavender-500'
                  onClick={() => setIsPrioritySelectOpen((v) => !v)}
                  disabled={isUpdating}
                  aria-label='Priority'
                >
                  <span className='flex items-center gap-2 whitespace-nowrap text-sm'>
                    {getPriorityChevron(editPriority as number)}
                    <span>{PRIORITY_MAP[editPriority as number] || 'Set Priority'}</span>
                  </span>
                  <ChevronDown className='h-4 w-4 ml-1 text-gray-400' />
                </button>
                {isPrioritySelectOpen && (
                  <div className='absolute left-0 top-12 z-[9993] bg-white border border-gray-200 rounded-lg shadow-lg min-w-[140px] max-h-48 overflow-y-auto animate-fade-in'>
                    {[1, 2, 3, 4].map((priority) => (
                      <button
                        key={priority}
                        className='w-full flex items-center gap-3 px-4 py-2.5 text-left text-sm font-medium hover:bg-gray-50 transition-colors duration-200 text-gray-700'
                        onClick={() => {
                          setEditPriority(priority)
                          setIsPrioritySelectOpen(false)
                        }}
                        disabled={isUpdating}
                      >
                        {getPriorityChevron(priority)}
                        <span>{PRIORITY_MAP[priority]}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
          <div className='flex flex-col sm:flex-row gap-4 mt-4'>
            <div className='flex items-center gap-3'>
              <Calendar className='h-4 w-4 text-gray-500 flex-shrink-0' />
              <span className='text-sm font-medium text-gray-700'>Deadline:</span>
              <input
                type='date'
                className='border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-lavender-500 focus:border-lavender-500'
                value={editDeadline}
                onChange={(e) => setEditDeadline(e.target.value)}
                disabled={isUpdating}
              />
              {localTaskData.deadline && !editDeadline && (
                <button
                  type='button'
                  onClick={() => setEditDeadline(localTaskData.deadline ? localTaskData.deadline.split('T')[0] : '')}
                  className='text-sm text-lavender-600 hover:text-lavender-800 underline font-medium'
                >
                  revert
                </button>
              )}
              {editDeadline && (
                <button
                  type='button'
                  onClick={() => setEditDeadline('')}
                  className='text-sm text-red-600 hover:text-red-800 underline font-medium'
                >
                  clear
                </button>
              )}
            </div>
            <div className='flex items-center gap-3'>
              <span className='text-sm font-medium text-gray-700'>Effort Points:</span>
              <div className='relative'>
                <input
                  type='text'
                  className={`border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-lavender-500 focus:border-lavender-500 w-24 ${
                    effortPointsError ? 'border-red-500 focus:ring-red-400' : 'border-gray-300'
                  }`}
                  value={editEffortPoints}
                  onChange={(e) => handleEffortPointsChange(e.target.value)}
                  onBlur={handleEffortPointsBlur}
                  placeholder='0'
                  disabled={isUpdating}
                />
                {effortPointsError && (
                  <div className='absolute top-full left-0 mt-2 text-sm text-red-600 bg-white border border-red-200 rounded-lg px-3 py-2 shadow-sm z-10'>
                    {effortPointsError}
                  </div>
                )}
              </div>
              {localTaskData.effortPoints !== null && localTaskData.effortPoints !== undefined && !editEffortPoints && (
                <button
                  type='button'
                  onClick={() => setEditEffortPoints(localTaskData.effortPoints?.toString() || '')}
                  className='text-sm text-lavender-600 hover:text-lavender-800 underline font-medium'
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
                  className='text-sm text-red-600 hover:text-red-800 underline font-medium'
                >
                  clear
                </button>
              )}
            </div>
          </div>
          <div className='mt-4 text-gray-700'>
            <div className='relative'>
              {isEditingDescription ? (
                <textarea
                  className='w-full border border-gray-300 rounded-lg p-3 pr-12 font-medium text-sm focus:outline-none focus:ring-2 focus:ring-lavender-500 focus:border-lavender-500 resize-none'
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  onBlur={() => setIsEditingDescription(false)}
                  autoFocus
                  disabled={isUpdating}
                  rows={3}
                />
              ) : (
                <div className='w-full min-h-[80px] flex items-start rounded-lg px-3 py-3 bg-gray-50 border border-gray-200 hover:border-gray-300 transition-colors duration-200'>
                  <span
                    className={`flex-1 text-sm leading-relaxed ${
                      !editDescription ? 'text-gray-400 italic' : 'text-gray-900'
                    } font-medium`}
                  >
                    {editDescription || 'No detailed description for this task.'}
                  </span>
                  <Button
                    variant='ghost'
                    size='icon'
                    className='ml-3 text-gray-400 hover:text-gray-600 h-8 w-8 hover:bg-gray-100 transition-colors duration-200'
                    onClick={() => setIsEditingDescription(true)}
                  >
                    <Pencil className='h-4 w-4' />
                  </Button>
                </div>
              )}
            </div>
          </div>
          <div className='flex justify-between items-center mt-4'>
            <div className='flex gap-2'>
              <Button
                variant='outline'
                onClick={handleAttach}
                disabled={isUpdating}
                className='flex items-center gap-2 px-4 py-2.5 text-gray-700 rounded-lg border border-gray-300 hover:bg-gray-50 hover:border-gray-400 transition-all duration-200 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed'
              >
                {isUpdating ? <Loader2 className='h-4 w-4 animate-spin' /> : <Paperclip className='h-4 w-4' />}
                <span>{isUpdating ? 'Attaching...' : 'Attach Files'}</span>
              </Button>

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
              className='px-6 py-2.5 bg-lavender-600 hover:bg-lavender-700 text-white font-semibold border-0 text-sm rounded-lg shadow-sm hover:shadow-md transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed'
            >
              {isUpdating ? (
                <>
                  <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                  Saving...
                </>
              ) : (
                'Save Changes'
              )}
            </Button>
          </div>
        </div>

        {/* Attachments */}
        {allAttachmentUrls.length > 0 && (
          <div className='mt-2'>
            <div className='font-semibold mb-1 text-sm'>Attachments:</div>
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
          <div className='mt-2 p-2 bg-green-50 border border-green-200 rounded-lg'>
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

        {/* Assignee and Tags - Layout responsive */}
        <div className='grid grid-cols-1 xl:grid-cols-2 gap-2 lg:gap-3 mb-3'>
          {/* Assignee Section - Cột trái */}
          <div>
            <h2 className='text-base font-bold mb-3 flex items-center gap-2 text-gray-900 min-h-[2rem]'>
              <UserPlus className='h-4 w-4 text-lavender-600' />
              Team Members
            </h2>
            <div className='p-3 bg-white rounded-lg shadow-sm border border-gray-200 min-h-[200px] flex flex-col overflow-hidden'>
              {/* Current Assignees */}
              {Array.isArray(localTaskData.taskAssignees) && localTaskData.taskAssignees.length > 0 ? (
                <div className='divide-y divide-lavender-100 flex-1'>
                  {localTaskData.taskAssignees.map((a, idx) => {
                    const isCurrentUser = String(myProjectMemberId) === String(a.projectMemberId)
                    const isLeader = isUserLeader
                    const leaveLoading = leaveLoadingMap[a.projectMemberId] || false

                    return (
                      <div
                        key={a.projectMemberId || idx}
                        className='p-4 hover:bg-gray-50/30 transition-colors duration-150'
                      >
                        <div className='flex items-center justify-between'>
                          <div className='flex items-center gap-3 flex-1 min-w-0'>
                            <div className='relative'>
                              <Avatar className='w-10 h-10 border-2 border-white shadow-sm'>
                                <AvatarImage src={a.avatar} alt={a.executor} />
                                <AvatarFallback className='bg-gradient-to-br from-lavender-500 to-purple-600 text-white font-semibold text-sm'>
                                  {a.executor?.[0]?.toUpperCase() || '?'}
                                </AvatarFallback>
                              </Avatar>
                              {isCurrentUser && (
                                <div className='absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-2 border-white rounded-full'></div>
                              )}
                            </div>
                            <div className='flex flex-col min-w-0 flex-1'>
                              <div className='flex items-center gap-2'>
                                <span className='font-semibold text-gray-900 text-sm truncate'>{a.executor}</span>
                                {isCurrentUser && (
                                  <span className='text-xs bg-gray-100 text-gray-700 px-2 py-0.5 rounded-full font-medium'>
                                    You
                                  </span>
                                )}
                              </div>
                              <div className='flex items-center gap-2 mt-1'>
                                <span className='text-xs text-gray-600 bg-gray-100 px-2 py-0.5 rounded-md font-medium'>
                                  {a.role}
                                </span>
                                <span className='text-xs text-gray-400'>•</span>
                                <span className='text-xs text-gray-500'>Assigned</span>
                                {/* Show assigned effort points if available */}
                                {(() => {
                                  const assignedPoints = (a as { assignedEffortPoints?: number }).assignedEffortPoints
                                  const display =
                                    typeof assignedPoints === 'number' && assignedPoints >= 0
                                      ? `${assignedPoints} pts`
                                      : '0 pts'
                                  return (
                                    <span className='ml-2 text-xs bg-gray-50 text-gray-700 px-2 py-0.5 rounded-md font-semibold'>
                                      {display}
                                    </span>
                                  )
                                })()}
                              </div>
                            </div>
                          </div>

                          {/* Action buttons */}
                          <div className='flex items-center gap-1 flex-shrink-0'>
                            {isCurrentUser && (
                              <button
                                onClick={() => {
                                  setSelectedAssignee(a.projectMemberId)
                                  setShowLeaveConfirm(true)
                                }}
                                disabled={leaveLoading}
                                title='Leave task'
                                className='p-2 text-gray-400 hover:text-orange-500 hover:bg-orange-50 rounded-lg transition-all duration-200 group'
                              >
                                {leaveLoading ? (
                                  <Loader2 className='w-4 h-4 animate-spin' />
                                ) : (
                                  <LogOut className='w-4 h-4 group-hover:scale-110 transition-transform duration-200' />
                                )}
                              </button>
                            )}

                            {isLeader && !isCurrentUser && (
                              <button
                                onClick={() => {
                                  setSelectedAssignee(a.projectMemberId)
                                  setShowRemoveConfirm(true)
                                }}
                                disabled={removeLoadingMap[a.projectMemberId] || false}
                                title='Remove assignee'
                                className='p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all duration-200 group'
                              >
                                {removeLoadingMap[a.projectMemberId] ? (
                                  <Loader2 className='w-4 h-4 animate-spin' />
                                ) : (
                                  <X className='w-4 h-4 group-hover:scale-110 transition-transform duration-200' />
                                )}
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <div className='p-3 text-center flex-1 flex flex-col justify-center items-center gap-2'>
                  <div className='w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center'>
                    <UserPlus className='w-5 h-5 text-gray-500' />
                  </div>
                  <h3 className='text-sm font-semibold text-gray-900 mb-0'>No team members assigned</h3>
                  <p className='text-xs text-gray-500'>Assign someone to start collaborating on this task</p>
                </div>
              )}

              {/* Assign new member section */}
              {isUserLeader && (
                <div className='border-t border-gray-200 p-4 bg-gray-50/30'>
                  <div className='mb-3'>
                    <span className='text-sm font-semibold text-gray-900'>Add Team Member</span>
                  </div>
                  <div className='flex gap-2 items-center'>
                    <div className='flex-1'>
                      <Select
                        onValueChange={async (memberId) => {
                          // When selecting a member, call assign with optional effort if provided
                          // Use the assign-specific input (`assignEffortPoints`) instead of the main edit field
                          const points = assignEffortPoints.trim() ? Number(assignEffortPoints) : null
                          await handleAssignMember(memberId, points)
                          // Clear the assign input and any error after assigning
                          setAssignEffortPoints('')
                          setAssignEffortPointsError('')
                          setTimeout(() => {
                            onTaskUpdated()
                          }, 500)
                        }}
                        value={assignee ? ('id' in assignee ? assignee.id : assignee.userId) || '' : ''}
                        disabled={!user?.id}
                      >
                        <SelectTrigger className='w-full bg-white border-gray-300 hover:border-gray-400 focus:border-lavender-500 focus:ring-lavender-500/20 h-10'>
                          <SelectValue placeholder='Select a team member...'>
                            {assignee ? (
                              <div className='flex items-center gap-3 min-w-0'>
                                <Avatar className='w-6 h-6 flex-shrink-0'>
                                  <AvatarImage src={assignee.avatar} alt={assignee.fullName || 'Member'} />
                                  <AvatarFallback className='text-xs bg-gray-100 text-gray-700'>
                                    {(assignee.fullName || assignee.userId || '?')[0]?.toUpperCase()}
                                  </AvatarFallback>
                                </Avatar>
                                <span className='text-sm truncate'>{assignee.fullName || assignee.userId}</span>
                              </div>
                            ) : (
                              'Select a team member...'
                            )}
                          </SelectValue>
                        </SelectTrigger>
                        {user?.id && (
                          <SelectContent className='max-h-48'>
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
                                <SelectItem key={memberId} value={memberId} className='py-2'>
                                  <div className='flex items-center gap-3 min-w-0'>
                                    <Avatar className='w-6 h-6 flex-shrink-0'>
                                      <AvatarImage src={member.avatar} alt={displayName} />
                                      <AvatarFallback className='text-xs bg-gray-100 text-gray-700'>
                                        {avatarChar}
                                      </AvatarFallback>
                                    </Avatar>
                                    <span className='text-sm truncate'>{displayName}</span>
                                  </div>
                                </SelectItem>
                              )
                            })}
                          </SelectContent>
                        )}
                      </Select>
                    </div>

                    {/* Input to provide effort points when assigning (single assign) */}
                    <div className='w-36'>
                      <div className='relative'>
                        <input
                          type='text'
                          className={`w-full rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-lavender-500 focus:border-lavender-500 ${
                            assignEffortPointsError ? 'border-red-500 focus:ring-red-400' : 'border-gray-300'
                          }`}
                          placeholder='Effort pts'
                          value={assignEffortPoints}
                          onChange={(e) => handleAssignEffortPointsChange(e.target.value)}
                          onBlur={() => setAssignEffortPointsError(validateEffortPoints(assignEffortPoints))}
                          disabled={isUpdating}
                        />
                        {assignEffortPointsError && (
                          <div className='absolute left-0 top-full mt-2 text-sm text-red-600 bg-white border border-red-200 rounded-lg px-3 py-2 shadow-sm z-10'>
                            {assignEffortPointsError}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Bulk effort assignment section */}
                  <div className='mt-3 border-t pt-3'>
                    <div className='flex items-center justify-between mb-2'>
                      <div className='text-sm font-medium text-gray-700'>Bulk assign effort points</div>
                      <div className='text-xs text-gray-400'>Select assignees then apply points</div>
                    </div>
                    <div className='flex gap-2 items-center'>
                      <div className='flex-1 max-h-36 overflow-y-auto pr-2'>
                        {localTaskData.taskAssignees && localTaskData.taskAssignees.length > 0 ? (
                          localTaskData.taskAssignees.map((a) => (
                            <label key={a.projectMemberId} className='flex items-center gap-2 text-sm mb-1'>
                              <input
                                type='checkbox'
                                checked={selectedAssigneeIds.includes(a.projectMemberId)}
                                onChange={() => handleToggleAssigneeSelection(a.projectMemberId)}
                                className='form-checkbox h-4 w-4 text-lavender-600'
                              />
                              <span className='truncate'>{a.executor}</span>
                            </label>
                          ))
                        ) : (
                          <div className='text-xs text-gray-400'>No assignees to select</div>
                        )}
                      </div>
                      <div className='w-32'>
                        <input
                          type='text'
                          className='w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-lavender-500 focus:border-lavender-500'
                          placeholder='Points'
                          value={bulkEffortPoints}
                          onChange={(e) => setBulkEffortPoints(e.target.value)}
                        />
                      </div>
                      <div>
                        <Button
                          onClick={handleApplyBulkEffort}
                          className='bg-lavender-600 hover:bg-lavender-700 text-white'
                        >
                          Apply
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Tags Section - Cột phải */}
          <div>
            <h2 className='text-base font-bold mb-3 flex items-center gap-2 text-gray-900 min-h-[2rem]'>
              <Tag className='h-4 w-4 text-lavender-600' />
              Tags
              <button
                type='button'
                className='ml-2 p-2 rounded-lg hover:bg-gray-50 text-gray-500 hover:text-gray-700 transition-colors duration-200'
                onClick={() => setIsTagManagerOpen(true)}
                title='Manage tags'
              >
                <Settings className='w-4 h-4' />
              </button>
            </h2>
            <div className='p-3 bg-white rounded-lg shadow-sm border border-gray-200 min-h-[200px] flex flex-col'>
              <div className='flex items-center gap-2 flex-wrap mb-4'>
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
                    <div className='absolute left-0 top-10 z-[9993] bg-white border border-gray-200 rounded shadow-lg min-w-[180px] max-h-48 overflow-y-auto'>
                      {tags.filter((t) => !(task.tags || []).some((tag) => tag.id === t.id || tag.name === t.name))
                        .length === 0 ? (
                        <div className='px-3 py-1.5 text-gray-400 text-xs'>No tags available</div>
                      ) : (
                        tags
                          .filter((t) => !(task.tags || []).some((tag) => tag.id === t.id || tag.name === t.name))
                          .map((tag) => (
                            <button
                              key={tag.id}
                              className='w-full text-left px-3 py-1.5 hover:bg-gray-50 text-xs font-medium flex items-center gap-2'
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

              {/* Tag statistics/info section to balance height */}
              <div className='mt-auto pt-4 border-t border-gray-200'>
                <div className='text-xs text-gray-600 mb-2'>Tag Statistics</div>
                <div className='grid grid-cols-2 gap-2 text-xs'>
                  <div className='text-center p-2 bg-gray-50 rounded'>
                    <div className='font-semibold text-gray-900'>{(task.tags || []).length}</div>
                    <div className='text-gray-600'>Tags</div>
                  </div>
                  <div className='text-center p-2 bg-gray-50 rounded'>
                    <div className='font-semibold text-gray-900'>
                      {
                        tags.filter((t) => !(task.tags || []).some((tag) => tag.id === t.id || tag.name === t.name))
                          .length
                      }
                    </div>
                    <div className='text-gray-600'>Available</div>
                  </div>
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
                      if (onTaskUpdated) onTaskUpdated()
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
            <div className='flex items-center gap-3'>
              <MessageCircle className='h-6 w-6 text-lavender-600' />
              <h2 className='text-xl font-bold text-gray-900'>Activity</h2>
            </div>
            <div className='flex flex-wrap items-center gap-3'>
              <div className='flex items-center gap-3'>
                <span className='text-sm font-medium text-gray-700'>Show:</span>
                <button className='flex items-center gap-2 px-4 py-2 text-gray-700 rounded-lg border border-gray-300 hover:bg-gray-50 hover:border-gray-400 transition-all duration-200 font-medium text-sm'>
                  <Filter className='h-4 w-4' />
                  <span>All</span>
                </button>
              </div>
              <button className='flex items-center gap-2 px-4 py-2 text-gray-700 rounded-lg border border-gray-300 hover:bg-gray-50 hover:border-gray-400 transition-all duration-200 font-medium text-sm'>
                <Eye className='h-4 w-4' />
                <span>Hide Details</span>
              </button>
              <button className='flex items-center gap-2 px-4 py-2 text-gray-700 rounded-lg border border-gray-300 hover:bg-gray-50 hover:border-gray-400 transition-all duration-200 font-medium text-sm'>
                <Calendar className='h-4 w-4' />
                <span>Today</span>
              </button>
            </div>
          </div>

          {/* Comment Input */}
          <div className='flex flex-col sm:flex-row gap-3 mb-6'>
            <div className='flex items-center gap-4 flex-1'>
              <Avatar className='w-8 h-8 sm:w-10 sm:h-10 border border-gray-300 shadow-sm flex-shrink-0'>
                <AvatarImage
                  src={currentUserAvatar}
                  alt={user?.fullName || user?.username || user?.email || user?.id || 'Unknown'}
                />
                <AvatarFallback className='text-sm font-medium'>{currentUserInitial}</AvatarFallback>
              </Avatar>
              <input
                type='text'
                placeholder='Write a comment...'
                className='flex-1 px-4 h-8 sm:h-10 rounded-lg border border-gray-300 font-medium text-sm hover:border-gray-400 focus:border-blue-500 focus:outline-none'
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                disabled={isCommentLoading}
              />
            </div>
            <div className='flex gap-3'>
              <input
                type='file'
                multiple
                onChange={handleCommentFileChange}
                className='hidden'
                disabled={isCommentLoading}
                id='comment-file-input'
              />
              <label
                htmlFor='comment-file-input'
                className='flex items-center gap-2 h-8 sm:h-10 px-4 py-2.5 text-gray-700 rounded-lg border border-gray-300 hover:bg-gray-50 hover:border-gray-400 transition-colors duration-200 font-medium text-sm cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed'
              >
                <Paperclip className='h-4 w-4' />
                <span>Attach Files</span>
              </label>
              <Button
                onClick={async () => {
                  await handleAddComment()
                  await fetchComments()
                }}
                disabled={isCommentLoading || !comment.trim()}
                className='bg-lavender-600 text-white hover:bg-lavender-700 font-semibold text-sm rounded-lg shadow-sm hover:shadow-md transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed'
              >
                {isCommentLoading ? 'Sending...' : 'Send Comment'}
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
          <DialogTitle>Confirm Leave Task</DialogTitle>
          <DialogDescription>
            Are you sure you want to leave this task? This action will remove you from the assignee list.
          </DialogDescription>
          <div className='flex justify-end gap-2 mt-4'>
            <Button
              variant='outline'
              onClick={() => {
                setShowLeaveConfirm(false)
                setSelectedAssignee(null)
              }}
            >
              Cancel
            </Button>
            <Button
              variant='destructive'
              onClick={() => selectedAssignee && handleLeaveTask(selectedAssignee)}
              disabled={selectedAssignee ? leaveLoadingMap[selectedAssignee] : false}
            >
              {selectedAssignee && leaveLoadingMap[selectedAssignee] ? 'Processing...' : 'Leave Task'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Remove Assignee Confirmation Dialog */}
      <Dialog open={showRemoveConfirm} onOpenChange={setShowRemoveConfirm}>
        <DialogContent className='max-w-md'>
          <DialogTitle>Confirm Remove Assignee</DialogTitle>
          <DialogDescription>
            Are you sure you want to remove this assignee from the task? This action will remove them from the assignee
            list.
          </DialogDescription>
          <div className='flex justify-end gap-2 mt-4'>
            <Button
              variant='outline'
              onClick={() => {
                setShowRemoveConfirm(false)
                setSelectedAssignee(null)
              }}
            >
              Cancel
            </Button>
            <Button
              variant='destructive'
              onClick={() => selectedAssignee && handleRemoveAssignee(selectedAssignee)}
              disabled={selectedAssignee ? removeLoadingMap[selectedAssignee] : false}
            >
              {selectedAssignee && removeLoadingMap[selectedAssignee] ? 'Processing...' : 'Remove Assignee'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </Dialog>
  )
}
