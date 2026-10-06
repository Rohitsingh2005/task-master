import { useCallback, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";

import Modal from "../../components/common/modal/Modal";
import TicketForm from "../../components/tickets/ticket-form/TicketForm";
import {
  DueBadge,
  PriorityBadge,
  StatusBadge,
} from "../../components/tickets/ticket-badges/TicketBadges";
import useNow from "../../hooks/useNow";
import useTicketActions from "../../hooks/useTicketActions";
import useToast from "../../hooks/useToast";
import {
  useNotes,
  usePullRequests,
  useTickets,
} from "../../hooks/useWorkspaceData";
import {
  addTicketHistory,
  deleteTimeEntry,
  describeDueState,
  getDueState,
  getPriorityLabel,
  getStatusLabel,
  getTrackedMs,
  TICKET_STATUSES,
  updateTicket,
} from "../../services/ticketStorage";
import { formatPRStatus, updatePR } from "../../services/prStorage";
import { createNote, updateNote } from "../../services/noteStorage";
import { describeHistory } from "../../services/activityService";
import {
  formatClock,
  formatDate,
  formatDateTime,
  formatDuration,
  formatRelativeTime,
  startOfWeek,
} from "../../utils/format";

import "./TicketDetailPage.css";

const FORM_TITLE_ID = "ticket-detail-form-title";

function TicketDetailPage() {
  const { ticketId } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const tickets = useTickets();
  const prs = usePullRequests();
  const notes = useNotes();
  const { removeTicket, changeStatus, toggleTimer } = useTicketActions();
  const [isEditing, setIsEditing] = useState(false);

  const ticket = tickets.find((item) => item.id === ticketId);
  const now = useNow(ticket?.timerStartedAt ? 1000 : 30000);

  const linkedPRs = prs.filter((pr) => pr.ticketId === ticketId);
  const availablePRs = prs.filter((pr) => !pr.ticketId);
  const linkedNotes = notes.filter((note) => note.ticketId === ticketId && !note.deleted);
  const availableNotes = notes.filter((note) => !note.ticketId && !note.deleted);

  const history = useMemo(
    () => (ticket ? [...ticket.history].reverse() : []),
    [ticket],
  );

  const closeEditor = useCallback(() => setIsEditing(false), []);

  if (!ticket) {
    return (
      <div className="ticket-detail-missing">
        <i className="bi bi-ticket-perforated"></i>
        <h1>Ticket not found</h1>
        <p>It may have been deleted, or the link is wrong.</p>
        <Link to="/tasks" className="btn btn-primary">
          Back to tickets
        </Link>
      </div>
    );
  }

  const tracked = getTrackedMs(ticket, now);
  const trackedThisWeek = getTrackedMs(ticket, now, startOfWeek(new Date(now)).getTime());
  const running = Boolean(ticket.timerStartedAt);
  const dueState = getDueState(ticket, new Date(now));

  const handleSave = (values) => {
    updateTicket(ticket.id, values);
    toast.success(`${ticket.ticketNumber} updated.`);
    setIsEditing(false);
  };

  const handleDelete = async () => {
    if (await removeTicket(ticket)) {
      navigate("/tasks");
    }
  };

  const linkPR = (prId) => {
    const pr = prs.find((item) => item.id === prId);

    if (!pr) return;

    updatePR(pr.id, { ticketId: ticket.id });
    addTicketHistory(ticket.id, { type: "prLinked", branch: pr.branchName || "Untitled branch" });
    toast.success(`Linked ${pr.branchName || "PR"} to ${ticket.ticketNumber}.`);
  };

  const unlinkPR = (pr) => {
    updatePR(pr.id, { ticketId: null });
    addTicketHistory(ticket.id, { type: "prUnlinked", branch: pr.branchName || "Untitled branch" });
    toast.info(`Unlinked ${pr.branchName || "PR"}.`);
  };

  const linkNote = (noteId) => {
    const note = notes.find((item) => item.id === noteId);

    if (!note) return;

    updateNote(note.id, { ticketId: ticket.id });
    addTicketHistory(ticket.id, { type: "noteLinked", noteTitle: note.title || "Untitled note" });
    toast.success(`Linked note to ${ticket.ticketNumber}.`);
  };

  const unlinkNote = (note) => {
    updateNote(note.id, { ticketId: null });
    toast.info("Note unlinked.");
  };

  const createLinkedNote = () => {
    const note = createNote({
      title: `${ticket.ticketNumber} notes`,
      ticketId: ticket.id,
    });

    addTicketHistory(ticket.id, { type: "noteLinked", noteTitle: note.title });
    navigate(`/notes?note=${note.id}`);
  };

  return (
    <div className="ticket-detail">
      <nav className="ticket-detail-breadcrumb" aria-label="Breadcrumb">
        <Link to="/tasks">
          <i className="bi bi-arrow-left"></i>
          Tickets
        </Link>
        <span>/</span>
        <span aria-current="page">{ticket.ticketNumber}</span>
      </nav>

      <header className="ticket-detail-header">
        <div className="ticket-detail-heading">
          <span className="ticket-detail-number">{ticket.ticketNumber}</span>
          <h1>{ticket.title}</h1>

          <div className="ticket-detail-badges">
            <StatusBadge status={ticket.status} />
            <PriorityBadge priority={ticket.priority} />
            {ticket.dueDate && <DueBadge ticket={ticket} now={new Date(now)} />}
          </div>
        </div>

        <div className="ticket-detail-actions">
          <select
            className="form-select"
            value={ticket.status}
            onChange={(event) => changeStatus(ticket, event.target.value)}
            aria-label="Change status"
          >
            {TICKET_STATUSES.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>

          <button type="button" className="btn btn-outline-primary" onClick={() => setIsEditing(true)}>
            <i className="bi bi-pencil me-2"></i>
            Edit
          </button>

          <button
            type="button"
            className="btn btn-outline-danger"
            onClick={handleDelete}
            aria-label="Delete ticket"
            title="Delete ticket"
          >
            <i className="bi bi-trash"></i>
          </button>
        </div>
      </header>

      <div className="ticket-detail-grid">
        <div className="ticket-detail-main">
          <section className="detail-card">
            <h2>Description</h2>

            {ticket.description ? (
              <p className="ticket-detail-description">{ticket.description}</p>
            ) : (
              <p className="detail-empty">
                No description yet.{" "}
                <button type="button" className="detail-link-button" onClick={() => setIsEditing(true)}>
                  Add one
                </button>
              </p>
            )}
          </section>

          <section className="detail-card">
            <div className="detail-card-header">
              <h2>
                Pull requests <span className="detail-count">{linkedPRs.length}</span>
              </h2>

              <Link to={`/pull-request?new=1&ticket=${ticket.id}`} className="btn btn-sm btn-light">
                <i className="bi bi-plus-lg me-1"></i>
                New PR
              </Link>
            </div>

            {linkedPRs.length === 0 ? (
              <p className="detail-empty">No pull requests linked to this ticket.</p>
            ) : (
              <ul className="linked-list">
                {linkedPRs.map((pr) => (
                  <li key={pr.id}>
                    <i className="bi bi-git linked-icon pr"></i>

                    <Link to={`/pull-request?pr=${pr.id}`} className="linked-title">
                      {pr.branchName || "Untitled branch"}
                    </Link>

                    <span className={`linked-pr-status status-${pr.status.replaceAll(" ", "-")}`}>
                      {formatPRStatus(pr.status)}
                    </span>

                    <button
                      type="button"
                      className="linked-remove"
                      onClick={() => unlinkPR(pr)}
                      aria-label={`Unlink ${pr.branchName}`}
                      title="Unlink"
                    >
                      <i className="bi bi-x-lg"></i>
                    </button>
                  </li>
                ))}
              </ul>
            )}

            {availablePRs.length > 0 && (
              <select
                className="form-select form-select-sm linked-picker"
                value=""
                onChange={(event) => linkPR(event.target.value)}
                aria-label="Link an existing pull request"
              >
                <option value="">+ Link an existing PR...</option>
                {availablePRs.map((pr) => (
                  <option key={pr.id} value={pr.id}>
                    {pr.branchName || "Untitled branch"} ({formatPRStatus(pr.status)})
                  </option>
                ))}
              </select>
            )}
          </section>

          <section className="detail-card">
            <div className="detail-card-header">
              <h2>
                Notes <span className="detail-count">{linkedNotes.length}</span>
              </h2>

              <button type="button" className="btn btn-sm btn-light" onClick={createLinkedNote}>
                <i className="bi bi-plus-lg me-1"></i>
                New note
              </button>
            </div>

            {linkedNotes.length === 0 ? (
              <p className="detail-empty">No notes linked to this ticket.</p>
            ) : (
              <ul className="linked-list">
                {linkedNotes.map((note) => (
                  <li key={note.id}>
                    <i className="bi bi-journal-text linked-icon note"></i>

                    <Link to={`/notes?note=${note.id}`} className="linked-title">
                      {note.title || "Untitled note"}
                      {note.content && <span className="linked-excerpt">{note.content}</span>}
                    </Link>

                    <button
                      type="button"
                      className="linked-remove"
                      onClick={() => unlinkNote(note)}
                      aria-label={`Unlink ${note.title || "note"}`}
                      title="Unlink"
                    >
                      <i className="bi bi-x-lg"></i>
                    </button>
                  </li>
                ))}
              </ul>
            )}

            {availableNotes.length > 0 && (
              <select
                className="form-select form-select-sm linked-picker"
                value=""
                onChange={(event) => linkNote(event.target.value)}
                aria-label="Link an existing note"
              >
                <option value="">+ Link an existing note...</option>
                {availableNotes.map((note) => (
                  <option key={note.id} value={note.id}>
                    {note.title || "Untitled note"}
                  </option>
                ))}
              </select>
            )}
          </section>

          <section className="detail-card">
            <h2>History</h2>

            {history.length === 0 ? (
              <p className="detail-empty">
                No history recorded yet. Changes from now on will appear here.
              </p>
            ) : (
              <ol className="history-list">
                {history.map((entry) => {
                  const description = describeHistory(entry);

                  return (
                    <li key={entry.id} className={`history-item tone-${description.tone}`}>
                      <span className="history-icon">
                        <i className={`bi ${description.icon}`}></i>
                      </span>

                      <span className="history-text">{description.action}</span>

                      <time
                        className="history-time"
                        dateTime={entry.at}
                        title={formatDateTime(entry.at)}
                      >
                        {formatRelativeTime(entry.at, now)}
                      </time>
                    </li>
                  );
                })}
              </ol>
            )}
          </section>
        </div>

        <aside className="ticket-detail-side">
          <section className={`detail-card timer-card ${running ? "is-running" : ""}`}>
            <h2>Time tracking</h2>

            <div className="timer-display">
              {running ? formatClock(tracked) : formatDuration(tracked)}
            </div>

            <div className="timer-subtitle">
              {running ? "Timer running" : "Total tracked"} · {formatDuration(trackedThisWeek)} this week
            </div>

            <button
              type="button"
              className={`btn w-100 ${running ? "btn-danger" : "btn-success"}`}
              onClick={() => toggleTimer(ticket)}
            >
              <i className={`bi ${running ? "bi-stop-fill" : "bi-play-fill"} me-2`}></i>
              {running ? "Stop timer" : "Start timer"}
            </button>

            {ticket.timeEntries.length > 0 && (
              <ul className="time-entries">
                {[...ticket.timeEntries].reverse().slice(0, 8).map((entry) => (
                  <li key={entry.id}>
                    <span>{formatDateTime(entry.start)}</span>
                    <strong>{formatDuration(new Date(entry.end) - new Date(entry.start))}</strong>
                    <button
                      type="button"
                      className="linked-remove"
                      onClick={() => deleteTimeEntry(ticket.id, entry.id)}
                      aria-label="Delete time entry"
                      title="Delete entry"
                    >
                      <i className="bi bi-x-lg"></i>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="detail-card">
            <h2>Details</h2>

            <dl className="detail-list">
              <dt>Status</dt>
              <dd>{getStatusLabel(ticket.status)}</dd>

              <dt>Priority</dt>
              <dd>{getPriorityLabel(ticket.priority)}</dd>

              <dt>Due date</dt>
              <dd>
                {ticket.dueDate ? (
                  <>
                    {formatDate(`${ticket.dueDate}T00:00`)}
                    {dueState && (
                      <span className={`detail-due-note due-${dueState.state}`}>
                        {describeDueState(dueState)}
                      </span>
                    )}
                  </>
                ) : (
                  "Not set"
                )}
              </dd>

              <dt>Created</dt>
              <dd>{formatDateTime(ticket.createdAt)}</dd>

              <dt>Updated</dt>
              <dd>{formatRelativeTime(ticket.updatedAt, now)}</dd>

              {ticket.completedAt && (
                <>
                  <dt>Completed</dt>
                  <dd>{formatDateTime(ticket.completedAt)}</dd>
                </>
              )}
            </dl>
          </section>
        </aside>
      </div>

      {isEditing && (
        <Modal titleId={FORM_TITLE_ID} onClose={closeEditor}>
          <TicketForm
            editingTicket={ticket}
            onSubmit={handleSave}
            onClose={closeEditor}
            titleId={FORM_TITLE_ID}
          />
        </Modal>
      )}
    </div>
  );
}

export default TicketDetailPage;
