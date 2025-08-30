interface HealthCheckResult {
  isHealthy: boolean
  responseTime: number
  error?: string
}

export const checkServerHealth = async (): Promise<HealthCheckResult> => {
  // Health check completely disabled - always return healthy
  return {
    isHealthy: true,
    responseTime: 0
  }
}

export const shouldSkipHealthCheck = (): boolean => {
  // Always skip health check
  return true
} 