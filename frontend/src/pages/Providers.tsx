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
  Center,
  ThemeIcon,
  Button,
  Divider,
  Paper,
  RingProgress,
  Container,
  TextInput,
  Modal,
  CopyButton,
  Tooltip,
  ActionIcon,
  Table,
  Code,
  Alert
} from '@mantine/core'
import {
  IconServer,
  IconBrandDocker,
  IconFileCode,
  IconSettings,
  IconCheck,
  IconX,
  IconAlertCircle,
  IconRefresh,
  IconKey,
  IconPlus,
  IconCopy,
  IconTrash,
  IconInfoCircle
} from '@tabler/icons-react'
import { providersApi, httpProviderApi } from '@/lib/api'
import { notifications } from '@mantine/notifications'
import { modals } from '@mantine/modals'

const providerInfo = {
  file: {
    name: 'HTTP Provider',
    description: 'Manages configuration through SQLite database and serves via HTTP endpoint',
    icon: IconFileCode,
    color: 'blue',
  },
  docker: {
    name: 'Docker Provider',
    description: 'Discovers services from Docker containers using labels',
    icon: IconBrandDocker,
    color: 'cyan',
  },
  docker_swarm: {
    name: 'Docker Swarm Provider',
    description: 'Manages services in Docker Swarm mode with orchestration',
    icon: IconServer,
    color: 'indigo',
  },
}

export default function Providers() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [createKeyModalOpened, setCreateKeyModalOpened] = useState(false)
  const [newKeyName, setNewKeyName] = useState('')
  const [generatedKey, setGeneratedKey] = useState<string | null>(null)

  const { data: providers, isLoading, refetch } = useQuery({
    queryKey: ['providers'],
    queryFn: async () => {
      const response = await providersApi.list()
      return response.data
    },
  })

  // Fetch API keys
  const { data: apiKeys, isLoading: isLoadingKeys } = useQuery({
    queryKey: ['api-keys'],
    queryFn: async () => {
      const response = await httpProviderApi.listKeys()
      return response.data
    },
  })

  // Create API key mutation
  const createKeyMutation = useMutation({
    mutationFn: async () => {
      const response = await httpProviderApi.createKey({ name: newKeyName })
      return response.data
    },
    onSuccess: (data) => {
      setGeneratedKey(data.key)
      setNewKeyName('')
      queryClient.invalidateQueries({ queryKey: ['api-keys'] })
      notifications.show({
        title: 'Success',
        message: 'API key created successfully. Make sure to copy it now!',
        color: 'green',
      })
    },
    onError: (error: any) => {
      notifications.show({
        title: 'Error',
        message: error.response?.data?.error || 'Failed to create API key',
        color: 'red',
      })
    },
  })

  // Delete API key mutation
  const deleteKeyMutation = useMutation({
    mutationFn: async (id: number) => {
      await httpProviderApi.deleteKey(id)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['api-keys'] })
      notifications.show({
        title: 'Success',
        message: 'API key deleted successfully',
        color: 'green',
      })
    },
    onError: (error: any) => {
      notifications.show({
        title: 'Error',
        message: error.response?.data?.error || 'Failed to delete API key',
        color: 'red',
      })
    },
  })

  const handleCreateKey = () => {
    if (!newKeyName.trim()) {
      notifications.show({
        title: 'Error',
        message: 'Please enter a name for the API key',
        color: 'red',
      })
      return
    }
    createKeyMutation.mutate()
  }

  const handleDeleteKey = (id: number, name: string) => {
    modals.openConfirmModal({
      title: 'Delete API Key',
      children: (
        <Text size="sm">
          Are you sure you want to delete API key <strong>{name}</strong>? This action cannot be undone.
        </Text>
      ),
      labels: { confirm: 'Delete', cancel: 'Cancel' },
      confirmProps: { color: 'red' },
      onConfirm: () => deleteKeyMutation.mutate(id),
    })
  }

  const handleCloseGeneratedKeyModal = () => {
    setGeneratedKey(null)
    setCreateKeyModalOpened(false)
  }

  if (isLoading) {
    return (
      <Center h={400}>
        <Loader size="lg" />
      </Center>
    )
  }

  const getPrimaryResourceCount = (itemCount?: Record<string, number>) => {
    if (!itemCount) return 0
    // Sum up all routers, services, and middlewares across protocols
    let total = 0
    for (const [key, value] of Object.entries(itemCount)) {
      if (key.includes('routers') || key.includes('services') || key.includes('middlewares')) {
        total += value
      }
    }
    return total
  }
  
  const getResourceBreakdown = (itemCount?: Record<string, number>) => {
    if (!itemCount) return { routers: {}, services: {}, middlewares: {} }
    
    const breakdown = {
      routers: { http: 0, tcp: 0, udp: 0 },
      services: { http: 0, tcp: 0, udp: 0 },
      middlewares: { http: 0, tcp: 0 }
    }
    
    for (const [key, value] of Object.entries(itemCount)) {
      if (key === 'http_routers') breakdown.routers.http = value
      else if (key === 'tcp_routers') breakdown.routers.tcp = value
      else if (key === 'udp_routers') breakdown.routers.udp = value
      else if (key === 'http_services') breakdown.services.http = value
      else if (key === 'tcp_services') breakdown.services.tcp = value
      else if (key === 'udp_services') breakdown.services.udp = value
      else if (key === 'http_middlewares') breakdown.middlewares.http = value
      else if (key === 'tcp_middlewares') breakdown.middlewares.tcp = value
    }
    
    return breakdown
  }

  return (
    <Container size="xl">
      <Stack gap="xl">
        <div>
          <Group justify="space-between" mb="md">
            <div>
              <Title order={2}>Settings</Title>
              <Text c="dimmed" size="sm">Manage API keys and monitor Traefik configuration providers</Text>
            </div>
            <Button
              leftSection={<IconRefresh size={16} />}
              variant="light"
              onClick={() => refetch()}
            >
              Refresh
            </Button>
          </Group>
        </div>

        {/* API Keys Section */}
        <Card shadow="sm" radius="md" withBorder>
          <Card.Section p="lg" pb="xs">
            <Group justify="space-between" align="center">
              <Group>
                <ThemeIcon size="lg" radius="md" color="violet" variant="light">
                  <IconKey size={20} stroke={1.5} />
                </ThemeIcon>
                <div>
                  <Text fw={600} size="lg">API Keys</Text>
                  <Text size="sm" c="dimmed">Manage API keys for securing the /api/config endpoint</Text>
                </div>
              </Group>
              <Button
                leftSection={<IconPlus size={16} />}
                onClick={() => setCreateKeyModalOpened(true)}
              >
                Generate Key
              </Button>
            </Group>
          </Card.Section>

          <Card.Section p="lg" pt="xs">
            <Stack gap="md">
              <Alert icon={<IconInfoCircle size={16} />} color="blue" variant="light">
                API keys are used by Traefik to poll the /api/config endpoint. Include the key in the x-auth-key header.
              </Alert>

              {isLoadingKeys ? (
                <Center p="xl">
                  <Loader size="lg" />
                </Center>
              ) : !apiKeys || apiKeys.length === 0 ? (
                <Center p="xl">
                  <Stack align="center">
                    <ThemeIcon size="xl" radius="xl" color="gray" variant="light">
                      <IconKey size={28} />
                    </ThemeIcon>
                    <Text c="dimmed">No API keys configured. Generate one to secure your config endpoint.</Text>
                  </Stack>
                </Center>
              ) : (
                <Table striped highlightOnHover>
                  <Table.Thead>
                    <Table.Tr>
                      <Table.Th>Name</Table.Th>
                      <Table.Th>Key</Table.Th>
                      <Table.Th>Created</Table.Th>
                      <Table.Th>Actions</Table.Th>
                    </Table.Tr>
                  </Table.Thead>
                  <Table.Tbody>
                    {apiKeys.map((key) => (
                      <Table.Tr key={key.id}>
                        <Table.Td>
                          <Text fw={500}>{key.name}</Text>
                        </Table.Td>
                        <Table.Td>
                          <Code>{key.key}</Code>
                        </Table.Td>
                        <Table.Td>
                          <Text size="sm" c="dimmed">
                            {new Date(key.created_at).toLocaleDateString()}
                          </Text>
                        </Table.Td>
                        <Table.Td>
                          <ActionIcon
                            variant="subtle"
                            color="red"
                            onClick={() => handleDeleteKey(key.id, key.name)}
                          >
                            <IconTrash size={16} />
                          </ActionIcon>
                        </Table.Td>
                      </Table.Tr>
                    ))}
                  </Table.Tbody>
                </Table>
              )}
            </Stack>
          </Card.Section>
        </Card>

        <SimpleGrid cols={{ base: 1, md: 2, xl: 3 }} spacing="lg">
          {providers?.map((provider) => {
            const info = providerInfo[provider.type as keyof typeof providerInfo]
            const Icon = info?.icon || IconServer
            const primaryResourceCount = getPrimaryResourceCount(provider.itemCount)
            const breakdown = getResourceBreakdown(provider.itemCount)
            
            return (
              <Card key={provider.type} shadow="sm" radius="md" withBorder>
                <Card.Section p="lg" pb="xs">
                  <Group justify="space-between" align="flex-start">
                    <Group>
                      <ThemeIcon size="xl" radius="md" color={info?.color || 'gray'} variant="light">
                        <Icon size={28} stroke={1.5} />
                      </ThemeIcon>
                      <div>
                        <Text fw={600} size="lg">{info?.name || provider.type}</Text>
                        <Badge 
                          size="sm"
                          variant="dot"
                          color={
                            provider.status === 'healthy' ? 'green' : 
                            provider.status === 'error' ? 'red' : 'yellow'
                          }
                        >
                          {provider.status}
                        </Badge>
                      </div>
                    </Group>
                    
                    {provider.enabled && primaryResourceCount > 0 && (
                      <RingProgress
                        size={60}
                        thickness={6}
                        roundCaps
                        sections={[
                          { value: 100, color: info?.color || 'blue' }
                        ]}
                        label={
                          <Text size="xs" ta="center" fw={700}>
                            {primaryResourceCount}
                          </Text>
                        }
                      />
                    )}
                  </Group>
                </Card.Section>

                <Card.Section p="lg" pt="xs">
                  <Stack gap="md">
                    <Text size="sm" c="dimmed">
                      {info?.description || 'Provider for Traefik configuration'}
                    </Text>

                    {provider.message && (
                      <>
                        <Divider />
                        <Group gap="xs">
                          {provider.status === 'error' ? (
                            <IconAlertCircle size={16} color="var(--mantine-color-red-6)" />
                          ) : (
                            <IconAlertCircle size={16} color="var(--mantine-color-yellow-6)" />
                          )}
                          <Text size="sm" c={provider.status === 'error' ? 'red' : 'yellow'}>
                            {provider.message}
                          </Text>
                        </Group>
                      </>
                    )}

                    {provider.enabled && provider.itemCount && Object.keys(provider.itemCount).length > 0 && (
                      <>
                        <Divider />
                        <Stack gap="xs">
                          <Text size="xs" fw={600} tt="uppercase" c="dimmed">Resources</Text>
                          
                          {/* Routers breakdown */}
                          <Paper p="xs" radius="sm" bg="gray.0">
                            <Stack gap={4}>
                              <Text size="xs" fw={500}>Routers</Text>
                              <Group gap="xs">
                                {breakdown.routers.http > 0 && (
                                  <Badge variant="filled" size="sm" color="blue">
                                    HTTP: {breakdown.routers.http}
                                  </Badge>
                                )}
                                {breakdown.routers.tcp > 0 && (
                                  <Badge variant="filled" size="sm" color="green">
                                    TCP: {breakdown.routers.tcp}
                                  </Badge>
                                )}
                                {breakdown.routers.udp > 0 && (
                                  <Badge variant="filled" size="sm" color="orange">
                                    UDP: {breakdown.routers.udp}
                                  </Badge>
                                )}
                                {(breakdown.routers.http + breakdown.routers.tcp + breakdown.routers.udp) === 0 && (
                                  <Text size="xs" c="dimmed">None</Text>
                                )}
                              </Group>
                            </Stack>
                          </Paper>
                          
                          {/* Services breakdown */}
                          <Paper p="xs" radius="sm" bg="gray.0">
                            <Stack gap={4}>
                              <Text size="xs" fw={500}>Services</Text>
                              <Group gap="xs">
                                {breakdown.services.http > 0 && (
                                  <Badge variant="filled" size="sm" color="blue">
                                    HTTP: {breakdown.services.http}
                                  </Badge>
                                )}
                                {breakdown.services.tcp > 0 && (
                                  <Badge variant="filled" size="sm" color="green">
                                    TCP: {breakdown.services.tcp}
                                  </Badge>
                                )}
                                {breakdown.services.udp > 0 && (
                                  <Badge variant="filled" size="sm" color="orange">
                                    UDP: {breakdown.services.udp}
                                  </Badge>
                                )}
                                {(breakdown.services.http + breakdown.services.tcp + breakdown.services.udp) === 0 && (
                                  <Text size="xs" c="dimmed">None</Text>
                                )}
                              </Group>
                            </Stack>
                          </Paper>
                          
                          {/* Middlewares breakdown */}
                          <Paper p="xs" radius="sm" bg="gray.0">
                            <Stack gap={4}>
                              <Text size="xs" fw={500}>Middlewares</Text>
                              <Group gap="xs">
                                {breakdown.middlewares.http > 0 && (
                                  <Badge variant="filled" size="sm" color="blue">
                                    HTTP: {breakdown.middlewares.http}
                                  </Badge>
                                )}
                                {breakdown.middlewares.tcp > 0 && (
                                  <Badge variant="filled" size="sm" color="green">
                                    TCP: {breakdown.middlewares.tcp}
                                  </Badge>
                                )}
                                {(breakdown.middlewares.http + breakdown.middlewares.tcp) === 0 && (
                                  <Text size="xs" c="dimmed">None</Text>
                                )}
                              </Group>
                            </Stack>
                          </Paper>
                          
                          {/* Additional provider-specific stats */}
                          {Object.entries(provider.itemCount).filter(([key]) => 
                            !key.includes('routers') && !key.includes('services') && !key.includes('middlewares')
                          ).length > 0 && (
                            <>
                              <Text size="xs" c="dimmed">Additional Info</Text>
                              <SimpleGrid cols={2} spacing="xs">
                                {Object.entries(provider.itemCount)
                                  .filter(([key]) => !key.includes('routers') && !key.includes('services') && !key.includes('middlewares'))
                                  .map(([key, value]) => (
                                    <Paper key={key} p="xs" radius="sm" bg="gray.0">
                                      <Group justify="space-between">
                                        <Text size="xs" c="dimmed" tt="capitalize">
                                          {key.replace(/_/g, ' ')}
                                        </Text>
                                        <Badge variant="light" size="sm" color={info?.color || 'blue'}>
                                          {value}
                                        </Badge>
                                      </Group>
                                    </Paper>
                                  ))}
                              </SimpleGrid>
                            </>
                          )}
                        </Stack>
                      </>
                    )}

                    <Divider />
                    
                    <Group justify="space-between" align="center">
                      <Group gap="xs">
                        {provider.enabled ? (
                          <Badge leftSection={<IconCheck size={12} />} color="green" variant="light">
                            Enabled
                          </Badge>
                        ) : (
                          <Badge leftSection={<IconX size={12} />} color="gray" variant="light">
                            Disabled
                          </Badge>
                        )}
                      </Group>
                      
                      <Button
                        size="xs"
                        variant="light"
                        leftSection={<IconSettings size={14} />}
                        disabled={!provider.enabled || provider.type !== 'file'}
                        onClick={() => {
                          if (provider.type === 'file') {
                            navigate('/providers/http/configure')
                          }
                        }}
                      >
                        Configure
                      </Button>
                    </Group>
                  </Stack>
                </Card.Section>
              </Card>
            )
          })}
        </SimpleGrid>

        {(!providers || providers.length === 0) && (
          <Center h={200}>
            <Stack align="center">
              <ThemeIcon size="xl" radius="xl" color="gray" variant="light">
                <IconAlertCircle size={28} />
              </ThemeIcon>
              <Text c="dimmed">No providers configured</Text>
            </Stack>
          </Center>
        )}
      </Stack>

      {/* Create API Key Modal */}
      <Modal
        opened={createKeyModalOpened && !generatedKey}
        onClose={() => setCreateKeyModalOpened(false)}
        title="Generate API Key"
      >
        <Stack gap="md">
          <TextInput
            label="Key Name"
            placeholder="e.g., Traefik Production"
            value={newKeyName}
            onChange={(e) => setNewKeyName(e.target.value)}
            required
          />
          <Group justify="flex-end">
            <Button variant="subtle" onClick={() => setCreateKeyModalOpened(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleCreateKey}
              loading={createKeyMutation.isPending}
            >
              Generate
            </Button>
          </Group>
        </Stack>
      </Modal>

      {/* Generated Key Modal */}
      <Modal
        opened={!!generatedKey}
        onClose={handleCloseGeneratedKeyModal}
        title="API Key Generated"
        closeOnClickOutside={false}
        closeOnEscape={false}
      >
        <Stack gap="md">
          <Alert icon={<IconAlertCircle size={16} />} color="yellow">
            This is the only time you will see this key. Make sure to copy it now!
          </Alert>
          <Stack gap="xs">
            <Text size="sm" fw={500}>Your API Key:</Text>
            <Group>
              <Code style={{ flex: 1 }}>{generatedKey}</Code>
              <CopyButton value={generatedKey || ''}>
                {({ copied, copy }) => (
                  <Tooltip label={copied ? 'Copied' : 'Copy'}>
                    <ActionIcon
                      color={copied ? 'green' : 'blue'}
                      variant="subtle"
                      onClick={copy}
                    >
                      {copied ? <IconCheck size={16} /> : <IconCopy size={16} />}
                    </ActionIcon>
                  </Tooltip>
                )}
              </CopyButton>
            </Group>
          </Stack>
          <Text size="sm" c="dimmed">
            Configure this key in your Traefik static configuration under the HTTP provider's headers section.
          </Text>
          <Button fullWidth onClick={handleCloseGeneratedKeyModal}>
            Done
          </Button>
        </Stack>
      </Modal>
    </Container>
  )
}