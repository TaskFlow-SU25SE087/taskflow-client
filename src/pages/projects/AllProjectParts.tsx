import { getProjectParts } from '@/api/projectParts';
import { projectApi } from '@/api/projects';
import { Navbar } from '@/components/Navbar';
import { Sidebar } from '@/components/Sidebar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader } from '@/components/ui/loader';
import { useEffect, useState } from 'react';

interface ProjectPart {
  id: string;
  name: string;
  programmingLanguage: string;
  framework: string;
  repoUrl?: string;
  isConnected?: boolean;
  projectId: string;
  projectTitle: string;
}

export default function AllProjectParts() {
  const [parts, setParts] = useState<ProjectPart[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  useEffect(() => {
    const fetchAllParts = async () => {
      setLoading(true);
      setError(null);
      try {
        const projectsRes = await projectApi.getProjects();
        const projects = projectsRes.data || [];
        const allParts: ProjectPart[] = [];
        for (const project of projects) {
          try {
            const partsRes = await getProjectParts(project.id);
            const partsData = partsRes.data || [];
            for (const part of partsData) {
              allParts.push({ ...part, projectId: project.id, projectTitle: project.title });
            }
          } catch (err) {
            // Bỏ qua lỗi từng project
          }
        }
        setParts(allParts);
      } catch (err: any) {
        setError(err.message || 'Failed to fetch project parts');
      } finally {
        setLoading(false);
      }
    };
    fetchAllParts();
  }, []);

  if (loading) {
    return (
      <div className="flex h-screen bg-gray-100">
        <Sidebar isOpen={isSidebarOpen} onToggle={() => setIsSidebarOpen(!isSidebarOpen)} />
        <div className="flex-1 flex flex-col overflow-hidden">
          <Navbar isSidebarOpen={isSidebarOpen} toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} />
          <div className="flex-1 flex items-center justify-center">
            <Loader />
          </div>
        </div>
      </div>
    );
  }
  if (error) {
    return (
      <div className="flex h-screen bg-gray-100">
        <Sidebar isOpen={isSidebarOpen} onToggle={() => setIsSidebarOpen(!isSidebarOpen)} />
        <div className="flex-1 flex flex-col overflow-hidden">
          <Navbar isSidebarOpen={isSidebarOpen} toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} />
          <div className="flex-1 flex items-center justify-center">
            <div className="text-red-500 text-center py-8">{error}</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-100">
      <Sidebar isOpen={isSidebarOpen} onToggle={() => setIsSidebarOpen(!isSidebarOpen)} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Navbar isSidebarOpen={isSidebarOpen} toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} />
        <div className="p-6 flex-1 overflow-y-auto">
          <h1 className="text-3xl font-bold mb-6">All Project Parts</h1>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {parts.map((part) => (
              <Card key={part.id + part.projectId} className="hover:shadow-lg transition-shadow">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg">{part.name}</CardTitle>
                  <div className="text-xs text-gray-500">Project: {part.projectTitle}</div>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex flex-wrap gap-2">
                    <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded text-xs">{part.programmingLanguage}</span>
                    <span className="bg-green-100 text-green-700 px-2 py-1 rounded text-xs">{part.framework}</span>
                  </div>
                  {part.repoUrl && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <span className="truncate">{part.repoUrl}</span>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
          {parts.length === 0 && <div className="text-center text-gray-500 py-8">No project parts found.</div>}
        </div>
      </div>
    </div>
  );
} 