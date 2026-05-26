import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_DIR = path.join(__dirname, '../../data');
const DATA_FILE = path.join(DATA_DIR, 'database.json');

// Inicializar la base de datos vacía si no existe
const defaultData = {
  users: [],
  polls: [],
  votes: []
};

class Database {
  constructor() {
    this.init();
  }

  init() {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (!fs.existsSync(DATA_FILE)) {
      fs.writeFileSync(DATA_FILE, JSON.stringify(defaultData, null, 2), 'utf-8');
    }
  }

  read() {
    try {
      const data = fs.readFileSync(DATA_FILE, 'utf-8');
      return JSON.parse(data);
    } catch (error) {
      console.error('Error leyendo base de datos, usando datos por defecto:', error);
      return defaultData;
    }
  }

  write(data) {
    try {
      fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf-8');
    } catch (error) {
      console.error('Error escribiendo en la base de datos:', error);
    }
  }

  // Colección de Usuarios
  createUser(user) {
    const data = this.read();
    const newUser = {
      id: Math.random().toString(36).substring(2, 9),
      createdAt: new Date().toISOString(),
      ...user
    };
    data.users.push(newUser);
    this.write(data);
    return newUser;
  }

  findUserByUsername(username) {
    const data = this.read();
    return data.users.find(u => u.username.toLowerCase() === username.toLowerCase());
  }

  findUserById(id) {
    const data = this.read();
    return data.users.find(u => u.id === id);
  }

  // Colección de Encuestas
  createPoll(poll) {
    const data = this.read();
    const newPoll = {
      id: Math.random().toString(36).substring(2, 9),
      createdAt: new Date().toISOString(),
      ...poll
    };
    data.polls.push(newPoll);
    this.write(data);
    return newPoll;
  }

  getPolls() {
    const data = this.read();
    return data.polls;
  }

  getPollById(id) {
    const data = this.read();
    return data.polls.find(p => p.id === id);
  }

  getPollsByCreator(creatorId) {
    const data = this.read();
    return data.polls.filter(p => p.creatorId === creatorId);
  }

  // Colección de Votos
  addVote(vote) {
    const data = this.read();
    const newVote = {
      id: Math.random().toString(36).substring(2, 9),
      votedAt: new Date().toISOString(),
      ...vote
    };
    data.votes.push(newVote);
    this.write(data);
    return newVote;
  }

  getVotesByPollId(pollId) {
    const data = this.read();
    return data.votes.filter(v => v.pollId === pollId);
  }

  hasUserVoted(pollId, voterId) {
    const data = this.read();
    return data.votes.some(v => v.pollId === pollId && v.voterId === voterId);
  }

  // Calcular Resultados agregados de una encuesta
  getPollResults(pollId) {
    const poll = this.getPollById(pollId);
    if (!poll) return null;

    const votes = this.getVotesByPollId(pollId);
    
    // Contar los votos por opción
    const optionCounts = {};
    poll.options.forEach(opt => {
      optionCounts[opt.id] = 0;
    });

    votes.forEach(vote => {
      if (optionCounts[vote.optionId] !== undefined) {
        optionCounts[vote.optionId]++;
      }
    });

    const totalVotes = votes.length;

    const results = poll.options.map(opt => {
      const count = optionCounts[opt.id];
      const percentage = totalVotes > 0 ? Math.round((count / totalVotes) * 100) : 0;
      return {
        optionId: opt.id,
        text: opt.text,
        votes: count,
        percentage
      };
    });

    return {
      pollId: poll.id,
      title: poll.title,
      description: poll.description,
      totalVotes,
      results,
      settings: poll.settings
    };
  }
}

export const db = new Database();
