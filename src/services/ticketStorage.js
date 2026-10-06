import { parseJSON, readList, writeJSON } from './storage'
import { daysUntil } from '../utils/format'

export const TICKETS_KEY = 'taskMaster_tickets'

export const TICKET_STATUSES = [
  { value: 'TODO', label: 'To Do' },
  { value: 'IN_PROGRESS', label: 'In Progress' },
  { value: 'IN_REVIEW', label: 'In Review' },
  { value: 'COMPLETED', label: 'Completed' },
]

export const TICKET_PRIORITIES = [
  { value: 'LOW', label: 'Low', rank: 1 },
  { value: 'MEDIUM', label: 'Medium', rank: 2 },
  { value: 'HIGH', label: 'High', rank: 3 },
  { value: 'CRITICAL', label: 'Critical', rank: 4 },
]

const STATUS_VALUES = TICKET_STATUSES.map((status) => status.value)
const PRIORITY_VALUES = TICKET_PRIORITIES.map((priority) => priority.value)

export const getStatusLabel = (status) =>
  TICKET_STATUSES.find((item) => item.value === status)?.label ?? status

export const getPriorityLabel = (priority) =>
  TICKET_PRIORITIES.find((item) => item.value === priority)?.label ?? priority

export const getPriorityRank = (priority) =>
  TICKET_PRIORITIES.find((item) => item.value === priority)?.rank ?? 0

export const isTicketDone = (ticket) => ticket.status === 'COMPLETED'

const nowIso = () => new Date().toISOString()

const createId = () => crypto.randomUUID()

const createHistoryEntry = (type, details = {}) => ({
  ...details,
  id: createId(),
  type,
  at: details.at ?? nowIso(),
})

export const normalizeTicket = (ticket) => ({
  ...ticket,
  id: ticket.id ?? createId(),
  ticketNumber: ticket.ticketNumber ?? '',
  title: ticket.title ?? '',
  description: ticket.description ?? '',
  status: STATUS_VALUES.includes(ticket.status) ? ticket.status : 'TODO',
  priority: PRIORITY_VALUES.includes(ticket.priority)
    ? ticket.priority
    : 'MEDIUM',
  dueDate: typeof ticket.dueDate === 'string' ? ticket.dueDate : '',
  createdAt: ticket.createdAt ?? nowIso(),
  updatedAt: ticket.updatedAt ?? ticket.createdAt ?? nowIso(),
  completedAt: ticket.completedAt ?? null,
  history: Array.isArray(ticket.history) ? ticket.history : [],
  timeEntries: Array.isArray(ticket.timeEntries) ? ticket.timeEntries : [],
  timerStartedAt: ticket.timerStartedAt ?? null,
})

export const parseTickets = (raw) => {
  const value = parseJSON(raw, [])

  return Array.isArray(value) ? value.map(normalizeTicket) : []
}

export const getTickets = () => readList(TICKETS_KEY).map(normalizeTicket)

export const saveTickets = (tickets) => {
  writeJSON(TICKETS_KEY, tickets)
}

const cleanFields = (data) => {
  const fields = { ...data }

  if (typeof fields.ticketNumber === 'string') {
    fields.ticketNumber = fields.ticketNumber.trim().toUpperCase()
  }

  if (typeof fields.title === 'string') {
    fields.title = fields.title.trim()
  }

  if (typeof fields.description === 'string') {
    fields.description = fields.description.trim()
  }

  return fields
}

export const createTicket = (data) => {
  const now = nowIso()
  const fields = cleanFields(data)

  const ticket = normalizeTicket({
    ...fields,
    id: createId(),
    createdAt: now,
    updatedAt: now,
    completedAt: fields.status === 'COMPLETED' ? now : null,
    history: [createHistoryEntry('created', { at: now })],
    timeEntries: [],
    timerStartedAt: null,
  })

  saveTickets([...getTickets(), ticket])

  return ticket
}

const diffHistory = (previous, next) => {
  const entries = []

  ;['status', 'priority', 'dueDate', 'title', 'ticketNumber'].forEach(
    (field) => {
      if (previous[field] !== next[field]) {
        entries.push(
          createHistoryEntry(field, {
            from: previous[field],
            to: next[field],
          })
        )
      }
    }
  )

  if (previous.description !== next.description) {
    entries.push(createHistoryEntry('description'))
  }

  return entries
}

export const updateTicket = (id, changes, extraHistory = []) => {
  let updated = null
  const now = nowIso()

  const tickets = getTickets().map((ticket) => {
    if (ticket.id !== id) {
      return ticket
    }

    const next = {
      ...ticket,
      ...cleanFields(changes),
      updatedAt: now,
    }

    if (next.status !== ticket.status) {
      next.completedAt =
        next.status === 'COMPLETED' ? ticket.completedAt || now : null
    }

    next.history = [
      ...ticket.history,
      ...diffHistory(ticket, next),
      ...extraHistory.map((entry) => createHistoryEntry(entry.type, entry)),
    ]

    updated = next

    return next
  })

  if (updated) {
    saveTickets(tickets)
  }

  return updated
}

export const addTicketHistory = (id, entry) => updateTicket(id, {}, [entry])

export const deleteTicket = (id) => {
  const tickets = getTickets()
  const index = tickets.findIndex((ticket) => ticket.id === id)

  if (index === -1) {
    return null
  }

  const [ticket] = tickets.splice(index, 1)
  saveTickets(tickets)

  return { ticket, index }
}

export const restoreTicket = ({ ticket, index }) => {
  const tickets = getTickets().filter((item) => item.id !== ticket.id)
  tickets.splice(Math.min(index, tickets.length), 0, ticket)
  saveTickets(tickets)
}

const closeTimer = (ticket, end) => {
  const duration = new Date(end) - new Date(ticket.timerStartedAt)

  return {
    ...ticket,
    timerStartedAt: null,
    timeEntries: [
      ...ticket.timeEntries,
      { id: createId(), start: ticket.timerStartedAt, end },
    ],
    history: [
      ...ticket.history,
      createHistoryEntry('time', { duration, at: end }),
    ],
  }
}

export const startTimer = (id) => {
  const now = nowIso()

  saveTickets(
    getTickets().map((ticket) => {
      if (ticket.id === id) {
        return ticket.timerStartedAt
          ? ticket
          : { ...ticket, timerStartedAt: now }
      }

      return ticket.timerStartedAt ? closeTimer(ticket, now) : ticket
    })
  )
}

export const stopTimer = (id) => {
  const now = nowIso()

  saveTickets(
    getTickets().map((ticket) =>
      ticket.id === id && ticket.timerStartedAt
        ? closeTimer(ticket, now)
        : ticket
    )
  )
}

export const deleteTimeEntry = (ticketId, entryId) => {
  saveTickets(
    getTickets().map((ticket) =>
      ticket.id === ticketId
        ? {
            ...ticket,
            timeEntries: ticket.timeEntries.filter(
              (entry) => entry.id !== entryId
            ),
          }
        : ticket
    )
  )
}

const overlapMs = (start, end, since, until) =>
  Math.max(0, Math.min(end, until) - Math.max(start, since))

export const getTrackedMs = (
  ticket,
  now = Date.now(),
  since = 0,
  until = Infinity
) => {
  const logged = ticket.timeEntries.reduce(
    (total, entry) =>
      total +
      overlapMs(
        new Date(entry.start).getTime(),
        new Date(entry.end).getTime(),
        since,
        until
      ),
    0
  )

  const running = ticket.timerStartedAt
    ? overlapMs(new Date(ticket.timerStartedAt).getTime(), now, since, until)
    : 0

  return logged + running
}

export const getRunningTicket = (tickets) =>
  tickets.find((ticket) => ticket.timerStartedAt) ?? null

export const getDueState = (ticket, now = new Date()) => {
  if (!ticket.dueDate || isTicketDone(ticket)) {
    return null
  }

  const days = daysUntil(ticket.dueDate, now)

  if (days < 0) {
    return { state: 'overdue', days }
  }

  if (days === 0) {
    return { state: 'today', days }
  }

  if (days <= 7) {
    return { state: 'soon', days }
  }

  return { state: 'later', days }
}

export const describeDueState = (dueState) => {
  if (!dueState) {
    return ''
  }

  if (dueState.state === 'overdue') {
    const days = Math.abs(dueState.days)
    return `Overdue by ${days} ${days === 1 ? 'day' : 'days'}`
  }

  if (dueState.state === 'today') {
    return 'Due today'
  }

  if (dueState.days === 1) {
    return 'Due tomorrow'
  }

  return `Due in ${dueState.days} days`
}
