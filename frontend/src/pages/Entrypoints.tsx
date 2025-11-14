import { Container, Title, Table, Badge, Group, Text, Loader, Alert, Card, Stack, TextInput, SimpleGrid, ThemeIcon } from '@mantine/core'
import { IconInfoCircle, IconSearch, IconDoorEnter, IconShield, IconPlugConnected, IconRocket } from '@tabler/icons-react'
import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { entrypointsApi } from '@/lib/api'

interface Entrypoint {
  name: string
  address?: string
  transport?: {
    lifeCycle?: {
      graceTimeOut?: string
    }
    respondingTimeouts?: {
      readTimeout?: string
      idleTimeout?: string
    }
  }
  forwardedHeaders?: Record<string, any>
  http?: {
    tls?: Record<string, any>
    redirections?: Record<string, any>
    middlewares?: string[]
  }
  udp?: {
    timeout?: string
  }
  http2?: {
    maxConcurrentStreams?: number
  }
  http3?: {
    advertisedPort?: number
  }
}

export default function Entrypoints() {
  const [searchTerm, setSearchTerm] = useState('')
  
  const { data: entrypoints, isLoading, error } = useQuery<Entrypoint[]>({
    queryKey: ['entrypoints'],
    queryFn: async () => {
      const response = await entrypointsApi.list()
      return response.data
    }
  })
  
  const filteredEntrypoints = entrypoints?.filter((ep) =>
    ep.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    ep.address?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  // Calculate stats
  const stats = {
    total: entrypoints?.length || 0,
    http2Enabled: entrypoints?.filter(ep => ep.http2).length || 0,
    http3Enabled: entrypoints?.filter(ep => ep.http3).length || 0,
    avgMaxConcurrentStreams: entrypoints?.length ?
      Math.round(entrypoints.reduce((sum, ep) => sum + (ep.http2?.maxConcurrentStreams || 0), 0) / entrypoints.length) : 0,
    withForwardedHeaders: entrypoints?.filter(ep => ep.forwardedHeaders && Object.keys(ep.forwardedHeaders).length > 0).length || 0,
  }

  if (isLoading) {
    return (
      <Container>
        <Group justify="center" mt="xl">
          <Loader />
        </Group>
      </Container>
    )
  }

  if (error) {
    return (
      <Container>
        <Alert icon={<IconInfoCircle size={16} />} color="red" mt="xl">
          Failed to load entrypoints. Please make sure Traefik is running and accessible.
        </Alert>
      </Container>
    )
  }

  const rows = filteredEntrypoints?.map((entrypoint) => (
    <Table.Tr key={entrypoint.name}>
      <Table.Td>
        <Text fw={600}>{entrypoint.name}</Text>
      </Table.Td>
      <Table.Td>
        <Badge variant="light">{entrypoint.address || '-'}</Badge>
      </Table.Td>
      <Table.Td>
        {entrypoint.http2 ? (
          <Badge color="green" variant="light">
            HTTP/2 ({entrypoint.http2.maxConcurrentStreams} streams)
          </Badge>
        ) : (
          <Badge color="gray" variant="light">HTTP/1.1</Badge>
        )}
      </Table.Td>
      <Table.Td>
        <Text size="sm">{entrypoint.transport?.respondingTimeouts?.readTimeout || '-'}</Text>
      </Table.Td>
      <Table.Td>
        <Text size="sm">{entrypoint.transport?.respondingTimeouts?.idleTimeout || '-'}</Text>
      </Table.Td>
    </Table.Tr>
  ))

  return (
    <Container size="xl">
      <Stack gap="lg">
        <Group justify="space-between" align="center">
          <Group>
            <IconDoorEnter size={32} stroke={1.5} color="#00aec1" />
            <div>
              <Title order={2}>Entrypoints</Title>
              <Text size="sm" c="dimmed">
                Entrypoints are configured in Traefik's static configuration
              </Text>
            </div>
          </Group>
        </Group>

        <SimpleGrid cols={{ base: 1, sm: 2, lg: 4 }} spacing="lg">
          <Card withBorder p="lg">
            <Group>
              <ThemeIcon size={60} color="blue" variant="light">
                <IconDoorEnter size={30} />
              </ThemeIcon>
              <Stack gap="xs">
                <Text size="sm" fw={500} c="dimmed">Total Entrypoints</Text>
                <Text size="xl" fw={700}>{stats.total}</Text>
              </Stack>
            </Group>
          </Card>

          <Card withBorder p="lg">
            <Group>
              <ThemeIcon size={60} color="green" variant="light">
                <IconRocket size={30} />
              </ThemeIcon>
              <Stack gap="xs">
                <Text size="sm" fw={500} c="dimmed">HTTP/2 Enabled</Text>
                <Text size="xl" fw={700}>{stats.http2Enabled}</Text>
              </Stack>
            </Group>
          </Card>

          <Card withBorder p="lg">
            <Group>
              <ThemeIcon size={60} color="violet" variant="light">
                <IconPlugConnected size={30} />
              </ThemeIcon>
              <Stack gap="xs">
                <Text size="sm" fw={500} c="dimmed">Avg Concurrent Streams</Text>
                <Text size="xl" fw={700}>{stats.avgMaxConcurrentStreams}</Text>
              </Stack>
            </Group>
          </Card>

          <Card withBorder p="lg">
            <Group>
              <ThemeIcon size={60} color="orange" variant="light">
                <IconShield size={30} />
              </ThemeIcon>
              <Stack gap="xs">
                <Text size="sm" fw={500} c="dimmed">Forwarded Headers</Text>
                <Text size="xl" fw={700}>{stats.withForwardedHeaders}</Text>
              </Stack>
            </Group>
          </Card>
        </SimpleGrid>

        <Card shadow="sm" radius="md" withBorder>
          <Stack>
            <TextInput
              placeholder="Search by name or address..."
              leftSection={<IconSearch size={16} />}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            
            <Table striped highlightOnHover>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>Name</Table.Th>
                  <Table.Th>Address</Table.Th>
                  <Table.Th>Protocol</Table.Th>
                  <Table.Th>Read Timeout</Table.Th>
                  <Table.Th>Idle Timeout</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {rows?.length ? (
                  rows
                ) : (
                  <Table.Tr>
                    <Table.Td colSpan={5} ta="center" c="dimmed">
                      {searchTerm ? 'No entrypoints found matching your search' : 'No entrypoints found'}
                    </Table.Td>
                  </Table.Tr>
                )}
              </Table.Tbody>
            </Table>
          </Stack>
        </Card>
      </Stack>
    </Container>
  )
}