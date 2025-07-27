import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem } from '@/components/ui/dropdown-menu'
import { AdminUser } from '@/types/admin'
import { Mail, Phone, User } from 'lucide-react'

interface AdminUserCardProps {
  user: AdminUser
  onEdit?: (user: AdminUser) => void
  onDelete?: (userId: string) => void
  onToggleStatus?: (userId: string, isActive: boolean) => void
  onBan?: (userId: string) => void
  onUnban?: (userId: string) => void
}

export default function AdminUserCard({ user, onEdit, onDelete, onToggleStatus, onBan, onUnban }: AdminUserCardProps) {
  const getInitials = (fullName: string) => {
    return fullName
      .split(' ')
      .map((name) => name[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  const formatRole = (role: string | number) => {
    if (role === 0 || role === '0' || role === 'Admin' || role === 'admin') {
      return 'Administrator'
    }
    return role.toString()
  }

  return (
    <Card className='w-full'>
      <CardHeader className='pb-3'>
        <div className='flex items-center justify-between'>
          <div className='flex items-center space-x-3'>
            <Avatar className='h-12 w-12'>
              <AvatarImage src={user.avatar} alt={user.fullName} />
              <AvatarFallback className='bg-primary/10 text-primary'>{getInitials(user.fullName)}</AvatarFallback>
            </Avatar>
            <div>
              <CardTitle className='text-lg font-semibold'>{user.fullName}</CardTitle>
              <div className='flex items-center space-x-2 text-sm text-muted-foreground'>
                <User className='h-4 w-4' />
                <span>{formatRole(user.role)}</span>
              </div>
            </div>
          </div>
          <DropdownMenu>
            <DropdownMenuContent align='end'>
              {onEdit && <DropdownMenuItem onClick={() => onEdit(user)}>Edit User</DropdownMenuItem>}
              {onToggleStatus && (
                <DropdownMenuItem onClick={() => onToggleStatus(user.id, !user.isActive)}>
                  {user.isActive ? 'Deactivate' : 'Activate'}
                </DropdownMenuItem>
              )}
              {onDelete && (
                <DropdownMenuItem onClick={() => onDelete(user.id)} className='text-destructive'>
                  Delete User
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>

      <CardContent className='space-y-4'>
        {/* User ID */}
        <div className='flex items-center space-x-2 text-sm'>
          <span className='font-semibold'>ID:</span>
          <span className='font-mono text-xs bg-muted px-2 py-1 rounded'>{user.id}</span>
        </div>

        {/* Email */}
        <div className='flex items-center space-x-2 text-sm'>
          <Mail className='h-4 w-4 text-muted-foreground' />
          <span className='break-all'>{user.email}</span>
        </div>

        {/* Phone Number */}
        <div className='flex items-center space-x-2 text-sm'>
          <Phone className='h-4 w-4 text-muted-foreground' />
          <span>{user.phoneNumber || 'Not provided'}</span>
        </div>

        {/* Student ID */}
        <div className='flex items-center space-x-2 text-sm'>
          <span className='font-semibold'>Student ID:</span>
          <span>{user.studentId || 'Not provided'}</span>
        </div>

        {/* Term */}
        <div className='flex items-center space-x-2 text-sm'>
          <span className='font-semibold'>Term:</span>
          <span>{
            user.termSeason && user.termYear
              ? `${user.termSeason} ${user.termYear}`
              : user.pastTerms
                ? user.pastTerms
                : 'Not provided'
          }</span>
        </div>

        {/* Status and Role Badges */}
        <div className='flex items-center justify-between pt-2 border-t'>
          <div className='flex items-center space-x-2'>
            {user.isPermanentlyBanned ? (
              <span className='inline-block px-2 py-1 rounded text-white bg-red-600 text-xs font-semibold'>Banned</span>
            ) : (
              <span
                className={
                  user.isActive
                    ? 'inline-block px-2 py-1 rounded text-green-600 bg-green-100 text-xs font-semibold'
                    : 'inline-block px-2 py-1 rounded text-red-600 bg-red-100 text-xs font-semibold'
                }
              >
                {user.isActive ? 'Active' : 'Inactive'}
              </span>
            )}
            <Badge variant='outline'>{formatRole(user.role)}</Badge>
            {user.isPermanentlyBanned ? (
              <Button size='sm' variant='destructive' disabled>
                Ban
              </Button>
            ) : user.isActive ? (
              <Button size='sm' variant='destructive' onClick={() => onBan && onBan(user.id)}>
                Ban
              </Button>
            ) : (
              <Button size='sm' variant='default' onClick={() => onUnban && onUnban(user.id)}>
                Unban
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
