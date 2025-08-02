import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useProjectReports } from '@/hooks/useProjectReports'
import React from 'react'
import { useParams } from 'react-router-dom'

const TestReports: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>()
  const { reportData, loading, error, refetch } = useProjectReports(projectId)

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4">Loading reports...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center">
              <h3 className="text-lg font-semibold mb-2">Error Loading Reports</h3>
              <p className="text-gray-600 mb-4">{error}</p>
              <Button onClick={refetch}>Try Again</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!reportData) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center">
              <h3 className="text-lg font-semibold mb-2">No Data Available</h3>
              <p className="text-gray-600 mb-4">No report data found for this project.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Test Reports Page</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <h3 className="font-medium">Project ID: {projectId}</h3>
            </div>
            <div>
              <h3 className="font-medium">Stats:</h3>
              <ul className="list-disc list-inside space-y-1">
                <li>Total Tasks: {reportData.stats.totalTasks}</li>
                <li>Completed Tasks: {reportData.stats.completedTasks}</li>
                <li>Total Sprints: {reportData.stats.totalSprints}</li>
                <li>Total Issues: {reportData.stats.totalIssues}</li>
                <li>Completion Rate: {reportData.stats.completionRate.toFixed(1)}%</li>
              </ul>
            </div>
            <div>
              <h3 className="font-medium">Tasks:</h3>
              <p>Count: {reportData.tasks.length}</p>
            </div>
            <div>
              <h3 className="font-medium">Sprints:</h3>
              <p>Count: {reportData.sprints.length}</p>
            </div>
            <div>
              <h3 className="font-medium">Issues:</h3>
              <p>Count: {reportData.issues.length}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default TestReports 