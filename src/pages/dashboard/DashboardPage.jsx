import { useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import "./DashboardPage.css";
import { getFirstName } from "../../services/profileStorage";
import useProfile from "../../hooks/useProfile";
import useNow from "../../hooks/useNow";
import {
  useNotes,
  usePullRequests,
  useTickets,
} from "../../hooks/useWorkspaceData";
import { buildActivity } from "../../services/activityService";
import { createNote } from "../../services/noteStorage";
import {
  getDueState,
  getRunningTicket,
  getStatusLabel,
  getTrackedMs,
  isTicketDone,
  TICKET_STATUSES,
} from "../../services/ticketStorage";
import { DueBadge } from "../../components/tickets/ticket-badges/TicketBadges";
import {
  formatDuration,
  formatRelativeTime,
  startOfWeek,
} from "../../utils/format";

const DAY_MS = 24 * 60 * 60 * 1000;
const WEEK_DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function DashboardPage() {
  const navigateTo = useNavigate();

  const { profile, isSaved: hasProfile } = useProfile();

  const tickets = useTickets();
  const prs = usePullRequests();
  const allNotes = useNotes();
  const notes = useMemo(
    () => allNotes.filter((note) => !note.deleted),
    [allNotes]
  );

  const hasRunningTimer = Boolean(getRunningTicket(tickets));
  const now = useNow(hasRunningTimer ? 1000 : 60000);

  const ticketStats = useMemo(() => {
    const done = tickets.filter(isTicketDone).length;

    const pending = tickets.length - done;

    const statusCounts = TICKET_STATUSES.reduce(
      (counts, status) => {
        const count = tickets.filter(
          (ticket) => ticket.status === status.value
        ).length;

        if (count > 0) {
          counts[status.value] = count;
        }

        return counts;
      },
      {}
    );

    const completion =
      tickets.length > 0
        ? Math.round(
            (done / tickets.length) * 100
          )
        : 0;

    return {
      total: tickets.length,
      done,
      pending,
      completion,
      statusCounts,
    };
  }, [tickets]);

  const prStats = useMemo(() => {
    const merged = prs.filter(
      (pr) =>
        normalize(pr.status) === "merged"
    ).length;

    const readyToMerge = prs.filter(
      (pr) =>
        normalize(pr.status) ===
        "ready to merge"
    ).length;

    const pending = prs.filter(
      (pr) =>
        normalize(pr.status) === "pending"
    ).length;

    const comment = prs.filter(
      (pr) =>
        normalize(pr.status) === "comment"
    ).length;

    const completion =
      prs.length > 0
        ? Math.round(
            (merged / prs.length) * 100
          )
        : 0;

    return {
      total: prs.length,
      merged,
      readyToMerge,
      pending,
      comment,
      completion,
    };
  }, [prs]);

  const noteStats = useMemo(
    () => ({
      total: notes.length,
    }),
    [notes]
  );

  const recentActivity = useMemo(
    () => buildActivity({ tickets, prs, notes }).slice(0, 8),
    [tickets, prs, notes]
  );

  const dueSoon = useMemo(() => {
    const today = new Date(now);

    return tickets
      .map((ticket) => ({ ticket, due: getDueState(ticket, today) }))
      .filter(({ due }) => due && due.state !== "later")
      .sort((a, b) => a.ticket.dueDate.localeCompare(b.ticket.dueDate))
      .slice(0, 6);
  }, [tickets, now]);

  const weeklyTime = useMemo(() => {
    const weekStart = startOfWeek(new Date(now)).getTime();

    const days = WEEK_DAYS.map((label, index) => {
      const from = weekStart + index * DAY_MS;
      const until = from + DAY_MS;

      return {
        label,
        ms: tickets.reduce(
          (total, ticket) => total + getTrackedMs(ticket, now, from, until),
          0
        ),
        isToday: now >= from && now < until,
      };
    });

    const topTickets = tickets
      .map((ticket) => ({
        ticket,
        ms: getTrackedMs(ticket, now, weekStart),
      }))
      .filter((item) => item.ms > 0)
      .sort((a, b) => b.ms - a.ms)
      .slice(0, 4);

    const total = days.reduce((sum, day) => sum + day.ms, 0);
    const max = Math.max(...days.map((day) => day.ms), 1);

    return { days, topTickets, total, max };
  }, [tickets, now]);

  const createAndOpenNote = () => {
    navigateTo(`/notes?note=${createNote().id}`);
  };

  const completedTotal =
    ticketStats.done + prStats.merged;

  return (
    <div className="dashboard-page">

      <div className="dashboard-header">
        <div>
          <h1>Dashboard</h1>

          <p>
            {hasProfile ? (
              <>
                Welcome back,{" "}
                <strong>
                  {getFirstName(profile.name)}
                </strong>{" "}
                👋
              </>
            ) : (
              <>
                Welcome! 👋{" "}
                <button
                  type="button"
                  className="dashboard-set-name"
                  onClick={() => navigateTo("/profile")}
                >
                  Add your name
                </button>
              </>
            )}
          </p>
        </div>

        <button
          className="dashboard-refresh-button"
          onClick={() => navigateTo("/tasks?new=1")}
          title="New ticket (N)"
        >
          + New Ticket
        </button>
      </div>

      <div className="dashboard-content">

        <div className="dashboard-stats-grid">
          <DashboardStat
            icon="🎫"
            title="Tickets"
            value={ticketStats.total}
            subtitle={`${ticketStats.pending} pending`}
            color="blue"
          />

          <DashboardStat
            icon="⏳"
            title="Pending"
            value={ticketStats.pending}
            subtitle="Tickets remaining"
            color="orange"
          />

          <DashboardStat
            icon="🔀"
            title="Pull Requests"
            value={prStats.total}
            subtitle={`${prStats.merged} merged`}
            color="purple"
          />

          <DashboardStat
            icon="📝"
            title="Notes"
            value={noteStats.total}
            subtitle="Total notes"
            color="green"
          />
        </div>

        <div className="dashboard-main-grid">

          <section className="dashboard-card">
            <div className="dashboard-card-header">
              <div>
                <h2>
                  Ticket Overview
                </h2>

                <p>
                  Current ticket progress.
                </p>
              </div>

              <span className="dashboard-card-icon blue">
                🎫
              </span>
            </div>

            <div className="completion-section">
              <div className="completion-header">
                <span>
                  Completion
                </span>

                <strong>
                  {ticketStats.completion}%
                </strong>
              </div>

              <div className="dashboard-progress">
                <div
                  className="dashboard-progress-fill blue"
                  style={{
                    width: `${ticketStats.completion}%`,
                  }}
                />
              </div>
            </div>

            <div className="overview-status-grid">
              <OverviewStatus
                label="Done"
                value={ticketStats.done}
                color="done"
              />

              <OverviewStatus
                label="Pending"
                value={ticketStats.pending}
                color="pending"
              />
            </div>

            {Object.keys(
              ticketStats.statusCounts
            ).length > 0 && (
              <div className="status-breakdown">
                <div className="breakdown-title">
                  Status breakdown
                </div>

                {Object.entries(
                  ticketStats.statusCounts
                )
                  .slice(0, 5)
                  .map(
                    ([status, count]) => (
                      <div
                        className="breakdown-row"
                        key={status}
                      >
                        <span>
                          {getStatusLabel(status)}
                        </span>

                        <strong>
                          {count}
                        </strong>
                      </div>
                    )
                  )}
              </div>
            )}
          </section>

          <section className="dashboard-card">
            <div className="dashboard-card-header">
              <div>
                <h2>
                  PR Overview
                </h2>

                <p>
                  Current pull request
                  progress.
                </p>
              </div>

              <span className="dashboard-card-icon purple">
                🔀
              </span>
            </div>

            <div className="completion-section">
              <div className="completion-header">
                <span>
                  Merge completion
                </span>

                <strong>
                  {prStats.completion}%
                </strong>
              </div>

              <div className="dashboard-progress">
                <div
                  className="dashboard-progress-fill purple"
                  style={{
                    width: `${prStats.completion}%`,
                  }}
                />
              </div>
            </div>

            <div className="pr-status-list">
              <PRStatusRow
                label="Merged"
                value={prStats.merged}
                color="merged"
              />

              <PRStatusRow
                label="Ready to merge"
                value={
                  prStats.readyToMerge
                }
                color="ready"
              />

              <PRStatusRow
                label="Pending"
                value={prStats.pending}
                color="pending"
              />

              <PRStatusRow
                label="Comment"
                value={prStats.comment}
                color="comment"
              />
            </div>
          </section>
        </div>

        <div className="dashboard-focus-grid">
          <section className="dashboard-card">
            <div className="dashboard-card-header">
              <div>
                <h2>Due Soon</h2>

                <p>Overdue and due within 7 days.</p>
              </div>

              <span className="dashboard-card-icon orange">⏰</span>
            </div>

            {dueSoon.length === 0 ? (
              <div className="dashboard-empty-inline">
                <i className="bi bi-calendar-check"></i>
                Nothing due this week.
              </div>
            ) : (
              <ul className="due-list">
                {dueSoon.map(({ ticket }) => (
                  <li key={ticket.id}>
                    <Link to={`/tasks/${ticket.id}`} className="due-item">
                      <span className="due-item-number">{ticket.ticketNumber}</span>
                      <span className="due-item-title">{ticket.title}</span>
                      <DueBadge ticket={ticket} now={new Date(now)} />
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="dashboard-card">
            <div className="dashboard-card-header">
              <div>
                <h2>Time This Week</h2>

                <p>{formatDuration(weeklyTime.total)} tracked since Monday.</p>
              </div>

              <span className="dashboard-card-icon green">⏱</span>
            </div>

            <div className="week-chart" role="img" aria-label={`Time tracked per day this week, ${formatDuration(weeklyTime.total)} total`}>
              {weeklyTime.days.map((day) => (
                <div
                  key={day.label}
                  className={`week-chart-day ${day.isToday ? "is-today" : ""}`}
                  title={`${day.label}: ${formatDuration(day.ms)}`}
                >
                  <div className="week-chart-bar-track">
                    <div
                      className="week-chart-bar"
                      style={{ height: `${(day.ms / weeklyTime.max) * 100}%` }}
                    />
                  </div>
                  <span>{day.label}</span>
                </div>
              ))}
            </div>

            {weeklyTime.topTickets.length === 0 ? (
              <div className="dashboard-empty-inline">
                <i className="bi bi-stopwatch"></i>
                Start a timer on a ticket to track time.
              </div>
            ) : (
              <ul className="time-top-list">
                {weeklyTime.topTickets.map(({ ticket, ms }) => (
                  <li key={ticket.id}>
                    <Link to={`/tasks/${ticket.id}`}>
                      <span className="due-item-number">{ticket.ticketNumber}</span>
                      <span className="due-item-title">{ticket.title}</span>
                      <strong>{formatDuration(ms)}</strong>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>

        <div className="dashboard-lower-grid">

          <section className="dashboard-card activity-card">
            <div className="dashboard-card-header">
              <div>
                <h2>
                  Recent Activity
                </h2>

                <p>
                  Your latest workspace
                  activity.
                </p>
              </div>
            </div>

            {recentActivity.length === 0 ? (
              <div className="empty-activity">
                <div>📋</div>

                <h3>
                  No activity yet
                </h3>

                <p>
                  Create a ticket, PR or
                  note to see activity
                  here.
                </p>
              </div>
            ) : (
              <div className="activity-list">
                {recentActivity.map(
                  (activity) => (
                    <ActivityItem
                      key={activity.id}
                      activity={activity}
                      now={now}
                    />
                  )
                )}
              </div>
            )}
          </section>

          <section className="dashboard-card summary-card">
            <div className="dashboard-card-header">
              <div>
                <h2>
                  Workspace Summary
                </h2>

                <p>
                  Your overall progress.
                </p>
              </div>
            </div>

            <div className="summary-list">
              <SummaryRow
                label="Total tickets"
                value={
                  ticketStats.total
                }
              />

              <SummaryRow
                label="Completed tickets"
                value={
                  ticketStats.done
                }
              />

              <SummaryRow
                label="Total PRs"
                value={
                  prStats.total
                }
              />

              <SummaryRow
                label="Merged PRs"
                value={
                  prStats.merged
                }
              />

              <SummaryRow
                label="Total notes"
                value={
                  noteStats.total
                }
              />

              <div className="summary-total">
                <span>
                  Completed work
                </span>

                <strong>
                  {completedTotal}
                </strong>
              </div>
            </div>
          </section>
        </div>

        <section className="dashboard-card quick-actions-card">
          <div className="dashboard-card-header">
            <div>
              <h2>
                Quick Actions
              </h2>

              <p>
                Quickly jump to your
                workspace.
              </p>
            </div>
          </div>

          <div className="quick-actions">
            <button
              className="quick-action blue"
              onClick={() =>
                navigateTo(
                  "/tasks?new=1"
                )
              }
            >
              <span>🎫</span>

              <div>
                <strong>
                  New Ticket
                </strong>

                <small>
                  Create a new ticket
                </small>
              </div>

              <span className="arrow">
                →
              </span>
            </button>

            <button
              className="quick-action purple"
              onClick={() =>
                navigateTo(
                  "/pull-request?new=1"
                )
              }
            >
              <span>🔀</span>

              <div>
                <strong>
                  New PR
                </strong>

                <small>
                  Add a pull request
                </small>
              </div>

              <span className="arrow">
                →
              </span>
            </button>

            <button
              className="quick-action orange"
              onClick={createAndOpenNote}
            >
              <span>📝</span>

              <div>
                <strong>
                  New Note
                </strong>

                <small>
                  Create a new note
                </small>
              </div>

              <span className="arrow">
                →
              </span>
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}

function DashboardStat({
  icon,
  title,
  value,
  subtitle,
  color,
}) {
  return (
    <div className="dashboard-stat-card">
      <div
        className={`dashboard-stat-icon ${color}`}
      >
        {icon}
      </div>

      <div className="dashboard-stat-info">
        <span>
          {title}
        </span>

        <strong>
          {value}
        </strong>

        <small>
          {subtitle}
        </small>
      </div>
    </div>
  );
}

function OverviewStatus({
  label,
  value,
  color,
}) {
  return (
    <div className="overview-status">
      <div
        className={`status-dot ${color}`}
      />

      <span>
        {label}
      </span>

      <strong>
        {value}
      </strong>
    </div>
  );
}

function PRStatusRow({
  label,
  value,
  color,
}) {
  return (
    <div className="pr-status-row">
      <div className="pr-status-label">
        <span
          className={`status-dot ${color}`}
        />

        <span>
          {label}
        </span>
      </div>

      <strong>
        {value}
      </strong>
    </div>
  );
}

function ActivityItem({
  activity,
  now,
}) {
  return (
    <Link to={activity.to} className="activity-item">
      <div
        className={`activity-icon tone-${activity.tone}`}
      >
        <i className={`bi ${activity.icon}`}></i>
      </div>

      <div className="activity-content">
        <div className="activity-action">
          {activity.action}
        </div>

        <div className="activity-title">
          {activity.title}
        </div>
      </div>

      <div className="activity-time">
        {formatRelativeTime(
          activity.date,
          now
        )}
      </div>
    </Link>
  );
}

function SummaryRow({
  label,
  value,
}) {
  return (
    <div className="summary-row">
      <span>
        {label}
      </span>

      <strong>
        {value}
      </strong>
    </div>
  );
}

function normalize(value) {
  return String(value || "")
    .toLowerCase()
    .trim();
}

export default DashboardPage;
