import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import Modal from "../modal/Modal";
import useTheme from "../../../hooks/useTheme";
import useToast from "../../../hooks/useToast";
import {
  useNotes,
  usePullRequests,
  useTickets,
} from "../../../hooks/useWorkspaceData";
import { getStatusLabel } from "../../../services/ticketStorage";
import { formatPRStatus } from "../../../services/prStorage";
import { createNote } from "../../../services/noteStorage";
import {
  createBackup,
  getBackupFileName,
} from "../../../services/backupService";
import { downloadJSON } from "../../../utils/download";

import "./CommandPalette.css";

const TITLE_ID = "command-palette-title";
const RESULT_LIMIT = 6;

const PAGES = [
  { label: "Dashboard", icon: "bi-speedometer2", to: "/" },
  { label: "Tickets", icon: "bi-ticket-perforated", to: "/tasks" },
  { label: "Notes", icon: "bi-journal-text", to: "/notes" },
  { label: "Pull Requests", icon: "bi-git", to: "/pull-request" },
  { label: "Profile", icon: "bi-person", to: "/profile" },
];

const matches = (query, ...values) =>
  values.some((value) => value?.toLowerCase().includes(query));

function CommandPalette({ onClose }) {
  const navigate = useNavigate();
  const toast = useToast();
  const { isDark, toggleTheme } = useTheme();
  const tickets = useTickets();
  const prs = usePullRequests();
  const notes = useNotes();

  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);

  const groups = useMemo(() => {
    const search = query.trim().toLowerCase();

    const go = (to) => () => navigate(to);

    const actions = [
      { id: "new-ticket", label: "Create ticket", icon: "bi-plus-lg", hint: "N", run: go("/tasks?new=1") },
      {
        id: "new-note",
        label: "Create note",
        icon: "bi-journal-plus",
        run: () => navigate(`/notes?note=${createNote().id}`),
      },
      { id: "new-pr", label: "Add pull request", icon: "bi-git", run: go("/pull-request?new=1") },
      {
        id: "theme",
        label: isDark ? "Switch to light mode" : "Switch to dark mode",
        icon: isDark ? "bi-sun" : "bi-moon-stars",
        run: toggleTheme,
      },
      {
        id: "export",
        label: "Export backup (JSON)",
        icon: "bi-download",
        run: () => {
          downloadJSON(getBackupFileName(), createBackup());
          toast.success("Backup downloaded.");
        },
      },
    ].filter((item) => !search || matches(search, item.label));

    const pages = PAGES.filter((page) => !search || matches(search, page.label)).map(
      (page) => ({
        id: `page-${page.to}`,
        label: `Go to ${page.label}`,
        icon: page.icon,
        run: go(page.to),
      })
    );

    if (!search) {
      return [
        { title: "Actions", items: actions },
        { title: "Pages", items: pages },
      ];
    }

    const ticketItems = tickets
      .filter((ticket) => matches(search, ticket.ticketNumber, ticket.title))
      .slice(0, RESULT_LIMIT)
      .map((ticket) => ({
        id: `ticket-${ticket.id}`,
        label: `${ticket.ticketNumber} · ${ticket.title}`,
        meta: getStatusLabel(ticket.status),
        icon: "bi-ticket-perforated",
        run: go(`/tasks/${ticket.id}`),
      }));

    const prItems = prs
      .filter((pr) => matches(search, pr.branchName))
      .slice(0, RESULT_LIMIT)
      .map((pr) => ({
        id: `pr-${pr.id}`,
        label: pr.branchName || "Untitled branch",
        meta: formatPRStatus(pr.status),
        icon: "bi-git",
        run: go(`/pull-request?pr=${pr.id}`),
      }));

    const noteItems = notes
      .filter((note) => !note.deleted && matches(search, note.title, note.content))
      .slice(0, RESULT_LIMIT)
      .map((note) => ({
        id: `note-${note.id}`,
        label: note.title || "Untitled note",
        icon: "bi-journal-text",
        run: go(`/notes?note=${note.id}`),
      }));

    return [
      { title: "Tickets", items: ticketItems },
      { title: "Pull Requests", items: prItems },
      { title: "Notes", items: noteItems },
      { title: "Actions", items: actions },
      { title: "Pages", items: pages },
    ];
  }, [query, tickets, prs, notes, isDark, navigate, toggleTheme, toast]);

  const visibleGroups = groups.filter((group) => group.items.length > 0);
  const flatItems = visibleGroups.flatMap((group) => group.items);
  const safeIndex = Math.min(activeIndex, Math.max(flatItems.length - 1, 0));

  const runItem = (item) => {
    onClose();
    item.run();
  };

  const handleKeyDown = (event) => {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActiveIndex((safeIndex + 1) % Math.max(flatItems.length, 1));
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveIndex(
        (safeIndex - 1 + flatItems.length) % Math.max(flatItems.length, 1)
      );
    } else if (event.key === "Enter" && flatItems[safeIndex]) {
      event.preventDefault();
      runItem(flatItems[safeIndex]);
    }
  };

  let itemIndex = -1;

  return (
    <Modal titleId={TITLE_ID} onClose={onClose} className="size-md command-palette-modal">
      <div className="command-palette" onKeyDown={handleKeyDown}>
        <h2 id={TITLE_ID} className="visually-hidden">
          Command palette
        </h2>

        <div className="command-palette-search">
          <i className="bi bi-search"></i>

          <input
            type="text"
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              setActiveIndex(0);
            }}
            placeholder="Search tickets, PRs, notes or type a command..."
            aria-label="Search commands"
            aria-controls="command-palette-results"
            aria-activedescendant={
              flatItems[safeIndex] ? `command-${flatItems[safeIndex].id}` : undefined
            }
            data-autofocus
          />

          <kbd>Esc</kbd>
        </div>

        <div
          className="command-palette-results"
          id="command-palette-results"
          role="listbox"
        >
          {flatItems.length === 0 && (
            <div className="command-palette-empty">
              <i className="bi bi-search"></i>
              No results for "{query}"
            </div>
          )}

          {visibleGroups.map((group) => (
            <div key={group.title} className="command-palette-group">
              <div className="command-palette-group-title">{group.title}</div>

              {group.items.map((item) => {
                itemIndex += 1;
                const index = itemIndex;

                return (
                  <button
                    type="button"
                    key={item.id}
                    id={`command-${item.id}`}
                    role="option"
                    aria-selected={index === safeIndex}
                    className={`command-palette-item ${
                      index === safeIndex ? "is-active" : ""
                    }`}
                    onMouseMove={() => setActiveIndex(index)}
                    onClick={() => runItem(item)}
                    tabIndex={-1}
                  >
                    <i className={`bi ${item.icon}`}></i>
                    <span className="command-palette-label">{item.label}</span>
                    {item.meta && (
                      <span className="command-palette-meta">{item.meta}</span>
                    )}
                    {item.hint && <kbd>{item.hint}</kbd>}
                  </button>
                );
              })}
            </div>
          ))}
        </div>

        <div className="command-palette-footer">
          <span><kbd>↑</kbd><kbd>↓</kbd> navigate</span>
          <span><kbd>Enter</kbd> open</span>
          <span><kbd>N</kbd> new ticket</span>
          <span><kbd>/</kbd> search page</span>
          <span><kbd>Ctrl</kbd>+<kbd>K</kbd> palette</span>
        </div>
      </div>
    </Modal>
  );
}

export default CommandPalette;
