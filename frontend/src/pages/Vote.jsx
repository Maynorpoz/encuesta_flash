import React, { useEffect, useState } from 'react';
import { api } from '../utils/api.js';
import { Vote as VoteIcon, AlertCircle, CheckCircle2 } from 'lucide-react';

export default function Vote({ navigate, pollId }) {
  const [poll, setPoll] = useState(null);
  const [selectedOption, setSelectedOption] = useState('');
  const [loading, setLoading] = useState(true);
  const [voting, setVoting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!pollId) {
      setError('Falta el ID de la encuesta.');
      setLoading(false);
      return;
    }

    const fetchPoll = async () => {
      try {
        const data = await api.getPoll(pollId);
        setPoll(data);
      } catch (err) {
        setError(err.message || 'La encuesta no existe o no se pudo cargar.');
      } finally {
        setLoading(false);
      }
    };

    fetchPoll();
  }, [pollId]);

  const handleVoteSubmit = async (e) => {
    e.preventDefault();
    if (!selectedOption) {
      setError('Por favor selecciona una opción para votar.');
      return;
    }

    setError('');
    setVoting(true);
    try {
      const voterId = api.getVoterId();
      await api.vote(pollId, selectedOption, voterId);
      setSuccess(true);
      
      // Esperar un momento y redirigir a los resultados en tiempo real
      setTimeout(() => {
        navigate(`#/poll/${pollId}/results`);
      }, 1500);
    } catch (err) {
      setError(err.message || 'Error al registrar tu voto.');
    } finally {
      setVoting(false);
    }
  };

  if (loading) {
    return (
      <div className="spinner-container">
        <div className="spinner"></div>
      </div>
    );
  }

  if (error && !poll) {
    return (
      <div className="vote-container">
        <div className="glass-card" style={{ textAlign: 'center' }}>
          <AlertCircle size={64} style={{ color: 'var(--error)', margin: '0 auto 1rem' }} />
          <h2 className="hero-title" style={{ fontSize: '1.75rem', marginBottom: '1rem' }}>
            Error al Cargar Encuesta
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
    <div className="vote-container">
      {success ? (
        <div className="glass-card" style={{ textAlign: 'center', padding: '3rem' }}>
          <span style={{ fontSize: '4rem', display: 'block', marginBottom: '1rem', animation: 'pulse 1.5s infinite' }}>🎉</span>
          <h2 className="hero-title" style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>
            ¡Voto Registrado!
          </h2>
          <p style={{ color: 'var(--text-secondary)' }}>
            Redirigiéndote a los resultados en tiempo real...
          </p>
        </div>
      ) : (
        <div className="glass-card">
          <div className="results-badge-live" style={{ background: 'rgba(99, 102, 241, 0.1)', color: '#a5b4fc', border: '1px solid rgba(99, 102, 241, 0.2)', marginBottom: '1rem' }}>
            <VoteIcon size={16} style={{ marginRight: '0.5rem' }} />
            Votación Pública Activa
          </div>
          
          <h1 className="hero-title" style={{ fontSize: '2rem', marginBottom: '0.5rem', textAlign: 'left' }}>
            {poll?.title}
          </h1>
          {poll?.description && (
            <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem', fontSize: '0.95rem' }}>
              {poll.description}
            </p>
          )}

          {error && (
            <div className="alert alert-danger">
              <AlertCircle size={16} style={{ marginRight: '0.5rem' }} />
              {error}
            </div>
          )}

          <form onSubmit={handleVoteSubmit}>
            <div className="options-list">
              {poll?.options.map((option) => (
                <div 
                  key={option.id}
                  className={`vote-option-label ${selectedOption === option.id ? 'selected' : ''}`}
                  onClick={() => setSelectedOption(option.id)}
                >
                  <div className="custom-radio"></div>
                  <span className="vote-option-text">{option.text}</span>
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
              <button
                type="button"
                className="btn btn-secondary"
                style={{ flex: 1 }}
                onClick={() => navigate(`#/poll/${pollId}/results`)}
                disabled={voting}
              >
                Ver Resultados
              </button>
              <button
                type="submit"
                className="btn btn-primary"
                style={{ flex: 2 }}
                disabled={voting || !selectedOption}
              >
                {voting ? 'Registrando...' : (
                  <>
                    <VoteIcon size={18} style={{ marginRight: '0.5rem' }} />
                    Emitir Voto
                  </>
                )}
              </button>
            </div>
          </form>

          <p style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginTop: '1.5rem', textAlign: 'center' }}>
            Esta encuesta es anónima. Solo se permite un voto por dispositivo/navegador.
          </p>
        </div>
      )}
    </div>
  );
}
