import { useMemo } from 'react'

import useStorageKey from './useStorageKey'
import { TICKETS_KEY, parseTickets } from '../services/ticketStorage'
import { PRS_KEY, parsePRs } from '../services/prStorage'
import { NOTES_KEY, parseNotes } from '../services/noteStorage'

export function useTickets() {
  const raw = useStorageKey(TICKETS_KEY)

  return useMemo(() => parseTickets(raw), [raw])
}

export function usePullRequests() {
  const raw = useStorageKey(PRS_KEY)

  return useMemo(() => parsePRs(raw), [raw])
}

export function useNotes() {
  const raw = useStorageKey(NOTES_KEY)

  return useMemo(() => parseNotes(raw), [raw])
}
