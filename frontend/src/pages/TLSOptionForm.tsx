import { useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Container, Title, Paper, TextInput, Select, MultiSelect, Switch, Button, Group, JsonInput } from '@mantine/core'
import { useForm } from '@mantine/form'
import { notifications } from '@mantine/notifications'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'

interface TLSOptionForm {
  name: string
  min_version?: string
  max_version?: string
  cipher_suites: string[]
  curve_preferences: string[]
  sni_strict: boolean
  prefer_server_cipher_suites: boolean
  client_auth?: string
  alpn_protocols: string[]
}

const TLS_VERSIONS = [
  { value: 'VersionTLS10', label: 'TLS 1.0' },
  { value: 'VersionTLS11', label: 'TLS 1.1' },
  { value: 'VersionTLS12', label: 'TLS 1.2' },
  { value: 'VersionTLS13', label: 'TLS 1.3' }
]

const COMMON_CIPHER_SUITES = [
  'TLS_ECDHE_RSA_WITH_AES_128_GCM_SHA256',
  'TLS_ECDHE_RSA_WITH_AES_256_GCM_SHA384',
  'TLS_ECDHE_RSA_WITH_CHACHA20_POLY1305_SHA256',
  'TLS_AES_128_GCM_SHA256',
  'TLS_AES_256_GCM_SHA384',
  'TLS_CHACHA20_POLY1305_SHA256'
]

const CURVE_PREFERENCES = [
  'X25519',
  'P256',
  'P384',
  'P521'
]

const ALPN_PROTOCOLS = [
  'h2',
  'http/1.1',
  'http/1.0'
]

export default function TLSOptionForm() {
  const { name } = useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const isEdit = !!name

  const form = useForm<TLSOptionForm>({
    initialValues: {
      name: '',
      min_version: '',
      max_version: '',
      cipher_suites: [],
      curve_preferences: [],
      sni_strict: false,
      prefer_server_cipher_suites: false,
      client_auth: '',
      alpn_protocols: []
    },
    validate: {
      name: (value) => (!value ? 'Name is required' : null),
      client_auth: (value) => {
        if (!value) return null
        try {
          if (value) JSON.parse(value)
          return null
        } catch {
          return 'Invalid JSON format'
        }
      }
    }
  })

  // Fetch option data if editing
  const { data: option } = useQuery({
    queryKey: ['tls-option', name],
    queryFn: async () => {
      if (!name) return null
      const response = await api.get(`/tls/options/${name}`)
      return response.data
    },
    enabled: isEdit
  })

  useEffect(() => {
    if (option) {
      form.setValues({
        name: option.name,
        min_version: option.min_version || '',
        max_version: option.max_version || '',
        cipher_suites: option.cipher_suites || [],
        curve_preferences: option.curve_preferences || [],
        sni_strict: option.sni_strict || false,
        prefer_server_cipher_suites: option.prefer_server_cipher_suites || false,
        client_auth: option.client_auth ? JSON.stringify(option.client_auth, null, 2) : '',
        alpn_protocols: option.alpn_protocols || []
      })
    }
  }, [option])

  const createMutation = useMutation({
    mutationFn: async (data: TLSOptionForm) => {
      const payload = {
        ...data,
        min_version: data.min_version || undefined,
        max_version: data.max_version || undefined,
        client_auth: data.client_auth ? JSON.parse(data.client_auth) : undefined
      }
      
      if (isEdit) {
        return api.put(`/tls/options/${name}`, payload)
      } else {
        return api.post('/tls/options', payload)
      }
    },
    onSuccess: () => {
      notifications.show({
        title: 'Success',
        message: `TLS option ${isEdit ? 'updated' : 'created'} successfully`,
        color: 'green'
      })
      queryClient.invalidateQueries({ queryKey: ['tls-options'] })
      navigate('/tls')
    },
    onError: (error: any) => {
      notifications.show({
        title: 'Error',
        message: error.response?.data?.detail || 'Failed to save TLS option',
        color: 'red'
      })
    }
  })

  const handleSubmit = (values: TLSOptionForm) => {
    createMutation.mutate(values)
  }

  return (
    <Container size="xl">
      <Title order={2} mb="lg">
        {isEdit ? 'Edit' : 'Add'} TLS Option
      </Title>

      <Paper shadow="xs" p="md">
        <form onSubmit={form.onSubmit(handleSubmit)}>
          <TextInput
            label="Name"
            description="Unique identifier for this TLS option"
            required
            disabled={isEdit}
            {...form.getInputProps('name')}
            mb="md"
          />

          <Group grow mb="md">
            <Select
              label="Minimum TLS Version"
              description="Minimum allowed TLS version"
              data={TLS_VERSIONS}
              clearable
              {...form.getInputProps('min_version')}
            />

            <Select
              label="Maximum TLS Version"
              description="Maximum allowed TLS version"
              data={TLS_VERSIONS}
              clearable
              {...form.getInputProps('max_version')}
            />
          </Group>

          <MultiSelect
            label="Cipher Suites"
            description="Allowed cipher suites for TLS connections"
            data={COMMON_CIPHER_SUITES}
            searchable
            clearable
            {...form.getInputProps('cipher_suites')}
            mb="md"
          />

          <MultiSelect
            label="Curve Preferences"
            description="Elliptic curve preferences"
            data={CURVE_PREFERENCES}
            searchable
            clearable
            {...form.getInputProps('curve_preferences')}
            mb="md"
          />

          <MultiSelect
            label="ALPN Protocols"
            description="Application-Layer Protocol Negotiation protocols"
            data={ALPN_PROTOCOLS}
            searchable
            clearable
            {...form.getInputProps('alpn_protocols')}
            mb="md"
          />

          <Switch
            label="SNI Strict"
            description="Reject connections without Server Name Indication"
            {...form.getInputProps('sni_strict', { type: 'checkbox' })}
            mb="md"
          />

          <Switch
            label="Prefer Server Cipher Suites"
            description="Server cipher suites take precedence over client preferences"
            {...form.getInputProps('prefer_server_cipher_suites', { type: 'checkbox' })}
            mb="md"
          />

          <JsonInput
            label="Client Authentication"
            description="Client authentication configuration (JSON format)"
            placeholder='{"caFiles": ["/path/to/ca.pem"], "clientAuthType": "RequireAndVerifyClientCert"}'
            minRows={4}
            formatOnBlur
            {...form.getInputProps('client_auth')}
            mb="md"
          />

          <Group justify="flex-end" mt="xl">
            <Button variant="subtle" onClick={() => navigate('/tls')}>
              Cancel
            </Button>
            <Button type="submit" loading={createMutation.isPending}>
              {isEdit ? 'Update' : 'Create'} TLS Option
            </Button>
          </Group>
        </form>
      </Paper>
    </Container>
  )
}