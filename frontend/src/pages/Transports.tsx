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
  Alert
} from '@mantine/core'
import { notifications } from '@mantine/notifications'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { ProviderIcon } from '@/components/ProviderIcon'
import { StatusIcon } from '@/components/StatusIcon'
import { 
  IconPlus, 
  IconEdit, 
  IconTrash, 
  IconSearch,
  IconPlugConnected,
  IconAlertCircle
} from '@tabler/icons-react'

export default function Transports() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [searchTerm, setSearchTerm] = useState('')

  const { data: transports, isLoading, error } = useQuery({
    queryKey: ['tcp-server-transports'],
    queryFn: async () => {
      const response = await api.get('/tcp-server-transports/')
      return response.data
    }
  })

  const handleDelete = async (name: string) => {
    if (!confirm(`Are you sure you want to delete transport "${name}"?`)) {
      return
    }

    try {
      await api.delete(`/tcp-server-transports/${name}`)
      notifications.show({
        title: 'Success',
        message: `Transport "${name}" deleted successfully`,
        color: 'green'
      })
      queryClient.invalidateQueries({ queryKey: ['tcp-server-transports'] })
    } catch (error: any) {
      notifications.show({
        title: 'Error',
        message: error.response?.data?.detail || 'Failed to delete transport',
        color: 'red'
      })
    }
  }

  const filteredTransports = transports?.filter((transport: any) =>
    transport.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    transport.provider?.toLowerCase().includes(searchTerm.toLowerCase())
  )

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
    return transport.tls?.enabled || transport.tls
  }

  const hasProxyProtocol = (transport: any) => {
    return transport.proxyProtocol?.enabled || transport.proxyProtocol
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
            <Title order={2}>TCP Server Transports</Title>
          </Group>
          <Button
            leftSection={<IconPlus size={16} />}
            onClick={() => navigate('/transports/tcp/new')}
          >
            New Transport
          </Button>
        </Group>

        <Card shadow="sm" radius="md" withBorder>
          <Stack>
            <TextInput
              placeholder="Search by name or provider..."
              leftSection={<IconSearch size={16} />}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />

            {isLoading ? (
              <Group justify="center" p="xl">
                <Loader size="lg" />
              </Group>
            ) : filteredTransports?.length === 0 ? (
              <Alert icon={<IconAlertCircle size={16} />} color="blue">
                {searchTerm 
                  ? 'No transports found matching your search'
                  : 'No TCP server transports configured. Click "New Transport" to create one.'}
              </Alert>
            ) : (
              <Table striped highlightOnHover>
                <Table.Thead>
                  <Table.Tr>
                    <Table.Th>Name</Table.Th>
                    <Table.Th>Provider</Table.Th>
                    <Table.Th>Timeouts</Table.Th>
                    <Table.Th>Features</Table.Th>
                    <Table.Th>Status</Table.Th>
                    <Table.Th>Actions</Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {filteredTransports?.map((transport: any) => (
                    <Table.Tr key={transport.name}>
                      <Table.Td>
                        <Text fw={500}>{transport.name}</Text>
                      </Table.Td>
                      <Table.Td>
                        <ProviderIcon provider={transport.provider || 'unknown'} />
                      </Table.Td>
                      <Table.Td>
                        <Stack gap={2}>
                          {transport.dialTimeout && (
                            <Text size="xs">Dial: {transport.dialTimeout}</Text>
                          )}
                          {transport.dialKeepAlive && (
                            <Text size="xs">Keep-Alive: {transport.dialKeepAlive}</Text>
                          )}
                        </Stack>
                      </Table.Td>
                      <Table.Td>
                        <Group gap="xs">
                          {hasTLS(transport) && (
                            <StatusIcon 
                              enabled={true} 
                              enabledLabel="TLS Enabled" 
                            />
                          )}
                          {hasProxyProtocol(transport) && (
                            <StatusIcon 
                              enabled={true} 
                              enabledLabel="Proxy Protocol Enabled" 
                            />
                          )}
                          {transport.spiffe && (
                            <StatusIcon 
                              enabled={true} 
                              enabledLabel="SPIFFE Enabled" 
                            />
                          )}
                        </Group>
                      </Table.Td>
                      <Table.Td>
                        <Badge color={transport.status === 'active' ? 'green' : 'yellow'}>
                          {transport.status || 'active'}
                        </Badge>
                      </Table.Td>
                      <Table.Td>
                        <Group gap="xs">
                          <ActionIcon
                            variant="subtle"
                            onClick={() => navigate(`/transports/tcp/${transport.name}/edit`)}
                            disabled={transport.provider !== 'file'}
                          >
                            <IconEdit size={16} />
                          </ActionIcon>
                          <ActionIcon
                            variant="subtle"
                            color="red"
                            onClick={() => handleDelete(transport.name)}
                            disabled={transport.provider !== 'file'}
                          >
                            <IconTrash size={16} />
                          </ActionIcon>
                        </Group>
                      </Table.Td>
                    </Table.Tr>
                  ))}
                </Table.Tbody>
              </Table>
            )}
          </Stack>
        </Card>
      </Stack>
    </Container>
  )
}