import { Check, ChevronsUpDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from '@/components/ui/command'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { cn } from '@/lib/utils'
import { useState } from 'react'

interface FilterOption {
  value: string
  label: string
}

interface FilterMenuProps {
  options: FilterOption[]
  selectedValues: string[]
  onSelectionChange: (values: string[]) => void
  triggerContent: React.ReactNode
}

export function TaskFilterMenu({ options, selectedValues, onSelectionChange, triggerContent }: FilterMenuProps) {
  const [open, setOpen] = useState(false)

  const toggleOption = (value: string) => {
    const newSelection = selectedValues.includes(value)
      ? selectedValues.filter((v) => v !== value)
      : [...selectedValues, value]
    onSelectionChange(newSelection)
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant='outline' role='combobox' aria-expanded={open} className='justify-between'>
          {triggerContent}
          <ChevronsUpDown className='ml-2 h-4 w-4 shrink-0 opacity-50' />
        </Button>
      </PopoverTrigger>
      <PopoverContent className='w-[200px] p-0'>
        <Command>
          <CommandInput placeholder='Search filters...' />
          <CommandEmpty>No filter found.</CommandEmpty>
          <CommandGroup>
            {options.map((option) => (
              <CommandItem key={option.value} onSelect={() => toggleOption(option.value)}>
                <Check
                  className={cn('mr-2 h-4 w-4', selectedValues.includes(option.value) ? 'opacity-100' : 'opacity-0')}
                />
                {option.label}
              </CommandItem>
            ))}
          </CommandGroup>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
