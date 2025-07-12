import GitHubProjectPartIntegration from '@/components/github/GitHubProjectPartIntegration';
import { Navbar } from '@/components/Navbar';
import { Sidebar } from '@/components/Sidebar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Loader } from '@/components/ui/loader';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useCurrentProject } from '@/hooks/useCurrentProject';
import {
    Activity,
    AlertCircle,
    BarChart3,
    CheckCircle,
    Clock,
    Eye,
    GitBranch,
    GitCommit,
    Github,
    GitPullRequest,
    Settings,
    Star,
    TrendingUp,
    Users
} from 'lucide-react';
import { useState } from 'react';
import { useParams } from 'react-router-dom';

interface GitHubStats {
  totalCommits: number;
  totalIssues: number;
  totalPullRequests: number;
  totalRepositories: number;
  activeContributors: number;
  codeQuality: number;
  lastCommit: string;
  repositoryHealth: number;
}

interface Repository {
  id: string;
  name: string;
  fullName: string;
  description: string;
  language: string;
  stars: number;
  forks: number;
  watchers: number;
  isPrivate: boolean;
  lastUpdated: string;
  isConnected: boolean;
}

interface Commit {
  id: string;
  message: string;
  author: string;
  date: string;
  repository: string;
  branch: string;
}

interface Issue {
  id: string;
  title: string;
  number: number;
  state: 'open' | 'closed';
  repository: string;
  author: string;
  createdAt: string;
  labels: string[];
}

export default function ProjectGitHub() {
  const { projectId } = useParams<{ projectId: string }>();
  const { currentProject, isLoading } = useCurrentProject();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [showIntegrationDialog, setShowIntegrationDialog] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');

  // Mock data for demonstration
  const [stats] = useState<GitHubStats>({
    totalCommits: 1247,
    totalIssues: 89,
    totalPullRequests: 34,
    totalRepositories: 3,
    activeContributors: 8,
    codeQuality: 87,
    lastCommit: '2 hours ago',
    repositoryHealth: 92
  });

  const [repositories] = useState<Repository[]>([
    {
      id: '1',
      name: 'taskflow-frontend',
      fullName: 'taskflow/taskflow-frontend',
      description: 'React frontend for TaskFlow project management platform',
      language: 'TypeScript',
      stars: 45,
      forks: 12,
      watchers: 23,
      isPrivate: false,
      lastUpdated: '2 hours ago',
      isConnected: true
    },
    {
      id: '2',
      name: 'taskflow-backend',
      fullName: 'taskflow/taskflow-backend',
      description: '.NET Core backend API for TaskFlow',
      language: 'C#',
      stars: 32,
      forks: 8,
      watchers: 15,
      isPrivate: false,
      lastUpdated: '1 day ago',
      isConnected: true
    },
    {
      id: '3',
      name: 'taskflow-database',
      fullName: 'taskflow/taskflow-database',
      description: 'Database migrations and schema for TaskFlow',
      language: 'SQL',
      stars: 18,
      forks: 5,
      watchers: 9,
      isPrivate: true,
      lastUpdated: '3 days ago',
      isConnected: false
    }
  ]);

  const [recentCommits] = useState<Commit[]>([
    {
      id: 'abc123',
      message: 'feat: add GitHub integration dashboard',
      author: 'john.doe',
      date: '2 hours ago',
      repository: 'taskflow-frontend',
      branch: 'main'
    },
    {
      id: 'def456',
      message: 'fix: resolve authentication issue',
      author: 'jane.smith',
      date: '4 hours ago',
      repository: 'taskflow-backend',
      branch: 'develop'
    },
    {
      id: 'ghi789',
      message: 'docs: update API documentation',
      author: 'mike.wilson',
      date: '1 day ago',
      repository: 'taskflow-frontend',
      branch: 'main'
    }
  ]);

  const [recentIssues] = useState<Issue[]>([
    {
      id: '1',
      title: 'GitHub OAuth not working in production',
      number: 156,
      state: 'open',
      repository: 'taskflow-frontend',
      author: 'john.doe',
      createdAt: '1 day ago',
      labels: ['bug', 'high-priority']
    },
    {
      id: '2',
      title: 'Add repository health monitoring',
      number: 155,
      state: 'open',
      repository: 'taskflow-backend',
      author: 'jane.smith',
      createdAt: '2 days ago',
      labels: ['enhancement', 'feature']
    },
    {
      id: '3',
      title: 'Update dependency versions',
      number: 154,
      state: 'closed',
      repository: 'taskflow-frontend',
      author: 'mike.wilson',
      createdAt: '3 days ago',
      labels: ['maintenance']
    }
  ]);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const getLanguageColor = (language: string) => {
    const colors: { [key: string]: string } = {
      'TypeScript': 'bg-blue-100 text-blue-700',
      'JavaScript': 'bg-yellow-100 text-yellow-700',
      'C#': 'bg-purple-100 text-purple-700',
      'Java': 'bg-orange-100 text-orange-700',
      'Python': 'bg-green-100 text-green-700',
      'SQL': 'bg-gray-100 text-gray-700'
    };
    return colors[language] || 'bg-gray-100 text-gray-700';
  };

  const getIssueStateIcon = (state: string) => {
    return state === 'open' ? (
      <AlertCircle className="h-4 w-4 text-green-500" />
    ) : (
      <CheckCircle className="h-4 w-4 text-gray-500" />
    );
  };

  if (isLoading || !currentProject) {
    return (
      <div className="flex h-screen bg-gray-100">
        <Sidebar isOpen={isSidebarOpen} onToggle={toggleSidebar} currentProject={currentProject} />
        <div className="flex-1 flex flex-col overflow-hidden">
          <Navbar isSidebarOpen={isSidebarOpen} toggleSidebar={toggleSidebar} />
          <div className="flex items-center justify-center flex-1">
            <Loader />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-100">
      <Sidebar isOpen={isSidebarOpen} onToggle={toggleSidebar} currentProject={currentProject} />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <Navbar isSidebarOpen={isSidebarOpen} toggleSidebar={toggleSidebar} />
        
        <div className="flex-1 overflow-y-auto p-6">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">GitHub Integration</h1>
                <p className="text-gray-600 mt-2">
                  Manage your GitHub repositories and monitor project activity
                </p>
              </div>
              
              <div className="flex items-center gap-3">
                <Dialog open={showIntegrationDialog} onOpenChange={setShowIntegrationDialog}>
                  <DialogTrigger asChild>
                    <Button>
                      <Github className="h-4 w-4 mr-2" />
                      Connect Repository
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>GitHub Integration</DialogTitle>
                    </DialogHeader>
                    <GitHubProjectPartIntegration 
                      projectId={projectId!}
                    />
                  </DialogContent>
                </Dialog>
                
                <Button variant="outline">
                  <Settings className="h-4 w-4 mr-2" />
                  Settings
                </Button>
              </div>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Commits</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.totalCommits.toLocaleString()}</p>
                  </div>
                  <div className="p-3 bg-blue-100 rounded-lg">
                    <GitCommit className="h-6 w-6 text-blue-600" />
                  </div>
                </div>
                <div className="mt-4 flex items-center text-sm text-gray-600">
                  <TrendingUp className="h-4 w-4 mr-1 text-green-500" />
                  <span>+12% from last week</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Active Issues</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.totalIssues}</p>
                  </div>
                  <div className="p-3 bg-orange-100 rounded-lg">
                    <AlertCircle className="h-6 w-6 text-orange-600" />
                  </div>
                </div>
                <div className="mt-4 flex items-center text-sm text-gray-600">
                  <Clock className="h-4 w-4 mr-1 text-orange-500" />
                  <span>Last updated {stats.lastCommit}</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Pull Requests</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.totalPullRequests}</p>
                  </div>
                  <div className="p-3 bg-green-100 rounded-lg">
                    <GitPullRequest className="h-6 w-6 text-green-600" />
                  </div>
                </div>
                <div className="mt-4 flex items-center text-sm text-gray-600">
                  <Users className="h-4 w-4 mr-1 text-green-500" />
                  <span>{stats.activeContributors} contributors</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Code Quality</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.codeQuality}%</p>
                  </div>
                  <div className="p-3 bg-purple-100 rounded-lg">
                    <BarChart3 className="h-6 w-6 text-purple-600" />
                  </div>
                </div>
                <div className="mt-4">
                  <Progress value={stats.codeQuality} className="h-2" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="repositories">Repositories</TabsTrigger>
              <TabsTrigger value="activity">Activity</TabsTrigger>
              <TabsTrigger value="issues">Issues</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Repository Health */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Activity className="h-5 w-5" />
                      Repository Health
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {repositories.map((repo) => (
                        <div key={repo.id} className="flex items-center justify-between p-3 border rounded-lg">
                          <div className="flex items-center gap-3">
                            <div className={`w-3 h-3 rounded-full ${repo.isConnected ? 'bg-green-500' : 'bg-gray-300'}`} />
                            <div>
                              <p className="font-medium">{repo.name}</p>
                              <p className="text-sm text-gray-600">{repo.language}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-medium">{stats.repositoryHealth}%</p>
                            <p className="text-xs text-gray-500">Healthy</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Recent Activity */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <GitBranch className="h-5 w-5" />
                      Recent Commits
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {recentCommits.map((commit) => (
                        <div key={commit.id} className="flex items-start gap-3 p-3 border rounded-lg">
                          <div className="w-2 h-2 bg-green-500 rounded-full mt-2" />
                          <div className="flex-1">
                            <p className="font-medium text-sm">{commit.message}</p>
                            <div className="flex items-center gap-2 mt-1 text-xs text-gray-600">
                              <span>{commit.author}</span>
                              <span>•</span>
                              <span>{commit.repository}</span>
                              <span>•</span>
                              <span>{commit.branch}</span>
                              <span>•</span>
                              <span>{commit.date}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="repositories" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {repositories.map((repo) => (
                  <Card key={repo.id} className="hover:shadow-lg transition-shadow">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle className="text-lg">{repo.name}</CardTitle>
                          <p className="text-sm text-gray-600 mt-1">{repo.description}</p>
                        </div>
                        <Badge variant={repo.isPrivate ? "secondary" : "outline"}>
                          {repo.isPrivate ? "Private" : "Public"}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex items-center gap-2">
                        <Badge className={getLanguageColor(repo.language)}>
                          {repo.language}
                        </Badge>
                        {!repo.isConnected && (
                          <Badge variant="destructive">Not Connected</Badge>
                        )}
                      </div>
                      
                      <div className="flex items-center justify-between text-sm text-gray-600">
                        <div className="flex items-center gap-4">
                          <div className="flex items-center gap-1">
                            <Star className="h-4 w-4" />
                            <span>{repo.stars}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <GitBranch className="h-4 w-4" />
                            <span>{repo.forks}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Eye className="h-4 w-4" />
                            <span>{repo.watchers}</span>
                          </div>
                        </div>
                        <span>Updated {repo.lastUpdated}</span>
                      </div>

                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" className="flex-1">
                          <Github className="h-4 w-4 mr-2" />
                          View
                        </Button>
                        {!repo.isConnected && (
                          <Button size="sm" className="flex-1">
                            Connect
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="activity" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Activity Timeline</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {recentCommits.map((commit, index) => (
                      <div key={commit.id} className="flex items-start gap-4">
                        <div className="flex flex-col items-center">
                          <div className="w-3 h-3 bg-blue-500 rounded-full" />
                          {index < recentCommits.length - 1 && (
                            <div className="w-0.5 h-8 bg-gray-200 mt-2" />
                          )}
                        </div>
                        <div className="flex-1 pb-4">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium">{commit.author}</span>
                            <span className="text-gray-500">committed to</span>
                            <span className="font-medium">{commit.repository}</span>
                          </div>
                          <p className="text-gray-700 mb-2">{commit.message}</p>
                          <div className="flex items-center gap-4 text-sm text-gray-500">
                            <span>{commit.date}</span>
                            <span>•</span>
                            <span>{commit.branch}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="issues" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Recent Issues</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {recentIssues.map((issue) => (
                      <div key={issue.id} className="flex items-start gap-4 p-4 border rounded-lg">
                        <div className="flex items-center gap-2">
                          {getIssueStateIcon(issue.state)}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-medium">{issue.title}</h4>
                            <span className="text-sm text-gray-500">#{issue.number}</span>
                          </div>
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-sm text-gray-600">in {issue.repository}</span>
                            <span className="text-gray-400">•</span>
                            <span className="text-sm text-gray-600">by {issue.author}</span>
                            <span className="text-gray-400">•</span>
                            <span className="text-sm text-gray-600">{issue.createdAt}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            {issue.labels.map((label) => (
                              <Badge key={label} variant="outline" className="text-xs">
                                {label}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
} 