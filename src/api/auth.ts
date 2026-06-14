import axios from 'axios'

const BASE_URL = 'https://admin-moderator-backend-staging.up.railway.app/api'

const USE_MOCK = false

export const apiClient = axios.create({
  baseURL: BASE_URL,
})

apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

export const login = async (userId: string, password: string) => {
  if (USE_MOCK) {
    if (userId === 'vedant-admin' && password === 'vedant123') {
      return {
        success: true,
        data: {
          token: 'mock-jwt-token',
          user: { id: 'u1', userId: 'vedant-admin', role: 'Admin' }
        }
      }
    }
    throw new Error('Invalid credentials')
  }
  const response = await apiClient.post('/auth/login', { userId, password })
  return response.data
}