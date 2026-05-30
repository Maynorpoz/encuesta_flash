import React, { useState, useEffect } from 'react';
import { api } from './utils/api.js';
import Home from './pages/Home.jsx';
import Login from './pages/Login.jsx';
import Register from './pages/Register.jsx';
import Dashboard from './pages/Dashboard.jsx';
import CreatePoll from './pages/CreatePoll.jsx';
import Vote from './pages/Vote.jsx';
import Results from './pages/Results.jsx';
import { BarChart3, LogOut } from 'lucide-react';

export default function App() {
  const [user, setUser] = useState(api.getUser());
  const [currentHash, setCurrentHash] = useState(window.location.hash || '#/');
  const [route, setRoute] = useState({ page: 'home' });

  // Escuchar cambios de hash (Enrutador local nativo sin dependencias pesadas)
  useEffect(() => {
    const handleHashChange = () => {
      setCurrentHash(window.location.hash || '#/');
    };

    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  // Parsear el hash para obtener la página y parámetros
  useEffect(() => {
    const hash = currentHash;
    if (!hash || hash === '#' || hash === '#/') {
      setRoute({ page: 'home' });
      return;
    }
    if (hash === '#/login') {
      setRoute({ page: 'login' });
      return;
    }
    if (hash === '#/register') {
      setRoute({ page: 'register' });
      return;
    }
    if (hash === '#/dashboard') {
      setRoute({ page: 'dashboard' });
      return;
    }
    if (hash === '#/create') {
      setRoute({ page: 'create' });
      return;
    }

    // Rutas dinámicas de encuestas
    if (hash.startsWith('#/poll/')) {
      const parts = hash.split('/');
      // hash de la forma: #/poll/:pollId
      // o: #/poll/:pollId/results
      const pollId = parts[2];
      const isResults = parts[3] === 'results';

      if (pollId) {
        setRoute({
          page: isResults ? 'results' : 'vote',
          pollId
        });
        return;
      }
    }

    // Ruta por defecto si no coincide
    setRoute({ page: 'home' });
  }, [currentHash]);

  const navigate = (hashPath) => {
    window.location.hash = hashPath;
  };

  const handleAuthSuccess = (userData) => {
    setUser(userData);
  };

  const handleLogout = () => {
    api.logout();
    setUser(null);
    navigate('#/');
  };

  // Renderizar la página activa según el enrutador
  const renderPage = () => {
    switch (route.page) {
      case 'home':
        return <Home navigate={navigate} user={user} />;
      case 'login':
        return <Login navigate={navigate} onAuthSuccess={handleAuthSuccess} />;
      case 'register':
        return <Register navigate={navigate} onAuthSuccess={handleAuthSuccess} />;
      case 'dashboard':
        return <Dashboard navigate={navigate} user={user} />;
      case 'create':
        return <CreatePoll navigate={navigate} user={user} />;
      case 'vote':
        return <Vote navigate={navigate} pollId={route.pollId} />;
      case 'results':
        return <Results navigate={navigate} pollId={route.pollId} />;
      default:
        return <Home navigate={navigate} user={user} />;
    }
  };

  return (
    <div className="app-container">
      {/* Navegación Principal */}
      <header className="navbar">
        <a href="#/" className="logo" onClick={(e) => { e.preventDefault(); navigate(user ? '#/dashboard' : '#/'); }}>
          <BarChart3 size={24} style={{ marginRight: '0.5rem' }} />
          Votify
        </a>
        <nav className="nav-links">
          {user ? (
            <div className="nav-user">
              <span className="username-tag">{user.username}</span>
              <button className="btn btn-secondary btn-sm" onClick={handleLogout}>
                <LogOut size={16} style={{ marginRight: '0.4rem' }} />
                Cerrar Sesión
              </button>
            </div>
          ) : (
            <>
              {route.page !== 'login' && (
                <button className="btn btn-secondary btn-sm" onClick={() => navigate('#/login')}>
                  Iniciar Sesión
                </button>
              )}
              {route.page !== 'register' && (
                <button className="btn btn-primary btn-sm" onClick={() => navigate('#/register')}>
                  Registrarse
                </button>
              )}
            </>
          )}
        </nav>
      </header>

      {/* Área de Contenido Principal */}
      <main className="main-content">
        {renderPage()}
      </main>

      {/* Pie de Página */}
      <footer className="footer">
        <p>&copy; {new Date().getFullYear()} Votify - Encuestas Online Serverless en Tiempo Real.</p>
        <p style={{ marginTop: '0.25rem', fontSize: '0.75rem', opacity: 0.6 }}>
          Arquitectura de Software • AWS Lambda & DynamoDB Simulator
        </p>
      </footer>
    </div>
  );
}
