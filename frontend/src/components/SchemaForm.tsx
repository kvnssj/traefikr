import { useState, useMemo } from 'react'
import {
  Tabs,
  TextInput,
  NumberInput,
  Checkbox,
  Textarea,
  Switch,
  Stack,
  Group,
  Text,
  Loader,
  Alert,
  Button,
  ActionIcon,
  Paper,
  Select,
  Card,
  Badge,
} from '@mantine/core'
import { IconAlertCircle, IconPlus, IconTrash, IconWand } from '@tabler/icons-react'
import { useQuery } from '@tanstack/react-query'
import { resourcesApi, Protocol, ResourceType } from '../lib/api'
import { ResourceSelector } from './ResourceSelector'
import { MiddlewareOrderList } from './MiddlewareOrderList'
import { EntryPointSelector } from './EntryPointSelector'
import { HTTPRuleBuilder } from './HTTPRuleBuilder'
import { TCPRuleBuilder } from './TCPRuleBuilder'

export interface SchemaFormProps {
  protocol: Protocol
  type: ResourceType
  value: Record<string, any>
  onChange: (value: Record<string, any>) => void
  disabled?: boolean
  resolvedSchema?: any  // Pre-resolved schema to bypass fetching
  readonly?: boolean
}

interface SchemaProperty {
  type: string | string[]
  title?: string
  description?: string
  enum?: any[]
  items?: any
  properties?: Record<string, SchemaProperty>
  required?: string[]
  additionalProperties?: boolean | SchemaProperty
  default?: any
  minimum?: number
  maximum?: number
  pattern?: string
  format?: string
}

interface ParsedSchema {
  simpleProps: Record<string, SchemaProperty>
  objectProps: Record<string, SchemaProperty>
  required: string[]
}

export function SchemaForm({
  protocol,
  type,
  value,
  onChange,
  disabled = false,
  resolvedSchema,
  readonly = false,
}: SchemaFormProps) {
  const [activeTab, setActiveTab] = useState<string>('general')
  const [ruleBuilderOpened, setRuleBuilderOpened] = useState(false)
  const [currentRulePath, setCurrentRulePath] = useState<string[]>([])
  const [currentRuleValue, setCurrentRuleValue] = useState<string>('')

  const { data: fetchedSchema, isLoading, error } = useQuery({
    queryKey: ['schema', protocol, type],
    queryFn: async () => {
      const response = await resourcesApi.getSchema(protocol, type)
      return response.data
    },
    enabled: !resolvedSchema,  // Only fetch if no resolved schema provided
  })

  // Use resolvedSchema if provided, otherwise use fetched schema
  const schema = resolvedSchema || fetchedSchema

  const parsedSchema: ParsedSchema | null = useMemo(() => {
    if (!schema || !schema.properties) return null

    const simpleProps: Record<string, SchemaProperty> = {}
    const objectProps: Record<string, SchemaProperty> = {}

    Object.entries(schema.properties).forEach(([key, prop]: [string, any]) => {
      const propTypes = Array.isArray(prop.type) ? prop.type : [prop.type]

      // Objects with actual properties go into objectProps for tabs
      // Empty objects (flags) and primitives go into simpleProps
      if (propTypes.includes('object') && prop.properties && Object.keys(prop.properties).length > 0) {
        objectProps[key] = prop
      } else {
        simpleProps[key] = prop
      }
    })

    return {
      simpleProps,
      objectProps,
      required: schema.required || [],
    }
  }, [schema])

  const handleFieldChange = (path: string[], newValue: any) => {
    const updated = { ...value }
    let current: any = updated

    // Navigate to the parent of the target field
    for (let i = 0; i < path.length - 1; i++) {
      if (!current[path[i]]) {
        current[path[i]] = {}
      }
      current = current[path[i]]
    }

    // Set the value
    const lastKey = path[path.length - 1]
    if (newValue === undefined || newValue === null || newValue === '') {
      delete current[lastKey]
    } else {
      current[lastKey] = newValue
    }

    onChange(updated)
  }

  const getFieldValue = (path: string[]): any => {
    let current = value
    for (const key of path) {
      if (current == null) return undefined
      current = current[key]
    }
    return current
  }

  const isSpecialField = (key: string, prop: SchemaProperty): 'middlewares' | 'service' | 'services' | 'parentRefs' | 'entryPoints' | 'rule' | 'tlsOptions' | 'certResolver' | 'fallback' | null => {
    if (key === 'middlewares' && prop.type === 'array') {
      return 'middlewares'
    }
    if (key === 'service' && prop.type === 'string') {
      return 'service'
    }
    if (key === 'fallback' && prop.type === 'string') {
      return 'fallback'
    }
    if (key === 'services' && prop.type === 'array') {
      return 'services'
    }
    if (key === 'parentRefs' && prop.type === 'array') {
      return 'parentRefs'
    }
    if (key === 'entryPoints' && prop.type === 'array') {
      return 'entryPoints'
    }
    if (key === 'rule' && prop.type === 'string') {
      return 'rule'
    }
    if (key === 'options' && prop.type === 'string') {
      return 'tlsOptions'
    }
    if (key === 'certResolver' && prop.type === 'string') {
      return 'certResolver'
    }
    return null
  }

  const getFieldLabel = (key: string, prop: SchemaProperty): string => {
    if (prop.title) return prop.title
    // Capitalize first letter and replace camelCase/snake_case with spaces
    return key
      .replace(/([A-Z])/g, ' $1')
      .replace(/_/g, ' ')
      .replace(/^./, (str) => str.toUpperCase())
      .trim()
  }

  const renderField = (key: string, prop: SchemaProperty, path: string[], isRequired: boolean): React.ReactNode => {
    const fieldValue = getFieldValue(path) || prop.default
    const specialField = isSpecialField(key, prop)
    const label = getFieldLabel(key, prop)

    // console.log(key, prop, path, isRequired, specialField, label, fieldValue);

    // Special case: middlewares array
    if (specialField === 'middlewares') {
      if (readonly) {
        return (
          <div key={path.join('.')}>
            <Text size="sm" fw={500}>{label}</Text>
            {prop.description && <Text size="xs" c="dimmed">{prop.description}</Text>}
            <Group gap="xs" mt="xs">
              {(fieldValue || []).length === 0 ? (
                <Text size="sm" c="dimmed">None</Text>
              ) : (
                (fieldValue || []).map((m: string, idx: number) => (
                  <Badge key={idx} variant="light">{m}</Badge>
                ))
              )}
            </Group>
          </div>
        )
      }
      return (
        <MiddlewareOrderList
          key={path.join('.')}
          protocol={protocol}
          value={fieldValue || []}
          onChange={(newValue) => handleFieldChange(path, newValue)}
          label={label}
          description={prop.description}
          disabled={disabled}
        />
      )
    }

    // Special case: entryPoints array
    if (specialField === 'entryPoints') {
      if (readonly) {
        return (
          <div key={path.join('.')}>
            <Text size="sm" fw={500}>{label}</Text>
            {prop.description && <Text size="xs" c="dimmed">{prop.description}</Text>}
            <Group gap="xs" mt="xs">
              {(fieldValue || []).length === 0 ? (
                <Text size="sm" c="dimmed">None</Text>
              ) : (
                (fieldValue || []).map((ep: string, idx: number) => (
                  <Badge key={idx} variant="light">{ep}</Badge>
                ))
              )}
            </Group>
          </div>
        )
      }
      return (
        <EntryPointSelector
          key={path.join('.')}
          value={fieldValue || []}
          onChange={(newValue) => handleFieldChange(path, newValue)}
          label={label}
          description={prop.description}
          required={isRequired}
          disabled={disabled}
        />
      )
    }

    // Special case: rule field with builder
    if (specialField === 'rule') {
      if (readonly) {
        return (
          <div key={path.join('.')}>
            <Text size="sm" fw={500}>{label}</Text>
            {prop.description && <Text size="xs" c="dimmed">{prop.description}</Text>}
            <Text size="sm" mt="xs">{fieldValue || '-'}</Text>
          </div>
        )
      }
      return (
        <div key={path.join('.')}>
          <TextInput
            label={label}
            description={prop.description}
            value={fieldValue || ''}
            onChange={(e) => handleFieldChange(path, e.currentTarget.value)}
            required={isRequired}
            disabled={disabled}
            rightSection={
              <ActionIcon
                variant="subtle"
                color="blue"
                onClick={() => {
                  setCurrentRulePath(path)
                  setCurrentRuleValue(fieldValue || '')
                  setRuleBuilderOpened(true)
                }}
                disabled={disabled}
              >
                <IconWand size={16} />
              </ActionIcon>
            }
          />
        </div>
      )
    }

    // Special case: service reference
    if (specialField === 'service') {
      if (readonly) {
        return (
          <div key={path.join('.')}>
            <Text size="sm" fw={500}>{label}</Text>
            {prop.description && <Text size="xs" c="dimmed">{prop.description}</Text>}
            <Text size="sm" mt="xs">{fieldValue || '-'}</Text>
          </div>
        )
      }
      return (
        <ResourceSelector
          key={path.join('.')}
          protocol={protocol}
          type="services"
          value={fieldValue || null}
          onChange={(newValue) => handleFieldChange(path, newValue)}
          label={label}
          description={prop.description}
          required={isRequired}
          disabled={disabled}
        />
      )
    }

    // Special case: fallback service reference (for failover)
    if (specialField === 'fallback') {
      if (readonly) {
        return (
          <div key={path.join('.')}>
            <Text size="sm" fw={500}>{label}</Text>
            <Text size="xs" c="dimmed">{prop.description || 'Backup service activated when the main service becomes unreachable'}</Text>
            <Text size="sm" mt="xs">{fieldValue || '-'}</Text>
          </div>
        )
      }
      return (
        <ResourceSelector
          key={path.join('.')}
          protocol={protocol}
          type="services"
          value={fieldValue || null}
          onChange={(newValue) => handleFieldChange(path, newValue)}
          label={label}
          description={prop.description || 'Backup service activated when the main service becomes unreachable'}
          required={isRequired}
          disabled={disabled}
        />
      )
    }

    // Special case: services array (for load balancers)
    if (specialField === 'services') {
      return renderArrayField(key, prop, path, isRequired)
    }

    // Special case: parentRefs array (router references)
    if (specialField === 'parentRefs') {
      return renderParentRefsField(key, prop, path, isRequired)
    }

    // Special case: TLS options reference
    if (specialField === 'tlsOptions') {
      if (readonly) {
        return (
          <div key={path.join('.')}>
            <Text size="sm" fw={500}>{label}</Text>
            {prop.description && <Text size="xs" c="dimmed">{prop.description}</Text>}
            <Text size="sm" mt="xs">{fieldValue || '-'}</Text>
          </div>
        )
      }
      return (
        <ResourceSelector
          key={path.join('.')}
          protocol={protocol}
          type="tls"
          value={fieldValue || null}
          onChange={(newValue) => handleFieldChange(path, newValue)}
          label={label}
          description={prop.description}
          required={isRequired}
          disabled={disabled}
        />
      )
    }

    // Special case: certResolver reference (not a resource, but could be handled differently)
    if (specialField === 'certResolver') {
      if (readonly) {
        return (
          <div key={path.join('.')}>
            <Text size="sm" fw={500}>{label}</Text>
            <Text size="xs" c="dimmed">{prop.description || 'Name of the certificate resolver (e.g., letsencrypt)'}</Text>
            <Text size="sm" mt="xs">{fieldValue || '-'}</Text>
          </div>
        )
      }
      return (
        <TextInput
          key={path.join('.')}
          label={label}
          description={prop.description || 'Name of the certificate resolver (e.g., letsencrypt)'}
          value={fieldValue || ''}
          onChange={(e) => handleFieldChange(path, e.currentTarget.value)}
          required={isRequired}
          disabled={disabled}
          placeholder="e.g., letsencrypt"
        />
      )
    }

    const propTypes = Array.isArray(prop.type) ? prop.type : [prop.type]

    // String fields
    if (propTypes.includes('string')) {
      if (prop.enum) {
        const enumData = prop.enum.map((val: any) => ({
          value: String(val),
          label: String(val),
        }))

        if (readonly) {
          return (
            <div key={path.join('.')}>
              <Text size="sm" fw={500}>{label}</Text>
              {prop.description && <Text size="xs" c="dimmed">{prop.description}</Text>}
              <Text size="sm" mt="xs">{fieldValue || '-'}</Text>
            </div>
          )
        }
        return (
          <Select
            key={path.join('.')}
            label={label}
            description={prop.description}
            value={fieldValue || null}
            onChange={(newValue) => handleFieldChange(path, newValue)}
            data={enumData}
            required={isRequired}
            disabled={disabled}
            clearable={!isRequired}
            searchable={enumData.length > 10}
            limit={100}
          />
        )
      }

      // Multiline text
      if (prop.format === 'textarea' || (prop.description && prop.description.includes('multiline'))) {
        if (readonly) {
          return (
            <div key={path.join('.')}>
              <Text size="sm" fw={500}>{label}</Text>
              {prop.description && <Text size="xs" c="dimmed">{prop.description}</Text>}
              <Text size="sm" mt="xs" style={{ whiteSpace: 'pre-wrap' }}>{fieldValue || '-'}</Text>
            </div>
          )
        }
        return (
          <Textarea
            key={path.join('.')}
            label={label}
            description={prop.description}
            value={fieldValue || ''}
            onChange={(e) => handleFieldChange(path, e.currentTarget.value)}
            required={isRequired}
            disabled={disabled}
            minRows={3}
          />
        )
      }

      if (readonly) {
        return (
          <div key={path.join('.')}>
            <Text size="sm" fw={500}>{label}</Text>
            {prop.description && <Text size="xs" c="dimmed">{prop.description}</Text>}
            <Text size="sm" mt="xs">{fieldValue || '-'}</Text>
          </div>
        )
      }
      return (
        <TextInput
          key={path.join('.')}
          label={label}
          description={prop.description}
          value={fieldValue || ''}
          onChange={(e) => handleFieldChange(path, e.currentTarget.value)}
          required={isRequired}
          disabled={disabled}
        />
      )
    }

    // Number fields
    if (propTypes.includes('number') || propTypes.includes('integer')) {
      if (readonly) {
        return (
          <div key={path.join('.')}>
            <Text size="sm" fw={500}>{label}</Text>
            {prop.description && <Text size="xs" c="dimmed">{prop.description}</Text>}
            <Text size="sm" mt="xs">{fieldValue ?? '-'}</Text>
          </div>
        )
      }
      return (
        <NumberInput
          key={path.join('.')}
          label={label}
          description={prop.description}
          value={fieldValue ?? ''}
          onChange={(newValue) => handleFieldChange(path, newValue)}
          required={isRequired}
          disabled={disabled}
          min={prop.minimum}
          max={prop.maximum}
        />
      )
    }

    // Boolean fields
    if (propTypes.includes('boolean')) {
      if (readonly) {
        return (
          <div key={path.join('.')}>
            <Text size="sm" fw={500}>{label}</Text>
            {prop.description && <Text size="xs" c="dimmed">{prop.description}</Text>}
            <Badge color={fieldValue ? 'green' : 'red'} variant="light" mt="xs">
              {fieldValue ? 'Enabled' : 'Disabled'}
            </Badge>
          </div>
        )
      }
      return (
        <Switch
          key={path.join('.')}
          label={label}
          description={prop.description}
          checked={fieldValue ?? false}
          onChange={(e) => handleFieldChange(path, e.currentTarget.checked)}
          disabled={disabled}
        />
      )
    }

    // Array fields
    if (propTypes.includes('array')) {
      return renderArrayField(key, prop, path, isRequired)
    }

    // Object fields with additionalProperties (key-value pairs)
    if (
      propTypes.includes('object') &&
      prop.additionalProperties &&
      typeof prop.additionalProperties === 'object' &&
      (!prop.properties || Object.keys(prop.properties).length === 0)
    ) {
      return renderKeyValueField(key, prop, path, isRequired)
    }

    // Object fields (empty objects = boolean flags)
    if (propTypes.includes('object') && (!prop.properties || Object.keys(prop.properties).length === 0)) {
      // Empty object means it's a flag - render as checkbox
      const isChecked = fieldValue != null && typeof fieldValue === 'object'
      if (readonly) {
        return (
          <div key={path.join('.')}>
            <Text size="sm" fw={500}>{label}</Text>
            {prop.description && <Text size="xs" c="dimmed">{prop.description}</Text>}
            <Badge color={isChecked ? 'green' : 'red'} variant="light" mt="xs">
              {isChecked ? 'Enabled' : 'Disabled'}
            </Badge>
          </div>
        )
      }
      return (
        <Checkbox
          key={path.join('.')}
          label={label}
          description={prop.description}
          checked={isChecked}
          onChange={(e) => {
            // If checked, set to empty object {}; if unchecked, set to undefined
            handleFieldChange(path, e.currentTarget.checked ? {} : undefined)
          }}
          disabled={disabled}
        />
      )
    }

    // Object fields (nested objects with properties)
    if (propTypes.includes('object') && prop.properties && Object.keys(prop.properties).length > 0) {
      return (
        <Card key={path.join('.')} withBorder padding="md" radius="sm" style={{ marginBottom: '1rem' }}>
          <Stack gap="sm">
            <div>
              <Text size="sm" fw={500}>
                {label}
              </Text>
              {prop.description && (
                <Text size="xs" c="dimmed">
                  {prop.description}
                </Text>
              )}
            </div>
            {renderObjectFields(prop.properties, path, prop.required || [])}
          </Stack>
        </Card>
      )
    }

    // Fallback to text input
    if (readonly) {
      return (
        <div key={path.join('.')}>
          <Text size="sm" fw={500}>{label}</Text>
          {prop.description && <Text size="xs" c="dimmed">{prop.description}</Text>}
          <Text size="sm" mt="xs">{fieldValue || '-'}</Text>
        </div>
      )
    }
    return (
      <TextInput
        key={path.join('.')}
        label={label}
        description={prop.description}
        value={fieldValue || ''}
        onChange={(e) => handleFieldChange(path, e.currentTarget.value)}
        required={isRequired}
        disabled={disabled}
      />
    )
  }

  const renderArrayField = (key: string, prop: SchemaProperty, path: string[], isRequired: boolean): React.ReactNode => {
    const fieldValue: any[] = getFieldValue(path) || []
    const label = getFieldLabel(key, prop)

    // Check if array items are objects with properties
    const itemSchema = prop.items
    const isObjectArray = itemSchema && (
      itemSchema.type === 'object' ||
      (itemSchema.properties && Object.keys(itemSchema.properties).length > 0)
    )

    // Readonly mode for primitive arrays
    if (readonly && !isObjectArray) {
      return (
        <div key={path.join('.')}>
          <Text size="sm" fw={500}>{label}</Text>
          {prop.description && <Text size="xs" c="dimmed">{prop.description}</Text>}
          <Group gap="xs" mt="xs">
            {fieldValue.length === 0 ? (
              <Text size="sm" c="dimmed">None</Text>
            ) : (
              fieldValue.map((item: any, idx: number) => (
                <Badge key={idx} variant="light">{item || '-'}</Badge>
              ))
            )}
          </Group>
        </div>
      )
    }

    const getDefaultItemValue = () => {
      if (isObjectArray) {
        return {}
      }
      return ''
    }

    const handleAddItem = () => {
      const newValue = [...fieldValue, getDefaultItemValue()]
      handleFieldChange(path, newValue)
    }

    const handleRemoveItem = (index: number) => {
      const newValue = fieldValue.filter((_, i) => i !== index)
      handleFieldChange(path, newValue)
    }

    const handleItemChange = (index: number, newValue: any) => {
      const updated = [...fieldValue]
      updated[index] = newValue
      handleFieldChange(path, updated)
    }

    const handleItemFieldChange = (index: number, fieldPath: string[], newValue: any) => {
      const updated = [...fieldValue]
      let current = updated[index]

      // Navigate to parent
      for (let i = 0; i < fieldPath.length - 1; i++) {
        if (!current[fieldPath[i]]) {
          current[fieldPath[i]] = {}
        }
        current = current[fieldPath[i]]
      }

      // Set value
      const lastKey = fieldPath[fieldPath.length - 1]
      if (newValue === undefined || newValue === null || newValue === '') {
        delete current[lastKey]
      } else {
        current[lastKey] = newValue
      }

      handleFieldChange(path, updated)
    }

    return (
      <div key={path.join('.')}>
        <Group justify="space-between" mb="xs">
          <div>
            <Text size="sm" fw={500}>
              {label}
            </Text>
            {prop.description && (
              <Text size="xs" c="dimmed">
                {prop.description}
              </Text>
            )}
          </div>
          {!readonly && (
            <Button
              size="xs"
              leftSection={<IconPlus size={14} />}
              onClick={handleAddItem}
              disabled={disabled}
            >
              Add
            </Button>
          )}
        </Group>

        <Stack gap="xs">
          {fieldValue.length === 0 ? (
            <Paper p="sm" withBorder style={{ textAlign: 'center' }}>
              <Text size="sm" c="dimmed">
                No items. {(readonly)?'':'Click "Add" to add an item.'}
              </Text>
            </Paper>
          ) : (
            fieldValue.map((item, index) => (
              <Paper key={index} p="md" withBorder>
                <Stack gap="md">
                  {isObjectArray && itemSchema?.properties ? (
                    // Render object fields recursively
                    <>
                      {Object.entries(itemSchema.properties).map(([fieldKey, fieldProp]: [string, any]) => {
                        const isFieldRequired = itemSchema.required?.includes(fieldKey) || false
                        const fieldPath = [fieldKey]

                        // Get current value for this field
                        let currentValue = item
                        for (const k of fieldPath) {
                          currentValue = currentValue?.[k]
                        }

                        return renderNestedField(
                          fieldKey,
                          fieldProp,
                          fieldPath,
                          isFieldRequired,
                          currentValue,
                          (newValue) => handleItemFieldChange(index, fieldPath, newValue)
                        )
                      })}
                      {!readonly && (
                        <Group justify="flex-end">
                          <ActionIcon
                            variant="subtle"
                            color="red"
                            onClick={() => handleRemoveItem(index)}
                            disabled={disabled}
                          >
                            <IconTrash size={16} />
                          </ActionIcon>
                        </Group>
                      )}
                    </>
                  ) : (
                    // Render simple input for primitive types
                    <Group gap="xs" wrap="nowrap">
                      <TextInput
                        value={item || ''}
                        onChange={(e) => handleItemChange(index, e.currentTarget.value)}
                        disabled={disabled}
                        style={{ flex: 1 }}
                      />
                      {!readonly && (
                        <ActionIcon
                          variant="subtle"
                          color="red"
                          onClick={() => handleRemoveItem(index)}
                          disabled={disabled}
                        >
                          <IconTrash size={16} />
                        </ActionIcon>
                      )}
                    </Group>
                  )}
                </Stack>
              </Paper>
            ))
          )}
        </Stack>
      </div>
    )
  }

  const renderKeyValueField = (key: string, prop: SchemaProperty, path: string[], isRequired: boolean): React.ReactNode => {
    const fieldValue: Record<string, any> = getFieldValue(path) || {}
    const label = getFieldLabel(key, prop)

    // Convert object to array of key-value pairs for easier manipulation
    const entries = Object.entries(fieldValue)

    // Readonly mode
    if (readonly) {
      return (
        <div key={path.join('.')}>
          <Text size="sm" fw={500}>{label}</Text>
          {prop.description && <Text size="xs" c="dimmed">{prop.description}</Text>}
          <Stack gap="xs" mt="xs">
            {entries.length === 0 ? (
              <Text size="sm" c="dimmed">None</Text>
            ) : (
              entries.map(([entryKey, entryValue], index) => (
                <Group key={index} gap="xs">
                  <Text size="sm" fw={500}>{entryKey}:</Text>
                  <Text size="sm">{entryValue || '-'}</Text>
                </Group>
              ))
            )}
          </Stack>
        </div>
      )
    }

    const handleAddEntry = () => {
      const newValue = { ...fieldValue, '': '' }
      handleFieldChange(path, newValue)
    }

    const handleRemoveEntry = (keyToRemove: string) => {
      const newValue = { ...fieldValue }
      delete newValue[keyToRemove]
      handleFieldChange(path, newValue)
    }

    const handleKeyChange = (oldKey: string, newKey: string) => {
      if (oldKey === newKey) return

      const newValue = { ...fieldValue }
      const val = newValue[oldKey]
      delete newValue[oldKey]

      // Only set new key if it's not empty
      if (newKey.trim()) {
        newValue[newKey] = val
      }

      handleFieldChange(path, newValue)
    }

    const handleValueChange = (entryKey: string, newValue: string) => {
      const updated = { ...fieldValue, [entryKey]: newValue }
      handleFieldChange(path, updated)
    }

    return (
      <div key={path.join('.')}>
        <Group justify="space-between" mb="xs">
          <div>
            <Text size="sm" fw={500}>
              {label}
            </Text>
            {prop.description && (
              <Text size="xs" c="dimmed">
                {prop.description}
              </Text>
            )}
          </div>
          <Button
            size="xs"
            leftSection={<IconPlus size={14} />}
            onClick={handleAddEntry}
            disabled={disabled}
          >
            Add Entry
          </Button>
        </Group>

        <Stack gap="xs">
          {entries.length === 0 ? (
            <Paper p="sm" withBorder style={{ textAlign: 'center' }}>
              <Text size="sm" c="dimmed">
                No entries. Click "Add Entry" to add a key-value pair.
              </Text>
            </Paper>
          ) : (
            entries.map(([entryKey, entryValue], index) => (
              <Paper key={index} p="md" withBorder>
                <Group gap="xs" wrap="nowrap" align="flex-start">
                  <TextInput
                    label="Name"
                    value={entryKey}
                    onChange={(e) => handleKeyChange(entryKey, e.currentTarget.value)}
                    disabled={disabled}
                    style={{ flex: 1 }}
                    placeholder="Header name"
                  />
                  <TextInput
                    label="Value"
                    value={entryValue || ''}
                    onChange={(e) => handleValueChange(entryKey, e.currentTarget.value)}
                    disabled={disabled}
                    style={{ flex: 1 }}
                    placeholder="Header value"
                  />
                  <ActionIcon
                    variant="subtle"
                    color="red"
                    onClick={() => handleRemoveEntry(entryKey)}
                    disabled={disabled}
                    style={{ marginTop: '24px' }}
                  >
                    <IconTrash size={16} />
                  </ActionIcon>
                </Group>
              </Paper>
            ))
          )}
        </Stack>
      </div>
    )
  }

  const renderParentRefsField = (key: string, prop: SchemaProperty, path: string[], isRequired: boolean): React.ReactNode => {
    const fieldValue: string[] = getFieldValue(path) || []
    const label = getFieldLabel(key, prop)

    // Readonly mode
    if (readonly) {
      return (
        <div key={path.join('.')}>
          <Text size="sm" fw={500}>{label}</Text>
          {prop.description && <Text size="xs" c="dimmed">{prop.description}</Text>}
          <Group gap="xs" mt="xs">
            {fieldValue.length === 0 ? (
              <Text size="sm" c="dimmed">None</Text>
            ) : (
              fieldValue.map((item: string, idx: number) => (
                <Badge key={idx} variant="light">{item || '-'}</Badge>
              ))
            )}
          </Group>
        </div>
      )
    }

    const handleAddItem = () => {
      const newValue = [...fieldValue, '']
      handleFieldChange(path, newValue)
    }

    const handleRemoveItem = (index: number) => {
      const newValue = fieldValue.filter((_, i) => i !== index)
      handleFieldChange(path, newValue)
    }

    const handleItemChange = (index: number, newValue: string) => {
      const updated = [...fieldValue]
      updated[index] = newValue
      handleFieldChange(path, updated)
    }

    return (
      <div key={path.join('.')}>
        <Group justify="space-between" mb="xs">
          <div>
            <Text size="sm" fw={500}>
              {label}
            </Text>
            {prop.description && (
              <Text size="xs" c="dimmed">
                {prop.description}
              </Text>
            )}
          </div>
          <Button
            size="xs"
            leftSection={<IconPlus size={14} />}
            onClick={handleAddItem}
            disabled={disabled}
          >
            Add
          </Button>
        </Group>

        <Stack gap="xs">
          {fieldValue.length === 0 ? (
            <Paper p="sm" withBorder style={{ textAlign: 'center' }}>
              <Text size="sm" c="dimmed">
                No parent routers. Click "Add" to add a parent router reference.
              </Text>
            </Paper>
          ) : (
            fieldValue.map((item, index) => (
              <Group key={index} gap="xs" wrap="nowrap">
                <div style={{ flex: 1 }}>
                  <ResourceSelector
                    protocol={protocol}
                    type="routers"
                    value={item || null}
                    onChange={(newValue) => handleItemChange(index, newValue || '')}
                    placeholder="Select parent router"
                    disabled={disabled}
                  />
                </div>
                {!readonly && (
                  <ActionIcon
                    variant="subtle"
                    color="red"
                    onClick={() => handleRemoveItem(index)}
                    disabled={disabled}
                  >
                    <IconTrash size={16} />
                  </ActionIcon>
                )}
              </Group>
            ))
          )}
        </Stack>
      </div>
    )
  }

  const renderNestedField = (
    key: string,
    prop: SchemaProperty,
    fieldPath: string[],
    isRequired: boolean,
    value: any,
    onChange: (value: any) => void
  ): React.ReactNode => {
    const label = getFieldLabel(key, prop)
    const propTypes = Array.isArray(prop.type) ? prop.type : [prop.type]

    // Special case: key-value objects with additionalProperties
    if (
      propTypes.includes('object') &&
      prop.additionalProperties &&
      typeof prop.additionalProperties === 'object' &&
      (!prop.properties || Object.keys(prop.properties).length === 0)
    ) {
      const fieldValue: Record<string, any> = value || {}
      const entries = Object.entries(fieldValue)

      const handleAddEntry = () => {
        onChange({ ...fieldValue, '': '' })
      }

      const handleRemoveEntry = (keyToRemove: string) => {
        const newValue = { ...fieldValue }
        delete newValue[keyToRemove]
        onChange(newValue)
      }

      const handleKeyChange = (oldKey: string, newKey: string) => {
        if (oldKey === newKey) return

        const newValue = { ...fieldValue }
        const val = newValue[oldKey]
        delete newValue[oldKey]

        if (newKey.trim()) {
          newValue[newKey] = val
        }

        onChange(newValue)
      }

      const handleValueChange = (entryKey: string, newValue: string) => {
        onChange({ ...fieldValue, [entryKey]: newValue })
      }

      if (readonly) {
        return (
          <div key={fieldPath.join('.')}>
            <Text size="sm" fw={500}>{label}</Text>
            {prop.description && <Text size="xs" c="dimmed">{prop.description}</Text>}
            <Stack gap="xs" mt="xs">
              {entries.length === 0 ? (
                <Text size="sm" c="dimmed">None</Text>
              ) : (
                entries.map(([entryKey, entryValue], index) => (
                  <Group key={index} gap="xs">
                    <Text size="sm" fw={500}>{entryKey}:</Text>
                    <Text size="sm">{entryValue || '-'}</Text>
                  </Group>
                ))
              )}
            </Stack>
          </div>
        )
      }

      return (
        <div key={fieldPath.join('.')}>
          <Group justify="space-between" mb="xs">
            <div>
              <Text size="sm" fw={500}>
                {label}
              </Text>
              {prop.description && (
                <Text size="xs" c="dimmed">
                  {prop.description}
                </Text>
              )}
            </div>
            <Button
              size="xs"
              leftSection={<IconPlus size={14} />}
              onClick={handleAddEntry}
              disabled={disabled}
            >
              Add Entry
            </Button>
          </Group>

          <Stack gap="xs">
            {entries.length === 0 ? (
              <Paper p="sm" withBorder style={{ textAlign: 'center' }}>
                <Text size="sm" c="dimmed">
                  No entries. Click "Add Entry" to add a key-value pair.
                </Text>
              </Paper>
            ) : (
              entries.map(([entryKey, entryValue], index) => (
                <Paper key={index} p="sm" withBorder>
                  <Group gap="xs" wrap="nowrap" align="flex-start">
                    <TextInput
                      label="Name"
                      value={entryKey}
                      onChange={(e) => handleKeyChange(entryKey, e.currentTarget.value)}
                      disabled={disabled}
                      style={{ flex: 1 }}
                      placeholder="Key"
                      size="sm"
                    />
                    <TextInput
                      label="Value"
                      value={entryValue || ''}
                      onChange={(e) => handleValueChange(entryKey, e.currentTarget.value)}
                      disabled={disabled}
                      style={{ flex: 1 }}
                      placeholder="Value"
                      size="sm"
                    />
                    <ActionIcon
                      variant="subtle"
                      color="red"
                      onClick={() => handleRemoveEntry(entryKey)}
                      disabled={disabled}
                      style={{ marginTop: '24px' }}
                      size="sm"
                    >
                      <IconTrash size={16} />
                    </ActionIcon>
                  </Group>
                </Paper>
              ))
            )}
          </Stack>
        </div>
      )
    }

    // Special case: service name reference in services/mirrors arrays, or failover/mirroring service fields
    if ((key === 'name' || key === 'service' || key === 'fallback') && propTypes.includes('string') && !prop.enum) {
      // This is likely a service reference field
      if (readonly) {
        return (
          <div key={fieldPath.join('.')}>
            <Text size="sm" fw={500}>{label}</Text>
            <Text size="xs" c="dimmed">{prop.description || 'Reference to an existing service'}</Text>
            <Text size="sm" mt="xs">{value || '-'}</Text>
          </div>
        )
      }
      return (
        <ResourceSelector
          key={fieldPath.join('.')}
          protocol={protocol}
          type="services"
          value={value || null}
          onChange={(newValue) => onChange(newValue)}
          label={label}
          description={prop.description || 'Reference to an existing service'}
          required={isRequired}
          disabled={disabled}
        />
      )
    }

    // String fields
    if (propTypes.includes('string')) {
      if (prop.enum) {
        const enumData = prop.enum.map((val: any) => ({
          value: String(val),
          label: String(val),
        }))

        if (readonly) {
          return (
            <div key={fieldPath.join('.')}>
              <Text size="sm" fw={500}>{label}</Text>
              {prop.description && <Text size="xs" c="dimmed">{prop.description}</Text>}
              <Text size="sm" mt="xs">{value || '-'}</Text>
            </div>
          )
        }
        return (
          <Select
            key={fieldPath.join('.')}
            label={label}
            description={prop.description}
            value={value || null}
            onChange={(newValue) => onChange(newValue)}
            data={enumData}
            required={isRequired}
            disabled={disabled}
            clearable={!isRequired}
            searchable={enumData.length > 10}
            limit={100}
          />
        )
      }

      if (prop.format === 'textarea' || (prop.description && prop.description.includes('multiline'))) {
        if (readonly) {
          return (
            <div key={fieldPath.join('.')}>
              <Text size="sm" fw={500}>{label}</Text>
              {prop.description && <Text size="xs" c="dimmed">{prop.description}</Text>}
              <Text size="sm" mt="xs" style={{ whiteSpace: 'pre-wrap' }}>{value || '-'}</Text>
            </div>
          )
        }
        return (
          <Textarea
            key={fieldPath.join('.')}
            label={label}
            description={prop.description}
            value={value || ''}
            onChange={(e) => onChange(e.currentTarget.value)}
            required={isRequired}
            disabled={disabled}
            minRows={3}
          />
        )
      }

      if (readonly) {
        return (
          <div key={fieldPath.join('.')}>
            <Text size="sm" fw={500}>{label}</Text>
            {prop.description && <Text size="xs" c="dimmed">{prop.description}</Text>}
            <Text size="sm" mt="xs">{value || '-'}</Text>
          </div>
        )
      }
      return (
        <TextInput
          key={fieldPath.join('.')}
          label={label}
          description={prop.description}
          value={value || ''}
          onChange={(e) => onChange(e.currentTarget.value)}
          required={isRequired}
          disabled={disabled}
        />
      )
    }

    // Number fields
    if (propTypes.includes('number') || propTypes.includes('integer')) {
      if (readonly) {
        return (
          <div key={fieldPath.join('.')}>
            <Text size="sm" fw={500}>{label}</Text>
            {prop.description && <Text size="xs" c="dimmed">{prop.description}</Text>}
            <Text size="sm" mt="xs">{value ?? '-'}</Text>
          </div>
        )
      }
      return (
        <NumberInput
          key={fieldPath.join('.')}
          label={label}
          description={prop.description}
          value={value ?? ''}
          onChange={(newValue) => onChange(newValue)}
          required={isRequired}
          disabled={disabled}
          min={prop.minimum}
          max={prop.maximum}
        />
      )
    }

    // Boolean fields
    if (propTypes.includes('boolean')) {
      if (readonly) {
        return (
          <div key={fieldPath.join('.')}>
            <Text size="sm" fw={500}>{label}</Text>
            {prop.description && <Text size="xs" c="dimmed">{prop.description}</Text>}
            <Badge color={value ? 'green' : 'red'} variant="light" mt="xs">
              {value ? 'Enabled' : 'Disabled'}
            </Badge>
          </div>
        )
      }
      return (
        <Switch
          key={fieldPath.join('.')}
          label={label}
          description={prop.description}
          checked={value ?? false}
          onChange={(e) => onChange(e.currentTarget.checked)}
          disabled={disabled}
        />
      )
    }

    // Array fields (nested arrays)
    if (propTypes.includes('array')) {
      // For nested arrays, we need special handling
      const nestedValue = value || []
      const handleNestedArrayChange = (newArrayValue: any[]) => {
        onChange(newArrayValue)
      }

      if (readonly) {
        return (
          <div key={fieldPath.join('.')}>
            <Text size="sm" fw={500}>{label}</Text>
            {prop.description && <Text size="xs" c="dimmed">{prop.description}</Text>}
            <Group gap="xs" mt="xs">
              {nestedValue.length === 0 ? (
                <Text size="sm" c="dimmed">None</Text>
              ) : (
                nestedValue.map((item: any, idx: number) => (
                  <Badge key={idx} variant="light">{item || '-'}</Badge>
                ))
              )}
            </Group>
          </div>
        )
      }

      return (
        <div key={fieldPath.join('.')}>
          <Text size="sm" fw={500} mb="xs">{label}</Text>
          {prop.description && (
            <Text size="xs" c="dimmed" mb="xs">{prop.description}</Text>
          )}
          <Stack gap="xs">
            {nestedValue.map((item: any, idx: number) => (
              <Group key={idx} gap="xs" wrap="nowrap">
                <TextInput
                  value={item || ''}
                  onChange={(e) => {
                    const updated = [...nestedValue]
                    updated[idx] = e.currentTarget.value
                    handleNestedArrayChange(updated)
                  }}
                  disabled={disabled}
                  style={{ flex: 1 }}
                />
                <ActionIcon
                  variant="subtle"
                  color="red"
                  onClick={() => {
                    const updated = nestedValue.filter((_: any, i: number) => i !== idx)
                    handleNestedArrayChange(updated)
                  }}
                  disabled={disabled}
                >
                  <IconTrash size={16} />
                </ActionIcon>
              </Group>
            ))}
            <Button
              size="xs"
              leftSection={<IconPlus size={14} />}
              onClick={() => handleNestedArrayChange([...nestedValue, ''])}
              disabled={disabled}
            >
              Add
            </Button>
          </Stack>
        </div>
      )
    }

    // Fallback to text input
    if (readonly) {
      return (
        <div key={fieldPath.join('.')}>
          <Text size="sm" fw={500}>{label}</Text>
          {prop.description && <Text size="xs" c="dimmed">{prop.description}</Text>}
          <Text size="sm" mt="xs">{value || '-'}</Text>
        </div>
      )
    }
    return (
      <TextInput
        key={fieldPath.join('.')}
        label={label}
        description={prop.description}
        value={value || ''}
        onChange={(e) => onChange(e.currentTarget.value)}
        required={isRequired}
        disabled={disabled}
      />
    )
  }

  const renderObjectFields = (props: Record<string, SchemaProperty>, basePath: string[], requiredFields: string[]): React.ReactNode => {
    return (
      <Stack gap="md">
        {Object.entries(props).map(([key, prop]) => {
          const isRequired = requiredFields.includes(key)
          return renderField(key, prop, [...basePath, key], isRequired)
        })}
      </Stack>
    )
  }

  if (isLoading) {
    return (
      <div style={{ textAlign: 'center', padding: '2rem' }}>
        <Loader />
        <Text mt="md" c="dimmed">
          Loading schema...
        </Text>
      </div>
    )
  }

  if (error) {
    return (
      <Alert icon={<IconAlertCircle />} title="Error loading schema" color="red">
        Failed to load schema for {protocol}/{type}. Please try again.
      </Alert>
    )
  }

  if (!parsedSchema) {
    return (
      <Alert icon={<IconAlertCircle />} title="Invalid schema" color="yellow">
        The schema for {protocol}/{type} is invalid or empty.
      </Alert>
    )
  }

  const hasSimpleProps = Object.keys(parsedSchema.simpleProps).length > 0
  const hasObjectProps = Object.keys(parsedSchema.objectProps).length > 0

  // If no tabs needed (only simple props or only one object), render flat
  if (!hasSimpleProps && Object.keys(parsedSchema.objectProps).length === 1) {
    const [objKey, objProp] = Object.entries(parsedSchema.objectProps)[0]
    return renderObjectFields(objProp.properties || {}, [objKey], objProp.required || [])
  }

  if (!hasObjectProps) {
    return renderObjectFields(parsedSchema.simpleProps, [], parsedSchema.required)
  }

  // Render tabs
  const tabs = []

  if (hasSimpleProps) {
    tabs.push(
      <Tabs.Tab key="general" value="general">
        General
      </Tabs.Tab>
    )
  }

  Object.entries(parsedSchema.objectProps).forEach(([key, prop]) => {
    tabs.push(
      <Tabs.Tab key={key} value={key}>
        {getFieldLabel(key, prop)}
      </Tabs.Tab>
    )
  })

  return (
    <>
      <Tabs value={activeTab} onChange={(val) => setActiveTab(val || 'general')}>
        <Tabs.List>{tabs}</Tabs.List>

        {hasSimpleProps && (
          <Tabs.Panel value="general" pt="md">
            {renderObjectFields(parsedSchema.simpleProps, [], parsedSchema.required)}
          </Tabs.Panel>
        )}

        {Object.entries(parsedSchema.objectProps).map(([key, prop]) => (
          <Tabs.Panel key={key} value={key} pt="md">
            {renderObjectFields(prop.properties || {}, [key], prop.required || [])}
          </Tabs.Panel>
        ))}
      </Tabs>

      {/* Rule Builder Modals */}
      {protocol === 'http' && (
        <HTTPRuleBuilder
          opened={ruleBuilderOpened}
          onClose={() => setRuleBuilderOpened(false)}
          initialRule={currentRuleValue}
          onSave={(rule) => {
            handleFieldChange(currentRulePath, rule)
            setRuleBuilderOpened(false)
          }}
        />
      )}

      {protocol === 'tcp' && (
        <TCPRuleBuilder
          opened={ruleBuilderOpened}
          onClose={() => setRuleBuilderOpened(false)}
          initialRule={currentRuleValue}
          onSave={(rule) => {
            handleFieldChange(currentRulePath, rule)
            setRuleBuilderOpened(false)
          }}
        />
      )}
    </>
  )
}
