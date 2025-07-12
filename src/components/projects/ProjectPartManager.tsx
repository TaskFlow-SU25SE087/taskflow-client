import { Github, Link, Plus, Settings } from 'lucide-react'
import { useState } from 'react'
import { useProjectParts } from '../../hooks/useProjectParts'
import GitHubProjectPartIntegration from '../github/GitHubProjectPartIntegration'
import { Badge } from '../ui/badge'
import { Button } from '../ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog'
import { Input } from '../ui/input'
import { Label } from '../ui/label'
import { Separator } from '../ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs'

export default function ProjectPartManager({ projectId }: { projectId: string }) {
  const { createPart, connectRepo, loading, error, result } = useProjectParts()
  const [name, setName] = useState('')
  const [programmingLanguage, setProgrammingLanguage] = useState(0)
  const [framework, setFramework] = useState(0)
  const [partId, setPartId] = useState('')
  const [repoUrl, setRepoUrl] = useState('')
  const [accessToken, setAccessToken] = useState('')
  const [showGitHubIntegration, setShowGitHubIntegration] = useState(false)

  // Tạo Project Part
  const handleCreatePart = async () => {
    const res = await createPart(projectId, { name, programmingLanguage, framework })
    if (res && res.data) setPartId(res.data)
  }

  // Kết nối repo
  const handleConnectRepo = async () => {
    await connectRepo(projectId, partId, { repoUrl, accessToken })
  }

  return (
    <div className='space-y-6'>
      {/* Header */}
      <div className='flex items-center justify-between'>
        <div>
          <h1 className='text-3xl font-bold'>Project Parts</h1>
          <p className='text-gray-600'>Manage your project components and connect them to repositories</p>
        </div>

        <Dialog open={showGitHubIntegration} onOpenChange={setShowGitHubIntegration}>
          <DialogTrigger asChild>
            <Button className='flex items-center gap-2'>
              <Github className='h-4 w-4' />
              GitHub Integration
            </Button>
          </DialogTrigger>
          <DialogContent className='max-w-4xl w-full h-[80vh] overflow-y-auto'>
            <DialogHeader>
              <DialogTitle className='flex items-center gap-2'>
                <Github className='h-5 w-5' />
                GitHub Integration
              </DialogTitle>
            </DialogHeader>
            <GitHubProjectPartIntegration projectId={projectId} />
          </DialogContent>
        </Dialog>
      </div>

      {/* Main Content */}
      <Tabs defaultValue='manual' className='space-y-4'>
        <TabsList className='grid w-full grid-cols-2'>
          <TabsTrigger value='manual' className='flex items-center gap-2'>
            <Settings className='h-4 w-4' />
            Manual Setup
          </TabsTrigger>
          <TabsTrigger value='github' className='flex items-center gap-2'>
            <Github className='h-4 w-4' />
            GitHub OAuth
          </TabsTrigger>
        </TabsList>

        <TabsContent value='manual' className='space-y-6'>
          {/* Create Project Part */}
          <Card>
            <CardHeader>
              <CardTitle className='flex items-center gap-2'>
                <Plus className='h-5 w-5' />
                Create Project Part
              </CardTitle>
            </CardHeader>
            <CardContent className='space-y-4'>
              <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
                <div>
                  <Label htmlFor='part-name'>Part Name</Label>
                  <Input
                    id='part-name'
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder='e.g., Backend Service'
                  />
                </div>
                <div>
                  <Label htmlFor='programming-language'>Programming Language</Label>
                  <Input
                    id='programming-language'
                    value={programmingLanguage}
                    onChange={(e) => setProgrammingLanguage(Number(e.target.value))}
                    placeholder='0 = Java, 1 = C#, etc.'
                    type='number'
                  />
                </div>
                <div>
                  <Label htmlFor='framework'>Framework</Label>
                  <Input
                    id='framework'
                    value={framework}
                    onChange={(e) => setFramework(Number(e.target.value))}
                    placeholder='0 = Spring Boot, 1 = .NET, etc.'
                    type='number'
                  />
                </div>
              </div>

              <Button onClick={handleCreatePart} disabled={loading || !name} className='w-full md:w-auto'>
                {loading ? 'Creating...' : 'Create Part'}
              </Button>
            </CardContent>
          </Card>

          <Separator />

          {/* Connect Repository */}
          <Card>
            <CardHeader>
              <CardTitle className='flex items-center gap-2'>
                <Link className='h-5 w-5' />
                Connect Repository
              </CardTitle>
            </CardHeader>
            <CardContent className='space-y-4'>
              <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
                <div>
                  <Label htmlFor='part-id'>Part ID</Label>
                  <Input
                    id='part-id'
                    value={partId}
                    onChange={(e) => setPartId(e.target.value)}
                    placeholder='Enter part ID'
                  />
                </div>
                <div>
                  <Label htmlFor='repo-url'>Repository URL</Label>
                  <Input
                    id='repo-url'
                    value={repoUrl}
                    onChange={(e) => setRepoUrl(e.target.value)}
                    placeholder='https://github.com/user/repo'
                  />
                </div>
                <div>
                  <Label htmlFor='access-token'>Access Token</Label>
                  <Input
                    id='access-token'
                    value={accessToken}
                    onChange={(e) => setAccessToken(e.target.value)}
                    placeholder='GitHub personal access token'
                    type='password'
                  />
                </div>
              </div>

              <Button
                onClick={handleConnectRepo}
                disabled={loading || !partId || !repoUrl || !accessToken}
                className='w-full md:w-auto'
              >
                {loading ? 'Connecting...' : 'Connect Repository'}
              </Button>
            </CardContent>
          </Card>

          {/* Results */}
          {result && (
            <Card>
              <CardHeader>
                <CardTitle>Result</CardTitle>
              </CardHeader>
              <CardContent>
                <pre className='bg-gray-100 p-4 rounded-lg overflow-auto text-sm'>
                  {JSON.stringify(result, null, 2)}
                </pre>
              </CardContent>
            </Card>
          )}

          {error && (
            <Card className='border-red-200 bg-red-50'>
              <CardContent className='pt-6'>
                <div className='flex items-center gap-2 text-red-700'>
                  <Badge variant='destructive'>Error</Badge>
                  <span>{error.message}</span>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value='github' className='space-y-6'>
          <Card>
            <CardHeader>
              <CardTitle className='flex items-center gap-2'>
                <Github className='h-5 w-5' />
                GitHub OAuth Integration
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className='text-center py-8'>
                <Github className='h-16 w-16 mx-auto mb-4 text-gray-300' />
                <h3 className='text-lg font-semibold mb-2'>Use GitHub OAuth</h3>
                <p className='text-gray-600 mb-6'>
                  Connect your GitHub repositories securely using OAuth authentication. No need to manually enter access
                  tokens.
                </p>
                <Button onClick={() => setShowGitHubIntegration(true)} size='lg' className='w-full max-w-md'>
                  <Github className='h-4 w-4 mr-2' />
                  Open GitHub Integration
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
