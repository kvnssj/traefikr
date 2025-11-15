import { useState } from 'react'
import { Modal, Stack, PasswordInput, Button, Text } from '@mantine/core'
import { authApi } from '@/lib/api'
import { notifications } from '@mantine/notifications'

interface ChangePasswordModalProps {
  opened: boolean
  onClose: () => void
}

export default function ChangePasswordModal({ opened, onClose }: ChangePasswordModalProps) {
  const [oldPassword, setOldPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async () => {
    // Validation
    if (!oldPassword || !newPassword || !confirmPassword) {
      notifications.show({
        title: 'Error',
        message: 'All fields are required',
        color: 'red',
      })
      return
    }

    if (newPassword !== confirmPassword) {
      notifications.show({
        title: 'Error',
        message: 'New passwords do not match',
        color: 'red',
      })
      return
    }

    if (newPassword.length < 8) {
      notifications.show({
        title: 'Error',
        message: 'New password must be at least 8 characters',
        color: 'red',
      })
      return
    }

    setLoading(true)
    try {
      await authApi.changePassword({
        old_password: oldPassword,
        new_password: newPassword,
      })

      notifications.show({
        title: 'Success',
        message: 'Password changed successfully',
        color: 'green',
      })

      // Clear form and close modal
      setOldPassword('')
      setNewPassword('')
      setConfirmPassword('')
      onClose()
    } catch (error: any) {
      notifications.show({
        title: 'Error',
        message: error.response?.data?.error || 'Failed to change password',
        color: 'red',
      })
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    // Clear form when closing
    setOldPassword('')
    setNewPassword('')
    setConfirmPassword('')
    onClose()
  }

  return (
    <Modal
      opened={opened}
      onClose={handleClose}
      title="Change Password"
      centered
    >
      <Stack gap="md">
        <Text size="sm" c="dimmed">
          Enter your current password and choose a new password.
        </Text>

        <PasswordInput
          label="Current Password"
          placeholder="Enter your current password"
          value={oldPassword}
          onChange={(e) => setOldPassword(e.currentTarget.value)}
          required
        />

        <PasswordInput
          label="New Password"
          placeholder="Enter your new password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.currentTarget.value)}
          description="Must be at least 8 characters"
          required
        />

        <PasswordInput
          label="Confirm New Password"
          placeholder="Confirm your new password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.currentTarget.value)}
          required
        />

        <Button
          fullWidth
          onClick={handleSubmit}
          loading={loading}
          mt="md"
        >
          Change Password
        </Button>
      </Stack>
    </Modal>
  )
}
