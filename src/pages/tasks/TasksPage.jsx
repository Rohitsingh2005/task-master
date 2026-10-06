import { useCallback, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

import TicketForm from "../../components/tickets/ticket-form/TicketForm";
import Modal from "../../components/common/modal/Modal";
import TicketTable from "../../components/tickets/ticket-table/TicketTable";
import TicketBoard from "../../components/tickets/ticket-board/TicketBoard";
import TicketToolbar from "../../components/tickets/ticket-toolbar/TicketToolbar";
import useNow from "../../hooks/useNow";
import useStorageKey from "../../hooks/useStorageKey";
import useTicketActions from "../../hooks/useTicketActions";
import useToast from "../../hooks/useToast";
import { usePullRequests, useTickets } from "../../hooks/useWorkspaceData";
import {
  createTicket,
  getRunningTicket,
  updateTicket,
} from "../../services/ticketStorage";
import { writeRaw } from "../../services/storage";
import {
  DEFAULT_TICKET_FILTERS,
  filterTickets,
  sortTickets,
} from "../../utils/ticketFilters";
import { pluralize } from "../../utils/format";

import "./TasksPage.css";

const TICKET_FORM_TITLE_ID = "ticket-form-title";
const VIEW_KEY = "taskMaster_ticketView";

function TasksPage() {
  const navigate = useNavigate();
  const toast = useToast();
  const tickets = useTickets();
  const prs = usePullRequests();
  const { removeTicket, changeStatus, toggleTimer } = useTicketActions();
  const [searchParams, setSearchParams] = useSearchParams();
  const [filters, setFilters] = useState(DEFAULT_TICKET_FILTERS);

  const view = useStorageKey(VIEW_KEY) === "board" ? "board" : "table";
  const hasRunningTimer = Boolean(getRunningTicket(tickets));
  const now = useNow(hasRunningTimer ? 1000 : 30000);

  const isCreating = searchParams.get("new") === "1";
  const editingTicket = tickets.find(
    (ticket) => ticket.id === searchParams.get("edit"),
  );
  const initialStatus = searchParams.get("status") ?? undefined;
  const isFormOpen = isCreating || Boolean(editingTicket);

  const visibleTickets = useMemo(
    () => sortTickets(filterTickets(tickets, filters, new Date(now)), filters.sort),
    [tickets, filters, now],
  );

  const prCounts = useMemo(
    () =>
      prs.reduce((counts, pr) => {
        if (pr.ticketId) {
          counts[pr.ticketId] = (counts[pr.ticketId] ?? 0) + 1;
        }

        return counts;
      }, {}),
    [prs],
  );

  const openCreateForm = (status) => {
    setSearchParams(status ? { new: "1", status } : { new: "1" });
  };

  const openEditForm = (ticket) => {
    setSearchParams({ edit: ticket.id });
  };

  const closeForm = useCallback(() => {
    setSearchParams({}, { replace: true });
  }, [setSearchParams]);

  const handleSubmit = (values) => {
    if (editingTicket) {
      updateTicket(editingTicket.id, values);
      toast.success(`${values.ticketNumber.trim().toUpperCase()} updated.`);
    } else {
      const ticket = createTicket(values);

      toast.success(`${ticket.ticketNumber} created.`, {
        action: {
          label: "View",
          onClick: () => navigate(`/tasks/${ticket.id}`),
        },
      });
    }

    closeForm();
  };

  const isFiltered = visibleTickets.length !== tickets.length;

  return (
    <div className="tasks-page">
      <div className="tickets-header">
        <div>
          <h1 className="h3 fw-bold mb-1">Jira Tickets</h1>

          <p className="text-muted mb-0">
            Track and manage your Jira development work.
          </p>
        </div>

        <div className="tickets-header-actions">
          <span className="tickets-count">
            {isFiltered
              ? `${visibleTickets.length} of ${tickets.length}`
              : pluralize(tickets.length, "ticket")}
          </span>

          <button
            type="button"
            className="btn btn-primary px-3"
            onClick={() => openCreateForm()}
            title="New ticket (N)"
          >
            <i className="bi bi-plus-lg me-2"></i>
            New Ticket
          </button>
        </div>
      </div>

      {tickets.length > 0 && (
        <TicketToolbar
          filters={filters}
          onChange={setFilters}
          view={view}
          onViewChange={(nextView) => writeRaw(VIEW_KEY, nextView)}
        />
      )}

      {tickets.length === 0 ? (
        <div className="card border-0 shadow-sm">
          <div className="card-body text-center py-5">
            <i className="bi bi-ticket-perforated fs-1 text-muted"></i>

            <h5 className="mt-3">No tickets yet</h5>

            <p className="text-muted mb-3">
              Create your first Jira ticket to start tracking work.
            </p>

            <button
              type="button"
              className="btn btn-primary px-3"
              onClick={() => openCreateForm()}
            >
              <i className="bi bi-plus-lg me-2"></i>
              New Ticket
            </button>
          </div>
        </div>
      ) : view === "board" ? (
        <TicketBoard
          tickets={visibleTickets}
          now={now}
          prCounts={prCounts}
          onOpen={(ticket) => navigate(`/tasks/${ticket.id}`)}
          onMove={changeStatus}
          onCreate={openCreateForm}
        />
      ) : visibleTickets.length === 0 ? (
        <div className="tickets-no-results">
          <i className="bi bi-funnel"></i>
          <h5>No tickets match your filters</h5>
          <p>Try a different search or clear the filters.</p>

          <button
            type="button"
            className="btn btn-light"
            onClick={() => setFilters({ ...DEFAULT_TICKET_FILTERS, sort: filters.sort })}
          >
            Clear filters
          </button>
        </div>
      ) : (
        <TicketTable
          tickets={visibleTickets}
          now={now}
          onEdit={openEditForm}
          onDelete={removeTicket}
          onToggleTimer={toggleTimer}
        />
      )}

      {isFormOpen && (
        <Modal titleId={TICKET_FORM_TITLE_ID} onClose={closeForm}>
          <TicketForm
            key={editingTicket?.id ?? "new"}
            editingTicket={editingTicket}
            initialStatus={initialStatus}
            onSubmit={handleSubmit}
            onClose={closeForm}
            titleId={TICKET_FORM_TITLE_ID}
          />
        </Modal>
      )}
    </div>
  );
}

export default TasksPage;
