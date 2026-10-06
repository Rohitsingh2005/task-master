import { useState } from "react";

import {
  DueBadge,
  PriorityBadge,
  TimeBadge,
} from "../ticket-badges/TicketBadges";
import {
  getTrackedMs,
  TICKET_STATUSES,
} from "../../../services/ticketStorage";
import { formatClock, formatDuration } from "../../../utils/format";

import "./TicketBoard.css";

const STATUS_ORDER = TICKET_STATUSES.map((status) => status.value);

function BoardCard({ ticket, now, prCount, onOpen, onMove, onDragStart, onDragEnd }) {
  const tracked = getTrackedMs(ticket, now);
  const running = Boolean(ticket.timerStartedAt);
  const statusIndex = STATUS_ORDER.indexOf(ticket.status);

  const handleKeyDown = (event) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      onOpen(ticket);
      return;
    }

    if (event.key === "ArrowRight" && statusIndex < STATUS_ORDER.length - 1) {
      event.preventDefault();
      onMove(ticket, STATUS_ORDER[statusIndex + 1]);
    }

    if (event.key === "ArrowLeft" && statusIndex > 0) {
      event.preventDefault();
      onMove(ticket, STATUS_ORDER[statusIndex - 1]);
    }
  };

  return (
    <div
      role="button"
      tabIndex={0}
      className={`board-card priority-edge-${ticket.priority.toLowerCase()}`}
      draggable
      onDragStart={(event) => onDragStart(event, ticket)}
      onDragEnd={onDragEnd}
      onClick={() => onOpen(ticket)}
      onKeyDown={handleKeyDown}
      aria-label={`${ticket.ticketNumber}: ${ticket.title}. Press left or right arrow to change status.`}
    >
      <span className="board-card-top">
        <span className="board-card-number">{ticket.ticketNumber}</span>
        <PriorityBadge priority={ticket.priority} compact />
      </span>

      <span className="board-card-title">{ticket.title}</span>

      <span className="board-card-meta">
        <DueBadge ticket={ticket} now={now} showDate={false} />

        {(tracked > 0 || running) && (
          <TimeBadge
            running={running}
            label={running ? formatClock(tracked) : formatDuration(tracked)}
          />
        )}

        {prCount > 0 && (
          <span className="board-card-prs" title={`${prCount} linked PRs`}>
            <i className="bi bi-git"></i>
            {prCount}
          </span>
        )}
      </span>
    </div>
  );
}

function TicketBoard({ tickets, now, prCounts, onOpen, onMove, onCreate }) {
  const [draggingId, setDraggingId] = useState(null);
  const [dropTarget, setDropTarget] = useState(null);

  const handleDragStart = (event, ticket) => {
    event.dataTransfer.setData("text/plain", ticket.id);
    event.dataTransfer.effectAllowed = "move";
    setDraggingId(ticket.id);
  };

  const handleDragEnd = () => {
    setDraggingId(null);
    setDropTarget(null);
  };

  const handleDrop = (event, status) => {
    event.preventDefault();

    const ticketId = event.dataTransfer.getData("text/plain");
    const ticket = tickets.find((item) => item.id === ticketId);

    if (ticket) {
      onMove(ticket, status);
    }

    handleDragEnd();
  };

  return (
    <div className="ticket-board">
      {TICKET_STATUSES.map((column) => {
        const columnTickets = tickets.filter(
          (ticket) => ticket.status === column.value,
        );

        return (
          <section
            key={column.value}
            className={`board-column status-${column.value.toLowerCase()} ${
              dropTarget === column.value ? "is-drop-target" : ""
            }`}
            onDragOver={(event) => {
              event.preventDefault();
              event.dataTransfer.dropEffect = "move";
              setDropTarget(column.value);
            }}
            onDragLeave={(event) => {
              if (!event.currentTarget.contains(event.relatedTarget)) {
                setDropTarget(null);
              }
            }}
            onDrop={(event) => handleDrop(event, column.value)}
            aria-label={`${column.label} column`}
          >
            <header className="board-column-header">
              <span className="board-column-dot" aria-hidden="true" />
              <h2>{column.label}</h2>
              <span className="board-column-count">{columnTickets.length}</span>

              <button
                type="button"
                className="board-column-add"
                onClick={() => onCreate(column.value)}
                aria-label={`Create ticket in ${column.label}`}
                title={`Create ticket in ${column.label}`}
              >
                <i className="bi bi-plus-lg"></i>
              </button>
            </header>

            <div className="board-column-body">
              {columnTickets.map((ticket) => (
                <div
                  key={ticket.id}
                  className={draggingId === ticket.id ? "board-card-ghost" : ""}
                >
                  <BoardCard
                    ticket={ticket}
                    now={now}
                    prCount={prCounts[ticket.id] ?? 0}
                    onOpen={onOpen}
                    onMove={onMove}
                    onDragStart={handleDragStart}
                    onDragEnd={handleDragEnd}
                  />
                </div>
              ))}

              {columnTickets.length === 0 && (
                <div className="board-column-empty">
                  {dropTarget === column.value ? "Drop here" : "No tickets"}
                </div>
              )}
            </div>
          </section>
        );
      })}
    </div>
  );
}

export default TicketBoard;
