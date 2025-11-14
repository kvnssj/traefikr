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
  Badge,
} from '@mantine/core'
import { notifications } from '@mantine/notifications'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { IconWifi, IconDeviceFloppy, IconArrowLeft } from '@tabler/icons-react'
import { resourcesApi } from '@/lib/api'
import { ServiceSchemaForm } from '@/components/ServiceSchemaForm'

export default function UDPServiceForm() {
  const navigate = useNavigate()
  const { name } = useParams<{ name: string }>()
  const queryClient = useQueryClient()
  const isEditMode = !!name

  // UDP only supports loadBalancer
  const serviceSubtype = 'loadBalancer'

  const [formData, setFormData] = useState({
    name: '',
    provider: 'http',
    enabled: true,
    subtype: serviceSubtype,
    config: {},
  })

  // Fetch existing service in edit mode
  const { data: existingService, isLoading: isLoadingService } = useQuery({
    queryKey: ['resources', 'udp', 'services', name],
    queryFn: async () => {
      if (!name) return null
      const response = await resourcesApi.get('udp', 'services', name)
      return response.data
    },
    enabled: isEditMode,
  })

  // Populate form when editing
  useEffect(() => {
    if (existingService) {
      // UDP only supports loadBalancer, unwrap it
      let unwrappedConfig = {}
      if (existingService.config?.loadBalancer) {
        unwrappedConfig = existingService.config.loadBalancer
      }

      setFormData({
        name: existingService.name.split('@')[0], // Remove @provider suffix
        provider: existingService.provider,
        enabled: existingService.enabled,
        subtype: serviceSubtype,
        config: unwrappedConfig,
      })
    }
  }, [existingService, serviceSubtype])

  // Create mutation
  const createMutation = useMutation({
    mutationFn: async () => {
      // Wrap config under the loadBalancer key
      const payload = {
        ...formData,
        config: {
          loadBalancer: formData.config
        }
      }
      const response = await resourcesApi.create('udp', 'services', payload)
      return response.data
    },
    onSuccess: () => {
      notifications.show({
        title: 'Success',
        message: 'UDP service created successfully',
        color: 'green',
      })
      queryClient.invalidateQueries({ queryKey: ['resources', 'udp', 'services'] })
      navigate('/services')
    },
    onError: (error: any) => {
      notifications.show({
        title: 'Error',
        message: error.response?.data?.error || 'Failed to create service',
        color: 'red',
      })
    },
  })

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: async () => {
      if (!name) throw new Error('No service name provided')
      // Wrap config under the loadBalancer key
      const response = await resourcesApi.update('udp', 'services', name, {
        enabled: formData.enabled,
        config: {
          loadBalancer: formData.config
        },
      })
      return response.data
    },
    onSuccess: () => {
      notifications.show({
        title: 'Success',
        message: 'UDP service updated successfully',
        color: 'green',
      })
      queryClient.invalidateQueries({ queryKey: ['resources', 'udp', 'services'] })
      navigate('/services')
    },
    onError: (error: any) => {
      notifications.show({
        title: 'Error',
        message: error.response?.data?.error || 'Failed to update service',
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
        message: 'Service name is required',
        color: 'red',
      })
      return
    }

    if (!formData.config || Object.keys(formData.config).length === 0) {
      notifications.show({
        title: 'Validation Error',
        message: 'Service configuration is required',
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

  if (isEditMode && isLoadingService) {
    return (
      <Container size="md">
        <Stack align="center" justify="center" style={{ minHeight: '400px' }}>
          <Loader size="lg" />
          <Text>Loading service...</Text>
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
              <Group gap="xs">
                <Title order={2}>{isEditMode ? 'Edit' : 'Create'} UDP Service</Title>
                <Badge color="orange" variant="light" size="lg">
                  Load Balancer
                </Badge>
              </Group>
              <Text c="dimmed" size="sm">
                {isEditMode ? `Update service: ${formData.name}` : 'Create a new UDP load balancer service'}
              </Text>
            </div>
          </Group>
          <Button
            variant="subtle"
            leftSection={<IconArrowLeft size={16} />}
            onClick={() => navigate('/services')}
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
                  label="Service Name"
                  placeholder="my-service"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.currentTarget.value })}
                  disabled={isEditMode} // Can't change name in edit mode
                  description={isEditMode ? 'Service name cannot be changed' : 'Unique identifier for this service'}
                />

                <TextInput
                  label="Provider"
                  value={formData.provider}
                  disabled
                  description="HTTP provider (managed by database)"
                />

                <Switch
                  label="Enabled"
                  description="Enable or disable this service"
                  checked={formData.enabled}
                  onChange={(e) => setFormData({ ...formData, enabled: e.currentTarget.checked })}
                />
              </Stack>
            </Card>

            {/* Configuration Card */}
            <Card shadow="sm" radius="md" withBorder>
              <ServiceSchemaForm
                protocol="udp"
                subtype="loadBalancer"
                value={formData.config}
                onChange={(newConfig) => setFormData({ ...formData, config: newConfig })}
                disabled={isSubmitting}
              />
            </Card>

            {/* Actions */}
            <Group justify="flex-end">
              <Button variant="default" onClick={() => navigate('/services')} disabled={isSubmitting}>
                Cancel
              </Button>
              <Button
                type="submit"
                leftSection={<IconDeviceFloppy size={16} />}
                loading={isSubmitting}
              >
                {isEditMode ? 'Update Service' : 'Create Service'}
              </Button>
            </Group>
          </Stack>
        </form>
      </Stack>
    </Container>
  )
}
