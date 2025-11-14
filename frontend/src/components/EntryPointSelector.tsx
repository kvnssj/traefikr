import { MultiSelect, Loader } from '@mantine/core'
import { useQuery } from '@tanstack/react-query'
import { entrypointsApi } from '../lib/api'

export interface EntryPointSelectorProps {
  value: string[]
  onChange: (value: string[]) => void
  label?: string
  description?: string
  placeholder?: string
  required?: boolean
  disabled?: boolean
  error?: string
}

export function EntryPointSelector({
  value,
  onChange,
  label = 'Entry Points',
  description,
  placeholder = 'Select entry points',
  required = false,
  disabled = false,
  error,
}: EntryPointSelectorProps) {
  const { data: entrypoints, isLoading } = useQuery({
    queryKey: ['entrypoints'],
    queryFn: async () => {
      const response = await entrypointsApi.list()
      return response.data
    },
  })

  const options = (entrypoints || []).map((ep) => ep.name)

  return (
    <MultiSelect
      label={label}
      description={description}
      placeholder={placeholder}
      value={value}
      onChange={onChange}
      data={options}
      searchable
      clearable
      required={required}
      disabled={disabled || isLoading}
      error={error}
      rightSection={isLoading ? <Loader size="xs" /> : null}
    />
  )
}
