import { useCallback } from 'react'

import useConfirm from './useConfirm'
import useToast from './useToast'
import {
  deleteTicket,
  getStatusLabel,
  restoreTicket,
  startTimer,
  stopTimer,
  updateTicket,
} from '../services/ticketStorage'

function useTicketActions() {
  const confirm = useConfirm()
  const toast = useToast()

  const removeTicket = useCallback(
    async (ticket) => {
      const confirmed = await confirm({
        title: `Delete ${ticket.ticketNumber}?`,
        message: `"${ticket.title}" will be removed along with its history and tracked time. You can undo this for a few seconds.`,
        confirmLabel: 'Delete ticket',
      })

      if (!confirmed) {
        return false
      }

      const removed = deleteTicket(ticket.id)

      if (removed) {
        toast.success(`${ticket.ticketNumber} deleted.`, {
          action: {
            label: 'Undo',
            onClick: () => {
              restoreTicket(removed)
              toast.info(`${ticket.ticketNumber} restored.`)
            },
          },
        })
      }

      return Boolean(removed)
    },
    [confirm, toast]
  )

  const changeStatus = useCallback(
    (ticket, status) => {
      if (ticket.status === status) {
        return
      }

      updateTicket(ticket.id, { status })
      toast.success(`${ticket.ticketNumber} moved to ${getStatusLabel(status)}.`)
    },
    [toast]
  )

  const toggleTimer = useCallback(
    (ticket) => {
      if (ticket.timerStartedAt) {
        stopTimer(ticket.id)
        toast.info(`Timer stopped on ${ticket.ticketNumber}.`)
      } else {
        startTimer(ticket.id)
        toast.info(`Timer started on ${ticket.ticketNumber}.`)
      }
    },
    [toast]
  )

  return { removeTicket, changeStatus, toggleTimer }
}

export default useTicketActions
