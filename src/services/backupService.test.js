import { describe, expect, it } from 'vitest'

import {
  createBackup,
  getStorageUsage,
  restoreBackup,
  summarizeBackup,
  validateBackup,
} from './backupService'
import { createTicket, getTickets } from './ticketStorage'

describe('validateBackup', () => {
  it('accepts a backup created by the app', () => {
    createTicket({ ticketNumber: 'B-1', title: 'Backup me', status: 'TODO', priority: 'LOW' })

    expect(validateBackup(createBackup())).toBeNull()
  })

  it.each([
    [null, 'not a Task Master backup'],
    [{ app: 'other' }, 'not a Task Master backup'],
    [{ app: 'task-master', version: 99, data: {} }, 'newer version'],
    [{ app: 'task-master', version: 1 }, 'no data'],
    [
      { app: 'task-master', version: 1, data: { tickets: [], notes: [], profile: null } },
      'pullRequests',
    ],
  ])('rejects invalid input %#', (backup, message) => {
    expect(validateBackup(backup)).toContain(message)
  })
})

describe('restoreBackup', () => {
  it('replaces stored data with the backup contents', () => {
    createTicket({ ticketNumber: 'OLD-1', title: 'Old', status: 'TODO', priority: 'LOW' })
    const backup = createBackup()

    createTicket({ ticketNumber: 'NEW-1', title: 'New', status: 'TODO', priority: 'LOW' })
    expect(getTickets()).toHaveLength(2)

    restoreBackup(backup)

    expect(getTickets().map((ticket) => ticket.ticketNumber)).toEqual(['OLD-1'])
  })

  it('throws for an invalid backup and keeps existing data', () => {
    createTicket({ ticketNumber: 'KEEP-1', title: 'Keep', status: 'TODO', priority: 'LOW' })

    expect(() => restoreBackup({ app: 'nope' })).toThrow()
    expect(getTickets()).toHaveLength(1)
  })
})

describe('summarizeBackup and getStorageUsage', () => {
  it('counts the backup contents', () => {
    createTicket({ ticketNumber: 'S-1', title: 'Sum', status: 'TODO', priority: 'LOW' })

    expect(summarizeBackup(createBackup())).toEqual({
      tickets: 1,
      pullRequests: 0,
      notes: 0,
      hasProfile: false,
    })
  })

  it('reports the bytes used in localStorage', () => {
    localStorage.setItem('ab', 'cd')

    expect(getStorageUsage().usedBytes).toBe(8)
  })
})
