import { Tooltip } from '@mantine/core'
import { CheckCircle, AlertCircle } from 'lucide-react'

interface StatusIconProps {
  enabled: boolean
  enabledLabel?: string
  disabledLabel?: string
  size?: number
}

export function StatusIcon({ 
  enabled, 
  enabledLabel = 'Enabled', 
  disabledLabel = 'Disabled',
  size = 20 
}: StatusIconProps) {
  return (
    <Tooltip label={enabled ? enabledLabel : disabledLabel}>
      <div style={{ display: 'inline-flex', alignItems: 'center' }}>
        {enabled ? (
          <CheckCircle size={size} color="green" />
        ) : (
          <AlertCircle size={size} color="red" />
        )}
      </div>
    </Tooltip>
  )
}