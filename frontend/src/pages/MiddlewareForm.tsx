import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  Container,
  TextInput,
  Select,
  Button,
  Group,
  Stack,
  Title,
  Breadcrumbs,
  Anchor,
  Card,
  Text,
  Alert
} from '@mantine/core'
import { notifications } from '@mantine/notifications'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { middlewaresApi, Middleware } from '@/lib/api'
import { IconShield, IconArrowLeft, IconDeviceFloppy, IconInfoCircle } from '@tabler/icons-react'
import { Link } from 'react-router-dom'

// Import all middleware forms
import { BasicAuthForm } from '@/components/middleware-forms/BasicAuthForm'
import { HeadersForm } from '@/components/middleware-forms/HeadersForm'
import { RateLimitForm } from '@/components/middleware-forms/RateLimitForm'
import { RedirectForm } from '@/components/middleware-forms/RedirectForm'
import { PathForm } from '@/components/middleware-forms/PathForm'
import { CompressForm } from '@/components/middleware-forms/CompressForm'
import { IPAllowListForm } from '@/components/middleware-forms/IPAllowListForm'
import { RetryForm } from '@/components/middleware-forms/RetryForm'
import { CircuitBreakerForm } from '@/components/middleware-forms/CircuitBreakerForm'
import { BufferingForm } from '@/components/middleware-forms/BufferingForm'
import { ForwardAuthForm } from '@/components/middleware-forms/ForwardAuthForm'
import { InFlightReqForm } from '@/components/middleware-forms/InFlightReqForm'
import { ChainForm } from '@/components/middleware-forms/ChainForm'

const middlewareTypes = [
  { value: 'addPrefix', label: 'Add Prefix', description: 'Add a prefix to the path' },
  { value: 'basicAuth', label: 'Basic Auth', description: 'Add Basic Authentication' },
  { value: 'buffering', label: 'Buffering', description: 'Buffer requests and responses' },
  { value: 'chain', label: 'Chain', description: 'Combine multiple middlewares' },
  { value: 'circuitBreaker', label: 'Circuit Breaker', description: 'Stop calling unhealthy services' },
  { value: 'compress', label: 'Compress', description: 'Compress responses' },
  { value: 'forwardAuth', label: 'Forward Auth', description: 'Delegate authentication' },
  { value: 'headers', label: 'Headers', description: 'Add/remove/modify headers' },
  { value: 'ipAllowList', label: 'IP Allow List', description: 'Restrict access by IP' },
  { value: 'inFlightReq', label: 'In-Flight Requests', description: 'Limit concurrent requests' },
  { value: 'rateLimit', label: 'Rate Limit', description: 'Limit request rate' },
  { value: 'redirectScheme', label: 'Redirect Scheme', description: 'Redirect to different scheme' },
  { value: 'redirectRegex', label: 'Redirect Regex', description: 'Redirect using regex' },
  { value: 'replacePath', label: 'Replace Path', description: 'Replace the entire path' },
  { value: 'replacePathRegex', label: 'Replace Path Regex', description: 'Replace path using regex' },
  { value: 'retry', label: 'Retry', description: 'Retry requests on failure' },
  { value: 'stripPrefix', label: 'Strip Prefix', description: 'Remove prefix from path' },
  { value: 'stripPrefixRegex', label: 'Strip Prefix Regex', description: 'Remove prefix using regex' },
]

export default function MiddlewareForm() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { name } = useParams<{ name?: string }>()
  const isEditing = !!name

  const [formData, setFormData] = useState({
    name: '',
    type: 'headers',
    config: {}
  })
  const [loading, setLoading] = useState(false)

  const { data: middleware } = useQuery({
    queryKey: ['middleware', name],
    queryFn: async () => {
      if (!name) return null
      const response = await middlewaresApi.get('file', name)
      return response.data
    },
    enabled: isEditing
  })

  useEffect(() => {
    if (middleware) {
      setFormData({
        name: middleware.name,
        type: middleware.type,
        config: middleware.config || {}
      })
    }
  }, [middleware])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const data = {
        name: formData.name,
        type: formData.type,
        config: formData.config,
        provider: 'file' as const,
      }

      if (isEditing) {
        await middlewaresApi.update('file', middleware!.name, data)
        notifications.show({
          title: 'Success',
          message: 'Middleware updated successfully',
          color: 'green'
        })
      } else {
        await middlewaresApi.create('file', data)
        notifications.show({
          title: 'Success',
          message: 'Middleware created successfully',
          color: 'green'
        })
      }
      
      // Invalidate the middlewares query to refresh the list
      queryClient.invalidateQueries({ queryKey: ['middlewares'] })
      
      navigate('/middlewares')
    } catch (error: any) {
      notifications.show({
        title: 'Error',
        message: error.response?.data?.detail || 'An error occurred',
        color: 'red'
      })
    } finally {
      setLoading(false)
    }
  }

  const renderForm = () => {
    switch (formData.type) {
      case 'basicAuth':
        return <BasicAuthForm config={formData.config} onChange={(config) => setFormData({ ...formData, config })} />
      case 'headers':
        return <HeadersForm config={formData.config} onChange={(config) => setFormData({ ...formData, config })} />
      case 'rateLimit':
        return <RateLimitForm config={formData.config} onChange={(config) => setFormData({ ...formData, config })} />
      case 'redirectScheme':
        return <RedirectForm type="redirectScheme" config={formData.config} onChange={(config) => setFormData({ ...formData, config })} />
      case 'redirectRegex':
        return <RedirectForm type="redirectRegex" config={formData.config} onChange={(config) => setFormData({ ...formData, config })} />
      case 'addPrefix':
        return <PathForm type="addPrefix" config={formData.config} onChange={(config) => setFormData({ ...formData, config })} />
      case 'stripPrefix':
        return <PathForm type="stripPrefix" config={formData.config} onChange={(config) => setFormData({ ...formData, config })} />
      case 'stripPrefixRegex':
        return <PathForm type="stripPrefixRegex" config={formData.config} onChange={(config) => setFormData({ ...formData, config })} />
      case 'replacePath':
        return <PathForm type="replacePath" config={formData.config} onChange={(config) => setFormData({ ...formData, config })} />
      case 'replacePathRegex':
        return <PathForm type="replacePathRegex" config={formData.config} onChange={(config) => setFormData({ ...formData, config })} />
      case 'compress':
        return <CompressForm config={formData.config} onChange={(config) => setFormData({ ...formData, config })} />
      case 'ipAllowList':
        return <IPAllowListForm config={formData.config} onChange={(config) => setFormData({ ...formData, config })} />
      case 'retry':
        return <RetryForm config={formData.config} onChange={(config) => setFormData({ ...formData, config })} />
      case 'circuitBreaker':
        return <CircuitBreakerForm config={formData.config} onChange={(config) => setFormData({ ...formData, config })} />
      case 'buffering':
        return <BufferingForm config={formData.config} onChange={(config) => setFormData({ ...formData, config })} />
      case 'forwardAuth':
        return <ForwardAuthForm config={formData.config} onChange={(config) => setFormData({ ...formData, config })} />
      case 'inFlightReq':
        return <InFlightReqForm config={formData.config} onChange={(config) => setFormData({ ...formData, config })} />
      case 'chain':
        return <ChainForm config={formData.config} onChange={(config) => setFormData({ ...formData, config })} />
      default:
        return (
          <Alert icon={<IconInfoCircle />} color="yellow">
            Configuration form not implemented for middleware type: {formData.type}
          </Alert>
        )
    }
  }

  const selectedType = middlewareTypes.find(t => t.value === formData.type)

  const breadcrumbs = [
    { title: 'Dashboard', href: '/' },
    { title: 'Middlewares', href: '/middlewares' },
    { title: isEditing ? `Edit ${name}` : 'New Middleware', href: '#' },
  ].map((item, index) => (
    <Anchor component={Link} to={item.href} key={index}>
      {item.title}
    </Anchor>
  ))

  return (
    <Container size="xl">
      <Stack gap="lg">
        <div>
          <Breadcrumbs mb="md">{breadcrumbs}</Breadcrumbs>
          <Group justify="space-between" align="center">
            <Group>
              <IconShield size={32} stroke={1.5} />
              <Title order={2}>{isEditing ? 'Edit Middleware' : 'Create New Middleware'}</Title>
            </Group>
            <Button
              variant="subtle"
              leftSection={<IconArrowLeft size={16} />}
              onClick={() => navigate('/middlewares')}
            >
              Back to Middlewares
            </Button>
          </Group>
          {isEditing && (
            <Text c="dimmed" size="sm" mt="xs">
              Editing middleware configuration for: {name}
            </Text>
          )}
        </div>

        <form onSubmit={handleSubmit}>
          <Stack gap="md">
            <Card shadow="sm" radius="md" withBorder>
              <Card.Section withBorder p="md">
                <Text fw={500}>Basic Configuration</Text>
              </Card.Section>
              <Card.Section p="md">
                <Stack>
                  <TextInput
                    label="Name"
                    required
                    disabled={isEditing}
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="my-middleware"
                    description="Unique identifier for this middleware"
                  />

                  <Select
                    label="Type"
                    required
                    disabled={isEditing}
                    value={formData.type}
                    onChange={(value) => setFormData({ ...formData, type: value || 'headers', config: {} })}
                    data={middlewareTypes}
                    description="Choose the type of middleware to create"
                    searchable
                  />

                  {selectedType && (
                    <Alert icon={<IconInfoCircle />} color="blue" variant="light">
                      <Text size="sm" fw={500}>{selectedType.label}</Text>
                      <Text size="xs" c="dimmed">{selectedType.description}</Text>
                    </Alert>
                  )}
                </Stack>
              </Card.Section>
            </Card>

            <Card shadow="sm" radius="md" withBorder>
              <Card.Section withBorder p="md">
                <Text fw={500}>Configuration</Text>
              </Card.Section>
              <Card.Section p="md">
                {renderForm()}
              </Card.Section>
            </Card>

            <Group justify="space-between" mt="xl">
              <Button
                variant="subtle"
                onClick={() => navigate('/middlewares')}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                loading={loading}
                leftSection={<IconDeviceFloppy size={16} />}
              >
                {isEditing ? 'Update Middleware' : 'Create Middleware'}
              </Button>
            </Group>
          </Stack>
        </form>
      </Stack>
    </Container>
  )
}