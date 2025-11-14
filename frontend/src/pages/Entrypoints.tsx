import { Container, Title, Paper, Table, Badge, Group, Text, Loader, Alert, Card, Stack, TextInput } from '@mantine/core'
import { IconInfoCircle, IconSearch, IconDoorEnter } from '@tabler/icons-react'
import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { StatusIcon } from '@/components/StatusIcon'

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
      const response = await api.get('/entrypoints/')
      return response.data
    }
  })
  
  const filteredEntrypoints = entrypoints?.filter((ep) =>
    ep.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    ep.address?.toLowerCase().includes(searchTerm.toLowerCase())
  )

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
      <Table.Td>{entrypoint.address || '-'}</Table.Td>
      <Table.Td>
        <Badge color="blue">TCP</Badge>
      </Table.Td>
      <Table.Td>
        <StatusIcon 
          enabled={!!entrypoint.http?.tls} 
          enabledLabel="TLS Enabled" 
          disabledLabel="No TLS" 
        />
      </Table.Td>
      <Table.Td>
        {entrypoint.http?.middlewares?.length ? (
          <Group gap="xs">
            {entrypoint.http.middlewares.map((mw, idx) => (
              <Badge key={`${entrypoint.name}-mw-${idx}`} variant="light">
                {typeof mw === 'string' ? mw : JSON.stringify(mw)}
              </Badge>
            ))}
          </Group>
        ) : (
          '-'
        )}
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
                  <Table.Th>Transport</Table.Th>
                  <Table.Th>TLS</Table.Th>
                  <Table.Th>Middlewares</Table.Th>
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