import { useState, useEffect } from 'react'
import { Modal, TextInput, Checkbox, Button, Group, Stack, MultiSelect, NumberInput, Switch } from '@mantine/core'
import { notifications } from '@mantine/notifications'
import { routersApi, Router } from '@/lib/api'

interface RouterModalProps {
  opened: boolean
  onClose: () => void
  router?: Router | null
  onSuccess: () => void
}

export function RouterModal({ opened, onClose, router, onSuccess }: RouterModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    entryPoints: ['web'],
    rule: '',
    service: '',
    priority: 0,
    middlewares: [] as string[],
    tls: false,
    tlsCertResolver: '',
  })
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (router) {
      setFormData({
        name: router.name,
        entryPoints: router.entryPoints || ['web'],
        rule: router.rule,
        service: router.service,
        priority: router.priority || 0,
        middlewares: router.middlewares || [],
        tls: !!router.tls,
        tlsCertResolver: router.tls?.certResolver || '',
      })
    } else {
      setFormData({
        name: '',
        entryPoints: ['web'],
        rule: '',
        service: '',
        priority: 0,
        middlewares: [],
        tls: false,
        tlsCertResolver: '',
      })
    }
  }, [router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const data = {
        name: formData.name,
        entryPoints: formData.entryPoints,
        rule: formData.rule,
        service: formData.service,
        priority: formData.priority || undefined,
        middlewares: formData.middlewares.length > 0 ? formData.middlewares : undefined,
        tls: formData.tls ? {
          certResolver: formData.tlsCertResolver || undefined
        } : undefined,
        provider: 'file' as const,
      }

      if (router) {
        await routersApi.update('file', router.name, data)
        notifications.show({
          title: 'Success',
          message: 'Router updated successfully',
          color: 'green'
        })
      } else {
        await routersApi.create('file', data)
        notifications.show({
          title: 'Success',
          message: 'Router created successfully',
          color: 'green'
        })
      }
      
      onSuccess()
      onClose()
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

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={router ? 'Edit Router' : 'Create Router'}
      size="lg"
    >
      <form onSubmit={handleSubmit}>
        <Stack>
          <TextInput
            label="Name"
            required
            disabled={!!router}
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="my-router"
          />

          <Checkbox.Group
            label="Entry Points"
            value={formData.entryPoints}
            onChange={(value) => setFormData({ ...formData, entryPoints: value as string[] })}
          >
            <Group mt="xs">
              <Checkbox value="web" label="Web (HTTP)" />
              <Checkbox value="websecure" label="WebSecure (HTTPS)" />
            </Group>
          </Checkbox.Group>

          <TextInput
            label="Rule"
            required
            value={formData.rule}
            onChange={(e) => setFormData({ ...formData, rule: e.target.value })}
            placeholder="Host(`example.com`) || Path(`/api`)"
            description="Traefik rule for routing requests"
          />

          <TextInput
            label="Service"
            required
            value={formData.service}
            onChange={(e) => setFormData({ ...formData, service: e.target.value })}
            placeholder="my-service"
            description="Name of the backend service"
          />

          <NumberInput
            label="Priority"
            value={formData.priority}
            onChange={(value) => setFormData({ ...formData, priority: value || 0 })}
            placeholder="100"
            description="Higher priority rules are evaluated first (optional)"
            min={0}
          />

          <MultiSelect
            label="Middlewares"
            value={formData.middlewares}
            onChange={(value) => setFormData({ ...formData, middlewares: value })}
            data={[
              ...formData.middlewares.map(m => ({ value: m, label: m })),
              { value: 'auth', label: 'auth' },
              { value: 'compress', label: 'compress' },
              { value: 'ratelimit', label: 'ratelimit' },
              { value: 'redirect', label: 'redirect' },
              { value: 'headers', label: 'headers' },
            ].filter((item, index, self) => 
              index === self.findIndex((t) => t.value === item.value)
            )}
            placeholder="Select or type middleware names"
            description="Comma-separated list of middlewares (optional)"
            searchable
            clearable
          />

          <Switch
            label="Enable TLS"
            checked={formData.tls}
            onChange={(e) => setFormData({ ...formData, tls: e.currentTarget.checked })}
          />

          {formData.tls && (
            <TextInput
              label="Certificate Resolver"
              value={formData.tlsCertResolver}
              onChange={(e) => setFormData({ ...formData, tlsCertResolver: e.target.value })}
              placeholder="letsencrypt"
              description="Name of the certificate resolver (optional)"
            />
          )}

          <Group justify="flex-end" mt="md">
            <Button variant="default" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" loading={loading}>
              {router ? 'Update' : 'Create'}
            </Button>
          </Group>
        </Stack>
      </form>
    </Modal>
  )
}