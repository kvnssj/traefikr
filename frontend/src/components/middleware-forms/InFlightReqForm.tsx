import { NumberInput, Stack, Paper, Text, Textarea } from '@mantine/core'

interface InFlightReqFormProps {
  config: any
  onChange: (config: any) => void
}

export function InFlightReqForm({ config, onChange }: InFlightReqFormProps) {
  return (
    <Stack>
      <Paper p="md" radius="sm" withBorder>
        <Text fw={500} mb="sm">In-Flight Request Limits</Text>
        <Stack gap="sm">
          <NumberInput
            label="Amount"
            placeholder="100"
            value={config.amount || 0}
            onChange={(value) => onChange({ ...config, amount: value })}
            description="Maximum number of concurrent requests"
            min={1}
            required
          />
        </Stack>
      </Paper>

      <Paper p="md" radius="sm" withBorder>
        <Text fw={500} mb="sm">Source Criterion</Text>
        <Stack gap="sm">
          <NumberInput
            label="IP Strategy Depth"
            placeholder="0"
            value={config.sourceCriterion?.ipStrategy?.depth || 0}
            onChange={(value) => onChange({
              ...config,
              sourceCriterion: {
                ...config.sourceCriterion,
                ipStrategy: {
                  ...config.sourceCriterion?.ipStrategy,
                  depth: value
                }
              }
            })}
            description="Depth for IP extraction from X-Forwarded-For"
            min={0}
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

          <Text size="sm" c="dimmed">
            Leave source criterion empty to apply the limit globally
          </Text>
        </Stack>
      </Paper>
    </Stack>
  )
}