import React, { useEffect, useState } from 'react';
import { api } from '../utils/api.js';

export default function Dashboard({ navigate, user }) {
  const [polls, setPolls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!user) {
      navigate('#/login');
      return;
    }

    const fetchPolls = async () => {
      try {
        const data = await api.getUserPolls();
        setPolls(data);
      } catch (err) {
        setError(err.message || 'Error al cargar las encuestas');
      } finally {
        setLoading(false);
      }
    };

    fetchPolls();
  }, [user, navigate]);

  // Totales para estadísticas
  const totalPolls = polls.length;
  const totalVotes = polls.reduce((sum, poll) => sum + (poll.totalVotes || 0), 0);

  if (loading) {
    return (
      <div className="spinner-container">
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <div>
          <h1 className="hero-title" style={{ fontSize: '2.25rem', marginBottom: '0.25rem', textAlign: 'left' }}>
            Panel de Control
          </h1>
          <p style={{ color: 'var(--text-secondary)' }}>
            Hola, <strong style={{ color: 'var(--text-primary)' }}>{user?.username}</strong>. Gestiona tus encuestas activas.
          </p>
        </div>
        <button className="btn btn-primary" onClick={() => navigate('#/create')}>
          Nueva Encuesta ➕
        </button>
      </div>

      {error && (
        <div className="alert alert-danger">
          <span>⚠️</span> {error}
        </div>
      )}

      {/* Tarjetas de Estadísticas Rápidas */}
      <div className="dashboard-stats">
        <div className="glass-card stat-card">
          <div className="stat-val">{totalPolls}</div>
          <div className="stat-label">Encuestas Creadas</div>
        </div>
        <div className="glass-card stat-card">
          <div className="stat-val">{totalVotes}</div>
          <div className="stat-label">Votos Totales Recibidos</div>
        </div>
        <div className="glass-card stat-card">
          <div className="stat-val" style={{ color: 'var(--accent)' }}>
            {totalPolls > 0 ? (totalVotes / totalPolls).toFixed(1) : '0.0'}
          </div>
          <div className="stat-label">Promedio de Votos</div>
        </div>
      </div>

      {/* Lista de Encuestas */}
      <h2 className="hero-title" style={{ fontSize: '1.5rem', marginBottom: '1.25rem', textAlign: 'left' }}>
        Tus Encuestas
      </h2>

      {polls.length === 0 ? (
        <div className="glass-card" style={{ textPosition: 'center', padding: '3rem', textAlign: 'center' }}>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
            No has creado ninguna encuesta todavía. ¡Comienza creando tu primera encuesta!
          </p>
          <button className="btn btn-primary" onClick={() => navigate('#/create')}>
            Crear Encuesta Ahora 🚀
          </button>
        </div>
      ) : (
        <div className="polls-grid">
          {polls.map((poll) => (
            <div className="glass-card poll-card" key={poll.id}>
              <div className="poll-card-header">
                <h3 className="poll-title">{poll.title}</h3>
                <p className="poll-description">{poll.description || 'Sin descripción.'}</p>
              </div>

              <div>
                <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.75rem' }}>
                  <button 
                    className="btn btn-secondary btn-sm" 
                    style={{ flex: 1 }}
                    onClick={() => navigate(`#/poll/${poll.id}`)}
                  >
                    Votar 🗳️
                  </button>
                  <button 
                    className="btn btn-primary btn-sm" 
                    style={{ flex: 1 }}
                    onClick={() => navigate(`#/poll/${poll.id}/results`)}
                  >
                    Ver Resultados 📈
                  </button>
                </div>

                <div className="poll-meta">
                  <span>{new Date(poll.createdAt).toLocaleDateString()}</span>
                  <span className="poll-badge">{poll.totalVotes} votos</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
