import { TextInput, Stack, Paper, Text } from '@mantine/core'

interface PathFormProps {
  config: any
  onChange: (config: any) => void
  type: 'addPrefix' | 'stripPrefix' | 'stripPrefixRegex' | 'replacePath' | 'replacePathRegex'
}

export function PathForm({ config, onChange, type }: PathFormProps) {
  switch (type) {
    case 'addPrefix':
      return (
        <Stack>
          <Paper p="md" radius="sm" withBorder>
            <Text fw={500} mb="sm">Add Prefix Configuration</Text>
            <TextInput
              label="Prefix"
              placeholder="/api"
              value={config.prefix || ''}
              onChange={(e) => onChange({ ...config, prefix: e.target.value })}
              description="Prefix to add to the path"
              required
            />
          </Paper>
        </Stack>
      )

    case 'stripPrefix':
      return (
        <Stack>
          <Paper p="md" radius="sm" withBorder>
            <Text fw={500} mb="sm">Strip Prefix Configuration</Text>
            <TextInput
              label="Prefixes"
              placeholder="/api, /v1"
              value={config.prefixes?.join(', ') || ''}
              onChange={(e) => onChange({ 
                ...config, 
                prefixes: e.target.value.split(',').map(s => s.trim()).filter(Boolean)
              })}
              description="Comma-separated list of prefixes to remove"
              required
            />
          </Paper>
        </Stack>
      )

    case 'stripPrefixRegex':
      return (
        <Stack>
          <Paper p="md" radius="sm" withBorder>
            <Text fw={500} mb="sm">Strip Prefix Regex Configuration</Text>
            <TextInput
              label="Regex Pattern"
              placeholder="^/api/v[0-9]+"
              value={config.regex?.join(', ') || ''}
              onChange={(e) => onChange({ 
                ...config, 
                regex: e.target.value.split(',').map(s => s.trim()).filter(Boolean)
              })}
              description="Comma-separated list of regex patterns to match and remove"
              required
            />
          </Paper>
        </Stack>
      )

    case 'replacePath':
      return (
        <Stack>
          <Paper p="md" radius="sm" withBorder>
            <Text fw={500} mb="sm">Replace Path Configuration</Text>
            <TextInput
              label="Path"
              placeholder="/new-path"
              value={config.path || ''}
              onChange={(e) => onChange({ ...config, path: e.target.value })}
              description="New path to replace the entire path"
              required
            />
          </Paper>
        </Stack>
      )

    case 'replacePathRegex':
      return (
        <Stack>
          <Paper p="md" radius="sm" withBorder>
            <Text fw={500} mb="sm">Replace Path Regex Configuration</Text>
            <Stack gap="sm">
              <TextInput
                label="Regex Pattern"
                placeholder="^/api/(.+)/(.+)"
                value={config.regex || ''}
                onChange={(e) => onChange({ ...config, regex: e.target.value })}
                description="Regular expression to match"
                required
              />
              <TextInput
                label="Replacement"
                placeholder="/v2/${1}/${2}"
                value={config.replacement || ''}
                onChange={(e) => onChange({ ...config, replacement: e.target.value })}
                description="Replacement pattern (can use capture groups)"
                required
              />
            </Stack>
          </Paper>
        </Stack>
      )

    default:
      return null
  }
}