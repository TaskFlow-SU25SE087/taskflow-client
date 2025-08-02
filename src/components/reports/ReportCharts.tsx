import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Activity, BarChart3, LineChart, Minus, PieChart, PieChart as PieChartIcon, TrendingDown, TrendingUp } from 'lucide-react'
import React from 'react'

interface ChartData {
  label: string
  value: number
  color: string
  percentage?: number
}

interface MetricCardProps {
  title: string
  value: string | number
  change?: number
  changeLabel?: string
  icon: React.ReactNode
  color?: string
}

interface ProgressChartProps {
  title: string
  description?: string
  data: ChartData[]
  total: number
}

interface DistributionChartProps {
  title: string
  description?: string
  data: ChartData[]
}

export const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  change,
  changeLabel,
  icon,
  color = 'blue'
}) => {
  const getChangeIcon = () => {
    if (!change) return <Minus className="h-4 w-4 text-gray-400" />
    return change > 0 ? (
      <TrendingUp className="h-4 w-4 text-green-500" />
    ) : (
      <TrendingDown className="h-4 w-4 text-red-500" />
    )
  }

  const getChangeColor = () => {
    if (!change) return 'text-gray-500'
    return change > 0 ? 'text-green-600' : 'text-red-600'
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <div className={`h-8 w-8 rounded-lg bg-${color}-50 flex items-center justify-center`}>
          {icon}
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {change !== undefined && (
          <div className="flex items-center space-x-1 text-xs">
            {getChangeIcon()}
            <span className={getChangeColor()}>
              {change > 0 ? '+' : ''}{change}%
            </span>
            {changeLabel && <span className="text-gray-500">vs {changeLabel}</span>}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export const ProgressChart: React.FC<ProgressChartProps> = ({
  title,
  description,
  data,
  total
}) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent className="space-y-4">
        {data.map((item, index) => (
          <div key={index} className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: item.color }}
                ></div>
                <span className="text-sm font-medium">{item.label}</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-sm font-medium">{item.value}</span>
                {item.percentage && (
                  <Badge variant="outline">{item.percentage.toFixed(1)}%</Badge>
                )}
              </div>
            </div>
            <Progress
              value={total > 0 ? (item.value / total) * 100 : 0}
              className="h-2"
              style={{
                '--progress-background': item.color
              } as React.CSSProperties}
            />
          </div>
        ))}
      </CardContent>
    </Card>
  )
}

export const DistributionChart: React.FC<DistributionChartProps> = ({
  title,
  description,
  data
}) => {
  const total = data.reduce((sum, item) => sum + item.value, 0)

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent className="space-y-4">
        {data.map((item, index) => {
          const percentage = total > 0 ? (item.value / total) * 100 : 0
          return (
            <div key={index} className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: item.color }}
                ></div>
                <span className="text-sm">{item.label}</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-sm font-medium">{item.value}</span>
                <Badge variant="outline">{percentage.toFixed(1)}%</Badge>
              </div>
            </div>
          )
        })}
      </CardContent>
    </Card>
  )
}

export const ActivityTimeline: React.FC<{ activities: Array<{
  id: string
  title: string
  description: string
  timestamp: string
  type: 'task' | 'sprint' | 'issue'
}> }> = ({ activities }) => {
  const getTypeColor = (type: string) => {
    switch (type) {
      case 'task':
        return 'bg-blue-500'
      case 'sprint':
        return 'bg-green-500'
      case 'issue':
        return 'bg-red-500'
      default:
        return 'bg-gray-500'
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'task':
        return '📋'
      case 'sprint':
        return '🏃'
      case 'issue':
        return '⚠️'
      default:
        return '📄'
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Activity</CardTitle>
        <CardDescription>Latest updates and changes</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {activities.map((activity) => (
            <div key={activity.id} className="flex items-start space-x-3">
              <div className={`w-2 h-2 rounded-full mt-2 ${getTypeColor(activity.type)}`}></div>
              <div className="flex-1 space-y-1">
                <div className="flex items-center space-x-2">
                  <span className="text-sm">{getTypeIcon(activity.type)}</span>
                  <p className="text-sm font-medium">{activity.title}</p>
                </div>
                <p className="text-xs text-gray-600">{activity.description}</p>
                <p className="text-xs text-gray-500">
                  {new Date(activity.timestamp).toLocaleString()}
                </p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

export const SummaryStats: React.FC<{ stats: Array<{
  label: string
  value: number
  unit?: string
  trend?: number
}> }> = ({ stats }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat, index) => (
        <Card key={index}>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-sm font-medium text-gray-600">{stat.label}</p>
              <div className="flex items-center justify-center space-x-1 mt-1">
                <span className="text-2xl font-bold">{stat.value}</span>
                {stat.unit && <span className="text-sm text-gray-500">{stat.unit}</span>}
              </div>
              {stat.trend !== undefined && (
                <div className="flex items-center justify-center space-x-1 mt-1">
                  {stat.trend > 0 ? (
                    <TrendingUp className="h-3 w-3 text-green-500" />
                  ) : (
                    <TrendingDown className="h-3 w-3 text-red-500" />
                  )}
                  <span className={`text-xs ${stat.trend > 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {stat.trend > 0 ? '+' : ''}{stat.trend}%
                  </span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

// Bar Chart Component
export const BarChart: React.FC<{
  title: string
  description?: string
  data: Array<{ label: string; value: number; color?: string }>
}> = ({ title, description, data }) => {
  const maxValue = Math.max(...data.map(d => d.value))
  
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5" />
          {title}
        </CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {data.map((item, index) => (
            <div key={index} className="space-y-1">
              <div className="flex justify-between text-sm">
                <span className="font-medium">{item.label}</span>
                <span className="text-gray-600">{item.value}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className={`h-2 rounded-full ${item.color || 'bg-blue-500'}`}
                  style={{ width: `${(item.value / maxValue) * 100}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

// Pie Chart Component (simplified)
export const PieChartComponent: React.FC<{
  title: string
  description?: string
  data: Array<{ label: string; value: number; color: string }>
}> = ({ title, description, data }) => {
  const total = data.reduce((sum, item) => sum + item.value, 0)
  
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <PieChart className="h-5 w-5" />
          {title}
        </CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {data.map((item, index) => {
            const percentage = total > 0 ? (item.value / total) * 100 : 0
            return (
              <div key={index} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="text-sm font-medium">{item.label}</span>
                </div>
                <div className="text-sm text-gray-600">
                  {item.value} ({percentage.toFixed(1)}%)
                </div>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}

// Activity Chart Component
export const ActivityChart: React.FC<{
  title: string
  description?: string
  data: Array<{ date: string; tasks: number; issues: number; sprints: number }>
}> = ({ title, description, data }) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="h-5 w-5" />
          {title}
        </CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {data.map((item, index) => (
            <div key={index} className="flex items-center justify-between p-2 border rounded">
              <span className="text-sm font-medium">{item.date}</span>
              <div className="flex gap-4 text-xs">
                <span className="text-blue-600">Tasks: {item.tasks}</span>
                <span className="text-red-600">Issues: {item.issues}</span>
                <span className="text-green-600">Sprints: {item.sprints}</span>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

// Line Chart Component
export const LineChartComponent: React.FC<{
  title: string
  description?: string
  data: Array<{ label: string; value: number; color?: string }>
}> = ({ title, description, data }) => {
  const maxValue = Math.max(...data.map(d => d.value))
  const minValue = Math.min(...data.map(d => d.value))
  const range = maxValue - minValue
  
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <LineChart className="h-5 w-5" />
          {title}
        </CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent>
        <div className="relative h-48 w-full">
          <svg className="w-full h-full" viewBox={`0 0 ${data.length * 60} 200`}>
            {/* Grid lines */}
            {[0, 25, 50, 75, 100].map((percent, i) => (
              <line
                key={i}
                x1="0"
                y1={200 - (percent * 2)}
                x2={data.length * 60}
                y2={200 - (percent * 2)}
                stroke="#e5e7eb"
                strokeWidth="1"
              />
            ))}
            
            {/* Line path */}
            <path
              d={data.map((point, index) => {
                const x = index * 60 + 30
                const y = range > 0 ? 200 - ((point.value - minValue) / range) * 180 : 110
                return `${index === 0 ? 'M' : 'L'} ${x} ${y}`
              }).join(' ')}
              stroke="#3b82f6"
              strokeWidth="3"
              fill="none"
            />
            
            {/* Data points */}
            {data.map((point, index) => {
              const x = index * 60 + 30
              const y = range > 0 ? 200 - ((point.value - minValue) / range) * 180 : 110
              return (
                <circle
                  key={index}
                  cx={x}
                  cy={y}
                  r="4"
                  fill="#3b82f6"
                  stroke="white"
                  strokeWidth="2"
                />
              )
            })}
            
            {/* Labels */}
            {data.map((point, index) => {
              const x = index * 60 + 30
              return (
                <text
                  key={index}
                  x={x}
                  y="220"
                  textAnchor="middle"
                  className="text-xs fill-gray-600"
                >
                  {point.label}
                </text>
              )
            })}
          </svg>
        </div>
      </CardContent>
    </Card>
  )
}

// Donut Chart Component
export const DonutChart: React.FC<{
  title: string
  description?: string
  data: Array<{ label: string; value: number; color: string }>
}> = ({ title, description, data }) => {
  const total = data.reduce((sum, item) => sum + item.value, 0)
  const radius = 60
  const circumference = 2 * Math.PI * radius
  
  let currentAngle = -Math.PI / 2 // Start from top
  
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <PieChartIcon className="h-5 w-5" />
          {title}
        </CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-center">
          <div className="relative">
            <svg width="150" height="150" className="transform -rotate-90">
              {data.map((item, index) => {
                const percentage = total > 0 ? item.value / total : 0
                const arcLength = percentage * circumference
                const arcAngle = (arcLength / circumference) * 2 * Math.PI
                
                const x1 = radius * Math.cos(currentAngle)
                const y1 = radius * Math.sin(currentAngle)
                const x2 = radius * Math.cos(currentAngle + arcAngle)
                const y2 = radius * Math.sin(currentAngle + arcAngle)
                
                const largeArcFlag = arcAngle > Math.PI ? 1 : 0
                
                const pathData = [
                  `M ${x1 + 75} ${y1 + 75}`,
                  `A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2 + 75} ${y2 + 75}`
                ].join(' ')
                
                currentAngle += arcAngle
                
                return (
                  <path
                    key={index}
                    d={pathData}
                    fill="none"
                    stroke={item.color}
                    strokeWidth="20"
                    strokeLinecap="round"
                  />
                )
              })}
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <div className="text-2xl font-bold">{total}</div>
                <div className="text-sm text-gray-600">Total</div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Legend */}
        <div className="mt-4 space-y-2">
          {data.map((item, index) => {
            const percentage = total > 0 ? (item.value / total) * 100 : 0
            return (
              <div key={index} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="text-sm font-medium">{item.label}</span>
                </div>
                <div className="text-sm text-gray-600">
                  {item.value} ({percentage.toFixed(1)}%)
                </div>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}

// Multi-line Chart Component
export const MultiLineChart: React.FC<{
  title: string
  description?: string
  data: Array<{ label: string; tasks: number; issues: number; sprints: number }>
}> = ({ title, description, data }) => {
  const maxValue = Math.max(
    ...data.flatMap(d => [d.tasks, d.issues, d.sprints])
  )
  
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <LineChart className="h-5 w-5" />
          {title}
        </CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Legend */}
          <div className="flex gap-4 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-blue-500 rounded"></div>
              <span>Tasks</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-red-500 rounded"></div>
              <span>Issues</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-green-500 rounded"></div>
              <span>Sprints</span>
            </div>
          </div>
          
          {/* Chart */}
          <div className="space-y-2">
            {data.map((item, index) => (
              <div key={index} className="flex items-center gap-4">
                <div className="w-16 text-sm font-medium">{item.label}</div>
                <div className="flex-1 flex gap-1">
                  <div
                    className="bg-blue-500 rounded"
                    style={{ 
                      width: `${(item.tasks / maxValue) * 100}%`,
                      height: '20px'
                    }}
                  ></div>
                  <div
                    className="bg-red-500 rounded"
                    style={{ 
                      width: `${(item.issues / maxValue) * 100}%`,
                      height: '20px'
                    }}
                  ></div>
                  <div
                    className="bg-green-500 rounded"
                    style={{ 
                      width: `${(item.sprints / maxValue) * 100}%`,
                      height: '20px'
                    }}
                  ></div>
                </div>
                <div className="text-xs text-gray-600 w-20">
                  T:{item.tasks} I:{item.issues} S:{item.sprints}
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// Stacked Bar Chart Component
export const StackedBarChart: React.FC<{
  title: string
  description?: string
  data: Array<{ label: string; completed: number; inProgress: number; pending: number }>
}> = ({ title, description, data }) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5" />
          {title}
        </CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Legend */}
          <div className="flex gap-4 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-green-500 rounded"></div>
              <span>Completed</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-blue-500 rounded"></div>
              <span>In Progress</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-gray-400 rounded"></div>
              <span>Pending</span>
            </div>
          </div>
          
          {/* Bars */}
          <div className="space-y-3">
            {data.map((item, index) => {
              const total = item.completed + item.inProgress + item.pending
              return (
                <div key={index} className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span className="font-medium">{item.label}</span>
                    <span className="text-gray-600">{total}</span>
                  </div>
                  <div className="flex h-6 bg-gray-200 rounded overflow-hidden">
                    <div
                      className="bg-green-500"
                      style={{ width: `${(item.completed / total) * 100}%` }}
                    ></div>
                    <div
                      className="bg-blue-500"
                      style={{ width: `${(item.inProgress / total) * 100}%` }}
                    ></div>
                    <div
                      className="bg-gray-400"
                      style={{ width: `${(item.pending / total) * 100}%` }}
                    ></div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  )
} 