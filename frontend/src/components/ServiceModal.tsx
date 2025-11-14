import { useState, useEffect } from 'react'
import { Modal, TextInput, Checkbox, Button, Group, Stack, Select } from '@mantine/core'
import { notifications } from '@mantine/notifications'
import { servicesApi, Service } from '@/lib/api'

interface ServiceModalProps {
  opened: boolean
  onClose: () => void
  service?: Service | null
  onSuccess: () => void
}

export function ServiceModal({ opened, onClose, service, onSuccess }: ServiceModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    loadBalancer: {
      servers: [{ url: '' }],
      sticky: {
        cookie: {
          enabled: false,
          name: '',
          secure: false,
          httpOnly: true,
          sameSite: 'none' as 'none' | 'lax' | 'strict',
        }
      },
      passHostHeader: true,
    }
  })
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (service) {
      setFormData({
        name: service.name,
        loadBalancer: service.loadBalancer || {
          servers: [{ url: '' }],
          sticky: {
            cookie: {
              enabled: false,
              name: '',
              secure: false,
              httpOnly: true,
              sameSite: 'none',
            }
          },
          passHostHeader: true,
        }
      })
    } else {
      setFormData({
        name: '',
        loadBalancer: {
          servers: [{ url: '' }],
          sticky: {
            cookie: {
              enabled: false,
              name: '',
              secure: false,
              httpOnly: true,
              sameSite: 'none',
            }
          },
          passHostHeader: true,
        }
      })
    }
  }, [service])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const data = {
        name: formData.name,
        loadBalancer: {
          servers: formData.loadBalancer.servers.filter(s => s.url),
          passHostHeader: formData.loadBalancer.passHostHeader,
          sticky: formData.loadBalancer.sticky.cookie.enabled 
            ? { cookie: formData.loadBalancer.sticky.cookie }
            : undefined
        },
        provider: 'file' as const,
      }

      if (service) {
        await servicesApi.update('http', service.name, data)
        notifications.show({
          title: 'Success',
          message: 'Service updated successfully',
          color: 'green',
        })
      } else {
        await servicesApi.create('http', data)
        notifications.show({
          title: 'Success',
          message: 'Service created successfully',
          color: 'green',
        })
      }
      
      onSuccess()
      onClose()
    } catch (error: any) {
      notifications.show({
        title: 'Error',
        message: error.response?.data?.detail || 'An error occurred',
        color: 'red',
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
        servers: [...prev.loadBalancer.servers, { url: '' }]
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

  const updateServer = (index: number, url: string) => {
    setFormData(prev => ({
      ...prev,
      loadBalancer: {
        ...prev.loadBalancer,
        servers: prev.loadBalancer.servers.map((s, i) => 
          i === index ? { url } : s
        )
      }
    }))
  }

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={service ? 'Edit Service' : 'Create Service'}
      size="lg"
    >
      <form onSubmit={handleSubmit}>
        <Stack gap="md">
          <TextInput
            label="Name"
            required
            disabled={!!service}
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          />

          <Stack gap="xs">
            <label style={{ fontSize: '14px', fontWeight: 500 }}>Servers</label>
            {formData.loadBalancer.servers.map((server, index) => (
              <Group key={index} gap="xs">
                <TextInput
                  flex={1}
                  type="url"
                  value={server.url}
                  onChange={(e) => updateServer(index, e.target.value)}
                  placeholder="http://localhost:8080"
                  required={index === 0}
                />
                {formData.loadBalancer.servers.length > 1 && (
                  <Button
                    variant="subtle"
                    color="red"
                    onClick={() => removeServer(index)}
                    size="sm"
                  >
                    Remove
                  </Button>
                )}
              </Group>
            ))}
            <Button
              variant="subtle"
              onClick={addServer}
              size="sm"
            >
              + Add Server
            </Button>
          </Stack>

          <Checkbox
            label="Pass Host Header"
            checked={formData.loadBalancer.passHostHeader}
            onChange={(event) => setFormData({
              ...formData,
              loadBalancer: {
                ...formData.loadBalancer,
                passHostHeader: event.currentTarget.checked
              }
            })}
          />

          <Checkbox
            label="Enable Sticky Sessions"
            checked={formData.loadBalancer.sticky.cookie.enabled}
            onChange={(event) => setFormData({
              ...formData,
              loadBalancer: {
                ...formData.loadBalancer,
                sticky: {
                  cookie: {
                    ...formData.loadBalancer.sticky.cookie,
                    enabled: event.currentTarget.checked
                  }
                }
              }
            })}
          />

          {formData.loadBalancer.sticky.cookie.enabled && (
            <Stack gap="md" pl="md">
              <TextInput
                label="Cookie Name"
                value={formData.loadBalancer.sticky.cookie.name}
                onChange={(e) => setFormData({
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
                })}
                placeholder="traefik_sticky"
              />

              <Group gap="md">
                <Checkbox
                  label="Secure"
                  checked={formData.loadBalancer.sticky.cookie.secure}
                  onChange={(event) => setFormData({
                    ...formData,
                    loadBalancer: {
                      ...formData.loadBalancer,
                      sticky: {
                        cookie: {
                          ...formData.loadBalancer.sticky.cookie,
                          secure: event.currentTarget.checked
                        }
                      }
                    }
                  })}
                />

                <Checkbox
                  label="HTTP Only"
                  checked={formData.loadBalancer.sticky.cookie.httpOnly}
                  onChange={(event) => setFormData({
                    ...formData,
                    loadBalancer: {
                      ...formData.loadBalancer,
                      sticky: {
                        cookie: {
                          ...formData.loadBalancer.sticky.cookie,
                          httpOnly: event.currentTarget.checked
                        }
                      }
                    }
                  })}
                />
              </Group>

              <Select
                label="Same Site"
                value={formData.loadBalancer.sticky.cookie.sameSite}
                onChange={(value) => setFormData({
                  ...formData,
                  loadBalancer: {
                    ...formData.loadBalancer,
                    sticky: {
                      cookie: {
                        ...formData.loadBalancer.sticky.cookie,
                        sameSite: (value as 'none' | 'lax' | 'strict') || 'none'
                      }
                    }
                  }
                })}
                data={[
                  { value: 'none', label: 'None' },
                  { value: 'lax', label: 'Lax' },
                  { value: 'strict', label: 'Strict' },
                ]}
              />
            </Stack>
          )}

          <Group justify="flex-end" mt="md">
            <Button variant="default" onClick={onClose}>
              Cancel
            </Button>
            <Button
              type="submit"
              loading={loading}
            >
              {service ? 'Update' : 'Create'}
            </Button>
          </Group>
        </Stack>
      </form>
    </Modal>
  )
}