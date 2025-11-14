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
  Alert,
} from '@mantine/core'
import { modals } from '@mantine/modals'
import { notifications } from '@mantine/notifications'
import { resourcesApi, Resource } from '@/lib/api'
import { ProviderIcon } from '@/components/ProviderIcon'
import { StatusIcon } from '@/components/StatusIcon'
import { Network as Server, Trash2, Edit, Plus, Search } from 'lucide-react'
import { IconRouter, IconNetwork, IconWifi, IconInfoCircle } from '@tabler/icons-react'

export default function Services() {
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState<string>('http')
  const [searchQuery, setSearchQuery] = useState('')

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

  const filterServices = (services: Resource[]) => {
    if (!searchQuery) return services
    return services.filter(
      (service) =>
        service.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        service.provider.toLowerCase().includes(searchQuery.toLowerCase())
    )
  }

  const renderServiceCard = (protocol: string, service: Resource) => {
    const canEdit = service.source === 'database'

    // Get servers from either Traefik-sourced (direct properties) or database (config property)
    const serviceObj = service as any
    const loadBalancer = serviceObj.loadBalancer || service.config?.loadBalancer
    const weighted = serviceObj.weighted || service.config?.weighted
    const servers = loadBalancer?.servers || weighted?.services || []

    return (
      <Card key={service.name} withBorder>
        <Card.Section withBorder inheritPadding py="md">
          <Group justify="space-between" align="center">
            <Group gap="xs">
              <Server size={20} color="gray" />
              <Title order={4}>{service.name.split('@')[0]}</Title>
            </Group>
            <ProviderIcon provider={service.provider} />
          </Group>
        </Card.Section>

        <Stack gap="md" mt="md">
          {/* Internal service note */}
          {service.provider === 'internal' && (
            <Alert icon={<IconInfoCircle size={16} />} color="blue" variant="light">
              <Text size="xs">Internal resource managed automatically by Traefik. Cannot be modified or deleted.</Text>
            </Alert>
          )}

          {/* External provider note */}
          {service.source !== 'database' && service.provider !== 'internal' && (
            <Alert icon={<IconInfoCircle size={16} />} color="gray" variant="light">
              <Text size="xs">
                Managed by the <strong>{service.provider}</strong> provider. Modifications must be made through the provider's configuration.
              </Text>
            </Alert>
          )}

          {/* Servers */}
          {servers.length > 0 && (
            <div>
              <Text size="xs" c="dimmed" mb="xs">
                {protocol === 'http' ? 'Load Balancer Servers' : 'Servers'}
              </Text>
              <Stack gap="xs">
                {servers.slice(0, 3).map((server: any, idx: number) => (
                  <Text
                    key={idx}
                    component="code"
                    size="xs"
                    c="dimmed"
                    style={{
                      backgroundColor: 'var(--mantine-color-gray-1)',
                      padding: '2px 6px',
                      borderRadius: '4px',
                    }}
                  >
                    {server.url || server.address || server.name}
                  </Text>
                ))}
                {servers.length > 3 && (
                  <Text size="xs" c="dimmed">
                    ... and {servers.length - 3} more
                  </Text>
                )}
              </Stack>
            </div>
          )}

          {/* Status and Actions */}
          <Group justify="space-between" pt="md" style={{ borderTop: '1px solid var(--mantine-color-gray-3)' }}>
            <StatusIcon
              enabled={service.status === 'enabled' || service.enabled}
              enabledLabel="Enabled"
              disabledLabel="Disabled"
            />
            <Group gap="xs">
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
        </Stack>
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
    </Container>
  )
}
