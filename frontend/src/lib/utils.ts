import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getProviderIcon(provider: string) {
  switch (provider) {
    case 'file':
      return 'file-text'
    case 'docker':
      return 'container'
    case 'docker_swarm':
      return 'layers'
    default:
      return 'box'
  }
}

export function getProviderColor(provider: string) {
  switch (provider) {
    case 'file':
      return 'text-blue-500 bg-blue-50'
    case 'docker':
      return 'text-cyan-500 bg-cyan-50'
    case 'docker_swarm':
      return 'text-purple-500 bg-purple-50'
    default:
      return 'text-gray-500 bg-gray-50'
  }
}