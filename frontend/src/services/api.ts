import axios, { AxiosInstance, AxiosError } from 'axios'

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api/v1'

// 创建axios实例
const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json'
  }
})

// 请求拦截器
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

// 响应拦截器
apiClient.interceptors.response.use(
  (response) => response.data,
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token')
      window.location.href = '/login'
    }
    return Promise.reject(error.response?.data || error.message)
  }
)

// 视频API
export const videoApi = {
  list: (params?: any) => apiClient.get('/videos', { params }),
  getById: (id: string) => apiClient.get(`/videos/${id}`),
  create: (data: any) => apiClient.post('/videos', data),
  update: (id: string, data: any) => apiClient.put(`/videos/${id}`, data),
  delete: (id: string) => apiClient.delete(`/videos/${id}`),
  generate: (id: string) => apiClient.post(`/videos/${id}/generate`),
  getStatus: (id: string) => apiClient.get(`/videos/${id}/status`),
  adapt: (id: string, platforms: string[]) => apiClient.post(`/videos/${id}/adapt`, { platforms })
}

// 热点API
export const trendApi = {
  list: () => apiClient.get('/trends'),
  prediction: () => apiClient.get('/trends/prediction'),
  wudang: () => apiClient.get('/trends/wudang'),
  createResponse: (data: any) => apiClient.post('/trends/response', data)
}

// 任务API
export const taskApi = {
  list: () => apiClient.get('/tasks'),
  create: (data: any) => apiClient.post('/tasks', data),
  updateStatus: (id: string, status: string) => apiClient.put(`/tasks/${id}/status`, { status })
}

// 统计API
export const statsApi = {
  dashboard: () => apiClient.get('/stats/dashboard'),
  daily: (params?: any) => apiClient.get('/stats/daily', { params }),
  weeklyReport: () => apiClient.get('/stats/weekly-report')
}

// 日历API
export const calendarApi = {
  list: () => apiClient.get('/calendar'),
  create: (data: any) => apiClient.post('/calendar', data),
  checkConflicts: () => apiClient.get('/calendar/conflicts')
}

// 系统API
export const systemApi = {
  config: () => apiClient.get('/system/config'),
  festivals: () => apiClient.get('/system/festivals')
}

export default apiClient
