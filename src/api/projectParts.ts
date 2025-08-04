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
  console.log('Create Project Part response:', res.data);
  return res.data
}

// Kết nối repo cho Project Part
export async function connectRepoToPart(
  projectId: string,
  partId: string,
  payload: { repoUrl: string }
) {
  // URL encode the partId to handle special characters and spaces
  const encodedPartId = encodeURIComponent(partId)
  const res = await axiosClient.patch(`/projects/${projectId}/parts/${encodedPartId}/connect-repo`, payload, {
    headers: { 'Content-Type': 'application/json-patch+json' }
  })
  return res.data
}

// Lấy danh sách Project Parts
export async function getProjectParts(projectId: string) {
  const res = await axiosClient.get(`/projects/${projectId}/parts`)
  console.log('Get Project Parts response:', res.data);
  return res.data
}

// Git Member Local APIs
export async function addGitMemberLocal(
  projectId: string,
  projectPartId: string,
  projectMemberId: string,
  payload: { nameLocal: string; emailLocal: string }
) {
  // URL encode the projectPartId to handle special characters and spaces
  const encodedProjectPartId = encodeURIComponent(projectPartId)
  const res = await axiosClient.post(
    `/projects/${projectId}/parts/${encodedProjectPartId}/gitmember/${projectMemberId}`,
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
  // URL encode the projectPartId to handle special characters and spaces
  const encodedProjectPartId = encodeURIComponent(projectPartId)
  const res = await axiosClient.patch(
    `/projects/${projectId}/parts/${encodedProjectPartId}/gitmember/${gitMemberId}/local`,
    payload,
    {
      headers: { 'Content-Type': 'application/json-patch+json' }
    }
  )
  return res.data
}

// Note: GET endpoint không có trong specification, có thể cần thêm
export async function getGitMembersLocal(projectId: string, projectPartId: string) {
  // URL encode the projectPartId to handle special characters and spaces
  const encodedProjectPartId = encodeURIComponent(projectPartId)
  const res = await axiosClient.get(`/projects/${projectId}/parts/${encodedProjectPartId}/gitmember`)
  return res.data
}
