import { useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useTags } from '@/hooks/useTags'
import { toast } from '@/hooks/use-toast'

export default function ProjectTagManager() {
	const { tags, isLoading, error, createTag, updateTag, deleteTag } = useTags()
	const [newTag, setNewTag] = useState({ name: '', description: '', color: '#000000' })
	const [editingTagId, setEditingTagId] = useState<string | null>(null)
	const [editingTag, setEditingTag] = useState({ name: '', description: '', color: '#000000' })
	const [search, setSearch] = useState('')
	const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)
	const inputRef = useRef<HTMLInputElement>(null)

	// Focus input khi mở form
	const focusInput = () => {
		setTimeout(() => inputRef.current?.focus(), 100)
	}

	// Tạo tag mới
	const handleCreate = async () => {
		if (!newTag.name) return toast({ title: 'Tên tag không được để trống', variant: 'destructive' })
		const ok = await createTag(newTag)
		if (ok) {
			toast({ title: 'Tạo tag thành công!' })
			setNewTag({ name: '', description: '', color: '#000000' })
			focusInput()
		} else {
			toast({ title: 'Tạo tag thất bại', variant: 'destructive' })
		}
	}

	// Sửa tag inline
	const startEdit = (tag: { id: string; name: string; description: string; color: string }) => {
		setEditingTagId(tag.id)
		setEditingTag({ name: tag.name, description: tag.description, color: tag.color })
	}
	const handleEdit = async (tagId: string) => {
		if (!editingTag.name) return toast({ title: 'Tên tag không được để trống', variant: 'destructive' })
		const ok = await updateTag(tagId, editingTag)
		if (ok) {
			toast({ title: 'Cập nhật tag thành công!' })
			setEditingTagId(null)
		} else {
			toast({ title: 'Cập nhật tag thất bại', variant: 'destructive' })
		}
	}

	// Xác nhận xóa tag
	const handleDelete = async (tagId: string) => {
		setConfirmDeleteId(tagId)
	}
	const confirmDelete = async (tagId: string) => {
		const ok = await deleteTag(tagId)
		if (ok) toast({ title: 'Xóa tag thành công!' })
		else toast({ title: 'Xóa tag thất bại', variant: 'destructive' })
		setConfirmDeleteId(null)
	}

	// Lọc tag
	const filteredTags = tags.filter((tag) => tag.name.toLowerCase().includes(search.toLowerCase()))

	return (
		<div className='p-4 border rounded-md bg-white mb-4 max-w-xl'>
			<h2 className='font-bold mb-2'>Tags</h2>
			<div className='flex gap-2 mb-2'>
				<Input
					ref={inputRef}
					placeholder='Tag name'
					value={newTag.name}
					onChange={(e) => setNewTag({ ...newTag, name: e.target.value })}
				/>
				<Input
					placeholder='Description'
					value={newTag.description}
					onChange={(e) => setNewTag({ ...newTag, description: e.target.value })}
				/>
				<Input
					type='color'
					value={newTag.color}
					onChange={(e) => setNewTag({ ...newTag, color: e.target.value })}
					style={{ width: 40, padding: 0 }}
				/>
				<Button onClick={handleCreate} disabled={isLoading || !newTag.name}>
					{isLoading ? 'Creating...' : 'Add'}
				</Button>
			</div>
			<Input
				placeholder='Tìm kiếm tag...'
				className='mb-3'
				value={search}
				onChange={(e) => setSearch(e.target.value)}
			/>
			{isLoading && <div>Loading...</div>}
			{error && <div className='text-red-500'>{error.message}</div>}
			<ul className='mb-2'>
				{filteredTags.map((tag) => (
					<li key={tag.id} className='flex items-center gap-2 mb-1'>
						<span style={{ color: tag.color, fontWeight: 600 }}>{tag.name}</span>
						<span className='text-xs text-gray-500'>{tag.description}</span>
						{editingTagId === tag.id ? (
							<>
								<Input
									value={editingTag.name}
									onChange={(e) => setEditingTag({ ...editingTag, name: e.target.value })}
									className='w-24'
								/>
								<Input
									value={editingTag.description}
									onChange={(e) => setEditingTag({ ...editingTag, description: e.target.value })}
									className='w-32'
								/>
								<Input
									type='color'
									value={editingTag.color}
									onChange={(e) => setEditingTag({ ...editingTag, color: e.target.value })}
									style={{ width: 40, padding: 0 }}
								/>
								<Button size='sm' onClick={() => handleEdit(tag.id)}>
									Lưu
								</Button>
								<Button size='sm' variant='outline' onClick={() => setEditingTagId(null)}>
									Hủy
								</Button>
							</>
						) : (
							<>
								<Button size='sm' variant='outline' onClick={() => startEdit(tag)}>
									Edit
								</Button>
								<Button size='sm' variant='destructive' onClick={() => handleDelete(tag.id)}>
									Delete
								</Button>
							</>
						)}
						{confirmDeleteId === tag.id && (
							<div className='ml-2 flex gap-2'>
								<span>Bạn chắc chắn muốn xóa?</span>
								<Button size='sm' variant='destructive' onClick={() => confirmDelete(tag.id)}>
									Xác nhận
								</Button>
								<Button size='sm' variant='outline' onClick={() => setConfirmDeleteId(null)}>
									Hủy
								</Button>
							</div>
						)}
					</li>
				))}
			</ul>
		</div>
	)
}