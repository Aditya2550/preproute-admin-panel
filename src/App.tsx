import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import CreateTest from './pages/CreateTest'
import AddQuestions from './pages/AddQuestions'
import Preview from './pages/Preview'

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated } = useAuth()
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" replace />
}

function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
      <Route path="/create-test" element={<ProtectedRoute><CreateTest /></ProtectedRoute>} />
      <Route path="/edit-test/:id" element={<ProtectedRoute><CreateTest /></ProtectedRoute>} />
      <Route path="/add-questions/:testId" element={<ProtectedRoute><AddQuestions /></ProtectedRoute>} />
      <Route path="/preview/:testId" element={<ProtectedRoute><Preview /></ProtectedRoute>} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default App