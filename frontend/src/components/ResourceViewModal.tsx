import { useMemo } from 'react'
import { Modal } from '@mantine/core'
import { Protocol, ResourceType } from '../lib/api'
import { SchemaForm } from './SchemaForm'
import { ServiceSchemaForm } from './ServiceSchemaForm'

export interface ResourceViewModalProps {
  opened: boolean
  onClose: () => void
  protocol: Protocol
  type: ResourceType
  resourceName: string
  config: Record<string, any>
  resolvedSchema?: any
}

export function ResourceViewModal({
  opened,
  onClose,
  protocol,
  type,
  resourceName,
  config,
  resolvedSchema,
}: ResourceViewModalProps) {
  // Detect service subtype and unwrap config if needed
  const { isService, subtype, unwrappedConfig } = useMemo(() => {
    if (type !== 'services') {
      return { isService: false, subtype: null, unwrappedConfig: config }
    }

    // Detect subtype from config
    if (config?.weighted) {
      return { isService: true, subtype: 'weighted', unwrappedConfig: config.weighted }
    } else if (config?.mirroring) {
      return { isService: true, subtype: 'mirroring', unwrappedConfig: config.mirroring }
    } else if (config?.failover) {
      return { isService: true, subtype: 'failover', unwrappedConfig: config.failover }
    } else if (config?.loadBalancer) {
      return { isService: true, subtype: 'loadBalancer', unwrappedConfig: config.loadBalancer }
    }

    // Default to loadBalancer if no subtype detected
    return { isService: true, subtype: 'loadBalancer', unwrappedConfig: config }
  }, [type, config])

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={`View ${type.slice(0, -1)}: ${resourceName}`}
      size="80%"
    >
      {isService && subtype ? (
        <ServiceSchemaForm
          protocol={protocol}
          subtype={subtype as 'loadBalancer' | 'weighted' | 'mirroring' | 'failover'}
          value={unwrappedConfig}
          onChange={() => {}} // No-op since readonly
          readonly={true}
        />
      ) : (
        <SchemaForm
          protocol={protocol}
          type={type}
          value={config}
          onChange={() => {}} // No-op since readonly
          readonly={true}
          resolvedSchema={resolvedSchema}
        />
      )}
    </Modal>
  )
}
