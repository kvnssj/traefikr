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
  Checkbox
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
  type: 'HostSNI' | 'HostSNIRegexp' | 'ClientIP' | 'ALPN'
  value: string
  negate: boolean
}

interface RuleGroup {
  id: string
  operator: 'AND' | 'OR'
  conditions: RuleCondition[]
}

interface TCPRuleBuilderProps {
  opened: boolean
  onClose: () => void
  initialRule?: string
  onSave: (rule: string) => void
}

export function TCPRuleBuilder({ opened, onClose, initialRule, onSave }: TCPRuleBuilderProps) {
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
              type: 'HostSNI',
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
          .filter(cond => cond.value)
          .map(cond => {
            let rule = ''
            
            // Add negation if needed
            if (cond.negate) {
              rule += '!'
            }
            
            // Build the function call
            switch (cond.type) {
              case 'HostSNI':
                rule += `HostSNI(\`${cond.value}\`)`
                break
              case 'HostSNIRegexp':
                rule += `HostSNIRegexp(\`${cond.value}\`)`
                break
              case 'ClientIP':
                rule += `ClientIP(\`${cond.value}\`)`
                break
              case 'ALPN':
                rule += `ALPN(\`${cond.value}\`)`
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

  const getPlaceholder = (type: string): string => {
    switch (type) {
      case 'HostSNI':
        return 'example.com or * for all'
      case 'HostSNIRegexp':
        return '^.+\\.example\\.com$'
      case 'ClientIP':
        return '192.168.1.0/24 or 10.0.0.1'
      case 'ALPN':
        return 'h2, http/1.1, etc.'
      default:
        return ''
    }
  }

  const getDescription = (type: string): string => {
    switch (type) {
      case 'HostSNI':
        return 'Match exact Server Name Indication (TLS hostname)'
      case 'HostSNIRegexp':
        return 'Match SNI using Go regular expression'
      case 'ClientIP':
        return 'Match client IP address or CIDR range'
      case 'ALPN':
        return 'Match Application-Layer Protocol Negotiation'
      default:
        return ''
    }
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
          <Text fw={500}>TCP Rule Builder</Text>
        </Group>
      }
      size="xl"
    >
      <Stack>
        <Alert icon={<IconAlertCircle size={16} />} color="blue">
          Build complex TCP routing rules using visual conditions. Rules can match on Server Name Indication (SNI),
          client IP addresses, or ALPN protocols.
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
                          { value: 'HostSNI', label: 'HostSNI' },
                          { value: 'HostSNIRegexp', label: 'HostSNIRegexp' },
                          { value: 'ClientIP', label: 'ClientIP' },
                          { value: 'ALPN', label: 'ALPN' }
                        ]}
                        style={{ flex: 1 }}
                      />
                      <TextInput
                        value={condition.value}
                        onChange={(e) => updateCondition(group.id, condition.id, 'value', e.target.value)}
                        placeholder={getPlaceholder(condition.type)}
                        style={{ flex: 2 }}
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