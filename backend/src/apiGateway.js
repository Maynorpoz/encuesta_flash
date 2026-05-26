import express from 'express';
import cors from 'cors';
import http from 'http';
import dotenv from 'dotenv';
import { registerHandler, loginHandler, verifyAuthToken } from './functions/auth.js';
import { createPollHandler, getUserPollsHandler } from './functions/createPoll.js';
import { getPollHandler } from './functions/getPoll.js';
import { voteHandler } from './functions/vote.js';
import { getResultsHandler } from './functions/getResults.js';
import { setupWebSockets } from './functions/wsHandler.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Configurar CORS
app.use(cors({
  origin: '*', // Permitir cualquier origen en entorno de desarrollo/demostración
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

// Logger middleware para emular logs de CloudWatch/API Gateway
app.use((req, res, next) => {
  console.log(`[API GATEWAY] [${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// --- ENRUTAMIENTO DE API (Simula Rutas de API Gateway hacia AWS Lambda) ---

// Autenticación (Lambda Auth)
app.post('/api/auth/register', registerHandler);
app.post('/api/auth/login', loginHandler);

// Crear Encuestas (Lambda createPoll - Protegido)
app.post('/api/polls', verifyAuthToken, createPollHandler);
app.get('/api/polls/me', verifyAuthToken, getUserPollsHandler);

// Detalles de Encuesta (Lambda getPoll - Público)
app.get('/api/polls/:pollId', getPollHandler);

// Registrar Votos (Lambda vote - Público)
app.post('/api/polls/vote', voteHandler);

// Resultados (Lambda getResults - Público)
app.get('/api/polls/:pollId/results', getResultsHandler);

// Ruta de estado de API Gateway
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'ok', message: 'API Gateway Serverless Emulator Running' });
});

// Crear servidor HTTP para acoplar WebSockets
const server = http.createServer(app);

// Inicializar el servidor WebSocket
const wss = setupWebSockets(server);

// Manejar actualización de HTTP a WebSocket (Upgrade)
server.on('upgrade', (request, socket, head) => {
  const pathname = new URL(request.url, `http://${request.headers.host}`).pathname;

  if (pathname === '/ws') {
    wss.handleUpgrade(request, socket, head, (ws) => {
      wss.emit('connection', ws, request);
    });
  } else {
    socket.destroy();
  }
});

// Escuchar peticiones
server.listen(PORT, () => {
  console.log('===========================================================');
  console.log(`🚀 SERVIDOR EMULADOR SERVERLESS INICIADO`);
  console.log(`   API Gateway HTTP: http://localhost:${PORT}`);
  console.log(`   WebSocket Gateway: ws://localhost:${PORT}/ws`);
  console.log('===========================================================');
});
