import { useEffect, useState, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogTitle } from '@/components/ui/dialog'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'
import { tagApi } from '@/api/projects'
import { Tag } from '@/types/project'
import { ProjectMember } from '@/types/project'
import { Board } from '@/types/board'

interface TaskFilters {
  status: string[]
  priority: string[]
  assigneeIds: string[]
  tagIds: string[]
  deadlineFilter: string
  effortPointsFilter: string
}

interface TaskFilterDialogProps {
  isOpen: boolean
  onClose: () => void
  filters: TaskFilters
  onFiltersChange: (filters: TaskFilters) => void
  projectMembers: ProjectMember[]
  projectId: string
  boards: Board[]
}

const priorityOptions = [
  { value: '1', label: 'Low' },
  { value: '2', label: 'Medium' },
  { value: '3', label: 'High' },
  { value: '4', label: 'Urgent' }
]

const getPriorityClass = (value: string) => {
  switch (value) {
    case '4':
      return 'bg-red-500 text-white'
    case '3':
      return 'bg-yellow-400 text-black'
    default:
      return 'bg-neutral-100 dark:bg-neutral-800'
  }
}

const deadlineOptions = [
  { value: 'all', label: 'All Tasks' },
  { value: 'overdue', label: 'Overdue' },
  { value: 'due_today', label: 'Due Today' },
  { value: 'due_week', label: 'Due This Week' },
  { value: 'due_month', label: 'Due This Month' },
  { value: 'no_deadline', label: 'No Deadline' }
]

const effortOptions = [
  { value: 'all', label: 'All Tasks' },
  { value: 'no_effort', label: 'No Effort Points' },
  { value: '1-3', label: '1-3 Points' },
  { value: '4-8', label: '4-8 Points' },
  { value: '9+', label: '9+ Points' }
]

export function TaskFilterDialog({
  isOpen,
  onClose,
  filters,
  onFiltersChange,
  projectMembers,
  projectId,
  boards
}: TaskFilterDialogProps) {
  const [availableTags, setAvailableTags] = useState<Tag[]>([])
  const [loadingTags, setLoadingTags] = useState(false)

  // Generate dynamic status options from boards
  const statusOptions: { value: string; label: string }[] = boards.map((board) => ({
    value: board.name,
    label: board.name
  }))

  const loadTags = useCallback(async () => {
    if (!projectId) return
    setLoadingTags(true)
    try {
      const tags = await tagApi.getAllTagsByProjectId(projectId)
      setAvailableTags(tags || [])
    } catch (error) {
      console.error('Failed to load tags:', error)
      setAvailableTags([])
    } finally {
      setLoadingTags(false)
    }
  }, [projectId])

  useEffect(() => {
    if (isOpen && projectId) {
      loadTags()
    }
  }, [isOpen, projectId, loadTags])

  const handleStatusChange = (status: string, checked: boolean) => {
    const newStatuses = checked ? [...filters.status, status] : filters.status.filter((s) => s !== status)
    onFiltersChange({ ...filters, status: newStatuses })
  }

  const handlePriorityChange = (priority: string, checked: boolean) => {
    const newPriorities = checked ? [...filters.priority, priority] : filters.priority.filter((p) => p !== priority)
    onFiltersChange({ ...filters, priority: newPriorities })
  }

  const handleAssigneeChange = (assigneeId: string, checked: boolean) => {
    const newAssigneeIds = checked
      ? [...filters.assigneeIds, assigneeId]
      : filters.assigneeIds.filter((id) => id !== assigneeId)
    onFiltersChange({ ...filters, assigneeIds: newAssigneeIds })
  }

  const handleTagChange = (tagId: string, checked: boolean) => {
    const newTagIds = checked ? [...filters.tagIds, tagId] : filters.tagIds.filter((id) => id !== tagId)
    onFiltersChange({ ...filters, tagIds: newTagIds })
  }

  const clearAllFilters = () => {
    onFiltersChange({
      status: [],
      priority: [],
      assigneeIds: [],
      tagIds: [],
      deadlineFilter: 'all',
      effortPointsFilter: 'all'
    })
  }

  const getActiveFilterCount = () => {
    return (
      filters.status.length +
      filters.priority.length +
      filters.assigneeIds.length +
      filters.tagIds.length +
      (filters.deadlineFilter !== 'all' ? 1 : 0) +
      (filters.effortPointsFilter !== 'all' ? 1 : 0)
    )
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className='max-w-4xl max-h-[90vh] p-0 overflow-hidden'>
        <div className='flex items-center justify-between px-6 py-4 border-b border-neutral-100 dark:border-neutral-800 bg-white dark:bg-neutral-950'>
          <div>
            <DialogTitle className='text-lg font-semibold'>Filter Tasks</DialogTitle>
            <DialogDescription className='text-sm text-neutral-600 dark:text-neutral-400'>
              Narrow down tasks by status, priority, assignee, tags, deadline and effort.
            </DialogDescription>
          </div>
          <div className='flex items-center gap-3'>
            {getActiveFilterCount() > 0 && (
              <Badge
                variant='secondary'
                className='px-2 py-1 bg-violet-50 text-violet-700 dark:bg-violet-900 dark:text-violet-200 border-violet-100'
              >
                {getActiveFilterCount()} active
              </Badge>
            )}
            <Button variant='ghost' size='sm' onClick={clearAllFilters}>
              Reset
            </Button>
          </div>
        </div>

        <div className='grid grid-cols-3 gap-6 p-6'>
          <div className='col-span-2'>
            <ScrollArea className='max-h-[60vh] pr-4'>
              <div className='space-y-6'>
                {/* Status & Priority in a single row */}
                <div className='grid grid-cols-2 gap-6'>
                  <div>
                    <Label className='text-sm font-medium mb-3 block'>Status</Label>
                    <div className='flex flex-wrap gap-2'>
                      {statusOptions.map((option) => (
                        <label
                          key={option.value}
                          className='inline-flex items-center gap-2 rounded-md border border-neutral-200 px-3 py-1 bg-white dark:bg-neutral-950 dark:border-neutral-800'
                        >
                          <Checkbox
                            id={`status-${option.value}`}
                            checked={filters.status.includes(option.value)}
                            onCheckedChange={(checked) => handleStatusChange(option.value, checked as boolean)}
                          />
                          <span className='text-sm'>{option.label}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div>
                    <Label className='text-sm font-medium mb-3 block'>Priority</Label>
                    <div className='flex flex-wrap gap-2'>
                      {priorityOptions.map((option) => (
                        <label
                          key={option.value}
                          className='inline-flex items-center gap-2 rounded-md px-3 py-1 border border-neutral-200 bg-white dark:bg-neutral-950 dark:border-neutral-800'
                        >
                          <Checkbox
                            id={`priority-${option.value}`}
                            checked={filters.priority.includes(option.value)}
                            onCheckedChange={(checked) => handlePriorityChange(option.value, checked as boolean)}
                          />
                          <span className='text-sm flex items-center gap-2'>
                            <Badge variant='secondary' className={`px-2 py-0.5 ${getPriorityClass(option.value)}`}>
                              {option.label}
                            </Badge>
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Assignees */}
                <div>
                  <Label className='text-sm font-medium mb-3 block'>Assignees</Label>
                  <div className='grid grid-cols-2 gap-3 max-h-40 overflow-y-auto'>
                    {projectMembers.map((member, idx) => {
                      const id = member.id || member.userId || ''
                      const name = member.fullName || member.email || 'Unknown'
                      return (
                        <label
                          key={id + idx}
                          className='flex items-center gap-3 p-2 rounded-md hover:bg-neutral-50 dark:hover:bg-neutral-900 cursor-pointer'
                        >
                          <Checkbox
                            id={`assignee-${id}`}
                            checked={filters.assigneeIds.includes(id)}
                            onCheckedChange={(checked) => handleAssigneeChange(id, checked as boolean)}
                          />
                          <div className='flex items-center gap-2'>
                            <Avatar className='h-8 w-8'>
                              {member.avatar ? (
                                <AvatarImage src={member.avatar} alt={name} />
                              ) : (
                                <AvatarFallback>{(name || '?').charAt(0)}</AvatarFallback>
                              )}
                            </Avatar>
                            <div className='text-sm'>
                              <div className='font-medium'>{name}</div>
                              <div className='text-xs text-neutral-500 dark:text-neutral-400'>{member.role}</div>
                            </div>
                          </div>
                        </label>
                      )
                    })}
                  </div>
                </div>

                {/* Tags */}
                <div>
                  <Label className='text-sm font-medium mb-3 block'>Tags</Label>
                  {loadingTags ? (
                    <div className='text-sm text-neutral-500'>Loading tags...</div>
                  ) : availableTags.length === 0 ? (
                    <div className='text-sm text-neutral-500'>No tags available</div>
                  ) : (
                    <div className='flex flex-wrap gap-2'>
                      {availableTags.map((tag) => (
                        <label
                          key={tag.id}
                          className='inline-flex items-center gap-2 px-3 py-1 rounded-full border border-neutral-200 bg-white dark:bg-neutral-950 dark:border-neutral-800 cursor-pointer'
                        >
                          <Checkbox
                            id={`tag-${tag.id}`}
                            checked={filters.tagIds.includes(tag.id)}
                            onCheckedChange={(checked) => handleTagChange(tag.id, checked as boolean)}
                          />
                          <span className='text-sm flex items-center gap-2'>
                            <span className='w-3 h-3 rounded-full' style={{ backgroundColor: tag.color }} />
                            {tag.name}
                          </span>
                        </label>
                      ))}
                    </div>
                  )}
                </div>

                {/* Deadline & Effort */}
                <div className='grid grid-cols-2 gap-6'>
                  <div>
                    <Label className='text-sm font-medium mb-3 block'>Deadline</Label>
                    <Select
                      value={filters.deadlineFilter}
                      onValueChange={(value) => onFiltersChange({ ...filters, deadlineFilter: value })}
                    >
                      <SelectTrigger
                        className='w-full bg-white border border-gray-300 rounded-lg h-10 focus:outline-none focus-visible:outline-none focus-visible:ring-0 focus:ring-0 focus-visible:ring-offset-0 focus:border-neutral-300 ring-0'
                        style={{ outline: 'none', boxShadow: 'none' }}
                      >
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {deadlineOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label className='text-sm font-medium mb-3 block'>Effort Points</Label>
                    <Select
                      value={filters.effortPointsFilter}
                      onValueChange={(value) => onFiltersChange({ ...filters, effortPointsFilter: value })}
                    >
                      <SelectTrigger
                        className='w-full bg-white border border-gray-300 rounded-lg h-10 focus:outline-none focus-visible:outline-none focus-visible:ring-0 focus:ring-0 focus-visible:ring-offset-0 focus:border-neutral-300 ring-0'
                        style={{ outline: 'none', boxShadow: 'none' }}
                      >
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {effortOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            </ScrollArea>
          </div>

          {/* Right column: Summary & quick actions */}
          <aside className='col-span-1 border-l border-neutral-100 dark:border-neutral-800 pl-6'>
            <div className='sticky top-6 space-y-4'>
              <div>
                <h4 className='text-sm font-medium'>Quick Summary</h4>
                <div className='mt-3 text-sm text-neutral-600 dark:text-neutral-400'>
                  {getActiveFilterCount() === 0 ? 'No filters active' : `${getActiveFilterCount()} filters active`}
                </div>
              </div>

              <Separator />

              <div>
                <h4 className='text-sm font-medium mb-2'>Selected Priorities</h4>
                <div className='flex flex-wrap gap-2'>
                  {filters.priority.length === 0 ? (
                    <div className='text-sm text-neutral-500'>None</div>
                  ) : (
                    filters.priority.map((p) => {
                      const opt = priorityOptions.find((o) => o.value === p)
                      return (
                        <Badge
                          key={p}
                          className='px-2 py-0.5 bg-violet-50 text-violet-700 dark:bg-violet-900 dark:text-violet-200 border-violet-100'
                        >
                          {opt?.label}
                        </Badge>
                      )
                    })
                  )}
                </div>
              </div>

              <div>
                <h4 className='text-sm font-medium mb-2'>Selected Tags</h4>
                <div className='flex flex-wrap gap-2'>
                  {filters.tagIds.length === 0 ? (
                    <div className='text-sm text-neutral-500'>None</div>
                  ) : (
                    filters.tagIds.map((tId) => {
                      const tg = availableTags.find((a) => a.id === tId)
                      return (
                        <div key={tId} className='inline-flex items-center gap-2 px-3 py-1 rounded-full border'>
                          <span className='w-2 h-2 rounded-full' style={{ backgroundColor: tg?.color }} />
                          <span className='text-sm'>{tg?.name || 'Tag'}</span>
                        </div>
                      )
                    })
                  )}
                </div>
              </div>
            </div>
          </aside>
        </div>

        <div className='border-t border-neutral-100 dark:border-neutral-800 bg-white dark:bg-neutral-950 sticky bottom-0'>
          <DialogFooter className='flex items-center justify-between px-6 py-3'>
            <Button variant='outline' onClick={clearAllFilters}>
              Clear All
            </Button>
            <div className='flex gap-2'>
              <Button variant='outline' onClick={onClose}>
                Cancel
              </Button>
              <Button
                className='bg-violet-600 hover:bg-violet-700 text-white dark:bg-violet-500 dark:hover:bg-violet-600'
                onClick={onClose}
              >
                Apply
              </Button>
            </div>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  )
}
