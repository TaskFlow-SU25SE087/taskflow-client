import axiosClient from '../configs/axiosClient';

export async function postGithubWebhook(payload: Record<string, any>) {
  const res = await axiosClient.post(
    '/api/webhooks/github',
    payload,
    { headers: { 'Content-Type': 'application/json-patch+json' } }
  );
  return res.data;
} 