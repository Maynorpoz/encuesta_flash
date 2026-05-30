import React, { useState } from 'react';
import { api } from '../utils/api.js';
import { Vote, BarChart3, PlusCircle, Check, Rocket } from 'lucide-react';

export default function CreatePoll({ navigate, user }) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [options, setOptions] = useState(['', '']); // Inicia con 2 opciones vacías
  const [settings, setSettings] = useState({
    anonymous: true,
    multipleChoice: false
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [createdPoll, setCreatedPoll] = useState(null);

  // Redirigir a login si no está autenticado
  React.useEffect(() => {
    if (!user) {
      navigate('#/login');
    }
  }, [user, navigate]);

  const handleOptionChange = (index, value) => {
    const updated = [...options];
    updated[index] = value;
    setOptions(updated);
  };

  const addOptionField = () => {
    if (options.length >= 10) return;
    setOptions([...options, '']);
  };

  const removeOptionField = (index) => {
    if (options.length <= 2) return;
    const updated = options.filter((_, i) => i !== index);
    setOptions(updated);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Validaciones locales
    if (!title.trim()) {
      setError('El título de la encuesta es obligatorio.');
      return;
    }

    const filteredOptions = options.map(opt => opt.trim()).filter(Boolean);
    if (filteredOptions.length < 2) {
      setError('Debes ingresar al menos 2 opciones válidas.');
      return;
    }

    setLoading(true);
    try {
      const data = await api.createPoll({
        title,
        description,
        options: filteredOptions,
        settings
      });
      setCreatedPoll(data.poll);
    } catch (err) {
      setError(err.message || 'Error al guardar la encuesta');
    } finally {
      setLoading(false);
    }
  };

  // Enlaces de compartir una vez creada la encuesta
  const getShareUrl = (path) => {
    return `${window.location.origin}${window.location.pathname}${path}`;
  };

  const [copiedType, setCopiedType] = useState(''); // 'vote' o 'results'

  const handleCopyLink = (text, type) => {
    navigator.clipboard.writeText(text);
    setCopiedType(type);
    setTimeout(() => setCopiedType(''), 2000);
  };

  if (createdPoll) {
    const voteLink = getShareUrl(`#/poll/${createdPoll.id}`);
    const resultsLink = getShareUrl(`#/poll/${createdPoll.id}/results`);

    return (
      <div className="vote-container">
        <div className="glass-card" style={{ textAlign: 'center' }}>
          <div className="results-badge-live" style={{ background: 'rgba(34, 197, 94, 0.1)', color: '#4ade80', border: '1px solid rgba(34, 197, 94, 0.2)', marginBottom: '1rem' }}>
            ¡Encuesta Creada Exitosamente! 🎉
          </div>
          <h2 className="hero-title" style={{ fontSize: '1.75rem', marginBottom: '1.5rem' }}>
            {createdPoll.title}
          </h2>

          <div style={{ textAlign: 'left', marginBottom: '2rem' }}>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '1rem', fontSize: '0.95rem' }}>
              Usa los siguientes enlaces para compartir con tus usuarios o monitorear los resultados:
            </p>

            {/* Enlace para votar */}
            <div style={{ marginBottom: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', marginBottom: '0.5rem' }}>
                <Vote size={18} style={{ marginRight: '0.5rem', color: 'var(--primary)' }} />
                <label className="form-label" style={{ fontWeight: '600', margin: 0 }}>Enlace para Votar</label>
              </div>
              <div className="share-section">
                <span className="share-url">{voteLink}</span>
                <button 
                  className="btn btn-primary btn-sm" 
                  onClick={() => handleCopyLink(voteLink, 'vote')}
                >
                  {copiedType === 'vote' ? '¡Copiado! ✓' : 'Copiar'}
                </button>
              </div>
            </div>

            {/* Enlace para resultados */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', marginBottom: '0.5rem' }}>
                <BarChart3 size={18} style={{ marginRight: '0.5rem', color: 'var(--accent)' }} />
                <label className="form-label" style={{ fontWeight: '600', margin: 0 }}>Enlace de Resultados en Vivo</label>
              </div>
              <div className="share-section">
                <span className="share-url">{resultsLink}</span>
                <button 
                  className="btn btn-secondary btn-sm" 
                  onClick={() => handleCopyLink(resultsLink, 'results')}
                >
                  {copiedType === 'results' ? '¡Copiado! ✓' : 'Copiar'}
                </button>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
            <button className="btn btn-secondary" onClick={() => navigate('#/dashboard')}>
              Ir al Dashboard
            </button>
            <button className="btn btn-primary" onClick={() => navigate(`#/poll/${createdPoll.id}/results`)}>
              Ver Resultados 📈
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="vote-container">
      <div className="glass-card">
        <h2 className="hero-title" style={{ fontSize: '2rem', textAlign: 'left', marginBottom: '0.5rem' }}>
          Crear Encuesta
        </h2>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
          Configura tu pregunta, opciones de respuesta y reglas de participación.
        </p>

        {error && (
          <div className="alert alert-danger">
            <span>⚠️</span> {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* Título */}
          <div className="form-group">
            <label className="form-label" htmlFor="poll-title">Pregunta / Título</label>
            <input
              type="text"
              id="poll-title"
              className="form-control"
              placeholder="¿Qué quieres preguntar?"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              disabled={loading}
            />
          </div>

          {/* Descripción */}
          <div className="form-group">
            <label className="form-label" htmlFor="poll-desc">Descripción (Opcional)</label>
            <textarea
              id="poll-desc"
              className="form-control"
              placeholder="Detalles adicionales para los votantes..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={loading}
              rows="2"
              style={{ resize: 'none' }}
            />
          </div>

          {/* Opciones */}
          <div className="form-group">
            <label className="form-label">Opciones de Respuesta</label>
            {options.map((option, index) => (
              <div className="option-input-row" key={index}>
                <input
                  type="text"
                  className="form-control"
                  placeholder={`Opción ${index + 1}`}
                  value={option}
                  onChange={(e) => handleOptionChange(index, e.target.value)}
                  disabled={loading}
                />
                {options.length > 2 && (
                  <button
                    type="button"
                    className="option-remove-btn"
                    onClick={() => removeOptionField(index)}
                    disabled={loading}
                    title="Eliminar opción"
                  >
                    🗑️
                  </button>
                )}
              </div>
            ))}

            {options.length < 10 && (
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                style={{ marginTop: '0.5rem', width: '100%' }}
                onClick={addOptionField}
                disabled={loading}
              >
                <PlusCircle size={16} style={{ marginRight: '0.4rem' }} />
                Agregar Opción
              </button>
            )}
          </div>

          {/* Configuración */}
          <div className="form-group" style={{ background: 'rgba(255, 255, 255, 0.02)', padding: '1rem', borderRadius: '12px', border: '1px solid rgba(255, 255, 255, 0.05)', marginTop: '1.5rem' }}>
            <label className="form-label" style={{ marginBottom: '0.75rem', fontWeight: '600' }}>Configuración de Encuesta</label>
            
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.9rem', color: 'var(--text-secondary)', cursor: 'pointer', marginBottom: '0.5rem' }}>
              <input
                type="checkbox"
                checked={settings.multipleChoice}
                onChange={(e) => setSettings({ ...settings, multipleChoice: e.target.checked })}
                disabled={loading}
                style={{ width: '16px', height: '16px', accentColor: 'var(--primary)' }}
              />
              Permitir que los votantes registren más de un voto
            </label>

            <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.9rem', color: 'var(--text-secondary)', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={settings.anonymous}
                onChange={(e) => setSettings({ ...settings, anonymous: e.target.checked })}
                disabled={true} // Forzada anónima para simplicidad de demo
                style={{ width: '16px', height: '16px', accentColor: 'var(--primary)' }}
              />
              Votación abierta y anónima (por IP/Dispositivo)
            </label>
          </div>

          {/* Submit */}
          <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
            <button
              type="button"
              className="btn btn-secondary"
              style={{ flex: 1 }}
              onClick={() => navigate('#/dashboard')}
              disabled={loading}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              style={{ flex: 2 }}
              disabled={loading}
            >
              {loading ? 'Publicando...' : (
                <>
                  <Rocket size={18} style={{ marginRight: '0.5rem' }} />
                  Crear Encuesta Serverless
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
