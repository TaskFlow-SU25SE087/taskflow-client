import { useState } from 'react';
import { useProjectParts } from '../../hooks/useProjectParts';

export default function ProjectPartManager({ projectId }: { projectId: string }) {
  const { createPart, connectRepo, loading, error, result } = useProjectParts();
  const [name, setName] = useState('');
  const [programmingLanguage, setProgrammingLanguage] = useState(0);
  const [framework, setFramework] = useState(0);
  const [partId, setPartId] = useState('');
  const [repoUrl, setRepoUrl] = useState('');
  const [accessToken, setAccessToken] = useState('');

  // Tạo Project Part
  const handleCreatePart = async () => {
    const res = await createPart(projectId, { name, programmingLanguage, framework });
    if (res && res.data) setPartId(res.data);
  };

  // Kết nối repo
  const handleConnectRepo = async () => {
    await connectRepo(projectId, partId, { repoUrl, accessToken });
  };

  return (
    <div>
      <h2>Create Project Part</h2>
      <input value={name} onChange={e => setName(e.target.value)} placeholder="Part name" />
      <input value={programmingLanguage} onChange={e => setProgrammingLanguage(Number(e.target.value))} placeholder="Programming Language (enum)" type="number" />
      <input value={framework} onChange={e => setFramework(Number(e.target.value))} placeholder="Framework (enum)" type="number" />
      <button onClick={handleCreatePart} disabled={loading}>Create Part</button>

      <h2>Connect Repo to Part</h2>
      <input value={partId} onChange={e => setPartId(e.target.value)} placeholder="Part ID" />
      <input value={repoUrl} onChange={e => setRepoUrl(e.target.value)} placeholder="Repo URL" />
      <input value={accessToken} onChange={e => setAccessToken(e.target.value)} placeholder="Access Token" />
      <button onClick={handleConnectRepo} disabled={loading}>Connect Repo</button>

      {result && <pre>{JSON.stringify(result, null, 2)}</pre>}
      {error && <div style={{ color: 'red' }}>{error.message}</div>}
    </div>
  );
} 