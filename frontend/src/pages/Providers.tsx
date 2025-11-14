import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { 
  Card, 
  Title, 
  Text, 
  Badge, 
  SimpleGrid, 
  Stack, 
  Group, 
  Loader, 
  Center,
  ThemeIcon,
  Button,
  Divider,
  Paper,
  RingProgress,
  Container
} from '@mantine/core'
import { 
  IconServer,
  IconBrandDocker,
  IconFileCode,
  IconSettings,
  IconCheck,
  IconX,
  IconAlertCircle,
  IconRefresh
} from '@tabler/icons-react'
import { providersApi } from '@/lib/api'

const providerInfo = {
  file: {
    name: 'HTTP Provider',
    description: 'Manages configuration through SQLite database and serves via HTTP endpoint',
    icon: IconFileCode,
    color: 'blue',
  },
  docker: {
    name: 'Docker Provider',
    description: 'Discovers services from Docker containers using labels',
    icon: IconBrandDocker,
    color: 'cyan',
  },
  docker_swarm: {
    name: 'Docker Swarm Provider',
    description: 'Manages services in Docker Swarm mode with orchestration',
    icon: IconServer,
    color: 'indigo',
  },
}

export default function Providers() {
  const navigate = useNavigate()
  const { data: providers, isLoading, refetch } = useQuery({
    queryKey: ['providers'],
    queryFn: async () => {
      const response = await providersApi.list()
      return response.data
    },
  })

  if (isLoading) {
    return (
      <Center h={400}>
        <Loader size="lg" />
      </Center>
    )
  }

  const getPrimaryResourceCount = (itemCount?: Record<string, number>) => {
    if (!itemCount) return 0
    // Sum up all routers, services, and middlewares across protocols
    let total = 0
    for (const [key, value] of Object.entries(itemCount)) {
      if (key.includes('routers') || key.includes('services') || key.includes('middlewares')) {
        total += value
      }
    }
    return total
  }
  
  const getResourceBreakdown = (itemCount?: Record<string, number>) => {
    if (!itemCount) return { routers: {}, services: {}, middlewares: {} }
    
    const breakdown = {
      routers: { http: 0, tcp: 0, udp: 0 },
      services: { http: 0, tcp: 0, udp: 0 },
      middlewares: { http: 0, tcp: 0 }
    }
    
    for (const [key, value] of Object.entries(itemCount)) {
      if (key === 'http_routers') breakdown.routers.http = value
      else if (key === 'tcp_routers') breakdown.routers.tcp = value
      else if (key === 'udp_routers') breakdown.routers.udp = value
      else if (key === 'http_services') breakdown.services.http = value
      else if (key === 'tcp_services') breakdown.services.tcp = value
      else if (key === 'udp_services') breakdown.services.udp = value
      else if (key === 'http_middlewares') breakdown.middlewares.http = value
      else if (key === 'tcp_middlewares') breakdown.middlewares.tcp = value
    }
    
    return breakdown
  }

  return (
    <Container size="xl">
      <Stack gap="xl">
        <div>
          <Group justify="space-between" mb="md">
            <div>
              <Title order={2}>Providers</Title>
              <Text c="dimmed" size="sm">Configure and monitor Traefik configuration providers</Text>
            </div>
            <Button 
              leftSection={<IconRefresh size={16} />}
              variant="light"
              onClick={() => refetch()}
            >
              Refresh
            </Button>
          </Group>
        </div>

        <SimpleGrid cols={{ base: 1, md: 2, xl: 3 }} spacing="lg">
          {providers?.map((provider) => {
            const info = providerInfo[provider.type as keyof typeof providerInfo]
            const Icon = info?.icon || IconServer
            const primaryResourceCount = getPrimaryResourceCount(provider.itemCount)
            const breakdown = getResourceBreakdown(provider.itemCount)
            
            return (
              <Card key={provider.type} shadow="sm" radius="md" withBorder>
                <Card.Section p="lg" pb="xs">
                  <Group justify="space-between" align="flex-start">
                    <Group>
                      <ThemeIcon size="xl" radius="md" color={info?.color || 'gray'} variant="light">
                        <Icon size={28} stroke={1.5} />
                      </ThemeIcon>
                      <div>
                        <Text fw={600} size="lg">{info?.name || provider.type}</Text>
                        <Badge 
                          size="sm"
                          variant="dot"
                          color={
                            provider.status === 'healthy' ? 'green' : 
                            provider.status === 'error' ? 'red' : 'yellow'
                          }
                        >
                          {provider.status}
                        </Badge>
                      </div>
                    </Group>
                    
                    {provider.enabled && primaryResourceCount > 0 && (
                      <RingProgress
                        size={60}
                        thickness={6}
                        roundCaps
                        sections={[
                          { value: 100, color: info?.color || 'blue' }
                        ]}
                        label={
                          <Text size="xs" ta="center" fw={700}>
                            {primaryResourceCount}
                          </Text>
                        }
                      />
                    )}
                  </Group>
                </Card.Section>

                <Card.Section p="lg" pt="xs">
                  <Stack gap="md">
                    <Text size="sm" c="dimmed">
                      {info?.description || 'Provider for Traefik configuration'}
                    </Text>

                    {provider.message && (
                      <>
                        <Divider />
                        <Group gap="xs">
                          {provider.status === 'error' ? (
                            <IconAlertCircle size={16} color="var(--mantine-color-red-6)" />
                          ) : (
                            <IconAlertCircle size={16} color="var(--mantine-color-yellow-6)" />
                          )}
                          <Text size="sm" c={provider.status === 'error' ? 'red' : 'yellow'}>
                            {provider.message}
                          </Text>
                        </Group>
                      </>
                    )}

                    {provider.enabled && provider.itemCount && Object.keys(provider.itemCount).length > 0 && (
                      <>
                        <Divider />
                        <Stack gap="xs">
                          <Text size="xs" fw={600} tt="uppercase" c="dimmed">Resources</Text>
                          
                          {/* Routers breakdown */}
                          <Paper p="xs" radius="sm" bg="gray.0">
                            <Stack gap={4}>
                              <Text size="xs" fw={500}>Routers</Text>
                              <Group gap="xs">
                                {breakdown.routers.http > 0 && (
                                  <Badge variant="filled" size="sm" color="blue">
                                    HTTP: {breakdown.routers.http}
                                  </Badge>
                                )}
                                {breakdown.routers.tcp > 0 && (
                                  <Badge variant="filled" size="sm" color="green">
                                    TCP: {breakdown.routers.tcp}
                                  </Badge>
                                )}
                                {breakdown.routers.udp > 0 && (
                                  <Badge variant="filled" size="sm" color="orange">
                                    UDP: {breakdown.routers.udp}
                                  </Badge>
                                )}
                                {(breakdown.routers.http + breakdown.routers.tcp + breakdown.routers.udp) === 0 && (
                                  <Text size="xs" c="dimmed">None</Text>
                                )}
                              </Group>
                            </Stack>
                          </Paper>
                          
                          {/* Services breakdown */}
                          <Paper p="xs" radius="sm" bg="gray.0">
                            <Stack gap={4}>
                              <Text size="xs" fw={500}>Services</Text>
                              <Group gap="xs">
                                {breakdown.services.http > 0 && (
                                  <Badge variant="filled" size="sm" color="blue">
                                    HTTP: {breakdown.services.http}
                                  </Badge>
                                )}
                                {breakdown.services.tcp > 0 && (
                                  <Badge variant="filled" size="sm" color="green">
                                    TCP: {breakdown.services.tcp}
                                  </Badge>
                                )}
                                {breakdown.services.udp > 0 && (
                                  <Badge variant="filled" size="sm" color="orange">
                                    UDP: {breakdown.services.udp}
                                  </Badge>
                                )}
                                {(breakdown.services.http + breakdown.services.tcp + breakdown.services.udp) === 0 && (
                                  <Text size="xs" c="dimmed">None</Text>
                                )}
                              </Group>
                            </Stack>
                          </Paper>
                          
                          {/* Middlewares breakdown */}
                          <Paper p="xs" radius="sm" bg="gray.0">
                            <Stack gap={4}>
                              <Text size="xs" fw={500}>Middlewares</Text>
                              <Group gap="xs">
                                {breakdown.middlewares.http > 0 && (
                                  <Badge variant="filled" size="sm" color="blue">
                                    HTTP: {breakdown.middlewares.http}
                                  </Badge>
                                )}
                                {breakdown.middlewares.tcp > 0 && (
                                  <Badge variant="filled" size="sm" color="green">
                                    TCP: {breakdown.middlewares.tcp}
                                  </Badge>
                                )}
                                {(breakdown.middlewares.http + breakdown.middlewares.tcp) === 0 && (
                                  <Text size="xs" c="dimmed">None</Text>
                                )}
                              </Group>
                            </Stack>
                          </Paper>
                          
                          {/* Additional provider-specific stats */}
                          {Object.entries(provider.itemCount).filter(([key]) => 
                            !key.includes('routers') && !key.includes('services') && !key.includes('middlewares')
                          ).length > 0 && (
                            <>
                              <Text size="xs" c="dimmed">Additional Info</Text>
                              <SimpleGrid cols={2} spacing="xs">
                                {Object.entries(provider.itemCount)
                                  .filter(([key]) => !key.includes('routers') && !key.includes('services') && !key.includes('middlewares'))
                                  .map(([key, value]) => (
                                    <Paper key={key} p="xs" radius="sm" bg="gray.0">
                                      <Group justify="space-between">
                                        <Text size="xs" c="dimmed" tt="capitalize">
                                          {key.replace(/_/g, ' ')}
                                        </Text>
                                        <Badge variant="light" size="sm" color={info?.color || 'blue'}>
                                          {value}
                                        </Badge>
                                      </Group>
                                    </Paper>
                                  ))}
                              </SimpleGrid>
                            </>
                          )}
                        </Stack>
                      </>
                    )}

                    <Divider />
                    
                    <Group justify="space-between" align="center">
                      <Group gap="xs">
                        {provider.enabled ? (
                          <Badge leftSection={<IconCheck size={12} />} color="green" variant="light">
                            Enabled
                          </Badge>
                        ) : (
                          <Badge leftSection={<IconX size={12} />} color="gray" variant="light">
                            Disabled
                          </Badge>
                        )}
                      </Group>
                      
                      <Button
                        size="xs"
                        variant="light"
                        leftSection={<IconSettings size={14} />}
                        disabled={!provider.enabled || provider.type !== 'file'}
                        onClick={() => {
                          if (provider.type === 'file') {
                            navigate('/providers/http/configure')
                          }
                        }}
                      >
                        Configure
                      </Button>
                    </Group>
                  </Stack>
                </Card.Section>
              </Card>
            )
          })}
        </SimpleGrid>

        {(!providers || providers.length === 0) && (
          <Center h={200}>
            <Stack align="center">
              <ThemeIcon size="xl" radius="xl" color="gray" variant="light">
                <IconAlertCircle size={28} />
              </ThemeIcon>
              <Text c="dimmed">No providers configured</Text>
            </Stack>
          </Center>
        )}
      </Stack>
    </Container>
  )
}