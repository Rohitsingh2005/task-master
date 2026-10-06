import { afterEach, describe, expect, it, vi } from 'vitest'

import {
  addTicketHistory,
  createTicket,
  deleteTicket,
  getDueState,
  getTickets,
  getTrackedMs,
  restoreTicket,
  startTimer,
  stopTimer,
  updateTicket,
} from './ticketStorage'

const baseTicket = {
  ticketNumber: ' proj-1 ',
  title: '  Fix login  ',
  description: '',
  status: 'TODO',
  priority: 'MEDIUM',
  dueDate: '',
}

afterEach(() => {
  vi.useRealTimers()
})

describe('createTicket', () => {
  it('cleans fields and records a created entry', () => {
    const ticket = createTicket(baseTicket)

    expect(ticket.ticketNumber).toBe('PROJ-1')
    expect(ticket.title).toBe('Fix login')
    expect(ticket.history.map((entry) => entry.type)).toEqual(['created'])
    expect(getTickets()).toHaveLength(1)
  })

  it('sets completedAt when created as completed', () => {
    const ticket = createTicket({ ...baseTicket, status: 'COMPLETED' })

    expect(ticket.completedAt).not.toBeNull()
  })
})

describe('updateTicket', () => {
  it('records a history entry for each changed field', () => {
    const ticket = createTicket(baseTicket)

    const updated = updateTicket(ticket.id, {
      status: 'IN_PROGRESS',
      priority: 'HIGH',
      description: 'More detail',
    })

    expect(updated.history.map((entry) => entry.type)).toEqual([
      'created',
      'status',
      'priority',
      'description',
    ])
    expect(updated.history[1]).toMatchObject({ from: 'TODO', to: 'IN_PROGRESS' })
  })

  it('sets and clears completedAt as the status changes', () => {
    const ticket = createTicket(baseTicket)

    expect(updateTicket(ticket.id, { status: 'COMPLETED' }).completedAt).not.toBeNull()
    expect(updateTicket(ticket.id, { status: 'IN_REVIEW' }).completedAt).toBeNull()
  })

  it('adds extra history entries without changing fields', () => {
    const ticket = createTicket(baseTicket)

    const updated = addTicketHistory(ticket.id, { type: 'prLinked', branch: 'feature/x' })

    expect(updated.history.at(-1)).toMatchObject({ type: 'prLinked', branch: 'feature/x' })
    expect(updated.status).toBe('TODO')
  })
})

describe('deleteTicket and restoreTicket', () => {
  it('restores a deleted ticket at its original position', () => {
    createTicket({ ...baseTicket, ticketNumber: 'A-1' })
    const middle = createTicket({ ...baseTicket, ticketNumber: 'A-2' })
    createTicket({ ...baseTicket, ticketNumber: 'A-3' })

    const removed = deleteTicket(middle.id)

    expect(getTickets().map((ticket) => ticket.ticketNumber)).toEqual(['A-1', 'A-3'])

    restoreTicket(removed)

    expect(getTickets().map((ticket) => ticket.ticketNumber)).toEqual(['A-1', 'A-2', 'A-3'])
  })
})

describe('time tracking', () => {
  it('logs an entry when the timer stops', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-10-05T09:00:00Z'))

    const ticket = createTicket(baseTicket)
    startTimer(ticket.id)

    vi.setSystemTime(new Date('2026-10-05T09:30:00Z'))
    stopTimer(ticket.id)

    const stopped = getTickets()[0]

    expect(stopped.timerStartedAt).toBeNull()
    expect(stopped.timeEntries).toHaveLength(1)
    expect(getTrackedMs(stopped)).toBe(30 * 60 * 1000)
    expect(stopped.history.at(-1)).toMatchObject({ type: 'time', duration: 30 * 60 * 1000 })
  })

  it('only runs one timer at a time', () => {
    const first = createTicket({ ...baseTicket, ticketNumber: 'T-1' })
    const second = createTicket({ ...baseTicket, ticketNumber: 'T-2' })

    startTimer(first.id)
    startTimer(second.id)

    const [a, b] = getTickets()

    expect(a.timerStartedAt).toBeNull()
    expect(a.timeEntries).toHaveLength(1)
    expect(b.timerStartedAt).not.toBeNull()
  })

  it('counts only the time inside the requested range', () => {
    const ticket = {
      timerStartedAt: null,
      timeEntries: [
        { id: '1', start: '2026-10-05T08:00:00Z', end: '2026-10-05T10:00:00Z' },
      ],
    }

    const since = new Date('2026-10-05T09:00:00Z').getTime()

    expect(getTrackedMs(ticket, Date.now(), since)).toBe(60 * 60 * 1000)
  })
})

describe('getDueState', () => {
  const now = new Date(2026, 9, 10, 15, 0)

  it.each([
    ['2026-10-08', 'overdue', -2],
    ['2026-10-10', 'today', 0],
    ['2026-10-13', 'soon', 3],
    ['2026-10-30', 'later', 20],
  ])('treats %s as %s', (dueDate, state, days) => {
    expect(getDueState({ dueDate, status: 'TODO' }, now)).toEqual({ state, days })
  })

  it('ignores due dates on completed tickets', () => {
    expect(getDueState({ dueDate: '2026-10-01', status: 'COMPLETED' }, now)).toBeNull()
  })
})
