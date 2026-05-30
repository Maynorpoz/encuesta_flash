import React, { useState } from 'react';
import { api } from '../utils/api.js';
import { UserPlus } from 'lucide-react';

export default function Register({ navigate, onAuthSuccess }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!username || !password || !confirmPassword) {
      setError('Por favor completa todos los campos.');
      return;
    }

    if (password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Las contraseñas no coinciden.');
      return;
    }

    setError('');
    setLoading(true);
    try {
      const data = await api.register(username, password);
      onAuthSuccess(data.user);
      navigate('#/dashboard');
    } catch (err) {
      setError(err.message || 'Error al crear la cuenta. Inténtalo de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="glass-card">
        <h2 className="hero-title" style={{ fontSize: '2rem', textAlign: 'center', marginBottom: '0.5rem' }}>
          Crear Cuenta
        </h2>
        <p style={{ textAlign: 'center', color: 'var(--text-secondary)', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
          Regístrate para publicar encuestas y ver analíticas.
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
              placeholder="Mínimo 3 caracteres"
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
              placeholder="Mínimo 6 caracteres"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
              autoComplete="new-password"
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="confirmPassword">Confirmar Contraseña</label>
            <input
              type="password"
              id="confirmPassword"
              className="form-control"
              placeholder="Repite tu contraseña"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              disabled={loading}
              autoComplete="new-password"
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: '100%', marginTop: '0.5rem' }}
            disabled={loading}
          >
            {loading ? 'Creando cuenta...' : (
              <>
                <UserPlus size={18} style={{ marginRight: '0.5rem' }} />
                Registrar Cuenta
              </>
            )}
          </button>
        </form>

        <div className="auth-footer">
          ¿Ya tienes una cuenta? 
          <a href="#/login" className="auth-link" onClick={(e) => { e.preventDefault(); navigate('#/login'); }}>
            Inicia sesión aquí
          </a>
        </div>
      </div>
    </div>
  );
}
