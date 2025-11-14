import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Alert, Loader, Stack, Text } from '@mantine/core'
import { IconAlertCircle } from '@tabler/icons-react'
import { resourcesApi, Protocol } from '@/lib/api'
import { extractSubtypeSchema } from '@/lib/schemaResolver'
import { SchemaForm } from './SchemaForm'

interface ServiceSchemaFormProps {
  protocol: Protocol
  subtype: 'loadBalancer' | 'weighted' | 'mirroring' | 'failover'
  value: Record<string, any>
  onChange: (value: Record<string, any>) => void
  disabled?: boolean
}

/**
 * Wrapper around SchemaForm that handles service subtype schema extraction
 * Resolves $defs and extracts only the relevant subtype schema (e.g., loadBalancer)
 */
export function ServiceSchemaForm({
  protocol,
  subtype,
  value,
  onChange,
  disabled = false,
}: ServiceSchemaFormProps) {
  const { data: fullSchema, isLoading, error } = useQuery({
    queryKey: ['schema', protocol, 'services'],
    queryFn: async () => {
      const response = await resourcesApi.getSchema(protocol, 'services')
      return response.data
    },
  })

  // Extract and resolve the specific subtype schema
  const subtypeSchema = useMemo(() => {
    if (!fullSchema) return null

    try {
      console.log('Full schema:', fullSchema)
      // Extract just the subtype schema from the oneOf
      const extracted = extractSubtypeSchema(fullSchema, subtype)
      console.log(`Extracted ${subtype} schema:`, extracted)
      return extracted
    } catch (err) {
      console.error('Failed to extract subtype schema:', err)
      return null
    }
  }, [fullSchema, subtype])

  if (isLoading) {
    return (
      <Stack align="center" p="xl">
        <Loader />
        <Text c="dimmed" size="sm">Loading schema...</Text>
      </Stack>
    )
  }

  if (error) {
    return (
      <Alert icon={<IconAlertCircle />} title="Error loading schema" color="red">
        Failed to load schema for {protocol} services. Please try again.
      </Alert>
    )
  }

  if (!subtypeSchema) {
    return (
      <Alert icon={<IconAlertCircle />} title="Invalid schema" color="yellow">
        Could not extract schema for {subtype} service type.
      </Alert>
    )
  }

  // Pass the resolved subtype schema to SchemaForm
  return (
    <SchemaForm
      protocol={protocol}
      type="services"
      value={value}
      onChange={onChange}
      disabled={disabled}
      resolvedSchema={subtypeSchema}
    />
  )
}
