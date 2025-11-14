import { NumberInput, TextInput, Stack, Paper, Text } from '@mantine/core'

interface RetryFormProps {
  config: any
  onChange: (config: any) => void
}

export function RetryForm({ config, onChange }: RetryFormProps) {
  return (
    <Stack>
      <Paper p="md" radius="sm" withBorder>
        <Text fw={500} mb="sm">Retry Configuration</Text>
        <Stack gap="sm">
          <NumberInput
            label="Attempts"
            placeholder="4"
            value={config.attempts || 4}
            onChange={(value) => onChange({ ...config, attempts: value })}
            description="Number of retry attempts"
            min={1}
            required
          />

          <TextInput
            label="Initial Interval"
            placeholder="100ms"
            value={config.initialInterval || '100ms'}
            onChange={(e) => onChange({ ...config, initialInterval: e.target.value })}
            description="Time to wait between retries"
          />
        </Stack>
      </Paper>
    </Stack>
  )
}