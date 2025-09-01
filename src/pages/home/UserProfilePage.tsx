import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToastContext } from '@/components/ui/ToastContext'
import { Navbar } from '@/components/Navbar'
import axiosClient from '@/configs/axiosClient'
import { useAuth } from '@/hooks/useAuth'
import { ArrowLeft, Camera } from 'lucide-react'
import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'

interface UserProfileData {
  id: string
  avatar: string
  fullName: string
  role: string
  email: string
  phoneNumber: string
  studentId: string
  term: string
  season?: string
  year?: number
  termSeason?: string  // For API response compatibility
  termYear?: number    // For API response compatibility
  pastTerms?: string
}

export default function UserProfilePage() {
  const { user } = useAuth()
  const { showToast } = useToastContext()
  const navigate = useNavigate()
  const [profile, setProfile] = useState<UserProfileData | null>(null)
  const [loading, setLoading] = useState(true)
  const [editData, setEditData] = useState({
    fullName: '',
    phoneNumber: '',
    avatar: ''
  })
  const [saving, setSaving] = useState(false)
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [avatarPreview, setAvatarPreview] = useState<string>('')

  useEffect(() => {
    if (!user?.id) return
    setLoading(true)
    axiosClient
      .get(`/user/${user.id}`)
      .then((res) => {
        // Handle field mapping for initial load
        const profileData = res.data.data
        const normalizedProfile = {
          ...profileData,
          season: profileData.season || profileData.termSeason,
          year: profileData.year || profileData.termYear
        }
        
        setProfile(normalizedProfile)
        setEditData({
          fullName: profileData.fullName || '',
          phoneNumber: profileData.phoneNumber || '',
          avatar: profileData.avatar || ''
        })
      })
      .catch((err) => {
        if (err.response?.status === 404) {
          showToast({ title: 'Not found', description: 'Không tìm thấy profile người dùng.', variant: 'destructive' })
        } else {
          showToast({ title: 'Error', description: 'Failed to load profile', variant: 'destructive' })
        }
      })
      .finally(() => setLoading(false))
  }, [user?.id])

  useEffect(() => {
    if (avatarFile) {
      const reader = new FileReader()
      reader.onload = (e) => {
        setAvatarPreview(e.target?.result as string)
        setEditData((prev) => ({ ...prev, avatar: e.target?.result as string }))
      }
      reader.readAsDataURL(avatarFile)
    } else {
      setAvatarPreview(editData.avatar || '/public/logo.png')
    }
  }, [avatarFile, editData.avatar])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEditData({ ...editData, [e.target.name]: e.target.value })
  }

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null
    setAvatarFile(file)
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user?.id) return
    if (!editData.fullName.trim()) {
      showToast({ title: 'Lỗi', description: 'Vui lòng nhập họ tên.', variant: 'destructive' })
      return
    }
    setSaving(true)
    try {
      const formData = new FormData()
      formData.append('FullName', editData.fullName)
      formData.append('PhoneNumber', editData.phoneNumber)
      if (avatarFile) {
        formData.append('Avatar', avatarFile)
      }
      const res = await axiosClient.put(`/user/${user.id}`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      })
      // Preserve existing profile data and merge with new data
      // Handle field mapping: termSeason -> season, termYear -> year
      const updatedData = res.data.data
      const normalizedData = {
        ...updatedData,
        season: updatedData.termSeason || updatedData.season,
        year: updatedData.termYear || updatedData.year
      }
      
      setProfile((prevProfile) => ({
        ...prevProfile,
        ...normalizedData
      }))
      setEditData({
        fullName: res.data.data.fullName || '',
        phoneNumber: res.data.data.phoneNumber || '',
        avatar: res.data.data.avatar || ''
      })
      setAvatarFile(null)
      showToast({ title: 'Success', description: 'Profile updated!' })
    } catch {
      showToast({ title: 'Error', description: 'Failed to update profile', variant: 'destructive' })
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <div className='flex justify-center items-center min-h-[300px]'>Loading...</div>
  if (!profile) return <div className='text-center'>No profile data found.</div>

  return (
    <div className='flex min-h-screen bg-gray-100'>
      <div className='flex-1'>
        <Navbar
          isSidebarOpen={false}
          toggleSidebar={() => {}}
          customLeft={
            <a href='/' className='flex items-center gap-2'>
              <img src='/logo.png' alt='TaskFlow logo' className='h-6 w-6 sm:h-8 sm:w-8' />
              <span className='text-lg sm:text-xl font-semibold text-gray-800'>TaskFlow</span>
            </a>
          }
        />

        <div className='container mx-auto py-6 max-w-4xl overflow-y-auto'>
          <div className='max-w-lg mx-auto mt-10 p-6 bg-white rounded shadow'>
            <button
              type='button'
              onClick={() => navigate(-1)}
              className='flex items-center gap-2 text-gray-600 hover:text-blue-600 mb-4'
            >
              <ArrowLeft className='w-5 h-5' />
              Back
            </button>
      <h2 className='text-2xl font-bold mb-6'>User Profile</h2>
      <div className='flex flex-col items-center mb-6'>
        <div className='relative w-24 h-24 mb-2'>
          <img
            src={avatarPreview}
            alt='Avatar'
            className='w-24 h-24 rounded-full object-cover border'
            onError={(e) => (e.currentTarget.src = '/public/logo.png')}
          />
          <label
            htmlFor='avatar-upload'
            className='absolute bottom-0 right-0 bg-gray-200 rounded-full p-0.5 cursor-pointer border border-gray-400 hover:bg-gray-300 transition flex items-center justify-center'
            style={{ minWidth: '24px', minHeight: '24px' }}
          >
            <Camera className='w-5 h-5 text-gray-700' />
            <input id='avatar-upload' type='file' accept='image/*' onChange={handleAvatarChange} className='hidden' />
          </label>
        </div>
        <span className='text-xs text-gray-500'>Avatar preview</span>
      </div>
      <form onSubmit={handleSave} className='space-y-4'>
        <div>
          <Label>Email</Label>
          <Input value={profile.email} disabled />
        </div>
        <div>
          <Label>Full Name</Label>
          <Input name='fullName' value={editData.fullName} onChange={handleChange} required />
        </div>
        <div>
          <Label>Phone Number</Label>
          <Input name='phoneNumber' value={editData.phoneNumber} onChange={handleChange} />
        </div>
        <div>
          <Label>Role</Label>
          <Input value={profile.role} disabled />
        </div>
        <div>
          <Label>Student ID</Label>
          <Input value={profile.studentId} disabled />
        </div>
        <div>
          <Label>Semester Season</Label>
          <Input value={profile.season || ''} disabled />
        </div>
        <div>
          <Label>Semester Year</Label>
          <Input value={profile.year || ''} disabled />
        </div>
        <div>
          <Label>Past Semesters</Label>
          <Input value={profile.pastTerms || ''} disabled />
        </div>
        <Button type='submit' disabled={saving} className='bg-blue-600 hover:bg-blue-700 text-white w-full'>
          {saving ? 'Saving...' : 'Save Changes'}
        </Button>
      </form>
    </div>
        </div>
      </div>
    </div>
  )
}
