import { AuthProvider, useAuth } from './context/AuthContext.jsx';
import LoginPage from './pages/LoginPage.jsx';
import TasksPage from './pages/TasksPage.jsx';

function AppContent() {
  const { user, initializing, logout } = useAuth();

  return (
    <div className="app">
      <header className="app__header">
        <div>
          <h1>Gestor de Tareas</h1>
          <p className="app__subtitle">
            React + Vite consumiendo una API Express con PostgreSQL y JWT
          </p>
        </div>

        {user && (
          <div className="app__user">
            <div className="app__user-info">
              <strong>{user.name}</strong>
              <span>{user.email}</span>
            </div>
            <button type="button" className="button button--ghost" onClick={logout}>
              Cerrar sesión
            </button>
          </div>
        )}
      </header>

      <main className="app__main">
        {initializing ? (
          <p className="muted">Comprobando sesión…</p>
        ) : user ? (
          <TasksPage />
        ) : (
          <LoginPage />
        )}
      </main>

      <footer className="app__footer">
        <span>API: {import.meta.env.VITE_API_URL ?? '/api'}</span>
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
