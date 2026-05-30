import React, { useState } from 'react';
import { api } from '../utils/api.js';
import { LogIn } from 'lucide-react';

export default function Login({ navigate, onAuthSuccess }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!username || !password) {
      setError('Por favor completa todos los campos.');
      return;
    }

    setError('');
    setLoading(true);
    try {
      const data = await api.login(username, password);
      onAuthSuccess(data.user);
      navigate('#/dashboard');
    } catch (err) {
      setError(err.message || 'Error al iniciar sesión. Inténtalo de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="glass-card">
        <h2 className="hero-title" style={{ fontSize: '2rem', textAlign: 'center', marginBottom: '0.5rem' }}>
          Iniciar Sesión
        </h2>
        <p style={{ textAlign: 'center', color: 'var(--text-secondary)', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
          Accede a tu cuenta para crear y gestionar encuestas.
        </p>

        {error && (
          <div className="alert alert-danger">
            <span>⚠️</span> {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label" htmlFor="username">Nombre de Usuario</label>
            <input
              type="text"
              id="username"
              className="form-control"
              placeholder="ej. JuanPerez"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              disabled={loading}
              autoComplete="username"
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="password">Contraseña</label>
            <input
              type="password"
              id="password"
              className="form-control"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
              autoComplete="current-password"
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: '100%', marginTop: '0.5rem' }}
            disabled={loading}
          >
            {loading ? 'Ingresando...' : (
              <>
                <LogIn size={18} style={{ marginRight: '0.5rem' }} />
                Iniciar Sesión
              </>
            )}
          </button>
        </form>

        <div className="auth-footer">
          ¿No tienes una cuenta? 
          <a href="#/register" className="auth-link" onClick={(e) => { e.preventDefault(); navigate('#/register'); }}>
            Regístrate aquí
          </a>
        </div>
      </div>
    </div>
  );
}
