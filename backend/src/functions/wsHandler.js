import { WebSocketServer } from 'ws';
import { db } from '../services/db.js';

// Mapa para guardar las conexiones activas por pollId: pollId -> Set de WebSocket clients
const subscriptions = new Map();

export function setupWebSockets(server) {
  const wss = new WebSocketServer({ noServer: true });

  wss.on('connection', (ws) => {
    console.log('Nueva conexión WebSocket establecida');
    
    // Objeto de suscripción temporal para este socket
    let currentPollId = null;

    ws.on('message', (message) => {
      try {
        const parsed = JSON.parse(message);
        console.log('Mensaje WS recibido:', parsed);

        switch (parsed.type) {
          case 'subscribe':
            // Suscribirse a actualizaciones de un pollId
            const pollId = parsed.pollId;
            if (!pollId) return;

            // Limpiar suscripción previa si existe
            if (currentPollId && subscriptions.has(currentPollId)) {
              subscriptions.get(currentPollId).delete(ws);
            }

            currentPollId = pollId;
            if (!subscriptions.has(pollId)) {
              subscriptions.set(pollId, new Set());
            }
            subscriptions.get(pollId).add(ws);
            console.log(`Cliente suscrito a la encuesta: ${pollId}`);

            // Enviar inmediatamente los resultados actuales al suscribirse
            const currentResults = db.getPollResults(pollId);
            if (currentResults) {
              ws.send(JSON.stringify({
                type: 'results_update',
                data: currentResults
              }));
            }
            break;

          case 'ping':
            ws.send(JSON.stringify({ type: 'pong' }));
            break;

          default:
            console.warn('Tipo de mensaje no reconocido:', parsed.type);
        }
      } catch (err) {
        console.error('Error procesando mensaje WebSocket:', err);
      }
    });

    ws.on('close', () => {
      console.log('Conexión WebSocket cerrada');
      if (currentPollId && subscriptions.has(currentPollId)) {
        subscriptions.get(currentPollId).delete(ws);
        if (subscriptions.get(currentPollId).size === 0) {
          subscriptions.delete(currentPollId);
        }
      }
    });
  });

  return wss;
}

// Función que actúa como el despachador de eventos (Simula Lambda DynamoDB Stream Trigger)
// Se llama después de que un voto es exitoso para notificar a los suscriptores en tiempo real
export function broadcastResultsUpdate(pollId) {
  console.log(`Buscando suscriptores para la encuesta: ${pollId}`);
  const clients = subscriptions.get(pollId);
  
  if (!clients || clients.size === 0) {
    console.log('No hay suscriptores activos para esta encuesta.');
    return;
  }

  // Obtener los resultados actualizados de la base de datos
  const updatedResults = db.getPollResults(pollId);
  if (!updatedResults) return;

  const payload = JSON.stringify({
    type: 'results_update',
    data: updatedResults
  });

  let activeClientsCount = 0;
  clients.forEach((client) => {
    if (client.readyState === 1) { // WebSocket.OPEN
      client.send(payload);
      activeClientsCount++;
    }
  });

  console.log(`Resultados actualizados enviados a ${activeClientsCount} cliente(s) para la encuesta: ${pollId}`);
}
