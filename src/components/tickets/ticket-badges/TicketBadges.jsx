import {
  describeDueState,
  getDueState,
  getPriorityLabel,
  getStatusLabel,
} from "../../../services/ticketStorage";
import { formatDate } from "../../../utils/format";

import "./TicketBadges.css";

const PRIORITY_ICONS = {
  LOW: "bi-chevron-double-down",
  MEDIUM: "bi-dash-lg",
  HIGH: "bi-chevron-up",
  CRITICAL: "bi-chevron-double-up",
};

export function StatusBadge({ status }) {
  return (
    <span className={`ticket-status-badge status-${status.toLowerCase()}`}>
      {getStatusLabel(status)}
    </span>
  );
}

export function PriorityBadge({ priority, compact = false }) {
  return (
    <span
      className={`ticket-priority priority-${priority.toLowerCase()}`}
      title={`${getPriorityLabel(priority)} priority`}
    >
      <i className={`bi ${PRIORITY_ICONS[priority] ?? "bi-dash-lg"}`}></i>
      {!compact && getPriorityLabel(priority)}
    </span>
  );
}

export function DueBadge({ ticket, now, showDate = true }) {
  if (!ticket.dueDate) {
    return showDate ? <span className="ticket-due-empty">—</span> : null;
  }

  const dueState = getDueState(ticket, now);
  const label = formatDate(`${ticket.dueDate}T00:00`, { year: undefined });

  return (
    <span
      className={`ticket-due due-${dueState?.state ?? "done"}`}
      title={dueState ? describeDueState(dueState) : `Due ${label}`}
    >
      <i
        className={`bi ${
          dueState?.state === "overdue" ? "bi-exclamation-circle-fill" : "bi-calendar3"
        }`}
      ></i>
      {dueState?.state === "overdue"
        ? "Overdue"
        : dueState?.state === "today"
          ? "Today"
          : label}
    </span>
  );
}

export function TimeBadge({ label, running = false }) {
  return (
    <span className={`ticket-time ${running ? "is-running" : ""}`}>
      <i className={`bi ${running ? "bi-record-circle-fill" : "bi-stopwatch"}`}></i>
      {label}
    </span>
  );
}
