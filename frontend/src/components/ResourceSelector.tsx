import { useState, useEffect } from 'react'
import { Select, Loader, Group, Badge } from '@mantine/core'
import { useQuery } from '@tanstack/react-query'
import { resourcesApi, Protocol, ResourceType, Resource } from '../lib/api'
import { ProviderIcon } from './ProviderIcon'

export interface ResourceSelectorProps {
  protocol: Protocol
  type: ResourceType
  value: string | null
  onChange: (value: string | null) => void
  label?: string
  description?: string
  placeholder?: string
  required?: boolean
  disabled?: boolean
  error?: string
  clearable?: boolean
}

export function ResourceSelector({
  protocol,
  type,
  value,
  onChange,
  label,
  description,
  placeholder = 'Select a resource',
  required = false,
  disabled = false,
  error,
  clearable = true,
}: ResourceSelectorProps) {
  const { data: resources, isLoading } = useQuery({
    queryKey: ['resources', protocol, type, true],
    queryFn: async () => {
      const response = await resourcesApi.list(protocol, type, true)
      return response.data
    },
  })

  const options = (resources || []).map((resource: Resource) => ({
    value: resource.name,
    label: resource.name,
    provider: resource.provider,
    source: resource.source,
    enabled: resource.enabled,
  }))

  return (
    <Select
      label={label}
      description={description}
      placeholder={placeholder}
      value={value}
      onChange={onChange}
      data={options}
      searchable
      clearable={clearable}
      required={required}
      disabled={disabled || isLoading}
      error={error}
      rightSection={isLoading ? <Loader size="xs" /> : null}
      renderOption={({ option }) => {
        const opt = option as typeof options[0]
        return (
          <Group gap="xs" wrap="nowrap">
            <ProviderIcon provider={opt.provider} />
            <span style={{ flex: 1 }}>{opt.label}</span>
            {opt.source === 'database' && (
              <Badge size="xs" color="blue" variant="light">
                DB
              </Badge>
            )}
            {opt.enabled === false && (
              <Badge size="xs" color="gray" variant="light">
                Disabled
              </Badge>
            )}
          </Group>
        )
      }}
    />
  )
}
