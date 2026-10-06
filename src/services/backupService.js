import { notifyAllChanged, readJSON, removeKey, writeJSON } from './storage'
import { TICKETS_KEY } from './ticketStorage'
import { PRS_KEY } from './prStorage'
import { NOTES_KEY } from './noteStorage'
import { PROFILE_KEY } from './profileStorage'

export const BACKUP_APP_ID = 'task-master'
export const BACKUP_VERSION = 1
export const STORAGE_QUOTA_BYTES = 5 * 1024 * 1024

export const createBackup = () => ({
  app: BACKUP_APP_ID,
  version: BACKUP_VERSION,
  exportedAt: new Date().toISOString(),
  data: {
    tickets: readJSON(TICKETS_KEY, []),
    pullRequests: readJSON(PRS_KEY, []),
    notes: readJSON(NOTES_KEY, []),
    profile: readJSON(PROFILE_KEY, null),
  },
})

export const getBackupFileName = (date = new Date()) =>
  `task-master-backup-${date.toISOString().slice(0, 10)}.json`

export const validateBackup = (backup) => {
  if (!backup || typeof backup !== 'object') {
    return 'This file is not a Task Master backup.'
  }

  if (backup.app !== BACKUP_APP_ID) {
    return 'This file is not a Task Master backup.'
  }

  if (typeof backup.version !== 'number' || backup.version > BACKUP_VERSION) {
    return 'This backup was made by a newer version of Task Master.'
  }

  const data = backup.data

  if (!data || typeof data !== 'object') {
    return 'The backup file has no data.'
  }

  for (const key of ['tickets', 'pullRequests', 'notes']) {
    if (!Array.isArray(data[key])) {
      return `The backup file is damaged: "${key}" is missing.`
    }
  }

  if (data.profile !== null && typeof data.profile !== 'object') {
    return 'The backup file is damaged: "profile" is invalid.'
  }

  return null
}

export const summarizeBackup = (backup) => ({
  tickets: backup.data.tickets.length,
  pullRequests: backup.data.pullRequests.length,
  notes: backup.data.notes.length,
  hasProfile: Boolean(backup.data.profile),
})

export const restoreBackup = (backup) => {
  const error = validateBackup(backup)

  if (error) {
    throw new Error(error)
  }

  const { tickets, pullRequests, notes, profile } = backup.data

  writeJSON(TICKETS_KEY, tickets)
  writeJSON(PRS_KEY, pullRequests)
  writeJSON(NOTES_KEY, notes)

  if (profile) {
    writeJSON(PROFILE_KEY, profile)
  } else {
    removeKey(PROFILE_KEY)
  }

  notifyAllChanged()
}

export const getStorageUsage = () => {
  let usedBytes = 0

  for (let index = 0; index < localStorage.length; index += 1) {
    const key = localStorage.key(index)
    const value = localStorage.getItem(key) ?? ''
    usedBytes += (key.length + value.length) * 2
  }

  return {
    usedBytes,
    quotaBytes: STORAGE_QUOTA_BYTES,
    percent: Math.min(100, (usedBytes / STORAGE_QUOTA_BYTES) * 100),
  }
}

export const formatBytes = (bytes) => {
  if (bytes < 1024) {
    return `${bytes} B`
  }

  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`
  }

  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`
}
