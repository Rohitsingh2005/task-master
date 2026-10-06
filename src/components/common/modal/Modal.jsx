import { useEffect, useRef, useState } from "react";

import "./Modal.css";

const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

const DRAG_HANDLE_SELECTOR = "[data-drag-handle]";
const NON_DRAG_SELECTOR = "button, input, select, textarea, a";
const VIEWPORT_MARGIN = 12;

const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

function Modal({ titleId, onClose, children, className = "", align = "top" }) {
  const dialogRef = useRef(null);
  const pressStartedOnBackdrop = useRef(false);
  const offset = useRef({ x: 0, y: 0 });
  const drag = useRef(null);

  const [isDragging, setIsDragging] = useState(false);

  const [returnFocusTo] = useState(() => document.activeElement);

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;

    document.body.style.overflow = "hidden";

    const dialog = dialogRef.current;

    (
      dialog?.querySelector("[data-autofocus]") ??
      dialog?.querySelector("input, select, textarea") ??
      dialog?.querySelector(FOCUSABLE_SELECTOR)
    )?.focus();

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        onClose();
        return;
      }

      if (event.key !== "Tab" || !dialogRef.current) {
        return;
      }

      const focusable = dialogRef.current.querySelectorAll(
        FOCUSABLE_SELECTOR,
      );

      if (!focusable.length) {
        return;
      }

      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = previousOverflow;
      returnFocusTo?.focus?.();
    };
  }, [onClose, returnFocusTo]);

  const applyOffset = ({ x, y }) => {
    offset.current = { x, y };

    if (dialogRef.current) {
      dialogRef.current.style.translate = `${x}px ${y}px`;
    }
  };

  useEffect(() => {
    const handleResize = () => applyOffset({ x: 0, y: 0 });

    window.addEventListener("resize", handleResize);

    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const handlePointerDown = (event) => {
    const handle = event.target.closest(DRAG_HANDLE_SELECTOR);

    if (
      !handle ||
      event.button !== 0 ||
      event.target.closest(NON_DRAG_SELECTOR)
    ) {
      return;
    }

    const rect = dialogRef.current.getBoundingClientRect();
    const handleHeight = handle.getBoundingClientRect().height;
    const fitsVertically = rect.height + VIEWPORT_MARGIN * 2 <= window.innerHeight;

    drag.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      startOffset: offset.current,
      minDx: VIEWPORT_MARGIN - rect.left,
      maxDx: window.innerWidth - VIEWPORT_MARGIN - rect.right,
      minDy: VIEWPORT_MARGIN - rect.top,
      maxDy: fitsVertically
        ? window.innerHeight - VIEWPORT_MARGIN - rect.bottom
        : window.innerHeight - VIEWPORT_MARGIN - rect.top - handleHeight,
    };

    handle.setPointerCapture(event.pointerId);
    setIsDragging(true);
    event.preventDefault();
  };

  const handlePointerMove = (event) => {
    const current = drag.current;

    if (!current || current.pointerId !== event.pointerId) {
      return;
    }

    const dx = clamp(event.clientX - current.startX, current.minDx, current.maxDx);
    const dy = clamp(event.clientY - current.startY, current.minDy, current.maxDy);

    applyOffset({
      x: current.startOffset.x + dx,
      y: current.startOffset.y + dy,
    });
  };

  const handlePointerUp = (event) => {
    if (!drag.current || drag.current.pointerId !== event.pointerId) {
      return;
    }

    drag.current = null;
    setIsDragging(false);
  };

  const handleDoubleClick = (event) => {
    if (
      event.target.closest(DRAG_HANDLE_SELECTOR) &&
      !event.target.closest(NON_DRAG_SELECTOR)
    ) {
      applyOffset({ x: 0, y: 0 });
    }
  };

  const handleBackdropMouseDown = (event) => {
    pressStartedOnBackdrop.current = event.target === event.currentTarget;
  };

  const handleBackdropClick = (event) => {
    if (
      pressStartedOnBackdrop.current &&
      event.target === event.currentTarget
    ) {
      onClose();
    }
  };

  return (
    <div
      className={`app-modal-backdrop align-${align}`}
      onMouseDown={handleBackdropMouseDown}
      onClick={handleBackdropClick}
    >
      <div
        ref={dialogRef}
        className={`app-modal ${className} ${isDragging ? "is-dragging" : ""}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        onDoubleClick={handleDoubleClick}
      >
        {children}
      </div>
    </div>
  );
}

export default Modal;
