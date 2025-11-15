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
  Alert,
} from '@mantine/core'
import {
  IconShield,
  IconTrash,
  IconEdit,
  IconPlus,
  IconSearch,
  IconRouter,
  IconNetwork,
  IconInfoCircle,
} from '@tabler/icons-react'
import { resourcesApi, Resource } from '@/lib/api'
import { notifications } from '@mantine/notifications'
import { modals } from '@mantine/modals'
import { ProviderIcon } from '@/components/ProviderIcon'
import { StatusIcon } from '@/components/StatusIcon'

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

  const filterMiddlewares = (middlewares: Resource[]) => {
    if (!searchQuery) return middlewares
    return middlewares.filter((middleware) =>
      middleware.name.toLowerCase().includes(searchQuery.toLowerCase())
    )
  }

  const renderMiddlewareCard = (protocol: string, middleware: Resource) => {
    const canEdit = middleware.source === 'database'
    const middlewareType = getMiddlewareType(middleware)
    const middlewareConfig = getMiddlewareConfig(middleware)

    return (
      <Card key={middleware.name} shadow="sm" radius="md" withBorder>
        <Card.Section p="lg" pb="xs">
          <Group justify="space-between" align="flex-start">
            <Group>
              <ThemeIcon size="lg" radius="md" color="cyan" variant="light">
                <IconShield size={20} stroke={1.5} />
              </ThemeIcon>
              <div>
                <Text fw={600}>{middleware.name.split('@')[0]}</Text>
                <Group gap="xs" mt={4}>
                  <Badge size="sm" variant="light" color="cyan">
                    {middlewareType}
                  </Badge>
                  <ProviderIcon provider={middleware.provider} />
                </Group>
              </div>
            </Group>

            <Group gap={4}>
              <ActionIcon
                variant="subtle"
                size="sm"
                color={canEdit ? 'blue' : 'gray'}
                onClick={() => canEdit && handleEdit(protocol, middleware)}
                disabled={!canEdit}
                title={canEdit ? 'Edit middleware' : 'Only database middlewares can be edited'}
              >
                <IconEdit size={16} />
              </ActionIcon>
              <ActionIcon
                variant="subtle"
                size="sm"
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

        <Card.Section p="lg" pt="xs">
          <Stack gap="sm">
            {/* Internal middleware note */}
            {middleware.provider === 'internal' && (
              <Alert icon={<IconInfoCircle size={16} />} color="blue" variant="light">
                <Text size="xs">Internal resource managed automatically by Traefik. Cannot be modified or deleted.</Text>
              </Alert>
            )}

            {/* External provider note */}
            {middleware.source !== 'database' && middleware.provider !== 'internal' && (
              <Alert icon={<IconInfoCircle size={16} />} color="gray" variant="light">
                <Text size="xs">
                  Managed by the <strong>{middleware.provider}</strong> provider. Modifications must be made through the provider's configuration.
                </Text>
              </Alert>
            )}

            <Group justify="space-between">
              <Text size="xs" fw={600} c="dimmed" tt="uppercase">
                Configuration
              </Text>
              <StatusIcon
                enabled={middleware.status === 'enabled' || middleware.enabled}
                enabledLabel="Enabled"
                disabledLabel="Disabled"
              />
            </Group>
            <Paper p="sm" radius="sm" bg="gray.0">
              <Code block style={{ maxHeight: '150px', overflow: 'auto' }}>
                {JSON.stringify(middlewareConfig, null, 2)}
              </Code>
            </Paper>
          </Stack>
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
    </Container>
  )
}
