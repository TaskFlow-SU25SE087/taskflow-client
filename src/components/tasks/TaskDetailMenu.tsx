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
  const { showToast } = useToastContext()
  const [assignee, setAssignee] = useState<ProjectMember | null>(null)
  const [projectMembers, setProjectMembers] = useState<ProjectMember[]>([])
  const [projectLeader, setProjectLeader] = useState<ProjectMember | null>(null)
  const { currentProject } = useCurrentProject()
  const { user } = useAuth()
  const navigate = useNavigate()
  const { tags } = useTags()
  const { listenForTaskUpdates } = useSignalRIntegration()

  const [isTagSelectOpen, setIsTagSelectOpen] = useState(false)
  const [isPrioritySelectOpen, setIsPrioritySelectOpen] = useState(false)

  const [completeLoading, setCompleteLoading] = useState(false)
  const [comment, setComment] = useState('')
  const [commentFiles, setCommentFiles] = useState<File[]>([])
  const [isCommentLoading, setIsCommentLoading] = useState(false)
  const [isUpdating, setIsUpdating] = useState(false)
  const [editTitle, setEditTitle] = useState(task.title)
  const [editDescription, setEditDescription] = useState(task.description)
  const [editPriority, setEditPriority] = useState<number>(
    typeof task.priority === 'number' ? task.priority : parseInt(task.priority as string) || 1
  )
  const [isTagManagerOpen, setIsTagManagerOpen] = useState(false)

  // State cho edit mode
  const [isEditingTitle, setIsEditingTitle] = useState(false)
  const [isEditingDescription, setIsEditingDescription] = useState(false)

  // Priority mapping
  const PRIORITY_MAP: Record<number, string> = {
    1: 'Low',
    2: 'Medium',
    3: 'High',
    4: 'Critical'
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
        variant: 'default'
      })
    } catch (error) {
      console.error('❌ Error in assign task:', error)
      const message = error instanceof Error ? error.message : 'Failed to assign task.'
      showToast({ title: 'Error', description: message, variant: 'destructive' })
    }
  }

  const handleAttach = () => {
    showToast({
      title: 'Coming Soon',
      description: 'File attachments will be available soon!'
    })
  }

  const handleTagSelect = async (tagId: string) => {
    if (!currentProject) return
    try {
      await taskApi.addTagToTask(currentProject.id, task.id, tagId)
      const tag = tags.find((t) => t.id === tagId)
      // Tag added successfully
      showToast({
        title: 'Success',
        description: 'Tag added to task!',
        variant: 'default'
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
      showToast({ title: 'Success', description: 'Comment added!', variant: 'default' })
      setComment('')
      setCommentFiles([])
      // TODO: reload comments/activity if needed
      await fetchComments()
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to add comment'
      showToast({ title: 'Error', description: message, variant: 'destructive' })
    } finally {
      setIsCommentLoading(false)
    }
  }

  useEffect(() => {
    setEditTitle(task.title)
    setEditDescription(task.description)
    setEditPriority(typeof task.priority === 'number' ? task.priority : parseInt(task.priority as string) || 1)
    setLocalTaskData(task)
    // Task data updated
  }, [task])

  const handleUpdateTask = async () => {
    if (!currentProject) return
    setIsUpdating(true)
    try {
      const res = await taskApi.updateTask(currentProject.id, task.id, {
        title: editTitle,
        description: editDescription,
        priority: editPriority.toString()
      })
      if (typeof res === 'object' && res !== null && 'code' in res && 'message' in res) {
        showToast({
          title: res.code === 200 ? 'Success' : 'Error',
          description: res.message || 'Task updated!',
          variant: res.code === 200 ? 'default' : 'destructive'
        })
      } else {
        showToast({
          title: res === true ? 'Success' : 'Error',
          description: res === true ? 'Task updated!' : 'Failed to update task',
          variant: res === true ? 'default' : 'destructive'
        })
      }
      // Ask parent to refresh and reflect changes immediately
      onTaskUpdated && onTaskUpdated()
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to update task'
      showToast({ title: 'Error', description: message, variant: 'destructive' })
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

  // Tổng hợp file đính kèm từ task và các comment
  const allAttachmentUrls: string[] = [
    ...(task.attachmentUrl ? [task.attachmentUrl] : []),
    ...(Array.isArray(task.completionAttachmentUrls) ? task.completionAttachmentUrls : []),
    ...(task.commnets || []).flatMap((c) => c.attachmentUrls || [])
  ]

  const priorityDropdownRef = useRef<HTMLDivElement>(null)
  const tagDropdownRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [completeFiles, setCompleteFiles] = useState<File[]>([])

  // Handle task completion with file upload
  const handleCompleteTask = async () => {
    if (!currentProject) return
    if (!completeFiles.length) {
      // Open file picker if no files selected
      fileInputRef.current?.click()
      return
    }
    setCompleteLoading(true)
    try {
      const res = await taskApi.completeTaskWithUpload(currentProject.id, task.id, completeFiles)
      showToast({
        title: res ? 'Success' : 'Error',
        description: res ? 'Task marked as complete!' : 'Failed to complete task',
        variant: res ? 'default' : 'destructive'
      })

      // Refresh data immediately using the optimized function
      console.log('🔄 Refreshing data after complete task...')
      await fetchAssigneeAndMembers()
      onTaskUpdated()

      // Close modal after a short delay to ensure data is refreshed
      setTimeout(() => {
        onClose()
      }, 300)
    } catch (error: unknown) {
      showToast({
        title: 'Error',
        description: (error as Error)?.message || 'Failed to complete task',
        variant: 'destructive'
      })
    } finally {
      setCompleteLoading(false)
      setCompleteFiles([])
    }
  }

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
      const message = error instanceof Error ? error.message : 'Failed to leave task'
      showToast({
        title: 'Error',
        description: message,
        variant: 'destructive'
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
      // Refresh task data từ server
      const updatedTasks = await taskApi.getTasksFromProject(currentProject!.id)
      const updatedTask = updatedTasks?.find((t) => t.id === task.id)

      if (updatedTask) {
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
      const message = error instanceof Error ? error.message : 'Failed to remove assignee'
      showToast({
        title: 'Error',
        description: message,
        variant: 'destructive'
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
      <DialogContent className='max-w-4xl w-full [&>button]:hidden'>
        <DialogTitle className='hidden'>Title</DialogTitle>

        {/* Header */}
        <div className='flex items-center justify-between mb-4'>
          <div className='flex items-center gap-2'>
            <span className='text-xl font-semibold'>Task Details</span>
            <button className='p-1 rounded-lg bg-lavender-200 text-lavender-500 hover:bg-lavender-300/60 hover:text-lavender-800'>
              <Link className='h-4 w-4' />
            </button>
          </div>
          <button onClick={onClose} className='text-gray-400 hover:text-gray-600'>
            <X className='h-5 w-5' />
          </button>
        </div>

        {/* Task Name and Priority */}
        <div className='mb-4'>
          <div className='flex items-center gap-2 mb-1'>
            <span className='text-gray-500'>Board</span>
            <span className='text-gray-900 cursor-pointer hover:underline font-medium'>{task.status}</span>
          </div>
          <div className='flex items-center gap-2'>
            <ListTodo className='h-5 w-5' />
            <div className='relative flex-grow'>
              {isEditingTitle ? (
                <Input
                  className='text-2xl font-semibold pr-10 w-full'
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  onBlur={() => setIsEditingTitle(false)}
                  autoFocus
                  disabled={isUpdating}
                />
              ) : (
                <div
                  className='text-2xl font-semibold pr-10 w-full flex items-center group cursor-pointer rounded hover:bg-gray-50 transition'
                  onClick={() => setIsEditingTitle(true)}
                >
                  <span className='flex-1 truncate'>{editTitle}</span>
                  <Pencil className='h-5 w-5 ml-2 text-gray-400 opacity-0 group-hover:opacity-100 transition' />
                </div>
              )}
            </div>
            <div className='flex items-center gap-2'>
              <div className='relative' ref={priorityDropdownRef}>
                <button
                  type='button'
                  className={`w-40 flex items-center justify-between border rounded px-3 py-1.5 text-center bg-lavender-50 font-medium text-lavender-700 hover:bg-lavender-100 transition-colors duration-150 shadow-sm focus:outline-none focus:ring-2 focus:ring-lavender-300 ${isUpdating ? 'opacity-60 cursor-not-allowed' : ''}`}
                  onClick={() => setIsPrioritySelectOpen((v) => !v)}
                  disabled={isUpdating}
                  aria-label='Priority'
                  style={{ marginRight: '0.5rem' }}
                >
                  <span className='flex items-center gap-2 whitespace-nowrap'>
                    {getPriorityChevron(editPriority as number)}
                    {PRIORITY_MAP[editPriority as number] || 'Set Priority'}
                  </span>
                  <ChevronDown className='h-4 w-4 ml-2 text-lavender-400' />
                </button>
                {isPrioritySelectOpen && (
                  <div className='absolute left-0 top-12 z-50 bg-white border rounded shadow-lg min-w-[160px] max-h-60 overflow-y-auto animate-fade-in'>
                    {[1, 2, 3, 4].map((priority) => (
                      <button
                        key={priority}
                        className={`w-full flex items-center gap-2 px-4 py-2 text-left text-sm font-medium hover:bg-lavender-50 transition-colors duration-100 ${editPriority === priority ? 'bg-lavender-100 text-lavender-700' : 'text-gray-700'}`}
                        onClick={() => {
                          setEditPriority(priority)
                          setIsPrioritySelectOpen(false)
                        }}
                        disabled={isUpdating}
                      >
                        {getPriorityChevron(priority)}
                        {PRIORITY_MAP[priority]}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
          <div className='flex items-center gap-2 mt-2'>
            <Calendar className='h-4 w-4 text-gray-400' />
            <span className='text-sm text-gray-600'>
              Deadline: {task.deadline ? new Date(task.deadline).toLocaleDateString('vi-VN') : 'N/A'}
            </span>
          </div>
          <div className='mt-2 text-gray-600'>
            <div className='relative'>
              {isEditingDescription ? (
                <textarea
                  className='w-full border rounded p-2 pr-10 font-medium'
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  onBlur={() => setIsEditingDescription(false)}
                  autoFocus
                  disabled={isUpdating}
                />
              ) : (
                <div className='w-full min-h-[48px] flex items-center rounded px-2 py-2 bg-gray-50'>
                  <span className={`flex-1 ${!editDescription ? 'text-gray-400 italic' : ''} font-medium`}>
                    {editDescription || 'No detailed description for this task.'}
                  </span>
                  <Button
                    variant='ghost'
                    size='icon'
                    className='ml-2 text-gray-400 hover:text-blue-500'
                    onClick={() => setIsEditingDescription(true)}
                  >
                    <Pencil className='h-4 w-4' />
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
                (editTitle === task.title && editDescription === task.description && editPriority === task.priority)
              }
              className='px-6 bg-lavender-500 hover:bg-lavender-700 text-white font-semibold border-0'
              style={{ boxShadow: 'none' }}
            >
              {isUpdating ? (
                <>
                  <Loader2 className='mr-2 h-4 w-4 animate-spin' />
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
          <div className='mt-4'>
            <div className='font-semibold mb-2'>Attachments:</div>
            <div className='flex flex-wrap gap-3'>
              {allAttachmentUrls.map((url: string, idx: number) => {
                if (url.match(/\.(jpg|jpeg|png|gif)$/i)) {
                  // Image
                  return (
                    <a key={url || idx} href={url} target='_blank' rel='noopener noreferrer'>
                      <img src={url} alt={`attachment-${idx}`} className='w-24 h-24 object-cover rounded border' />
                    </a>
                  )
                } else if (url.match(/\.pdf$/i)) {
                  // PDF
                  return (
                    <div key={url || idx} className='w-48 h-64 border rounded overflow-hidden'>
                      <iframe src={url} title={`pdf-${idx}`} className='w-full h-full' />
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
                  // Other file
                  return (
                    <a
                      key={url || idx}
                      href={url}
                      target='_blank'
                      rel='noopener noreferrer'
                      className='text-blue-600 underline flex items-center gap-1 font-medium'
                    >
                      📎 File {idx + 1}
                    </a>
                  )
                }
              })}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className='flex gap-2 mb-6'>
          <button
            onClick={handleAttach}
            className='flex items-center gap-2 px-3 py-1.5 text-gray-600 rounded-lg border hover:bg-gray-50'
          >
            <Paperclip className='h-4 w-4' />
            <span>Attach</span>
          </button>
          <input
            type='file'
            multiple
            ref={fileInputRef}
            style={{ display: 'none' }}
            onChange={(e) => {
              if (e.target.files) {
                setCompleteFiles(Array.from(e.target.files))
                // After selecting files, call handleCompleteTask
                setTimeout(() => handleCompleteTask(), 0)
              }
            }}
          />
          <Button
            onClick={handleCompleteTask}
            disabled={completeLoading}
            className='flex items-center gap-2 px-3 py-1.5 text-green-700 border border-green-300 bg-green-50 hover:bg-green-100'
          >
            {completeLoading ? 'Completing...' : 'Complete'}
          </Button>
          {currentProject && (
            <IssueCreateMenu projectId={currentProject.id} taskId={task.id} onIssueCreated={onTaskUpdated} />
          )}
        </div>

        {/* Assignee and Tags - Layout 2 cột */}
        <div className='grid grid-cols-2 gap-6 mb-6'>
          {/* Assignee Section - Cột trái */}
          <div>
            <h1 className='text-base font-semibold mb-3 flex items-center gap-2'>Assignee</h1>
            <div className='flex flex-col gap-4 p-4 bg-white rounded-lg shadow-sm border'>
              {/* Debug info */}
              <div className='text-xs text-gray-500 mb-2'>
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
                      className='flex items-center justify-between p-3 border-b last:border-b-0 bg-gray-50 rounded-lg'
                    >
                      <div className='flex items-center gap-3'>
                        <Avatar className='w-12 h-12 border border-gray-200 shadow'>
                          <AvatarImage src={a.avatar} alt={a.executor} />
                          <AvatarFallback>{a.executor?.[0] || '?'}</AvatarFallback>
                        </Avatar>
                        <div className='flex flex-col'>
                          <span className='font-semibold text-gray-800 text-base'>{a.executor}</span>
                          <span className='text-sm text-gray-500'>{a.role}</span>
                        </div>
                      </div>
                      {/* Action buttons - hiển thị icon thay vì nút */}
                      <div className='flex items-center gap-2'>
                        {/* Leave task - chỉ hiển thị cho assignee hiện tại */}
                        {isCurrentUser && (
                          <button
                            onClick={() => {
                              setSelectedAssignee(a.projectMemberId)
                              setShowLeaveConfirm(true)
                            }}
                            disabled={leaveLoading}
                            title='Rời khỏi task'
                            className='p-1.5 rounded-full hover:bg-orange-50 hover:text-orange-600 text-gray-400 transition-all duration-200 hover:scale-110'
                          >
                            {leaveLoading ? (
                              <Loader2 className='w-4 h-4 animate-spin' />
                            ) : (
                              <LogOut className='w-4 h-4' />
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
                            className='p-1.5 rounded-full hover:bg-red-50 hover:text-red-600 text-gray-400 transition-all duration-200 hover:scale-110'
                          >
                            {removeLoadingMap[a.projectMemberId] ? (
                              <Loader2 className='w-4 h-4 animate-spin' />
                            ) : (
                              <X className='w-4 h-4' />
                            )}
                          </button>
                        )}
                      </div>
                    </div>
                  )
                })
              ) : (
                <span className='text-gray-400 italic'>Chưa có assignee</span>
              )}
              {/* Dropdown chọn assignee (nếu là leader) */}
              {isUserLeader && (
                <div className='mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200'>
                  <div className='text-sm font-medium text-blue-800 mb-2'>Assign new member</div>
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
                        'flex items-center gap-2 px-3 py-1.5 text-gray-600 rounded-lg border hover:bg-gray-50',
                        'focus:ring-0 focus:ring-offset-0 h-auto',
                        '[&>span]:flex [&>span]:items-center [&>span]:gap-2 [&>span]:m-0 [&>span]:p-0',
                        '[&>svg]:hidden',
                        !canAssignTask && 'opacity-50 cursor-not-allowed'
                      )}
                    >
                      <SelectValue
                        placeholder={
                          <div className='flex items-center gap-2 text-gray-500'>
                            <UserPlus className='h-4 w-4' />
                            <span>Assign member</span>
                          </div>
                        }
                      >
                        {assignee ? (
                          <div style={{ display: 'flex', alignItems: 'center' }}>
                            <img
                              src={assignee.avatar}
                              alt={assignee.fullName}
                              style={{ width: 24, height: 24, borderRadius: '50%', marginRight: 8 }}
                            />
                            <span>{assignee.fullName}</span>
                          </div>
                        ) : (
                          <span>Assign member</span>
                        )}
                      </SelectValue>
                    </SelectTrigger>
                    {user?.id && (
                      <SelectContent className='p-0'>
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
                              className='focus:bg-gray-100 focus:text-gray-900 py-2 px-3'
                            >
                              <div className='flex items-center pl-5 gap-2'>
                                <Avatar>
                                  <AvatarImage src={member.avatar} alt={displayName} />
                                  <AvatarFallback>{avatarChar}</AvatarFallback>
                                </Avatar>
                                <span>{displayName}</span>
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
            <h1 className='text-base font-semibold mb-3 flex items-center gap-2'>
              Tags
              <button
                type='button'
                className='ml-1 p-1 rounded-full hover:bg-gray-100 text-gray-500 hover:text-gray-700 transition'
                onClick={() => setIsTagManagerOpen(true)}
                title='Manage tags'
              >
                <Settings className='w-4 h-4' />
              </button>
            </h1>
            <div className='p-4 bg-white rounded-lg shadow-sm border'>
              <div className='flex items-center gap-2 flex-wrap'>
                {(task.tags || []).map((tag, idx) => (
                  <span
                    key={tag.id || idx}
                    style={{
                      backgroundColor: tag.color || '#eee',
                      color: '#fff',
                      borderRadius: '8px',
                      padding: '6px 16px',
                      fontWeight: 500,
                      fontSize: '1em',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '8px'
                    }}
                  >
                    {tag.name}
                  </span>
                ))}
                <div
                  className='flex items-center gap-2 cursor-pointer relative group'
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
                    className='h-6 w-6 rounded-lg bg-lavender-200 group-hover:bg-lavender-300/60 transition-colors duration-150 pointer-events-none'
                    aria-label='Add tag icon'
                  >
                    <Plus className='h-4 w-4 text-lavender-500 group-hover:text-lavender-800 transition-colors duration-150' />
                  </Button>
                  <span className='font-medium text-lavender-500 group-hover:text-lavender-800 transition-colors duration-150'>
                    Add
                  </span>
                                       {isTagSelectOpen && (
                     <div className='absolute left-0 top-12 z-50 bg-white border rounded shadow-lg min-w-[200px] max-h-60 overflow-y-auto'>
                                              {tags.filter((t) => !(task.tags || []).some((tag) => tag.id === t.id || tag.name === t.name)).length === 0 ? (
                        <div className='px-4 py-2 text-gray-400 text-sm'>No tags available</div>
                      ) : (
                        tags
                          .filter((t) => !(task.tags || []).some((tag) => tag.id === t.id || tag.name === t.name))
                          .map((tag) => (
                            <button
                              key={tag.id}
                              className='w-full text-left px-4 py-2 hover:bg-lavender-50 text-sm font-medium flex items-center gap-2'
                              onClick={async () => {
                                await handleTagSelect(tag.id)
                                setIsTagSelectOpen(false)
                              }}
                            >
                              <span
                                className='px-3 py-1 rounded-full text-white font-medium text-sm'
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
              taskApi.getTasksFromProject(currentProject.id).then(tasks => {
                const updatedTask = tasks.find(t => t.id === task.id)
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
          <div className='flex items-center justify-between mb-4'>
            <div className='flex items-center gap-2'>
              <MessageCircle className='h-5 w-5' />
              <h1 className='text-2xl font-semibold'>Activity</h1>
            </div>
            <div className='flex items-center gap-2'>
              <div className='flex items-center gap-2'>
                <span className='text-gray-500'>Show:</span>
                <button className='flex items-center gap-2 px-3 py-1.5 text-gray-600 rounded-lg border hover:bg-gray-50 font-medium'>
                  <Filter className='h-4 w-4' />
                  <span>All</span>
                </button>
              </div>
              <button className='flex items-center gap-2 px-3 py-1.5 text-gray-600 rounded-lg border hover:bg-gray-50 font-medium'>
                <Eye className='h-4 w-4' />
                <span>Hide Details</span>
              </button>
              <button className='flex items-center gap-2 px-3 py-1.5 text-gray-600 rounded-lg border hover:bg-gray-50 font-medium'>
                <Calendar className='h-4 w-4' />
                <span>Today</span>
              </button>
            </div>
          </div>

          {/* Comment Input */}
          <div className='flex gap-3 mb-6 items-center'>
            <Avatar>
              <AvatarImage
                src={user?.avatar}
                alt={user?.fullName || user?.username || user?.email || user?.id || 'Unknown'}
              />
              <AvatarFallback>
                {(user?.fullName?.[0] || user?.username?.[0] || user?.email?.[0] || user?.id?.[0] || '?').toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <input
              type='text'
              placeholder='Write a comment...'
              className='flex-1 px-4 py-2 focus-visible:ring-0 focus-visible:ring-offset-0 focus:outline-none rounded-lg border border-gray-200 font-medium'
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              disabled={isCommentLoading}
            />
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
              className='ml-2 px-4 py-2 bg-lavender-500 text-white hover:bg-lavender-700 font-semibold'
            >
              {isCommentLoading ? 'Sending...' : 'Send'}
            </Button>
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
