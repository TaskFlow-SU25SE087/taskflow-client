import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/useToast'
import { useState } from 'react'
import DatePicker from 'react-datepicker'
import 'react-datepicker/dist/react-datepicker.css'

interface SprintCreateMenuProps {
  onCreateSprint: (data: { name: string; description: string; startDate: string; endDate: string }) => Promise<boolean>
}

export function SprintCreateMenu({ onCreateSprint }: SprintCreateMenuProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [startDate, setStartDate] = useState<Date | null>(null)
  const [endDate, setEndDate] = useState<Date | null>(null)
  const [status, setStatus] = useState('0') // NotStarted mặc định
  const { toast } = useToast()

  const toISOString = (date: string) => {
    if (!date) return ''
    // Chuyển từ dd/mm/yy sang ISO string
    const [day, month, year] = date.split('/')
    if (!day || !month || !year) return ''
    // Giả sử yy là 2 số cuối, cần chuyển thành 20yy
    const fullYear = year.length === 2 ? '20' + year : year
    const iso = new Date(`${fullYear}-${month.padStart(2, '0')}-${day.padStart(2, '0')}T00:00:00`).toISOString()
    return iso
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) {
      toast({
        title: 'Lỗi',
        description: 'Vui lòng nhập tên Sprint.',
        variant: 'destructive'
      })
      return
    }
    const result = await onCreateSprint({
      name,
      description,
      startDate: startDate ? startDate.toISOString() : '',
      endDate: endDate ? endDate.toISOString() : ''
    })
    // Chỉ đóng dialog nếu tạo thành công (result !== false)
    if (result !== false) {
      setIsOpen(false)
      setName('')
      setDescription('')
      setStartDate(null)
      setEndDate(null)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button className='bg-lavender-500 hover:bg-lavender-700 text-white'>Create Sprint</Button>
      </DialogTrigger>
      <DialogContent className='sm:max-w-[425px] rounded-2xl p-8 shadow-xl bg-white'>
        <DialogHeader>
          <DialogTitle className='text-2xl font-bold mb-1'>Create New Sprint</DialogTitle>
          <DialogDescription className='text-gray-500 mb-4'>
            Set up a new sprint for your project. Add a name and date range.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className='space-y-6'>
          <div className='space-y-1'>
            <Label htmlFor='name' className='text-sm font-semibold text-gray-700'>
              Sprint Name
            </Label>
            <input
              id='name'
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder='Sprint 1'
              required
              className='w-full rounded-lg border border-gray-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-lavender-400 transition-all text-base bg-gray-50'
            />
          </div>
          <div className='space-y-1'>
            <Label htmlFor='description' className='text-sm font-semibold text-gray-700'>
              Description
            </Label>
            <input
              id='description'
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder='Sprint description'
              className='w-full rounded-lg border border-gray-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-lavender-400 transition-all text-base bg-gray-50'
            />
          </div>
          {/* Nhóm hai trường ngày vào một hàng ngang trên desktop, xuống dòng trên mobile */}
          <div className='flex flex-col sm:flex-row gap-4'>
            <div className='flex-1 space-y-1'>
              <Label htmlFor='startDate' className='text-sm font-semibold text-gray-700'>
                Start Date
              </Label>
              <DatePicker
                id='startDate'
                selected={startDate}
                onChange={(date: Date | null) => setStartDate(date)}
                dateFormat='dd/MM/yy'
                placeholderText='dd/mm/yy'
                className='w-full rounded-lg border border-gray-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-lavender-400 transition-all text-base bg-gray-50'
                required
              />
            </div>
            <div className='flex-1 space-y-1'>
              <Label htmlFor='endDate' className='text-sm font-semibold text-gray-700'>
                End Date
              </Label>
              <DatePicker
                id='endDate'
                selected={endDate}
                onChange={(date: Date | null) => setEndDate(date)}
                dateFormat='dd/MM/yy'
                placeholderText='dd/mm/yy'
                className='w-full rounded-lg border border-gray-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-lavender-400 transition-all text-base bg-gray-50'
                required
              />
            </div>
          </div>
          <div className='flex justify-end gap-3 pt-2'>
            <Button
              type='button'
              variant='outline'
              onClick={() => setIsOpen(false)}
              className='rounded-lg px-5 py-2 border border-gray-300 text-gray-700 hover:bg-gray-100 transition-all'
            >
              Cancel
            </Button>
            <Button
              type='submit'
              className='rounded-lg px-5 py-2 bg-lavender-500 hover:bg-lavender-700 text-white font-semibold shadow-md transition-all'
            >
              Create Sprint
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
