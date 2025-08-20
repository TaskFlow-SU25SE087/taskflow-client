import axiosClient from '../configs/axiosClient'

export async function getGitMembers(projectId: string, projectPartId: string) {
  return axiosClient.get(`/projects/${projectId}/parts/${projectPartId}/gitmember`)
}

// POST: Thêm Git Member Local cho Project Member
export async function addGitMemberLocal(
  projectId: string,
  projectPartId: string,
  projectMemberId: string,
  data: { nameLocal: string; emailLocal: string }
) {
  return axiosClient.post(
    `/projects/${projectId}/parts/${projectPartId}/gitmember/${projectMemberId}`,
    data,
    {
      headers: {
        'Content-Type': 'application/json-patch+json'
      }
    }
  )
}

// PATCH: Sửa Git Member Local (nameLocal, emailLocal)
export async function patchGitMemberLocal(
  projectId: string,
  projectPartId: string,
  id: string,
  data: { nameLocal: string; emailLocal: string }
) {
  return axiosClient.patch(
    `/projects/${projectId}/parts/${projectPartId}/gitmember/${id}/local`,
    data,
    {
      headers: {
        'Content-Type': 'application/json-patch+json'
      }
    }
  )
}

// PATCH: Gán ProjectMemberId cho GitMember
export async function patchGitMemberProjectMemberId(
  projectId: string,
  projectPartId: string,
  id: string,
  projectMemberId: string
) {
  return axiosClient.patch(
    `/projects/${projectId}/parts/${projectPartId}/gitmember/${id}/project-member/${projectMemberId}`,
    {},
    {
      headers: {
        'Content-Type': 'application/json-patch+json'
      }
    }
  )
}
