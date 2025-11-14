import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'

export function ProtectedRoute({ children }: { children: JSX.Element }) {
  const { token, isLoading } = useAuth()
  const location = useLocation()

  console.log('[PROTECTED_ROUTE] Render - path:', location.pathname, 'token:', token ? 'exists' : 'null', 'isLoading:', isLoading)

  if (isLoading) {
    console.log('[PROTECTED_ROUTE] Showing loading state')
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-traefik-blue mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  if (!token) {
    console.log('[PROTECTED_ROUTE] No token, redirecting to /login from:', location.pathname)
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  console.log('[PROTECTED_ROUTE] Rendering protected content for:', location.pathname)
  return children
}