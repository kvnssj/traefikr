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
} from '@mantine/core'
import {
  IconShield,
  IconTrash,
  IconEdit,
  IconPlus,
  IconSearch,
  IconRouter,
  IconNetwork,
} from '@tabler/icons-react'
import { resourcesApi, Resource } from '@/lib/api'
import { notifications } from '@mantine/notifications'
import { modals } from '@mantine/modals'
import { ProviderIcon } from '@/components/ProviderIcon'
import { StatusIcon } from '@/components/StatusIcon'

// Detect middleware type from config keys
function detectMiddlewareType(config: Record<string, any>): string {
  if (!config) return 'unknown'
  const keys = Object.keys(config)
  return keys[0] || 'unknown'
}

// Format middleware type label
function formatTypeLabel(type: string): string {
  return type
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, (str) => str.toUpperCase())
    .trim()
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
      onConfirm: () => deleteMutation.mutate({ protocol, name: middleware.name }),
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
    const middlewareType = detectMiddlewareType(middleware.config)
    const typeLabel = formatTypeLabel(middlewareType)

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
                    {typeLabel}
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
            <Group justify="space-between">
              <Text size="xs" fw={600} c="dimmed" tt="uppercase">
                Configuration
              </Text>
              <StatusIcon
                enabled={middleware.enabled}
                enabledLabel="Enabled"
                disabledLabel="Disabled"
              />
            </Group>
            <Paper p="sm" radius="sm" bg="gray.0">
              <Code block style={{ maxHeight: '150px', overflow: 'auto' }}>
                {JSON.stringify(middleware.config, null, 2)}
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
