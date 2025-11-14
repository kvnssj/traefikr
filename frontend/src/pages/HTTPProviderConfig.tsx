import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { 
  Container,
  Title,
  Text,
  Card,
  Switch,
  Stack,
  Group,
  Button,
  Table,
  ActionIcon,
  Badge,
  Modal,
  TextInput,
  Textarea,
  Paper,
  Code,
  Alert,
  Tabs,
  ThemeIcon
} from '@mantine/core'
import { 
  IconKey,
  IconPlus,
  IconEdit,
  IconTrash,
  IconCopy,
  IconArrowLeft,
  IconShield,
  IconInfoCircle,
  IconSettings,
  IconDatabase
} from '@tabler/icons-react'
import { httpProviderApi, APIKey, APIKeyCreateResponse } from '@/lib/api'
import { notifications } from '@mantine/notifications'
import { modals } from '@mantine/modals'
import { useDisclosure } from '@mantine/hooks'

export default function HTTPProviderConfig() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [createModalOpened, { open: openCreateModal, close: closeCreateModal }] = useDisclosure(false)
  const [editingKey, setEditingKey] = useState<APIKey | null>(null)
  const [keyForm, setKeyForm] = useState({ name: '', comment: '' })
  const [newKeyData, setNewKeyData] = useState<APIKeyCreateResponse | null>(null)

  // Queries
  const { data: settings } = useQuery({
    queryKey: ['http-provider-settings'],
    queryFn: async () => {
      const response = await httpProviderApi.getSettings()
      return response.data
    }
  })

  const { data: apiKeys, isLoading: keysLoading } = useQuery({
    queryKey: ['http-provider-keys'],
    queryFn: async () => {
      const response = await httpProviderApi.listKeys()
      return response.data
    }
  })

  // Mutations
  const settingsMutation = useMutation({
    mutationFn: async (enabled: boolean) => {
      await httpProviderApi.updateSettings({ api_auth_enabled: enabled })
    },
    onSuccess: () => {
      notifications.show({
        title: 'Settings updated',
        message: 'HTTP Provider authentication settings have been updated',
        color: 'green'
      })
      queryClient.invalidateQueries({ queryKey: ['http-provider-settings'] })
    },
    onError: (error: any) => {
      notifications.show({
        title: 'Error',
        message: error.response?.data?.detail || 'Failed to update settings',
        color: 'red'
      })
    }
  })

  const createKeyMutation = useMutation({
    mutationFn: async (keyData: { name: string; comment?: string }) => {
      const response = await httpProviderApi.createKey(keyData)
      return response.data
    },
    onSuccess: (data) => {
      setNewKeyData(data)
      notifications.show({
        title: 'API Key created',
        message: 'New API key has been generated',
        color: 'green'
      })
      queryClient.invalidateQueries({ queryKey: ['http-provider-keys'] })
      setKeyForm({ name: '', comment: '' })
    },
    onError: (error: any) => {
      notifications.show({
        title: 'Error',
        message: error.response?.data?.detail || 'Failed to create API key',
        color: 'red'
      })
    }
  })

  const updateKeyMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<APIKey> }) => {
      await httpProviderApi.updateKey(id, data)
    },
    onSuccess: () => {
      notifications.show({
        title: 'API Key updated',
        message: 'API key has been updated successfully',
        color: 'green'
      })
      queryClient.invalidateQueries({ queryKey: ['http-provider-keys'] })
      setEditingKey(null)
    },
    onError: (error: any) => {
      notifications.show({
        title: 'Error',
        message: error.response?.data?.detail || 'Failed to update API key',
        color: 'red'
      })
    }
  })

  const deleteKeyMutation = useMutation({
    mutationFn: async (id: number) => {
      await httpProviderApi.deleteKey(id)
    },
    onSuccess: () => {
      notifications.show({
        title: 'API Key deleted',
        message: 'API key has been deleted successfully',
        color: 'green'
      })
      queryClient.invalidateQueries({ queryKey: ['http-provider-keys'] })
    },
    onError: (error: any) => {
      notifications.show({
        title: 'Error',
        message: error.response?.data?.detail || 'Failed to delete API key',
        color: 'red'
      })
    }
  })

  const handleCreateKey = () => {
    if (!keyForm.name.trim()) return
    createKeyMutation.mutate(keyForm)
    closeCreateModal()
  }

  const handleEditKey = (key: APIKey) => {
    setEditingKey(key)
    setKeyForm({ name: key.name, comment: key.comment || '' })
  }

  const handleUpdateKey = () => {
    if (!editingKey || !keyForm.name.trim()) return
    updateKeyMutation.mutate({
      id: editingKey.id,
      data: { name: keyForm.name, comment: keyForm.comment }
    })
  }

  const handleDeleteKey = (key: APIKey) => {
    modals.openConfirmModal({
      title: 'Delete API Key',
      children: (
        <Text size="sm">
          Are you sure you want to delete the API key "{key.name}"?
          This action cannot be undone and will immediately revoke access.
        </Text>
      ),
      labels: { confirm: 'Delete', cancel: 'Cancel' },
      confirmProps: { color: 'red' },
      onConfirm: () => deleteKeyMutation.mutate(key.id),
    })
  }

  const handleToggleKeyStatus = (key: APIKey) => {
    updateKeyMutation.mutate({
      id: key.id,
      data: { is_active: !key.is_active }
    })
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    notifications.show({
      title: 'Copied',
      message: 'API key copied to clipboard',
      color: 'blue'
    })
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString()
  }

  return (
    <Container size="xl">
      <Stack gap="xl">
        <Group justify="space-between">
          <Group>
            <ActionIcon variant="subtle" onClick={() => navigate('/providers')}>
              <IconArrowLeft size={18} />
            </ActionIcon>
            <div>
              <Title order={2}>HTTP Provider Configuration</Title>
              <Text c="dimmed" size="sm">Manage API authentication and security settings</Text>
            </div>
          </Group>
        </Group>

        <Tabs defaultValue="authentication">
          <Tabs.List>
            <Tabs.Tab value="authentication" leftSection={<IconKey size={16} />}>
              Authentication
            </Tabs.Tab>
            <Tabs.Tab value="info" leftSection={<IconInfoCircle size={16} />}>
              Information
            </Tabs.Tab>
          </Tabs.List>

          <Tabs.Panel value="authentication" pt="md">
            <Stack gap="lg">
              {/* Authentication Toggle */}
              <Card shadow="sm" radius="md" withBorder>
                <Group justify="space-between">
                  <div>
                    <Text fw={600}>API Key Authentication</Text>
                    <Text size="sm" c="dimmed">
                      Require API keys for accessing the config.json endpoint
                    </Text>
                  </div>
                  <Switch
                    checked={settings?.api_auth_enabled || false}
                    onChange={(event) => settingsMutation.mutate(event.currentTarget.checked)}
                    disabled={settingsMutation.isPending}
                  />
                </Group>
              </Card>

              {settings?.api_auth_enabled && (
                <Alert icon={<IconShield size={16} />} title="Authentication Enabled" color="green">
                  API key authentication is enabled. The config.json endpoint will require a valid x-auth-key header.
                </Alert>
              )}

              {/* API Keys Management */}
              <Card shadow="sm" radius="md" withBorder>
                <Card.Section p="lg" pb="xs">
                  <Group justify="space-between">
                    <div>
                      <Text fw={600}>API Keys</Text>
                      <Text size="sm" c="dimmed">
                        Generate and manage API keys for accessing the configuration endpoint
                      </Text>
                    </div>
                    <Button
                      leftSection={<IconPlus size={16} />}
                      onClick={openCreateModal}
                      disabled={!settings?.api_auth_enabled}
                    >
                      Generate Key
                    </Button>
                  </Group>
                </Card.Section>

                <Card.Section>
                  <Table>
                    <Table.Thead>
                      <Table.Tr>
                        <Table.Th>Name</Table.Th>
                        <Table.Th>Status</Table.Th>
                        <Table.Th>Created</Table.Th>
                        <Table.Th>Last Used</Table.Th>
                        <Table.Th>Actions</Table.Th>
                      </Table.Tr>
                    </Table.Thead>
                    <Table.Tbody>
                      {apiKeys?.map((key) => (
                        <Table.Tr key={key.id}>
                          <Table.Td>
                            <div>
                              <Text fw={500}>{key.name}</Text>
                              {key.comment && (
                                <Text size="xs" c="dimmed">{key.comment}</Text>
                              )}
                            </div>
                          </Table.Td>
                          <Table.Td>
                            <Badge
                              color={key.is_active ? 'green' : 'red'}
                              variant="light"
                            >
                              {key.is_active ? 'Active' : 'Inactive'}
                            </Badge>
                          </Table.Td>
                          <Table.Td>
                            <Text size="sm">{formatDate(key.created_at)}</Text>
                          </Table.Td>
                          <Table.Td>
                            <Text size="sm">
                              {key.last_used_at ? formatDate(key.last_used_at) : 'Never'}
                            </Text>
                          </Table.Td>
                          <Table.Td>
                            <Group gap={4}>
                              <ActionIcon
                                variant="subtle"
                                size="sm"
                                onClick={() => handleEditKey(key)}
                              >
                                <IconEdit size={16} />
                              </ActionIcon>
                              <ActionIcon
                                variant="subtle"
                                size="sm"
                                color={key.is_active ? 'orange' : 'green'}
                                onClick={() => handleToggleKeyStatus(key)}
                              >
                                <IconSettings size={16} />
                              </ActionIcon>
                              <ActionIcon
                                variant="subtle"
                                size="sm"
                                color="red"
                                onClick={() => handleDeleteKey(key)}
                              >
                                <IconTrash size={16} />
                              </ActionIcon>
                            </Group>
                          </Table.Td>
                        </Table.Tr>
                      ))}
                    </Table.Tbody>
                  </Table>
                  
                  {(!apiKeys || apiKeys.length === 0) && (
                    <Text p="md" ta="center" c="dimmed">
                      No API keys generated yet
                    </Text>
                  )}
                </Card.Section>
              </Card>
            </Stack>
          </Tabs.Panel>

          <Tabs.Panel value="info" pt="md">
            <Stack gap="lg">
              <Card shadow="sm" radius="md" withBorder>
                <Stack gap="md">
                  <Group>
                    <ThemeIcon size="lg" radius="md" color="blue" variant="light">
                      <IconDatabase size={20} />
                    </ThemeIcon>
                    <div>
                      <Text fw={600}>HTTP Provider</Text>
                      <Text size="sm" c="dimmed">
                        Configuration endpoint for Traefik
                      </Text>
                    </div>
                  </Group>

                  <Text size="sm">
                    The HTTP provider serves dynamic configuration to Traefik through a REST endpoint.
                    When API key authentication is enabled, requests to the config.json endpoint must include
                    the x-auth-key header with a valid API key.
                  </Text>

                  <Paper p="md" radius="md" bg="gray.0">
                    <Stack gap="xs">
                      <Text size="xs" fw={600} tt="uppercase" c="dimmed">Configuration URL</Text>
                      <Code>{window.location.origin.replace(':3000', ':8000')}/api/v1/traefik/config.json</Code>
                    </Stack>
                  </Paper>

                  <Paper p="md" radius="md" bg="gray.0">
                    <Stack gap="xs">
                      <Text size="xs" fw={600} tt="uppercase" c="dimmed">Example Request (with API key)</Text>
                      <Code block>
{`curl -H "x-auth-key: your-api-key-here" \\
     ${window.location.origin.replace(':3000', ':8000')}/api/v1/traefik/config.json`}
                      </Code>
                    </Stack>
                  </Paper>
                </Stack>
              </Card>
            </Stack>
          </Tabs.Panel>
        </Tabs>
      </Stack>

      {/* Create API Key Modal */}
      <Modal
        opened={createModalOpened}
        onClose={() => {
          closeCreateModal()
          setKeyForm({ name: '', comment: '' })
        }}
        title="Generate API Key"
      >
        <Stack gap="md">
          <TextInput
            label="Name"
            placeholder="Enter a descriptive name"
            value={keyForm.name}
            onChange={(e) => setKeyForm({ ...keyForm, name: e.target.value })}
            required
          />
          <Textarea
            label="Comment"
            placeholder="Optional description"
            value={keyForm.comment}
            onChange={(e) => setKeyForm({ ...keyForm, comment: e.target.value })}
          />
          <Button
            onClick={handleCreateKey}
            disabled={!keyForm.name.trim() || createKeyMutation.isPending}
            loading={createKeyMutation.isPending}
          >
            Generate Key
          </Button>
        </Stack>
      </Modal>

      {/* Edit API Key Modal */}
      <Modal
        opened={!!editingKey}
        onClose={() => {
          setEditingKey(null)
          setKeyForm({ name: '', comment: '' })
        }}
        title="Edit API Key"
      >
        <Stack gap="md">
          <TextInput
            label="Name"
            value={keyForm.name}
            onChange={(e) => setKeyForm({ ...keyForm, name: e.target.value })}
            required
          />
          <Textarea
            label="Comment"
            value={keyForm.comment}
            onChange={(e) => setKeyForm({ ...keyForm, comment: e.target.value })}
          />
          <Button
            onClick={handleUpdateKey}
            disabled={!keyForm.name.trim() || updateKeyMutation.isPending}
            loading={updateKeyMutation.isPending}
          >
            Update Key
          </Button>
        </Stack>
      </Modal>

      {/* New Key Generated Modal */}
      <Modal
        opened={!!newKeyData}
        onClose={() => setNewKeyData(null)}
        title="API Key Generated"
        closeOnClickOutside={false}
        closeOnEscape={false}
      >
        <Stack gap="md">
          <Alert icon={<IconInfoCircle size={16} />} title="Important" color="yellow">
            This is the only time the API key will be displayed. Please copy and store it securely.
          </Alert>
          
          <Paper p="md" radius="md" bg="gray.0">
            <Group justify="space-between" align="flex-start">
              <div style={{ flex: 1, minWidth: 0 }}>
                <Text size="xs" fw={600} tt="uppercase" c="dimmed" mb="xs">
                  API Key
                </Text>
                <Code style={{ wordBreak: 'break-all' }}>
                  {newKeyData?.api_key}
                </Code>
              </div>
              <ActionIcon
                variant="light"
                onClick={() => newKeyData && copyToClipboard(newKeyData.api_key)}
              >
                <IconCopy size={16} />
              </ActionIcon>
            </Group>
          </Paper>

          <Button onClick={() => setNewKeyData(null)}>
            I've copied the key safely
          </Button>
        </Stack>
      </Modal>
    </Container>
  )
}