import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import {
  Card,
  Title,
  Text,
  Badge,
  SimpleGrid,
  Stack,
  Group,
  Loader,
  Button,
  ActionIcon,
  Code,
  Container,
  ThemeIcon,
  Paper,
  Tabs,
  TextInput,
  Tooltip,
} from '@mantine/core'
import {
  IconShield,
  IconTrash,
  IconEdit,
  IconPlus,
  IconSearch,
  IconRouter,
  IconNetwork,
  IconLock,
  IconCloud,
  IconEye,
} from '@tabler/icons-react'
import { resourcesApi, Resource } from '@/lib/api'
import { notifications } from '@mantine/notifications'
import { modals } from '@mantine/modals'
import { ProviderIcon } from '@/components/ProviderIcon'
import { StatusIcon } from '@/components/StatusIcon'
import { ResourceViewModal } from '@/components/ResourceViewModal'

// Get middleware type - either from 'type' field (Traefik) or detect from config keys (database)
function getMiddlewareType(middleware: Resource): string {
  // Database middlewares have type as key in config object
  if (middleware.config && Object.keys(middleware.config).length > 0) {
    const keys = Object.keys(middleware.config)
    return keys[0] || 'unknown'
  }

  // Traefik-sourced middlewares have a 'type' field (lowercase)
  // We need to find the actual property key that matches this type (case-insensitive)
  if ((middleware as any).type) {
    const typeValue = (middleware as any).type as string
    const middlewareObj = middleware as any

    // Find the property key that matches the type (case-insensitive)
    const matchingKey = Object.keys(middlewareObj).find(
      key => key.toLowerCase() === typeValue.toLowerCase() && key !== 'type'
    )

    return matchingKey || typeValue
  }

  return 'unknown'
}

// Get middleware config body
function getMiddlewareConfig(middleware: Resource): Record<string, any> {
  const middlewareType = getMiddlewareType(middleware)

  // For database middlewares, the config is nested under config property
  if (middleware.config && Object.keys(middleware.config).length > 0) {
    return middleware.config[middlewareType] || {}
  }

  // For Traefik-sourced middlewares, the config is directly on the resource
  return (middleware as any)[middlewareType] || {}
}

export default function Middlewares() {
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState<string>('http')
  const [searchQuery, setSearchQuery] = useState('')
  const [viewModalOpened, setViewModalOpened] = useState(false)
  const [viewResource, setViewResource] = useState<{ protocol: string; resource: Resource } | null>(null)

  // Fetch HTTP middlewares
  const { data: httpMiddlewares = [], isLoading: httpLoading } = useQuery({
    queryKey: ['resources', 'http', 'middlewares', true],
    queryFn: async () => {
      const response = await resourcesApi.list('http', 'middlewares', true)
      return response.data
    },
  })

  // Fetch TCP middlewares
  const { data: tcpMiddlewares = [], isLoading: tcpLoading } = useQuery({
    queryKey: ['resources', 'tcp', 'middlewares', true],
    queryFn: async () => {
      const response = await resourcesApi.list('tcp', 'middlewares', true)
      return response.data
    },
  })

  const deleteMutation = useMutation({
    mutationFn: async ({ protocol, name }: { protocol: string; name: string }) => {
      await resourcesApi.delete(protocol as any, 'middlewares', name)
    },
    onSuccess: (_, variables) => {
      notifications.show({
        title: 'Success',
        message: 'Middleware deleted successfully',
        color: 'green',
      })
      queryClient.invalidateQueries({ queryKey: ['resources', variables.protocol, 'middlewares'] })
    },
    onError: (error: any) => {
      notifications.show({
        title: 'Error',
        message: error.response?.data?.error || 'Failed to delete middleware',
        color: 'red',
      })
    },
  })

  const handleEdit = (protocol: string, middleware: Resource) => {
    if (middleware.source === 'database') {
      navigate(`/middlewares/${protocol}/${encodeURIComponent(middleware.name)}/edit`)
    }
  }

  const handleCreate = () => {
    navigate('/middlewares/new')
  }

  const handleDelete = (protocol: string, middleware: Resource) => {
    modals.openConfirmModal({
      title: 'Delete Middleware',
      children: (
        <Text size="sm">
          Are you sure you want to delete middleware <strong>{middleware.name}</strong>? This action cannot be
          undone.
        </Text>
      ),
      labels: { confirm: 'Delete', cancel: 'Cancel' },
      confirmProps: { color: 'red' },
      onConfirm: () => deleteMutation.mutate({ protocol, name: `${middleware.name}@${middleware.provider}` }),
    })
  }

  const handleView = (protocol: string, middleware: Resource) => {
    setViewResource({ protocol, resource: middleware })
    setViewModalOpened(true)
  }

  const filterMiddlewares = (middlewares: Resource[]) => {
    let filtered = middlewares
    if (searchQuery) {
      filtered = filtered.filter((middleware) =>
        middleware.name.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }
    // Sort by name ascending
    return [...filtered].sort((a, b) => a.name.localeCompare(b.name))
  }

  const renderMiddlewareCard = (protocol: string, middleware: Resource) => {
    const canEdit = middleware.source === 'database'
    const isInternal = middleware.provider === 'internal'
    const isExternal = middleware.source !== 'database' && !isInternal
    const middlewareType = getMiddlewareType(middleware)
    const middlewareConfig = getMiddlewareConfig(middleware)

    return (
      <Card key={middleware.name} withBorder style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        {/* Header */}
        <Card.Section withBorder inheritPadding py="md">
          <Group justify="space-between" align="center">
            <Group gap="xs">
              <IconShield size={20} color="gray" />
              <Text fw={600}>{middleware.name.split('@')[0]}</Text>
              {/* Provider type indicators */}
              {isInternal && (
                <Tooltip label="Internal resource managed automatically by Traefik. Cannot be modified or deleted." multiline w={250}>
                  <IconLock size={16} color="var(--mantine-color-blue-6)" style={{ cursor: 'help' }} />
                </Tooltip>
              )}
              {isExternal && (
                <Tooltip label={`Managed by the ${middleware.provider} provider. Modifications must be made through the provider's configuration.`} multiline w={250}>
                  <IconCloud size={16} color="var(--mantine-color-gray-6)" style={{ cursor: 'help' }} />
                </Tooltip>
              )}
            </Group>
            <ProviderIcon provider={middleware.provider} />
          </Group>
        </Card.Section>

        {/* Content - grows to fill space */}
        <Card.Section inheritPadding py="md" style={{ flex: 1 }}>
          <Stack gap="xs">
            {/* Type */}
            <Stack gap={4}>
              <Text size="xs" fw={500} c="dimmed">
                Type
              </Text>
              <Badge variant="light" size="sm" color="cyan">
                {middlewareType}
              </Badge>
            </Stack>

            {/* Configuration */}
            <Stack gap={4}>
              <Text size="xs" fw={500} c="dimmed">
                Configuration
              </Text>
              <Paper p="sm" radius="sm" bg="gray.0">
                <Code block style={{ maxHeight: '150px', overflow: 'auto' }}>
                  {JSON.stringify(middlewareConfig, null, 2)}
                </Code>
              </Paper>
            </Stack>
          </Stack>
        </Card.Section>

        {/* Actions - fixed at bottom */}
        <Card.Section withBorder inheritPadding py="sm">
          <Group justify="space-between">
            <StatusIcon
              enabled={middleware.enabled}
              enabledLabel="Enabled"
              disabledLabel="Disabled"
            />
            <Group gap="xs">
              <ActionIcon
                variant="subtle"
                color="blue"
                onClick={() => handleView(protocol, middleware)}
                title="View middleware"
              >
                <IconEye size={16} />
              </ActionIcon>
              <ActionIcon
                variant="subtle"
                color={canEdit ? 'blue' : 'gray'}
                onClick={() => canEdit && handleEdit(protocol, middleware)}
                disabled={!canEdit}
                title={canEdit ? 'Edit middleware' : 'Only database middlewares can be edited'}
              >
                <IconEdit size={16} />
              </ActionIcon>
              <ActionIcon
                variant="subtle"
                color={canEdit ? 'red' : 'gray'}
                onClick={() => canEdit && handleDelete(protocol, middleware)}
                disabled={!canEdit}
                title={canEdit ? 'Delete middleware' : 'Only database middlewares can be deleted'}
              >
                <IconTrash size={16} />
              </ActionIcon>
            </Group>
          </Group>
        </Card.Section>
      </Card>
    )
  }

  const totalMiddlewares = httpMiddlewares.length + tcpMiddlewares.length

  return (
    <Container size="xl">
      <Stack gap="xl">
        <Group justify="space-between">
          <div>
            <Title order={2}>Middlewares</Title>
            <Text c="dimmed" size="sm">
              Total: {totalMiddlewares} middlewares ({httpMiddlewares.length} HTTP, {tcpMiddlewares.length} TCP)
            </Text>
          </div>
          <Button leftSection={<IconPlus size={16} />} onClick={handleCreate}>
            Add Middleware
          </Button>
        </Group>

        <Card shadow="sm" radius="md" withBorder>
          <Stack gap="md">
            <TextInput
              placeholder="Search middlewares..."
              leftSection={<IconSearch size={16} />}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />

            <Tabs value={activeTab} onChange={(val) => setActiveTab(val || 'http')}>
              <Tabs.List>
                <Tabs.Tab value="http" leftSection={<IconRouter size={16} />}>
                  HTTP ({httpMiddlewares.length})
                </Tabs.Tab>
                <Tabs.Tab value="tcp" leftSection={<IconNetwork size={16} />}>
                  TCP ({tcpMiddlewares.length})
                </Tabs.Tab>
              </Tabs.List>

              <Tabs.Panel value="http" pt="md">
                {httpLoading ? (
                  <Stack align="center" justify="center" style={{ minHeight: '200px' }}>
                    <Loader size="lg" />
                    <Text>Loading HTTP middlewares...</Text>
                  </Stack>
                ) : filterMiddlewares(httpMiddlewares).length > 0 ? (
                  <SimpleGrid cols={{ base: 1, md: 2, lg: 3 }} spacing="lg">
                    {filterMiddlewares(httpMiddlewares).map((middleware) =>
                      renderMiddlewareCard('http', middleware)
                    )}
                  </SimpleGrid>
                ) : (
                  <Stack align="center" py="xl">
                    <ThemeIcon size="xl" radius="xl" color="gray" variant="light">
                      <IconShield size={28} />
                    </ThemeIcon>
                    <Text c="dimmed" fw={500}>
                      No HTTP middlewares found
                    </Text>
                  </Stack>
                )}
              </Tabs.Panel>

              <Tabs.Panel value="tcp" pt="md">
                {tcpLoading ? (
                  <Stack align="center" justify="center" style={{ minHeight: '200px' }}>
                    <Loader size="lg" />
                    <Text>Loading TCP middlewares...</Text>
                  </Stack>
                ) : filterMiddlewares(tcpMiddlewares).length > 0 ? (
                  <SimpleGrid cols={{ base: 1, md: 2, lg: 3 }} spacing="lg">
                    {filterMiddlewares(tcpMiddlewares).map((middleware) =>
                      renderMiddlewareCard('tcp', middleware)
                    )}
                  </SimpleGrid>
                ) : (
                  <Stack align="center" py="xl">
                    <ThemeIcon size="xl" radius="xl" color="gray" variant="light">
                      <IconShield size={28} />
                    </ThemeIcon>
                    <Text c="dimmed" fw={500}>
                      No TCP middlewares found
                    </Text>
                  </Stack>
                )}
              </Tabs.Panel>
            </Tabs>
          </Stack>
        </Card>
      </Stack>

      {viewResource && (
        <ResourceViewModal
          opened={viewModalOpened}
          onClose={() => setViewModalOpened(false)}
          protocol={viewResource.protocol as any}
          type="middlewares"
          resourceName={viewResource.resource.name}
          config={viewResource.resource.config}
        />
      )}
    </Container>
  )
}
