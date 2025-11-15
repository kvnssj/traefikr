import { useQuery } from '@tanstack/react-query'
import { Card, Title, Text, Group, Stack, SimpleGrid, ThemeIcon, Container } from '@mantine/core'
import { resourcesApi } from '@/lib/api'
import { Network, Server, Shield } from 'lucide-react'

export default function Dashboard() {
  console.log('[DASHBOARD] Render')

  // Fetch HTTP routers
  const { data: httpRouters = [] } = useQuery({
    queryKey: ['resources', 'http', 'routers', true],
    queryFn: async () => {
      const response = await resourcesApi.list('http', 'routers', true)
      return response.data
    },
  })

  // Fetch TCP routers
  const { data: tcpRouters = [] } = useQuery({
    queryKey: ['resources', 'tcp', 'routers', true],
    queryFn: async () => {
      const response = await resourcesApi.list('tcp', 'routers', true)
      return response.data
    },
  })

  // Fetch UDP routers
  const { data: udpRouters = [] } = useQuery({
    queryKey: ['resources', 'udp', 'routers', true],
    queryFn: async () => {
      const response = await resourcesApi.list('udp', 'routers', true)
      return response.data
    },
  })

  // Fetch HTTP services
  const { data: httpServices = [] } = useQuery({
    queryKey: ['resources', 'http', 'services', true],
    queryFn: async () => {
      const response = await resourcesApi.list('http', 'services', true)
      return response.data
    },
  })

  // Fetch TCP services
  const { data: tcpServices = [] } = useQuery({
    queryKey: ['resources', 'tcp', 'services', true],
    queryFn: async () => {
      const response = await resourcesApi.list('tcp', 'services', true)
      return response.data
    },
  })

  // Fetch UDP services
  const { data: udpServices = [] } = useQuery({
    queryKey: ['resources', 'udp', 'services', true],
    queryFn: async () => {
      const response = await resourcesApi.list('udp', 'services', true)
      return response.data
    },
  })

  // Fetch HTTP middlewares
  const { data: httpMiddlewares = [] } = useQuery({
    queryKey: ['resources', 'http', 'middlewares', true],
    queryFn: async () => {
      const response = await resourcesApi.list('http', 'middlewares', true)
      return response.data
    },
  })

  // Fetch TCP middlewares
  const { data: tcpMiddlewares = [] } = useQuery({
    queryKey: ['resources', 'tcp', 'middlewares', true],
    queryFn: async () => {
      const response = await resourcesApi.list('tcp', 'middlewares', true)
      return response.data
    },
  })

  // Combine all resources
  const routers = [...httpRouters, ...tcpRouters, ...udpRouters]
  const services = [...httpServices, ...tcpServices, ...udpServices]
  const middlewares = [...httpMiddlewares, ...tcpMiddlewares]

  const stats = [
    {
      name: 'Routers',
      value: routers?.length || 0,
      icon: Network,
      color: 'blue',
    },
    {
      name: 'Services',
      value: services?.length || 0,
      icon: Server,
      color: 'green',
    },
    {
      name: 'Middlewares',
      value: middlewares?.length || 0,
      icon: Shield,
      color: 'violet',
    },
  ]

  return (
    <Container size="xl">
      <Stack gap="xl">
        <Stack gap="xs">
          <Title order={1}>Dashboard</Title>
          <Text c="dimmed">Overview of your Traefik configuration</Text>
        </Stack>

      <SimpleGrid cols={{ base: 1, sm: 2, lg: 4 }} spacing="lg">
        {stats.map((stat) => {
          const Icon = stat.icon
          return (
            <Card key={stat.name} withBorder p="lg">
              <Group>
                <ThemeIcon size={60} color={stat.color} variant="light">
                  <Icon size={30} />
                </ThemeIcon>
                <Stack gap="xs">
                  <Text size="sm" fw={500} c="dimmed">{stat.name}</Text>
                  <Text size="xl" fw={700}>{stat.value}</Text>
                </Stack>
              </Group>
            </Card>
          )
        })}
      </SimpleGrid>

      <Card withBorder>
          <Card.Section withBorder inheritPadding py="md">
            <Title order={3}>Recent Activity</Title>
          </Card.Section>
          <Card.Section inheritPadding py="md">
            <Stack gap="md">
              <Group>
                <div style={{ width: 8, height: 8, backgroundColor: 'var(--mantine-color-green-6)', borderRadius: '50%' }}></div>
                <Stack gap="xs">
                  <Text size="sm">System started</Text>
                  <Text size="xs" c="dimmed">Just now</Text>
                </Stack>
              </Group>
              {routers?.slice(0, 3).map((router) => (
                <Group key={router.name}>
                  <div style={{ width: 8, height: 8, backgroundColor: 'var(--mantine-color-blue-6)', borderRadius: '50%' }}></div>
                  <Stack gap="xs">
                    <Text size="sm">Router: {router.name}</Text>
                    <Text size="xs" c="dimmed">Rule: {router.config?.rule || '-'}</Text>
                  </Stack>
                </Group>
              ))}
            </Stack>
          </Card.Section>
        </Card>
      </Stack>
    </Container>
  )
}