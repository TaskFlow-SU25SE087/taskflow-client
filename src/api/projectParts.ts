import axiosClient from '../configs/axiosClient';

// Tạo Project Part
export async function createProjectPart(
  projectId: string,
  payload: { Name: string; ProgrammingLanguage: string; Framework: string }
) {
  console.log('Payload gửi lên:', payload)
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
