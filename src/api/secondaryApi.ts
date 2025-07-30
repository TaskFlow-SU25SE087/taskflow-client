import { secondaryAxiosClient } from '@/configs/axiosClient'

const ENDPOINT = '/api'

// Example API calls for secondary service (port 7029)
export const secondaryApi = {
  // Example: Get data from secondary service
  getSecondaryData: async () => {
    const response = await secondaryAxiosClient.get(`${ENDPOINT}/data`)
    return response.data
  },

  // Example: Post data to secondary service
  postSecondaryData: async (data: any) => {
    const response = await secondaryAxiosClient.post(`${ENDPOINT}/data`, data)
    return response.data
  },

  // Example: Update data in secondary service
  updateSecondaryData: async (id: string, data: any) => {
    const response = await secondaryAxiosClient.put(`${ENDPOINT}/data/${id}`, data)
    return response.data
  },

  // Example: Delete data from secondary service
  deleteSecondaryData: async (id: string) => {
    const response = await secondaryAxiosClient.delete(`${ENDPOINT}/data/${id}`)
    return response.data
  },

  // Example: Health check for secondary service
  healthCheck: async () => {
    const response = await secondaryAxiosClient.get(`${ENDPOINT}/health`)
    return response.data
  }
} 