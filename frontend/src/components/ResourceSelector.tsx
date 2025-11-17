import { useState, useEffect, useMemo } from 'react'
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
  // Local state to buffer selection and prevent parent re-renders during interaction
  const [localValue, setLocalValue] = useState<string | null>(value)
  const [dropdownOpened, setDropdownOpened] = useState(false)

  // Sync local state when parent value changes
  useEffect(() => {
    setLocalValue(value)
  }, [value])

  // Only fetch resources when dropdown is opened (lazy load)
  const { data: resources, isLoading } = useQuery({
    queryKey: ['resources', protocol, type, true],
    queryFn: async () => {
      const response = await resourcesApi.list(protocol, type, true)
      return response.data
    },
    enabled: dropdownOpened,
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
    refetchOnWindowFocus: false, // Prevent refetch race during editing
  })

  // Memoize options array to prevent recreation on every render
  const options = useMemo(
    () =>
      (resources || []).map((resource: Resource) => ({
        value: resource.name,
        label: resource.name,
        provider: resource.provider,
        source: resource.source,
        enabled: resource.enabled,
      })),
    [resources]
  )

  // Handle local selection change
  const handleLocalChange = (newValue: string | null) => {
    setLocalValue(newValue)
  }

  // Sync to parent on blur
  const handleBlur = () => {
    if (localValue !== value) {
      onChange(localValue)
    }
  }

  return (
    <Select
      label={label}
      description={description}
      placeholder={isLoading ? 'Loading...' : placeholder}
      value={localValue}
      onChange={handleLocalChange}
      onBlur={handleBlur}
      onDropdownOpen={() => setDropdownOpened(true)}
      onDropdownClose={handleBlur}
      data={options}
      searchable
      clearable={clearable}
      required={required}
      disabled={disabled}
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
