import { useCallback, useSyncExternalStore } from 'react'

import { readRaw, subscribeToKey } from '../services/storage'

function useStorageKey(key) {
  const subscribe = useCallback(
    (onChange) => subscribeToKey(key, onChange),
    [key]
  )

  const getSnapshot = useCallback(() => readRaw(key), [key])

  return useSyncExternalStore(subscribe, getSnapshot)
}

export default useStorageKey
