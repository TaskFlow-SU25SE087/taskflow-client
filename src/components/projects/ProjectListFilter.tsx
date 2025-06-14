import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
import { Filter } from 'lucide-react'

interface FilterMenuProps {
  value: string
  onValueChange: (value: string) => void
}

export function ProjectListFilter({ value, onValueChange }: FilterMenuProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant='outline' className='bg-white hover:bg-gray-50 focus:ring-0'>
          <Filter className='mr-2 h-4 w-4' />
          Filter
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className='w-56'>
        <DropdownMenuLabel>Filter by Status</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuRadioGroup value={value} onValueChange={onValueChange}>
          <DropdownMenuRadioItem value='all'>All Projects</DropdownMenuRadioItem>
          <DropdownMenuRadioItem value='active'>Active</DropdownMenuRadioItem>
          <DropdownMenuRadioItem value='completed'>Completed</DropdownMenuRadioItem>
          <DropdownMenuRadioItem value='archived'>Archived</DropdownMenuRadioItem>
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
