import {
  TICKET_PRIORITIES,
  TICKET_STATUSES,
} from "../../../services/ticketStorage";
import {
  countActiveFilters,
  DEFAULT_TICKET_FILTERS,
  DUE_FILTERS,
  TICKET_SORTS,
} from "../../../utils/ticketFilters";

import "./TicketToolbar.css";

function TicketToolbar({ filters, onChange, view, onViewChange }) {
  const activeCount = countActiveFilters(filters);

  const update = (key) => (event) =>
    onChange({ ...filters, [key]: event.target.value });

  return (
    <div className="ticket-toolbar">
      <div className="ticket-search">
        <i className="bi bi-search"></i>

        <input
          type="search"
          value={filters.search}
          onChange={update("search")}
          placeholder="Search by number, title or description"
          aria-label="Search tickets"
          data-search-input
        />

        {filters.search ? (
          <button
            type="button"
            className="ticket-search-clear"
            onClick={() => onChange({ ...filters, search: "" })}
            aria-label="Clear search"
          >
            <i className="bi bi-x-circle-fill"></i>
          </button>
        ) : (
          <kbd>/</kbd>
        )}
      </div>

      <div className="ticket-filters">
        {view === "table" && (
          <select
            className="form-select form-select-sm"
            value={filters.status}
            onChange={update("status")}
            aria-label="Filter by status"
          >
            <option value="ALL">All statuses</option>
            {TICKET_STATUSES.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        )}

        <select
          className="form-select form-select-sm"
          value={filters.priority}
          onChange={update("priority")}
          aria-label="Filter by priority"
        >
          <option value="ALL">All priorities</option>
          {TICKET_PRIORITIES.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>

        <select
          className="form-select form-select-sm"
          value={filters.due}
          onChange={update("due")}
          aria-label="Filter by due date"
        >
          {DUE_FILTERS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>

        <select
          className="form-select form-select-sm"
          value={filters.sort}
          onChange={update("sort")}
          aria-label="Sort tickets"
        >
          {TICKET_SORTS.map((option) => (
            <option key={option.value} value={option.value}>
              Sort: {option.label}
            </option>
          ))}
        </select>

        {activeCount > 0 && (
          <button
            type="button"
            className="ticket-clear-filters"
            onClick={() =>
              onChange({ ...DEFAULT_TICKET_FILTERS, sort: filters.sort })
            }
          >
            <i className="bi bi-x-lg"></i>
            Clear ({activeCount})
          </button>
        )}
      </div>

      <div className="ticket-view-toggle" role="group" aria-label="View">
        <button
          type="button"
          className={view === "table" ? "is-active" : ""}
          onClick={() => onViewChange("table")}
          aria-pressed={view === "table"}
        >
          <i className="bi bi-list-ul"></i>
          Table
        </button>

        <button
          type="button"
          className={view === "board" ? "is-active" : ""}
          onClick={() => onViewChange("board")}
          aria-pressed={view === "board"}
        >
          <i className="bi bi-kanban"></i>
          Board
        </button>
      </div>
    </div>
  );
}

export default TicketToolbar;
