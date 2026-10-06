import { useMemo } from 'react'

import useStorageKey from './useStorageKey'
import { PROFILE_KEY, parseProfile } from '../services/profileStorage'

function useProfile() {
  const rawProfile = useStorageKey(PROFILE_KEY)

  const profile = useMemo(() => parseProfile(rawProfile), [rawProfile])

  return {
    profile,
    isSaved: rawProfile !== null,
  }
}

export default useProfile
