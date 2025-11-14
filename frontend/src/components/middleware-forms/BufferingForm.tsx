import { TextInput, Stack, Tabs, Text } from '@mantine/core'
import { IconUpload, IconDownload, IconRefresh } from '@tabler/icons-react'

interface BufferingFormProps {
  config: any
  onChange: (config: any) => void
}

export function BufferingForm({ config, onChange }: BufferingFormProps) {
  return (
    <Tabs defaultValue="request">
      <Tabs.List>
        <Tabs.Tab value="request" leftSection={<IconUpload size={16} />}>
          Request Buffering
        </Tabs.Tab>
        <Tabs.Tab value="response" leftSection={<IconDownload size={16} />}>
          Response Buffering
        </Tabs.Tab>
        <Tabs.Tab value="retry" leftSection={<IconRefresh size={16} />}>
          Retry Settings
        </Tabs.Tab>
      </Tabs.List>

      <Tabs.Panel value="request" pt="lg">
        <Stack gap="sm">
          <TextInput
            label="Max Request Body Bytes"
            placeholder="2097152"
            value={config.maxRequestBodyBytes || ''}
            onChange={(e) => onChange({ 
              ...config, 
              maxRequestBodyBytes: parseInt(e.target.value) || undefined 
            })}
            description="Maximum allowed body size in bytes (e.g., 2097152 = 2MB)"
          />

          <TextInput
            label="Memory Request Body Bytes"
            placeholder="1048576"
            value={config.memRequestBodyBytes || ''}
            onChange={(e) => onChange({ 
              ...config, 
              memRequestBodyBytes: parseInt(e.target.value) || undefined 
            })}
            description="Threshold for buffering to disk in bytes (e.g., 1048576 = 1MB)"
          />

          <Text size="xs" c="dimmed">
            Requests larger than the memory threshold will be buffered to disk
          </Text>
        </Stack>
      </Tabs.Panel>

      <Tabs.Panel value="response" pt="lg">
        <Stack gap="sm">
          <TextInput
            label="Max Response Body Bytes"
            placeholder="2097152"
            value={config.maxResponseBodyBytes || ''}
            onChange={(e) => onChange({ 
              ...config, 
              maxResponseBodyBytes: parseInt(e.target.value) || undefined 
            })}
            description="Maximum allowed response size in bytes (e.g., 2097152 = 2MB)"
          />

          <TextInput
            label="Memory Response Body Bytes"
            placeholder="1048576"
            value={config.memResponseBodyBytes || ''}
            onChange={(e) => onChange({ 
              ...config, 
              memResponseBodyBytes: parseInt(e.target.value) || undefined 
            })}
            description="Threshold for buffering to disk in bytes (e.g., 1048576 = 1MB)"
          />

          <Text size="xs" c="dimmed">
            Responses larger than the memory threshold will be buffered to disk
          </Text>
        </Stack>
      </Tabs.Panel>

      <Tabs.Panel value="retry" pt="lg">
        <Stack gap="sm">
          <TextInput
            label="Retry Expression"
            placeholder="IsNetworkError() || (StatusCode() >= 500)"
            value={config.retryExpression || ''}
            onChange={(e) => onChange({ ...config, retryExpression: e.target.value })}
            description="Expression to determine when to retry buffered requests"
          />

          <Text size="xs" c="dimmed">
            The retry expression is evaluated when buffering is enabled. Common functions:
            <br />• IsNetworkError() - Network connectivity issues
            <br />• StatusCode() - HTTP response status code
            <br />• Attempts() - Current retry attempt number
          </Text>
        </Stack>
      </Tabs.Panel>
    </Tabs>
  )
}