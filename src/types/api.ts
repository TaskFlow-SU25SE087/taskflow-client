export interface APIError {
  response?: {
    data?: {
      message?: string
    }
  }
  message?: string
}

export interface APIResponse<T> {
  data: T
  message?: string
  code: number
}
