#!/usr/bin/env node

import { WebSocket } from 'ws';

const WS_URL = 'wss://7yrl08ar38.execute-api.us-east-1.amazonaws.com/prod';

console.log(`Conectando a: ${WS_URL}\n`);

const ws = new WebSocket(WS_URL);

ws.on('open', () => {
  console.log('✅ CONEXIÓN EXITOSA');
  console.log('WebSocket conectado correctamente\n');

  // Esperar 2 segundos y cerrar
  setTimeout(() => {
    console.log('Cerrando conexión...');
    ws.close();
  }, 2000);
});

ws.on('message', (data) => {
  console.log('📨 Mensaje recibido:', data.toString());
});

ws.on('error', (error) => {
  console.log('❌ ERROR:', error.message);
});

ws.on('close', () => {
  console.log('Conexión cerrada');
  process.exit(0);
});

// Timeout de seguridad
setTimeout(() => {
  console.log('⏱️  Timeout - Cerrando...');
  ws.close();
  process.exit(1);
}, 10000);
