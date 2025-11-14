import { useState, useMemo } from 'react'
import {
  Container,
  Card,
  Title,
  Text,
  Group,
  Stack,
  Button,
  Radio,
  TextInput,
  Alert,
  Loader,
  ScrollArea,
} from '@mantine/core'
import { IconSearch, IconArrowRight, IconAlertCircle } from '@tabler/icons-react'
import { useNavigate, useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { resourcesApi } from '@/lib/api'

export default function MiddlewareTypeSelector() {
  const navigate = useNavigate()
  const { protocol = 'http' } = useParams<{ protocol: string }>()
  const [selectedType, setSelectedType] = useState<string>('')
  const [searchQuery, setSearchQuery] = useState('')

  // Fetch the middleware schema to get available types
  const { data: schema, isLoading, error } = useQuery({
    queryKey: ['schema', protocol, 'middlewares'],
    queryFn: async () => {
      const response = await resourcesApi.getSchema(protocol as any, 'middlewares')
      return response.data
    },
  })

  // Extract middleware types from schema properties
  const middlewareTypes = useMemo(() => {
    if (!schema || !schema.properties) return []

    return Object.entries(schema.properties).map(([key, value]: [string, any]) => ({
      value: key,
      label: value.title || key.replace(/([A-Z])/g, ' $1').replace(/^./, (str: string) => str.toUpperCase()).trim(),
      description: value.description || '',
    }))
  }, [schema])

  // Filter middleware types based on search query
  const filteredTypes = useMemo(() => {
    if (!searchQuery) return middlewareTypes

    const query = searchQuery.toLowerCase()
    return middlewareTypes.filter(type =>
      type.label.toLowerCase().includes(query) ||
      type.value.toLowerCase().includes(query) ||
      type.description.toLowerCase().includes(query)
    )
  }, [middlewareTypes, searchQuery])

  // Auto-select first result if search yields only one
  useMemo(() => {
    if (filteredTypes.length === 1 && searchQuery && !selectedType) {
      setSelectedType(filteredTypes[0].value)
    }
  }, [filteredTypes, searchQuery, selectedType])

  if (isLoading) {
    return (
      <Container size="md">
        <Stack align="center" justify="center" style={{ minHeight: '400px' }}>
          <Loader size="lg" />
          <Text c="dimmed">Loading middleware types...</Text>
        </Stack>
      </Container>
    )
  }

  if (error) {
    return (
      <Container size="md">
        <Alert icon={<IconAlertCircle />} title="Error" color="red">
          Failed to load middleware types. Please try again.
        </Alert>
      </Container>
    )
  }

  return (
    <Container size="md">
      <Stack gap="lg">
        <Group justify="space-between">
          <div>
            <Title order={2}>Create New {protocol.toUpperCase()} Middleware</Title>
            <Text c="dimmed" size="sm" mt="xs">
              Select the type of middleware you want to create
            </Text>
          </div>
          <Button variant="subtle" onClick={() => navigate('/middlewares')}>
            Back to Middlewares
          </Button>
        </Group>

        <Card shadow="sm" radius="md" withBorder>
          <Stack gap="md">
            <TextInput
              placeholder="Search middleware types..."
              leftSection={<IconSearch size={16} />}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.currentTarget.value)}
              size="md"
            />

            <Text size="sm" c="dimmed">
              {filteredTypes.length} middleware type{filteredTypes.length !== 1 ? 's' : ''} available
            </Text>

            <ScrollArea h={400}>
              <Radio.Group value={selectedType} onChange={setSelectedType}>
                <Stack gap="xs">
                  {filteredTypes.length === 0 ? (
                    <Text size="sm" c="dimmed" ta="center" py="xl">
                      No middleware types match your search
                    </Text>
                  ) : (
                    filteredTypes.map((type) => (
                      <Card
                        key={type.value}
                        padding="md"
                        radius="sm"
                        withBorder
                        style={{
                          cursor: 'pointer',
                          borderColor: selectedType === type.value ? 'var(--mantine-color-blue-6)' : undefined,
                          backgroundColor: selectedType === type.value ? 'var(--mantine-color-blue-0)' : undefined,
                        }}
                        onClick={() => setSelectedType(type.value)}
                      >
                        <Group wrap="nowrap" align="flex-start">
                          <Radio value={type.value} style={{ marginTop: 2 }} />
                          <Stack gap={4} style={{ flex: 1 }}>
                            <Text fw={600}>{type.label}</Text>
                            {type.description && (
                              <Text size="sm" c="dimmed">
                                {type.description}
                              </Text>
                            )}
                          </Stack>
                        </Group>
                      </Card>
                    ))
                  )}
                </Stack>
              </Radio.Group>
            </ScrollArea>
          </Stack>
        </Card>

        <Group justify="space-between">
          <Button variant="default" onClick={() => navigate('/middlewares')}>
            Cancel
          </Button>
          <Button
            rightSection={<IconArrowRight size={16} />}
            disabled={!selectedType}
            onClick={() => navigate(`/middlewares/new/${protocol}/${selectedType}`)}
          >
            Continue
          </Button>
        </Group>
      </Stack>
    </Container>
  )
}
