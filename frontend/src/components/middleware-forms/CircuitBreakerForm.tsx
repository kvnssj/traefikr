import { TextInput, Switch, Stack, Paper, Text, NumberInput } from '@mantine/core'

interface CircuitBreakerFormProps {
  config: any
  onChange: (config: any) => void
}

export function CircuitBreakerForm({ config, onChange }: CircuitBreakerFormProps) {
  return (
    <Stack>
      <Paper p="md" radius="sm" withBorder>
        <Text fw={500} mb="sm">Circuit Breaker Configuration</Text>
        <Stack gap="sm">
          <TextInput
            label="Expression"
            placeholder="ResponseCodeRatio(500, 600, 0, 600) > 0.5"
            value={config.expression || ''}
            onChange={(e) => onChange({ ...config, expression: e.target.value })}
            description="Circuit breaker expression"
            required
          />

          <TextInput
            label="Check Period"
            placeholder="100ms"
            value={config.checkPeriod || '100ms'}
            onChange={(e) => onChange({ ...config, checkPeriod: e.target.value })}
            description="Interval for checking circuit state"
          />

          <TextInput
            label="Fallback Duration"
            placeholder="10s"
            value={config.fallbackDuration || '10s'}
            onChange={(e) => onChange({ ...config, fallbackDuration: e.target.value })}
            description="Duration to keep circuit open"
          />

          <TextInput
            label="Recovery Duration"
            placeholder="10s"
            value={config.recoveryDuration || '10s'}
            onChange={(e) => onChange({ ...config, recoveryDuration: e.target.value })}
            description="Duration for recovery state"
          />
        </Stack>
      </Paper>
    </Stack>
  )
}