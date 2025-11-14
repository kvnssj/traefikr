import { NumberInput, TextInput, Stack, Text, Textarea, Tabs, Switch } from '@mantine/core'
import { IconClock, IconFingerprint } from '@tabler/icons-react'

interface RateLimitFormProps {
  config: any
  onChange: (config: any) => void
}

export function RateLimitForm({ config, onChange }: RateLimitFormProps) {
  return (
    <Tabs defaultValue="limits">
      <Tabs.List>
        <Tabs.Tab value="limits" leftSection={<IconClock size={16} />}>
          Rate Limits
        </Tabs.Tab>
        <Tabs.Tab value="source" leftSection={<IconFingerprint size={16} />}>
          Source Criterion
        </Tabs.Tab>
      </Tabs.List>

      <Tabs.Panel value="limits" pt="lg">
        <Stack gap="sm">
          <NumberInput
            label="Average"
            placeholder="100"
            value={config.average || 0}
            onChange={(value) => onChange({ ...config, average: value })}
            description="Maximum average rate (requests per second)"
            min={0}
            required
          />

          <NumberInput
            label="Burst"
            placeholder="50"
            value={config.burst || 0}
            onChange={(value) => onChange({ ...config, burst: value })}
            description="Maximum burst size"
            min={0}
          />

          <TextInput
            label="Period"
            placeholder="1s"
            value={config.period || ''}
            onChange={(e) => onChange({ ...config, period: e.target.value })}
            description="Time period for rate calculation (e.g., 1s, 1m, 1h)"
          />

          <Text size="xs" c="dimmed">
            Rate limiting helps protect your services from abuse by limiting the number of requests from a single source
          </Text>
        </Stack>
      </Tabs.Panel>

      <Tabs.Panel value="source" pt="lg">
        <Stack gap="sm">
          <TextInput
            label="IP Strategy Depth"
            type="number"
            placeholder="0"
            value={config.sourceCriterion?.ipStrategy?.depth || ''}
            onChange={(e) => onChange({
              ...config,
              sourceCriterion: {
                ...config.sourceCriterion,
                ipStrategy: {
                  ...config.sourceCriterion?.ipStrategy,
                  depth: parseInt(e.target.value) || 0
                }
              }
            })}
            description="Depth for IP extraction from X-Forwarded-For"
          />

          <Textarea
            label="Excluded IPs"
            placeholder="127.0.0.1/32&#10;192.168.1.0/24"
            value={config.sourceCriterion?.ipStrategy?.excludedIPs?.join('\n') || ''}
            onChange={(e) => onChange({
              ...config,
              sourceCriterion: {
                ...config.sourceCriterion,
                ipStrategy: {
                  ...config.sourceCriterion?.ipStrategy,
                  excludedIPs: e.target.value.split('\n').filter(Boolean)
                }
              }
            })}
            description="One IP or CIDR per line"
            rows={3}
          />

          <TextInput
            label="Request Header Name"
            placeholder="X-Real-IP"
            value={config.sourceCriterion?.requestHeaderName || ''}
            onChange={(e) => onChange({
              ...config,
              sourceCriterion: {
                ...config.sourceCriterion,
                requestHeaderName: e.target.value
              }
            })}
            description="Use header value as source for rate limiting"
          />

          <Switch
            label="Request Host"
            checked={config.sourceCriterion?.requestHost || false}
            onChange={(e) => onChange({
              ...config,
              sourceCriterion: {
                ...config.sourceCriterion,
                requestHost: e.currentTarget.checked
              }
            })}
            description="Use request host as source criterion"
          />

          <Text size="xs" c="dimmed">
            Configure how to identify the source of requests for rate limiting purposes
          </Text>
        </Stack>
      </Tabs.Panel>
    </Tabs>
  )
}