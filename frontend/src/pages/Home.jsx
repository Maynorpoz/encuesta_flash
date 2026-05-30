import React from 'react';
import { LayoutDashboard, UserPlus, LogIn, PlusCircle, Share2, BarChart3 } from 'lucide-react';

export default function Home({ navigate, user }) {
  return (
    <div className="home-container">
      <div className="hero-section">
        <div className="results-badge-live" style={{ marginBottom: '1.5rem' }}>
          Sistema de Encuestas Online en Tiempo Real
        </div>
        <h1 className="hero-title">Votify</h1>
        <p className="hero-subtitle">
          Crea encuestas al instante, comparte con un enlace y observa los resultados cambiar en tiempo real con tecnología Serverless.
        </p>
        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
          {user ? (
            <button className="btn btn-primary" onClick={() => navigate('#/dashboard')}>
              <LayoutDashboard size={18} style={{ marginRight: '0.5rem' }} />
              Ir a mi Panel
            </button>
          ) : (
            <>
              <button className="btn btn-primary" onClick={() => navigate('#/register')}>
                <UserPlus size={18} style={{ marginRight: '0.5rem' }} />
                Comenzar Gratis
              </button>
              <button className="btn btn-secondary" onClick={() => navigate('#/login')}>
                <LogIn size={18} style={{ marginRight: '0.5rem' }} />
                Iniciar Sesión
              </button>
            </>
          )}
        </div>
      </div>

      <div className="glass-card" style={{ maxWidth: '850px', margin: '0 auto 3rem' }}>
        <h2 className="hero-title" style={{ fontSize: '2rem', textAlign: 'center', marginBottom: '1.5rem' }}>
          ¿Cómo funciona Votify?
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.5rem' }}>
          <div style={{ padding: '1rem', background: 'rgba(255,255,255,0.01)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.03)' }}>
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '0.5rem' }}>
              <PlusCircle size={20} style={{ color: 'var(--accent)', marginRight: '0.5rem' }} />
              <h3 style={{ fontFamily: 'var(--font-title)', color: 'var(--accent)', margin: 0 }}>Crea tu encuesta</h3>
            </div>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
              Define tu pregunta y hasta 10 opciones de respuesta. El sistema genera un enlace único listo para compartir en segundos.
            </p>
          </div>
          <div style={{ padding: '1rem', background: 'rgba(255,255,255,0.01)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.03)' }}>
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '0.5rem' }}>
              <Share2 size={20} style={{ color: 'var(--primary)', marginRight: '0.5rem' }} />
              <h3 style={{ fontFamily: 'var(--font-title)', color: 'var(--primary)', margin: 0 }}>Comparte y recolecta votos</h3>
            </div>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
              Copia el enlace y compártelo por redes sociales, email o WhatsApp. Los usuarios votan sin necesidad de crear cuenta.
            </p>
          </div>
          <div style={{ padding: '1rem', background: 'rgba(255,255,255,0.01)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.03)' }}>
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '0.5rem' }}>
              <BarChart3 size={20} style={{ color: '#22c55e', marginRight: '0.5rem' }} />
              <h3 style={{ fontFamily: 'var(--font-title)', color: '#22c55e', margin: 0 }}>Resultados en vivo</h3>
            </div>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
              Observa las gráficas actualizarse automáticamente cada vez que alguien vota. Tecnología WebSocket para actualizaciones instantáneas.
            </p>
          </div>
        </div>
      </div>

      <div style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
        <p>Desarrollado para el proyecto final de Arquitectura de Software • Grupo Serverless</p>
      </div>
    </div>
  );
}
