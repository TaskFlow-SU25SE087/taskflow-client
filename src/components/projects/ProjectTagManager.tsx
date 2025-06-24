import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useTags } from '@/hooks/useTags'
import { useState } from 'react'

export default function ProjectTagManager() {
  const { tags, isLoading, error, createTag, updateTag, deleteTag } = useTags()
  const [newTag, setNewTag] = useState({ name: '', description: '', color: '#000000' })

  const handleCreate = () => {
    if (!newTag.name) return
    createTag(newTag)
    setNewTag({ name: '', description: '', color: '#000000' })
  }

  const handleEdit = (tag) => {
    const name = prompt('Tag name', tag.name) || tag.name
    const description = prompt('Description', tag.description) || tag.description
    const color = prompt('Color', tag.color) || tag.color
    updateTag(tag.id, { name, description, color })
  }

  return (
    <div className="p-4 border rounded-md bg-white mb-4">
      <h2 className="font-bold mb-2">Tags</h2>
      {isLoading && <div>Loading...</div>}
      {error && <div className="text-red-500">{error.message}</div>}
      <ul className="mb-2">
        {tags.map(tag => (
          <li key={tag.id} className="flex items-center gap-2 mb-1">
            <span style={{ color: tag.color, fontWeight: 600 }}>{tag.name}</span>
            <span className="text-xs text-gray-500">{tag.description}</span>
            <Button size="sm" variant="outline" onClick={() => handleEdit(tag)}>Edit</Button>
            <Button size="sm" variant="destructive" onClick={() => deleteTag(tag.id)}>Delete</Button>
          </li>
        ))}
      </ul>
      <div className="flex gap-2">
        <Input
          placeholder="Tag name"
          value={newTag.name}
          onChange={e => setNewTag({ ...newTag, name: e.target.value })}
        />
        <Input
          placeholder="Description"
          value={newTag.description}
          onChange={e => setNewTag({ ...newTag, description: e.target.value })}
        />
        <Input
          type="color"
          value={newTag.color}
          onChange={e => setNewTag({ ...newTag, color: e.target.value })}
          style={{ width: 40, padding: 0 }}
        />
        <Button onClick={handleCreate}>Add</Button>
      </div>
    </div>
  )
} 