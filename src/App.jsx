import { BrowserRouter, Routes, Route } from 'react-router-dom'

import AppLayout from './components/layout/app-layout/AppLayout'
import ToastProvider from './components/common/toast/ToastProvider'
import ConfirmProvider from './components/common/confirm-dialog/ConfirmProvider'

import DashboardPage from './pages/dashboard/DashboardPage'
import TasksPage from './pages/tasks/TasksPage'
import TicketDetailPage from './pages/ticket-detail/TicketDetailPage'
import NotesPage from './pages/notes/NotesPage'
import PRPage from './pages/pull-requests/PRPage'
import ProfilePage from './pages/profile/ProfilePage'
import NotFoundPage from './pages/not-found/NotFoundPage'

function App() {
  return (
    <BrowserRouter>
      <ToastProvider>
        <ConfirmProvider>
          <Routes>
            <Route element={<AppLayout />}>
              <Route path="/" element={<DashboardPage />} />

              <Route path="/tasks" element={<TasksPage />} />

              <Route path="/tasks/:ticketId" element={<TicketDetailPage />} />

              <Route path="/notes" element={<NotesPage />} />

              <Route path="/pull-request" element={<PRPage />} />

              <Route path="/profile" element={<ProfilePage />} />

              <Route path="*" element={<NotFoundPage />} />
            </Route>
          </Routes>
        </ConfirmProvider>
      </ToastProvider>
    </BrowserRouter>
  )
}

export default App
