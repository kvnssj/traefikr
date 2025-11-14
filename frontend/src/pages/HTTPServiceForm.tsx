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
import { IconServer, IconDeviceFloppy, IconArrowLeft } from '@tabler/icons-react'
import { resourcesApi } from '@/lib/api'
import { ServiceSchemaForm } from '@/components/ServiceSchemaForm'

export default function HTTPServiceForm() {
  const navigate = useNavigate()
  const { name, subtype } = useParams<{ name: string; subtype?: string }>()
  const queryClient = useQueryClient()
  const isEditMode = !!name

  // Service subtype: loadBalancer, weighted, mirroring, failover
  const serviceSubtype = subtype || 'loadBalancer'

  const [formData, setFormData] = useState({
    name: '',
    provider: 'http',
    enabled: true,
    subtype: serviceSubtype,
    config: {},
  })

  // Fetch existing service in edit mode
  const { data: existingService, isLoading: isLoadingService } = useQuery({
    queryKey: ['resources', 'http', 'services', name],
    queryFn: async () => {
      if (!name) return null
      const response = await resourcesApi.get('http', 'services', name)
      return response.data
    },
    enabled: isEditMode,
  })

  // Populate form when editing
  useEffect(() => {
    if (existingService) {
      // Detect service subtype from config
      let detectedSubtype = serviceSubtype
      let unwrappedConfig = {}

      if (existingService.config?.weighted) {
        detectedSubtype = 'weighted'
        unwrappedConfig = existingService.config.weighted
      } else if (existingService.config?.mirroring) {
        detectedSubtype = 'mirroring'
        unwrappedConfig = existingService.config.mirroring
      } else if (existingService.config?.failover) {
        detectedSubtype = 'failover'
        unwrappedConfig = existingService.config.failover
      } else if (existingService.config?.loadBalancer) {
        detectedSubtype = 'loadBalancer'
        unwrappedConfig = existingService.config.loadBalancer
      }

      setFormData({
        name: existingService.name.split('@')[0], // Remove @provider suffix
        provider: existingService.provider,
        enabled: existingService.enabled,
        subtype: detectedSubtype,
        config: unwrappedConfig,
      })
    }
  }, [existingService, serviceSubtype])

  // Create mutation
  const createMutation = useMutation({
    mutationFn: async () => {
      // Wrap config under the subtype key
      const payload = {
        ...formData,
        config: {
          [formData.subtype]: formData.config
        }
      }
      const response = await resourcesApi.create('http', 'services', payload)
      return response.data
    },
    onSuccess: () => {
      notifications.show({
        title: 'Success',
        message: 'HTTP service created successfully',
        color: 'green',
      })
      queryClient.invalidateQueries({ queryKey: ['resources', 'http', 'services'] })
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
      // Wrap config under the subtype key
      const response = await resourcesApi.update('http', 'services', name, {
        enabled: formData.enabled,
        config: {
          [formData.subtype]: formData.config
        },
      })
      return response.data
    },
    onSuccess: () => {
      notifications.show({
        title: 'Success',
        message: 'HTTP service updated successfully',
        color: 'green',
      })
      queryClient.invalidateQueries({ queryKey: ['resources', 'http', 'services'] })
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

  const subtypeLabels: Record<string, string> = {
    loadBalancer: 'Load Balancer',
    weighted: 'Weighted Round Robin',
    mirroring: 'Mirroring',
    failover: 'Failover'
  }

  return (
    <Container size="md">
      <Stack gap="lg">
        {/* Header */}
        <Group justify="space-between">
          <Group>
            <IconServer size={32} stroke={1.5} color="#00aec1" />
            <div>
              <Group gap="xs">
                <Title order={2}>{isEditMode ? 'Edit' : 'Create'} HTTP Service</Title>
                <Badge color="blue" variant="light" size="lg">
                  {subtypeLabels[formData.subtype]}
                </Badge>
              </Group>
              <Text c="dimmed" size="sm">
                {isEditMode ? `Update service: ${formData.name}` : `Create a new HTTP ${subtypeLabels[formData.subtype].toLowerCase()} service`}
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
                protocol="http"
                subtype={formData.subtype as 'loadBalancer' | 'weighted' | 'mirroring' | 'failover'}
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
