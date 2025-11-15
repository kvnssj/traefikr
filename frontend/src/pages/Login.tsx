import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { Paper, TextInput, PasswordInput, Button, Title, Text, Alert, Stack, ThemeIcon, Loader } from '@mantine/core'
import { AlertCircle, LogIn } from 'lucide-react'

export default function Login() {
  const navigate = useNavigate()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const { login } = useAuth()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    try {
      await login(username, password)
      navigate('/')  // Navigate to dashboard after successful login
    } catch (err: any) {
      if (err.response?.status === 401) {
        setError('Invalid username or password')
      } else {
        setError('An error occurred. Please try again.')
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--mantine-color-gray-0)', display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '3rem 1.5rem' }}>
      <Stack align="center" gap="xl" style={{ maxWidth: '28rem', margin: '0 auto', width: '100%' }}>
        <Paper withBorder shadow="md" p="xl" style={{ width: '100%' }}>
          <Stack align="center" gap="lg" mb="xl">
            <img
              src="/traefikr_logo.svg"
              alt="Traefikr Logo"
              style={{
                width: 80,
                height: 80
              }}
            />
            <Title order={1} ta="center">
              Welcome to Traefikr
            </Title>
            <Text ta="center" c="dimmed">
              Sign in to manage your Traefik configuration
            </Text>
          </Stack>

          <form onSubmit={handleSubmit}>
            <Stack gap="lg">
              {error && (
                <Alert icon={<AlertCircle size={16} />} color="red">
                  {error}
                </Alert>
              )}

              <TextInput
                label="Username"
                placeholder="admin"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                autoComplete="username"
              />

              <PasswordInput
                label="Password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
              />

              <Button
                type="submit"
                fullWidth
                disabled={isLoading}
                leftSection={isLoading ? <Loader size={16} /> : <LogIn size={16} />}
              >
                {isLoading ? 'Signing in...' : 'Sign in'}
              </Button>
            </Stack>
          </form>
        </Paper>
      </Stack>
    </div>
  )
}