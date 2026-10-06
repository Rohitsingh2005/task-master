# Task Master

A keyboard-first productivity workspace for developers. Track tickets on a Kanban board, log time against them, link pull requests and notes, and see everything on one dashboard. It is built with React 19 and Vite and runs fully in the browser with no backend.

![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-8-646CFF?logo=vite&logoColor=white)
![React Router](https://img.shields.io/badge/React_Router-7-CA4245?logo=reactrouter&logoColor=white)
![Bootstrap](https://img.shields.io/badge/Bootstrap-5.3-7952B3?logo=bootstrap&logoColor=white)
![Vitest](https://img.shields.io/badge/Tested_with-Vitest-6E9F18?logo=vitest&logoColor=white)

---

## Features

### Tickets
- **Two views:** a Kanban board with drag-and-drop between columns, and a sortable table.
- **Statuses:** To Do, In Progress, In Review and Completed. **Priorities:** Low, Medium, High and Critical.
- **Due dates** with live badges: *Overdue by N days*, *Due today*, *Due in N days*.
- **Search, filter and sort** by status, priority, due window, creation date, last update, priority or ticket number.
- **Change history:** every edit to status, priority, due date, title or description is recorded and shown on a timeline.
- **Undoable deletes:** a confirm dialog first, then an *Undo* toast that puts the ticket back in its original position.

### Time tracking
- One-click start and stop timers. Only one timer runs at a time, so starting a new one stops the previous one automatically.
- A running timer stays visible in the top bar on every page.
- Each ticket keeps a list of time entries, and you can delete individual entries.
- A weekly chart on the dashboard shows tracked time per day.

### Pull requests
- Track a branch with multiple links (PR, Jira, GitHub, GitLab), each tagged as frontend or backend.
- Status workflow: *Pending → Comment → Ready to merge → Merged*.
- Link PRs to tickets. Linking and merging show up in the ticket's history.

### Notes
- Views for all notes, favorites and pinned notes, plus a trash that can be emptied with undo.
- Full-text search, and links from notes to tickets.

### Dashboard
- A greeting, ticket and PR overviews, a list of items due in the next 7 days, and the weekly time chart.
- An activity feed that merges ticket history, PR changes and note edits into one timeline.
- Workspace summary and quick actions.

### Workspace-wide
- **Command palette** (`Ctrl/⌘ + K`) to search across tickets, PRs, notes, pages and actions.
- **Keyboard shortcuts:**

  | Key | Action |
  | --- | --- |
  | `Ctrl/⌘ + K` | Open command palette |
  | `N` | New ticket |
  | `/` | Focus search |
  | `?` | Open command palette |
  | `Esc` | Close dialog |

- **Notifications menu** with unread tracking.
- **Light and dark themes.** The theme follows the OS setting by default and is applied before React mounts, so the page never flashes the wrong theme.
- **Profile page** with an avatar upload (resized to a square on the client side with a canvas) and productivity stats.
- **Backup and restore:** export the whole workspace to JSON, import it again with validation and a preview summary, and see how much storage is in use.
- **Live sync across tabs:** a change made in one browser tab appears in the others immediately.

---

## Architecture

```
src/
├── components/
│   ├── common/        Reusable UI: Modal, Toast, ConfirmDialog, CommandPalette, Avatar, Logo
│   ├── layout/        AppLayout, Sidebar, Topbar, NotificationsMenu
│   ├── settings/      BackupPanel
│   └── tickets/       TicketBoard, TicketTable, TicketForm, TicketToolbar, TicketBadges, RunningTimer
├── context/           React contexts for Toast and Confirm
├── hooks/             useWorkspaceData, useStorageKey, useTicketActions, useGlobalShortcuts, useTheme, ...
├── pages/             Dashboard, Tasks, TicketDetail, Notes, PullRequests, Profile, NotFound
├── services/          Storage layer and per-domain services (tickets, PRs, notes, profile, activity, backup)
├── utils/             Formatting, filtering and sorting, image resizing, file download
└── main.css           Design tokens (colors, fonts) for the light and dark themes
```

### Design decisions

**Reactive storage with `useSyncExternalStore`.**
All data goes through a small storage layer (`services/storage.js`). Every write sends a custom `taskMaster:storage-changed` event. The `useStorageKey` hook subscribes to that event and to the browser's native `storage` event using React 18+'s `useSyncExternalStore`. As a result:
- every page that reads a key re-renders when that key changes, with no global state library;
- edits made in another browser tab show up instantly;
- reads are safe during concurrent rendering, without tearing.

**A service layer separate from the UI.**
Pages never touch `localStorage` directly. Domain services (`ticketStorage`, `prStorage`, `noteStorage`) own the data rules: normalizing data, writing history entries, timer rules, and positional delete and restore for undo. Because of that, the persistence layer can later be swapped for a REST or GraphQL API without rewriting components.

**Defensive data normalization.**
Every record passes through a `normalize*` function on read. Corrupted or older-format data, and backups from earlier versions, are repaired instead of crashing the app.

**Promise-based confirm dialogs.**
`const ok = await confirm({ ... })` gives a clean `async` flow, in place of scattered modal state in every component.

**Accessible components.**
Modals trap focus, restore focus when they close and close on `Esc`. Interactive controls have ARIA labels, and the dashboard chart has a text description for screen readers.

**Design tokens.**
All colors and fonts are CSS custom properties in `main.css`. Dark mode is a single set of token overrides under `[data-bs-theme="dark"]`, with no per-component dark styles.

---

## Getting started

**Prerequisites:** Node.js 20+ and npm.

```bash
git clone <your-repo-url>
cd task-master
npm install
npm run dev
```

The app runs at http://localhost:5173.

### Scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Start the Vite dev server with hot module replacement (HMR) |
| `npm run build` | Build for production into `dist/` |
| `npm run preview` | Serve the production build locally |
| `npm test` | Run the test suite once |
| `npm run test:watch` | Run tests in watch mode |
| `npm run lint` | Lint the project with ESLint |

---

## Testing

The tests use **Vitest**, **React Testing Library** and **jsdom**. They cover:

- **Ticket service:** create and update, history diffing, timer start and stop, overlapping time ranges, due-date states.
- **Filtering and sorting:** every filter and sort combination.
- **Backup service:** validation of malformed and foreign files, round-trip restore.
- **Formatting utilities:** dates, durations, relative times.
- **TicketForm:** validation and submission through user-event interactions.

```bash
npm test
```

---

## Roadmap

- [ ] Migrate to TypeScript
- [ ] Backend API and authentication, with server state managed by TanStack Query
- [ ] Accessible keyboard drag-and-drop with dnd-kit
- [ ] Markdown editor for notes
- [ ] Code splitting for each route and list virtualization
- [ ] End-to-end tests with Playwright, plus a CI pipeline in GitHub Actions
- [ ] Offline-first PWA support

---

## Tech stack

| Area | Tools |
| --- | --- |
| UI | React 19, React Router 7, Bootstrap 5, Bootstrap Icons |
| Build | Vite 8 |
| State | `useSyncExternalStore` with a custom event-driven storage layer, React Context |
| Testing | Vitest, React Testing Library, user-event, jsdom |
| Quality | ESLint 10 with the react-hooks and react-refresh plugins |
