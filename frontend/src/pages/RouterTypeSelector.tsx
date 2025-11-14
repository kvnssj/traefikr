import { useState } from 'react'
import {
  Container,
  Card,
  Title,
  Text,
  Group,
  Stack,
  SegmentedControl,
  Button,
  Badge,
  Box
} from '@mantine/core'
import { IconRouter, IconNetwork, IconWifi, IconArrowRight } from '@tabler/icons-react'
import { useNavigate } from 'react-router-dom'

type RouterType = 'http' | 'tcp' | 'udp'

export default function RouterTypeSelector() {
  const navigate = useNavigate()
  const [routerType, setRouterType] = useState<RouterType>('http')
  
  const routerInfo = {
    http: {
      icon: <IconRouter size={20} />,
      title: 'HTTP Router',
      description: 'Routes HTTP/HTTPS traffic based on host, path, headers, and more',
      color: 'blue',
      features: ['Host-based routing', 'Path matching', 'Header rules', 'Method filtering', 'TLS termination', 'Middleware support']
    },
    tcp: {
      icon: <IconNetwork size={20} />,
      title: 'TCP Router',
      description: 'Routes raw TCP traffic based on SNI or client IP',
      color: 'green',
      features: ['SNI-based routing', 'Client IP filtering', 'TLS passthrough', 'TCP middleware support']
    },
    udp: {
      icon: <IconWifi size={20} />,
      title: 'UDP Router',
      description: 'Routes UDP traffic to services',
      color: 'orange',
      features: ['Simple UDP routing', 'Entry point binding', 'Service connection']
    }
  }

  const info = routerInfo[routerType]

  return (
    <Container size="xl">
      <Stack gap="lg">
        <Group justify="space-between">
          <div>
            <Title order={2}>Create New Router</Title>
            <Text c="dimmed" size="sm" mt="xs">
              Choose the type of router you want to create
            </Text>
          </div>
          <Button variant="subtle" onClick={() => navigate('/routers')}>
            Back to Routers
          </Button>
        </Group>

        <Card shadow="sm" radius="md" withBorder>
          <Card.Section withBorder inheritPadding py="xs">
            <Group justify="space-between">
              <Text fw={500}>Router Type</Text>
              <SegmentedControl
                value={routerType}
                onChange={(value) => setRouterType(value as RouterType)}
                data={[
                  { label: 'HTTP', value: 'http' },
                  { label: 'TCP', value: 'tcp' },
                  { label: 'UDP', value: 'udp' }
                ]}
              />
            </Group>
          </Card.Section>

          <Card.Section inheritPadding py="md">
            <Group mb="md">
              <Box c={info.color}>{info.icon}</Box>
              <div>
                <Text fw={600}>{info.title}</Text>
                <Text size="sm" c="dimmed">{info.description}</Text>
              </div>
            </Group>

            <Group gap="xs">
              {info.features.map((feature, idx) => (
                <Badge key={idx} variant="light" color={info.color} size="sm">
                  {feature}
                </Badge>
              ))}
            </Group>
          </Card.Section>
        </Card>

        <Group justify="flex-end">
          <Button
            size="md"
            rightSection={<IconArrowRight size={16} />}
            onClick={() => navigate(`/routers/new/${routerType}`)}
          >
            Continue
          </Button>
        </Group>
      </Stack>
    </Container>
  )
}