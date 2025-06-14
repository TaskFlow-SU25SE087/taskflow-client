import { authApi } from '@/api/auth'

export const useAuthService = () => {
  return {
    login: authApi.login,
    logout: authApi.logout,
    register: authApi.register
  }
}
