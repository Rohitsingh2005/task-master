import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";

import useConfirm from "../../hooks/useConfirm";
import useToast from "../../hooks/useToast";
import { usePullRequests, useTickets } from "../../hooks/useWorkspaceData";
import {
  addPR,
  createEmptyPR,
  createPRLink,
  deletePR,
  formatPRStatus,
  PR_AREAS,
  PR_LINK_TYPES,
  PR_STATUSES,
  restorePR,
  updatePR,
} from "../../services/prStorage";
import {
  addTicketHistory,
  isTicketDone,
  updateTicket,
} from "../../services/ticketStorage";
import { formatDate } from "../../utils/format";

import "./PRPage.css";

const MAX_LINKS = 2;

function PRPage() {
  const prs = usePullRequests();
  const tickets = useTickets();
  const confirm = useConfirm();
  const toast = useToast();
  const [searchParams, setSearchParams] = useSearchParams();

  const newParam = searchParams.get("new");
  const ticketParam = searchParams.get("ticket");
  const [lastNewParam, setLastNewParam] = useState(null);
  const [draftPR, setDraftPR] = useState(null);

  if (newParam !== lastNewParam) {
    setLastNewParam(newParam);

    if (newParam === "1") {
      setDraftPR(createEmptyPR(ticketParam));
    }
  }

  const selectedPRId = searchParams.get("pr");
  const savedPR = prs.find((pr) => pr.id === selectedPRId);
  const selectedPR = draftPR ?? savedPR;

  const findTicket = (ticketId) =>
    tickets.find((ticket) => ticket.id === ticketId);

  const createPR = () => {
    setDraftPR(createEmptyPR());
    setSearchParams({});
  };

  const openPR = (id) => {
    setDraftPR(null);
    setSearchParams({ pr: id });
  };

  const closeEditor = () => {
    setDraftPR(null);
    setSearchParams({});
  };

  const handleMerged = async (pr) => {
    const ticket = findTicket(pr.ticketId);

    if (!ticket) {
      return;
    }

    addTicketHistory(ticket.id, {
      type: "prMerged",
      branch: pr.branchName || "Untitled branch",
    });

    if (isTicketDone(ticket)) {
      return;
    }

    const shouldComplete = await confirm({
      title: `Mark ${ticket.ticketNumber} as Completed?`,
      message: `${pr.branchName || "This PR"} was merged. Do you also want to move "${ticket.title}" to Completed?`,
      confirmLabel: "Mark Completed",
      cancelLabel: "Not yet",
      tone: "primary",
    });

    if (shouldComplete) {
      updateTicket(ticket.id, { status: "COMPLETED" });
      toast.success(`${ticket.ticketNumber} marked as Completed.`);
    }
  };

  const handleUpdate = (id, changes) => {
    if (draftPR?.id === id) {
      setDraftPR((current) => ({ ...current, ...changes }));
      return;
    }

    const { previous, updated } = updatePR(id, changes);

    if (!previous || !updated) {
      return;
    }

    const branch = updated.branchName || "Untitled branch";

    if (previous.ticketId !== updated.ticketId) {
      if (previous.ticketId) {
        addTicketHistory(previous.ticketId, { type: "prUnlinked", branch });
      }

      if (updated.ticketId) {
        addTicketHistory(updated.ticketId, { type: "prLinked", branch });
      }
    }

    if (previous.status !== "merged" && updated.status === "merged") {
      handleMerged(updated);
    }
  };

  const savePR = () => {
    if (!draftPR) return;

    const pr = addPR(draftPR);

    if (pr.ticketId) {
      addTicketHistory(pr.ticketId, {
        type: "prLinked",
        branch: pr.branchName || "Untitled branch",
      });
    }

    toast.success(`${pr.branchName || "Pull request"} saved.`);
    setDraftPR(null);
    setSearchParams({ pr: pr.id });

    if (pr.status === "merged") {
      handleMerged(pr);
    }
  };

  const removePR = async (pr) => {
    const confirmed = await confirm({
      title: "Delete this pull request?",
      message: `${pr.branchName || "This PR"} and its links will be removed. You can undo this for a few seconds.`,
      confirmLabel: "Delete PR",
    });

    if (!confirmed) {
      return;
    }

    const removed = deletePR(pr.id);

    if (!removed) {
      return;
    }

    setSearchParams({});

    toast.success(`${pr.branchName || "Pull request"} deleted.`, {
      action: {
        label: "Undo",
        onClick: () => restorePR(removed),
      },
    });
  };

  return (
    <div className="pr-page">
      <div className="pr-page-header">
        <div>
          <h1>Pull Requests</h1>

          <p>Manage your branches and PR links.</p>
        </div>

        <button className="pr-primary-button" onClick={createPR}>
          + Add PR
        </button>
      </div>

      <div className={`pr-content ${selectedPR ? "has-selection" : ""}`}>
        <div className="pr-list">
          {prs.length === 0 ? (
            <div className="pr-empty">
              <div className="pr-empty-icon">🔀</div>

              <h2>No pull requests</h2>

              <p>Add your first branch and PR details.</p>

              <button className="pr-primary-button" onClick={createPR}>
                + Add PR
              </button>
            </div>
          ) : (
            prs.map((pr) => {
              const ticket = findTicket(pr.ticketId);

              return (
                <button
                  key={pr.id}
                  className={`pr-card ${selectedPRId === pr.id && !draftPR ? "selected" : ""}`}
                  onClick={() => openPR(pr.id)}
                >
                  <div className="pr-card-header">
                    <span className="pr-branch">
                      {pr.branchName || "Untitled branch"}
                    </span>

                    <StatusBadge status={pr.status} />
                  </div>

                  <div className="pr-card-areas">
                    {pr.links.length === 0 ? (
                      <span className="no-area">No PR links</span>
                    ) : (
                      pr.links.map((link) => (
                        <span key={link.id} className={`area-badge ${link.area}`}>
                          {capitalize(link.area)} PR
                        </span>
                      ))
                    )}
                  </div>

                  <div className="pr-card-footer">
                    <span>
                      {pr.links.length} {pr.links.length === 1 ? "link" : "links"}
                    </span>

                    {ticket && (
                      <span className="pr-ticket-chip" title={ticket.title}>
                        <i className="bi bi-ticket-perforated"></i>
                        {ticket.ticketNumber}
                      </span>
                    )}
                  </div>
                </button>
              );
            })
          )}
        </div>

        {selectedPR ? (
          <PREditor
            key={selectedPR.id}
            pr={selectedPR}
            tickets={tickets}
            isDraft={Boolean(draftPR)}
            onUpdate={handleUpdate}
            onSave={savePR}
            onDelete={removePR}
            onClose={closeEditor}
          />
        ) : (
          <div className="pr-editor-empty">
            <div>🔀</div>

            <h2>Select a PR</h2>

            <p>Select a PR from the list or create a new one.</p>
          </div>
        )}
      </div>
    </div>
  );
}

function PREditor({ pr, tickets, isDraft, onUpdate, onSave, onDelete, onClose }) {
  const linkedTicket = tickets.find((ticket) => ticket.id === pr.ticketId);

  const sortedTickets = [...tickets].sort((a, b) =>
    a.ticketNumber.localeCompare(b.ticketNumber, undefined, { numeric: true }),
  );

  const addLink = () => {
    if (pr.links.length >= MAX_LINKS) {
      return;
    }

    onUpdate(pr.id, { links: [...pr.links, createPRLink()] });
  };

  const updateLink = (linkId, changes) => {
    onUpdate(pr.id, {
      links: pr.links.map((link) =>
        link.id === linkId ? { ...link, ...changes } : link,
      ),
    });
  };

  const deleteLink = (linkId) => {
    onUpdate(pr.id, {
      links: pr.links.filter((link) => link.id !== linkId),
    });
  };

  const canSave =
    pr.branchName.trim() || pr.links.some((link) => link.url.trim());

  return (
    <div className="pr-editor">
      <div className="pr-editor-header">
        <div>
          <h2>{isDraft ? "New Pull Request" : "Pull Request"}</h2>

          {!isDraft && <span>Created {formatDate(pr.createdAt)}</span>}
        </div>

        <button
          className="pr-close-button"
          onClick={onClose}
          title="Close"
          aria-label="Close editor"
        >
          ×
        </button>
      </div>

      <div className="pr-form">
        <div className="form-group">
          <label htmlFor="pr-branch">Branch Name</label>

          <input
            id="pr-branch"
            type="text"
            placeholder="feature/user-dashboard"
            value={pr.branchName}
            onChange={(e) => onUpdate(pr.id, { branchName: e.target.value })}
          />
        </div>

        <div className="form-group">
          <label htmlFor="pr-ticket">Linked ticket</label>

          <div className="pr-ticket-field">
            <select
              id="pr-ticket"
              value={pr.ticketId ?? ""}
              onChange={(e) =>
                onUpdate(pr.id, { ticketId: e.target.value || null })
              }
            >
              <option value="">No linked ticket</option>
              {sortedTickets.map((ticket) => (
                <option key={ticket.id} value={ticket.id}>
                  {ticket.ticketNumber} · {ticket.title}
                </option>
              ))}
            </select>

            {linkedTicket && (
              <Link to={`/tasks/${linkedTicket.id}`} className="pr-ticket-link">
                Open
                <i className="bi bi-box-arrow-up-right"></i>
              </Link>
            )}
          </div>
        </div>

        <div className="links-section">
          <div className="links-header">
            <div>
              <label>PR Links</label>

              <span>
                {pr.links.length}/{MAX_LINKS}
              </span>
            </div>

            <button
              className="add-link-button"
              disabled={pr.links.length >= MAX_LINKS}
              onClick={addLink}
            >
              + Add Link
            </button>
          </div>

          {pr.links.length === 0 && <div className="no-links">No links added.</div>}

          {pr.links.map((link, index) => (
            <div className="link-row" key={link.id}>
              <select
                value={link.area}
                onChange={(e) => updateLink(link.id, { area: e.target.value })}
                aria-label="Area"
              >
                {PR_AREAS.map((area) => (
                  <option key={area} value={area}>
                    {capitalize(area)}
                  </option>
                ))}
              </select>

              <select
                value={link.type}
                onChange={(e) => updateLink(link.id, { type: e.target.value })}
                aria-label="Link type"
              >
                {PR_LINK_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>

              <input
                type="url"
                placeholder="https://..."
                value={link.url}
                onChange={(e) => updateLink(link.id, { url: e.target.value })}
                aria-label="Link URL"
              />

              <button
                className="remove-link-button"
                onClick={() => deleteLink(link.id)}
                title={`Remove link ${index + 1}`}
              >
                ×
              </button>
            </div>
          ))}
        </div>

        <div className="form-group">
          <label htmlFor="pr-status">Status</label>

          <select
            id="pr-status"
            value={pr.status}
            onChange={(e) => onUpdate(pr.id, { status: e.target.value })}
          >
            {PR_STATUSES.map((status) => (
              <option key={status} value={status}>
                {capitalize(status)}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="pr-editor-footer">
        <button className="pr-cancel-button" onClick={onClose}>
          {isDraft ? "Cancel" : "Close"}
        </button>

        <div className="pr-footer-right">
          {!isDraft && (
            <button className="pr-delete-button" onClick={() => onDelete(pr)}>
              Delete PR
            </button>
          )}

          {isDraft && (
            <button className="pr-save-button" onClick={onSave} disabled={!canSave}>
              Save PR
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function StatusBadge({ status }) {
  return (
    <span className={`status-badge ${status.replaceAll(" ", "-").toLowerCase()}`}>
      {formatPRStatus(status)}
    </span>
  );
}

function capitalize(value = "") {
  return formatPRStatus(value);
}

export default PRPage;
