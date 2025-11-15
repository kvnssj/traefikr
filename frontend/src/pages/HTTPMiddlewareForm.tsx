import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  Container,
  Title,
  Button,
  Group,
  Stack,
  TextInput,
  Card,
  Text,
  Loader,
  Badge,
} from '@mantine/core'
import { notifications } from '@mantine/notifications'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { IconGitBranch, IconDeviceFloppy, IconArrowLeft } from '@tabler/icons-react'
import { resourcesApi } from '@/lib/api'
import { MiddlewareSchemaForm } from '@/components/MiddlewareSchemaForm'

export default function HTTPMiddlewareForm() {
  const navigate = useNavigate()
  const { name, middlewareType, protocol = 'http' } = useParams<{ name: string; middlewareType?: string; protocol?: string }>()
  const queryClient = useQueryClient()
  const isEditMode = !!name

  // Middleware type (e.g., basicAuth, rateLimit, etc.)
  const type = middlewareType || 'addPrefix'

  const [formData, setFormData] = useState({
    name: '',
    provider: 'http',
    type: type,
    config: {},
  })

  // Fetch existing middleware in edit mode
  const { data: existingMiddleware, isLoading: isLoadingMiddleware } = useQuery({
    queryKey: ['resources', protocol, 'middlewares', name],
    queryFn: async () => {
      if (!name) return null
      const response = await resourcesApi.get(protocol as any, 'middlewares', name)
      return response.data
    },
    enabled: isEditMode,
  })

  // Populate form when editing
  useEffect(() => {
    if (existingMiddleware) {
      // Detect middleware type from config and unwrap
      let detectedType = type
      let unwrappedConfig = {}

      // Find which middleware type is present
      for (const key of Object.keys(existingMiddleware.config || {})) {
        detectedType = key
        unwrappedConfig = existingMiddleware.config[key]
        break
      }

      setFormData({
        name: existingMiddleware.name.split('@')[0], // Remove @provider suffix
        provider: existingMiddleware.provider,
        type: detectedType,
        config: unwrappedConfig,
      })
    }
  }, [existingMiddleware, type])

  // Create mutation
  const createMutation = useMutation({
    mutationFn: async () => {
      // Wrap config under the type key
      const payload = {
        ...formData,
        config: {
          [formData.type]: formData.config
        }
      }
      const response = await resourcesApi.create(protocol as any, 'middlewares', payload)
      return response.data
    },
    onSuccess: () => {
      notifications.show({
        title: 'Success',
        message: 'Middleware created successfully',
        color: 'green',
      })
      queryClient.invalidateQueries({ queryKey: ['resources', protocol, 'middlewares'] })
      navigate('/middlewares')
    },
    onError: (error: any) => {
      notifications.show({
        title: 'Error',
        message: error.response?.data?.error || 'Failed to create middleware',
        color: 'red',
      })
    },
  })

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: async () => {
      if (!name) throw new Error('No middleware name provided')
      // Wrap config under the type key
      const response = await resourcesApi.update(protocol as any, 'middlewares', name, {
        config: {
          [formData.type]: formData.config
        },
      })
      return response.data
    },
    onSuccess: () => {
      notifications.show({
        title: 'Success',
        message: 'Middleware updated successfully',
        color: 'green',
      })
      queryClient.invalidateQueries({ queryKey: ['resources', protocol, 'middlewares'] })
      navigate('/middlewares')
    },
    onError: (error: any) => {
      notifications.show({
        title: 'Error',
        message: error.response?.data?.error || 'Failed to update middleware',
        color: 'red',
      })
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    // Validation
    if (!formData.name.trim()) {
      notifications.show({
        title: 'Validation Error',
        message: 'Middleware name is required',
        color: 'red',
      })
      return
    }

    if (isEditMode) {
      updateMutation.mutate()
    } else {
      createMutation.mutate()
    }
  }

  if (isEditMode && isLoadingMiddleware) {
    return (
      <Container size="md">
        <Stack align="center" justify="center" style={{ minHeight: '400px' }}>
          <Loader size="lg" />
          <Text>Loading middleware...</Text>
        </Stack>
      </Container>
    )
  }

  const isSubmitting = createMutation.isPending || updateMutation.isPending

  // Format type label
  const typeLabel = formData.type
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, (str) => str.toUpperCase())
    .trim()

  return (
    <Container size="md">
      <Stack gap="lg">
        {/* Header */}
        <Group justify="space-between">
          <Group>
            <IconGitBranch size={32} stroke={1.5} color="#00aec1" />
            <div>
              <Group gap="xs">
                <Title order={2}>{isEditMode ? 'Edit' : 'Create'} Middleware</Title>
                <Badge color="cyan" variant="light" size="lg">
                  {typeLabel}
                </Badge>
              </Group>
              <Text c="dimmed" size="sm">
                {isEditMode ? `Update middleware: ${formData.name}` : `Create a new ${typeLabel.toLowerCase()} middleware`}
              </Text>
            </div>
          </Group>
          <Button
            variant="subtle"
            leftSection={<IconArrowLeft size={16} />}
            onClick={() => navigate('/middlewares')}
          >
            Back
          </Button>
        </Group>

        <form onSubmit={handleSubmit}>
          <Stack gap="lg">
            {/* Basic Info Card */}
            <Card shadow="sm" radius="md" withBorder>
              <Stack gap="md">
                <TextInput
                  label="Middleware Name"
                  placeholder="my-middleware"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.currentTarget.value })}
                  disabled={isEditMode} // Can't change name in edit mode
                  description={isEditMode ? 'Middleware name cannot be changed' : 'Unique identifier for this middleware'}
                />

                <TextInput
                  label="Provider"
                  value={formData.provider}
                  disabled
                  description="HTTP provider (managed by database)"
                />
              </Stack>
            </Card>

            {/* Configuration Card */}
            <Card shadow="sm" radius="md" withBorder>
              <MiddlewareSchemaForm
                protocol={protocol}
                middlewareType={formData.type}
                value={formData.config}
                onChange={(newConfig) => setFormData({ ...formData, config: newConfig })}
                disabled={isSubmitting}
              />
            </Card>

            {/* Actions */}
            <Group justify="flex-end">
              <Button variant="default" onClick={() => navigate('/middlewares')} disabled={isSubmitting}>
                Cancel
              </Button>
              <Button
                type="submit"
                leftSection={<IconDeviceFloppy size={16} />}
                loading={isSubmitting}
              >
                {isEditMode ? 'Update Middleware' : 'Create Middleware'}
              </Button>
            </Group>
          </Stack>
        </form>
      </Stack>
    </Container>
  )
}
