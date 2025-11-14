import { useState, useEffect } from 'react'
import { Modal, TextInput, Select, Button, Group, Stack, ScrollArea } from '@mantine/core'
import { notifications } from '@mantine/notifications'
import { middlewaresApi, Middleware } from '@/lib/api'

// Import all middleware forms
import { BasicAuthForm } from './middleware-forms/BasicAuthForm'
import { HeadersForm } from './middleware-forms/HeadersForm'
import { RateLimitForm } from './middleware-forms/RateLimitForm'
import { RedirectForm } from './middleware-forms/RedirectForm'
import { PathForm } from './middleware-forms/PathForm'
import { CompressForm } from './middleware-forms/CompressForm'
import { IPAllowListForm } from './middleware-forms/IPAllowListForm'
import { RetryForm } from './middleware-forms/RetryForm'
import { CircuitBreakerForm } from './middleware-forms/CircuitBreakerForm'
import { BufferingForm } from './middleware-forms/BufferingForm'
import { ForwardAuthForm } from './middleware-forms/ForwardAuthForm'
import { InFlightReqForm } from './middleware-forms/InFlightReqForm'
import { ChainForm } from './middleware-forms/ChainForm'

interface MiddlewareModalProps {
  opened: boolean
  onClose: () => void
  middleware?: Middleware | null
  onSuccess: () => void
}

const middlewareTypes = [
  { value: 'addPrefix', label: 'Add Prefix', description: 'Add a prefix to the path' },
  { value: 'basicAuth', label: 'Basic Auth', description: 'Add Basic Authentication' },
  { value: 'buffering', label: 'Buffering', description: 'Buffer requests and responses' },
  { value: 'chain', label: 'Chain', description: 'Combine multiple middlewares' },
  { value: 'circuitBreaker', label: 'Circuit Breaker', description: 'Stop calling unhealthy services' },
  { value: 'compress', label: 'Compress', description: 'Compress responses' },
  { value: 'forwardAuth', label: 'Forward Auth', description: 'Delegate authentication' },
  { value: 'headers', label: 'Headers', description: 'Add/remove/modify headers' },
  { value: 'ipAllowList', label: 'IP Allow List', description: 'Restrict access by IP' },
  { value: 'inFlightReq', label: 'In-Flight Requests', description: 'Limit concurrent requests' },
  { value: 'rateLimit', label: 'Rate Limit', description: 'Limit request rate' },
  { value: 'redirectScheme', label: 'Redirect Scheme', description: 'Redirect to different scheme' },
  { value: 'redirectRegex', label: 'Redirect Regex', description: 'Redirect using regex' },
  { value: 'replacePath', label: 'Replace Path', description: 'Replace the entire path' },
  { value: 'replacePathRegex', label: 'Replace Path Regex', description: 'Replace path using regex' },
  { value: 'retry', label: 'Retry', description: 'Retry requests on failure' },
  { value: 'stripPrefix', label: 'Strip Prefix', description: 'Remove prefix from path' },
  { value: 'stripPrefixRegex', label: 'Strip Prefix Regex', description: 'Remove prefix using regex' },
]

export function MiddlewareModal({ opened, onClose, middleware, onSuccess }: MiddlewareModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    type: 'headers',
    config: {}
  })
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (middleware) {
      setFormData({
        name: middleware.name,
        type: middleware.type,
        config: middleware.config || {}
      })
    } else {
      setFormData({
        name: '',
        type: 'headers',
        config: {}
      })
    }
  }, [middleware])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const data = {
        name: formData.name,
        type: formData.type,
        config: formData.config,
        provider: 'file' as const,
      }

      if (middleware) {
        await middlewaresApi.update('file', middleware.name, data)
        notifications.show({
          title: 'Success',
          message: 'Middleware updated successfully',
          color: 'green'
        })
      } else {
        await middlewaresApi.create('file', data)
        notifications.show({
          title: 'Success',
          message: 'Middleware created successfully',
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

  const renderForm = () => {
    switch (formData.type) {
      case 'basicAuth':
        return <BasicAuthForm config={formData.config} onChange={(config) => setFormData({ ...formData, config })} />
      case 'headers':
        return <HeadersForm config={formData.config} onChange={(config) => setFormData({ ...formData, config })} />
      case 'rateLimit':
        return <RateLimitForm config={formData.config} onChange={(config) => setFormData({ ...formData, config })} />
      case 'redirectScheme':
        return <RedirectForm type="redirectScheme" config={formData.config} onChange={(config) => setFormData({ ...formData, config })} />
      case 'redirectRegex':
        return <RedirectForm type="redirectRegex" config={formData.config} onChange={(config) => setFormData({ ...formData, config })} />
      case 'addPrefix':
        return <PathForm type="addPrefix" config={formData.config} onChange={(config) => setFormData({ ...formData, config })} />
      case 'stripPrefix':
        return <PathForm type="stripPrefix" config={formData.config} onChange={(config) => setFormData({ ...formData, config })} />
      case 'stripPrefixRegex':
        return <PathForm type="stripPrefixRegex" config={formData.config} onChange={(config) => setFormData({ ...formData, config })} />
      case 'replacePath':
        return <PathForm type="replacePath" config={formData.config} onChange={(config) => setFormData({ ...formData, config })} />
      case 'replacePathRegex':
        return <PathForm type="replacePathRegex" config={formData.config} onChange={(config) => setFormData({ ...formData, config })} />
      case 'compress':
        return <CompressForm config={formData.config} onChange={(config) => setFormData({ ...formData, config })} />
      case 'ipAllowList':
        return <IPAllowListForm config={formData.config} onChange={(config) => setFormData({ ...formData, config })} />
      case 'retry':
        return <RetryForm config={formData.config} onChange={(config) => setFormData({ ...formData, config })} />
      case 'circuitBreaker':
        return <CircuitBreakerForm config={formData.config} onChange={(config) => setFormData({ ...formData, config })} />
      case 'buffering':
        return <BufferingForm config={formData.config} onChange={(config) => setFormData({ ...formData, config })} />
      case 'forwardAuth':
        return <ForwardAuthForm config={formData.config} onChange={(config) => setFormData({ ...formData, config })} />
      case 'inFlightReq':
        return <InFlightReqForm config={formData.config} onChange={(config) => setFormData({ ...formData, config })} />
      case 'chain':
        return <ChainForm config={formData.config} onChange={(config) => setFormData({ ...formData, config })} />
      default:
        return <div>Form not implemented for {formData.type}</div>
    }
  }

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={middleware ? 'Edit Middleware' : 'Create Middleware'}
      size="xl"
    >
      <form onSubmit={handleSubmit}>
        <Stack>
          <TextInput
            label="Name"
            required
            disabled={!!middleware}
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="my-middleware"
          />

          <Select
            label="Type"
            required
            disabled={!!middleware}
            value={formData.type}
            onChange={(value) => setFormData({ ...formData, type: value || 'headers', config: {} })}
            data={middlewareTypes}
            searchable
          />

          <ScrollArea h={400}>
            {renderForm()}
          </ScrollArea>

          <Group justify="flex-end" mt="md">
            <Button variant="default" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" loading={loading}>
              {middleware ? 'Update' : 'Create'}
            </Button>
          </Group>
        </Stack>
      </form>
    </Modal>
  )
}