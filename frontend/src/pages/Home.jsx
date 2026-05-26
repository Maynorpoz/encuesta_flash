import React from 'react';

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
        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
          {user ? (
            <button className="btn btn-primary" onClick={() => navigate('#/dashboard')}>
              Ir a mi Panel 📊
            </button>
          ) : (
            <>
              <button className="btn btn-primary" onClick={() => navigate('#/register')}>
                Comenzar Gratis 🚀
              </button>
              <button className="btn btn-secondary" onClick={() => navigate('#/login')}>
                Iniciar Sesión 🔑
              </button>
            </>
          )}
        </div>
      </div>

      <div className="glass-card" style={{ maxWidth: '850px', margin: '0 auto 3rem' }}>
        <h2 className="hero-title" style={{ fontSize: '2rem', textAlign: 'center', marginBottom: '1.5rem' }}>
          ¿Por qué Serverless es ideal aquí?
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.5rem' }}>
          <div style={{ padding: '1rem', background: 'rgba(255,255,255,0.01)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.03)' }}>
            <h3 style={{ fontFamily: 'var(--font-title)', color: 'var(--accent)', marginBottom: '0.5rem' }}>⚡ Escalabilidad Infinita</h3>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
              ¿Tu encuesta se volvió viral? El sistema escala de forma automática para soportar miles de votos por segundo sin inmutarse.
            </p>
          </div>
          <div style={{ padding: '1rem', background: 'rgba(255,255,255,0.01)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.03)' }}>
            <h3 style={{ fontFamily: 'var(--font-title)', color: 'var(--primary)', marginBottom: '0.5rem' }}>💸 Costo Eficiente</h3>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
              Al usar funciones independientes en la nube, solo pagas cuando un usuario vota o crea una encuesta. $0 costo cuando está inactivo.
            </p>
          </div>
          <div style={{ padding: '1rem', background: 'rgba(255,255,255,0.01)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.03)' }}>
            <h3 style={{ fontFamily: 'var(--font-title)', color: '#22c55e', marginBottom: '0.5rem' }}>🕒 Tiempo Real Nativo</h3>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
              Los votos activan disparadores serverless que empujan las actualizaciones a todos los navegadores conectados vía WebSockets.
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
