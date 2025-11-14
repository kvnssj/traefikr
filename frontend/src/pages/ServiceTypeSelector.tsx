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
import { IconServer, IconNetwork, IconWifi, IconArrowRight } from '@tabler/icons-react'
import { useNavigate } from 'react-router-dom'

type ServiceProtocol = 'http' | 'tcp' | 'udp'

export default function ServiceTypeSelector() {
  const navigate = useNavigate()
  const [protocol, setProtocol] = useState<ServiceProtocol>('http')

  const protocolInfo = {
    http: {
      icon: <IconServer size={20} />,
      title: 'HTTP Service',
      description: 'Load balance HTTP/HTTPS traffic across backend servers',
      color: 'blue',
      features: ['Load balancing', 'Weighted distribution', 'Health checks', 'Sticky sessions', 'Mirroring', 'Failover']
    },
    tcp: {
      icon: <IconNetwork size={20} />,
      title: 'TCP Service',
      description: 'Load balance raw TCP traffic across backend servers',
      color: 'green',
      features: ['Load balancing', 'Weighted distribution', 'TCP health checks', 'TLS support']
    },
    udp: {
      icon: <IconWifi size={20} />,
      title: 'UDP Service',
      description: 'Load balance UDP traffic across backend servers',
      color: 'orange',
      features: ['Load balancing', 'Simple round-robin', 'Connectionless routing']
    }
  }

  const info = protocolInfo[protocol]

  return (
    <Container size="xl">
      <Stack gap="lg">
        <Group justify="space-between">
          <div>
            <Title order={2}>Create New Service</Title>
            <Text c="dimmed" size="sm" mt="xs">
              Choose the protocol for your service
            </Text>
          </div>
          <Button variant="subtle" onClick={() => navigate('/services')}>
            Back to Services
          </Button>
        </Group>

        <Card shadow="sm" radius="md" withBorder>
          <Card.Section withBorder inheritPadding py="xs">
            <Group justify="space-between">
              <Text fw={500}>Service Protocol</Text>
              <SegmentedControl
                value={protocol}
                onChange={(value) => setProtocol(value as ServiceProtocol)}
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
            onClick={() => navigate(`/services/new/${protocol}/select-type`)}
          >
            Continue
          </Button>
        </Group>
      </Stack>
    </Container>
  )
}
