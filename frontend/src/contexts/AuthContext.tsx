import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { api, authApi } from '@/lib/api'

interface User {
  username: string
}

interface AuthContextType {
  user: User | null
  token: string | null
  login: (username: string, password: string) => Promise<void>
  logout: () => void
  isLoading: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'))
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (token) {
      // Set the token in axios defaults
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`

      // Try to extract username from localStorage
      const storedUsername = localStorage.getItem('username')
      if (storedUsername) {
        setUser({ username: storedUsername })
      }

      setIsLoading(false)
    } else {
      setIsLoading(false)
    }
  }, [token])

  const login = async (username: string, password: string) => {
    const response = await authApi.login({ username, password })

    const { token: accessToken } = response.data

    // Store token and username
    localStorage.setItem('token', accessToken)
    localStorage.setItem('username', username)
    setToken(accessToken)
    setUser({ username })

    // Set axios default header
    api.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`
  }

  const logout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('username')
    setToken(null)
    setUser(null)
    delete api.defaults.headers.common['Authorization']
    // Navigation will be handled by the component calling logout
  }

  return (
    <AuthContext.Provider value={{ user, token, login, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
