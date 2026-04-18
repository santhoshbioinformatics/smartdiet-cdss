import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import useAuthStore from './store/authStore'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import PatientWorkflow from './pages/PatientWorkflow'

function ProtectedRoute({ children }) {
  const { token } = useAuthStore()
  if (!token) return <Navigate to="/login" replace/>
  return children
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login/>}/>
        <Route path="/" element={
          <ProtectedRoute><Dashboard/></ProtectedRoute>
        }/>
        <Route path="/patient/:mrn" element={
          <ProtectedRoute><PatientWorkflow/></ProtectedRoute>
        }/>
      </Routes>
    </BrowserRouter>
  )
}
