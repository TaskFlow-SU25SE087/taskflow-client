import { format } from 'date-fns'
import {
    AlertTriangle,
    BarChart3,
    Bug,
    CheckCircle,
    Code,
    Minus,
    RefreshCw,
    Shield,
    TrendingDown,
    TrendingUp,
    XCircle
} from 'lucide-react'
import React, { useEffect, useState } from 'react'
import { useWebhooks } from '../../hooks/useWebhooks'
import { CodeQualityResult } from '../../types/webhook'
import { Badge } from '../ui/badge'
import { Button } from '../ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { Loader } from '../ui/loader'
import { Progress } from '../ui/progress'

interface CodeQualityDashboardProps {
  projectId: string
  partId: string
}

interface QualityMetricCardProps {
  title: string
  value: number
  maxValue: number
  icon: React.ReactNode
  color: string
  trend?: 'up' | 'down' | 'stable'
}

function QualityMetricCard({ title, value, maxValue, icon, color, trend }: QualityMetricCardProps) {
  const percentage = (value / maxValue) * 100

  const getTrendIcon = () => {
    switch (trend) {
      case 'up':
        return <TrendingUp className='h-4 w-4 text-green-500' />
      case 'down':
        return <TrendingDown className='h-4 w-4 text-red-500' />
      default:
        return <Minus className='h-4 w-4 text-gray-500' />
    }
  }

  return (
    <Card>
      <CardContent className='p-6'>
        <div className='flex items-center justify-between mb-4'>
          <div className='flex items-center gap-2'>
            <div className={`p-2 rounded-lg ${color}`}>{icon}</div>
            <span className='font-medium text-gray-700'>{title}</span>
          </div>
          {trend && getTrendIcon()}
        </div>

        <div className='space-y-2'>
          <div className='flex items-center justify-between'>
            <span className='text-2xl font-bold'>{value}</span>
            <span className='text-sm text-gray-500'>/ {maxValue}</span>
          </div>
          <Progress value={percentage} className='h-2' />
          <span className='text-sm text-gray-500'>{percentage.toFixed(1)}%</span>
        </div>
      </CardContent>
    </Card>
  )
}

interface QualityTrendChartProps {
  qualityResults: CodeQualityResult[]
}

function QualityTrendChart({ qualityResults }: QualityTrendChartProps) {
  const sortedResults = qualityResults
    .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
    .slice(-10) // Last 10 results

  if (sortedResults.length === 0) {
    return (
      <Card>
        <CardContent className='p-6'>
          <div className='text-center text-gray-500'>
            <BarChart3 className='h-12 w-12 mx-auto mb-4 text-gray-300' />
            <p>No quality data available</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className='flex items-center gap-2'>
          <BarChart3 className='h-5 w-5' />
          Quality Trend (Last 10 Commits)
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className='space-y-4'>
          {sortedResults.map((result) => (
            <div key={result.id} className='flex items-center justify-between'>
              <div className='flex items-center gap-3'>
                <span className='text-sm text-gray-500 w-16'>{format(new Date(result.createdAt), 'MMM dd')}</span>
                <span className='text-sm font-mono text-gray-600'>{result.commitHash.substring(0, 8)}</span>
              </div>
              <div className='flex items-center gap-2'>
                <span className='text-sm font-medium'>{result.overallScore}</span>
                <div
                  className={`w-3 h-3 rounded-full ${
                    result.overallScore >= 80
                      ? 'bg-green-500'
                      : result.overallScore >= 60
                        ? 'bg-yellow-500'
                        : 'bg-red-500'
                  }`}
                />
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

export default function CodeQualityDashboard({ projectId, partId }: CodeQualityDashboardProps) {
  const { qualityResults, qualityLoading, error, fetchQualityResults, getLatestQualityResult } = useWebhooks()

  const [autoRefresh, setAutoRefresh] = useState(true)

  // Auto-refresh every 60 seconds
  useEffect(() => {
    if (!autoRefresh) return

    const interval = setInterval(() => {
      fetchQualityResults(projectId, partId)
    }, 60000)

    return () => clearInterval(interval)
  }, [autoRefresh, projectId, partId, fetchQualityResults])

  // Initial fetch
  useEffect(() => {
    fetchQualityResults(projectId, partId)
  }, [projectId, partId, fetchQualityResults])

  const handleRefresh = () => {
    fetchQualityResults(projectId, partId)
  }

  const latestQuality = getLatestQualityResult()

  if (qualityLoading && qualityResults.length === 0) {
    return (
      <div className='flex items-center justify-center p-8'>
        <Loader />
      </div>
    )
  }

  return (
    <div className='space-y-6'>
      {/* Header */}
      <div className='flex items-center justify-between'>
        <div>
          <h2 className='text-2xl font-bold'>Code Quality Dashboard</h2>
          <p className='text-gray-600'>Monitor code quality metrics and trends</p>
        </div>

        <div className='flex items-center gap-2'>
          <Button variant='outline' size='sm' onClick={handleRefresh} disabled={qualityLoading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${qualityLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>

          <Button variant={autoRefresh ? 'default' : 'outline'} size='sm' onClick={() => setAutoRefresh(!autoRefresh)}>
            Auto-refresh {autoRefresh ? 'ON' : 'OFF'}
          </Button>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className='bg-red-50 border border-red-200 rounded-lg p-4'>
          <div className='flex items-center gap-2'>
            <XCircle className='h-5 w-5 text-red-500' />
            <span className='text-red-700'>{error}</span>
          </div>
        </div>
      )}

      {/* Overall Quality Score */}
      {latestQuality && (
        <Card className='bg-gradient-to-r from-blue-50 to-indigo-50'>
          <CardContent className='p-6'>
            <div className='flex items-center justify-between'>
              <div>
                <h3 className='text-lg font-semibold text-gray-900'>Overall Quality Score</h3>
                <p className='text-gray-600'>
                  Latest analysis from {format(new Date(latestQuality.createdAt), 'MMM d, yyyy HH:mm')}
                </p>
              </div>
              <div className='text-right'>
                <div className='text-4xl font-bold text-blue-600'>{latestQuality.overallScore}</div>
                <div className='text-sm text-gray-500'>out of 100</div>
              </div>
            </div>

            <div className='mt-4'>
              <Progress value={latestQuality.overallScore} className='h-3' />
            </div>

            <div className='mt-2 flex items-center gap-2'>
              {latestQuality.overallScore >= 80 ? (
                <Badge variant='default' className='bg-green-100 text-green-700'>
                  <CheckCircle className='h-3 w-3 mr-1' />
                  Excellent
                </Badge>
              ) : latestQuality.overallScore >= 60 ? (
                <Badge variant='secondary' className='bg-yellow-100 text-yellow-700'>
                  <AlertTriangle className='h-3 w-3 mr-1' />
                  Good
                </Badge>
              ) : (
                <Badge variant='destructive'>
                  <XCircle className='h-3 w-3 mr-1' />
                  Needs Improvement
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quality Metrics */}
      {latestQuality && (
        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4'>
          <QualityMetricCard
            title='Maintainability'
            value={latestQuality.maintainability}
            maxValue={100}
            icon={<Code className='h-5 w-5 text-blue-600' />}
            color='bg-blue-100'
          />

          <QualityMetricCard
            title='Reliability'
            value={latestQuality.reliability}
            maxValue={100}
            icon={<Shield className='h-5 w-5 text-green-600' />}
            color='bg-green-100'
          />

          <QualityMetricCard
            title='Security'
            value={latestQuality.security}
            maxValue={100}
            icon={<Shield className='h-5 w-5 text-purple-600' />}
            color='bg-purple-100'
          />

          <QualityMetricCard
            title='Coverage'
            value={latestQuality.coverage}
            maxValue={100}
            icon={<BarChart3 className='h-5 w-5 text-orange-600' />}
            color='bg-orange-100'
          />
        </div>
      )}

      {/* Issues Summary */}
      {latestQuality && (
        <div className='grid grid-cols-1 md:grid-cols-4 gap-4'>
          <Card>
            <CardContent className='p-4'>
              <div className='flex items-center gap-2'>
                <Bug className='h-5 w-5 text-red-500' />
                <div>
                  <p className='text-sm text-gray-600'>Bugs</p>
                  <p className='text-2xl font-bold text-red-600'>{latestQuality.bugs}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className='p-4'>
              <div className='flex items-center gap-2'>
                <AlertTriangle className='h-5 w-5 text-orange-500' />
                <div>
                  <p className='text-sm text-gray-600'>Vulnerabilities</p>
                  <p className='text-2xl font-bold text-orange-600'>{latestQuality.vulnerabilities}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className='p-4'>
              <div className='flex items-center gap-2'>
                <Code className='h-5 w-5 text-yellow-500' />
                <div>
                  <p className='text-sm text-gray-600'>Code Smells</p>
                  <p className='text-2xl font-bold text-yellow-600'>{latestQuality.codeSmells}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className='p-4'>
              <div className='flex items-center gap-2'>
                <Shield className='h-5 w-5 text-blue-500' />
                <div>
                  <p className='text-sm text-gray-600'>Security Hotspots</p>
                  <p className='text-2xl font-bold text-blue-600'>{latestQuality.securityHotspots}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Quality Trend */}
      <QualityTrendChart qualityResults={qualityResults} />

      {/* No Data State */}
      {qualityResults.length === 0 && !qualityLoading && (
        <div className='text-center py-12 text-gray-500'>
          <BarChart3 className='h-16 w-16 mx-auto mb-4 text-gray-300' />
          <h3 className='text-lg font-medium mb-2'>No Quality Data Available</h3>
          <p className='text-sm'>Connect a repository and make some commits to see quality analysis results.</p>
        </div>
      )}

      {/* Loading indicator for refresh */}
      {qualityLoading && qualityResults.length > 0 && (
        <div className='flex items-center justify-center py-4'>
          <RefreshCw className='h-6 w-6 animate-spin text-blue-500' />
          <span className='ml-2 text-gray-600'>Updating quality data...</span>
        </div>
      )}
    </div>
  )
}
