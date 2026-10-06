import { Link } from "react-router-dom";

import useNow from "../../../hooks/useNow";
import { useTickets } from "../../../hooks/useWorkspaceData";
import {
  getRunningTicket,
  stopTimer,
} from "../../../services/ticketStorage";
import { formatClock } from "../../../utils/format";

import "./RunningTimer.css";

function RunningTimer() {
  const tickets = useTickets();
  const running = getRunningTicket(tickets);
  const now = useNow(1000, Boolean(running));

  if (!running) {
    return null;
  }

  const elapsed = now - new Date(running.timerStartedAt).getTime();

  return (
    <div className="running-timer" role="status">
      <span className="running-timer-dot" aria-hidden="true" />

      <Link
        to={`/tasks/${running.id}`}
        className="running-timer-link"
        title={`Timer running on ${running.ticketNumber}: ${running.title}`}
      >
        <span className="running-timer-ticket">{running.ticketNumber}</span>
        <span className="running-timer-clock">{formatClock(elapsed)}</span>
      </Link>

      <button
        type="button"
        className="running-timer-stop"
        onClick={() => stopTimer(running.id)}
        aria-label={`Stop timer on ${running.ticketNumber}`}
        title="Stop timer"
      >
        <i className="bi bi-stop-fill"></i>
      </button>
    </div>
  );
}

export default RunningTimer;
