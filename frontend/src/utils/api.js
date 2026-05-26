const API_BASE = 'http://localhost:5000/api';
const WS_BASE = 'ws://localhost:5000/ws';

export const api = {
  // Guardar token en localStorage
  setToken(token) {
    if (token) {
      localStorage.setItem('votify_token', token);
    } else {
      localStorage.removeItem('votify_token');
    }
  },

  getToken() {
    return localStorage.getItem('votify_token');
  },

  setUser(user) {
    if (user) {
      localStorage.setItem('votify_user', JSON.stringify(user));
    } else {
      localStorage.removeItem('votify_user');
    }
  },

  getUser() {
    const user = localStorage.getItem('votify_user');
    return user ? JSON.parse(user) : null;
  },

  logout() {
    this.setToken(null);
    this.setUser(null);
  },

  // Realizar peticiones HTTP
  async request(endpoint, options = {}) {
    const token = this.getToken();
    const headers = {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` }),
      ...options.headers
    };

    const response = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || 'Algo salió mal');
    }

    return data;
  },

  // Auth endpoints
  async login(username, password) {
    const data = await this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password })
    });
    this.setToken(data.token);
    this.setUser(data.user);
    return data;
  },

  async register(username, password) {
    const data = await this.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ username, password })
    });
    this.setToken(data.token);
    this.setUser(data.user);
    return data;
  },

  // Polls endpoints
  async createPoll(pollData) {
    return this.request('/polls', {
      method: 'POST',
      body: JSON.stringify(pollData)
    });
  },

  async getUserPolls() {
    return this.request('/polls/me');
  },

  async getPoll(pollId) {
    return this.request(`/polls/${pollId}`);
  },

  async vote(pollId, optionId, voterId) {
    return this.request('/polls/vote', {
      method: 'POST',
      body: JSON.stringify({ pollId, optionId, voterId })
    });
  },

  async getResults(pollId) {
    return this.request(`/polls/${pollId}/results`);
  },

  // Conectar con el canal WebSocket en tiempo real
  connectWebSocket(pollId, onMessage) {
    const socket = new WebSocket(WS_BASE);

    socket.onopen = () => {
      console.log(`[WS CONNECTED] Suscribiendo a encuesta: ${pollId}`);
      socket.send(JSON.stringify({
        type: 'subscribe',
        pollId
      }));
    };

    socket.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        onMessage(message);
      } catch (err) {
        console.error('Error parseando mensaje WS:', err);
      }
    };

    socket.onclose = () => {
      console.log('[WS DISCONNECTED]');
    };

    socket.onerror = (error) => {
      console.error('[WS ERROR]:', error);
    };

    return socket; // Retornar para poder cerrarlo en cleanup
  },

  // Obtener o generar un ID de votante persistente en el navegador del cliente
  getVoterId() {
    let voterId = localStorage.getItem('votify_voter_id');
    if (!voterId) {
      voterId = `voter_${Math.random().toString(36).substring(2, 15)}`;
      localStorage.setItem('votify_voter_id', voterId);
    }
    return voterId;
  }
};
