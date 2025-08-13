import { SprintMeeting, SprintMeetingDetail } from '@/types/sprint'

/**
 * Check if a sprint meeting is still active
 * No time restriction - all meetings are always updatable
 */
export const isSprintMeetingActive = (meeting: SprintMeeting | SprintMeetingDetail): boolean => {
  // Bỏ hoàn toàn giới hạn thời gian - tất cả meeting đều có thể edit
  return true
}

/**
 * Check if a sprint meeting can be updated based on its status
 * No restrictions - all meetings can be updated
 */
export const canUpdateSprintMeeting = (meeting: SprintMeeting | SprintMeetingDetail): boolean => {
  // Bỏ hoàn toàn giới hạn - tất cả meeting đều có thể update
  return true
}

/**
 * Get a user-friendly message explaining why a meeting cannot be updated
 * Since all meetings are now updatable, return empty message
 */
export const getUpdateRestrictionMessage = (meeting: SprintMeeting | SprintMeetingDetail): string => {
  // Không có giới hạn nào - trả về message rỗng
  return ''
}

/**
 * Format the last update time for display
 */
export const formatLastUpdateTime = (meeting: SprintMeeting | SprintMeetingDetail): string => {
  const lastUpdate = new Date(meeting.updatedAt)
  const now = new Date()
  const diffInHours = Math.floor((now.getTime() - lastUpdate.getTime()) / (1000 * 60 * 60))
  
  if (diffInHours < 1) {
    return 'Just now'
  } else if (diffInHours < 24) {
    return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`
  } else {
    const diffInDays = Math.floor(diffInHours / 24)
    return `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`
  }
}
