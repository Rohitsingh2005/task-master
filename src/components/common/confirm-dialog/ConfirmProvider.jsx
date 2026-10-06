import { useCallback, useRef, useState } from "react";

import Modal from "../modal/Modal";
import { ConfirmContext } from "../../../context/ConfirmContext";

import "./ConfirmDialog.css";

const TITLE_ID = "confirm-dialog-title";

function ConfirmProvider({ children }) {
  const [request, setRequest] = useState(null);
  const resolver = useRef(null);

  const confirm = useCallback(
    (options) =>
      new Promise((resolve) => {
        resolver.current?.(false);
        resolver.current = resolve;
        setRequest({
          title: "Are you sure?",
          message: "",
          confirmLabel: "Confirm",
          cancelLabel: "Cancel",
          tone: "danger",
          icon: options.tone === "primary" ? "bi-question-circle" : "bi-exclamation-triangle",
          ...options,
        });
      }),
    []
  );

  const close = useCallback((result) => {
    resolver.current?.(result);
    resolver.current = null;
    setRequest(null);
  }, []);

  const handleCancel = useCallback(() => close(false), [close]);

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}

      {request && (
        <Modal
          titleId={TITLE_ID}
          onClose={handleCancel}
          className="size-sm"
          align="center"
        >
          <div className={`confirm-dialog tone-${request.tone}`}>
            <div className="confirm-dialog-icon">
              <i className={`bi ${request.icon}`}></i>
            </div>

            <h2 id={TITLE_ID}>{request.title}</h2>

            {request.message && <p>{request.message}</p>}

            <div className="confirm-dialog-actions">
              <button
                type="button"
                className="btn btn-light"
                onClick={handleCancel}
              >
                {request.cancelLabel}
              </button>

              <button
                type="button"
                className={`btn ${
                  request.tone === "danger" ? "btn-danger" : "btn-primary"
                }`}
                onClick={() => close(true)}
                data-autofocus
              >
                {request.confirmLabel}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </ConfirmContext.Provider>
  );
}

export default ConfirmProvider;
