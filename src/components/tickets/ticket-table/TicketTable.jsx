import { Link, useNavigate } from "react-router-dom";

import {
  DueBadge,
  PriorityBadge,
  StatusBadge,
  TimeBadge,
} from "../ticket-badges/TicketBadges";
import { getTrackedMs } from "../../../services/ticketStorage";
import { formatClock, formatDuration } from "../../../utils/format";

import "./TicketTable.css";

function TicketTable({ tickets, now, onEdit, onDelete, onToggleTimer }) {
  const navigate = useNavigate();

  const openTicket = (event, ticket) => {
    if (event.target.closest("button, a")) {
      return;
    }

    navigate(`/tasks/${ticket.id}`);
  };

  return (
    <div className="card border-0 shadow-sm ticket-table-card">
      <div className="table-responsive">
        <table className="table table-hover align-middle mb-0 ticket-table">
          <thead className="table-light">
            <tr>
              <th className="ps-4">Ticket</th>
              <th>Title</th>
              <th>Status</th>
              <th>Priority</th>
              <th>Due</th>
              <th>Time</th>
              <th className="text-end pe-4">Actions</th>
            </tr>
          </thead>

          <tbody>
            {tickets.map((ticket) => {
              const tracked = getTrackedMs(ticket, now);
              const running = Boolean(ticket.timerStartedAt);

              return (
                <tr
                  key={ticket.id}
                  className="ticket-row"
                  onClick={(event) => openTicket(event, ticket)}
                >
                  <td className="ps-4 ticket-cell-number">
                    <Link
                      to={`/tasks/${ticket.id}`}
                      className="ticket-number-link"
                    >
                      {ticket.ticketNumber}
                    </Link>
                  </td>

                  <td className="ticket-cell-title">
                    <div className="fw-medium ticket-title-cell">
                      {ticket.title}
                    </div>

                    {ticket.description && (
                      <div className="text-muted small text-truncate ticket-description">
                        {ticket.description}
                      </div>
                    )}
                  </td>

                  <td className="ticket-cell-meta">
                    <StatusBadge status={ticket.status} />
                  </td>

                  <td className="ticket-cell-meta">
                    <PriorityBadge priority={ticket.priority} />
                  </td>

                  <td className="ticket-cell-meta">
                    <DueBadge ticket={ticket} now={now} />
                  </td>

                  <td className="ticket-cell-meta">
                    {tracked > 0 || running ? (
                      <TimeBadge
                        running={running}
                        label={running ? formatClock(tracked) : formatDuration(tracked)}
                      />
                    ) : (
                      <span className="ticket-due-empty">—</span>
                    )}
                  </td>

                  <td className="text-end pe-4 ticket-cell-actions">
                    <div className="d-flex justify-content-end gap-2">
                      <button
                        type="button"
                        className={`btn btn-sm ${
                          running ? "btn-success" : "btn-outline-secondary"
                        } ticket-timer-button`}
                        onClick={() => onToggleTimer(ticket)}
                        title={running ? "Stop timer" : "Start timer"}
                        aria-label={`${running ? "Stop" : "Start"} timer on ${ticket.ticketNumber}`}
                      >
                        <i className={`bi ${running ? "bi-stop-fill" : "bi-play-fill"}`}></i>
                      </button>

                      <button
                        type="button"
                        className="btn btn-sm btn-outline-primary"
                        onClick={() => onEdit(ticket)}
                        title="Edit ticket"
                        aria-label={`Edit ${ticket.ticketNumber}`}
                      >
                        <i className="bi bi-pencil"></i>
                      </button>

                      <button
                        type="button"
                        className="btn btn-sm btn-outline-danger"
                        onClick={() => onDelete(ticket)}
                        title="Delete ticket"
                        aria-label={`Delete ${ticket.ticketNumber}`}
                      >
                        <i className="bi bi-trash"></i>
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default TicketTable;
