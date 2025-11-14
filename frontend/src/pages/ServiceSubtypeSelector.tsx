import { useState } from 'react'
import {
  Container,
  Card,
  Title,
  Text,
  Group,
  Stack,
  Button,
  Badge,
  Radio,
  Alert,
} from '@mantine/core'
import { IconArrowRight, IconArrowLeft, IconAlertCircle } from '@tabler/icons-react'
import { useNavigate, useParams } from 'react-router-dom'

type ServiceSubtype = 'loadBalancer' | 'weighted' | 'mirroring' | 'failover'

export default function ServiceSubtypeSelector() {
  const navigate = useNavigate()
  const { protocol } = useParams<{ protocol: 'http' | 'tcp' | 'udp' }>()
  const [subtype, setSubtype] = useState<ServiceSubtype>('loadBalancer')

  if (!protocol) {
    return (
      <Container size="md">
        <Alert icon={<IconAlertCircle />} color="red">
          Invalid protocol. Please go back and select a protocol.
        </Alert>
      </Container>
    )
  }

  // Define available subtypes based on protocol
  const subtypeOptions = {
    http: [
      {
        value: 'loadBalancer',
        label: 'Load Balancer',
        description: 'Distribute requests across multiple backend servers using round-robin',
        features: ['Round-robin distribution', 'Health checks', 'Sticky sessions', 'Pass host header']
      },
      {
        value: 'weighted',
        label: 'Weighted Round Robin',
        description: 'Distribute requests between services based on assigned weights',
        features: ['Weight-based distribution', 'Service references', 'Sticky sessions']
      },
      {
        value: 'mirroring',
        label: 'Mirroring',
        description: 'Duplicate requests to additional services for testing or monitoring',
        features: ['Request duplication', 'Percentage control', 'Primary + mirror services']
      },
      {
        value: 'failover',
        label: 'Failover',
        description: 'Redirect traffic to a backup service when primary is unavailable',
        features: ['Primary service', 'Fallback service', 'Health checks']
      }
    ],
    tcp: [
      {
        value: 'loadBalancer',
        label: 'Load Balancer',
        description: 'Distribute TCP connections across multiple backend servers',
        features: ['Round-robin distribution', 'TCP health checks', 'TLS support', 'Server transport']
      },
      {
        value: 'weighted',
        label: 'Weighted Round Robin',
        description: 'Distribute TCP connections between services based on assigned weights',
        features: ['Weight-based distribution', 'Service references']
      }
    ],
    udp: [
      {
        value: 'loadBalancer',
        label: 'Load Balancer',
        description: 'Distribute UDP traffic across multiple backend servers',
        features: ['Round-robin distribution', 'Simple UDP routing']
      }
    ]
  }

  const options = subtypeOptions[protocol] || []
  const selectedOption = options.find(opt => opt.value === subtype)

  return (
    <Container size="md">
      <Stack gap="lg">
        <Group justify="space-between">
          <div>
            <Title order={2}>Select Service Type</Title>
            <Text c="dimmed" size="sm" mt="xs">
              Choose how you want to configure your {protocol.toUpperCase()} service
            </Text>
          </div>
          <Button variant="subtle" leftSection={<IconArrowLeft size={16} />} onClick={() => navigate('/services/new')}>
            Back
          </Button>
        </Group>

        <Card shadow="sm" radius="md" withBorder>
          <Stack gap="md">
            <Radio.Group value={subtype} onChange={(value) => setSubtype(value as ServiceSubtype)}>
              <Stack gap="xs">
                {options.map((option) => (
                  <Card
                    key={option.value}
                    padding="md"
                    radius="sm"
                    withBorder
                    style={{
                      cursor: 'pointer',
                      borderColor: subtype === option.value ? 'var(--mantine-color-blue-6)' : undefined,
                      backgroundColor: subtype === option.value ? 'var(--mantine-color-blue-0)' : undefined,
                    }}
                    onClick={() => setSubtype(option.value as ServiceSubtype)}
                  >
                    <Group wrap="nowrap" align="flex-start">
                      <Radio value={option.value} style={{ marginTop: 2 }} />
                      <Stack gap="xs" style={{ flex: 1 }}>
                        <div>
                          <Text fw={600}>{option.label}</Text>
                          <Text size="sm" c="dimmed">{option.description}</Text>
                        </div>
                        <Group gap="xs">
                          {option.features.map((feature, idx) => (
                            <Badge key={idx} variant="light" size="sm">
                              {feature}
                            </Badge>
                          ))}
                        </Group>
                      </Stack>
                    </Group>
                  </Card>
                ))}
              </Stack>
            </Radio.Group>
          </Stack>
        </Card>

        <Alert icon={<IconAlertCircle />} color="blue" variant="light">
          <Text size="sm" fw={500} mb="xs">About {selectedOption?.label}</Text>
          <Text size="sm">{selectedOption?.description}</Text>
        </Alert>

        <Group justify="space-between">
          <Button variant="default" onClick={() => navigate('/services/new')}>
            Cancel
          </Button>
          <Button
            rightSection={<IconArrowRight size={16} />}
            onClick={() => navigate(`/services/new/${protocol}/${subtype}`)}
          >
            Continue
          </Button>
        </Group>
      </Stack>
    </Container>
  )
}
