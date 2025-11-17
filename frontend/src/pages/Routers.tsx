import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Container,
  Title,
  Button,
  Group,
  Text,
  Badge,
  Tabs,
  Card,
  Stack,
} from '@mantine/core'
import {
  IconPlus,
  IconRouter,
  IconNetwork,
  IconWifi,
} from '@tabler/icons-react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { notifications } from '@mantine/notifications'
import { modals } from '@mantine/modals'
import { resourcesApi, Resource } from '@/lib/api'
import { DataTable, Column } from '@/components/DataTable'
import { ProviderIcon } from '@/components/ProviderIcon'
import { StatusIcon } from '@/components/StatusIcon'
import { ResourceViewModal } from '@/components/ResourceViewModal'

export default function Routers() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [activeTab, setActiveTab] = useState<string>('http')
  const [viewModalOpened, setViewModalOpened] = useState(false)
  const [viewResource, setViewResource] = useState<{ protocol: string; resource: Resource } | null>(null)

  // Fetch HTTP routers
  const { data: httpRouters = [], isLoading: httpLoading } = useQuery({
    queryKey: ['resources', 'http', 'routers', true],
    queryFn: async () => {
      const response = await resourcesApi.list('http', 'routers', true)
      return response.data
    },
  })

  // Fetch TCP routers
  const { data: tcpRouters = [], isLoading: tcpLoading } = useQuery({
    queryKey: ['resources', 'tcp', 'routers', true],
    queryFn: async () => {
      const response = await resourcesApi.list('tcp', 'routers', true)
      return response.data
    },
  })

  // Fetch UDP routers
  const { data: udpRouters = [], isLoading: udpLoading } = useQuery({
    queryKey: ['resources', 'udp', 'routers', true],
    queryFn: async () => {
      const response = await resourcesApi.list('udp', 'routers', true)
      return response.data
    },
  })

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async ({ protocol, name }: { protocol: string; name: string }) => {
      await resourcesApi.delete(protocol as any, 'routers', name)
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['resources', variables.protocol, 'routers'] })
      notifications.show({
        title: 'Success',
        message: 'Router deleted successfully',
        color: 'green',
      })
    },
    onError: () => {
      notifications.show({
        title: 'Error',
        message: 'Failed to delete router',
        color: 'red',
      })
    },
  })

  const handleDelete = (protocol: string, router: Resource) => {
    modals.openConfirmModal({
      title: 'Delete Router',
      children: (
        <Text size="sm">
          Are you sure you want to delete router <strong>{router.name}</strong>? This action cannot be undone.
        </Text>
      ),
      labels: { confirm: 'Delete', cancel: 'Cancel' },
      confirmProps: { color: 'red' },
      onConfirm: () => deleteMutation.mutate({ protocol, name: router.name }),
    })
  }

  const handleView = (protocol: string, router: Resource) => {
    setViewResource({ protocol, resource: router })
    setViewModalOpened(true)
  }

  // HTTP Router columns
  const httpColumns: Column<Resource>[] = [
    {
      key: 'name',
      label: 'Name',
      sortable: true,
      render: (value) => <Text fw={600}>{value}</Text>,
    },
    {
      key: 'rule',
      label: 'Rule',
      sortable: true,
      render: (_, row) => (
        <Text size="sm" style={{ fontFamily: 'monospace' }}>
          {row.config?.rule || '-'}
        </Text>
      ),
    },
    {
      key: 'service',
      label: 'Service',
      sortable: true,
      render: (_, row) => row.config?.service || '-',
    },
    {
      key: 'entryPoints',
      label: 'Entry Points',
      render: (_, row) => (
        <Group gap={4}>
          {row.config?.entryPoints?.map((ep: string) => (
            <Badge key={ep} size="sm" variant="light">
              {ep}
            </Badge>
          ))}
        </Group>
      ),
    },
    {
      key: 'middlewares',
      label: 'Middlewares',
      render: (_, row) =>
        row.config?.middlewares?.length > 0 ? (
          <Badge size="sm">{row.config.middlewares.length}</Badge>
        ) : (
          '-'
        ),
    },
    {
      key: 'tls',
      label: 'TLS',
      render: (_, row) => (
        <StatusIcon enabled={!!row.config?.tls} enabledLabel="Enabled" disabledLabel="Disabled" />
      ),
    },
    {
      key: 'provider',
      label: 'Provider',
      sortable: true,
      render: (value) => <ProviderIcon provider={value} />,
    },
    {
      key: 'enabled',
      label: 'Status',
      sortable: true,
      render: (value, row) => (
        <StatusIcon enabled={value} enabledLabel="Enabled" disabledLabel="Disabled" />
      ),
    },
  ]

  // TCP Router columns
  const tcpColumns: Column<Resource>[] = [
    {
      key: 'name',
      label: 'Name',
      sortable: true,
      render: (value) => <Text fw={600}>{value}</Text>,
    },
    {
      key: 'rule',
      label: 'Rule',
      sortable: true,
      render: (_, row) => (
        <Text size="sm" style={{ fontFamily: 'monospace' }}>
          {row.config?.rule || '-'}
        </Text>
      ),
    },
    {
      key: 'service',
      label: 'Service',
      sortable: true,
      render: (_, row) => row.config?.service || '-',
    },
    {
      key: 'entryPoints',
      label: 'Entry Points',
      render: (_, row) => (
        <Group gap={4}>
          {row.config?.entryPoints?.map((ep: string) => (
            <Badge key={ep} size="sm" variant="light">
              {ep}
            </Badge>
          ))}
        </Group>
      ),
    },
    {
      key: 'middlewares',
      label: 'Middlewares',
      render: (_, row) =>
        row.config?.middlewares?.length > 0 ? (
          <Badge size="sm">{row.config.middlewares.length}</Badge>
        ) : (
          '-'
        ),
    },
    {
      key: 'tls',
      label: 'TLS',
      render: (_, row) => {
        if (row.config?.tls) {
          return (
            <Group gap="xs">
              <StatusIcon enabled={true} enabledLabel={row.config.tls.passthrough ? 'Passthrough' : 'Termination'} />
              <Text size="xs" c="dimmed">
                {row.config.tls.passthrough ? 'Passthrough' : 'Termination'}
              </Text>
            </Group>
          )
        }
        return <StatusIcon enabled={false} disabledLabel="No TLS" />
      },
    },
    {
      key: 'provider',
      label: 'Provider',
      sortable: true,
      render: (value) => <ProviderIcon provider={value} />,
    },
    {
      key: 'enabled',
      label: 'Status',
      sortable: true,
      render: (value, row) => (
        <StatusIcon enabled={value} enabledLabel="Enabled" disabledLabel="Disabled" />
      ),
    },
  ]

  // UDP Router columns
  const udpColumns: Column<Resource>[] = [
    {
      key: 'name',
      label: 'Name',
      sortable: true,
      render: (value) => <Text fw={600}>{value}</Text>,
    },
    {
      key: 'service',
      label: 'Service',
      sortable: true,
      render: (_, row) => row.config?.service || '-',
    },
    {
      key: 'entryPoints',
      label: 'Entry Points',
      render: (_, row) => (
        <Group gap={4}>
          {row.config?.entryPoints?.map((ep: string) => (
            <Badge key={ep} size="sm" variant="light">
              {ep}
            </Badge>
          ))}
        </Group>
      ),
    },
    {
      key: 'provider',
      label: 'Provider',
      sortable: true,
      render: (value) => <ProviderIcon provider={value} />,
    },
    {
      key: 'enabled',
      label: 'Status',
      sortable: true,
      render: (value, row) => (
        <StatusIcon enabled={value} enabledLabel="Enabled" disabledLabel="Disabled" />
      ),
    },
  ]

  const canEdit = (router: Resource) => router.source === 'database'
  const canDelete = (router: Resource) => router.source === 'database'

  const totalRouters = httpRouters.length + tcpRouters.length + udpRouters.length

  return (
    <Container size="xl">
      <Stack gap="lg">
        <Group justify="space-between" align="center">
          <Group>
            <IconRouter size={32} stroke={1.5} color="#00aec1" />
            <div>
              <Title order={2}>Routers</Title>
              <Text c="dimmed" size="sm">
                Total: {totalRouters} routers ({httpRouters.length} HTTP, {tcpRouters.length} TCP,{' '}
                {udpRouters.length} UDP)
              </Text>
            </div>
          </Group>
          <Button leftSection={<IconPlus size={16} />} onClick={() => navigate('/routers/new')}>
            Add Router
          </Button>
        </Group>

        <Card shadow="sm" radius="md" withBorder>
          <Tabs value={activeTab} onChange={(val) => setActiveTab(val || 'http')}>
            <Tabs.List>
              <Tabs.Tab value="http" leftSection={<IconRouter size={16} />}>
                HTTP ({httpRouters.length})
              </Tabs.Tab>
              <Tabs.Tab value="tcp" leftSection={<IconNetwork size={16} />}>
                TCP ({tcpRouters.length})
              </Tabs.Tab>
              <Tabs.Tab value="udp" leftSection={<IconWifi size={16} />}>
                UDP ({udpRouters.length})
              </Tabs.Tab>
            </Tabs.List>

            <Tabs.Panel value="http" pt="md">
              <DataTable
                columns={httpColumns}
                data={httpRouters}
                isLoading={httpLoading}
                onView={(router) => handleView('http', router)}
                onEdit={(router) => navigate(`/routers/http/${router.name}/edit`)}
                onDelete={(router) => handleDelete('http', router)}
                getRowKey={(router) => router.name}
                canEdit={canEdit}
                canDelete={canDelete}
                enableSourceFilter
                enableStatusFilter
                searchPlaceholder="Search HTTP routers..."
                emptyMessage="No HTTP routers found"
                defaultSort={{ key: 'name', direction: 'asc' }}
              />
            </Tabs.Panel>

            <Tabs.Panel value="tcp" pt="md">
              <DataTable
                columns={tcpColumns}
                data={tcpRouters}
                isLoading={tcpLoading}
                onView={(router) => handleView('tcp', router)}
                onEdit={(router) => navigate(`/routers/tcp/${router.name}/edit`)}
                onDelete={(router) => handleDelete('tcp', router)}
                getRowKey={(router) => router.name}
                canEdit={canEdit}
                canDelete={canDelete}
                enableSourceFilter
                enableStatusFilter
                searchPlaceholder="Search TCP routers..."
                emptyMessage="No TCP routers found"
                defaultSort={{ key: 'name', direction: 'asc' }}
              />
            </Tabs.Panel>

            <Tabs.Panel value="udp" pt="md">
              <DataTable
                columns={udpColumns}
                data={udpRouters}
                isLoading={udpLoading}
                onView={(router) => handleView('udp', router)}
                onEdit={(router) => navigate(`/routers/udp/${router.name}/edit`)}
                onDelete={(router) => handleDelete('udp', router)}
                getRowKey={(router) => router.name}
                canEdit={canEdit}
                canDelete={canDelete}
                enableSourceFilter
                enableStatusFilter
                searchPlaceholder="Search UDP routers..."
                emptyMessage="No UDP routers found"
                defaultSort={{ key: 'name', direction: 'asc' }}
              />
            </Tabs.Panel>
          </Tabs>
        </Card>
      </Stack>

      {viewResource && (
        <ResourceViewModal
          opened={viewModalOpened}
          onClose={() => setViewModalOpened(false)}
          protocol={viewResource.protocol as any}
          type="routers"
          resourceName={viewResource.resource.name}
          config={viewResource.resource.config}
        />
      )}
    </Container>
  )
}
