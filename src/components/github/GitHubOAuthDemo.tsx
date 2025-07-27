import { useState } from 'react'
import { Badge } from '../ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs'
import GitHubOAuth from './GitHubOAuth'
import GitHubOAuthInfo from './GitHubOAuthInfo'

export default function GitHubOAuthDemo() {
  const [activeTab, setActiveTab] = useState('demo')
  const [demoProjectId] = useState('demo-project-123')
  const [demoPartId] = useState('demo-part-456')

  return (
    <div className='max-w-6xl mx-auto p-6 space-y-6'>
      {/* Header */}
      <div className='text-center'>
        <h1 className='text-3xl font-bold mb-2'>GitHub OAuth Integration Demo</h1>
        <p className='text-gray-600'>
          Demo việc sử dụng GitHub OAuth thay vì nhập thủ công repository URL và access token
        </p>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className='grid w-full grid-cols-3'>
          <TabsTrigger value='demo'>Live Demo</TabsTrigger>
          <TabsTrigger value='info'>OAuth Benefits</TabsTrigger>
          <TabsTrigger value='comparison'>Before vs After</TabsTrigger>
        </TabsList>

        {/* Live Demo Tab */}
        <TabsContent value='demo' className='space-y-6'>
          <Card>
            <CardHeader>
              <CardTitle className='flex items-center gap-2'>🚀 Live OAuth Demo</CardTitle>
              <p className='text-sm text-gray-600'>Click "Connect with GitHub" để trải nghiệm OAuth flow thực tế</p>
            </CardHeader>
            <CardContent>
              <div className='mb-4 p-4 bg-blue-50 rounded-lg'>
                <h4 className='font-medium text-blue-900 mb-2'>Demo Information:</h4>
                <div className='space-y-1 text-sm text-blue-800'>
                  <p>
                    <strong>Project ID:</strong> {demoProjectId}
                  </p>
                  <p>
                    <strong>Part ID:</strong> {demoPartId}
                  </p>
                  <p>
                    <strong>Status:</strong> <Badge variant='outline'>Demo Mode</Badge>
                  </p>
                </div>
              </div>

              <GitHubOAuth
                projectId={demoProjectId}
                partId={demoPartId}
                onConnectionSuccess={() => {
                  console.log('Demo: Repository connected successfully!')
                }}
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* OAuth Benefits Tab */}
        <TabsContent value='info'>
          <GitHubOAuthInfo />
        </TabsContent>

        {/* Comparison Tab */}
        <TabsContent value='comparison' className='space-y-6'>
          <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
            {/* Before */}
            <Card className='border-red-200'>
              <CardHeader>
                <CardTitle className='flex items-center gap-2 text-red-700'>❌ Before: Manual Input</CardTitle>
              </CardHeader>
              <CardContent className='space-y-4'>
                <div className='space-y-3'>
                  <h4 className='font-medium text-gray-900'>Steps Required:</h4>
                  <ol className='list-decimal list-inside space-y-2 text-sm text-gray-600'>
                    <li>Go to GitHub Settings → Developer settings</li>
                    <li>Create Personal Access Token</li>
                    <li>Copy token (keep it secure!)</li>
                    <li>Paste token in form</li>
                    <li>Enter repository URL manually</li>
                    <li>Click connect</li>
                  </ol>
                </div>

                <div className='space-y-3'>
                  <h4 className='font-medium text-gray-900'>Risks:</h4>
                  <ul className='list-disc list-inside space-y-1 text-sm text-red-600'>
                    <li>Token có thể bị lộ</li>
                    <li>User phải quản lý token</li>
                    <li>Khó revoke access</li>
                    <li>Risk of token expiration</li>
                  </ul>
                </div>

                <div className='p-3 bg-red-50 rounded-lg'>
                  <p className='text-sm text-red-700'>
                    <strong>Time:</strong> 5-10 minutes setup
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* After */}
            <Card className='border-green-200'>
              <CardHeader>
                <CardTitle className='flex items-center gap-2 text-green-700'>✅ After: OAuth Flow</CardTitle>
              </CardHeader>
              <CardContent className='space-y-4'>
                <div className='space-y-3'>
                  <h4 className='font-medium text-gray-900'>Steps Required:</h4>
                  <ol className='list-decimal list-inside space-y-2 text-sm text-gray-600'>
                    <li>Click "Connect with GitHub"</li>
                    <li>Authorize on GitHub</li>
                    <li>Select repository from list</li>
                    <li>Done! 🎉</li>
                  </ol>
                </div>

                <div className='space-y-3'>
                  <h4 className='font-medium text-gray-900'>Benefits:</h4>
                  <ul className='list-disc list-inside space-y-1 text-sm text-green-600'>
                    <li>Secure OAuth authentication</li>
                    <li>No token management needed</li>
                    <li>Easy to revoke access</li>
                    <li>Automatic token refresh</li>
                  </ul>
                </div>

                <div className='p-3 bg-green-50 rounded-lg'>
                  <p className='text-sm text-green-700'>
                    <strong>Time:</strong> 30 seconds setup
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Code Comparison */}
          <Card>
            <CardHeader>
              <CardTitle>Code Implementation Comparison</CardTitle>
            </CardHeader>
            <CardContent>
              <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
                <div>
                  <h4 className='font-medium mb-2'>Before: Manual Form</h4>
                  <pre className='bg-gray-100 p-3 rounded text-xs overflow-x-auto'>
                    {`// Old way - Manual input
const [repoUrl, setRepoUrl] = useState('');
const [accessToken, setAccessToken] = useState('');

<form onSubmit={handleConnect}>
  <input 
    value={repoUrl}
    onChange={(e) => setRepoUrl(e.target.value)}
    placeholder="https://github.com/user/repo"
  />
  <input 
    type="password"
    value={accessToken}
    onChange={(e) => setAccessToken(e.target.value)}
    placeholder="ghp_xxxxxxxxxxxx"
  />
  <button type="submit">Connect</button>
</form>`}
                  </pre>
                </div>
                <div>
                  <h4 className='font-medium mb-2'>After: OAuth Component</h4>
                  <pre className='bg-gray-100 p-3 rounded text-xs overflow-x-auto'>
                    {`// New way - OAuth flow
<GitHubOAuth 
  projectId={projectId}
  partId={partId}
  onConnectionSuccess={handleSuccess}
/>

// That's it! OAuth handles everything:
// - Authentication
// - Repository selection  
// - Secure connection`}
                  </pre>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Footer */}
      <div className='text-center text-sm text-gray-500'>
        <p>
          This demo shows the complete GitHub OAuth integration. The actual implementation requires backend OAuth
          endpoints to be configured.
        </p>
      </div>
    </div>
  )
}
