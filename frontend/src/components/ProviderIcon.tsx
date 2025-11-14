import { Group, Text, Tooltip } from '@mantine/core'
import {
  IconFile,
  IconBrandDocker,
  IconServer,
  IconCloud,
  IconDatabase,
  IconApi,
  IconCircleLetterK,
  IconRouteAltLeft,
  IconHttpGet
} from '@tabler/icons-react'

interface ProviderIconProps {
  provider: string
  showText?: boolean
  size?: number
}

const providerConfig = {
  internal: { icon: IconRouteAltLeft, color: '#00aec1', label: 'Traefik Internal' },
  http: { icon: IconHttpGet, color: '#009a43', label: 'HTTP Provider' },
  file: { icon: IconFile, color: '#00aec1', label: 'File' },
  docker: { icon: IconBrandDocker, color: '#0db7ed', label: 'Docker' },
  kubernetes: { icon: IconCircleLetterK, color: '#326ce5', label: 'Kubernetes' },
  consul: { icon: IconServer, color: '#ca2171', label: 'Consul' },
  etcd: { icon: IconDatabase, color: '#419eda', label: 'etcd' },
  api: { icon: IconApi, color: '#00d4e6', label: 'API' },
  redis: { icon: IconDatabase, color: '#dc382d', label: 'Redis' },
  zookeeper: { icon: IconServer, color: '#ff9900', label: 'ZooKeeper' },
  marathon: { icon: IconServer, color: '#00aec1', label: 'Marathon' },
  rancher: { icon: IconServer, color: '#0075a8', label: 'Rancher' },
}

export function ProviderIcon({ provider, showText = false, size = 20 }: ProviderIconProps) {
  const config = providerConfig[provider as keyof typeof providerConfig] || {
    icon: IconCloud,
    color: 'gray',
    label: provider || 'Unknown'
  }
  
  const Icon = config.icon

  return (
    <Tooltip label={config.label}>
      <div style={{ display: 'inline-flex', alignItems: 'center' }}>
        <Icon size={size} color={config.color} />
      </div>
    </Tooltip>
  )
}