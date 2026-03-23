import axios from 'axios'

const apiClient = axios.create({
  baseURL: 'https://task-manager-api-amber-theta.vercel.app',
  headers: {
    'Content-Type': 'application/json',
  },
})
//'http://localhost:3000/api'
//'https://task-api-backend-36bi.onrender.com/api'
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token')

    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }

    return config
  },
  (error) => {
    return Promise.reject(error)
  },
)

export default apiClient
