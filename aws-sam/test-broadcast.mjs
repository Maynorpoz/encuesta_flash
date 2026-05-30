process.env.NODE_ENV = 'development';
process.env.DYNAMODB_TABLE = 'EncuestaFlashTable-development';
process.env.DYNAMODB_ENDPOINT = 'http://localhost:8000';
process.env.AWS_REGION = 'us-east-1';
process.env.AWS_ACCESS_KEY_ID = 'test';
process.env.AWS_SECRET_ACCESS_KEY = 'test';
process.env.WEBSOCKET_API_ID = 'test-api-id';

console.log('\n=== Test Broadcast Function - Validation ===\n');

let passedTests = 0;
let failedTests = 0;

console.log('Test 1: Importar broadcast.mjs');
try {
  const { handler: broadcastHandler } = await import('./functions/websocket/broadcast.mjs');
  if (typeof broadcastHandler === 'function') {
    console.log('✓ Test 1 PASADO - broadcast.mjs se importa correctamente');
    passedTests++;
  } else {
    console.log('✗ Test 1 FALLADO - handler no es una función');
    failedTests++;
  }
} catch (error) {
  console.log('✗ Test 1 FALLADO:', error.message);
  failedTests++;
}

console.log('\nTest 2: Verificar método getConnectionsByPollId en db');
try {
  const layerPath = './layers/shared-layer/nodejs/index.mjs';
  const { db } = await import(layerPath);
  if (db && typeof db.getConnectionsByPollId === 'function') {
    console.log('✓ Test 2 PASADO - Layer exporta db.getConnectionsByPollId');
    passedTests++;
  } else {
    console.log('✗ Test 2 FALLADO - db.getConnectionsByPollId no disponible');
    failedTests++;
  }
} catch (error) {
  console.log('✗ Test 2 FALLADO:', error.message);
  failedTests++;
}

console.log('\nTest 3: Simular evento DynamoDB Stream vacío');
try {
  const { handler: broadcastHandler } = await import('./functions/websocket/broadcast.mjs');

  const emptyEvent = {
    Records: []
  };

  const result = await broadcastHandler(emptyEvent);

  if (result.statusCode === 200) {
    console.log('✓ Test 3 PASADO - Maneja evento vacío correctamente');
    passedTests++;
  } else {
    console.log('✗ Test 3 FALLADO - statusCode inesperado:', result.statusCode);
    failedTests++;
  }
} catch (error) {
  console.log('✗ Test 3 FALLADO:', error.message);
  failedTests++;
}

console.log('\nTest 4: Simular evento de INSERT sin VOTE#');
try {
  const { handler: broadcastHandler } = await import('./functions/websocket/broadcast.mjs');

  const nonVoteEvent = {
    Records: [
      {
        eventName: 'INSERT',
        dynamodb: {
          NewImage: {
            PK: { S: 'USER#123' },
            SK: { S: 'METADATA' }
          }
        }
      }
    ]
  };

  const result = await broadcastHandler(nonVoteEvent);

  if (result.statusCode === 200) {
    console.log('✓ Test 4 PASADO - Ignora eventos que no son votos');
    passedTests++;
  } else {
    console.log('✗ Test 4 FALLADO - statusCode inesperado:', result.statusCode);
    failedTests++;
  }
} catch (error) {
  console.log('✗ Test 4 FALLADO:', error.message);
  failedTests++;
}

console.log('\n=== Resumen ===');
console.log(`Tests pasados: ${passedTests}/4`);
console.log(`Tests fallados: ${failedTests}/4`);

if (failedTests === 0) {
  console.log('\nFunción broadcast correctamente implementada');
  process.exit(0);
} else {
  console.log('\nAlgunos tests fallaron');
  process.exit(1);
}
