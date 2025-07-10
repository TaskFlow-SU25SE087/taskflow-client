import { postGithubWebhook } from '../../api/webhooks';
import { useToast } from '../../hooks/useToast';
import { GitHubWebhookPayload } from '../../types/webhook';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';

export default function WebhookTest() {
  const { toast } = useToast();

  const handleTestWebhook = async () => {
    try {
      // Mock GitHub webhook payload
      const mockPayload: GitHubWebhookPayload = {
        ref: "refs/heads/main",
        before: "6113728f27ae82c7b1a177c8d03f9e96e0adf246",
        after: "76dcc6a2c2c8c8c8c8c8c8c8c8c8c8c8c8c8c8c8c",
        repository: {
          id: 123456789,
          node_id: "MDEwOlJlcG9zaXRvcnkxMjM0NTY3ODk=",
          name: "taskflow-project",
          full_name: "username/taskflow-project",
          private: false,
          owner: {
            name: "Test User",
            email: "test@example.com",
            login: "testuser",
            id: 123456,
            node_id: "MDQ6VXNlcjEyMzQ1Ng==",
            avatar_url: "https://avatars.githubusercontent.com/u/123456?v=4",
            url: "https://api.github.com/users/testuser",
            html_url: "https://github.com/testuser",
            type: "User",
            site_admin: false
          },
          html_url: "https://github.com/username/taskflow-project",
          description: "TaskFlow project repository",
          fork: false,
          url: "https://api.github.com/repos/username/taskflow-project",
          created_at: 1640995200,
          updated_at: "2024-01-01T12:00:00Z",
          pushed_at: 1640995200,
          git_url: "git://github.com/username/taskflow-project.git",
          ssh_url: "git@github.com:username/taskflow-project.git",
          clone_url: "https://github.com/username/taskflow-project.git",
          default_branch: "main"
        },
        pusher: {
          name: "Test User",
          email: "test@example.com"
        },
        sender: {
          login: "testuser",
          id: 123456,
          node_id: "MDQ6VXNlcjEyMzQ1Ng==",
          avatar_url: "https://avatars.githubusercontent.com/u/123456?v=4",
          url: "https://api.github.com/users/testuser",
          html_url: "https://github.com/testuser",
          type: "User",
          site_admin: false
        },
        created: false,
        deleted: false,
        forced: false,
        base_ref: null,
        compare: "https://github.com/username/taskflow-project/compare/6113728f27ae...76dcc6a2c2c8",
        commits: [
          {
            id: "76dcc6a2c2c8c8c8c8c8c8c8c8c8c8c8c8c8c8c8c",
            tree_id: "c8c8c8c8c8c8c8c8c8c8c8c8c8c8c8c8c8c8c8c8",
            distinct: true,
            message: "feat: add new feature for testing",
            timestamp: "2024-01-01T12:00:00Z",
            url: "https://api.github.com/repos/username/taskflow-project/commits/76dcc6a2c2c8c8c8c8c8c8c8c8c8c8c8c8c8c8c8c",
            author: {
              name: "Test User",
              email: "test@example.com"
            },
            committer: {
              name: "Test User",
              email: "test@example.com"
            },
            added: [
              "src/new-feature.js"
            ],
            removed: [],
            modified: [
              "README.md"
            ]
          }
        ],
        head_commit: {
          id: "76dcc6a2c2c8c8c8c8c8c8c8c8c8c8c8c8c8c8c8c",
          tree_id: "c8c8c8c8c8c8c8c8c8c8c8c8c8c8c8c8c8c8c8c8",
          distinct: true,
          message: "feat: add new feature for testing",
          timestamp: "2024-01-01T12:00:00Z",
          url: "https://api.github.com/repos/username/taskflow-project/commits/76dcc6a2c2c8c8c8c8c8c8c8c8c8c8c8c8c8c8c8c",
          author: {
            name: "Test User",
            email: "test@example.com"
          },
          committer: {
            name: "Test User",
            email: "test@example.com"
          },
          added: [
            "src/new-feature.js"
          ],
          removed: [],
          modified: [
            "README.md"
          ]
        }
      };

      const response = await postGithubWebhook(mockPayload);
      
      toast({
        title: 'Webhook Test Success',
        description: `Response: ${JSON.stringify(response)}`,
        variant: 'default'
      });
    } catch (error) {
      toast({
        title: 'Webhook Test Failed',
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: 'destructive'
      });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>GitHub Webhook Test</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-gray-600 mb-4">
          This button simulates a GitHub webhook push event. Use this to test the webhook endpoint.
        </p>
        <Button onClick={handleTestWebhook} variant="outline">
          Test GitHub Webhook
        </Button>
      </CardContent>
    </Card>
  );
} 