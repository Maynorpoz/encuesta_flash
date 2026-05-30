import React, { useEffect, useState } from 'react';
import { api } from '../utils/api.js';
import { Vote, LayoutDashboard, Check } from 'lucide-react';

export default function Results({ navigate, pollId }) {
  const [resultsData, setResultsData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [wsConnected, setWsConnected] = useState(false);
  const [justVoted, setJustVoted] = useState(false);

  useEffect(() => {
    if (!pollId) {
      setError('Falta el ID de la encuesta.');
      setLoading(false);
      return;
    }

    // 1. Obtener resultados iniciales mediante REST API (Fallback / Carga inicial rápida)
    const fetchInitialResults = async () => {
      try {
        const data = await api.getResults(pollId);
        setResultsData(data);
        setLoading(false);
      } catch (err) {
        console.error('Error cargando resultados REST:', err);
        setError('No se pudieron obtener los resultados.');
        setLoading(false);
      }
    };

    fetchInitialResults();

    // 2. Conectar al canal WebSocket en tiempo real
    const socket = api.connectWebSocket(pollId, (message) => {
      if (message.type === 'results_update') {
        console.log('[WS UPDATE RECEIVED]', message.data);
        
        // Destacar cambio visual brevemente si cambian los votos totales
        setResultsData((prev) => {
          if (prev && prev.totalVotes !== message.data.totalVotes) {
            setJustVoted(true);
            setTimeout(() => setJustVoted(false), 800);
          }
          return message.data;
        });
        setWsConnected(true);
      }
    });

    // Eventos locales para rastrear conectividad en la interfaz
    socket.addEventListener('open', () => setWsConnected(true));
    socket.addEventListener('close', () => setWsConnected(false));
    socket.addEventListener('error', () => setWsConnected(false));

    // Cleanup al desmontar
    return () => {
      if (socket && socket.readyState === WebSocket.OPEN) {
        socket.close();
      }
    };
  }, [pollId]);

  const [copied, setCopied] = useState(false);
  const shareLink = `${window.location.origin}${window.location.pathname}#/poll/${pollId}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return (
      <div className="spinner-container">
        <div className="spinner"></div>
      </div>
    );
  }

  if (error && !resultsData) {
    return (
      <div className="results-container">
        <div className="glass-card" style={{ textAlign: 'center' }}>
          <span style={{ fontSize: '3rem' }}>⚠️</span>
          <h2 className="hero-title" style={{ fontSize: '1.75rem', marginTop: '1rem', marginBottom: '1rem' }}>
            Error al Cargar Resultados
          </h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>{error}</p>
          <button className="btn btn-primary" onClick={() => navigate('#/')}>
            Volver al Inicio
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="results-container">
      <div className="glass-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
          {wsConnected ? (
            <div className="results-badge-live">
              En Vivo
            </div>
          ) : (
            <div className="results-badge-live" style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
              Sin Conexión (Modo REST)
            </div>
          )}
          <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
            Votos totales: <strong style={{ color: 'var(--text-primary)', transition: 'color var(--transition-fast)' }} className={justVoted ? 'result-percentage' : ''}>{resultsData?.totalVotes}</strong>
          </span>
        </div>

        <h1 className="hero-title" style={{ fontSize: '2rem', marginBottom: '0.5rem', textAlign: 'left' }}>
          Resultados: {resultsData?.title}
        </h1>
        {resultsData?.description && (
          <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem', fontSize: '0.95rem' }}>
            {resultsData.description}
          </p>
        )}

        {/* Gráfico de barras premium */}
        <div className="results-list">
          {resultsData?.results.map((opt) => (
            <div className="result-item" key={opt.optionId}>
              <div className="result-info">
                <span className="result-text">{opt.text}</span>
                <span className="result-votes">
                  {opt.votes} {opt.votes === 1 ? 'voto' : 'votos'} ({opt.percentage}%)
                </span>
              </div>
              <div className="bar-track">
                <div 
                  className="bar-fill"
                  style={{ width: `${opt.percentage}%` }}
                ></div>
              </div>
            </div>
          ))}
        </div>

        {/* Sección para compartir */}
        <div style={{ margin: '2rem 0 1.5rem', borderTop: '1px solid rgba(255, 255, 255, 0.05)', paddingTop: '1.5rem' }}>
          <label className="form-label">Comparte esta encuesta para conseguir más votos:</label>
          <div className="share-section">
            <span className="share-url">{shareLink}</span>
            <button className="btn btn-primary btn-sm" onClick={handleCopyLink}>
              {copied ? (
                <>
                  <Check size={16} style={{ marginRight: '0.3rem' }} />
                  ¡Copiado!
                </>
              ) : (
                'Copiar Enlace'
              )}
            </button>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem', flexWrap: 'wrap' }}>
          <button className="btn btn-secondary" style={{ flex: 1 }} onClick={() => navigate(`#/poll/${pollId}`)}>
            <Vote size={18} style={{ marginRight: '0.5rem' }} />
            Volver a Votar
          </button>
          <button className="btn btn-secondary" style={{ flex: 1 }} onClick={() => navigate('#/dashboard')}>
            <LayoutDashboard size={18} style={{ marginRight: '0.5rem' }} />
            Ir a mi Panel
          </button>
        </div>
      </div>
    </div>
  );
}
