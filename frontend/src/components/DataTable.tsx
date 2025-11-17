import { useState, useMemo } from 'react'
import {
  Table,
  TextInput,
  Group,
  ActionIcon,
  Badge,
  Checkbox,
  Menu,
  Button,
  ScrollArea,
} from '@mantine/core'
import {
  IconSearch,
  IconEdit,
  IconTrash,
  IconFilter,
  IconSortAscending,
  IconSortDescending,
  IconEye,
} from '@tabler/icons-react'

export interface Column<T = any> {
  key: string
  label: string
  sortable?: boolean
  render?: (value: any, row: T) => React.ReactNode
  width?: string | number
}

export interface DataTableProps<T = any> {
  columns: Column<T>[]
  data: T[]
  isLoading?: boolean
  onRowClick?: (row: T) => void
  onEdit?: (row: T) => void
  onDelete?: (row: T) => void
  onView?: (row: T) => void
  getRowKey: (row: T) => string
  canEdit?: (row: T) => boolean
  canDelete?: (row: T) => boolean
  enableSourceFilter?: boolean
  enableStatusFilter?: boolean
  searchPlaceholder?: string
  emptyMessage?: string
  defaultSort?: {
    key: string
    direction: 'asc' | 'desc'
  }
}

export function DataTable<T extends Record<string, any>>({
  columns,
  data,
  isLoading = false,
  onRowClick,
  onEdit,
  onDelete,
  onView,
  getRowKey,
  canEdit = () => true,
  canDelete = () => true,
  enableSourceFilter = false,
  enableStatusFilter = false,
  searchPlaceholder = 'Search...',
  emptyMessage = 'No data found',
  defaultSort,
}: DataTableProps<T>) {
  const [search, setSearch] = useState('')
  const [sortConfig, setSortConfig] = useState<{
    key: string
    direction: 'asc' | 'desc'
  } | null>(defaultSort || null)
  const [showDatabaseOnly, setShowDatabaseOnly] = useState(false)
  const [showEnabledOnly, setShowEnabledOnly] = useState(false)

  // Filter data
  const filteredData = useMemo(() => {
    let filtered = [...data]

    // Text search across all columns
    if (search) {
      const searchLower = search.toLowerCase()
      filtered = filtered.filter((row) =>
        columns.some((col) => {
          const value = row[col.key]
          if (value == null) return false
          return String(value).toLowerCase().includes(searchLower)
        })
      )
    }

    // Source filter (database only)
    if (enableSourceFilter && showDatabaseOnly) {
      filtered = filtered.filter((row) => row.source === 'database')
    }

    // Status filter (enabled only)
    if (enableStatusFilter && showEnabledOnly) {
      filtered = filtered.filter((row) => row.enabled === true)
    }

    return filtered
  }, [data, search, showDatabaseOnly, showEnabledOnly, columns, enableSourceFilter, enableStatusFilter])

  // Sort data
  const sortedData = useMemo(() => {
    if (!sortConfig) return filteredData

    const sorted = [...filteredData].sort((a, b) => {
      const aVal = a[sortConfig.key]
      const bVal = b[sortConfig.key]

      if (aVal == null) return 1
      if (bVal == null) return -1

      if (typeof aVal === 'string' && typeof bVal === 'string') {
        return sortConfig.direction === 'asc'
          ? aVal.localeCompare(bVal)
          : bVal.localeCompare(aVal)
      }

      if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1
      if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1
      return 0
    })

    return sorted
  }, [filteredData, sortConfig])

  const handleSort = (key: string) => {
    setSortConfig((current) => {
      if (current?.key === key) {
        return current.direction === 'asc'
          ? { key, direction: 'desc' }
          : null
      }
      return { key, direction: 'asc' }
    })
  }

  const hasActiveFilters = showDatabaseOnly || showEnabledOnly

  return (
    <div>
      <Group mb="md" justify="space-between">
        <TextInput
          placeholder={searchPlaceholder}
          leftSection={<IconSearch size={16} />}
          value={search}
          onChange={(e) => setSearch(e.currentTarget.value)}
          style={{ flex: 1, maxWidth: 400 }}
        />

        <Group gap="xs">
          {(enableSourceFilter || enableStatusFilter) && (
            <Menu position="bottom-end" shadow="md">
              <Menu.Target>
                <Button
                  variant={hasActiveFilters ? 'filled' : 'light'}
                  leftSection={<IconFilter size={16} />}
                  size="sm"
                >
                  Filters {hasActiveFilters && `(${[showDatabaseOnly, showEnabledOnly].filter(Boolean).length})`}
                </Button>
              </Menu.Target>
              <Menu.Dropdown>
                {enableSourceFilter && (
                  <Menu.Item closeMenuOnClick={false}>
                    <Checkbox
                      label="Database resources only"
                      checked={showDatabaseOnly}
                      onChange={(e) => setShowDatabaseOnly(e.currentTarget.checked)}
                    />
                  </Menu.Item>
                )}
                {enableStatusFilter && (
                  <Menu.Item closeMenuOnClick={false}>
                    <Checkbox
                      label="Enabled resources only"
                      checked={showEnabledOnly}
                      onChange={(e) => setShowEnabledOnly(e.currentTarget.checked)}
                    />
                  </Menu.Item>
                )}
                {hasActiveFilters && (
                  <>
                    <Menu.Divider />
                    <Menu.Item
                      onClick={() => {
                        setShowDatabaseOnly(false)
                        setShowEnabledOnly(false)
                      }}
                    >
                      Clear filters
                    </Menu.Item>
                  </>
                )}
              </Menu.Dropdown>
            </Menu>
          )}
        </Group>
      </Group>

      <ScrollArea>
        <Table striped highlightOnHover>
          <Table.Thead>
            <Table.Tr>
              {columns.map((col) => (
                <Table.Th
                  key={col.key}
                  style={{
                    width: col.width,
                    cursor: col.sortable ? 'pointer' : 'default',
                    userSelect: 'none',
                  }}
                  onClick={() => col.sortable && handleSort(col.key)}
                >
                  <Group gap="xs" wrap="nowrap">
                    {col.label}
                    {col.sortable && sortConfig?.key === col.key && (
                      sortConfig.direction === 'asc' ? (
                        <IconSortAscending size={14} />
                      ) : (
                        <IconSortDescending size={14} />
                      )
                    )}
                  </Group>
                </Table.Th>
              ))}
              {(onEdit || onDelete || onView) && <Table.Th style={{ width: 120 }}>Actions</Table.Th>}
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {isLoading ? (
              <Table.Tr>
                <Table.Td colSpan={columns.length + 1} style={{ textAlign: 'center' }}>
                  Loading...
                </Table.Td>
              </Table.Tr>
            ) : sortedData.length === 0 ? (
              <Table.Tr>
                <Table.Td colSpan={columns.length + 1} style={{ textAlign: 'center' }}>
                  <div style={{ padding: '2rem', color: 'var(--mantine-color-dimmed)' }}>
                    {emptyMessage}
                  </div>
                </Table.Td>
              </Table.Tr>
            ) : (
              sortedData.map((row) => {
                const rowKey = getRowKey(row)
                const editable = canEdit(row)
                const deletable = canDelete(row)

                return (
                  <Table.Tr
                    key={rowKey}
                    style={{ cursor: onRowClick ? 'pointer' : 'default' }}
                    onClick={() => onRowClick?.(row)}
                  >
                    {columns.map((col) => (
                      <Table.Td key={`${rowKey}-${col.key}`}>
                        {col.render ? col.render(row[col.key], row) : row[col.key]}
                      </Table.Td>
                    ))}
                    {(onEdit || onDelete || onView) && (
                      <Table.Td onClick={(e) => e.stopPropagation()}>
                        <Group gap="xs" wrap="nowrap">
                          {onView && (
                            <ActionIcon
                              variant="subtle"
                              color="blue"
                              onClick={() => onView(row)}
                            >
                              <IconEye size={16} />
                            </ActionIcon>
                          )}
                          {onEdit && (
                            <ActionIcon
                              variant="subtle"
                              color="blue"
                              onClick={() => onEdit(row)}
                              disabled={!editable}
                            >
                              <IconEdit size={16} />
                            </ActionIcon>
                          )}
                          {onDelete && (
                            <ActionIcon
                              variant="subtle"
                              color="red"
                              onClick={() => onDelete(row)}
                              disabled={!deletable}
                            >
                              <IconTrash size={16} />
                            </ActionIcon>
                          )}
                        </Group>
                      </Table.Td>
                    )}
                  </Table.Tr>
                )
              })
            )}
          </Table.Tbody>
        </Table>
      </ScrollArea>

      {sortedData.length > 0 && (
        <Group mt="sm" justify="space-between">
          <div style={{ fontSize: '0.875rem', color: 'var(--mantine-color-dimmed)' }}>
            Showing {sortedData.length} of {data.length} items
          </div>
        </Group>
      )}
    </div>
  )
}
