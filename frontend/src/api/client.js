import axios from 'axios'

const LOCAL_URL = "http://localhost:4000/api"
const PROD_URL = "https://smartdiet-api-3atj.onrender.com/api"

const api = axios.create({ baseURL:  PROD_URL})

api.interceptors.request.use(config => {
  const token = localStorage.getItem('token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

api.interceptors.response.use(
  res => res,
  err => {
    if (err.response?.status === 401) {
      localStorage.removeItem('token')
      window.location.href = '/login'
    }
    return Promise.reject(err)
  }
)

export default api
