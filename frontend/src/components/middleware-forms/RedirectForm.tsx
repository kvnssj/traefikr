import { TextInput, Switch, Stack, Select, Text, Paper } from '@mantine/core'

interface RedirectFormProps {
  config: any
  onChange: (config: any) => void
  type: 'redirectScheme' | 'redirectRegex'
}

export function RedirectForm({ config, onChange, type }: RedirectFormProps) {
  if (type === 'redirectScheme') {
    return (
      <Stack>
        <Paper p="md" radius="sm" withBorder>
          <Text fw={500} mb="sm">Redirect Scheme Configuration</Text>
          <Stack gap="sm">
            <Select
              label="Scheme"
              placeholder="Select scheme"
              value={config.scheme || 'https'}
              onChange={(value) => onChange({ ...config, scheme: value })}
              data={[
                { value: 'http', label: 'HTTP' },
                { value: 'https', label: 'HTTPS' },
              ]}
              required
            />

            <TextInput
              label="Port"
              placeholder="443"
              value={config.port || ''}
              onChange={(e) => onChange({ ...config, port: e.target.value })}
              description="Target port (optional)"
            />

            <Switch
              label="Permanent Redirect"
              checked={config.permanent || false}
              onChange={(e) => onChange({ ...config, permanent: e.currentTarget.checked })}
              description="Use 301 (permanent) instead of 302 (temporary)"
            />
          </Stack>
        </Paper>
      </Stack>
    )
  }

  // redirectRegex
  return (
    <Stack>
      <Paper p="md" radius="sm" withBorder>
        <Text fw={500} mb="sm">Redirect Regex Configuration</Text>
        <Stack gap="sm">
          <TextInput
            label="Regex Pattern"
            placeholder="^http://(?:www\.)?(.+)"
            value={config.regex || ''}
            onChange={(e) => onChange({ ...config, regex: e.target.value })}
            description="Regular expression to match"
            required
          />

          <TextInput
            label="Replacement"
            placeholder="https://www.${1}"
            value={config.replacement || ''}
            onChange={(e) => onChange({ ...config, replacement: e.target.value })}
            description="Replacement pattern (can use capture groups)"
            required
          />

          <Switch
            label="Permanent Redirect"
            checked={config.permanent || false}
            onChange={(e) => onChange({ ...config, permanent: e.currentTarget.checked })}
            description="Use 301 (permanent) instead of 302 (temporary)"
          />
        </Stack>
      </Paper>
    </Stack>
  )
}