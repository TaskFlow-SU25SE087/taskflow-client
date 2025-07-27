import { AlertTriangle, CheckCircle, Github, Shield, UserCheck } from 'lucide-react'
import { Alert, AlertDescription } from '../ui/alert'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'

export default function GitHubOAuthInfo() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className='flex items-center gap-2'>
          <Github className='h-5 w-5' />
          Why Use GitHub OAuth?
        </CardTitle>
      </CardHeader>
      <CardContent className='space-y-4'>
        <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
          <div className='flex items-start gap-3'>
            <div className='p-2 bg-green-100 rounded-lg'>
              <Shield className='h-5 w-5 text-green-600' />
            </div>
            <div>
              <h4 className='font-medium text-gray-900'>Enhanced Security</h4>
              <p className='text-sm text-gray-600'>
                No need to handle personal access tokens. OAuth provides secure, temporary access that can be revoked
                anytime.
              </p>
            </div>
          </div>

          <div className='flex items-start gap-3'>
            <div className='p-2 bg-blue-100 rounded-lg'>
              <UserCheck className='h-5 w-5 text-blue-600' />
            </div>
            <div>
              <h4 className='font-medium text-gray-900'>Easy Authentication</h4>
              <p className='text-sm text-gray-600'>
                One-click authentication with your GitHub account. No need to create or manage tokens manually.
              </p>
            </div>
          </div>

          <div className='flex items-start gap-3'>
            <div className='p-2 bg-purple-100 rounded-lg'>
              <Github className='h-5 w-5 text-purple-600' />
            </div>
            <div>
              <h4 className='font-medium text-gray-900'>Repository Discovery</h4>
              <p className='text-sm text-gray-600'>
                Automatically see all your repositories and select the one you want to connect.
              </p>
            </div>
          </div>

          <div className='flex items-start gap-3'>
            <div className='p-2 bg-orange-100 rounded-lg'>
              <CheckCircle className='h-5 w-5 text-orange-600' />
            </div>
            <div>
              <h4 className='font-medium text-gray-900'>Automatic Setup</h4>
              <p className='text-sm text-gray-600'>
                Webhooks and repository connections are set up automatically for seamless integration.
              </p>
            </div>
          </div>
        </div>

        <Alert>
          <AlertTriangle className='h-4 w-4' />
          <AlertDescription>
            <strong>Privacy & Control:</strong> We only request read access to your repositories. You can revoke access
            anytime from your GitHub settings, and we never store your GitHub password.
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  )
}
