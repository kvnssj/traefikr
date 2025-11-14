import { useState } from 'react'
import {
  Modal,
  Stack,
  Group,
  Button,
  Select,
  TextInput,
  Card,
  Text,
  Badge,
  ActionIcon,
  SegmentedControl,
  Alert,
  Code,
  Divider,
  Checkbox,
  TagsInput
} from '@mantine/core'
import { 
  IconPlus, 
  IconTrash, 
  IconAlertCircle,
  IconCode,
  IconCheck
} from '@tabler/icons-react'

interface RuleCondition {
  id: string
  type: 'Host' | 'HostRegexp' | 'Path' | 'PathPrefix' | 'PathRegexp' | 
        'Header' | 'HeaderRegexp' | 'Query' | 'QueryRegexp' | 
        'Method' | 'ClientIP'
  value: string
  value2?: string // For Header and Query matchers that need key-value pairs
  negate: boolean
}

interface RuleGroup {
  id: string
  operator: 'AND' | 'OR'
  conditions: RuleCondition[]
}

interface HTTPRuleBuilderProps {
  opened: boolean
  onClose: () => void
  initialRule?: string
  onSave: (rule: string) => void
}

export function HTTPRuleBuilder({ opened, onClose, initialRule, onSave }: HTTPRuleBuilderProps) {
  const [groups, setGroups] = useState<RuleGroup[]>([
    { id: '1', operator: 'OR', conditions: [] }
  ])
  const [groupOperator, setGroupOperator] = useState<'AND' | 'OR'>('AND')

  const addCondition = (groupId: string) => {
    setGroups(groups.map(group => {
      if (group.id === groupId) {
        return {
          ...group,
          conditions: [
            ...group.conditions,
            {
              id: Date.now().toString(),
              type: 'Host',
              value: '',
              negate: false
            }
          ]
        }
      }
      return group
    }))
  }

  const updateCondition = (groupId: string, conditionId: string, field: keyof RuleCondition, value: any) => {
    setGroups(groups.map(group => {
      if (group.id === groupId) {
        return {
          ...group,
          conditions: group.conditions.map(cond => {
            if (cond.id === conditionId) {
              return { ...cond, [field]: value }
            }
            return cond
          })
        }
      }
      return group
    }))
  }

  const removeCondition = (groupId: string, conditionId: string) => {
    setGroups(groups.map(group => {
      if (group.id === groupId) {
        return {
          ...group,
          conditions: group.conditions.filter(cond => cond.id !== conditionId)
        }
      }
      return group
    }))
  }

  const addGroup = () => {
    setGroups([
      ...groups,
      {
        id: Date.now().toString(),
        operator: 'OR',
        conditions: []
      }
    ])
  }

  const removeGroup = (groupId: string) => {
    if (groups.length > 1) {
      setGroups(groups.filter(g => g.id !== groupId))
    }
  }

  const updateGroupOperator = (groupId: string, operator: 'AND' | 'OR') => {
    setGroups(groups.map(group => {
      if (group.id === groupId) {
        return { ...group, operator }
      }
      return group
    }))
  }

  const buildRule = (): string => {
    const groupRules = groups
      .filter(group => group.conditions.length > 0)
      .map(group => {
        const conditions = group.conditions
          .filter(cond => cond.value || (cond.type === 'Method' && cond.value))
          .map(cond => {
            let rule = ''
            
            // Add negation if needed
            if (cond.negate) {
              rule += '!'
            }
            
            // Build the function call based on type
            switch (cond.type) {
              case 'Host':
                rule += `Host(\`${cond.value}\`)`
                break
              case 'HostRegexp':
                rule += `HostRegexp(\`${cond.value}\`)`
                break
              case 'Path':
                rule += `Path(\`${cond.value}\`)`
                break
              case 'PathPrefix':
                rule += `PathPrefix(\`${cond.value}\`)`
                break
              case 'PathRegexp':
                rule += `PathRegexp(\`${cond.value}\`)`
                break
              case 'Header':
                rule += `Header(\`${cond.value2}\`, \`${cond.value}\`)`
                break
              case 'HeaderRegexp':
                rule += `HeaderRegexp(\`${cond.value2}\`, \`${cond.value}\`)`
                break
              case 'Query':
                rule += `Query(\`${cond.value2}\`, \`${cond.value}\`)`
                break
              case 'QueryRegexp':
                rule += `QueryRegexp(\`${cond.value2}\`, \`${cond.value}\`)`
                break
              case 'Method':
                // Method can accept multiple values
                const methods = cond.value.split(',').map(m => m.trim()).filter(m => m)
                if (methods.length > 0) {
                  rule += `Method(${methods.map(m => `\`${m}\``).join(', ')})`
                }
                break
              case 'ClientIP':
                rule += `ClientIP(\`${cond.value}\`)`
                break
            }
            
            return rule
          })
        
        if (conditions.length === 0) return ''
        if (conditions.length === 1) return conditions[0]
        
        // Join conditions within group with the group's operator
        return `(${conditions.join(` ${group.operator === 'AND' ? '&&' : '||'} `)})`
      })
      .filter(rule => rule)
    
    if (groupRules.length === 0) return ''
    if (groupRules.length === 1) return groupRules[0]
    
    // Join groups with the main operator
    return groupRules.join(` ${groupOperator === 'AND' ? '&&' : '||'} `)
  }

  const getPlaceholder = (type: string, isKey?: boolean): string => {
    if (isKey) {
      switch (type) {
        case 'Header':
        case 'HeaderRegexp':
          return 'Header name (e.g., Content-Type)'
        case 'Query':
        case 'QueryRegexp':
          return 'Parameter name (e.g., page)'
        default:
          return ''
      }
    }
    
    switch (type) {
      case 'Host':
        return 'example.com or *.example.com'
      case 'HostRegexp':
        return '^.+\\.example\\.com$'
      case 'Path':
        return '/api/users'
      case 'PathPrefix':
        return '/api'
      case 'PathRegexp':
        return '^/api/.*'
      case 'Header':
        return 'Header value (e.g., application/json)'
      case 'HeaderRegexp':
        return 'Header value pattern'
      case 'Query':
        return 'Parameter value (e.g., 10)'
      case 'QueryRegexp':
        return 'Parameter value pattern'
      case 'Method':
        return 'GET, POST, PUT, DELETE'
      case 'ClientIP':
        return '192.168.1.0/24 or 10.0.0.1'
      default:
        return ''
    }
  }

  const getDescription = (type: string): string => {
    switch (type) {
      case 'Host':
        return 'Match exact hostname (case-insensitive)'
      case 'HostRegexp':
        return 'Match hostname using Go regular expression'
      case 'Path':
        return 'Match exact request path'
      case 'PathPrefix':
        return 'Match request path prefix'
      case 'PathRegexp':
        return 'Match path using Go regular expression'
      case 'Header':
        return 'Match exact header key-value pair'
      case 'HeaderRegexp':
        return 'Match header using regular expression'
      case 'Query':
        return 'Match exact query parameter key-value pair'
      case 'QueryRegexp':
        return 'Match query parameter using regular expression'
      case 'Method':
        return 'Match HTTP request methods (comma-separated)'
      case 'ClientIP':
        return 'Match client IP address or CIDR range'
      default:
        return ''
    }
  }

  const needsKeyValue = (type: string): boolean => {
    return ['Header', 'HeaderRegexp', 'Query', 'QueryRegexp'].includes(type)
  }

  const handleSave = () => {
    const rule = buildRule()
    if (rule) {
      onSave(rule)
      onClose()
    }
  }

  const currentRule = buildRule()

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={
        <Group>
          <IconCode size={20} />
          <Text fw={500}>HTTP Rule Builder</Text>
        </Group>
      }
      size="xl"
    >
      <Stack>
        <Alert icon={<IconAlertCircle size={16} />} color="blue">
          Build complex HTTP routing rules using visual conditions. Rules can match on hostnames, paths,
          headers, query parameters, methods, or client IPs.
        </Alert>

        {groups.length > 1 && (
          <Group>
            <Text size="sm" fw={500}>Join groups with:</Text>
            <SegmentedControl
              value={groupOperator}
              onChange={(value) => setGroupOperator(value as 'AND' | 'OR')}
              data={[
                { label: 'AND (&&)', value: 'AND' },
                { label: 'OR (||)', value: 'OR' }
              ]}
              size="xs"
            />
          </Group>
        )}

        {groups.map((group, groupIndex) => (
          <Card key={group.id} shadow="xs" p="md" withBorder>
            <Stack gap="sm">
              <Group justify="space-between">
                <Group>
                  <Text size="sm" fw={500}>Group {groupIndex + 1}</Text>
                  {group.conditions.length > 1 && (
                    <>
                      <Text size="xs" c="dimmed">Join with:</Text>
                      <SegmentedControl
                        value={group.operator}
                        onChange={(value) => updateGroupOperator(group.id, value as 'AND' | 'OR')}
                        data={[
                          { label: 'AND', value: 'AND' },
                          { label: 'OR', value: 'OR' }
                        ]}
                        size="xs"
                      />
                    </>
                  )}
                </Group>
                {groups.length > 1 && (
                  <ActionIcon
                    variant="subtle"
                    color="red"
                    size="sm"
                    onClick={() => removeGroup(group.id)}
                  >
                    <IconTrash size={14} />
                  </ActionIcon>
                )}
              </Group>

              {group.conditions.map((condition, condIndex) => (
                <Card key={condition.id} shadow="xs" p="xs" withBorder>
                  <Stack gap="xs">
                    <Group gap="xs">
                      <Checkbox
                        label="NOT (!)"
                        checked={condition.negate}
                        onChange={(e) => updateCondition(group.id, condition.id, 'negate', e.currentTarget.checked)}
                        size="xs"
                      />
                      <Select
                        value={condition.type}
                        onChange={(value) => updateCondition(group.id, condition.id, 'type', value)}
                        data={[
                          { group: 'Host Matchers', items: [
                            { value: 'Host', label: 'Host' },
                            { value: 'HostRegexp', label: 'HostRegexp' }
                          ]},
                          { group: 'Path Matchers', items: [
                            { value: 'Path', label: 'Path' },
                            { value: 'PathPrefix', label: 'PathPrefix' },
                            { value: 'PathRegexp', label: 'PathRegexp' }
                          ]},
                          { group: 'Header Matchers', items: [
                            { value: 'Header', label: 'Header' },
                            { value: 'HeaderRegexp', label: 'HeaderRegexp' }
                          ]},
                          { group: 'Query Matchers', items: [
                            { value: 'Query', label: 'Query' },
                            { value: 'QueryRegexp', label: 'QueryRegexp' }
                          ]},
                          { group: 'Other', items: [
                            { value: 'Method', label: 'Method' },
                            { value: 'ClientIP', label: 'ClientIP' }
                          ]}
                        ]}
                        style={{ width: 150 }}
                      />
                      {needsKeyValue(condition.type) && (
                        <TextInput
                          value={condition.value2 || ''}
                          onChange={(e) => updateCondition(group.id, condition.id, 'value2', e.target.value)}
                          placeholder={getPlaceholder(condition.type, true)}
                          style={{ width: 150 }}
                        />
                      )}
                      <TextInput
                        value={condition.value}
                        onChange={(e) => updateCondition(group.id, condition.id, 'value', e.target.value)}
                        placeholder={getPlaceholder(condition.type)}
                        style={{ flex: 1 }}
                      />
                      <ActionIcon
                        variant="subtle"
                        color="red"
                        size="sm"
                        onClick={() => removeCondition(group.id, condition.id)}
                      >
                        <IconTrash size={14} />
                      </ActionIcon>
                    </Group>
                    <Text size="xs" c="dimmed">{getDescription(condition.type)}</Text>
                  </Stack>
                </Card>
              ))}

              <Button
                variant="light"
                size="xs"
                leftSection={<IconPlus size={14} />}
                onClick={() => addCondition(group.id)}
              >
                Add Condition
              </Button>
            </Stack>
          </Card>
        ))}

        <Button
          variant="outline"
          size="sm"
          leftSection={<IconPlus size={16} />}
          onClick={addGroup}
        >
          Add Group
        </Button>

        <Divider />

        <Stack gap="xs">
          <Text size="sm" fw={500}>Generated Rule:</Text>
          <Code block>
            {currentRule || 'No conditions defined yet'}
          </Code>
        </Stack>

        <Group justify="space-between">
          <Button variant="subtle" onClick={onClose}>
            Cancel
          </Button>
          <Button
            leftSection={<IconCheck size={16} />}
            onClick={handleSave}
            disabled={!currentRule}
          >
            Apply Rule
          </Button>
        </Group>
      </Stack>
    </Modal>
  )
}