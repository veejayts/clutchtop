import { useMemo } from 'react'
import { useSettingsStore } from '../store/settings'
import { createProvider } from '../providers/registry'
import type { AIProvider, ProviderId } from '../providers/types'

export function useProvider(overrideId?: ProviderId): AIProvider {
  const { defaultProvider, providers } = useSettingsStore()
  const providerId = overrideId ?? defaultProvider

  return useMemo(() => {
    const config = providers[providerId] ?? { defaultModel: '' }
    return createProvider(providerId as ProviderId, config)
  }, [providerId, providers])
}
