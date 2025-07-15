import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useToastContext } from '@/components/ui/ToastContext'
import { useTags } from '@/hooks/useTags'
import { useState } from 'react'

export default function TagCreateForm() {
  const { createTag, isLoading, error } = useTags()
  const { showToast } = useToastContext()
  const [tag, setTag] = useState({ name: '', description: '', color: '#000000' })
  const [success, setSuccess] = useState('')

  const handleCreate = async () => {
    if (!tag.name) return
    try {
      const res = await createTag(tag)
      if (res?.code === 200) {
        showToast({ title: 'Success', description: res?.message || 'Tag created successfully' })
        setTag({ name: '', description: '', color: '#000000' })
      } else {
        showToast({ title: 'Error', description: res?.message || 'Failed to create tag', variant: 'destructive' })
      }
    } catch (error: any) {
      showToast({ title: 'Error', description: error.response?.data?.message || error.message || 'Failed to create tag', variant: 'destructive' })
    }
  }

  return (
    <div className='p-4 border rounded-md bg-white max-w-md'>
      <h2 className='font-bold mb-2'>Create Tag</h2>
      {isLoading && <div>Loading...</div>}
      {error && <div className='text-red-500'>{error.message}</div>}
      {success && <div className='text-green-600 mb-2'>{success}</div>}
      <div className='flex flex-col gap-2 mb-2'>
        <Input placeholder='Tag name' value={tag.name} onChange={(e) => setTag({ ...tag, name: e.target.value })} />
        <Input
          placeholder='Description'
          value={tag.description}
          onChange={(e) => setTag({ ...tag, description: e.target.value })}
        />
        <Input
          type='color'
          value={tag.color}
          onChange={(e) => setTag({ ...tag, color: e.target.value })}
          style={{ width: 40, padding: 0 }}
        />
      </div>
      <Button onClick={handleCreate} disabled={isLoading || !tag.name}>
        {isLoading ? 'Creating...' : 'Add Tag'}
      </Button>
    </div>
  )
}
