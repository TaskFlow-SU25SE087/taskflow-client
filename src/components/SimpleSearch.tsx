import { Input } from '@/components/ui/input'
import { Search } from 'lucide-react'
import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'

export function SimpleSearch() {
  const [searchQuery, setSearchQuery] = useState('')
  const navigate = useNavigate()

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      // Navigate to projects page with search query
      navigate(`/projects?search=${encodeURIComponent(searchQuery.trim())}`)
      setSearchQuery('')
    }
  }

  return (
    <form onSubmit={handleSearch} className="relative w-[300px] xl:w-[400px]">
      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 transform text-gray-400" />
      <Input
        placeholder="Search projects..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        className="w-full rounded-lg bg-gray-100 pl-10 focus-visible:ring-offset-0 focus-visible:ring-0"
      />
    </form>
  )
} 