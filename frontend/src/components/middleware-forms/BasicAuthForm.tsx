import { TextInput, Textarea, Switch, Stack, Text, Group, Button, PasswordInput } from '@mantine/core'
import { IconPlus, IconTrash } from '@tabler/icons-react'
import { useState } from 'react'

interface BasicAuthFormProps {
  config: any
  onChange: (config: any) => void
}

export function BasicAuthForm({ config, onChange }: BasicAuthFormProps) {
  const [users, setUsers] = useState<string[]>(config.users || [])
  const [newUser, setNewUser] = useState('')
  const [newPassword, setNewPassword] = useState('')

  const handleAddUser = () => {
    if (newUser && newPassword) {
      // In production, password should be hashed using htpasswd format
      // For demo, we'll use basic format username:password
      const htpasswdEntry = `${newUser}:${btoa(newPassword)}`
      const updatedUsers = [...users, htpasswdEntry]
      setUsers(updatedUsers)
      onChange({
        ...config,
        users: updatedUsers
      })
      setNewUser('')
      setNewPassword('')
    }
  }

  const handleRemoveUser = (index: number) => {
    const updatedUsers = users.filter((_, i) => i !== index)
    setUsers(updatedUsers)
    onChange({
      ...config,
      users: updatedUsers
    })
  }

  return (
    <Stack>
      <div>
        <Text size="sm" fw={500} mb="xs">Users</Text>
        <Stack gap="xs">
          {users.map((user, index) => (
            <Group key={index} justify="space-between">
              <Text size="sm" c="dimmed">{user.split(':')[0]}</Text>
              <Button
                size="xs"
                color="red"
                variant="subtle"
                onClick={() => handleRemoveUser(index)}
                leftSection={<IconTrash size={14} />}
              >
                Remove
              </Button>
            </Group>
          ))}
        </Stack>
        
        <Group mt="md">
          <TextInput
            placeholder="Username"
            value={newUser}
            onChange={(e) => setNewUser(e.target.value)}
            style={{ flex: 1 }}
          />
          <PasswordInput
            placeholder="Password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            style={{ flex: 1 }}
          />
          <Button
            onClick={handleAddUser}
            leftSection={<IconPlus size={16} />}
            disabled={!newUser || !newPassword}
          >
            Add User
          </Button>
        </Group>
      </div>

      <TextInput
        label="Realm"
        placeholder="Restricted"
        value={config.realm || ''}
        onChange={(e) => onChange({ ...config, realm: e.target.value })}
        description="Authentication realm displayed to users"
      />

      <Textarea
        label="Users File"
        placeholder="/path/to/users/file"
        value={config.usersFile || ''}
        onChange={(e) => onChange({ ...config, usersFile: e.target.value })}
        description="Path to htpasswd file (alternative to inline users)"
      />

      <Switch
        label="Remove Authentication Header"
        checked={config.removeHeader || false}
        onChange={(e) => onChange({ ...config, removeHeader: e.currentTarget.checked })}
        description="Remove Authorization header before forwarding to service"
      />

      <TextInput
        label="Header Field"
        placeholder="X-WebAuth-User"
        value={config.headerField || ''}
        onChange={(e) => onChange({ ...config, headerField: e.target.value })}
        description="Header field to store authenticated username"
      />
    </Stack>
  )
}