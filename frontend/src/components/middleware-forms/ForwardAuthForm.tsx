import { TextInput, Switch, Stack, Text, Textarea, Tabs } from '@mantine/core'
import { IconShield, IconLock } from '@tabler/icons-react'

interface ForwardAuthFormProps {
  config: any
  onChange: (config: any) => void
}

export function ForwardAuthForm({ config, onChange }: ForwardAuthFormProps) {
  return (
    <Tabs defaultValue="auth">
      <Tabs.List>
        <Tabs.Tab value="auth" leftSection={<IconShield size={16} />}>
          Authentication
        </Tabs.Tab>
        <Tabs.Tab value="tls" leftSection={<IconLock size={16} />}>
          TLS Configuration
        </Tabs.Tab>
      </Tabs.List>

      <Tabs.Panel value="auth" pt="lg">
        <Stack gap="sm">
          <TextInput
            label="Address"
            placeholder="http://auth.example.com/auth"
            value={config.address || ''}
            onChange={(e) => onChange({ ...config, address: e.target.value })}
            description="Authentication service URL"
            required
          />

          <Switch
            label="Trust Forward Header"
            checked={config.trustForwardHeader || false}
            onChange={(e) => onChange({ ...config, trustForwardHeader: e.currentTarget.checked })}
            description="Trust X-Forwarded-* headers"
          />

          <Textarea
            label="Auth Response Headers"
            placeholder="X-Auth-User&#10;X-Auth-Groups"
            value={config.authResponseHeaders?.join('\n') || ''}
            onChange={(e) => onChange({
              ...config,
              authResponseHeaders: e.target.value.split('\n').filter(Boolean)
            })}
            description="Headers to copy from auth response (one per line)"
            rows={3}
          />

          <Textarea
            label="Auth Response Headers Regex"
            placeholder="^X-Auth-.*"
            value={config.authResponseHeadersRegex || ''}
            onChange={(e) => onChange({ ...config, authResponseHeadersRegex: e.target.value })}
            description="Regex pattern for headers to copy"
          />

          <Textarea
            label="Auth Request Headers"
            placeholder="Accept&#10;X-Custom-Header"
            value={config.authRequestHeaders?.join('\n') || ''}
            onChange={(e) => onChange({
              ...config,
              authRequestHeaders: e.target.value.split('\n').filter(Boolean)
            })}
            description="Headers to send to auth service (one per line)"
            rows={3}
          />
        </Stack>
      </Tabs.Panel>

      <Tabs.Panel value="tls" pt="lg">
        <Stack gap="sm">
          <TextInput
            label="CA Certificate"
            placeholder="/path/to/ca.crt"
            value={config.tls?.ca || ''}
            onChange={(e) => onChange({
              ...config,
              tls: { ...config.tls, ca: e.target.value }
            })}
            description="Path to CA certificate"
          />

          <TextInput
            label="Client Certificate"
            placeholder="/path/to/client.crt"
            value={config.tls?.cert || ''}
            onChange={(e) => onChange({
              ...config,
              tls: { ...config.tls, cert: e.target.value }
            })}
            description="Path to client certificate"
          />

          <TextInput
            label="Client Key"
            placeholder="/path/to/client.key"
            value={config.tls?.key || ''}
            onChange={(e) => onChange({
              ...config,
              tls: { ...config.tls, key: e.target.value }
            })}
            description="Path to client key"
          />

          <Switch
            label="Skip TLS Verification"
            checked={config.tls?.insecureSkipVerify || false}
            onChange={(e) => onChange({
              ...config,
              tls: { ...config.tls, insecureSkipVerify: e.currentTarget.checked }
            })}
            description="Skip TLS certificate verification (insecure)"
          />
        </Stack>
      </Tabs.Panel>
    </Tabs>
  )
}