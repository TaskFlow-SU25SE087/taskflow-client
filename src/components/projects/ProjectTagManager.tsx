import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { useToastContext } from '@/components/ui/ToastContext'
import { useTags } from '@/hooks/useTags'
import { Check, Edit3, Plus, Search, Tag, Trash2, X } from 'lucide-react'
import { useRef, useState } from 'react'

export default function ProjectTagManager({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const { tags, isLoading, error, createTag, updateTag, deleteTag } = useTags()
  const [newTag, setNewTag] = useState({ name: '', description: '', color: '#7B61FF' })
  const [editingTagId, setEditingTagId] = useState<string | null>(null)
  const [editingTag, setEditingTag] = useState({ name: '', description: '', color: '#7B61FF' })
  const [search, setSearch] = useState('')
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const { showToast } = useToastContext()

  // Focus input when opening form
  const focusInput = () => {
    setTimeout(() => inputRef.current?.focus(), 100)
  }

  // Create new tag
  const handleCreate = async () => {
    if (!newTag.name.trim()) {
      showToast({ title: 'Tag name is required', variant: 'destructive' })
      return
    }
    const res = await createTag(newTag)
    console.log('Create tag response:', res)
    if (res) {
      showToast({ title: 'Success', description: 'Tag created successfully' })
      setNewTag({ name: '', description: '', color: '#7B61FF' })
      focusInput()
    } else {
      showToast({ title: 'Error', description: 'Failed to create tag', variant: 'destructive' })
    }
  }

  // Edit tag inline
  const startEdit = (tag: { id: string; name: string; description: string; color: string }) => {
    setEditingTagId(tag.id)
    setEditingTag({ name: tag.name, description: tag.description, color: tag.color })
  }

  const handleEdit = async (tagId: string) => {
    if (!editingTag.name.trim()) {
      showToast({ title: 'Tag name is required', variant: 'destructive' })
      return
    }
    const res = await updateTag(tagId, editingTag)
    console.log('Edit tag response:', res)
    if (res) {
      showToast({ title: 'Success', description: 'Tag updated successfully' })
      setEditingTagId(null)
    } else {
      showToast({ title: 'Error', description: 'Failed to update tag', variant: 'destructive' })
    }
  }

  const cancelEdit = () => {
    setEditingTagId(null)
    setEditingTag({ name: '', description: '', color: '#7B61FF' })
  }

  // Delete tag with confirmation
  const handleDelete = async (tagId: string) => {
    setConfirmDeleteId(tagId)
  }

  const confirmDelete = async (tagId: string) => {
    const res = await deleteTag(tagId)
    console.log('Delete tag response:', res)
    if (res) {
      showToast({ title: 'Success', description: 'Tag deleted successfully' })
    } else {
      showToast({ title: 'Error', description: 'Failed to delete tag', variant: 'destructive' })
    }
    setConfirmDeleteId(null)
  }

  const cancelDelete = () => {
    setConfirmDeleteId(null)
  }

  // Filter tags
  const filteredTags = tags.filter(
    (tag) =>
      tag.name.toLowerCase().includes(search.toLowerCase()) ||
      tag.description.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className='max-w-2xl w-full p-0 bg-transparent border-0 shadow-none'>
        <div className='sr-only'>
          <h2 id='project-tag-manager-title'>Project Tags</h2>
        </div>
        <Card className='w-full max-w-2xl mx-auto shadow-lg border-0 bg-white'>
          <CardHeader className='bg-white text-gray-900 rounded-t-lg flex flex-row items-center justify-between'>
            <div className='flex items-center gap-3'>
              <div className='p-2 bg-gray-100 rounded-lg'>
                <Tag className='w-6 h-6' />
              </div>
              <div>
                <CardTitle className='text-2xl font-bold'>Project Tags</CardTitle>
                <CardDescription className='text-gray-500'>
                  Organize your projects with custom tags and colors
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className='p-6'>
            {/* Create New Tag Section */}
            <div className='bg-gray-50 rounded-lg p-6 mb-6 border border-gray-200'>
              <h3 className='text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2'>
                <Plus className='w-5 h-5 text-lavender-600' />
                Create New Tag
              </h3>

              <div className='grid grid-cols-1 md:grid-cols-4 gap-4 items-end'>
                <div className='md:col-span-1'>
                  <Label htmlFor='tag-name' className='text-sm font-medium text-gray-700'>
                    Name
                  </Label>
                  <Input
                    id='tag-name'
                    ref={inputRef}
                    placeholder='Enter tag name'
                    value={newTag.name}
                    onChange={(e) => setNewTag({ ...newTag, name: e.target.value })}
                    className='mt-1'
                  />
                </div>
                <div className='md:col-span-2'>
                  <Label htmlFor='tag-description' className='text-sm font-medium text-gray-700'>
                    Description
                  </Label>
                  <Input
                    id='tag-description'
                    placeholder='Enter tag description'
                    value={newTag.description}
                    onChange={(e) => setNewTag({ ...newTag, description: e.target.value })}
                    className='mt-1'
                  />
                </div>
                <div className='flex items-center gap-2'>
                  <div className='flex flex-col items-start'>
                    <Label htmlFor='tag-color' className='text-sm font-medium text-gray-700'>
                      Color
                    </Label>
                    <div className='flex items-center gap-2 mt-1'>
                      <Input
                        id='tag-color'
                        type='color'
                        value={newTag.color}
                        onChange={(e) => setNewTag({ ...newTag, color: e.target.value })}
                        className='w-12 h-10 p-1 rounded border-gray-300'
                      />
                      <div
                        className='w-8 h-8 rounded-full border-2 border-gray-300'
                        style={{ backgroundColor: newTag.color }}
                      />
                    </div>
                  </div>
                </div>
                <div className='flex items-end h-full'>
                  <Button
                    onClick={handleCreate}
                    disabled={isLoading || !newTag.name.trim()}
                    // className='bg-lavender-600 hover:bg-lavender-700 text-white px-6'
                  >
                    {isLoading ? 'Creating...' : 'Add Tag'}
                  </Button>
                </div>
              </div>
            </div>

            {/* Search Section */}
            <div className='mb-6'>
              <div className='relative'>
                <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4' />
                <Input
                  placeholder='Search tags by name or description...'
                  className='pl-10 bg-white border-gray-300'
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
            </div>

            <Separator className='mb-6' />

            {/* Tags List */}
            <div className='space-y-4'>
              <div className='flex items-center justify-between'>
                <h3 className='text-lg font-semibold text-gray-900'>All Tags ({filteredTags.length})</h3>
              </div>

              {error && (
                <div className='bg-red-50 border border-red-200 rounded-lg p-4 text-red-700'>{error.message}</div>
              )}

              {isLoading && (
                <div className='flex items-center justify-center py-8'>
                  <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-lavender-600'></div>
                </div>
              )}

              {!isLoading && filteredTags.length === 0 && (
                <div className='text-center py-12 text-gray-500'>
                  <Tag className='w-12 h-12 mx-auto mb-4 text-gray-300' />
                  <p className='text-lg'>No tags found</p>
                  <p className='text-sm'>Create your first tag to get started</p>
                </div>
              )}

              <div className='grid gap-4'>
                {filteredTags.map((tag) => (
                  <Card key={tag.id} className='border border-gray-200 hover:shadow-md transition-all duration-200'>
                    <CardContent className='p-4'>
                      {editingTagId === tag.id ? (
                        // Edit Mode
                        <div className='space-y-4'>
                          <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
                            <Input
                              value={editingTag.name}
                              onChange={(e) => setEditingTag({ ...editingTag, name: e.target.value })}
                              placeholder='Tag name'
                              className='font-medium'
                            />
                            <Input
                              value={editingTag.description}
                              onChange={(e) => setEditingTag({ ...editingTag, description: e.target.value })}
                              placeholder='Tag description'
                            />
                            <div className='flex items-center gap-2'>
                              <Input
                                type='color'
                                value={editingTag.color}
                                onChange={(e) => setEditingTag({ ...editingTag, color: e.target.value })}
                                className='w-12 h-10 p-1'
                              />
                              <div
                                className='w-8 h-8 rounded-full border-2 border-gray-300'
                                style={{ backgroundColor: editingTag.color }}
                              />
                            </div>
                          </div>

                          <div className='flex gap-2'>
                            <Button
                              size='sm'
                              onClick={() => handleEdit(tag.id)}
                              className='bg-green-600 hover:bg-green-700 text-white'
                            >
                              <Check className='w-4 h-4 mr-1' />
                              Save
                            </Button>
                            <Button size='sm' variant='outline' onClick={cancelEdit}>
                              <X className='w-4 h-4 mr-1' />
                              Cancel
                            </Button>
                          </div>
                        </div>
                      ) : confirmDeleteId === tag.id ? (
                        // Delete Confirmation Mode
                        <div className='space-y-4'>
                          <div className='flex items-center gap-3'>
                            <Badge style={{ backgroundColor: tag.color, color: 'white' }}>{tag.name}</Badge>
                            <span className='text-gray-600'>{tag.description}</span>
                          </div>

                          <div className='bg-red-50 border border-red-200 rounded-lg p-4'>
                            <p className='text-red-800 font-medium mb-3'>Are you sure you want to delete this tag?</p>
                            <div className='flex gap-2'>
                              <Button size='sm' variant='destructive' onClick={() => confirmDelete(tag.id)}>
                                <Check className='w-4 h-4 mr-1' />
                                Confirm Delete
                              </Button>
                              <Button size='sm' variant='outline' onClick={cancelDelete}>
                                <X className='w-4 h-4 mr-1' />
                                Cancel
                              </Button>
                            </div>
                          </div>
                        </div>
                      ) : (
                        // Display Mode
                        <div className='flex items-center justify-between'>
                          <div className='flex items-center gap-4'>
                            <Badge
                              style={{ backgroundColor: tag.color, color: 'white' }}
                              className='text-sm font-medium px-3 py-1'
                            >
                              {tag.name}
                            </Badge>
                            <span className='text-gray-600 text-sm'>{tag.description || 'No description'}</span>
                          </div>

                          <div className='flex gap-2'>
                            <Button
                              size='sm'
                              variant='outline'
                              onClick={() => startEdit(tag)}
                              className='text-lavender-600 border-lavender-300 hover:bg-lavender-50'
                            >
                              <Edit3 className='w-4 h-4' />
                            </Button>
                            <Button
                              size='sm'
                              variant='outline'
                              onClick={() => handleDelete(tag.id)}
                              className='text-red-600 border-red-300 hover:bg-red-50'
                            >
                              <Trash2 className='w-4 h-4' />
                            </Button>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </DialogContent>
    </Dialog>
  )
}
