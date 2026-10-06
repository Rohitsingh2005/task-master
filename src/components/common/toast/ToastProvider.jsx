import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { ToastContext } from "../../../context/ToastContext";

import "./Toast.css";

const TONE_ICONS = {
  success: "bi-check-circle-fill",
  error: "bi-exclamation-octagon-fill",
  info: "bi-info-circle-fill",
};

function ToastItem({ toast, onDismiss }) {
  const [isPaused, setIsPaused] = useState(false);
  const remaining = useRef(toast.duration);
  const startedAt = useRef(0);

  useEffect(() => {
    if (isPaused) {
      return undefined;
    }

    startedAt.current = Date.now();

    const timer = window.setTimeout(
      () => onDismiss(toast.id),
      remaining.current
    );

    return () => {
      window.clearTimeout(timer);
      remaining.current -= Date.now() - startedAt.current;
    };
  }, [isPaused, onDismiss, toast.id]);

  const handleAction = () => {
    toast.action.onClick();
    onDismiss(toast.id);
  };

  return (
    <div
      className={`toast-item tone-${toast.tone} ${isPaused ? "is-paused" : ""}`}
      role={toast.tone === "error" ? "alert" : "status"}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onFocus={() => setIsPaused(true)}
      onBlur={() => setIsPaused(false)}
    >
      <i className={`bi ${TONE_ICONS[toast.tone]} toast-icon`}></i>

      <div className="toast-message">{toast.message}</div>

      {toast.action && (
        <button
          type="button"
          className="toast-action"
          onClick={handleAction}
        >
          {toast.action.label}
        </button>
      )}

      <button
        type="button"
        className="toast-close"
        onClick={() => onDismiss(toast.id)}
        aria-label="Dismiss notification"
      >
        <i className="bi bi-x-lg"></i>
      </button>

      <span
        className="toast-progress"
        style={{ animationDuration: `${toast.duration}ms` }}
      />
    </div>
  );
}

function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const dismiss = useCallback((id) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  const show = useCallback(
    ({ message, tone = "info", action = null, duration }) => {
      const id = crypto.randomUUID();

      setToasts((current) => [
        ...current.slice(-3),
        {
          id,
          message,
          tone,
          action,
          duration: duration ?? (action ? 6000 : 3500),
        },
      ]);

      return id;
    },
    []
  );

  const api = useMemo(
    () => ({
      show,
      dismiss,
      success: (message, options) => show({ ...options, message, tone: "success" }),
      error: (message, options) => show({ ...options, message, tone: "error" }),
      info: (message, options) => show({ ...options, message, tone: "info" }),
    }),
    [show, dismiss]
  );

  return (
    <ToastContext.Provider value={api}>
      {children}

      <div className="toast-viewport" aria-live="polite">
        {toasts.map((toast) => (
          <ToastItem key={toast.id} toast={toast} onDismiss={dismiss} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export default ToastProvider;
