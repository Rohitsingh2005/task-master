import { getDueState, getPriorityRank } from '../services/ticketStorage'

export const DEFAULT_TICKET_FILTERS = {
  search: '',
  status: 'ALL',
  priority: 'ALL',
  due: 'ALL',
  sort: 'created-desc',
}

export const DUE_FILTERS = [
  { value: 'ALL', label: 'Any due date' },
  { value: 'overdue', label: 'Overdue' },
  { value: 'week', label: 'Due within 7 days' },
  { value: 'none', label: 'No due date' },
]

export const TICKET_SORTS = [
  { value: 'created-desc', label: 'Newest first' },
  { value: 'created-asc', label: 'Oldest first' },
  { value: 'updated-desc', label: 'Recently updated' },
  { value: 'priority-desc', label: 'Highest priority' },
  { value: 'due-asc', label: 'Due date (soonest)' },
  { value: 'number-asc', label: 'Ticket number' },
]

const matchesDue = (ticket, due, now) => {
  if (due === 'ALL') {
    return true
  }

  if (due === 'none') {
    return !ticket.dueDate
  }

  const dueState = getDueState(ticket, now)

  if (due === 'overdue') {
    return dueState?.state === 'overdue'
  }

  if (due === 'week') {
    return Boolean(dueState) && dueState.state !== 'later'
  }

  return true
}

export const filterTickets = (tickets, filters, now = new Date()) => {
  const query = filters.search.trim().toLowerCase()

  return tickets.filter((ticket) => {
    if (filters.status !== 'ALL' && ticket.status !== filters.status) {
      return false
    }

    if (filters.priority !== 'ALL' && ticket.priority !== filters.priority) {
      return false
    }

    if (!matchesDue(ticket, filters.due, now)) {
      return false
    }

    if (!query) {
      return true
    }

    return [ticket.ticketNumber, ticket.title, ticket.description].some(
      (value) => value.toLowerCase().includes(query)
    )
  })
}

const byDate = (field, direction) => (a, b) =>
  direction * (new Date(a[field]) - new Date(b[field]))

const SORTERS = {
  'created-desc': byDate('createdAt', -1),
  'created-asc': byDate('createdAt', 1),
  'updated-desc': byDate('updatedAt', -1),
  'priority-desc': (a, b) =>
    getPriorityRank(b.priority) - getPriorityRank(a.priority) ||
    byDate('createdAt', -1)(a, b),
  'due-asc': (a, b) => {
    if (!a.dueDate && !b.dueDate) return 0
    if (!a.dueDate) return 1
    if (!b.dueDate) return -1
    return a.dueDate.localeCompare(b.dueDate)
  },
  'number-asc': (a, b) =>
    a.ticketNumber.localeCompare(b.ticketNumber, undefined, { numeric: true }),
}

export const sortTickets = (tickets, sort) => {
  const sorter = SORTERS[sort] ?? SORTERS['created-desc']

  return [...tickets].sort(sorter)
}

export const countActiveFilters = (filters) =>
  ['status', 'priority', 'due'].filter((key) => filters[key] !== 'ALL').length +
  (filters.search.trim() ? 1 : 0)
