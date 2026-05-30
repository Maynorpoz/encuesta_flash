process.env.NODE_ENV = 'development';
process.env.DYNAMODB_TABLE = 'EncuestaFlashTable-development';
process.env.DYNAMODB_ENDPOINT = 'http://localhost:8000';
process.env.AWS_REGION = 'us-east-1';
process.env.AWS_ACCESS_KEY_ID = 'test';
process.env.AWS_SECRET_ACCESS_KEY = 'test';

console.log('\n=== Test WebSocket Functions - Validation ===\n');

let passedTests = 0;
let failedTests = 0;

console.log('Test 1: Importar connect.mjs');
try {
  const { handler: connectHandler } = await import('./functions/websocket/connect.mjs');
  if (typeof connectHandler === 'function') {
    console.log('✓ Test 1 PASADO - connect.mjs se importa correctamente');
    passedTests++;
  } else {
    console.log('✗ Test 1 FALLADO - handler no es una función');
    failedTests++;
  }
} catch (error) {
  console.log('✗ Test 1 FALLADO:', error.message);
  failedTests++;
}

console.log('\nTest 2: Importar disconnect.mjs');
try {
  const { handler: disconnectHandler } = await import('./functions/websocket/disconnect.mjs');
  if (typeof disconnectHandler === 'function') {
    console.log('✓ Test 2 PASADO - disconnect.mjs se importa correctamente');
    passedTests++;
  } else {
    console.log('✗ Test 2 FALLADO - handler no es una función');
    failedTests++;
  }
} catch (error) {
  console.log('✗ Test 2 FALLADO:', error.message);
  failedTests++;
}

console.log('\nTest 3: Importar default.mjs');
try {
  const { handler: defaultHandler } = await import('./functions/websocket/default.mjs');
  if (typeof defaultHandler === 'function') {
    console.log('✓ Test 3 PASADO - default.mjs se importa correctamente');
    passedTests++;
  } else {
    console.log('✗ Test 3 FALLADO - handler no es una función');
    failedTests++;
  }
} catch (error) {
  console.log('✗ Test 3 FALLADO:', error.message);
  failedTests++;
}

console.log('\nTest 4: Verificar acceso a db desde layer');
try {
  const layerPath = './layers/shared-layer/nodejs/index.mjs';
  const { db } = await import(layerPath);
  if (db && typeof db.addConnection === 'function') {
    console.log('✓ Test 4 PASADO - Layer exporta db.addConnection');
    passedTests++;
  } else {
    console.log('✗ Test 4 FALLADO - db.addConnection no disponible');
    failedTests++;
  }
} catch (error) {
  console.log('✗ Test 4 FALLADO:', error.message);
  failedTests++;
}

console.log('\nTest 5: Verificar método updateConnectionPoll en db');
try {
  const layerPath = './layers/shared-layer/nodejs/index.mjs';
  const { db } = await import(layerPath);
  if (db && typeof db.updateConnectionPoll === 'function') {
    console.log('✓ Test 5 PASADO - Layer exporta db.updateConnectionPoll');
    passedTests++;
  } else {
    console.log('✗ Test 5 FALLADO - db.updateConnectionPoll no disponible');
    failedTests++;
  }
} catch (error) {
  console.log('✗ Test 5 FALLADO:', error.message);
  failedTests++;
}

console.log('\nTest 6: Verificar método removeConnection en db');
try {
  const layerPath = './layers/shared-layer/nodejs/index.mjs';
  const { db } = await import(layerPath);
  if (db && typeof db.removeConnection === 'function') {
    console.log('✓ Test 6 PASADO - Layer exporta db.removeConnection');
    passedTests++;
  } else {
    console.log('✗ Test 6 FALLADO - db.removeConnection no disponible');
    failedTests++;
  }
} catch (error) {
  console.log('✗ Test 6 FALLADO:', error.message);
  failedTests++;
}

console.log('\n=== Resumen ===');
console.log(`Tests pasados: ${passedTests}/6`);
console.log(`Tests fallados: ${failedTests}/6`);

if (failedTests === 0) {
  console.log('\nTodas las funciones WebSocket están correctamente implementadas');
  process.exit(0);
} else {
  console.log('\nAlgunos tests fallaron');
  process.exit(1);
}
