import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useToastContext } from '@/components/ui/ToastContext'
import { useTags } from '@/hooks/useTags'
import { useState } from 'react'

export default function TagCreateForm() {
  const { createTag, isLoading, error } = useTags()
  const { showToast } = useToastContext()
  const [tag, setTag] = useState({ name: '', description: '', color: '#000000' })

  const handleCreate = async () => {
    if (!tag.name) return
    try {
      const res = await createTag(tag)
      if (res && typeof res === 'object' && 'code' in res && 'message' in res) {
        showToast({ title: res.code === 200 ? 'Success' : 'Error', description: String(res.message) || 'Tag created successfully' })
      } else {
        showToast({ title: 'Success', description: 'Tag created successfully' })
      }
    } catch (error) {
      const err = error as any
      showToast({ title: 'Error', description: err?.response?.data?.message || err?.message || 'Failed to create tag', variant: 'destructive' })
    }
  }

  return (
    <div className='p-4 border rounded-md bg-white max-w-md'>
      <h2 className='font-bold mb-2'>Create Tag</h2>
      {isLoading && <div>Loading...</div>}
      {error && <div className='text-red-500'>{error.message}</div>}
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
