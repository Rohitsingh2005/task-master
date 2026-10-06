import { describe, expect, it } from 'vitest'

import {
  countActiveFilters,
  DEFAULT_TICKET_FILTERS,
  filterTickets,
  sortTickets,
} from './ticketFilters'

const now = new Date(2026, 9, 10)

const tickets = [
  {
    id: '1',
    ticketNumber: 'PROJ-10',
    title: 'Login timeout',
    description: 'Session expires early',
    status: 'TODO',
    priority: 'HIGH',
    dueDate: '2026-10-08',
    createdAt: '2026-10-01T00:00:00Z',
    updatedAt: '2026-10-09T00:00:00Z',
  },
  {
    id: '2',
    ticketNumber: 'PROJ-2',
    title: 'Dark mode',
    description: '',
    status: 'COMPLETED',
    priority: 'LOW',
    dueDate: '',
    createdAt: '2026-10-03T00:00:00Z',
    updatedAt: '2026-10-03T00:00:00Z',
  },
  {
    id: '3',
    ticketNumber: 'API-7',
    title: 'Rate limits',
    description: 'Add throttling',
    status: 'IN_PROGRESS',
    priority: 'CRITICAL',
    dueDate: '2026-10-12',
    createdAt: '2026-10-02T00:00:00Z',
    updatedAt: '2026-10-02T00:00:00Z',
  },
]

const ids = (list) => list.map((ticket) => ticket.id)

const withFilters = (changes) => ({ ...DEFAULT_TICKET_FILTERS, ...changes })

describe('filterTickets', () => {
  it('searches number, title and description case-insensitively', () => {
    expect(ids(filterTickets(tickets, withFilters({ search: 'proj' }), now))).toEqual(['1', '2'])
    expect(ids(filterTickets(tickets, withFilters({ search: 'THROTTL' }), now))).toEqual(['3'])
  })

  it('filters by status and priority', () => {
    expect(ids(filterTickets(tickets, withFilters({ status: 'COMPLETED' }), now))).toEqual(['2'])
    expect(ids(filterTickets(tickets, withFilters({ priority: 'CRITICAL' }), now))).toEqual(['3'])
  })

  it('filters by due date', () => {
    expect(ids(filterTickets(tickets, withFilters({ due: 'overdue' }), now))).toEqual(['1'])
    expect(ids(filterTickets(tickets, withFilters({ due: 'week' }), now))).toEqual(['1', '3'])
    expect(ids(filterTickets(tickets, withFilters({ due: 'none' }), now))).toEqual(['2'])
  })
})

describe('sortTickets', () => {
  it.each([
    ['created-desc', ['2', '3', '1']],
    ['created-asc', ['1', '3', '2']],
    ['priority-desc', ['3', '1', '2']],
    ['due-asc', ['1', '3', '2']],
    ['number-asc', ['3', '2', '1']],
  ])('sorts by %s', (sort, expected) => {
    expect(ids(sortTickets(tickets, sort))).toEqual(expected)
  })

  it('does not mutate the input', () => {
    const copy = [...tickets]
    sortTickets(tickets, 'priority-desc')
    expect(tickets).toEqual(copy)
  })
})

describe('countActiveFilters', () => {
  it('counts search and non-default selects', () => {
    expect(countActiveFilters(DEFAULT_TICKET_FILTERS)).toBe(0)
    expect(countActiveFilters(withFilters({ search: 'x', priority: 'LOW', sort: 'due-asc' }))).toBe(2)
  })
})
