import { MultiSelect, Stack, Paper, Text } from '@mantine/core'
import { useQuery } from '@tanstack/react-query'
import { middlewaresApi } from '@/lib/api'

interface ChainFormProps {
  config: any
  onChange: (config: any) => void
}

export function ChainForm({ config, onChange }: ChainFormProps) {
  const { data: middlewares } = useQuery({
    queryKey: ['middlewares'],
    queryFn: async () => {
      const response = await middlewaresApi.list()
      return response.data
    }
  })

  const middlewareOptions = middlewares?.map(m => ({
    value: m.name,
    label: `${m.name} (${m.type})`
  })) || []

  return (
    <Stack>
      <Paper p="md" radius="sm" withBorder>
        <Text fw={500} mb="sm">Chain Configuration</Text>
        <Stack gap="sm">
          <MultiSelect
            label="Middlewares"
            placeholder="Select middlewares to chain"
            value={config.middlewares || []}
            onChange={(value) => onChange({ ...config, middlewares: value })}
            data={middlewareOptions}
            description="Select middlewares to apply in order"
            searchable
            clearable
            required
          />
          
          <Text size="xs" c="dimmed">
            Middlewares will be executed in the order selected
          </Text>
        </Stack>
      </Paper>
    </Stack>
  )
}