import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import {
  Card,
  Badge,
  Button,
  ActionIcon,
  Title,
  Text,
  Group,
  Stack,
  Loader,
  SimpleGrid,
  Container,
  Tabs,
  TextInput,
  Tooltip,
} from '@mantine/core'
import { modals } from '@mantine/modals'
import { notifications } from '@mantine/notifications'
import { resourcesApi, Resource } from '@/lib/api'
import { ProviderIcon } from '@/components/ProviderIcon'
import { StatusIcon } from '@/components/StatusIcon'
import { ResourceViewModal } from '@/components/ResourceViewModal'
import { Network as Server, Trash2, Edit, Plus, Search } from 'lucide-react'
import { IconRouter, IconNetwork, IconWifi, IconEye, IconLock, IconCloud } from '@tabler/icons-react'

export default function Services() {
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState<string>('http')
  const [searchQuery, setSearchQuery] = useState('')
  const [viewModalOpened, setViewModalOpened] = useState(false)
  const [viewResource, setViewResource] = useState<{ protocol: string; resource: Resource } | null>(null)

  // Fetch HTTP services
  const { data: httpServices = [], isLoading: httpLoading } = useQuery({
    queryKey: ['resources', 'http', 'services', true],
    queryFn: async () => {
      const response = await resourcesApi.list('http', 'services', true)
      return response.data
    },
  })

  // Fetch TCP services
  const { data: tcpServices = [], isLoading: tcpLoading } = useQuery({
    queryKey: ['resources', 'tcp', 'services', true],
    queryFn: async () => {
      const response = await resourcesApi.list('tcp', 'services', true)
      return response.data
    },
  })

  // Fetch UDP services
  const { data: udpServices = [], isLoading: udpLoading } = useQuery({
    queryKey: ['resources', 'udp', 'services', true],
    queryFn: async () => {
      const response = await resourcesApi.list('udp', 'services', true)
      return response.data
    },
  })

  const deleteMutation = useMutation({
    mutationFn: async ({ protocol, name }: { protocol: string; name: string }) => {
      await resourcesApi.delete(protocol as any, 'services', name)
    },
    onSuccess: (_, variables) => {
      notifications.show({
        title: 'Success',
        message: 'Service deleted successfully',
        color: 'green',
      })
      queryClient.invalidateQueries({ queryKey: ['resources', variables.protocol, 'services'] })
    },
    onError: (error: any) => {
      notifications.show({
        title: 'Error',
        message: error.response?.data?.error || 'Failed to delete service',
        color: 'red',
      })
    },
  })

  const handleEdit = (protocol: string, service: Resource) => {
    if (service.source === 'database') {
      navigate(`/services/${protocol}/${encodeURIComponent(service.name)}/edit`)
    }
  }

  const handleCreate = () => {
    navigate('/services/new')
  }

  const handleDelete = (protocol: string, service: Resource) => {
    modals.openConfirmModal({
      title: 'Delete Service',
      children: (
        <Text size="sm">
          Are you sure you want to delete service <strong>{service.name}</strong>? This action cannot be undone.
        </Text>
      ),
      labels: { confirm: 'Delete', cancel: 'Cancel' },
      confirmProps: { color: 'red' },
      onConfirm: () => deleteMutation.mutate({ protocol, name: service.name }),
    })
  }

  const handleView = (protocol: string, service: Resource) => {
    setViewResource({ protocol, resource: service })
    setViewModalOpened(true)
  }

  const filterServices = (services: Resource[]) => {
    let filtered = services
    if (searchQuery) {
      filtered = filtered.filter(
        (service) =>
          service.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          service.provider.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }
    // Sort by name ascending
    return [...filtered].sort((a, b) => a.name.localeCompare(b.name))
  }

  const renderServiceCard = (protocol: string, service: Resource) => {
    const canEdit = service.source === 'database'
    const isInternal = service.provider === 'internal'
    const isExternal = service.source !== 'database' && !isInternal

    // Get service type and data from either Traefik-sourced (direct properties) or database (config property)
    const serviceObj = service as any
    const loadBalancer = serviceObj.loadBalancer || service.config?.loadBalancer
    const weighted = serviceObj.weighted || service.config?.weighted
    const mirroring = serviceObj.mirroring || service.config?.mirroring
    const failover = serviceObj.failover || service.config?.failover

    // Determine service type
    let serviceType = 'loadBalancer'
    let displayData: any = null

    if (loadBalancer) {
      serviceType = 'loadBalancer'
      displayData = loadBalancer.servers || []
    } else if (weighted) {
      serviceType = 'weighted'
      displayData = weighted.services || []
    } else if (mirroring) {
      serviceType = 'mirroring'
      displayData = mirroring
    } else if (failover) {
      serviceType = 'failover'
      displayData = failover
    }

    return (
      <Card key={service.name} withBorder style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        <Card.Section withBorder inheritPadding py="md">
          <Group justify="space-between" align="center">
            <Group gap="xs">
              <Server size={20} color="gray" />
              <Title order={4}>{service.name.split('@')[0]}</Title>
              {/* Provider type indicators */}
              {isInternal && (
                <Tooltip label="Internal resource managed automatically by Traefik. Cannot be modified or deleted." multiline w={250}>
                  <IconLock size={16} color="var(--mantine-color-blue-6)" style={{ cursor: 'help' }} />
                </Tooltip>
              )}
              {isExternal && (
                <Tooltip label={`Managed by the ${service.provider} provider. Modifications must be made through the provider's configuration.`} multiline w={250}>
                  <IconCloud size={16} color="var(--mantine-color-gray-6)" style={{ cursor: 'help' }} />
                </Tooltip>
              )}
            </Group>
            <ProviderIcon provider={service.provider} />
          </Group>
        </Card.Section>

        {/* Content area - grows to fill space */}
        <Card.Section inheritPadding py="md" style={{ flex: 1 }}>
          {serviceType === 'loadBalancer' && displayData && displayData.length > 0 && (
            <Stack gap="xs">
              <Stack gap={4}>
                <Text size="xs" fw={500} c="dimmed">
                  Type
                </Text>
                <Badge variant="light" size="sm" color="blue">
                  Load Balancer
                </Badge>
              </Stack>
              <Stack gap={4}>
                <Text size="xs" fw={500} c="dimmed">
                  Servers
                </Text>
                <Stack gap="xs">
                  {displayData.slice(0, 3).map((server: any, idx: number) => (
                    <Text
                      key={idx}
                      component="code"
                      size="xs"
                      c="dimmed"
                      style={{
                        backgroundColor: 'var(--mantine-color-gray-1)',
                        padding: '6px 8px',
                        borderRadius: '4px',
                        display: 'block',
                      }}
                    >
                      {server.url || server.address || server.name}
                    </Text>
                  ))}
                  {displayData.length > 3 && (
                    <Text size="xs" c="dimmed">
                      ... and {displayData.length - 3} more
                    </Text>
                  )}
                </Stack>
              </Stack>
            </Stack>
          )}

          {serviceType === 'weighted' && displayData && displayData.length > 0 && (
            <Stack gap="xs">
              <Stack gap={4}>
                <Text size="xs" fw={500} c="dimmed">
                  Type
                </Text>
                <Badge variant="light" size="sm" color="grape">
                  Weighted Round Robin
                </Badge>
              </Stack>
              <Stack gap={4}>
                <Text size="xs" fw={500} c="dimmed">
                  Services
                </Text>
                <Stack gap="xs">
                  {displayData.slice(0, 3).map((item: any, idx: number) => (
                    <Group
                      key={idx}
                      gap="xs"
                      wrap="nowrap"
                      style={{
                        backgroundColor: 'var(--mantine-color-gray-1)',
                        padding: '6px 8px',
                        borderRadius: '4px',
                      }}
                    >
                      <Text
                        component="code"
                        size="xs"
                        c="dimmed"
                        style={{ flex: 1 }}
                      >
                        {item.name}
                      </Text>
                      {item.weight && (
                        <Badge size="xs" variant="filled">
                          {item.weight}
                        </Badge>
                      )}
                    </Group>
                  ))}
                  {displayData.length > 3 && (
                    <Text size="xs" c="dimmed">
                      ... and {displayData.length - 3} more
                    </Text>
                  )}
                </Stack>
              </Stack>
            </Stack>
          )}

          {serviceType === 'mirroring' && displayData && (
            <Stack gap="xs">
              <Stack gap={4}>
                <Text size="xs" fw={500} c="dimmed">
                  Type
                </Text>
                <Badge variant="light" size="sm" color="cyan">
                  Mirroring
                </Badge>
              </Stack>
              <Stack gap="xs">
                {displayData.service && (
                  <Stack gap={4}>
                    <Text size="xs" fw={500} c="dimmed">
                      Main Service
                    </Text>
                    <Text
                      component="code"
                      size="xs"
                      c="dimmed"
                      style={{
                        backgroundColor: 'var(--mantine-color-gray-1)',
                        padding: '6px 8px',
                        borderRadius: '4px',
                        display: 'block',
                      }}
                    >
                      {displayData.service}
                    </Text>
                  </Stack>
                )}
                {displayData.mirrors && displayData.mirrors.length > 0 && (
                  <Stack gap={4}>
                    <Text size="xs" fw={500} c="dimmed">
                      Mirror Services
                    </Text>
                    <Stack gap="xs">
                      {displayData.mirrors.slice(0, 2).map((mirror: any, idx: number) => (
                        <Group
                          key={idx}
                          gap="xs"
                          wrap="nowrap"
                          style={{
                            backgroundColor: 'var(--mantine-color-gray-1)',
                            padding: '6px 8px',
                            borderRadius: '4px',
                          }}
                        >
                          <Text
                            component="code"
                            size="xs"
                            c="dimmed"
                            style={{ flex: 1 }}
                          >
                            {mirror.name}
                          </Text>
                          {mirror.percent && (
                            <Badge size="xs" variant="filled">
                              {mirror.percent}%
                            </Badge>
                          )}
                        </Group>
                      ))}
                      {displayData.mirrors.length > 2 && (
                        <Text size="xs" c="dimmed">
                          ... and {displayData.mirrors.length - 2} more
                        </Text>
                      )}
                    </Stack>
                  </Stack>
                )}
              </Stack>
            </Stack>
          )}

          {serviceType === 'failover' && displayData && (
            <Stack gap="xs">
              <Stack gap={4}>
                <Text size="xs" fw={500} c="dimmed">
                  Type
                </Text>
                <Badge variant="light" size="sm" color="orange">
                  Failover
                </Badge>
              </Stack>
              <Stack gap="xs">
                {displayData.service && (
                  <Stack gap={4}>
                    <Text size="xs" fw={500} c="dimmed">
                      Primary Service
                    </Text>
                    <Text
                      component="code"
                      size="xs"
                      c="dimmed"
                      style={{
                        backgroundColor: 'var(--mantine-color-gray-1)',
                        padding: '6px 8px',
                        borderRadius: '4px',
                        display: 'block',
                      }}
                    >
                      {displayData.service}
                    </Text>
                  </Stack>
                )}
                {displayData.fallback && (
                  <Stack gap={4}>
                    <Text size="xs" fw={500} c="dimmed">
                      Fallback Service
                    </Text>
                    <Text
                      component="code"
                      size="xs"
                      c="dimmed"
                      style={{
                        backgroundColor: 'var(--mantine-color-gray-1)',
                        padding: '6px 8px',
                        borderRadius: '4px',
                        display: 'block',
                      }}
                    >
                      {displayData.fallback}
                    </Text>
                  </Stack>
                )}
              </Stack>
            </Stack>
          )}
        </Card.Section>

        {/* Actions - fixed at bottom */}
        <Card.Section withBorder inheritPadding py="sm">
          <Group justify="space-between">
            <StatusIcon
              enabled={service.enabled}
              enabledLabel="Enabled"
              disabledLabel="Disabled"
            />
            <Group gap="xs">
              <ActionIcon
                variant="subtle"
                color="blue"
                onClick={() => handleView(protocol, service)}
                title="View service"
              >
                <IconEye size={16} />
              </ActionIcon>
              <ActionIcon
                variant="subtle"
                color={canEdit ? 'blue' : 'gray'}
                onClick={() => canEdit && handleEdit(protocol, service)}
                disabled={!canEdit}
                title={canEdit ? 'Edit service' : 'Only database services can be edited'}
              >
                <Edit size={16} />
              </ActionIcon>
              <ActionIcon
                variant="subtle"
                color={canEdit ? 'red' : 'gray'}
                onClick={() => canEdit && handleDelete(protocol, service)}
                disabled={!canEdit}
                title={canEdit ? 'Delete service' : 'Only database services can be deleted'}
              >
                <Trash2 size={16} />
              </ActionIcon>
            </Group>
          </Group>
        </Card.Section>
      </Card>
    )
  }

  const totalServices = httpServices.length + tcpServices.length + udpServices.length

  return (
    <Container size="xl">
      <Stack gap="xl">
        <Group justify="space-between" align="flex-end">
          <Stack gap="xs">
            <Title order={1}>Services</Title>
            <Text c="dimmed">
              Total: {totalServices} services ({httpServices.length} HTTP, {tcpServices.length} TCP,{' '}
              {udpServices.length} UDP)
            </Text>
          </Stack>
          <Button onClick={handleCreate} leftSection={<Plus size={16} />}>
            Add Service
          </Button>
        </Group>

        <Card shadow="sm" radius="md" withBorder>
          <Stack gap="md">
            <TextInput
              placeholder="Search services..."
              leftSection={<Search size={16} />}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />

            <Tabs value={activeTab} onChange={(val) => setActiveTab(val || 'http')}>
              <Tabs.List>
                <Tabs.Tab value="http" leftSection={<IconRouter size={16} />}>
                  HTTP ({httpServices.length})
                </Tabs.Tab>
                <Tabs.Tab value="tcp" leftSection={<IconNetwork size={16} />}>
                  TCP ({tcpServices.length})
                </Tabs.Tab>
                <Tabs.Tab value="udp" leftSection={<IconWifi size={16} />}>
                  UDP ({udpServices.length})
                </Tabs.Tab>
              </Tabs.List>

              <Tabs.Panel value="http" pt="md">
                {httpLoading ? (
                  <Stack align="center" justify="center" style={{ minHeight: '200px' }}>
                    <Loader size="lg" />
                    <Text>Loading HTTP services...</Text>
                  </Stack>
                ) : (
                  <SimpleGrid cols={{ base: 1, md: 2, lg: 3 }} spacing="lg">
                    {filterServices(httpServices).map((service) => renderServiceCard('http', service))}
                  </SimpleGrid>
                )}
                {!httpLoading && filterServices(httpServices).length === 0 && (
                  <Text ta="center" c="dimmed" py="xl">
                    No HTTP services found
                  </Text>
                )}
              </Tabs.Panel>

              <Tabs.Panel value="tcp" pt="md">
                {tcpLoading ? (
                  <Stack align="center" justify="center" style={{ minHeight: '200px' }}>
                    <Loader size="lg" />
                    <Text>Loading TCP services...</Text>
                  </Stack>
                ) : (
                  <SimpleGrid cols={{ base: 1, md: 2, lg: 3 }} spacing="lg">
                    {filterServices(tcpServices).map((service) => renderServiceCard('tcp', service))}
                  </SimpleGrid>
                )}
                {!tcpLoading && filterServices(tcpServices).length === 0 && (
                  <Text ta="center" c="dimmed" py="xl">
                    No TCP services found
                  </Text>
                )}
              </Tabs.Panel>

              <Tabs.Panel value="udp" pt="md">
                {udpLoading ? (
                  <Stack align="center" justify="center" style={{ minHeight: '200px' }}>
                    <Loader size="lg" />
                    <Text>Loading UDP services...</Text>
                  </Stack>
                ) : (
                  <SimpleGrid cols={{ base: 1, md: 2, lg: 3 }} spacing="lg">
                    {filterServices(udpServices).map((service) => renderServiceCard('udp', service))}
                  </SimpleGrid>
                )}
                {!udpLoading && filterServices(udpServices).length === 0 && (
                  <Text ta="center" c="dimmed" py="xl">
                    No UDP services found
                  </Text>
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
          type="services"
          resourceName={viewResource.resource.name}
          config={viewResource.resource.config}
        />
      )}
    </Container>
  )
}
