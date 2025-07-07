import axiosClient from '../configs/axiosClient';

// Tạo Project Part
export async function createProjectPart(
  projectId: string,
  payload: { name: string; programmingLanguage: number; framework: number }
) {
  const res = await axiosClient.post(
    `/projects/${projectId}/parts`,
    payload,
    { headers: { 'Content-Type': 'application/json-patch+json' } }
  );
  return res.data;
}

// Kết nối repo cho Project Part
export async function connectRepoToPart(
  projectId: string,
  partId: string,
  payload: { repoUrl: string; accessToken: string }
) {
  const res = await axiosClient.patch(
    `/projects/${projectId}/parts/${partId}/connect-repo`,
    payload,
    { headers: { 'Content-Type': 'application/json-patch+json' } }
  );
  return res.data;
} 