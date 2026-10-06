import { formatDate, formatDuration } from '../utils/format'
import { getPriorityLabel, getStatusLabel } from './ticketStorage'
import { formatPRStatus } from './prStorage'

export const NOTIFICATIONS_SEEN_KEY = 'taskMaster_notificationsSeenAt'

const describeTicketEntry = (entry) => {
  switch (entry.type) {
    case 'created':
      return { action: 'Created ticket', icon: 'bi-plus-circle', tone: 'info' }
    case 'status':
      return {
        action: `Moved to ${getStatusLabel(entry.to)}`,
        icon: entry.to === 'COMPLETED' ? 'bi-check2-circle' : 'bi-arrow-right-circle',
        tone: entry.to === 'COMPLETED' ? 'success' : 'info',
      }
    case 'priority':
      return {
        action: `Priority ${getPriorityLabel(entry.from)} → ${getPriorityLabel(entry.to)}`,
        icon: 'bi-flag',
        tone: 'warning',
      }
    case 'dueDate':
      return {
        action: entry.to
          ? `Due date set to ${formatDate(`${entry.to}T00:00`)}`
          : 'Due date removed',
        icon: 'bi-calendar-event',
        tone: 'warning',
      }
    case 'title':
    case 'ticketNumber':
      return { action: 'Renamed ticket', icon: 'bi-pencil', tone: 'neutral' }
    case 'description':
      return { action: 'Updated description', icon: 'bi-text-paragraph', tone: 'neutral' }
    case 'time':
      return {
        action: `Logged ${formatDuration(entry.duration)}`,
        icon: 'bi-stopwatch',
        tone: 'purple',
      }
    case 'prLinked':
      return { action: `Linked PR ${entry.branch}`, icon: 'bi-git', tone: 'purple' }
    case 'prUnlinked':
      return { action: `Unlinked PR ${entry.branch}`, icon: 'bi-git', tone: 'neutral' }
    case 'prMerged':
      return { action: `PR ${entry.branch} merged`, icon: 'bi-git', tone: 'success' }
    case 'noteLinked':
      return { action: `Linked note ${entry.noteTitle}`, icon: 'bi-journal-text', tone: 'warning' }
    default:
      return { action: 'Updated ticket', icon: 'bi-pencil', tone: 'neutral' }
  }
}

export const describeHistory = describeTicketEntry

export const buildActivity = ({ tickets = [], prs = [], notes = [] }) => {
  const events = []

  tickets.forEach((ticket) => {
    const title = [ticket.ticketNumber, ticket.title].filter(Boolean).join(' · ')
    const to = `/tasks/${ticket.id}`

    if (ticket.history.length === 0) {
      events.push({
        id: `ticket-${ticket.id}`,
        kind: 'ticket',
        title,
        action: ticket.updatedAt !== ticket.createdAt ? 'Updated ticket' : 'Created ticket',
        icon: 'bi-ticket-perforated',
        tone: 'info',
        date: ticket.updatedAt,
        to,
      })
      return
    }

    ticket.history.forEach((entry) => {
      events.push({
        id: `ticket-${ticket.id}-${entry.id}`,
        kind: 'ticket',
        title,
        date: entry.at,
        to,
        ...describeTicketEntry(entry),
      })
    })
  })

  prs.forEach((pr) => {
    const edited = pr.updatedAt && pr.updatedAt !== pr.createdAt

    events.push({
      id: `pr-${pr.id}`,
      kind: 'pr',
      title: pr.branchName || 'Untitled branch',
      action: edited ? `PR ${formatPRStatus(pr.status)}` : 'Created PR',
      icon: 'bi-git',
      tone: pr.status === 'merged' ? 'success' : 'purple',
      date: edited ? pr.updatedAt : pr.createdAt,
      to: `/pull-request?pr=${pr.id}`,
    })
  })

  notes
    .filter((note) => !note.deleted)
    .forEach((note) => {
      const edited = note.updatedAt !== note.createdAt

      events.push({
        id: `note-${note.id}`,
        kind: 'note',
        title: note.title || 'Untitled note',
        action: edited ? 'Updated note' : 'Created note',
        icon: 'bi-journal-text',
        tone: 'warning',
        date: note.updatedAt,
        to: `/notes?note=${note.id}`,
      })
    })

  return events
    .filter((event) => event.date)
    .sort((a, b) => new Date(b.date) - new Date(a.date))
}
