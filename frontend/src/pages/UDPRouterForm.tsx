import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  Container,
  Title,
  Button,
  Group,
  Stack,
  TextInput,
  Switch,
  Card,
  Text,
  Loader,
} from '@mantine/core'
import { notifications } from '@mantine/notifications'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { IconWifi, IconDeviceFloppy, IconArrowLeft } from '@tabler/icons-react'
import { resourcesApi } from '@/lib/api'
import { SchemaForm } from '@/components/SchemaForm'

export default function UDPRouterForm() {
  const navigate = useNavigate()
  const { name } = useParams<{ name: string }>()
  const queryClient = useQueryClient()
  const isEditMode = !!name

  const [formData, setFormData] = useState({
    name: '',
    provider: 'http',
    enabled: true,
    config: {},
  })

  // Fetch existing router in edit mode
  const { data: existingRouter, isLoading: isLoadingRouter } = useQuery({
    queryKey: ['resources', 'udp', 'routers', name],
    queryFn: async () => {
      if (!name) return null
      const response = await resourcesApi.get('udp', 'routers', name)
      return response.data
    },
    enabled: isEditMode,
  })

  // Populate form when editing
  useEffect(() => {
    if (existingRouter) {
      setFormData({
        name: existingRouter.name.split('@')[0], // Remove @provider suffix
        provider: existingRouter.provider,
        enabled: existingRouter.enabled,
        config: existingRouter.config || {},
      })
    }
  }, [existingRouter])

  // Create mutation
  const createMutation = useMutation({
    mutationFn: async () => {
      const response = await resourcesApi.create('udp', 'routers', formData)
      return response.data
    },
    onSuccess: () => {
      notifications.show({
        title: 'Success',
        message: 'UDP router created successfully',
        color: 'green',
      })
      queryClient.invalidateQueries({ queryKey: ['resources', 'udp', 'routers'] })
      navigate('/routers')
    },
    onError: (error: any) => {
      notifications.show({
        title: 'Error',
        message: error.response?.data?.error || 'Failed to create router',
        color: 'red',
      })
    },
  })

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: async () => {
      if (!name) throw new Error('No router name provided')
      const response = await resourcesApi.update('udp', 'routers', name, {
        enabled: formData.enabled,
        config: formData.config,
      })
      return response.data
    },
    onSuccess: () => {
      notifications.show({
        title: 'Success',
        message: 'UDP router updated successfully',
        color: 'green',
      })
      queryClient.invalidateQueries({ queryKey: ['resources', 'udp', 'routers'] })
      navigate('/routers')
    },
    onError: (error: any) => {
      notifications.show({
        title: 'Error',
        message: error.response?.data?.error || 'Failed to update router',
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
        message: 'Router name is required',
        color: 'red',
      })
      return
    }

    if (!formData.config || Object.keys(formData.config).length === 0) {
      notifications.show({
        title: 'Validation Error',
        message: 'Router configuration is required',
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

  if (isEditMode && isLoadingRouter) {
    return (
      <Container size="md">
        <Stack align="center" justify="center" style={{ minHeight: '400px' }}>
          <Loader size="lg" />
          <Text>Loading router...</Text>
        </Stack>
      </Container>
    )
  }

  const isSubmitting = createMutation.isPending || updateMutation.isPending

  return (
    <Container size="md">
      <Stack gap="lg">
        {/* Header */}
        <Group justify="space-between">
          <Group>
            <IconWifi size={32} stroke={1.5} color="#00aec1" />
            <div>
              <Title order={2}>{isEditMode ? 'Edit' : 'Create'} UDP Router</Title>
              <Text c="dimmed" size="sm">
                {isEditMode ? `Update router: ${formData.name}` : 'Create a new UDP router'}
              </Text>
            </div>
          </Group>
          <Button
            variant="subtle"
            leftSection={<IconArrowLeft size={16} />}
            onClick={() => navigate('/routers')}
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
                  label="Router Name"
                  placeholder="my-router"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.currentTarget.value })}
                  disabled={isEditMode} // Can't change name in edit mode
                  description={isEditMode ? 'Router name cannot be changed' : 'Unique identifier for this router'}
                />

                <TextInput
                  label="Provider"
                  value={formData.provider}
                  disabled
                  description="HTTP provider (managed by database)"
                />

                <Switch
                  label="Enabled"
                  description="Enable or disable this router"
                  checked={formData.enabled}
                  onChange={(e) => setFormData({ ...formData, enabled: e.currentTarget.checked })}
                />
              </Stack>
            </Card>

            {/* Configuration Card */}
            <Card shadow="sm" radius="md" withBorder>
              <SchemaForm
                protocol="udp"
                type="routers"
                value={formData.config}
                onChange={(newConfig) => setFormData({ ...formData, config: newConfig })}
                disabled={isSubmitting}
              />
            </Card>

            {/* Actions */}
            <Group justify="flex-end">
              <Button variant="default" onClick={() => navigate('/routers')} disabled={isSubmitting}>
                Cancel
              </Button>
              <Button
                type="submit"
                leftSection={<IconDeviceFloppy size={16} />}
                loading={isSubmitting}
              >
                {isEditMode ? 'Update Router' : 'Create Router'}
              </Button>
            </Group>
          </Stack>
        </form>
      </Stack>
    </Container>
  )
}
