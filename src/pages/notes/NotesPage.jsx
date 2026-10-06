import { useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";

import "./NotesPage.css";
import useConfirm from "../../hooks/useConfirm";
import useToast from "../../hooks/useToast";
import { useNotes, useTickets } from "../../hooks/useWorkspaceData";
import {
  createNote as createStoredNote,
  deleteNoteForever,
  emptyTrash as emptyStoredTrash,
  restoreNotes,
  updateNote,
} from "../../services/noteStorage";
import { addTicketHistory } from "../../services/ticketStorage";
import { formatDate } from "../../utils/format";

function NotesPage() {
  const notes = useNotes();
  const tickets = useTickets();
  const confirm = useConfirm();
  const toast = useToast();
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeView, setActiveView] = useState("all");
  const [search, setSearch] = useState("");

  const selectedNoteId = searchParams.get("note");

  const setSelectedNoteId = (id) => {
    setSearchParams(id ? { note: id } : {});
  };

  const activeNotes = useMemo(() => {
    let result = notes;

    if (activeView === "all") {
      result = result.filter((note) => !note.deleted);
    }

    if (activeView === "favorites") {
      result = result.filter((note) => note.favorite && !note.deleted);
    }

    if (activeView === "pinned") {
      result = result.filter((note) => note.pinned && !note.deleted);
    }

    if (activeView === "trash") {
      result = result.filter((note) => note.deleted);
    }

    if (search.trim()) {
      const query = search.toLowerCase();

      result = result.filter(
        (note) =>
          note.title.toLowerCase().includes(query) ||
          note.content.toLowerCase().includes(query)
      );
    }

    if (activeView !== "trash") {
      result = [...result].sort(
        (a, b) =>
          Number(b.pinned) - Number(a.pinned) ||
          new Date(b.updatedAt) - new Date(a.updatedAt)
      );
    }

    return result;
  }, [notes, activeView, search]);

  const selectedNote = notes.find((note) => note.id === selectedNoteId);

  const ticketsById = useMemo(
    () => Object.fromEntries(tickets.map((ticket) => [ticket.id, ticket])),
    [tickets]
  );

  const createNote = () => {
    const note = createStoredNote();

    setActiveView("all");
    setSelectedNoteId(note.id);
  };

  const linkTicket = (note, ticketId) => {
    updateNote(note.id, { ticketId: ticketId || null });

    if (ticketId) {
      addTicketHistory(ticketId, {
        type: "noteLinked",
        noteTitle: note.title || "Untitled note",
      });
    }
  };

  const moveToTrash = (id) => {
    updateNote(id, {
      deleted: true,
      pinned: false,
      favorite: false,
    });

    setSelectedNoteId(null);

    toast.success("Note moved to Trash.", {
      action: {
        label: "Undo",
        onClick: () => updateNote(id, { deleted: false }),
      },
    });
  };

  const restoreNote = (id) => {
    updateNote(id, {
      deleted: false,
    });

    toast.success("Note restored.");
  };

  const permanentlyDelete = async (id) => {
    const note = notes.find((item) => item.id === id);

    const confirmed = await confirm({
      title: "Delete this note forever?",
      message: `"${note?.title || "Untitled note"}" will be permanently deleted.`,
      confirmLabel: "Delete forever",
    });

    if (!confirmed) {
      return;
    }

    const removed = deleteNoteForever(id);

    if (selectedNoteId === id) {
      setSelectedNoteId(null);
    }

    if (removed) {
      toast.success("Note deleted.", {
        action: {
          label: "Undo",
          onClick: () => restoreNotes([removed.note]),
        },
      });
    }
  };

  const emptyTrash = async () => {
    const trashCount = notes.filter((note) => note.deleted).length;

    const confirmed = await confirm({
      title: "Empty Trash?",
      message: `${trashCount} ${trashCount === 1 ? "note" : "notes"} will be permanently deleted.`,
      confirmLabel: "Empty Trash",
    });

    if (!confirmed) {
      return;
    }

    const removed = emptyStoredTrash();
    setSelectedNoteId(null);

    toast.success("Trash emptied.", {
      action: {
        label: "Undo",
        onClick: () => restoreNotes(removed),
      },
    });
  };

  const toggleFavorite = (id) => {
    const note = notes.find((item) => item.id === id);

    if (!note) return;

    updateNote(id, {
      favorite: !note.favorite,
    });
  };

  const togglePinned = (id) => {
    const note = notes.find((item) => item.id === id);

    if (!note) return;

    updateNote(id, {
      pinned: !note.pinned,
    });
  };

  const getCount = (type) => {
    if (type === "all") {
      return notes.filter((note) => !note.deleted).length;
    }

    if (type === "favorites") {
      return notes.filter(
        (note) => note.favorite && !note.deleted
      ).length;
    }

    if (type === "pinned") {
      return notes.filter(
        (note) => note.pinned && !note.deleted
      ).length;
    }

    if (type === "trash") {
      return notes.filter((note) => note.deleted).length;
    }

    return 0;
  };

  return (
    <div className={`notes-page ${selectedNote ? "has-selection" : ""}`}>
      <aside className="notes-sidebar">
        <div className="notes-header">
          <h1>Notes</h1>

          <button
            className="new-note-button"
            onClick={createNote}
          >
            + New
          </button>
        </div>

        <div className="notes-search">
          <span>⌕</span>

          <input
            type="search"
            placeholder="Search notes..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            aria-label="Search notes"
            data-search-input
          />
        </div>

        <nav className="notes-navigation">
          <SidebarItem
            icon="📝"
            label="All Notes"
            count={getCount("all")}
            active={activeView === "all"}
            onClick={() => setActiveView("all")}
          />

          <SidebarItem
            icon="⭐"
            label="Favorites"
            count={getCount("favorites")}
            active={activeView === "favorites"}
            onClick={() => setActiveView("favorites")}
          />

          <SidebarItem
            icon="📌"
            label="Pinned"
            count={getCount("pinned")}
            active={activeView === "pinned"}
            onClick={() => setActiveView("pinned")}
          />

          <div className="sidebar-divider" />

          <SidebarItem
            icon="🗑"
            label="Trash"
            count={getCount("trash")}
            active={activeView === "trash"}
            onClick={() => setActiveView("trash")}
          />
        </nav>

        <div className="notes-sidebar-footer">
          {notes.filter((note) => !note.deleted).length} notes
        </div>
      </aside>

      <section className="notes-list-panel">
        <div className="notes-list-header">
          <div>
            <h2>
              {activeView === "all" && "All Notes"}
              {activeView === "favorites" && "Favorites"}
              {activeView === "pinned" && "Pinned"}
              {activeView === "trash" && "Trash"}
            </h2>

            <span>
              {activeNotes.length}{" "}
              {activeNotes.length === 1 ? "note" : "notes"}
            </span>
          </div>

          {activeView === "trash" &&
            activeNotes.length > 0 && (
              <button
                className="empty-trash-button"
                onClick={emptyTrash}
              >
                Empty Trash
              </button>
            )}
        </div>

        <div className="notes-list">
          {activeNotes.length === 0 ? (
            <div className="no-notes">
              <div>📝</div>
              <h3>No notes here</h3>
              <p>
                {activeView === "trash"
                  ? "Your trash is empty."
                  : "Create a new note to get started."}
              </p>

              {activeView !== "trash" && (
                <button
                  className="new-note-button"
                  onClick={createNote}
                >
                  + Create Note
                </button>
              )}
            </div>
          ) : (
            activeNotes.map((note) => (
              <button
                key={note.id}
                className={`note-card ${
                  selectedNoteId === note.id
                    ? "selected"
                    : ""
                }`}
                onClick={() => setSelectedNoteId(note.id)}
              >
                <div className="note-card-top">
                  <h3>
                    {note.title || "Untitled note"}
                  </h3>

                  {note.pinned && <span>📌</span>}
                </div>

                <p>
                  {note.content || "No content"}
                </p>

                <div className="note-card-bottom">
                  <span>
                    {formatDate(note.updatedAt)}
                  </span>

                  {ticketsById[note.ticketId] && (
                    <span className="note-ticket-chip">
                      <i className="bi bi-ticket-perforated"></i>
                      {ticketsById[note.ticketId].ticketNumber}
                    </span>
                  )}

                  {note.favorite && (
                    <span className="favorite-icon">
                      ★
                    </span>
                  )}
                </div>
              </button>
            ))
          )}
        </div>
      </section>

      <main className="note-editor">
        {!selectedNote ? (
          <EmptyEditor onCreate={createNote} />
        ) : (
          <NoteEditor
            note={selectedNote}
            tickets={tickets}
            linkedTicket={ticketsById[selectedNote.ticketId]}
            onLinkTicket={linkTicket}
            onUpdate={updateNote}
            onFavorite={toggleFavorite}
            onPin={togglePinned}
            onTrash={moveToTrash}
            onRestore={restoreNote}
            onDelete={permanentlyDelete}
            onBack={() => setSelectedNoteId(null)}
          />
        )}
      </main>
    </div>
  );
}

function SidebarItem({
  icon,
  label,
  count,
  active,
  onClick,
}) {
  return (
    <button
      className={`sidebar-item ${
        active ? "active" : ""
      }`}
      onClick={onClick}
    >
      <span className="sidebar-item-left">
        <span>{icon}</span>
        {label}
      </span>

      <span className="sidebar-count">
        {count}
      </span>
    </button>
  );
}

function EmptyEditor({ onCreate }) {
  return (
    <div className="note-editor-empty">
      <div className="empty-editor-icon">📝</div>

      <h2>Your notes</h2>

      <p>
        Select a note or create a new one.
      </p>

      <button
        className="new-note-button"
        onClick={onCreate}
      >
        + Create Note
      </button>
    </div>
  );
}

function NoteEditor({
  note,
  tickets,
  linkedTicket,
  onLinkTicket,
  onUpdate,
  onFavorite,
  onPin,
  onTrash,
  onRestore,
  onDelete,
  onBack,
}) {
  return (
    <>
      <div className="note-editor-toolbar">
        <div className="editor-actions-left">
          <button
            type="button"
            className="note-tool-button note-back-button"
            onClick={onBack}
            aria-label="Back to notes"
            title="Back to notes"
          >
            <i className="bi bi-arrow-left"></i>
          </button>

          <button
            className={`note-tool-button ${
              note.pinned ? "active" : ""
            }`}
            onClick={() => onPin(note.id)}
            title="Pin"
          >
            📌
          </button>

          <button
            className={`note-tool-button ${
              note.favorite ? "active" : ""
            }`}
            onClick={() => onFavorite(note.id)}
            title="Favorite"
          >
            {note.favorite ? "★" : "☆"}
          </button>

          <div className="note-ticket-field">
            <i className="bi bi-ticket-perforated"></i>

            <select
              value={note.ticketId ?? ""}
              onChange={(e) => onLinkTicket(note, e.target.value)}
              aria-label="Linked ticket"
              disabled={note.deleted}
            >
              <option value="">No ticket</option>
              {tickets.map((ticket) => (
                <option key={ticket.id} value={ticket.id}>
                  {ticket.ticketNumber} · {ticket.title}
                </option>
              ))}
            </select>

            {linkedTicket && (
              <Link
                to={`/tasks/${linkedTicket.id}`}
                className="note-ticket-open"
                title={`Open ${linkedTicket.ticketNumber}`}
                aria-label={`Open ${linkedTicket.ticketNumber}`}
              >
                <i className="bi bi-box-arrow-up-right"></i>
              </Link>
            )}
          </div>
        </div>

        <div className="editor-actions-right">
          {note.deleted ? (
            <>
              <button
                className="restore-button"
                onClick={() => onRestore(note.id)}
              >
                Restore
              </button>

              <button
                className="delete-button"
                onClick={() => onDelete(note.id)}
              >
                Delete Forever
              </button>
            </>
          ) : (
            <button
              className="delete-button"
              onClick={() => onTrash(note.id)}
            >
              Move to Trash
            </button>
          )}
        </div>
      </div>

      <div className="note-editor-content">
        <input
          className="note-title-input"
          placeholder="Untitled"
          value={note.title}
          onChange={(e) =>
            onUpdate(note.id, {
              title: e.target.value,
            })
          }
        />

        <textarea
          className="note-content-input"
          placeholder="Start writing..."
          value={note.content}
          onChange={(e) =>
            onUpdate(note.id, {
              content: e.target.value,
            })
          }
        />
      </div>

      <div className="note-editor-footer">
        <span>
          Created {formatDate(note.createdAt)}
        </span>

        <span>
          Updated {formatDate(note.updatedAt)}
        </span>
      </div>
    </>
  );
}

export default NotesPage;
