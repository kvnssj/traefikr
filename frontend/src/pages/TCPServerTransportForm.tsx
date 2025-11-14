import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { 
  Container, 
  Paper, 
  TextInput, 
  Button, 
  Group, 
  Stack, 
  Switch,
  Title,
  Card,
  Text,
  Select,
  ActionIcon,
  Alert,
  NumberInput,
  Tabs,
  Divider,
  Textarea
} from '@mantine/core'
import { notifications } from '@mantine/notifications'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { 
  IconServer, 
  IconDeviceFloppy, 
  IconPlus, 
  IconTrash,
  IconSettings,
  IconLock,
  IconClock,
  IconNetwork,
  IconAlertCircle,
  IconShieldLock
} from '@tabler/icons-react'

export default function TCPServerTransportForm() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { name } = useParams<{ name?: string }>()
  const isEditing = !!name

  const [formData, setFormData] = useState({
    name: '',
    dialTimeout: '30s',
    dialKeepAlive: '15s',
    terminationDelay: '100ms',
    tls: {
      enabled: false,
      serverName: '',
      insecureSkipVerify: false,
      rootCAs: [] as string[],
      certificates: [] as { certFile: string, keyFile: string }[],
      peerCertURI: ''
    },
    proxyProtocol: {
      enabled: false,
      version: 2 as 1 | 2
    },
    spiffe: {
      enabled: false,
      ids: [] as string[],
      trustDomain: ''
    }
  })
  const [loading, setLoading] = useState(false)

  // Fetch existing transport if editing
  const { data: transport } = useQuery({
    queryKey: ['tcp-server-transport', name],
    queryFn: async () => {
      if (!name) return null
      const response = await api.get(`/tcp-server-transports/${name}`)
      return response.data
    },
    enabled: isEditing
  })

  useEffect(() => {
    if (transport) {
      setFormData({
        name: transport.name,
        dialTimeout: transport.dialTimeout || '30s',
        dialKeepAlive: transport.dialKeepAlive || '15s',
        terminationDelay: transport.terminationDelay || '100ms',
        tls: {
          enabled: !!transport.tls,
          serverName: transport.tls?.serverName || '',
          insecureSkipVerify: transport.tls?.insecureSkipVerify || false,
          rootCAs: transport.tls?.rootCAs || [],
          certificates: transport.tls?.certificates || [],
          peerCertURI: transport.tls?.peerCertURI || ''
        },
        proxyProtocol: {
          enabled: !!transport.proxyProtocol,
          version: transport.proxyProtocol?.version || 2
        },
        spiffe: {
          enabled: !!transport.spiffe,
          ids: transport.spiffe?.ids || [],
          trustDomain: transport.spiffe?.trustDomain || ''
        }
      })
    }
  }, [transport])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const data = {
        name: formData.name,
        dialTimeout: formData.dialTimeout,
        dialKeepAlive: formData.dialKeepAlive,
        terminationDelay: formData.terminationDelay,
        tls: formData.tls.enabled ? {
          serverName: formData.tls.serverName || undefined,
          insecureSkipVerify: formData.tls.insecureSkipVerify,
          rootCAs: formData.tls.rootCAs.length > 0 ? formData.tls.rootCAs : undefined,
          certificates: formData.tls.certificates.length > 0 ? formData.tls.certificates : undefined,
          peerCertURI: formData.tls.peerCertURI || undefined
        } : undefined,
        proxyProtocol: formData.proxyProtocol.enabled ? {
          version: formData.proxyProtocol.version
        } : undefined,
        spiffe: formData.spiffe.enabled ? {
          ids: formData.spiffe.ids.length > 0 ? formData.spiffe.ids : undefined,
          trustDomain: formData.spiffe.trustDomain || undefined
        } : undefined
      }

      if (isEditing) {
        await api.put(`/tcp-server-transports/${name}`, data)
        notifications.show({
          title: 'Success',
          message: 'TCP Server Transport updated successfully',
          color: 'green'
        })
      } else {
        await api.post('/tcp-server-transports/', data)
        notifications.show({
          title: 'Success',
          message: 'TCP Server Transport created successfully',
          color: 'green'
        })
      }
      
      queryClient.invalidateQueries({ queryKey: ['tcp-server-transports'] })
      navigate('/transports')
    } catch (error: any) {
      notifications.show({
        title: 'Error',
        message: error.response?.data?.detail || 'An error occurred',
        color: 'red'
      })
    } finally {
      setLoading(false)
    }
  }

  const addCertificate = () => {
    setFormData(prev => ({
      ...prev,
      tls: {
        ...prev.tls,
        certificates: [...prev.tls.certificates, { certFile: '', keyFile: '' }]
      }
    }))
  }

  const removeCertificate = (index: number) => {
    setFormData(prev => ({
      ...prev,
      tls: {
        ...prev.tls,
        certificates: prev.tls.certificates.filter((_, i) => i !== index)
      }
    }))
  }

  const updateCertificate = (index: number, field: 'certFile' | 'keyFile', value: string) => {
    setFormData(prev => ({
      ...prev,
      tls: {
        ...prev.tls,
        certificates: prev.tls.certificates.map((cert, i) =>
          i === index ? { ...cert, [field]: value } : cert
        )
      }
    }))
  }

  const addRootCA = () => {
    setFormData(prev => ({
      ...prev,
      tls: {
        ...prev.tls,
        rootCAs: [...prev.tls.rootCAs, '']
      }
    }))
  }

  const removeRootCA = (index: number) => {
    setFormData(prev => ({
      ...prev,
      tls: {
        ...prev.tls,
        rootCAs: prev.tls.rootCAs.filter((_, i) => i !== index)
      }
    }))
  }

  const updateRootCA = (index: number, value: string) => {
    setFormData(prev => ({
      ...prev,
      tls: {
        ...prev.tls,
        rootCAs: prev.tls.rootCAs.map((ca, i) =>
          i === index ? value : ca
        )
      }
    }))
  }

  const addSpiffeId = () => {
    setFormData(prev => ({
      ...prev,
      spiffe: {
        ...prev.spiffe,
        ids: [...prev.spiffe.ids, '']
      }
    }))
  }

  const removeSpiffeId = (index: number) => {
    setFormData(prev => ({
      ...prev,
      spiffe: {
        ...prev.spiffe,
        ids: prev.spiffe.ids.filter((_, i) => i !== index)
      }
    }))
  }

  const updateSpiffeId = (index: number, value: string) => {
    setFormData(prev => ({
      ...prev,
      spiffe: {
        ...prev.spiffe,
        ids: prev.spiffe.ids.map((id, i) =>
          i === index ? value : id
        )
      }
    }))
  }

  return (
    <Stack gap="md">
      <Card shadow="sm" radius="md" withBorder>
        <Card.Section withBorder p="md">
          <Group justify="space-between">
            <Group>
              <IconServer size={24} />
              <Text fw={500}>{isEditing ? `Edit TCP Server Transport: ${name}` : 'Create New TCP Server Transport'}</Text>
            </Group>
            <Group>
              <Button
                variant="subtle"
                onClick={() => navigate('/transports')}
              >
                Cancel
              </Button>
              <Button
                loading={loading}
                leftSection={<IconDeviceFloppy size={16} />}
                onClick={handleSubmit}
              >
                {isEditing ? 'Update' : 'Create'} Transport
              </Button>
            </Group>
          </Group>
        </Card.Section>
        
        <Card.Section p="md">
          <Stack gap="md">
            <TextInput
              label="Transport Name"
              required
              disabled={isEditing}
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="my-tcp-transport"
              description="Unique identifier for this TCP server transport"
            />

            <Tabs defaultValue="general">
              <Tabs.List>
                <Tabs.Tab value="general" leftSection={<IconSettings size={16} />}>
                  General Settings
                </Tabs.Tab>
                <Tabs.Tab value="tls" leftSection={<IconLock size={16} />}>
                  TLS Configuration
                </Tabs.Tab>
                <Tabs.Tab value="proxy" leftSection={<IconNetwork size={16} />}>
                  Proxy Protocol
                </Tabs.Tab>
                <Tabs.Tab value="spiffe" leftSection={<IconShieldLock size={16} />}>
                  SPIFFE
                </Tabs.Tab>
              </Tabs.List>

              {/* General Settings Tab */}
              <Tabs.Panel value="general" pt="xs">
                <Stack>
                  <Alert icon={<IconAlertCircle size={16} />} color="blue">
                    TCP Server Transport configures the connection settings for TCP services including timeouts and keep-alive parameters.
                  </Alert>

                  <TextInput
                    label="Dial Timeout"
                    value={formData.dialTimeout}
                    onChange={(e) => setFormData({ ...formData, dialTimeout: e.target.value })}
                    placeholder="30s"
                    description="Connection timeout when dialing the backend TCP service (default: 30s)"
                  />

                  <TextInput
                    label="Dial Keep Alive"
                    value={formData.dialKeepAlive}
                    onChange={(e) => setFormData({ ...formData, dialKeepAlive: e.target.value })}
                    placeholder="15s"
                    description="Interval between keep-alive probes for network connections (default: 15s)"
                  />

                  <TextInput
                    label="Termination Delay"
                    value={formData.terminationDelay}
                    onChange={(e) => setFormData({ ...formData, terminationDelay: e.target.value })}
                    placeholder="100ms"
                    description="Time to wait for connections to fully terminate (default: 100ms)"
                  />
                </Stack>
              </Tabs.Panel>

              {/* TLS Configuration Tab */}
              <Tabs.Panel value="tls" pt="xs">
                <Stack>
                  <Switch
                    label="Enable TLS"
                    checked={formData.tls.enabled}
                    onChange={(e) => setFormData({ 
                      ...formData, 
                      tls: { ...formData.tls, enabled: e.currentTarget.checked }
                    })}
                    description="Enable TLS for backend connections"
                  />

                  {formData.tls.enabled && (
                    <>
                      <Divider my="sm" />

                      <TextInput
                        label="Server Name"
                        value={formData.tls.serverName}
                        onChange={(e) => setFormData({ 
                          ...formData, 
                          tls: { ...formData.tls, serverName: e.target.value }
                        })}
                        placeholder="backend.example.com"
                        description="Server name used for SNI (Server Name Indication)"
                      />

                      <Switch
                        label="Insecure Skip Verify"
                        checked={formData.tls.insecureSkipVerify}
                        onChange={(e) => setFormData({ 
                          ...formData, 
                          tls: { ...formData.tls, insecureSkipVerify: e.currentTarget.checked }
                        })}
                        description="Skip certificate chain and hostname verification (not recommended for production)"
                      />

                      <TextInput
                        label="Peer Certificate URI"
                        value={formData.tls.peerCertURI}
                        onChange={(e) => setFormData({ 
                          ...formData, 
                          tls: { ...formData.tls, peerCertURI: e.target.value }
                        })}
                        placeholder="spiffe://trust-domain/path"
                        description="URI to match against SAN URIs during certificate verification"
                      />

                      <Divider my="sm" />

                      <Group justify="space-between">
                        <Text size="sm" fw={500}>Client Certificates (mTLS)</Text>
                        <Button
                          size="xs"
                          variant="light"
                          leftSection={<IconPlus size={14} />}
                          onClick={addCertificate}
                        >
                          Add Certificate
                        </Button>
                      </Group>
                      {formData.tls.certificates.map((cert, index) => (
                        <Group key={index}>
                          <TextInput
                            placeholder="/path/to/cert.pem"
                            value={cert.certFile}
                            onChange={(e) => updateCertificate(index, 'certFile', e.target.value)}
                            style={{ flex: 1 }}
                            label={index === 0 ? "Certificate File" : undefined}
                            description={index === 0 ? "Path to client certificate file" : undefined}
                          />
                          <TextInput
                            placeholder="/path/to/key.pem"
                            value={cert.keyFile}
                            onChange={(e) => updateCertificate(index, 'keyFile', e.target.value)}
                            style={{ flex: 1 }}
                            label={index === 0 ? "Key File" : undefined}
                            description={index === 0 ? "Path to private key file" : undefined}
                          />
                          <ActionIcon
                            color="red"
                            variant="subtle"
                            onClick={() => removeCertificate(index)}
                            mt={index === 0 ? 28 : 0}
                          >
                            <IconTrash size={16} />
                          </ActionIcon>
                        </Group>
                      ))}

                      <Divider my="sm" />

                      <Group justify="space-between">
                        <Text size="sm" fw={500}>Root Certificate Authorities</Text>
                        <Button
                          size="xs"
                          variant="light"
                          leftSection={<IconPlus size={14} />}
                          onClick={addRootCA}
                        >
                          Add Root CA
                        </Button>
                      </Group>
                      {formData.tls.rootCAs.map((ca, index) => (
                        <Group key={index}>
                          <TextInput
                            placeholder="/path/to/ca.pem"
                            value={ca}
                            onChange={(e) => updateRootCA(index, e.target.value)}
                            style={{ flex: 1 }}
                            label={index === 0 ? "Root CA File" : undefined}
                            description={index === 0 ? "Path to root certificate authority file" : undefined}
                          />
                          <ActionIcon
                            color="red"
                            variant="subtle"
                            onClick={() => removeRootCA(index)}
                            mt={index === 0 ? 28 : 0}
                          >
                            <IconTrash size={16} />
                          </ActionIcon>
                        </Group>
                      ))}
                    </>
                  )}
                </Stack>
              </Tabs.Panel>

              {/* Proxy Protocol Tab */}
              <Tabs.Panel value="proxy" pt="xs">
                <Stack>
                  <Alert icon={<IconAlertCircle size={16} />} color="blue">
                    Proxy Protocol allows passing connection information from the client to the server through proxy servers.
                  </Alert>

                  <Switch
                    label="Enable Proxy Protocol"
                    checked={formData.proxyProtocol.enabled}
                    onChange={(e) => setFormData({ 
                      ...formData, 
                      proxyProtocol: { ...formData.proxyProtocol, enabled: e.currentTarget.checked }
                    })}
                    description="Enable Proxy Protocol for backend connections"
                  />

                  {formData.proxyProtocol.enabled && (
                    <Select
                      label="Proxy Protocol Version"
                      value={formData.proxyProtocol.version.toString()}
                      onChange={(value) => setFormData({ 
                        ...formData, 
                        proxyProtocol: { ...formData.proxyProtocol, version: parseInt(value || '2') as 1 | 2 }
                      })}
                      data={[
                        { value: '1', label: 'Version 1 (Text)' },
                        { value: '2', label: 'Version 2 (Binary)' }
                      ]}
                      description="Proxy Protocol version to use (default: Version 2)"
                    />
                  )}
                </Stack>
              </Tabs.Panel>

              {/* SPIFFE Tab */}
              <Tabs.Panel value="spiffe" pt="xs">
                <Stack>
                  <Alert icon={<IconAlertCircle size={16} />} color="yellow">
                    SPIFFE (Secure Production Identity Framework For Everyone) must be pre-enabled in Traefik's installation configuration to use these settings.
                  </Alert>

                  <Switch
                    label="Enable SPIFFE"
                    checked={formData.spiffe.enabled}
                    onChange={(e) => setFormData({ 
                      ...formData, 
                      spiffe: { ...formData.spiffe, enabled: e.currentTarget.checked }
                    })}
                    description="Enable SPIFFE for secure workload identity"
                  />

                  {formData.spiffe.enabled && (
                    <>
                      <TextInput
                        label="Trust Domain"
                        value={formData.spiffe.trustDomain}
                        onChange={(e) => setFormData({ 
                          ...formData, 
                          spiffe: { ...formData.spiffe, trustDomain: e.target.value }
                        })}
                        placeholder="example.org"
                        description="Allowed SPIFFE trust domain"
                      />

                      <Divider my="sm" />

                      <Group justify="space-between">
                        <Text size="sm" fw={500}>Allowed SPIFFE IDs</Text>
                        <Button
                          size="xs"
                          variant="light"
                          leftSection={<IconPlus size={14} />}
                          onClick={addSpiffeId}
                        >
                          Add SPIFFE ID
                        </Button>
                      </Group>
                      {formData.spiffe.ids.map((id, index) => (
                        <Group key={index}>
                          <TextInput
                            placeholder="spiffe://example.org/service"
                            value={id}
                            onChange={(e) => updateSpiffeId(index, e.target.value)}
                            style={{ flex: 1 }}
                            label={index === 0 ? "SPIFFE ID" : undefined}
                            description={index === 0 ? "Allowed SPIFFE identifier" : undefined}
                          />
                          <ActionIcon
                            color="red"
                            variant="subtle"
                            onClick={() => removeSpiffeId(index)}
                            mt={index === 0 ? 28 : 0}
                          >
                            <IconTrash size={16} />
                          </ActionIcon>
                        </Group>
                      ))}
                    </>
                  )}
                </Stack>
              </Tabs.Panel>
            </Tabs>
          </Stack>
        </Card.Section>
      </Card>
    </Stack>
  )
}