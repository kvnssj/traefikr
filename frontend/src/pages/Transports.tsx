import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Container,
  Title,
  Button,
  Table,
  Group,
  ActionIcon,
  Text,
  Badge,
  Card,
  Stack,
  TextInput,
  Loader,
  Alert,
  SimpleGrid,
  ThemeIcon,
  Tabs
} from '@mantine/core'
import { notifications } from '@mantine/notifications'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { resourcesApi } from '@/lib/api'
import { ProviderIcon } from '@/components/ProviderIcon'
import { StatusIcon } from '@/components/StatusIcon'
import {
  IconPlus,
  IconEdit,
  IconTrash,
  IconSearch,
  IconPlugConnected,
  IconAlertCircle,
  IconShield,
  IconClock,
  IconDownload,
  IconRouter,
  IconNetwork
} from '@tabler/icons-react'

export default function Transports() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [searchTerm, setSearchTerm] = useState('')
  const [activeTab, setActiveTab] = useState<string>('http')

  // Fetch both HTTP and TCP transports
  const { data: httpTransports, isLoading: isLoadingHttp, error: errorHttp } = useQuery({
    queryKey: ['http-server-transports'],
    queryFn: async () => {
      const response = await resourcesApi.list('http', 'serversTransport', true)
      return response.data
    }
  })

  const { data: tcpTransports, isLoading: isLoadingTcp, error: errorTcp } = useQuery({
    queryKey: ['tcp-server-transports'],
    queryFn: async () => {
      const response = await resourcesApi.list('tcp', 'serversTransport', true)
      return response.data
    }
  })

  // Combine transports
  const transports = [
    ...(httpTransports || []).map((t: any) => ({ ...t, protocol: 'http' })),
    ...(tcpTransports || []).map((t: any) => ({ ...t, protocol: 'tcp' }))
  ]

  const isLoading = isLoadingHttp || isLoadingTcp
  const error = errorHttp || errorTcp

  const handleDelete = async (protocol: string, nameProvider: string) => {
    if (!confirm(`Are you sure you want to delete transport "${nameProvider}"?`)) {
      return
    }

    try {
      await resourcesApi.delete(protocol as any, 'serversTransport', nameProvider)
      notifications.show({
        title: 'Success',
        message: `Transport "${nameProvider}" deleted successfully`,
        color: 'green'
      })
      queryClient.invalidateQueries({ queryKey: ['tcp-server-transports'] })
      queryClient.invalidateQueries({ queryKey: ['http-server-transports'] })
    } catch (error: any) {
      notifications.show({
        title: 'Error',
        message: error.response?.data?.detail || 'Failed to delete transport',
        color: 'red'
      })
    }
  }

  const handleDownload = (transport: any) => {
    // Extract just the name without @provider suffix
    const transportName = transport.name.split('@')[0]

    // Build Traefik config format
    const traefikConfig = {
      [transport.protocol]: {
        serversTransports: {
          [transportName]: transport.config
        }
      }
    }

    // Convert to JSON string with pretty formatting
    const jsonContent = JSON.stringify(traefikConfig, null, 2)

    // Create blob and download
    const blob = new Blob([jsonContent], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    const filename = `${transport.protocol}-serversTransport-${transportName}.json`
    link.download = filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)

    notifications.show({
      title: 'Success',
      message: `Downloaded ${filename}`,
      color: 'green'
    })
  }

  const filterTransportsByProtocol = (protocol: string) => {
    const protocolTransports = protocol === 'http' ? httpTransports : tcpTransports
    if (!protocolTransports) return []
    if (!searchTerm) return protocolTransports
    return protocolTransports.filter((transport: any) =>
      transport.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      transport.provider?.toLowerCase().includes(searchTerm.toLowerCase())
    )
  }

  // Calculate stats
  const stats = {
    total: transports?.length || 0,
    httpCount: transports?.filter((t: any) => t.protocol === 'http').length || 0,
    tcpCount: transports?.filter((t: any) => t.protocol === 'tcp').length || 0,
    withTLS: transports?.filter((t: any) => t.config?.tls || t.config?.tls?.insecureSkipVerify !== undefined).length || 0,
  }

  const getProviderColor = (provider: string) => {
    switch (provider?.toLowerCase()) {
      case 'file': return 'blue'
      case 'docker': return 'green'
      case 'kubernetes': return 'violet'
      case 'consul': return 'orange'
      case 'etcd': return 'red'
      default: return 'gray'
    }
  }

  const hasTLS = (transport: any) => {
    return transport.config?.tls || transport.config?.tls?.insecureSkipVerify !== undefined
  }

  const hasProxyProtocol = (transport: any) => {
    return transport.config?.proxyProtocol
  }

  const hasSPIFFE = (transport: any) => {
    return transport.config?.spiffe
  }

  const renderTransportTable = (protocol: string, transports: any[], isLoading: boolean) => {
    const filteredData = filterTransportsByProtocol(protocol)

    if (isLoading) {
      return (
        <Group justify="center" p="xl">
          <Loader size="lg" />
        </Group>
      )
    }

    if (filteredData.length === 0) {
      return (
        <Alert icon={<IconAlertCircle size={16} />} color="blue">
          {searchTerm
            ? 'No transports found matching your search'
            : `No ${protocol.toUpperCase()} server transports configured. Click "New Transport" to create one.`}
        </Alert>
      )
    }

    return (
      <Table striped highlightOnHover>
        <Table.Thead>
          <Table.Tr>
            <Table.Th>Name</Table.Th>
            <Table.Th>Protocol</Table.Th>
            <Table.Th>Provider</Table.Th>
            <Table.Th>Timeouts</Table.Th>
            <Table.Th>Features</Table.Th>
            <Table.Th>Status</Table.Th>
            <Table.Th>Actions</Table.Th>
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {filteredData.map((transport: any) => (
            <Table.Tr key={transport.name}>
              <Table.Td>
                <Text fw={500}>{transport.name}</Text>
              </Table.Td>
              <Table.Td>
                <Badge color={protocol === 'http' ? 'blue' : 'green'} variant="light">
                  {protocol.toUpperCase()}
                </Badge>
              </Table.Td>
              <Table.Td>
                <ProviderIcon provider={transport.provider || 'unknown'} />
              </Table.Td>
              <Table.Td>
                <Stack gap={2}>
                  {transport.config?.dialTimeout && (
                    <Text size="xs">Dial: {transport.config.dialTimeout}</Text>
                  )}
                  {transport.config?.dialKeepAlive && (
                    <Text size="xs">Keep-Alive: {transport.config.dialKeepAlive}</Text>
                  )}
                </Stack>
              </Table.Td>
              <Table.Td>
                <Group gap="xs">
                  {hasTLS(transport) && (
                    <Badge color="green" variant="light" size="sm">TLS</Badge>
                  )}
                  {hasProxyProtocol(transport) && (
                    <Badge color="blue" variant="light" size="sm">Proxy</Badge>
                  )}
                  {hasSPIFFE(transport) && (
                    <Badge color="violet" variant="light" size="sm">SPIFFE</Badge>
                  )}
                </Group>
              </Table.Td>
              <Table.Td>
                <Badge color={transport.enabled ? 'green' : 'gray'} variant="light">
                  {transport.enabled ? 'Enabled' : 'Disabled'}
                </Badge>
              </Table.Td>
              <Table.Td>
                <Group gap="xs">
                  <ActionIcon
                    variant="subtle"
                    color="blue"
                    onClick={() => handleDownload({ ...transport, protocol })}
                    title="Download Traefik config"
                  >
                    <IconDownload size={16} />
                  </ActionIcon>
                  <ActionIcon
                    variant="subtle"
                    onClick={() => navigate(`/transports/${protocol}/${transport.name}/edit`)}
                    disabled={transport.source === 'traefik'}
                    title="Edit transport"
                  >
                    <IconEdit size={16} />
                  </ActionIcon>
                  <ActionIcon
                    variant="subtle"
                    color="red"
                    onClick={() => handleDelete(protocol, transport.name)}
                    disabled={transport.source === 'traefik'}
                    title="Delete transport"
                  >
                    <IconTrash size={16} />
                  </ActionIcon>
                </Group>
              </Table.Td>
            </Table.Tr>
          ))}
        </Table.Tbody>
      </Table>
    )
  }

  if (error) {
    return (
      <Container size="xl">
        <Alert icon={<IconAlertCircle size={16} />} color="red" title="Error">
          Failed to load TCP server transports. Please try again.
        </Alert>
      </Container>
    )
  }

  return (
    <Container size="xl">
      <Stack gap="lg">
        <Group justify="space-between" align="center">
          <Group>
            <IconPlugConnected size={32} stroke={1.5} color="#00aec1" />
            <Title order={2}>Server Transports</Title>
          </Group>
          <Button
            leftSection={<IconPlus size={16} />}
            onClick={() => navigate('/transports/new')}
          >
            New Transport
          </Button>
        </Group>

        <SimpleGrid cols={{ base: 1, sm: 2, lg: 4 }} spacing="lg">
          <Card withBorder p="lg">
            <Group>
              <ThemeIcon size={60} color="blue" variant="light">
                <IconPlugConnected size={30} />
              </ThemeIcon>
              <Stack gap="xs">
                <Text size="sm" fw={500} c="dimmed">Total Transports</Text>
                <Text size="xl" fw={700}>{stats.total}</Text>
              </Stack>
            </Group>
          </Card>

          <Card withBorder p="lg">
            <Group>
              <ThemeIcon size={60} color="blue" variant="light">
                <IconPlugConnected size={30} />
              </ThemeIcon>
              <Stack gap="xs">
                <Text size="sm" fw={500} c="dimmed">HTTP Transports</Text>
                <Text size="xl" fw={700}>{stats.httpCount}</Text>
              </Stack>
            </Group>
          </Card>

          <Card withBorder p="lg">
            <Group>
              <ThemeIcon size={60} color="green" variant="light">
                <IconPlugConnected size={30} />
              </ThemeIcon>
              <Stack gap="xs">
                <Text size="sm" fw={500} c="dimmed">TCP Transports</Text>
                <Text size="xl" fw={700}>{stats.tcpCount}</Text>
              </Stack>
            </Group>
          </Card>

          <Card withBorder p="lg">
            <Group>
              <ThemeIcon size={60} color="violet" variant="light">
                <IconShield size={30} />
              </ThemeIcon>
              <Stack gap="xs">
                <Text size="sm" fw={500} c="dimmed">With TLS</Text>
                <Text size="xl" fw={700}>{stats.withTLS}</Text>
              </Stack>
            </Group>
          </Card>
        </SimpleGrid>

        <Card shadow="sm" radius="md" withBorder>
          <Stack gap="md">
            <TextInput
              placeholder="Search by name or provider..."
              leftSection={<IconSearch size={16} />}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />

            <Tabs value={activeTab} onChange={(val) => setActiveTab(val || 'http')}>
              <Tabs.List>
                <Tabs.Tab value="http" leftSection={<IconRouter size={16} />}>
                  HTTP ({httpTransports?.length || 0})
                </Tabs.Tab>
                <Tabs.Tab value="tcp" leftSection={<IconNetwork size={16} />}>
                  TCP ({tcpTransports?.length || 0})
                </Tabs.Tab>
              </Tabs.List>

              <Tabs.Panel value="http" pt="md">
                {renderTransportTable('http', httpTransports || [], isLoadingHttp)}
              </Tabs.Panel>

              <Tabs.Panel value="tcp" pt="md">
                {renderTransportTable('tcp', tcpTransports || [], isLoadingTcp)}
              </Tabs.Panel>
            </Tabs>
          </Stack>
        </Card>
      </Stack>
    </Container>
  )
}