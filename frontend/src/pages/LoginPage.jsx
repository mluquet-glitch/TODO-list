import { useState } from 'react';
import Alert from '../components/Alert.jsx';
import { useAuth } from '../context/AuthContext.jsx';

const INITIAL_FORM = { name: '', email: '', password: '' };

/** Pantalla de acceso: alterna entre iniciar sesión y crear una cuenta. */
export default function LoginPage() {
  const { login, register } = useAuth();
  const [mode, setMode] = useState('login');
  const [form, setForm] = useState(INITIAL_FORM);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const isRegister = mode === 'register';

  function handleChange(event) {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
    if (error) setError('');
  }

  function switchMode(nextMode) {
    setMode(nextMode);
    setError('');
  }

  async function handleSubmit(event) {
    event.preventDefault();

    const email = form.email.trim();
    const password = form.password;

    if (isRegister && form.name.trim().length < 2) {
      setError('El nombre debe tener al menos 2 caracteres.');
      return;
    }

    if (!email || !password) {
      setError('Introduce tu email y tu contraseña.');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      if (isRegister) {
        await register({ name: form.name.trim(), email, password });
      } else {
        await login({ email, password });
      }
    } catch (err) {
      const details = Array.isArray(err.details) && err.details.length > 0
        ? ` ${err.details.join(' · ')}`
        : '';
      setError(`${err.message ?? 'No se pudo completar la operación'}${details}`);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="auth">
      <section className="auth__brand">
        <span className="auth__brand-badge">API + JWT</span>
        <h2>Organiza tu trabajo, no tus contraseñas.</h2>
        <p>
          Autenticación con access tokens de corta duración y refresh tokens en
          cookies httpOnly. Cada usuario accede únicamente a sus tareas.
        </p>
        <ul className="auth__features">
          <li>Registro y login con bcrypt + JWT</li>
          <li>Sesiones renovables y logout real</li>
          <li>Datos aislados por usuario</li>
        </ul>
      </section>

      <section className="auth__panel">
        <div className="card auth__card">
          <div className="auth__tabs" role="tablist" aria-label="Modo de acceso">
            <button
              type="button"
              role="tab"
              aria-selected={!isRegister}
              className={`auth__tab ${!isRegister ? 'auth__tab--active' : ''}`}
              onClick={() => switchMode('login')}
            >
              Iniciar sesión
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={isRegister}
              className={`auth__tab ${isRegister ? 'auth__tab--active' : ''}`}
              onClick={() => switchMode('register')}
            >
              Crear cuenta
            </button>
          </div>

          <h2 className="card__title">
            {isRegister ? 'Crea tu cuenta' : 'Bienvenido de nuevo'}
          </h2>
          <p className="muted auth__subtitle">
            {isRegister
              ? 'Empieza a gestionar tus tareas en unos segundos.'
              : 'Accede para ver y gestionar tus tareas.'}
          </p>

          <Alert type="error" message={error} onClose={() => setError('')} />

          <form className="auth__form" onSubmit={handleSubmit} noValidate>
            {isRegister && (
              <div className="field">
                <label htmlFor="auth-name">Nombre</label>
                <input
                  id="auth-name"
                  name="name"
                  type="text"
                  value={form.name}
                  onChange={handleChange}
                  autoComplete="name"
                  maxLength={120}
                  placeholder="Tu nombre"
                />
              </div>
            )}

            <div className="field">
              <label htmlFor="auth-email">Email</label>
              <input
                id="auth-email"
                name="email"
                type="email"
                value={form.email}
                onChange={handleChange}
                autoComplete="email"
                maxLength={255}
                placeholder="tu@email.com"
              />
            </div>

            <div className="field">
              <label htmlFor="auth-password">Contraseña</label>
              <input
                id="auth-password"
                name="password"
                type="password"
                value={form.password}
                onChange={handleChange}
                autoComplete={isRegister ? 'new-password' : 'current-password'}
                minLength={8}
                maxLength={72}
                placeholder={isRegister ? 'Mínimo 8 caracteres, letras y números' : 'Tu contraseña'}
              />
            </div>

            <button
              type="submit"
              className="button button--primary auth__submit"
              disabled={submitting}
            >
              {submitting
                ? 'Procesando…'
                : isRegister
                  ? 'Crear cuenta'
                  : 'Entrar'}
            </button>
          </form>

          <p className="auth__demo">
            Cuenta de demostración: <code>demo@tareas.local</code> ·{' '}
            <code>Demo1234!</code>
          </p>
        </div>
      </section>
    </div>
  );
}
