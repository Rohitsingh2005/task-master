import { Link, useLocation } from "react-router-dom";

import "./NotFoundPage.css";

function NotFoundPage() {
  const location = useLocation();

  return (
    <div className="not-found-page">
      <div className="not-found-code" aria-hidden="true">
        404
      </div>

      <h1>Page not found</h1>

      <p>
        There's nothing at <code>{location.pathname}</code>. It may have been
        moved, or the link is wrong.
      </p>

      <div className="not-found-actions">
        <Link to="/" className="btn btn-primary">
          <i className="bi bi-speedometer2 me-2"></i>
          Go to Dashboard
        </Link>

        <Link to="/tasks" className="btn btn-light">
          <i className="bi bi-ticket-perforated me-2"></i>
          View tickets
        </Link>
      </div>

      <p className="not-found-hint">
        Tip: press <kbd>Ctrl</kbd> + <kbd>K</kbd> to search everything.
      </p>
    </div>
  );
}

export default NotFoundPage;
