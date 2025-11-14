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
import { IconShield, IconRouter, IconNetwork, IconArrowRight } from '@tabler/icons-react'
import { useNavigate } from 'react-router-dom'

type Protocol = 'http' | 'tcp'

export default function MiddlewareProtocolSelector() {
  const navigate = useNavigate()
  const [protocol, setProtocol] = useState<Protocol>('http')

  const protocolInfo = {
    http: {
      icon: <IconRouter size={20} />,
      title: 'HTTP Middleware',
      description: 'Middleware for HTTP/HTTPS traffic processing',
      color: 'blue',
      features: ['Authentication', 'Rate Limiting', 'Headers', 'Path Modification', 'Compression', 'CORS']
    },
    tcp: {
      icon: <IconNetwork size={20} />,
      title: 'TCP Middleware',
      description: 'Middleware for raw TCP traffic processing',
      color: 'green',
      features: ['IP Allow List', 'InFlight Requests']
    }
  }

  const info = protocolInfo[protocol]

  return (
    <Container size="xl">
      <Stack gap="lg">
        <Group justify="space-between">
          <div>
            <Title order={2}>Create New Middleware</Title>
            <Text c="dimmed" size="sm" mt="xs">
              Choose the protocol for your middleware
            </Text>
          </div>
          <Button variant="subtle" onClick={() => navigate('/middlewares')}>
            Back to Middlewares
          </Button>
        </Group>

        <Card shadow="sm" radius="md" withBorder>
          <Card.Section withBorder inheritPadding py="xs">
            <Group justify="space-between">
              <Text fw={500}>Middleware Protocol</Text>
              <SegmentedControl
                value={protocol}
                onChange={(value) => setProtocol(value as Protocol)}
                data={[
                  { label: 'HTTP', value: 'http' },
                  { label: 'TCP', value: 'tcp' }
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
            onClick={() => navigate(`/middlewares/new/${protocol}`)}
          >
            Continue
          </Button>
        </Group>
      </Stack>
    </Container>
  )
}
