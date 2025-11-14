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
  Breadcrumbs,
  Anchor,
  Card,
  Text,
  Select,
  ActionIcon,
  Alert,
  NumberInput,
  Tabs,
  SegmentedControl,
  Divider,
  Checkbox
} from '@mantine/core'
import { notifications } from '@mantine/notifications'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { servicesApi, Service, api } from '@/lib/api'
import { 
  IconServer, 
  IconArrowLeft, 
  IconDeviceFloppy, 
  IconPlus, 
  IconTrash,
  IconSettings,
  IconHeartbeat,
  IconCookie,
  IconRoute,
  IconCopy,
  IconRefreshDot,
  IconAlertCircle
} from '@tabler/icons-react'
import { Link } from 'react-router-dom'

export default function ServiceForm() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { name } = useParams<{ name?: string }>()
  const decodedName = name ? decodeURIComponent(name) : undefined
  const isEditing = !!decodedName

  const [serviceType, setServiceType] = useState<'loadBalancer' | 'weighted' | 'mirroring' | 'failover'>('loadBalancer')
  const [protocol, setProtocol] = useState<'http' | 'tcp' | 'udp'>('http')
  const [formData, setFormData] = useState({
    name: '',
    type: 'loadBalancer' as 'loadBalancer' | 'weighted' | 'mirroring' | 'failover',
    loadBalancer: {
      servers: [{ url: '', address: '', weight: 1, tls: false }],  // url for HTTP, address+tls for TCP/UDP
      sticky: {
        cookie: {
          enabled: false,
          name: '',
          domain: '',
          secure: false,
          httpOnly: true,
          sameSite: 'default' as 'default' | 'none' | 'lax' | 'strict',
          maxAge: 0
        }
      },
      healthCheck: {
        path: '/',
        scheme: '',
        mode: 'http' as 'http' | 'grpc',
        hostname: '',
        port: 0,
        interval: '30s',
        unhealthyInterval: '30s',
        timeout: '5s',
        headers: {} as Record<string, string>,
        followRedirects: true,
        method: 'GET',
        status: 0
      },
      // TCP Health Check (different schema)
      tcpHealthCheck: {
        send: '',
        expect: '',
        interval: '30s',
        unhealthyInterval: '30s',
        timeout: '5s',
        port: 0
      },
      passiveHealthCheck: {
        failureWindow: '10s',
        maxFailedAttempts: 1
      },
      passHostHeader: true,
      serversTransport: '',
      responseForwarding: {
        flushInterval: '100ms'
      }
    },
    weighted: {
      services: [] as Array<{ name: string, weight: number }>,
      sticky: {
        cookie: {
          enabled: false,
          name: '',
          domain: '',
          secure: false,
          httpOnly: true,
          sameSite: 'default' as 'default' | 'none' | 'lax' | 'strict',
          maxAge: 0
        }
      },
      healthCheck: {
        enabled: false
      }
    },
    mirroring: {
      service: '',
      maxBodySize: -1,
      mirrors: [] as Array<{ name: string, percent: number }>,
      healthCheck: {
        path: '/',
        scheme: '',
        mode: 'http' as 'http' | 'grpc',
        hostname: '',
        port: 0,
        interval: '30s',
        unhealthyInterval: '30s',
        timeout: '5s',
        headers: {} as Record<string, string>,
        followRedirects: true,
        method: 'GET',
        status: 0
      }
    },
    failover: {
      service: '',
      fallback: '',
      healthCheck: {
        path: '/',
        scheme: '',
        mode: 'http' as 'http' | 'grpc',
        hostname: '',
        port: 0,
        interval: '30s',
        unhealthyInterval: '30s',
        timeout: '5s',
        headers: {} as Record<string, string>,
        followRedirects: true,
        method: 'GET',
        status: 0
      }
    }
  })
  const [loading, setLoading] = useState(false)
  const [healthCheckEnabled, setHealthCheckEnabled] = useState({
    loadBalancer: false,
    mirroring: false,
    failover: false
  })
  const [passiveHealthCheckEnabled, setPassiveHealthCheckEnabled] = useState({
    loadBalancer: false,
    tcp: false,
    udp: false
  })

  const { data: service } = useQuery({
    queryKey: ['service', decodedName],
    queryFn: async () => {
      if (!decodedName) return null
      const response = await servicesApi.get('http', decodedName)  // Always get from http for editing
      return response.data
    },
    enabled: isEditing
  })

  // Fetch available services for weighted/mirroring/failover configurations
  const { data: availableServices } = useQuery({
    queryKey: ['services'],
    queryFn: async () => {
      const response = await api.get('/services/')
      return response.data
    }
  })

  // Fetch available TCP server transports
  const { data: serverTransports } = useQuery({
    queryKey: ['tcp-server-transports'],
    queryFn: async () => {
      const response = await api.get('/tcp-server-transports/')
      return response.data
    }
  })

  useEffect(() => {
    if (service) {
      // Determine the protocol from service metadata
      const serviceProtocol = service.metadata?.type || 'http'
      if (serviceProtocol === 'tcp' || serviceProtocol === 'udp') {
        setProtocol(serviceProtocol as 'tcp' | 'udp')
      } else {
        setProtocol('http')
      }

      // Determine the service type based on the service configuration
      let type: 'loadBalancer' | 'weighted' | 'mirroring' | 'failover' = 'loadBalancer'
      if (service.weighted) type = 'weighted'
      else if (service.mirroring) type = 'mirroring'
      else if (service.failover) type = 'failover'
      
      setServiceType(type)
      
      // Detect if health checks are enabled (if they exist and have meaningful data)
      const isLoadBalancerHealthCheckEnabled = !!(service.loadBalancer?.healthCheck && 
        (service.loadBalancer.healthCheck.path || 
         service.loadBalancer.healthCheck.scheme ||
         service.loadBalancer.healthCheck.hostname ||
         service.loadBalancer.healthCheck.port ||
         (service.loadBalancer.healthCheck.interval && service.loadBalancer.healthCheck.interval !== '30s') ||
         (service.loadBalancer.healthCheck.timeout && service.loadBalancer.healthCheck.timeout !== '5s')))
      
      const isMirroringHealthCheckEnabled = !!(service.mirroring?.healthCheck && 
        (service.mirroring.healthCheck.path || 
         service.mirroring.healthCheck.scheme ||
         service.mirroring.healthCheck.hostname ||
         service.mirroring.healthCheck.port))
      
      const isFailoverHealthCheckEnabled = !!(service.failover?.healthCheck && 
        (service.failover.healthCheck.path || 
         service.failover.healthCheck.scheme ||
         service.failover.healthCheck.hostname ||
         service.failover.healthCheck.port))
      
      setHealthCheckEnabled({
        loadBalancer: isLoadBalancerHealthCheckEnabled,
        mirroring: isMirroringHealthCheckEnabled,
        failover: isFailoverHealthCheckEnabled
      })
      
      // Detect if passive health checks are enabled (check all possible locations)
      const isPassiveHealthCheckEnabled = !!(
        service.loadBalancer?.passiveHealthCheck ||
        service.weighted?.passiveHealthCheck ||
        service.mirroring?.passiveHealthCheck ||
        service.failover?.passiveHealthCheck
      )
      
      
      setPassiveHealthCheckEnabled({
        loadBalancer: isPassiveHealthCheckEnabled,
        tcp: false, // Will need to implement for TCP services
        udp: false  // Will need to implement for UDP services
      })
      
      // Map service data to form structure
      const updatedFormData = {
        name: service.name,
        type,
        loadBalancer: {
          servers: service.loadBalancer?.servers?.map(server => ({
            url: server.url,
            weight: server.weight || 1
          })) || [{ url: '', weight: 1 }],
          sticky: {
            cookie: {
              enabled: !!(service.loadBalancer?.sticky?.cookie),
              name: service.loadBalancer?.sticky?.cookie?.name || '',
              domain: service.loadBalancer?.sticky?.cookie?.domain || '',
              secure: service.loadBalancer?.sticky?.cookie?.secure || false,
              httpOnly: service.loadBalancer?.sticky?.cookie?.httpOnly ?? true,
              sameSite: (service.loadBalancer?.sticky?.cookie?.sameSite as 'default' | 'none' | 'lax' | 'strict') || 'default',
              maxAge: service.loadBalancer?.sticky?.cookie?.maxAge || 0
            }
          },
          healthCheck: {
            path: service.loadBalancer?.healthCheck?.path || '/',
            scheme: service.loadBalancer?.healthCheck?.scheme || '',
            mode: (service.loadBalancer?.healthCheck?.mode as 'http' | 'grpc') || 'http',
            hostname: service.loadBalancer?.healthCheck?.hostname || '',
            port: service.loadBalancer?.healthCheck?.port || 0,
            interval: service.loadBalancer?.healthCheck?.interval || '30s',
            unhealthyInterval: service.loadBalancer?.healthCheck?.unhealthyInterval || '30s',
            timeout: service.loadBalancer?.healthCheck?.timeout || '5s',
            headers: service.loadBalancer?.healthCheck?.headers || {},
            followRedirects: service.loadBalancer?.healthCheck?.followRedirects ?? true,
            method: service.loadBalancer?.healthCheck?.method || 'GET',
            status: service.loadBalancer?.healthCheck?.status || 0
          },
          passiveHealthCheck: {
            failureWindow: service.loadBalancer?.passiveHealthCheck?.failureWindow || '10s',
            maxFailedAttempts: service.loadBalancer?.passiveHealthCheck?.maxFailedAttempts || 1
          },
          passHostHeader: service.loadBalancer?.passHostHeader ?? true,
          serversTransport: '',
          responseForwarding: {
            flushInterval: service.loadBalancer?.responseForwarding?.flushInterval || '100ms'
          }
        },
        weighted: {
          services: service.weighted?.services || [],
          sticky: {
            cookie: {
              enabled: !!(service.weighted?.sticky?.cookie),
              name: service.weighted?.sticky?.cookie?.name || '',
              domain: service.weighted?.sticky?.cookie?.domain || '',
              secure: service.weighted?.sticky?.cookie?.secure || false,
              httpOnly: service.weighted?.sticky?.cookie?.httpOnly ?? true,
              sameSite: (service.weighted?.sticky?.cookie?.sameSite as 'default' | 'none' | 'lax' | 'strict') || 'default',
              maxAge: service.weighted?.sticky?.cookie?.maxAge || 0
            }
          }
        },
        mirroring: {
          service: service.mirroring?.service || '',
          mirrors: service.mirroring?.mirrors || [],
          maxBodySize: service.mirroring?.maxBodySize || 0,
          healthCheck: {
            path: service.mirroring?.healthCheck?.path || '/',
            scheme: service.mirroring?.healthCheck?.scheme || '',
            mode: (service.mirroring?.healthCheck?.mode as 'http' | 'grpc') || 'http',
            hostname: service.mirroring?.healthCheck?.hostname || '',
            port: service.mirroring?.healthCheck?.port || 0,
            interval: service.mirroring?.healthCheck?.interval || '30s',
            unhealthyInterval: service.mirroring?.healthCheck?.unhealthyInterval || '30s',
            timeout: service.mirroring?.healthCheck?.timeout || '5s',
            headers: service.mirroring?.healthCheck?.headers || {},
            followRedirects: service.mirroring?.healthCheck?.followRedirects ?? true,
            method: service.mirroring?.healthCheck?.method || 'GET',
            status: service.mirroring?.healthCheck?.status || 0
          }
        },
        failover: {
          service: service.failover?.service || '',
          fallback: service.failover?.fallback || '',
          healthCheck: {
            path: service.failover?.healthCheck?.path || '/',
            scheme: service.failover?.healthCheck?.scheme || '',
            mode: (service.failover?.healthCheck?.mode as 'http' | 'grpc') || 'http',
            hostname: service.failover?.healthCheck?.hostname || '',
            port: service.failover?.healthCheck?.port || 0,
            interval: service.failover?.healthCheck?.interval || '30s',
            unhealthyInterval: service.failover?.healthCheck?.unhealthyInterval || '30s',
            timeout: service.failover?.healthCheck?.timeout || '5s',
            headers: service.failover?.healthCheck?.headers || {},
            followRedirects: service.failover?.healthCheck?.followRedirects ?? true,
            method: service.failover?.healthCheck?.method || 'GET',
            status: service.failover?.healthCheck?.status || 0
          }
        }
      }
      
      setFormData(updatedFormData)
    }
  }, [service])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      let data: any = {
        name: formData.name,
        provider: 'http' as const,
        metadata: {
          type: protocol
        }
      }

      // Build configuration based on service type
      switch (serviceType) {
        case 'loadBalancer':
          if (protocol === 'http') {
            data.loadBalancer = {
              servers: formData.loadBalancer.servers.filter(s => s.url).map(s => ({ url: s.url })),
              passHostHeader: formData.loadBalancer.passHostHeader,
              sticky: formData.loadBalancer.sticky.cookie.enabled 
                ? { cookie: formData.loadBalancer.sticky.cookie }
                : undefined,
              healthCheck: healthCheckEnabled.loadBalancer
                ? formData.loadBalancer.healthCheck
                : undefined,
              passiveHealthCheck: passiveHealthCheckEnabled.loadBalancer
                ? formData.loadBalancer.passiveHealthCheck
                : undefined,
              serversTransport: formData.loadBalancer.serversTransport || undefined,
              responseForwarding: formData.loadBalancer.responseForwarding
            }
          } else if (protocol === 'tcp') {
            data.loadBalancer = {
              servers: formData.loadBalancer.servers.filter(s => s.address).map(s => ({ 
                address: s.address,
                tls: s.tls || false
              })),
              healthCheck: healthCheckEnabled.loadBalancer
                ? formData.loadBalancer.tcpHealthCheck
                : undefined,
              serversTransport: formData.loadBalancer.serversTransport || undefined
            }
          } else if (protocol === 'udp') {
            data.loadBalancer = {
              servers: formData.loadBalancer.servers.filter(s => s.address).map(s => ({ address: s.address }))
            }
          }
          break
        case 'weighted':
          data.weighted = {
            services: formData.weighted.services.filter(s => s.name),
            sticky: formData.weighted.sticky.cookie.enabled
              ? { cookie: formData.weighted.sticky.cookie }
              : undefined,
            healthCheck: healthCheckEnabled.loadBalancer
              ? formData.weighted.healthCheck
              : undefined
          }
          break
        case 'mirroring':
          data.mirroring = {
            service: formData.mirroring.service,
            maxBodySize: formData.mirroring.maxBodySize,
            mirrors: formData.mirroring.mirrors.filter(m => m.name),
            healthCheck: healthCheckEnabled.mirroring
              ? formData.mirroring.healthCheck
              : undefined
          }
          break
        case 'failover':
          data.failover = {
            service: formData.failover.service,
            fallback: formData.failover.fallback,
            healthCheck: healthCheckEnabled.failover
              ? formData.failover.healthCheck
              : undefined
          }
          break
      }

      if (isEditing) {
        await servicesApi.update(protocol, service!.name, data)
        notifications.show({
          title: 'Success',
          message: 'Service updated successfully',
          color: 'green'
        })
      } else {
        await servicesApi.create(protocol, data)
        notifications.show({
          title: 'Success',
          message: 'Service created successfully',
          color: 'green'
        })
      }
      
      queryClient.invalidateQueries({ queryKey: ['services'] })
      navigate('/services')
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

  const addServer = () => {
    setFormData(prev => ({
      ...prev,
      loadBalancer: {
        ...prev.loadBalancer,
        servers: [...prev.loadBalancer.servers, { url: '', weight: 1 }]
      }
    }))
  }

  const removeServer = (index: number) => {
    setFormData(prev => ({
      ...prev,
      loadBalancer: {
        ...prev.loadBalancer,
        servers: prev.loadBalancer.servers.filter((_, i) => i !== index)
      }
    }))
  }

  const updateServer = (index: number, field: 'url' | 'weight', value: any) => {
    setFormData(prev => ({
      ...prev,
      loadBalancer: {
        ...prev.loadBalancer,
        servers: prev.loadBalancer.servers.map((s, i) => 
          i === index ? { ...s, [field]: value } : s
        )
      }
    }))
  }

  const addWeightedService = () => {
    setFormData(prev => ({
      ...prev,
      weighted: {
        ...prev.weighted,
        services: [...prev.weighted.services, { name: '', weight: 1 }]
      }
    }))
  }

  const removeWeightedService = (index: number) => {
    setFormData(prev => ({
      ...prev,
      weighted: {
        ...prev.weighted,
        services: prev.weighted.services.filter((_, i) => i !== index)
      }
    }))
  }

  const updateWeightedService = (index: number, field: 'name' | 'weight', value: any) => {
    setFormData(prev => ({
      ...prev,
      weighted: {
        ...prev.weighted,
        services: prev.weighted.services.map((s, i) =>
          i === index ? { ...s, [field]: value } : s
        )
      }
    }))
  }

  const addMirror = () => {
    setFormData(prev => ({
      ...prev,
      mirroring: {
        ...prev.mirroring,
        mirrors: [...prev.mirroring.mirrors, { name: '', percent: 100 }]
      }
    }))
  }

  const removeMirror = (index: number) => {
    setFormData(prev => ({
      ...prev,
      mirroring: {
        ...prev.mirroring,
        mirrors: prev.mirroring.mirrors.filter((_, i) => i !== index)
      }
    }))
  }

  const updateMirror = (index: number, field: 'name' | 'percent', value: any) => {
    setFormData(prev => ({
      ...prev,
      mirroring: {
        ...prev.mirroring,
        mirrors: prev.mirroring.mirrors.map((m, i) =>
          i === index ? { ...m, [field]: value } : m
        )
      }
    }))
  }

  const breadcrumbs = [
    { title: 'Dashboard', href: '/' },
    { title: 'Services', href: '/services' },
    { title: isEditing ? `Edit ${name}` : 'New Service', href: '#' },
  ].map((item, index) => (
    <Anchor component={Link} to={item.href} key={index}>
      {item.title}
    </Anchor>
  ))

  return (
    <Stack gap="md">
      <Card shadow="sm" radius="md" withBorder>
        <Card.Section withBorder p="md">
          <Group justify="space-between">
            <Group>
              <IconServer size={24} />
              <Text fw={500}>{isEditing ? `Edit Service: ${name}` : 'Create New Service'}</Text>
            </Group>
            <Group>
              <Button
                variant="subtle"
                onClick={() => navigate('/services')}
              >
                Cancel
              </Button>
              <Button
                loading={loading}
                leftSection={<IconDeviceFloppy size={16} />}
                onClick={handleSubmit}
              >
                {isEditing ? 'Update' : 'Create'} Service
              </Button>
            </Group>
          </Group>
        </Card.Section>
        
        <Card.Section p="md">
          <Stack gap="md">
            <TextInput
              label="Service Name"
              required
              disabled={isEditing}
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="my-service"
              description="Unique identifier for this service"
            />

            <div>
              <Text size="sm" fw={500} mb="xs">Protocol</Text>
              <SegmentedControl
                value={protocol}
                onChange={(value) => {
                  const newProtocol = value as 'http' | 'tcp' | 'udp'
                  setProtocol(newProtocol)
                  // Reset to loadBalancer if current service type isn't supported for this protocol
                  if (newProtocol === 'udp' && serviceType !== 'loadBalancer') {
                    // UDP only supports loadBalancer
                    setServiceType('loadBalancer')
                    setFormData(prev => ({ ...prev, type: 'loadBalancer' }))
                  } else if (newProtocol === 'tcp' && (serviceType === 'mirroring' || serviceType === 'failover')) {
                    // TCP supports loadBalancer and weighted only
                    setServiceType('loadBalancer')
                    setFormData(prev => ({ ...prev, type: 'loadBalancer' }))
                  }
                }}
                disabled={isEditing}
                data={[
                  { label: 'HTTP', value: 'http' },
                  { label: 'TCP', value: 'tcp' },
                  { label: 'UDP', value: 'udp' }
                ]}
                mb="sm"
              />
              <Text size="xs" c="dimmed">
                Choose the protocol for this service (cannot be changed after creation)
              </Text>
            </div>

            <div>
              <Text size="sm" fw={500} mb="xs">Service Type</Text>
              <SegmentedControl
                value={serviceType}
                onChange={(value) => {
                  setServiceType(value as typeof serviceType)
                  setFormData(prev => ({ ...prev, type: value as typeof serviceType }))
                }}
                data={
                  protocol === 'udp' 
                    ? [
                        { label: 'Load Balancer', value: 'loadBalancer' }
                      ]
                    : protocol === 'tcp'
                    ? [
                        { label: 'Load Balancer', value: 'loadBalancer' },
                        { label: 'Weighted Round Robin', value: 'weighted' }
                      ]
                    : [
                        { label: 'Load Balancer', value: 'loadBalancer' },
                        { label: 'Weighted Round Robin', value: 'weighted' },
                        { label: 'Mirroring', value: 'mirroring' },
                        { label: 'Failover', value: 'failover' }
                      ]
                }
                disabled={isEditing}
              />
            </div>

            {serviceType === 'loadBalancer' && (
              <Alert icon={<IconAlertCircle size={16} />} color="blue">
                Load Balancer distributes requests across multiple backend servers using round-robin or other strategies.
              </Alert>
            )}
            {serviceType === 'weighted' && (
              <Alert icon={<IconAlertCircle size={16} />} color="blue">
                Weighted Round Robin distributes requests between services based on assigned weights.
              </Alert>
            )}
            {serviceType === 'mirroring' && (
              <Alert icon={<IconAlertCircle size={16} />} color="blue">
                Mirroring duplicates requests to additional services for testing or monitoring purposes.
              </Alert>
            )}
            {serviceType === 'failover' && (
              <Alert icon={<IconAlertCircle size={16} />} color="blue">
                Failover redirects traffic to a backup service when the primary service is unavailable.
              </Alert>
            )}

            <Tabs defaultValue="basic">
              <Tabs.List>
                <Tabs.Tab value="basic" leftSection={<IconSettings size={16} />}>
                  Service Configuration
                </Tabs.Tab>
                {(serviceType === 'loadBalancer' || serviceType === 'weighted') && protocol === 'http' && (
                  <Tabs.Tab value="sticky" leftSection={<IconCookie size={16} />}>
                    Sticky Sessions
                  </Tabs.Tab>
                )}
                {serviceType === 'loadBalancer' && (protocol === 'http' || protocol === 'tcp') && (
                  <Tabs.Tab value="healthcheck" leftSection={<IconHeartbeat size={16} />}>
                    Health Check
                  </Tabs.Tab>
                )}
                {serviceType === 'loadBalancer' && (
                  <Tabs.Tab value="advanced" leftSection={<IconRefreshDot size={16} />}>
                    Advanced Settings
                  </Tabs.Tab>
                )}
              </Tabs.List>

              {/* Basic Configuration Tab */}
              <Tabs.Panel value="basic" pt="xs">
                <Stack>
                  {serviceType === 'loadBalancer' && (
                    <>
                      <Group justify="space-between">
                        <Text size="sm" fw={500}>Backend Servers</Text>
                        <Button
                          size="xs"
                          variant="light"
                          leftSection={<IconPlus size={14} />}
                          onClick={addServer}
                        >
                          Add Server
                        </Button>
                      </Group>
                      {formData.loadBalancer.servers.map((server, index) => (
                        <Group key={index}>
                          <TextInput
                            placeholder={protocol === 'http' ? "http://localhost:8080" : "192.168.1.10:8080"}
                            value={protocol === 'http' ? server.url : server.address}
                            onChange={(e) => updateServer(index, protocol === 'http' ? 'url' : 'address', e.target.value)}
                            style={{ flex: 1 }}
                            required={index === 0}
                            label={index === 0 ? (protocol === 'http' ? "Server URL" : "Server Address") : undefined}
                            description={index === 0 ? (protocol === 'http' ? "URL of the backend server" : "IP:Port of the backend server") : undefined}
                          />
                          {protocol === 'tcp' && (
                            <Checkbox
                              label={index === 0 ? "TLS" : ""}
                              description={index === 0 ? "Enable TLS for this server" : undefined}
                              checked={server.tls}
                              onChange={(e) => updateServer(index, 'tls', e.currentTarget.checked)}
                              mt={index === 0 ? 28 : 0}
                            />
                          )}
                          <NumberInput
                            placeholder="1"
                            value={server.weight}
                            onChange={(value) => updateServer(index, 'weight', value || 1)}
                            min={1}
                            style={{ width: 200 }}
                            label={index === 0 ? "Weight" : undefined}
                            description={index === 0 ? "Server weight for load balancing" : undefined}
                          />
                          {formData.loadBalancer.servers.length > 1 && (
                            <ActionIcon
                              color="red"
                              variant="subtle"
                              onClick={() => removeServer(index)}
                              mt={index === 0 ? 28 : 0}
                            >
                              <IconTrash size={16} />
                            </ActionIcon>
                          )}
                        </Group>
                      ))}
                      {protocol === 'http' && (
                        <Switch
                          label="Pass Host Header"
                          checked={formData.loadBalancer.passHostHeader}
                          onChange={(e) => setFormData({
                            ...formData,
                            loadBalancer: {
                              ...formData.loadBalancer,
                              passHostHeader: e.currentTarget.checked
                            }
                          })}
                          description="Forward the Host header to the backend (HTTP only)"
                        />
                      )}
                    </>
                  )}

                  {serviceType === 'weighted' && (
                    <>
                      <Group justify="space-between">
                        <Text size="sm" fw={500}>Weighted Services</Text>
                        <Button
                          size="xs"
                          variant="light"
                          leftSection={<IconPlus size={14} />}
                          onClick={addWeightedService}
                        >
                          Add Service
                        </Button>
                      </Group>
                      {formData.weighted.services.length === 0 && (
                        <Alert icon={<IconAlertCircle size={16} />} color="yellow">
                          Add at least one service for weighted round-robin load balancing
                        </Alert>
                      )}
                      {formData.weighted.services.map((service, index) => (
                        <Group key={index}>
                          <Select
                            placeholder="Select a service"
                            value={service.name}
                            onChange={(value) => updateWeightedService(index, 'name', value || '')}
                            data={availableServices?.map((s: any) => ({
                              value: s.name,
                              label: s.name
                            })) || []}
                            style={{ flex: 1 }}
                            label={index === 0 ? "Service" : undefined}
                            description={index === 0 ? "Service to include in weighted distribution" : undefined}
                            required
                            searchable
                          />
                          <NumberInput
                            placeholder="1"
                            value={service.weight}
                            onChange={(value) => updateWeightedService(index, 'weight', value || 1)}
                            min={1}
                            style={{ width: 200 }}
                            label={index === 0 ? "Weight" : undefined}
                            description={index === 0 ? "Service weight" : undefined}
                          />
                          {formData.weighted.services.length > 0 && (
                            <ActionIcon
                              color="red"
                              variant="subtle"
                              onClick={() => removeWeightedService(index)}
                              mt={index === 0 ? 28 : 0}
                            >
                              <IconTrash size={16} />
                            </ActionIcon>
                          )}
                        </Group>
                      ))}
                    </>
                  )}

                  {serviceType === 'mirroring' && (
                    <>
                      <Select
                        label="Primary Service"
                        placeholder="Select primary service"
                        value={formData.mirroring.service}
                        onChange={(value) => setFormData({
                          ...formData,
                          mirroring: {
                            ...formData.mirroring,
                            service: value || ''
                          }
                        })}
                        data={availableServices?.map((s: any) => ({
                          value: s.name,
                          label: s.name
                        })) || []}
                        required
                        searchable
                        description="The main service to forward requests to"
                      />
                      
                      <NumberInput
                        label="Max Body Size"
                        value={formData.mirroring.maxBodySize}
                        onChange={(value) => setFormData({
                          ...formData,
                          mirroring: {
                            ...formData.mirroring,
                            maxBodySize: value || -1
                          }
                        })}
                        placeholder="-1"
                        description="Maximum allowed body size for mirrored requests (-1 for unlimited)"
                      />

                      <Divider my="sm" />
                      
                      <Group justify="space-between">
                        <Text size="sm" fw={500}>Mirror Services</Text>
                        <Button
                          size="xs"
                          variant="light"
                          leftSection={<IconPlus size={14} />}
                          onClick={addMirror}
                        >
                          Add Mirror
                        </Button>
                      </Group>
                      {formData.mirroring.mirrors.length === 0 && (
                        <Alert icon={<IconAlertCircle size={16} />} color="yellow">
                          Add at least one mirror service to duplicate requests
                        </Alert>
                      )}
                      {formData.mirroring.mirrors.map((mirror, index) => (
                        <Group key={index}>
                          <Select
                            placeholder="Select mirror service"
                            value={mirror.name}
                            onChange={(value) => updateMirror(index, 'name', value || '')}
                            data={availableServices?.filter((s: any) => 
                              s.name !== formData.mirroring.service
                            ).map((s: any) => ({
                              value: s.name,
                              label: s.name
                            })) || []}
                            style={{ flex: 1 }}
                            label={index === 0 ? "Mirror Service" : undefined}
                            description={index === 0 ? "Service to mirror requests to" : undefined}
                            required
                            searchable
                          />
                          <NumberInput
                            placeholder="100"
                            value={mirror.percent}
                            onChange={(value) => updateMirror(index, 'percent', value || 100)}
                            min={1}
                            max={100}
                            suffix="%"
                            style={{ width: 200 }}
                            label={index === 0 ? "Percentage" : undefined}
                            description={index === 0 ? "% of requests to mirror" : undefined}
                          />
                          <ActionIcon
                            color="red"
                            variant="subtle"
                            onClick={() => removeMirror(index)}
                            mt={index === 0 ? 28 : 0}
                          >
                            <IconTrash size={16} />
                          </ActionIcon>
                        </Group>
                      ))}
                    </>
                  )}

                  {serviceType === 'failover' && (
                    <>
                      <Select
                        label="Primary Service"
                        placeholder="Select primary service"
                        value={formData.failover.service}
                        onChange={(value) => setFormData({
                          ...formData,
                          failover: {
                            ...formData.failover,
                            service: value || ''
                          }
                        })}
                        data={availableServices?.map((s: any) => ({
                          value: s.name,
                          label: s.name
                        })) || []}
                        required
                        searchable
                        description="The main service to forward requests to"
                      />
                      
                      <Select
                        label="Fallback Service"
                        placeholder="Select fallback service"
                        value={formData.failover.fallback}
                        onChange={(value) => setFormData({
                          ...formData,
                          failover: {
                            ...formData.failover,
                            fallback: value || ''
                          }
                        })}
                        data={availableServices?.filter((s: any) => 
                          s.name !== formData.failover.service
                        ).map((s: any) => ({
                          value: s.name,
                          label: s.name
                        })) || []}
                        required
                        searchable
                        description="Service to use when primary service fails"
                      />
                    </>
                  )}
                </Stack>
              </Tabs.Panel>

              {/* Sticky Sessions Tab */}
              {(serviceType === 'loadBalancer' || serviceType === 'weighted') && (
                <Tabs.Panel value="sticky" pt="xs">
                  <Stack>
                    <Switch
                      label="Enable Sticky Sessions"
                      checked={
                        serviceType === 'loadBalancer' 
                          ? formData.loadBalancer.sticky.cookie.enabled
                          : formData.weighted.sticky.cookie.enabled
                      }
                      onChange={(e) => {
                        if (serviceType === 'loadBalancer') {
                          setFormData({
                            ...formData,
                            loadBalancer: {
                              ...formData.loadBalancer,
                              sticky: {
                                cookie: {
                                  ...formData.loadBalancer.sticky.cookie,
                                  enabled: e.currentTarget.checked
                                }
                              }
                            }
                          })
                        } else {
                          setFormData({
                            ...formData,
                            weighted: {
                              ...formData.weighted,
                              sticky: {
                                cookie: {
                                  ...formData.weighted.sticky.cookie,
                                  enabled: e.currentTarget.checked
                                }
                              }
                            }
                          })
                        }
                      }}
                      description="Enable session affinity using cookies"
                    />

                    {((serviceType === 'loadBalancer' && formData.loadBalancer.sticky.cookie.enabled) ||
                      (serviceType === 'weighted' && formData.weighted.sticky.cookie.enabled)) && (
                      <>
                        <TextInput
                          label="Cookie Name"
                          placeholder="traefik_sticky"
                          value={
                            serviceType === 'loadBalancer'
                              ? formData.loadBalancer.sticky.cookie.name
                              : formData.weighted.sticky.cookie.name
                          }
                          onChange={(e) => {
                            if (serviceType === 'loadBalancer') {
                              setFormData({
                                ...formData,
                                loadBalancer: {
                                  ...formData.loadBalancer,
                                  sticky: {
                                    cookie: {
                                      ...formData.loadBalancer.sticky.cookie,
                                      name: e.target.value
                                    }
                                  }
                                }
                              })
                            } else {
                              setFormData({
                                ...formData,
                                weighted: {
                                  ...formData.weighted,
                                  sticky: {
                                    cookie: {
                                      ...formData.weighted.sticky.cookie,
                                      name: e.target.value
                                    }
                                  }
                                }
                              })
                            }
                          }}
                          description="Name of the sticky session cookie"
                        />

                        <TextInput
                          label="Cookie Domain"
                          placeholder="example.com"
                          value={
                            serviceType === 'loadBalancer'
                              ? formData.loadBalancer.sticky.cookie.domain
                              : formData.weighted.sticky.cookie.domain
                          }
                          onChange={(e) => {
                            if (serviceType === 'loadBalancer') {
                              setFormData({
                                ...formData,
                                loadBalancer: {
                                  ...formData.loadBalancer,
                                  sticky: {
                                    cookie: {
                                      ...formData.loadBalancer.sticky.cookie,
                                      domain: e.target.value
                                    }
                                  }
                                }
                              })
                            } else {
                              setFormData({
                                ...formData,
                                weighted: {
                                  ...formData.weighted,
                                  sticky: {
                                    cookie: {
                                      ...formData.weighted.sticky.cookie,
                                      domain: e.target.value
                                    }
                                  }
                                }
                              })
                            }
                          }}
                          description="Domain for the sticky session cookie (optional)"
                        />

                        <NumberInput
                          label="Max Age (seconds)"
                          placeholder="0"
                          value={
                            serviceType === 'loadBalancer'
                              ? formData.loadBalancer.sticky.cookie.maxAge
                              : formData.weighted.sticky.cookie.maxAge
                          }
                          onChange={(value) => {
                            if (serviceType === 'loadBalancer') {
                              setFormData({
                                ...formData,
                                loadBalancer: {
                                  ...formData.loadBalancer,
                                  sticky: {
                                    cookie: {
                                      ...formData.loadBalancer.sticky.cookie,
                                      maxAge: value || 0
                                    }
                                  }
                                }
                              })
                            } else {
                              setFormData({
                                ...formData,
                                weighted: {
                                  ...formData.weighted,
                                  sticky: {
                                    cookie: {
                                      ...formData.weighted.sticky.cookie,
                                      maxAge: value || 0
                                    }
                                  }
                                }
                              })
                            }
                          }}
                          min={0}
                          description="Cookie expiration time in seconds (0 for session cookie)"
                        />

                        <Group grow>
                          <Switch
                            label="Secure Cookie"
                            checked={
                              serviceType === 'loadBalancer'
                                ? formData.loadBalancer.sticky.cookie.secure
                                : formData.weighted.sticky.cookie.secure
                            }
                            onChange={(e) => {
                              if (serviceType === 'loadBalancer') {
                                setFormData({
                                  ...formData,
                                  loadBalancer: {
                                    ...formData.loadBalancer,
                                    sticky: {
                                      cookie: {
                                        ...formData.loadBalancer.sticky.cookie,
                                        secure: e.currentTarget.checked
                                      }
                                    }
                                  }
                                })
                              } else {
                                setFormData({
                                  ...formData,
                                  weighted: {
                                    ...formData.weighted,
                                    sticky: {
                                      cookie: {
                                        ...formData.weighted.sticky.cookie,
                                        secure: e.currentTarget.checked
                                      }
                                    }
                                  }
                                })
                              }
                            }}
                            description="Only send over HTTPS"
                          />

                          <Switch
                            label="HTTP Only"
                            checked={
                              serviceType === 'loadBalancer'
                                ? formData.loadBalancer.sticky.cookie.httpOnly
                                : formData.weighted.sticky.cookie.httpOnly
                            }
                            onChange={(e) => {
                              if (serviceType === 'loadBalancer') {
                                setFormData({
                                  ...formData,
                                  loadBalancer: {
                                    ...formData.loadBalancer,
                                    sticky: {
                                      cookie: {
                                        ...formData.loadBalancer.sticky.cookie,
                                        httpOnly: e.currentTarget.checked
                                      }
                                    }
                                  }
                                })
                              } else {
                                setFormData({
                                  ...formData,
                                  weighted: {
                                    ...formData.weighted,
                                    sticky: {
                                      cookie: {
                                        ...formData.weighted.sticky.cookie,
                                        httpOnly: e.currentTarget.checked
                                      }
                                    }
                                  }
                                })
                              }
                            }}
                            description="Prevent JavaScript access"
                          />
                        </Group>

                        <Select
                          label="Same Site Policy"
                          value={
                            serviceType === 'loadBalancer'
                              ? formData.loadBalancer.sticky.cookie.sameSite
                              : formData.weighted.sticky.cookie.sameSite
                          }
                          onChange={(value) => {
                            if (serviceType === 'loadBalancer') {
                              setFormData({
                                ...formData,
                                loadBalancer: {
                                  ...formData.loadBalancer,
                                  sticky: {
                                    cookie: {
                                      ...formData.loadBalancer.sticky.cookie,
                                      sameSite: value as 'default' | 'none' | 'lax' | 'strict'
                                    }
                                  }
                                }
                              })
                            } else {
                              setFormData({
                                ...formData,
                                weighted: {
                                  ...formData.weighted,
                                  sticky: {
                                    cookie: {
                                      ...formData.weighted.sticky.cookie,
                                      sameSite: value as 'default' | 'none' | 'lax' | 'strict'
                                    }
                                  }
                                }
                              })
                            }
                          }}
                          data={[
                            { value: 'default', label: 'Default' },
                            { value: 'none', label: 'None' },
                            { value: 'lax', label: 'Lax' },
                            { value: 'strict', label: 'Strict' },
                          ]}
                          description="Cross-site request policy"
                        />
                      </>
                    )}
                  </Stack>
                </Tabs.Panel>
              )}

              {/* Health Check Tab */}
              {serviceType === 'loadBalancer' && (
                <Tabs.Panel value="healthcheck" pt="xs">
                  <Stack>
                    <Switch
                      label="Enable Health Check"
                      checked={healthCheckEnabled.loadBalancer}
                      onChange={(e) => setHealthCheckEnabled({
                        ...healthCheckEnabled,
                        loadBalancer: e.currentTarget.checked
                      })}
                      description="Periodically check backend server health"
                    />

                    {healthCheckEnabled.loadBalancer && protocol === 'http' && (
                      <>
                        <TextInput
                          label="Health Check Path"
                          value={formData.loadBalancer.healthCheck.path}
                          onChange={(e) => setFormData({
                            ...formData,
                            loadBalancer: {
                              ...formData.loadBalancer,
                              healthCheck: {
                                ...formData.loadBalancer.healthCheck,
                                path: e.target.value
                              }
                            }
                          })}
                          placeholder="/health"
                          description="Path to check for health status"
                        />

                        <Group grow>
                          <TextInput
                            label="Interval"
                            value={formData.loadBalancer.healthCheck.interval}
                            onChange={(e) => setFormData({
                              ...formData,
                              loadBalancer: {
                                ...formData.loadBalancer,
                                healthCheck: {
                                  ...formData.loadBalancer.healthCheck,
                                  interval: e.target.value
                                }
                              }
                            })}
                            placeholder="30s"
                            description="Time between health checks"
                          />

                          <TextInput
                            label="Timeout"
                            value={formData.loadBalancer.healthCheck.timeout}
                            onChange={(e) => setFormData({
                              ...formData,
                              loadBalancer: {
                                ...formData.loadBalancer,
                                healthCheck: {
                                  ...formData.loadBalancer.healthCheck,
                                  timeout: e.target.value
                                }
                              }
                            })}
                            placeholder="5s"
                            description="Health check timeout"
                          />
                        </Group>

                        <Group grow>
                          <Select
                            label="Scheme"
                            value={formData.loadBalancer.healthCheck.scheme}
                            onChange={(value) => setFormData({
                              ...formData,
                              loadBalancer: {
                                ...formData.loadBalancer,
                                healthCheck: {
                                  ...formData.loadBalancer.healthCheck,
                                  scheme: value as 'http' | 'https'
                                }
                              }
                            })}
                            data={[
                              { value: 'http', label: 'HTTP' },
                              { value: 'https', label: 'HTTPS' }
                            ]}
                            description="Protocol for health check"
                          />

                          <Select
                            label="Method"
                            value={formData.loadBalancer.healthCheck.method}
                            onChange={(value) => setFormData({
                              ...formData,
                              loadBalancer: {
                                ...formData.loadBalancer,
                                healthCheck: {
                                  ...formData.loadBalancer.healthCheck,
                                  method: value || 'GET'
                                }
                              }
                            })}
                            data={[
                              { value: 'GET', label: 'GET' },
                              { value: 'HEAD', label: 'HEAD' },
                              { value: 'POST', label: 'POST' },
                              { value: 'PUT', label: 'PUT' }
                            ]}
                            description="HTTP method to use"
                          />
                        </Group>

                        <Group grow>
                          <TextInput
                            label="Hostname"
                            value={formData.loadBalancer.healthCheck.hostname}
                            onChange={(e) => setFormData({
                              ...formData,
                              loadBalancer: {
                                ...formData.loadBalancer,
                                healthCheck: {
                                  ...formData.loadBalancer.healthCheck,
                                  hostname: e.target.value
                                }
                              }
                            })}
                            placeholder="example.com"
                            description="Override hostname for check (optional)"
                          />

                          <NumberInput
                            label="Port"
                            value={formData.loadBalancer.healthCheck.port}
                            onChange={(value) => setFormData({
                              ...formData,
                              loadBalancer: {
                                ...formData.loadBalancer,
                                healthCheck: {
                                  ...formData.loadBalancer.healthCheck,
                                  port: value || 0
                                }
                              }
                            })}
                            placeholder="0"
                            min={0}
                            max={65535}
                            description="Override port for check (0 = use service port)"
                          />
                        </Group>

                        <Switch
                          label="Follow Redirects"
                          checked={formData.loadBalancer.healthCheck.followRedirects}
                          onChange={(e) => setFormData({
                            ...formData,
                            loadBalancer: {
                              ...formData.loadBalancer,
                              healthCheck: {
                                ...formData.loadBalancer.healthCheck,
                                followRedirects: e.currentTarget.checked
                              }
                            }
                          })}
                          description="Follow HTTP redirects during health check"
                        />
                      </>
                    )}

                    <Divider label="Passive Health Check" labelPosition="left" />
                    
                    <Switch
                      label="Enable Passive Health Check"
                      checked={passiveHealthCheckEnabled.loadBalancer}
                      onChange={(e) => setPassiveHealthCheckEnabled({
                        ...passiveHealthCheckEnabled,
                        loadBalancer: e.currentTarget.checked
                      })}
                      description="Automatically remove unhealthy servers based on real traffic"
                    />

                    {passiveHealthCheckEnabled.loadBalancer && (
                      <>
                        <TextInput
                          label="Failure Window"
                          value={formData.loadBalancer.passiveHealthCheck.failureWindow}
                          onChange={(e) => setFormData({
                            ...formData,
                            loadBalancer: {
                              ...formData.loadBalancer,
                              passiveHealthCheck: {
                                ...formData.loadBalancer.passiveHealthCheck,
                                failureWindow: e.target.value
                              }
                            }
                          })}
                          placeholder="10s"
                          description="Time window for failed attempts and how long server stays unhealthy"
                        />

                        <NumberInput
                          label="Max Failed Attempts"
                          value={formData.loadBalancer.passiveHealthCheck.maxFailedAttempts}
                          onChange={(value) => setFormData({
                            ...formData,
                            loadBalancer: {
                              ...formData.loadBalancer,
                              passiveHealthCheck: {
                                ...formData.loadBalancer.passiveHealthCheck,
                                maxFailedAttempts: value || 1
                              }
                            }
                          })}
                          placeholder="1"
                          min={1}
                          description="Number of consecutive failures before marking server unhealthy"
                        />
                      </>
                    )}

                    {healthCheckEnabled.loadBalancer && protocol === 'tcp' && (
                      <>
                        <TextInput
                          label="Send Data"
                          value={formData.loadBalancer.tcpHealthCheck.send}
                          onChange={(e) => setFormData({
                            ...formData,
                            loadBalancer: {
                              ...formData.loadBalancer,
                              tcpHealthCheck: {
                                ...formData.loadBalancer.tcpHealthCheck,
                                send: e.target.value
                              }
                            }
                          })}
                          placeholder="PING"
                          description="Data to send during health check"
                        />

                        <TextInput
                          label="Expected Response"
                          value={formData.loadBalancer.tcpHealthCheck.expect}
                          onChange={(e) => setFormData({
                            ...formData,
                            loadBalancer: {
                              ...formData.loadBalancer,
                              tcpHealthCheck: {
                                ...formData.loadBalancer.tcpHealthCheck,
                                expect: e.target.value
                              }
                            }
                          })}
                          placeholder="PONG"
                          description="Expected response from server"
                        />

                        <Group grow>
                          <TextInput
                            label="Interval"
                            value={formData.loadBalancer.tcpHealthCheck.interval}
                            onChange={(e) => setFormData({
                              ...formData,
                              loadBalancer: {
                                ...formData.loadBalancer,
                                tcpHealthCheck: {
                                  ...formData.loadBalancer.tcpHealthCheck,
                                  interval: e.target.value
                                }
                              }
                            })}
                            placeholder="30s"
                            description="Health check frequency for healthy targets"
                          />

                          <TextInput
                            label="Unhealthy Interval"
                            value={formData.loadBalancer.tcpHealthCheck.unhealthyInterval}
                            onChange={(e) => setFormData({
                              ...formData,
                              loadBalancer: {
                                ...formData.loadBalancer,
                                tcpHealthCheck: {
                                  ...formData.loadBalancer.tcpHealthCheck,
                                  unhealthyInterval: e.target.value
                                }
                              }
                            })}
                            placeholder="30s"
                            description="Health check frequency for unhealthy targets"
                          />

                          <TextInput
                            label="Timeout"
                            value={formData.loadBalancer.tcpHealthCheck.timeout}
                            onChange={(e) => setFormData({
                              ...formData,
                              loadBalancer: {
                                ...formData.loadBalancer,
                                tcpHealthCheck: {
                                  ...formData.loadBalancer.tcpHealthCheck,
                                  timeout: e.target.value
                                }
                              }
                            })}
                            placeholder="5s"
                            description="Health check timeout"
                          />
                        </Group>

                        <NumberInput
                          label="Health Check Port (optional)"
                          value={formData.loadBalancer.tcpHealthCheck.port || undefined}
                          onChange={(value) => setFormData({
                            ...formData,
                            loadBalancer: {
                              ...formData.loadBalancer,
                              tcpHealthCheck: {
                                ...formData.loadBalancer.tcpHealthCheck,
                                port: value || 0
                              }
                            }
                          })}
                          placeholder="8080"
                          description="Optional port for health checks (if different from service port)"
                          min={0}
                          max={65535}
                        />
                      </>
                    )}
                  </Stack>
                </Tabs.Panel>
              )}

              {/* Advanced Settings Tab */}
              {serviceType === 'loadBalancer' && (
                <Tabs.Panel value="advanced" pt="xs">
                  <Stack>
                    <Select
                      label="TCP Servers Transport"
                      value={formData.loadBalancer.serversTransport}
                      onChange={(value) => setFormData({
                        ...formData,
                        loadBalancer: {
                          ...formData.loadBalancer,
                          serversTransport: value || ''
                        }
                      })}
                      data={[
                        { value: '', label: 'None (Default)' },
                        ...(serverTransports?.map((transport: any) => ({
                          value: transport.name,
                          label: `${transport.name} (${transport.provider})`
                        })) || [])
                      ]}
                      placeholder="Select a transport"
                      description="TCP Server Transport configuration for backend connections (optional)"
                      searchable
                      clearable
                    />

                    {protocol === 'http' && (
                      <TextInput
                        label="Response Forwarding Flush Interval"
                        value={formData.loadBalancer.responseForwarding.flushInterval}
                        onChange={(e) => setFormData({
                          ...formData,
                          loadBalancer: {
                            ...formData.loadBalancer,
                            responseForwarding: {
                              flushInterval: e.target.value
                            }
                          }
                        })}
                        placeholder="100ms"
                        description="Interval for flushing response data to client (HTTP only)"
                      />
                    )}
                  </Stack>
                </Tabs.Panel>
              )}
            </Tabs>
          </Stack>
        </Card.Section>
      </Card>
    </Stack>
  )
}