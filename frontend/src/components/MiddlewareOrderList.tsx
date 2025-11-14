import { useState } from 'react'
import {
  Group,
  Button,
  ActionIcon,
  Paper,
  Text,
  Badge,
  Select,
  Loader,
  Stack,
} from '@mantine/core'
import { IconPlus, IconTrash, IconGripVertical } from '@tabler/icons-react'
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd'
import { useQuery } from '@tanstack/react-query'
import { resourcesApi, Protocol, Resource } from '../lib/api'
import { ProviderIcon } from './ProviderIcon'

export interface MiddlewareOrderListProps {
  protocol: Protocol
  value: string[]
  onChange: (value: string[]) => void
  label?: string
  description?: string
  error?: string
  disabled?: boolean
}

export function MiddlewareOrderList({
  protocol,
  value,
  onChange,
  label = 'Middlewares',
  description = 'Order matters: middlewares are executed in the order they appear',
  error,
  disabled = false,
}: MiddlewareOrderListProps) {
  const [selectedMiddleware, setSelectedMiddleware] = useState<string | null>(null)

  const { data: middlewares, isLoading } = useQuery({
    queryKey: ['resources', protocol, 'middlewares', true],
    queryFn: async () => {
      const response = await resourcesApi.list(protocol, 'middlewares', true)
      return response.data
    },
  })

  const availableMiddlewares = (middlewares || [])
    .filter((m: Resource) => !value.includes(m.name))
    .map((m: Resource) => ({
      value: m.name,
      label: m.name,
      provider: m.provider,
      source: m.source,
      enabled: m.enabled,
    }))

  const handleAdd = () => {
    if (selectedMiddleware && !value.includes(selectedMiddleware)) {
      onChange([...value, selectedMiddleware])
      setSelectedMiddleware(null)
    }
  }

  const handleRemove = (index: number) => {
    const newValue = [...value]
    newValue.splice(index, 1)
    onChange(newValue)
  }

  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return

    const items = Array.from(value)
    const [reorderedItem] = items.splice(result.source.index, 1)
    items.splice(result.destination.index, 0, reorderedItem)

    onChange(items)
  }

  const getMiddlewareInfo = (name: string) => {
    return middlewares?.find((m: Resource) => m.name === name)
  }

  return (
    <div>
      <Text size="sm" fw={500} mb="xs">
        {label}
      </Text>
      {description && (
        <Text size="xs" c="dimmed" mb="md">
          {description}
        </Text>
      )}

      <Stack gap="md">
        {/* Add middleware section */}
        <Group gap="xs">
          <Select
            placeholder="Select middleware to add"
            value={selectedMiddleware}
            onChange={setSelectedMiddleware}
            data={availableMiddlewares}
            searchable
            clearable
            disabled={disabled || isLoading}
            rightSection={isLoading ? <Loader size="xs" /> : null}
            style={{ flex: 1 }}
            renderOption={({ option }) => {
              const opt = option as typeof availableMiddlewares[0]
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
          <Button
            leftSection={<IconPlus size={16} />}
            onClick={handleAdd}
            disabled={!selectedMiddleware || disabled}
          >
            Add
          </Button>
        </Group>

        {/* Selected middlewares list */}
        {value.length > 0 ? (
          <DragDropContext onDragEnd={handleDragEnd}>
            <Droppable droppableId="middlewares">
              {(provided) => (
                <div {...provided.droppableProps} ref={provided.innerRef}>
                  <Stack gap="xs">
                    {value.map((middlewareName, index) => {
                      const info = getMiddlewareInfo(middlewareName)
                      return (
                        <Draggable
                          key={middlewareName}
                          draggableId={middlewareName}
                          index={index}
                          isDragDisabled={disabled}
                        >
                          {(provided, snapshot) => (
                            <Paper
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              p="sm"
                              withBorder
                              style={{
                                ...provided.draggableProps.style,
                                backgroundColor: snapshot.isDragging
                                  ? 'var(--mantine-color-blue-light)'
                                  : undefined,
                              }}
                            >
                              <Group gap="xs" wrap="nowrap">
                                <div {...provided.dragHandleProps}>
                                  <IconGripVertical size={18} style={{ cursor: 'grab' }} />
                                </div>

                                <Badge size="sm" variant="light" color="gray">
                                  {index + 1}
                                </Badge>

                                {info && <ProviderIcon provider={info.provider} />}

                                <Text size="sm" style={{ flex: 1 }}>
                                  {middlewareName}
                                </Text>

                                {info?.source === 'database' && (
                                  <Badge size="xs" color="blue" variant="light">
                                    DB
                                  </Badge>
                                )}

                                {info?.enabled === false && (
                                  <Badge size="xs" color="gray" variant="light">
                                    Disabled
                                  </Badge>
                                )}

                                <ActionIcon
                                  variant="subtle"
                                  color="red"
                                  onClick={() => handleRemove(index)}
                                  disabled={disabled}
                                >
                                  <IconTrash size={16} />
                                </ActionIcon>
                              </Group>
                            </Paper>
                          )}
                        </Draggable>
                      )
                    })}
                    {provided.placeholder}
                  </Stack>
                </div>
              )}
            </Droppable>
          </DragDropContext>
        ) : (
          <Paper p="md" withBorder style={{ textAlign: 'center' }}>
            <Text size="sm" c="dimmed">
              No middlewares selected. Add middlewares above.
            </Text>
          </Paper>
        )}
      </Stack>

      {error && (
        <Text size="xs" c="red" mt="xs">
          {error}
        </Text>
      )}
    </div>
  )
}
