import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

import useStorageKey from "../../../hooks/useStorageKey";
import useNow from "../../../hooks/useNow";
import {
  useNotes,
  usePullRequests,
  useTickets,
} from "../../../hooks/useWorkspaceData";
import {
  buildActivity,
  NOTIFICATIONS_SEEN_KEY,
} from "../../../services/activityService";
import { readRaw, writeRaw } from "../../../services/storage";
import { formatRelativeTime } from "../../../utils/format";

import "./NotificationsMenu.css";

const MAX_ITEMS = 20;

function NotificationsMenu() {
  const navigate = useNavigate();
  const tickets = useTickets();
  const prs = usePullRequests();
  const notes = useNotes();
  const seenRaw = useStorageKey(NOTIFICATIONS_SEEN_KEY);
  const now = useNow(60000);

  const [isOpen, setIsOpen] = useState(false);
  const [highlightSince, setHighlightSince] = useState(0);
  const menuRef = useRef(null);

  useEffect(() => {
    if (readRaw(NOTIFICATIONS_SEEN_KEY) === null) {
      writeRaw(NOTIFICATIONS_SEEN_KEY, new Date().toISOString());
    }
  }, []);

  const seenAt = seenRaw ? new Date(seenRaw).getTime() : 0;

  const events = useMemo(
    () => buildActivity({ tickets, prs, notes }).slice(0, MAX_ITEMS),
    [tickets, prs, notes]
  );

  const unreadCount = events.filter(
    (event) => new Date(event.date).getTime() > seenAt
  ).length;

  useEffect(() => {
    if (!isOpen) {
      return undefined;
    }

    const handlePointerDown = (event) => {
      if (!menuRef.current?.contains(event.target)) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    };

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  const markAllRead = () => {
    writeRaw(NOTIFICATIONS_SEEN_KEY, new Date().toISOString());
  };

  const toggle = () => {
    if (!isOpen) {
      setHighlightSince(seenAt);
      markAllRead();
    }

    setIsOpen((open) => !open);
  };

  const openEvent = (event) => {
    setIsOpen(false);
    navigate(event.to);
  };

  return (
    <div className="notifications" ref={menuRef}>
      <button
        type="button"
        className={`topbar-icon-button notifications-trigger ${
          isOpen ? "is-open" : ""
        }`}
        onClick={toggle}
        aria-label={
          unreadCount
            ? `Notifications, ${unreadCount} unread`
            : "Notifications"
        }
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        <i className={`bi ${unreadCount ? "bi-bell-fill" : "bi-bell"}`}></i>

        {unreadCount > 0 && (
          <span className="notifications-badge">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="notifications-panel" role="dialog" aria-label="Notifications">
          <div className="notifications-header">
            <div>
              <h2>Notifications</h2>
              <span>Recent workspace activity</span>
            </div>
          </div>

          {events.length === 0 ? (
            <div className="notifications-empty">
              <i className="bi bi-bell-slash"></i>
              <strong>You're all caught up</strong>
              <span>Activity on tickets, PRs and notes shows up here.</span>
            </div>
          ) : (
            <ul className="notifications-list">
              {events.map((event) => {
                const isNew = new Date(event.date).getTime() > highlightSince;

                return (
                  <li key={event.id}>
                    <button
                      type="button"
                      className={`notification-item ${isNew ? "is-new" : ""}`}
                      onClick={() => openEvent(event)}
                    >
                      <span className={`notification-icon tone-${event.tone}`}>
                        <i className={`bi ${event.icon}`}></i>
                      </span>

                      <span className="notification-body">
                        <span className="notification-action">{event.action}</span>
                        <span className="notification-title">{event.title}</span>
                      </span>

                      <span className="notification-time">
                        {formatRelativeTime(event.date, now)}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}

          <button
            type="button"
            className="notifications-footer"
            onClick={() => {
              setIsOpen(false);
              navigate("/");
            }}
          >
            Open dashboard
            <i className="bi bi-arrow-right"></i>
          </button>
        </div>
      )}
    </div>
  );
}

export default NotificationsMenu;
