import { useState } from 'react'
import { Container, Title, Tabs, Paper, Table, Button, Group, ActionIcon, Badge, Text, Loader, Card, Stack, TextInput } from '@mantine/core'
import { IconPlus, IconEdit, IconTrash, IconCertificate, IconSettings, IconSearch, IconLock } from '@tabler/icons-react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { notifications } from '@mantine/notifications'
import { useNavigate } from 'react-router-dom'
import { api } from '@/lib/api'
import { StatusIcon } from '@/components/StatusIcon'

interface TLSCertificate {
  id: number
  name: string
  cert_file?: string
  key_file?: string
  stores: string[]
}

interface TLSOption {
  id: number
  name: string
  min_version?: string
  max_version?: string
  cipher_suites: string[]
  curve_preferences: string[]
  sni_strict: boolean
  prefer_server_cipher_suites: boolean
  client_auth?: Record<string, any>
  alpn_protocols: string[]
}

export default function TLS() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [activeTab, setActiveTab] = useState<string | null>('certificates')
  const [searchTerm, setSearchTerm] = useState('')

  // Certificates query
  const { data: certificates, isLoading: certsLoading } = useQuery<TLSCertificate[]>({
    queryKey: ['tls-certificates'],
    queryFn: async () => {
      const response = await api.get('/tls/certificates')
      return response.data
    }
  })

  // TLS Options query
  const { data: options, isLoading: optionsLoading } = useQuery<TLSOption[]>({
    queryKey: ['tls-options'],
    queryFn: async () => {
      const response = await api.get('/tls/options')
      return response.data
    }
  })

  // Delete certificate mutation
  const deleteCertMutation = useMutation({
    mutationFn: async (name: string) => {
      await api.delete(`/tls/certificates/${name}`)
    },
    onSuccess: () => {
      notifications.show({
        title: 'Success',
        message: 'Certificate deleted successfully',
        color: 'green'
      })
      queryClient.invalidateQueries({ queryKey: ['tls-certificates'] })
    },
    onError: () => {
      notifications.show({
        title: 'Error',
        message: 'Failed to delete certificate',
        color: 'red'
      })
    }
  })

  // Delete option mutation
  const deleteOptionMutation = useMutation({
    mutationFn: async (name: string) => {
      await api.delete(`/tls/options/${name}`)
    },
    onSuccess: () => {
      notifications.show({
        title: 'Success',
        message: 'TLS option deleted successfully',
        color: 'green'
      })
      queryClient.invalidateQueries({ queryKey: ['tls-options'] })
    },
    onError: () => {
      notifications.show({
        title: 'Error',
        message: 'Failed to delete TLS option',
        color: 'red'
      })
    }
  })

  const filteredCertificates = certificates?.filter((cert) =>
    cert.name.toLowerCase().includes(searchTerm.toLowerCase())
  )
  
  const filteredOptions = options?.filter((option) =>
    option.name.toLowerCase().includes(searchTerm.toLowerCase())
  )
  
  const certificateRows = filteredCertificates?.map((cert) => (
    <Table.Tr key={cert.id}>
      <Table.Td>
        <Text fw={600}>{cert.name}</Text>
      </Table.Td>
      <Table.Td>
        {cert.cert_file || <Text c="dimmed" fs="italic">Inline content</Text>}
      </Table.Td>
      <Table.Td>
        {cert.key_file || <Text c="dimmed" fs="italic">Inline content</Text>}
      </Table.Td>
      <Table.Td>
        {cert.stores?.length ? (
          <Group gap="xs">
            {cert.stores.map((store) => (
              <Badge key={store} variant="light">
                {store}
              </Badge>
            ))}
          </Group>
        ) : (
          '-'
        )}
      </Table.Td>
      <Table.Td>
        <Group gap="xs">
          <ActionIcon
            variant="subtle"
            onClick={() => navigate(`/tls/certificates/${cert.name}/edit`)}
          >
            <IconEdit size={16} />
          </ActionIcon>
          <ActionIcon
            variant="subtle"
            color="red"
            onClick={() => {
              if (confirm(`Are you sure you want to delete certificate "${cert.name}"?`)) {
                deleteCertMutation.mutate(cert.name)
              }
            }}
          >
            <IconTrash size={16} />
          </ActionIcon>
        </Group>
      </Table.Td>
    </Table.Tr>
  ))

  const optionRows = filteredOptions?.map((option) => (
    <Table.Tr key={option.id}>
      <Table.Td>
        <Text fw={600}>{option.name}</Text>
      </Table.Td>
      <Table.Td>
        {option.min_version || '-'}
      </Table.Td>
      <Table.Td>
        {option.max_version || '-'}
      </Table.Td>
      <Table.Td>
        <Group gap="xs">
          <StatusIcon 
            enabled={option.sni_strict} 
            enabledLabel="SNI Strict" 
            disabledLabel="SNI Permissive" 
          />
          <Text size="xs" c="dimmed">
            {option.sni_strict ? 'Strict' : 'Permissive'}
          </Text>
        </Group>
      </Table.Td>
      <Table.Td>
        {option.cipher_suites?.length || 0} suites
      </Table.Td>
      <Table.Td>
        <Group gap="xs">
          <ActionIcon
            variant="subtle"
            onClick={() => navigate(`/tls/options/${option.name}/edit`)}
          >
            <IconEdit size={16} />
          </ActionIcon>
          <ActionIcon
            variant="subtle"
            color="red"
            onClick={() => {
              if (confirm(`Are you sure you want to delete TLS option "${option.name}"?`)) {
                deleteOptionMutation.mutate(option.name)
              }
            }}
          >
            <IconTrash size={16} />
          </ActionIcon>
        </Group>
      </Table.Td>
    </Table.Tr>
  ))

  return (
    <Container size="xl">
      <Stack gap="lg">
        <Group justify="space-between" align="center">
          <Group>
            <IconLock size={32} stroke={1.5} color="#00aec1" />
            <div>
              <Title order={2}>TLS Configuration</Title>
              <Text size="sm" c="dimmed">
                Manage certificates and TLS options
              </Text>
            </div>
          </Group>
          <Button
            leftSection={<IconPlus size={16} />}
            onClick={() => navigate(activeTab === 'certificates' ? '/tls/certificates/new' : '/tls/options/new')}
          >
            Add {activeTab === 'certificates' ? 'Certificate' : 'TLS Option'}
          </Button>
        </Group>

        <Card shadow="sm" radius="md" withBorder>
          <Stack>
            <TextInput
              placeholder="Search by name..."
              leftSection={<IconSearch size={16} />}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            
            <Tabs value={activeTab} onChange={setActiveTab}>
              <Tabs.List>
                <Tabs.Tab value="certificates" leftSection={<IconCertificate size={16} />}>
                  Certificates ({certificates?.length || 0})
                </Tabs.Tab>
                <Tabs.Tab value="options" leftSection={<IconSettings size={16} />}>
                  TLS Options ({options?.length || 0})
                </Tabs.Tab>
              </Tabs.List>

              <Tabs.Panel value="certificates" pt="md">
                <Table striped highlightOnHover>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>Name</Table.Th>
                  <Table.Th>Certificate File</Table.Th>
                  <Table.Th>Key File</Table.Th>
                  <Table.Th>Stores</Table.Th>
                  <Table.Th>Actions</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {certsLoading ? (
                  <Table.Tr>
                    <Table.Td colSpan={5} ta="center">
                      <Loader size="sm" />
                    </Table.Td>
                  </Table.Tr>
                ) : certificateRows?.length ? (
                  certificateRows
                ) : (
                  <Table.Tr>
                    <Table.Td colSpan={5} ta="center" c="dimmed">
                      {searchTerm ? 'No certificates found matching your search' : 'No certificates found'}
                    </Table.Td>
                  </Table.Tr>
                )}
              </Table.Tbody>
            </Table>
          </Tabs.Panel>

          <Tabs.Panel value="options" pt="md">
            <Table striped highlightOnHover>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>Name</Table.Th>
                  <Table.Th>Min Version</Table.Th>
                  <Table.Th>Max Version</Table.Th>
                  <Table.Th>SNI</Table.Th>
                  <Table.Th>Cipher Suites</Table.Th>
                  <Table.Th>Actions</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {optionsLoading ? (
                  <Table.Tr>
                    <Table.Td colSpan={6} ta="center">
                      <Loader size="sm" />
                    </Table.Td>
                  </Table.Tr>
                ) : optionRows?.length ? (
                  optionRows
                ) : (
                  <Table.Tr>
                    <Table.Td colSpan={6} ta="center" c="dimmed">
                      {searchTerm ? 'No TLS options found matching your search' : 'No TLS options found'}
                    </Table.Td>
                  </Table.Tr>
                )}
              </Table.Tbody>
            </Table>
          </Tabs.Panel>
        </Tabs>
      </Stack>
    </Card>
  </Stack>
</Container>
  )
}