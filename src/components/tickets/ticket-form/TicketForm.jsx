import { useState } from "react";

import { useTickets } from "../../../hooks/useWorkspaceData";
import {
  TICKET_PRIORITIES,
  TICKET_STATUSES,
} from "../../../services/ticketStorage";

import "./TicketForm.css";

function TicketForm({ editingTicket, initialStatus, onSubmit, onClose, titleId }) {
  const tickets = useTickets();

  const [ticketNumber, setTicketNumber] = useState(
    editingTicket?.ticketNumber ?? "",
  );
  const [title, setTitle] = useState(editingTicket?.title ?? "");
  const [description, setDescription] = useState(
    editingTicket?.description ?? "",
  );
  const [status, setStatus] = useState(
    editingTicket?.status ?? initialStatus ?? "TODO",
  );
  const [priority, setPriority] = useState(
    editingTicket?.priority ?? "MEDIUM",
  );
  const [dueDate, setDueDate] = useState(editingTicket?.dueDate ?? "");

  const normalizedNumber = ticketNumber.trim().toUpperCase();

  const isDuplicate =
    normalizedNumber !== "" &&
    tickets.some(
      (ticket) =>
        ticket.ticketNumber === normalizedNumber &&
        ticket.id !== editingTicket?.id,
    );

  const canSubmit = normalizedNumber && title.trim() && !isDuplicate;

  const handleSubmit = (event) => {
    event.preventDefault();

    if (!canSubmit) {
      return;
    }

    onSubmit({
      ticketNumber,
      title,
      description,
      status,
      priority,
      dueDate,
    });
  };

  return (
    <form onSubmit={handleSubmit}>
      <div
        className="ticket-form-header"
        data-drag-handle
        title="Drag to move, double-click to re-center"
      >
        <div className="ticket-form-heading">
          <div className="ticket-form-icon">
            <i
              className={`bi ${
                editingTicket ? "bi-pencil-square" : "bi-ticket-perforated"
              }`}
            ></i>
          </div>

          <div>
            <h2 id={titleId}>
              {editingTicket
                ? `Edit ${editingTicket.ticketNumber}`
                : "Create Jira Ticket"}
            </h2>

            <p>
              {editingTicket
                ? "Update the ticket information."
                : "Add a ticket to your Task Master workspace."}
            </p>
          </div>
        </div>

        <button
          type="button"
          className="ticket-form-close"
          onClick={onClose}
          aria-label="Close"
        >
          <i className="bi bi-x-lg"></i>
        </button>
      </div>

      <div className="ticket-form-body">
        <div className="row g-3">
          <div className="col-sm-5">
            <label className="form-label" htmlFor="ticket-number">
              Ticket Number <span className="text-danger">*</span>
            </label>

            <input
              id="ticket-number"
              type="text"
              className={`form-control ${isDuplicate ? "is-invalid" : ""}`}
              placeholder="PROJ-1234"
              value={ticketNumber}
              onChange={(event) => setTicketNumber(event.target.value)}
              aria-describedby={isDuplicate ? "ticket-number-error" : undefined}
              required
            />

            {isDuplicate && (
              <div id="ticket-number-error" className="invalid-feedback">
                {normalizedNumber} already exists.
              </div>
            )}
          </div>

          <div className="col-sm-7">
            <label className="form-label" htmlFor="ticket-title">
              Title <span className="text-danger">*</span>
            </label>

            <input
              id="ticket-title"
              type="text"
              className="form-control"
              placeholder="Fix authentication timeout"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              required
            />
          </div>

          <div className="col-12">
            <label className="form-label" htmlFor="ticket-description">
              Description
            </label>

            <textarea
              id="ticket-description"
              className="form-control"
              rows="6"
              placeholder="Describe the Jira ticket..."
              value={description}
              onChange={(event) => setDescription(event.target.value)}
            />
          </div>

          <div className="col-sm-4">
            <label className="form-label" htmlFor="ticket-status">
              Status
            </label>

            <select
              id="ticket-status"
              className="form-select"
              value={status}
              onChange={(event) => setStatus(event.target.value)}
            >
              {TICKET_STATUSES.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div className="col-sm-4">
            <label className="form-label" htmlFor="ticket-priority">
              Priority
            </label>

            <select
              id="ticket-priority"
              className="form-select"
              value={priority}
              onChange={(event) => setPriority(event.target.value)}
            >
              {TICKET_PRIORITIES.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div className="col-sm-4">
            <label className="form-label" htmlFor="ticket-due-date">
              Due date
            </label>

            <input
              id="ticket-due-date"
              type="date"
              className="form-control"
              value={dueDate}
              onChange={(event) => setDueDate(event.target.value)}
            />
          </div>
        </div>
      </div>

      <div className="ticket-form-footer">
        <span className="ticket-form-hint">
          <i className="bi bi-arrows-move"></i> Drag the header to move
          <span className="ticket-form-hint-divider">·</span>
          <kbd>Esc</kbd> to close
        </span>

        <div className="ticket-form-actions">
          <button type="button" className="btn btn-light" onClick={onClose}>
            Cancel
          </button>

          <button
            type="submit"
            className="btn btn-primary px-4"
            disabled={!canSubmit}
          >
            <i
              className={`bi ${
                editingTicket ? "bi-check-lg" : "bi-plus-lg"
              } me-2`}
            ></i>

            {editingTicket ? "Save Changes" : "Create Ticket"}
          </button>
        </div>
      </div>
    </form>
  );
}

export default TicketForm;
