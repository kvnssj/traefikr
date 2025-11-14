import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Container, Title, Paper, TextInput, Textarea, MultiSelect, Button, Group, Tabs } from '@mantine/core'
import { useForm } from '@mantine/form'
import { notifications } from '@mantine/notifications'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { IconFile, IconCode } from '@tabler/icons-react'
import { api } from '@/lib/api'

interface TLSCertificateForm {
  name: string
  cert_file?: string
  key_file?: string
  cert_content?: string
  key_content?: string
  stores: string[]
}

export default function TLSCertificateForm() {
  const { name } = useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const isEdit = !!name
  const [contentMode, setContentMode] = useState<string | null>('file')

  const form = useForm<TLSCertificateForm>({
    initialValues: {
      name: '',
      cert_file: '',
      key_file: '',
      cert_content: '',
      key_content: '',
      stores: []
    },
    validate: {
      name: (value) => (!value ? 'Name is required' : null),
      cert_file: (value, values) => 
        contentMode === 'file' && !value && !values.cert_content ? 'Certificate file or content is required' : null,
      key_file: (value, values) => 
        contentMode === 'file' && !value && !values.key_content ? 'Key file or content is required' : null,
      cert_content: (value, values) => 
        contentMode === 'content' && !value && !values.cert_file ? 'Certificate content or file is required' : null,
      key_content: (value, values) => 
        contentMode === 'content' && !value && !values.key_file ? 'Key content or file is required' : null,
    }
  })

  // Fetch certificate data if editing
  const { data: certificate } = useQuery({
    queryKey: ['tls-certificate', name],
    queryFn: async () => {
      if (!name) return null
      const response = await api.get(`/tls/certificates/${name}`)
      return response.data
    },
    enabled: isEdit
  })

  // Fetch available stores
  const { data: stores } = useQuery({
    queryKey: ['tls-stores'],
    queryFn: async () => {
      try {
        const response = await api.get('/tls/stores')
        return response.data.map((store: any) => store.name)
      } catch {
        return ['default']
      }
    }
  })

  useEffect(() => {
    if (certificate) {
      form.setValues({
        name: certificate.name,
        cert_file: certificate.cert_file || '',
        key_file: certificate.key_file || '',
        cert_content: '',
        key_content: '',
        stores: certificate.stores || []
      })
      setContentMode(certificate.cert_file ? 'file' : 'content')
    }
  }, [certificate])

  const createMutation = useMutation({
    mutationFn: async (data: TLSCertificateForm) => {
      const payload = contentMode === 'file' 
        ? { ...data, cert_content: undefined, key_content: undefined }
        : { ...data, cert_file: undefined, key_file: undefined }
      
      if (isEdit) {
        return api.put(`/tls/certificates/${name}`, payload)
      } else {
        return api.post('/tls/certificates', payload)
      }
    },
    onSuccess: () => {
      notifications.show({
        title: 'Success',
        message: `Certificate ${isEdit ? 'updated' : 'created'} successfully`,
        color: 'green'
      })
      queryClient.invalidateQueries({ queryKey: ['tls-certificates'] })
      navigate('/tls')
    },
    onError: (error: any) => {
      notifications.show({
        title: 'Error',
        message: error.response?.data?.detail || 'Failed to save certificate',
        color: 'red'
      })
    }
  })

  const handleSubmit = (values: TLSCertificateForm) => {
    createMutation.mutate(values)
  }

  return (
    <Container size="xl">
      <Title order={2} mb="lg">
        {isEdit ? 'Edit' : 'Add'} TLS Certificate
      </Title>

      <Paper shadow="xs" p="md">
        <form onSubmit={form.onSubmit(handleSubmit)}>
          <TextInput
            label="Name"
            description="Unique identifier for this certificate"
            required
            disabled={isEdit}
            {...form.getInputProps('name')}
            mb="md"
          />

          <Tabs value={contentMode} onChange={setContentMode} mb="md">
            <Tabs.List>
              <Tabs.Tab value="file" leftSection={<IconFile size={16} />}>
                File Path
              </Tabs.Tab>
              <Tabs.Tab value="content" leftSection={<IconCode size={16} />}>
                Inline Content
              </Tabs.Tab>
            </Tabs.List>

            <Tabs.Panel value="file" pt="md">
              <TextInput
                label="Certificate File"
                description="Path to the certificate file (.crt, .pem)"
                placeholder="/path/to/cert.pem"
                {...form.getInputProps('cert_file')}
                mb="md"
              />

              <TextInput
                label="Key File"
                description="Path to the private key file (.key, .pem)"
                placeholder="/path/to/key.pem"
                {...form.getInputProps('key_file')}
                mb="md"
              />
            </Tabs.Panel>

            <Tabs.Panel value="content" pt="md">
              <Textarea
                label="Certificate Content"
                description="Paste the certificate content (PEM format)"
                placeholder="-----BEGIN CERTIFICATE-----"
                minRows={6}
                {...form.getInputProps('cert_content')}
                mb="md"
              />

              <Textarea
                label="Key Content"
                description="Paste the private key content (PEM format)"
                placeholder="-----BEGIN PRIVATE KEY-----"
                minRows={6}
                {...form.getInputProps('key_content')}
                mb="md"
              />
            </Tabs.Panel>
          </Tabs>

          <MultiSelect
            label="TLS Stores"
            description="Select which TLS stores should use this certificate"
            data={stores || ['default']}
            {...form.getInputProps('stores')}
            mb="md"
          />

          <Group justify="flex-end" mt="xl">
            <Button variant="subtle" onClick={() => navigate('/tls')}>
              Cancel
            </Button>
            <Button type="submit" loading={createMutation.isPending}>
              {isEdit ? 'Update' : 'Create'} Certificate
            </Button>
          </Group>
        </form>
      </Paper>
    </Container>
  )
}