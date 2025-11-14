import { NumberInput, Textarea, Stack, Paper, Text, Switch } from '@mantine/core'

interface CompressFormProps {
  config: any
  onChange: (config: any) => void
}

export function CompressForm({ config, onChange }: CompressFormProps) {
  return (
    <Stack>
      <Paper p="md" radius="sm" withBorder>
        <Text fw={500} mb="sm">Compress Configuration</Text>
        <Stack gap="sm">
          <Textarea
            label="Excluded Content Types"
            placeholder="text/event-stream&#10;application/octet-stream"
            value={config.excludedContentTypes?.join('\n') || ''}
            onChange={(e) => onChange({
              ...config,
              excludedContentTypes: e.target.value.split('\n').filter(Boolean)
            })}
            description="Content types to exclude from compression (one per line)"
            rows={3}
          />

          <NumberInput
            label="Minimum Response Body Bytes"
            placeholder="1024"
            value={config.minResponseBodyBytes || 1024}
            onChange={(value) => onChange({ ...config, minResponseBodyBytes: value })}
            description="Minimum size in bytes for compression to be applied"
            min={0}
          />

          <Switch
            label="Enable Brotli Compression"
            checked={config.brotli !== false}
            onChange={(e) => onChange({ ...config, brotli: e.currentTarget.checked })}
            description="Enable Brotli compression algorithm"
          />
        </Stack>
      </Paper>
    </Stack>
  )
}