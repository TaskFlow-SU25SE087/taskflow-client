export interface AdminUser {
  id: string
  avatar: string
  fullName: string
  role: string | number
  email: string
  phoneNumber: string
  isActive: boolean
}

export interface AdminUsersResponse {
  code: number
  message: string
  data: {
    items: AdminUser[]
    totalItems: number
    totalPages: number
    pageNumber: number
    pageSize: number
  }
}

export interface AdminUsersParams {
  page?: number
} 