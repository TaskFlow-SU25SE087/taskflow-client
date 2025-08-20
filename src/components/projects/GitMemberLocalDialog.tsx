import { useGitMembers } from '@/hooks/useGitMembers'
import { GitMemberFull, ProjectMember } from '@/types/project'
import { Edit, GitBranch, Mail, Plus, Settings, User, UserPlus, Users } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Button } from '../ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog'
import { Input } from '../ui/input'
import { Label } from '../ui/label'

interface GitMemberLocalDialogProps {
  projectId: string
  projectPartId: string
  projectMembers: ProjectMember[]
  isOpen: boolean
  onOpenChange: (open: boolean) => void
}

export function GitMemberLocalDialog({
  projectId,
  projectPartId,
  projectMembers,
  isOpen,
  onOpenChange
}: GitMemberLocalDialogProps) {
  const { loading, gitMembers, fetchGitMembers, addGitMember, updateGitMember } = useGitMembers()
  const [editingMember, setEditingMember] = useState<GitMemberFull | null>(null)
  const [showAddForm, setShowAddForm] = useState(false)
  const [selectedMemberId, setSelectedMemberId] = useState<string>('')
  const [formData, setFormData] = useState({ nameLocal: '', emailLocal: '' })
  const [hasFetched, setHasFetched] = useState(false)

  useEffect(() => {
    if (isOpen && projectId && projectPartId && !hasFetched) {
      setHasFetched(true)
      fetchGitMembers(projectId, projectPartId).catch(err => {
        console.warn('Failed to fetch git members:', err)
        // Không hiển thị error toast vì có thể GET endpoint không tồn tại
      })
    }
  }, [isOpen, projectId, projectPartId, fetchGitMembers, hasFetched])

  // Reset hasFetched when dialog closes
  useEffect(() => {
    if (!isOpen) {
      setHasFetched(false)
    }
  }, [isOpen])

  const handleAddGitMember = async () => {
    if (!selectedMemberId || !formData.nameLocal || !formData.emailLocal) {
      return
    }

    console.log('Adding git member with:', {
      projectId,
      projectPartId,
      selectedMemberId,
      formData,
      projectMembers: projectMembers.map(m => ({ id: m.id, userId: m.userId, fullName: m.fullName }))
    })

    try {
      await addGitMember(projectId, projectPartId, selectedMemberId, formData)
      setShowAddForm(false)
      setSelectedMemberId('')
      setFormData({ nameLocal: '', emailLocal: '' })
    } catch (error) {
      // Error is handled by the hook
    }
  }

  const handleUpdateGitMember = async () => {
    if (!editingMember || !formData.nameLocal || !formData.emailLocal) {
      return
    }

    try {
      await updateGitMember(projectId, projectPartId, editingMember.id, formData)
      setEditingMember(null)
      setFormData({ nameLocal: '', emailLocal: '' })
    } catch (error) {
      // Error is handled by the hook
    }
  }

  const handleEdit = (member: GitMemberFull) => {
    setEditingMember(member)
    setFormData({ nameLocal: member.nameLocal, emailLocal: member.emailLocal })
  }

  const handleCancel = () => {
    setShowAddForm(false)
    setEditingMember(null)
    setSelectedMemberId('')
    setFormData({ nameLocal: '', emailLocal: '' })
  }

  const getProjectMemberById = (id: string) => {
    return projectMembers.find(member => (member.id || member.userId) === id)
  }

  const getGitMemberByProjectMemberId = (projectMemberId: string) => {
    return gitMembers.find(gitMember => gitMember.projectMemberId === projectMemberId)
  }

  const membersWithoutGitLocal = projectMembers.filter(member => 
    !getGitMemberByProjectMemberId(member.id || member.userId)
  )

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto bg-gradient-to-br from-white to-blue-50/30 border-0 shadow-2xl">
        <DialogHeader className="pb-6">
          <DialogTitle className="flex items-center gap-3 text-2xl font-bold bg-gradient-to-r from-gray-900 to-blue-600 bg-clip-text text-transparent">
            <div className="p-2 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg">
              <Users className="h-6 w-6 text-white" />
            </div>
            Git Member Local Management
          </DialogTitle>
          <p className="text-gray-600 mt-2">
            Configure local Git identity for project members in this component
          </p>
        </DialogHeader>

        <div className="space-y-8">
          {/* Add New Git Member Section */}
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gradient-to-r from-green-100 to-emerald-100 rounded-lg">
                  <UserPlus className="h-5 w-5 text-green-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900">Add Git Member Local</h3>
              </div>
              {!showAddForm && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowAddForm(true)}
                  disabled={membersWithoutGitLocal.length === 0 || loading}
                  className="bg-gradient-to-r from-green-50 to-emerald-50 border-green-200 hover:from-green-100 hover:to-emerald-100 hover:border-green-300 transition-all duration-200"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add New
                </Button>
              )}
            </div>

            {showAddForm && (
              <div className="p-6 border border-green-200 rounded-xl bg-gradient-to-r from-green-50/50 to-emerald-50/50 space-y-6">
                <div>
                  <Label htmlFor="member-select" className="text-sm font-medium text-gray-700 mb-2 block">
                    Select Project Member
                  </Label>
                  <select
                    id="member-select"
                    value={selectedMemberId}
                    onChange={(e) => setSelectedMemberId(e.target.value)}
                    className="w-full p-3 border border-green-200 rounded-lg bg-white focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-200"
                  >
                    <option value="">-- Select a member --</option>
                    {membersWithoutGitLocal.map((member) => (
                      <option key={member.userId} value={member.id || member.userId}>
                        {member.fullName || member.email} ({member.role})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="name-local" className="text-sm font-medium text-gray-700 mb-2 block">
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4" />
                        Local Name
                      </div>
                    </Label>
                    <Input
                      id="name-local"
                      value={formData.nameLocal}
                      onChange={(e) => setFormData(prev => ({ ...prev, nameLocal: e.target.value }))}
                      placeholder="Enter local name for Git"
                      className="border-green-200 focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    />
                  </div>

                  <div>
                    <Label htmlFor="email-local" className="text-sm font-medium text-gray-700 mb-2 block">
                      <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4" />
                        Local Email
                      </div>
                    </Label>
                    <Input
                      id="email-local"
                      type="email"
                      value={formData.emailLocal}
                      onChange={(e) => setFormData(prev => ({ ...prev, emailLocal: e.target.value }))}
                      placeholder="Enter local email for Git"
                      className="border-green-200 focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    />
                  </div>
                </div>

                <div className="flex gap-3 pt-4">
                  <Button 
                    onClick={handleAddGitMember} 
                    disabled={loading}
                    className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white"
                  >
                    <UserPlus className="h-4 w-4 mr-2" />
                    Add Git Member
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={handleCancel}
                    className="border-gray-300 hover:bg-gray-50"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* Existing Git Members Section */}
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-r from-blue-100 to-purple-100 rounded-lg">
                <Settings className="h-5 w-5 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900">Existing Git Members</h3>
            </div>
            
            {loading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-gray-600">Loading git members...</p>
              </div>
            ) : gitMembers.length === 0 ? (
              <div className="text-center py-12">
                <div className="p-4 bg-gray-100 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                  <Users className="h-8 w-8 text-gray-400" />
                </div>
                <h4 className="text-lg font-medium text-gray-900 mb-2">No Git Members Configured</h4>
                <p className="text-gray-600">
                  Add your first Git member local configuration to get started.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {gitMembers.map((gitMember) => {
                  const projectMember = getProjectMemberById(gitMember.projectMemberId)
                  const isEditing = editingMember?.id === gitMember.id

                  return (
                    <div key={gitMember.id} className="p-6 border border-blue-200 rounded-xl bg-gradient-to-r from-blue-50/50 to-purple-50/50 hover:shadow-md transition-all duration-200">
                      {isEditing ? (
                        <div className="space-y-4">
                          {gitMember.gitAvatarUrl && (
                            <div className="flex items-center gap-3 mb-2">
                              <img src={gitMember.gitAvatarUrl} alt="avatar" className="w-12 h-12 rounded-full border-2 border-blue-300 shadow" />
                              <span className="text-sm text-gray-700">Git Avatar</span>
                            </div>
                          )}
                          <div>
                            <Label className="text-sm font-medium text-gray-700 mb-2 block">Project Member</Label>
                            <div className="p-3 bg-gray-100 rounded-lg text-sm border">
                              <div className="flex items-center gap-2">
                                <User className="h-4 w-4 text-gray-500" />
                                {projectMember?.fullName || projectMember?.email} ({projectMember?.role})
                              </div>
                            </div>
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <Label htmlFor={`name-${gitMember.id}`} className="text-sm font-medium text-gray-700 mb-2 block">
                                <div className="flex items-center gap-2">
                                  <User className="h-4 w-4" />
                                  Local Name
                                </div>
                              </Label>
                              <Input
                                id={`name-${gitMember.id}`}
                                value={formData.nameLocal}
                                onChange={(e) => setFormData(prev => ({ ...prev, nameLocal: e.target.value }))}
                                placeholder="Enter local name for Git"
                                className="border-blue-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                              />
                            </div>

                            <div>
                              <Label htmlFor={`email-${gitMember.id}`} className="text-sm font-medium text-gray-700 mb-2 block">
                                <div className="flex items-center gap-2">
                                  <Mail className="h-4 w-4" />
                                  Local Email
                                </div>
                              </Label>
                              <Input
                                id={`email-${gitMember.id}`}
                                type="email"
                                value={formData.emailLocal}
                                onChange={(e) => setFormData(prev => ({ ...prev, emailLocal: e.target.value }))}
                                placeholder="Enter local email for Git"
                                className="border-blue-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                              />
                            </div>
                          </div>

                          <div className="flex gap-3 pt-4">
                            <Button 
                              onClick={handleUpdateGitMember} 
                              disabled={loading}
                              className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white"
                            >
                              <Settings className="h-4 w-4 mr-2" />
                              Update Git Member
                            </Button>
                            <Button 
                              variant="outline" 
                              onClick={handleCancel}
                              className="border-gray-300 hover:bg-gray-50"
                            >
                              Cancel
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          <div className="flex items-start justify-between">
                            <div className="flex items-center gap-3">
                              <div className="p-2 bg-gradient-to-r from-blue-100 to-purple-100 rounded-lg">
                                <User className="h-5 w-5 text-blue-600" />
                              </div>
                              <div>
                                <div className="font-semibold text-gray-900">
                                  {projectMember?.fullName || projectMember?.email}
                                </div>
                                <div className="text-sm text-gray-500">
                                  Role: {projectMember?.role}
                                </div>
                              </div>
                            </div>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleEdit(gitMember)}
                              disabled={loading}
                              className="border-blue-200 hover:bg-blue-50"
                            >
                              <Edit className="h-4 w-4 mr-1" />
                              Edit
                            </Button>
                          </div>
                          
                          <div className="space-y-3 p-4 bg-white rounded-lg border border-blue-100">
                            <div className="flex items-center gap-3">
                              <GitBranch className="h-4 w-4 text-blue-500" />
                              <div>
                                <div className="text-sm font-medium text-gray-700">Git Name</div>
                                <div className="text-sm text-gray-900">{gitMember.gitName || <span className='text-gray-400 italic'>-</span>}</div>
                              </div>
                            </div>
                            <div className="flex items-center gap-3">
                              <Mail className="h-4 w-4 text-blue-500" />
                              <div>
                                <div className="text-sm font-medium text-gray-700">Git Email</div>
                                <div className="text-sm text-gray-900">{gitMember.gitEmail || <span className='text-gray-400 italic'>-</span>}</div>
                              </div>
                            </div>
                            {gitMember.gitAvatarUrl && (
                              <div className="flex items-center gap-3">
                                <img src={gitMember.gitAvatarUrl} alt="avatar" className="w-8 h-8 rounded-full border" />
                                <div className="text-sm text-gray-700">Git Avatar</div>
                              </div>
                            )}
                            <div className="flex items-center gap-3">
                              <GitBranch className="h-4 w-4 text-green-500" />
                              <div>
                                <div className="text-sm font-medium text-gray-700">Local Name</div>
                                <div className="text-sm text-gray-900">{gitMember.nameLocal || <span className='text-gray-400 italic'>-</span>}</div>
                              </div>
                            </div>
                            <div className="flex items-center gap-3">
                              <Mail className="h-4 w-4 text-purple-500" />
                              <div>
                                <div className="text-sm font-medium text-gray-700">Local Email</div>
                                <div className="text-sm text-gray-900">{gitMember.emailLocal || <span className='text-gray-400 italic'>-</span>}</div>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
} 