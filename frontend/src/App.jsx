import TasksPage from './pages/TasksPage.jsx';

/** Composición raíz de la aplicación: cabecera, contenido y pie. */
export default function App() {
  return (
    <div className="app">
      <header className="app__header">
        <div>
          <h1>Gestor de Tareas</h1>
          <p className="app__subtitle">
            React + Vite consumiendo una API Express con PostgreSQL
          </p>
        </div>
      </header>

      <main className="app__main">
        <TasksPage />
      </main>

      <footer className="app__footer">
        <span>API: {import.meta.env.VITE_API_URL ?? '/api'}</span>
      </footer>
    </div>
  );
}
