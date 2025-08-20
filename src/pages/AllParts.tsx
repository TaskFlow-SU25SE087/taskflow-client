import { useEffect, useState } from 'react'
import { useProjectParts } from '@/hooks/useProjectParts'
import { useGitMembers } from '@/hooks/useGitMembers'
import { useCurrentProject } from '@/hooks/useCurrentProject'

type GitMember = {
  id: string
  projectMemberId: string | null
  gitName: string
  gitEmail: string
  gitAvatarUrl: string
  nameLocal: string
  emailLocal: string
}

type Part = {
  id: string
  name: string
  gitMembers?: GitMember[]
}

function AllParts() {
  const [parts, setParts] = useState<Part[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const { currentProject } = useCurrentProject()
  const { fetchParts } = useProjectParts()
  const { fetchGitMembers } = useGitMembers()

  useEffect(() => {
    async function fetchPartsAndGitMembers() {
      if (!currentProject?.id) {
        setError('Không có project hiện tại')
        setLoading(false)
        return
      }

      try {
        // Lấy danh sách parts của project
        const partsResponse = await fetchParts(currentProject.id)
        const partsData: Part[] = partsResponse?.data?.data || []
        
        // Lấy gitmember cho từng part
        const gitMembersPromises = partsData.map(async (part: Part) => {
          const gitMembers = await fetchGitMembers(currentProject.id, part.id)
          return { ...part, gitMembers: gitMembers || [] }
        })
        
        const partsWithGit = await Promise.all(gitMembersPromises)
        setParts(partsWithGit)
      } catch {
        setError('Lỗi khi tải dữ liệu')
      } finally {
        setLoading(false)
      }
    }
    
    fetchPartsAndGitMembers()
  }, [currentProject?.id, fetchParts, fetchGitMembers])

  if (loading) return <div>Đang tải...</div>
  if (error) return <div>{error}</div>

  return (
    <div>
      <h1>Danh sách Project Parts và Git Members</h1>
      {parts.map((part) => (
        <div key={part.id} style={{ border: '1px solid #ccc', margin: 8, padding: 8 }}>
          <h2>{part.name}</h2>
          <ul>
            {part.gitMembers && part.gitMembers.length > 0 ? (
              part.gitMembers.map((member) => (
                <li key={member.id} style={{ marginBottom: 8 }}>
                  <div>Git Name: {member.gitName || '-'}</div>
                  <div>Git Email: {member.gitEmail || '-'}</div>
                  {member.gitAvatarUrl && <img src={member.gitAvatarUrl} alt='avatar' width={32} height={32} />}
                  <div>Name Local: {member.nameLocal || '-'}</div>
                  <div>Email Local: {member.emailLocal || '-'}</div>
                </li>
              ))
            ) : (
              <li>Không có git member</li>
            )}
          </ul>
        </div>
      ))}
    </div>
  )
}

export default AllParts
