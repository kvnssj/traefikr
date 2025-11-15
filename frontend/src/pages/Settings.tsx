import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Card,
  Title,
  Text,
  Stack,
  Group,
  Loader,
  Center,
  ThemeIcon,
  Button,
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
  IconCheck,
  IconAlertCircle,
  IconKey,
  IconPlus,
  IconCopy,
  IconTrash,
  IconInfoCircle
} from '@tabler/icons-react'
import { httpProviderApi } from '@/lib/api'
import { notifications } from '@mantine/notifications'
import { modals } from '@mantine/modals'

export default function Settings() {
  const queryClient = useQueryClient()
  const [createKeyModalOpened, setCreateKeyModalOpened] = useState(false)
  const [newKeyName, setNewKeyName] = useState('')
  const [generatedKey, setGeneratedKey] = useState<string | null>(null)

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

  return (
    <Container size="xl">
      <Stack gap="xl">
        <div>
          <Title order={2}>Settings</Title>
          <Text c="dimmed" size="sm">Manage API keys for securing the /api/config endpoint</Text>
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
                API keys are used by Traefik to poll the /api/config endpoint. Include the key in the x-traefikr-key header.
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
                      <Table.Th>Key Preview</Table.Th>
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
                          <Code>{key.key_preview}</Code>
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