export interface AdminUser {
  id: string
  avatar: string
  fullName: string
  role: string | number
  email: string
  phoneNumber: string
  studentId: string | null
  term: string | null
  isActive: boolean
  isPermanentlyBanned: boolean
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
  pageSize?: number
} 