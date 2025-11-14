import { Textarea, NumberInput, Stack, Text, Switch, Tabs } from '@mantine/core'
import { IconNetwork, IconSettings } from '@tabler/icons-react'

interface IPAllowListFormProps {
  config: any
  onChange: (config: any) => void
}

export function IPAllowListForm({ config, onChange }: IPAllowListFormProps) {
  return (
    <Tabs defaultValue="allowlist">
      <Tabs.List>
        <Tabs.Tab value="allowlist" leftSection={<IconNetwork size={16} />}>
          Allow List
        </Tabs.Tab>
        <Tabs.Tab value="strategy" leftSection={<IconSettings size={16} />}>
          IP Strategy
        </Tabs.Tab>
      </Tabs.List>

      <Tabs.Panel value="allowlist" pt="lg">
        <Stack gap="sm">
          <Textarea
            label="Source Range"
            placeholder="127.0.0.1/32&#10;192.168.1.0/24&#10;172.16.0.0/16"
            value={config.sourceRange?.join('\n') || ''}
            onChange={(e) => onChange({
              ...config,
              sourceRange: e.target.value.split('\n').filter(Boolean)
            })}
            description="Allowed IP addresses or CIDR ranges (one per line)"
            rows={5}
            required
          />

          <Switch
            label="Reject Status Code"
            checked={config.rejectStatusCode === 403}
            onChange={(e) => onChange({ 
              ...config, 
              rejectStatusCode: e.currentTarget.checked ? 403 : undefined 
            })}
            description="Return 403 instead of dropping connection"
          />

          <Text size="xs" c="dimmed">
            Only requests from the specified IP addresses will be allowed through
          </Text>
        </Stack>
      </Tabs.Panel>

      <Tabs.Panel value="strategy" pt="lg">
        <Stack gap="sm">
          <NumberInput
            label="Depth"
            placeholder="0"
            value={config.ipStrategy?.depth || 0}
            onChange={(value) => onChange({
              ...config,
              ipStrategy: {
                ...config.ipStrategy,
                depth: value
              }
            })}
            description="Position in X-Forwarded-For header (0 = use remote address)"
            min={0}
          />

          <Textarea
            label="Excluded IPs"
            placeholder="127.0.0.1/32&#10;10.0.0.0/8"
            value={config.ipStrategy?.excludedIPs?.join('\n') || ''}
            onChange={(e) => onChange({
              ...config,
              ipStrategy: {
                ...config.ipStrategy,
                excludedIPs: e.target.value.split('\n').filter(Boolean)
              }
            })}
            description="IPs to exclude from X-Forwarded-For (one per line)"
            rows={3}
          />

          <Text size="xs" c="dimmed">
            Configure how to extract the client IP address from request headers
          </Text>
        </Stack>
      </Tabs.Panel>
    </Tabs>
  )
}