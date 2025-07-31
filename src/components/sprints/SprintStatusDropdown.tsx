import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useToastContext } from '@/components/ui/ToastContext'
import { useSprints } from '@/hooks/useSprints'
import { Sprint } from '@/types/sprint'
import { Loader2 } from 'lucide-react'
import { useState } from 'react'

interface SprintStatusDropdownProps {
  sprint: Sprint
  onStatusUpdate?: () => void
}


const statusOptions = [
  { value: '0', label: 'Not Started' },
  { value: '10000', label: 'In Progress' },
  { value: '20000', label: 'Completed' },
  { value: '30000', label: 'On Hold' },
  { value: '40000', label: 'Cancelled' }
]

export function SprintStatusDropdown({ sprint, onStatusUpdate }: SprintStatusDropdownProps) {
  const [isUpdating, setIsUpdating] = useState(false)
  const { updateSprintStatus } = useSprints()
  const { showToast } = useToastContext()

  // Convert sprint status to enum value for API
  const getStatusEnumValue = (status: string | number): string => {
    const statusStr = String(status)
    const statusMap: Record<string, string> = {
      '0': '0',
      '10000': '10000', 
      '20000': '20000',
      '30000': '30000',
      '40000': '40000',
      'NotStarted': '0',
      'InProgress': '10000',
      'Completed': '20000',
      'OnHold': '30000',
      'Cancelled': '40000'
    }
    return statusMap[statusStr] || '0'
  }

  // Get current status for display
  const getCurrentStatusDisplay = (status: string | number): string => {
    const statusStr = String(status)
    const displayMap: Record<string, string> = {
      '0': 'Not Started',
      '10000': 'In Progress',
      '20000': 'Completed', 
      '30000': 'On Hold',
      '40000': 'Cancelled',
      'NotStarted': 'Not Started',
      'InProgress': 'In Progress',
      'Completed': 'Completed',
      'OnHold': 'On Hold',
      'Cancelled': 'Cancelled'
    }
    return displayMap[statusStr] || 'Not Started'
  }

  const handleStatusChange = async (newStatus: string) => {
    const currentEnumValue = getStatusEnumValue(sprint.status)
    if (newStatus === currentEnumValue) return

    setIsUpdating(true)
    try {
      const success = await updateSprintStatus(sprint.id, newStatus)
      
      if (success) {
        showToast({
          title: 'Success',
          description: `Sprint status updated to ${getCurrentStatusDisplay(newStatus)}`
        })
        onStatusUpdate?.()
      } else {
        showToast({
          title: 'Error',
          description: 'Failed to update sprint status. Please try again.',
          variant: 'destructive'
        })
      }
    } catch (error) {
      console.error('Error updating sprint status:', error)
      showToast({
        title: 'Error',
        description: 'Failed to update sprint status. Please try again.',
        variant: 'destructive'
      })
    } finally {
      setIsUpdating(false)
    }
  }

  const currentStatus = getCurrentStatusDisplay(sprint.status)
  const currentEnumValue = getStatusEnumValue(sprint.status)

  return (
    <div className="flex items-center gap-2">
      <span className="text-sm text-gray-500">Status:</span>
      <Select
        value={currentEnumValue}
        onValueChange={handleStatusChange}
        disabled={isUpdating}
      >
        <SelectTrigger className="w-40 h-8 text-xs border-0 bg-transparent p-0">
          <SelectValue>
            {isUpdating ? (
              <div className="flex items-center gap-2">
                <Loader2 className="h-3 w-3 animate-spin" />
                <span>Updating...</span>
              </div>
            ) : (
              <span className={`px-2 py-1 rounded text-xs font-medium ${
                currentEnumValue === '0' ? 'bg-gray-100 text-gray-700' :
                currentEnumValue === '10000' ? 'bg-blue-100 text-blue-700' :
                currentEnumValue === '20000' ? 'bg-green-100 text-green-700' :
                currentEnumValue === '30000' ? 'bg-yellow-100 text-yellow-700' :
                currentEnumValue === '40000' ? 'bg-red-100 text-red-700' :
                'bg-gray-100 text-gray-700'
              }`}>
                {currentStatus}
              </span>
            )}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          {statusOptions.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              <div className="flex items-center gap-2">
                <span className={`px-2 py-1 rounded text-xs font-medium ${
                  option.value === '0' ? 'bg-gray-100 text-gray-700' :
                  option.value === '10000' ? 'bg-blue-100 text-blue-700' :
                  option.value === '20000' ? 'bg-green-100 text-green-700' :
                  option.value === '30000' ? 'bg-yellow-100 text-yellow-700' :
                  option.value === '40000' ? 'bg-red-100 text-red-700' :
                  'bg-gray-100 text-gray-700'
                }`}>
                  {option.label}
                </span>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
} 