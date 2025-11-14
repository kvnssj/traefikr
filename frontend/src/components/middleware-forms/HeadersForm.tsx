import { TextInput, Stack, Text, Group, Button, Paper, Switch, Tabs } from '@mantine/core'
import { IconPlus, IconTrash, IconHttpPost, IconHttpGet, IconShieldLock, IconLock, IconSettings } from '@tabler/icons-react'

interface HeadersFormProps {
  config: any
  onChange: (config: any) => void
}

export function HeadersForm({ config, onChange }: HeadersFormProps) {
  const handleAddHeader = (type: 'customRequestHeaders' | 'customResponseHeaders') => {
    const current = config[type] || {}
    onChange({
      ...config,
      [type]: {
        ...current,
        '': ''
      }
    })
  }

  const handleUpdateHeader = (
    type: 'customRequestHeaders' | 'customResponseHeaders',
    oldKey: string,
    newKey: string,
    value: string
  ) => {
    const current = { ...(config[type] || {}) }
    if (oldKey !== newKey) {
      delete current[oldKey]
    }
    current[newKey] = value
    onChange({
      ...config,
      [type]: current
    })
  }

  const handleRemoveHeader = (
    type: 'customRequestHeaders' | 'customResponseHeaders',
    key: string
  ) => {
    const current = { ...(config[type] || {}) }
    delete current[key]
    onChange({
      ...config,
      [type]: current
    })
  }

  return (
    <Tabs defaultValue="request-response">
      <Tabs.List>
        <Tabs.Tab value="request-response" leftSection={<IconHttpPost size={16} />}>
          Request/Response
        </Tabs.Tab>
        <Tabs.Tab value="cors" leftSection={<IconSettings size={16} />}>
          CORS
        </Tabs.Tab>
        <Tabs.Tab value="ssl" leftSection={<IconLock size={16} />}>
          SSL/TLS
        </Tabs.Tab>
        <Tabs.Tab value="security" leftSection={<IconShieldLock size={16} />}>
          Security
        </Tabs.Tab>
      </Tabs.List>

      <Tabs.Panel value="request-response" pt="lg">
        <Stack>
          {/* Custom Request Headers */}
          <Paper p="md" radius="sm" withBorder>
            <Group justify="space-between" mb="sm">
              <Text fw={500}>Custom Request Headers</Text>
              <Button
                size="xs"
                variant="light"
                leftSection={<IconPlus size={14} />}
                onClick={() => handleAddHeader('customRequestHeaders')}
              >
                Add Header
              </Button>
            </Group>
            <Stack gap="xs">
              {Object.entries(config.customRequestHeaders || {}).map(([key, value], index) => (
                <Group key={index}>
                  <TextInput
                    placeholder="Header-Name"
                    value={key}
                    onChange={(e) => handleUpdateHeader('customRequestHeaders', key, e.target.value, String(value))}
                    style={{ flex: 1 }}
                  />
                  <TextInput
                    placeholder="Header Value"
                    value={String(value)}
                    onChange={(e) => handleUpdateHeader('customRequestHeaders', key, key, e.target.value)}
                    style={{ flex: 1 }}
                  />
                  <Button
                    size="sm"
                    color="red"
                    variant="subtle"
                    onClick={() => handleRemoveHeader('customRequestHeaders', key)}
                  >
                    <IconTrash size={16} />
                  </Button>
                </Group>
              ))}
              {Object.keys(config.customRequestHeaders || {}).length === 0 && (
                <Text size="sm" c="dimmed">No custom request headers configured</Text>
              )}
            </Stack>
          </Paper>

          {/* Custom Response Headers */}
          <Paper p="md" radius="sm" withBorder>
            <Group justify="space-between" mb="sm">
              <Text fw={500}>Custom Response Headers</Text>
              <Button
                size="xs"
                variant="light"
                leftSection={<IconPlus size={14} />}
                onClick={() => handleAddHeader('customResponseHeaders')}
              >
                Add Header
              </Button>
            </Group>
            <Stack gap="xs">
              {Object.entries(config.customResponseHeaders || {}).map(([key, value], index) => (
                <Group key={index}>
                  <TextInput
                    placeholder="Header-Name"
                    value={key}
                    onChange={(e) => handleUpdateHeader('customResponseHeaders', key, e.target.value, String(value))}
                    style={{ flex: 1 }}
                  />
                  <TextInput
                    placeholder="Header Value"
                    value={String(value)}
                    onChange={(e) => handleUpdateHeader('customResponseHeaders', key, key, e.target.value)}
                    style={{ flex: 1 }}
                  />
                  <Button
                    size="sm"
                    color="red"
                    variant="subtle"
                    onClick={() => handleRemoveHeader('customResponseHeaders', key)}
                  >
                    <IconTrash size={16} />
                  </Button>
                </Group>
              ))}
              {Object.keys(config.customResponseHeaders || {}).length === 0 && (
                <Text size="sm" c="dimmed">No custom response headers configured</Text>
              )}
            </Stack>
          </Paper>
        </Stack>
      </Tabs.Panel>

      <Tabs.Panel value="cors" pt="lg">
        <Stack gap="sm">
          <TextInput
            label="Access-Control-Allow-Origin"
            placeholder="*"
            value={config.accessControlAllowOrigin || ''}
            onChange={(e) => onChange({ ...config, accessControlAllowOrigin: e.target.value })}
            description="Allowed origins for CORS requests"
          />
          <TextInput
            label="Access-Control-Allow-Methods"
            placeholder="GET, POST, PUT, DELETE, OPTIONS"
            value={config.accessControlAllowMethods?.join(', ') || ''}
            onChange={(e) => onChange({ 
              ...config, 
              accessControlAllowMethods: e.target.value.split(',').map(s => s.trim()).filter(Boolean)
            })}
            description="Allowed HTTP methods"
          />
          <TextInput
            label="Access-Control-Allow-Headers"
            placeholder="Content-Type, Authorization"
            value={config.accessControlAllowHeaders?.join(', ') || ''}
            onChange={(e) => onChange({ 
              ...config, 
              accessControlAllowHeaders: e.target.value.split(',').map(s => s.trim()).filter(Boolean)
            })}
            description="Allowed request headers"
          />
          <TextInput
            label="Access-Control-Expose-Headers"
            placeholder="X-Custom-Header"
            value={config.accessControlExposeHeaders?.join(', ') || ''}
            onChange={(e) => onChange({ 
              ...config, 
              accessControlExposeHeaders: e.target.value.split(',').map(s => s.trim()).filter(Boolean)
            })}
            description="Headers exposed to the browser"
          />
          <Switch
            label="Access-Control-Allow-Credentials"
            checked={config.accessControlAllowCredentials || false}
            onChange={(e) => onChange({ ...config, accessControlAllowCredentials: e.currentTarget.checked })}
            description="Allow credentials in CORS requests"
          />
          <TextInput
            label="Access-Control-Max-Age"
            type="number"
            placeholder="86400"
            value={config.accessControlMaxAge || ''}
            onChange={(e) => onChange({ ...config, accessControlMaxAge: parseInt(e.target.value) || undefined })}
            description="Preflight cache duration in seconds"
          />
        </Stack>
      </Tabs.Panel>

      <Tabs.Panel value="ssl" pt="lg">
        <Stack gap="sm">
          <Switch
            label="Force SSL Redirect"
            checked={config.sslRedirect || false}
            onChange={(e) => onChange({ ...config, sslRedirect: e.currentTarget.checked })}
            description="Redirect all HTTP requests to HTTPS"
          />
          <Switch
            label="SSL Temporary Redirect"
            checked={config.sslTemporaryRedirect || false}
            onChange={(e) => onChange({ ...config, sslTemporaryRedirect: e.currentTarget.checked })}
            description="Use 302 instead of 301 for redirects"
          />
          <TextInput
            label="SSL Host"
            placeholder="secure.example.com"
            value={config.sslHost || ''}
            onChange={(e) => onChange({ ...config, sslHost: e.target.value })}
            description="Override the host for SSL redirects"
          />
          <TextInput
            label="SSL Proxy Headers"
            placeholder='{"X-Forwarded-Proto": "https"}'
            value={JSON.stringify(config.sslProxyHeaders || {})}
            onChange={(e) => {
              try {
                const parsed = JSON.parse(e.target.value)
                onChange({ ...config, sslProxyHeaders: parsed })
              } catch {}
            }}
            description="Headers that indicate SSL termination"
          />
          <Switch
            label="Force STS Header"
            checked={config.forceSTSHeader || false}
            onChange={(e) => onChange({ ...config, forceSTSHeader: e.currentTarget.checked })}
            description="Always add Strict-Transport-Security header"
          />
          <Switch
            label="STS Include Subdomains"
            checked={config.stsIncludeSubdomains || false}
            onChange={(e) => onChange({ ...config, stsIncludeSubdomains: e.currentTarget.checked })}
            description="Apply STS to all subdomains"
          />
          <TextInput
            label="STS Max Age"
            type="number"
            placeholder="31536000"
            value={config.stsSeconds || ''}
            onChange={(e) => onChange({ ...config, stsSeconds: parseInt(e.target.value) || undefined })}
            description="STS max-age in seconds"
          />
          <Switch
            label="STS Preload"
            checked={config.stsPreload || false}
            onChange={(e) => onChange({ ...config, stsPreload: e.currentTarget.checked })}
            description="Enable HSTS preloading"
          />
        </Stack>
      </Tabs.Panel>

      <Tabs.Panel value="security" pt="lg">
        <Stack gap="sm">
          <Switch
            label="Frame Deny"
            checked={config.frameDeny || false}
            onChange={(e) => onChange({ ...config, frameDeny: e.currentTarget.checked })}
            description="Sets X-Frame-Options to DENY"
          />
          <TextInput
            label="Custom Frame Options Value"
            placeholder="SAMEORIGIN"
            value={config.customFrameOptionsValue || ''}
            onChange={(e) => onChange({ ...config, customFrameOptionsValue: e.target.value })}
            description="Custom X-Frame-Options value"
          />
          <Switch
            label="Browser XSS Filter"
            checked={config.browserXssFilter || false}
            onChange={(e) => onChange({ ...config, browserXssFilter: e.currentTarget.checked })}
            description="Enable X-XSS-Protection header"
          />
          <Switch
            label="Content Type Nosniff"
            checked={config.contentTypeNosniff || false}
            onChange={(e) => onChange({ ...config, contentTypeNosniff: e.currentTarget.checked })}
            description="Sets X-Content-Type-Options to nosniff"
          />
          <TextInput
            label="Content Security Policy"
            placeholder="default-src 'self'"
            value={config.contentSecurityPolicy || ''}
            onChange={(e) => onChange({ ...config, contentSecurityPolicy: e.target.value })}
            description="CSP header value"
          />
          <TextInput
            label="Public Key"
            placeholder="pin-sha256=..."
            value={config.publicKey || ''}
            onChange={(e) => onChange({ ...config, publicKey: e.target.value })}
            description="HTTP Public Key Pinning"
          />
          <TextInput
            label="Referrer Policy"
            placeholder="same-origin"
            value={config.referrerPolicy || ''}
            onChange={(e) => onChange({ ...config, referrerPolicy: e.target.value })}
            description="Referrer-Policy header value"
          />
          <Switch
            label="Is Development"
            checked={config.isDevelopment || false}
            onChange={(e) => onChange({ ...config, isDevelopment: e.currentTarget.checked })}
            description="Adds additional debug headers"
          />
        </Stack>
      </Tabs.Panel>
    </Tabs>
  )
}