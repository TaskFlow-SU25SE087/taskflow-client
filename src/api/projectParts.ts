import axiosClient from '../configs/axiosClient';

// Tạo Project Part
export async function createProjectPart(
  projectId: string,
  payload: { name: string; programmingLanguage: string; framework: string }
) {
  console.log('Create Project Part payload:', payload, 'projectId:', projectId);
  // Đảm bảo truyền đúng key viết thường cho backend
  const res = await axiosClient.post(`/projects/${projectId}/parts`, payload, {
    headers: { 'Content-Type': 'application/json-patch+json' }
  })
  return res.data
}

// Kết nối repo cho Project Part
export async function connectRepoToPart(
  projectId: string,
  partId: string,
  payload: { repoUrl: string }
) {
  const res = await axiosClient.patch(`/projects/${projectId}/parts/${partId}/connect-repo`, payload, {
    headers: { 'Content-Type': 'application/json-patch+json' }
  })
  return res.data
}

// Lấy danh sách Project Parts
export async function getProjectParts(projectId: string) {
  const res = await axiosClient.get(`/projects/${projectId}/parts`)
  return res.data
}

// Git Member Local APIs
export async function addGitMemberLocal(
  projectId: string,
  projectPartId: string,
  projectMemberId: string,
  payload: { nameLocal: string; emailLocal: string }
) {
  const res = await axiosClient.post(
    `/projects/${projectId}/parts/${projectPartId}/gitmember/${projectMemberId}`,
    payload,
    {
      headers: { 'Content-Type': 'application/json-patch+json' }
    }
  )
  return res.data
}

export async function updateGitMemberLocal(
  projectId: string,
  projectPartId: string,
  gitMemberId: string,
  payload: { nameLocal: string; emailLocal: string }
) {
  const res = await axiosClient.patch(
    `/projects/${projectId}/parts/${projectPartId}/gitmember/${gitMemberId}/local`,
    payload,
    {
      headers: { 'Content-Type': 'application/json-patch+json' }
    }
  )
  return res.data
}

// Note: GET endpoint không có trong specification, có thể cần thêm
export async function getGitMembersLocal(projectId: string, projectPartId: string) {
  const res = await axiosClient.get(`/projects/${projectId}/parts/${projectPartId}/gitmember`)
  return res.data
}
